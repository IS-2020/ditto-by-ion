import { runCloneJob } from "@cloner/core";
import { createApp } from "./app.js";
import { InMemoryStore } from "./store.js";
import { InMemoryBackend } from "./backends/inMemory.js";
import { assertPublicUrl } from "./ssrf.js";
import { loadEnv } from "./env.js";

/** Shared app factory for Node server and Vercel serverless. */
export function createBootstrapApp() {
  const env = loadEnv();
  const store = new InMemoryStore(env.cloneTtlMs);
  store.startSweeper();
  const backend = new InMemoryBackend({
    store,
    runJob: runCloneJob,
    captureCacheDir: env.captureCacheDir || undefined,
  });
  const app = createApp({
    backend,
    baseUrl: env.publicBaseUrl,
    mcp: false,
    assertUrl: env.ssrfEnabled
      ? async (url) => void (await assertPublicUrl(url, { allowLoopback: env.ssrfAllowLoopback }))
      : undefined,
    captureCacheDir: env.captureCacheDir || undefined,
  });
  return { app, backend, env };
}
