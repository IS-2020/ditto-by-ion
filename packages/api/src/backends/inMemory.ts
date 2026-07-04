import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { resolveCloneMode, verifyCloneJobResult, type CloneJobResult, type CloneOptions, type RunCloneJobInput } from "@cloner/core";
import { makeTarGz, makeZip, sha256hex } from "@cloner/storage";
import { InMemoryStore } from "../store.js";
import { buildRestResult, buildRestSummary, contentTypeFor } from "../rest.js";
import { listWipFiles as listWipFilesFromRun, readWipFile as readWipFileFromRun } from "../wipFiles.js";
import type { Backend, BundleFormat, CloneBundle, FileFacet, JobView, ResultOutcome, SubmitOutcome } from "../backend.js";

export type RunJob = (input: RunCloneJobInput) => Promise<CloneJobResult>;

type QueueItem = {
  url: string;
  options: CloneOptions | undefined;
  resolve: (out: SubmitOutcome) => void;
  reject: (e: unknown) => void;
};

/** In-memory backend with a FIFO clone queue (homepage first, expansion jobs after). */
export class InMemoryBackend implements Backend {
  constructor(private deps: { store: InMemoryStore; runJob: RunJob; makeTempBase?: () => string; captureCacheDir?: string }) {}

  private activeClones = 0;
  private queue: QueueItem[] = [];

  private makeBase(): string {
    return (this.deps.makeTempBase ?? (() => mkdtempSync(join(tmpdir(), "api-clone-"))))();
  }

  async submit(url: string, options: CloneOptions | undefined): Promise<SubmitOutcome> {
    if (this.activeClones > 0 || this.deps.store.list().some((j) => j.status === "running")) {
      return new Promise<SubmitOutcome>((resolve, reject) => {
        this.queue.push({ url, options, resolve, reject });
      });
    }
    return this.startJob(url, options);
  }

  private async drainQueue(): Promise<void> {
    if (this.activeClones > 0 || this.queue.length === 0) return;
    const next = this.queue.shift()!;
    try {
      next.resolve(await this.startJob(next.url, next.options));
    } catch (e) {
      next.reject(e);
    }
  }

  private async startJob(url: string, options: CloneOptions | undefined): Promise<SubmitOutcome> {
    const id = randomUUID();
    const base = this.makeBase();
    const events: Array<Record<string, unknown>> = [];
    const kind: "clone" | "clone_site" = resolveCloneMode(options) === "multi" ? "clone_site" : "clone";
    const rec = { id, status: "running" as const, url, kind, options: options ?? {}, createdAt: Date.now(), base, events };
    this.deps.store.put(rec);
    void this.runInBackground(id, url, options, rec, base, events, kind);
    return { jobId: id, status: "queued", httpStatus: 202 };
  }

  private async runInBackground(
    id: string,
    url: string,
    options: CloneOptions | undefined,
    rec: { id: string; status: "running"; url: string; kind: "clone" | "clone_site"; options: CloneOptions; createdAt: number; base: string; events: Array<Record<string, unknown>> },
    base: string,
    events: Array<Record<string, unknown>>,
    kind: "clone" | "clone_site",
  ): Promise<void> {
    this.activeClones++;
    const log = (e: Record<string, unknown>) => {
      events.push({ t: Date.now(), ...e });
      this.deps.store.put({ ...rec, events: [...events] });
    };
    try {
      const result = await this.deps.runJob({ url, options, runsDir: base, captureCacheDir: this.deps.captureCacheDir, log });
      log({ event: "clone_done" });
      this.deps.store.put({ id, status: "succeeded", url, kind: result.kind, options: result.options, createdAt: rec.createdAt, result, base, events });
      if (result.options.asyncVerify) {
        void verifyCloneJobResult(result, {
          validationConcurrency: result.options.validationConcurrency,
          viewportConcurrency: result.options.viewportConcurrency,
        }).then((done) => {
          result.verify = done.verify;
          result.timings = { ...result.timings, verifyMs: done.verifyMs };
        }).catch((e) => {
          result.verify = { error: String(e).slice(0, 500), async: true };
        });
      }
    } catch (e) {
      try {
        rmSync(base, { recursive: true, force: true });
      } catch {
        /* best effort */
      }
      log({ event: "clone_error", error: String(e).slice(0, 300) });
      this.deps.store.put({ id, status: "failed", url, kind, options: options ?? {}, createdAt: rec.createdAt, error: String(e), events });
    } finally {
      this.activeClones = Math.max(0, this.activeClones - 1);
      void this.drainQueue();
    }
  }

  private runDir(jobId: string): string | null {
    const rec = this.deps.store.get(jobId);
    return rec?.result?.runDir ?? rec?.base ?? null;
  }

  async events(jobId: string, after = 0): Promise<Array<Record<string, unknown>> | null> {
    const rec = this.deps.store.get(jobId);
    if (!rec) return null;
    const all = rec.events ?? [];
    return after > 0 ? all.slice(after) : all;
  }

  async status(jobId: string): Promise<JobView | null> {
    const rec = this.deps.store.get(jobId);
    if (!rec) return null;
    if (rec.status === "succeeded" && rec.result) return { ...buildRestSummary(jobId, rec.result), verify: rec.result.verify };
    return { jobId, url: rec.url, kind: rec.kind, status: rec.status, options: rec.options, error: rec.error };
  }

  async result(jobId: string): Promise<ResultOutcome | null> {
    const rec = this.deps.store.get(jobId);
    if (!rec) return null;
    if (rec.status === "succeeded" && rec.result) return { ready: true, result: buildRestResult(jobId, rec.result, `/v1/clones/${jobId}/files`) };
    return { ready: false, status: rec.status, error: rec.error };
  }

  async file(jobId: string, path: string): Promise<{ bytes: Buffer; contentType: string } | null> {
    const rec = this.deps.store.get(jobId);
    if (!rec?.result) return null;
    const entry = rec.result.files[path];
    if (!entry) return null;
    return { bytes: readFileSync(entry.absPath), contentType: contentTypeFor(path) };
  }

  async runArtifact(jobId: string, relPath: string): Promise<{ bytes: Buffer; contentType: string } | null> {
    const runDir = this.runDir(jobId);
    if (!runDir) return null;
    const abs = join(runDir, relPath);
    if (!existsSync(abs)) return null;
    return { bytes: readFileSync(abs), contentType: contentTypeFor(relPath) };
  }

  async listWipFiles(jobId: string): Promise<string[] | null> {
    const runDir = this.runDir(jobId);
    if (!runDir) return null;
    return listWipFilesFromRun(runDir);
  }

  async readWipFile(jobId: string, path: string): Promise<{ kind: "text" | "binary"; content?: string; bytes: number } | null> {
    const runDir = this.runDir(jobId);
    if (!runDir) return null;
    const f = readWipFileFromRun(runDir, path);
    if (!f) return null;
    return f.kind === "text" ? { kind: "text", content: f.text, bytes: f.bytes.length } : { kind: "binary", bytes: f.bytes.length };
  }

  async list(): Promise<JobView[]> {
    return this.deps.store.list().map((rec) =>
      rec.status === "succeeded" && rec.result
        ? buildRestSummary(rec.id, rec.result)
        : { jobId: rec.id, url: rec.url, kind: rec.kind, status: rec.status, options: rec.options, error: rec.error },
    );
  }

  async remove(jobId: string): Promise<boolean> {
    return this.deps.store.remove(jobId);
  }

  async facets(jobId: string): Promise<FileFacet[] | null> {
    const rec = this.deps.store.get(jobId);
    if (!rec?.result) return null;
    return Object.entries(rec.result.files).map(([path, f]) =>
      f.kind === "text"
        ? { path, kind: "text", bytes: f.bytes, sha256: f.sha256, content: f.content ?? "" }
        : { path, kind: "binary", bytes: f.bytes, sha256: f.sha256, binaryUrl: async () => `/v1/clones/${jobId}/files/${path}` },
    );
  }

  async bundle(jobId: string, format: BundleFormat = "tgz"): Promise<CloneBundle | null> {
    const rec = this.deps.store.get(jobId);
    if (!rec?.result) return null;
    const entries = Object.entries(rec.result.files).map(([path, f]) => ({ path, bytes: readFileSync(f.absPath) }));
    const bytes = format === "zip" ? makeZip(entries) : makeTarGz(entries);
    return { bytes, sha256: sha256hex(bytes), format };
  }
}
