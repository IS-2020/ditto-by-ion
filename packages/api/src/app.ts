import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { Hono, type Context, type MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { RESPONSE_ALREADY_SENT } from "@hono/node-server/utils/response";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import { normalizeCloneRequestOptions, checkCaptureCache, runSiteScan } from "@cloner/core";
import type { Backend } from "./backend.js";
import { createMcpServer } from "./mcp.js";
import { apiKeyAuth, hashApiKey, rateLimit, type AuthConfig } from "./auth.js";
import { STUDIO_HTML } from "./ui.js";
import { WIZARD_HTML } from "./wizard.js";
import { SHELL_HTML } from "./shell.js";
import { loadPatternsPayload } from "./patterns.js";
import { isHtmlLike, previewErrorHtml, rewritePreviewHtml } from "./previewServe.js";
import { buildBehaviorAudit } from "./behaviorAudit.js";

const OptionsSchema = z
  .object({
    mode: z.enum(["single", "multi"]).optional(),
    styling: z.enum(["tailwind", "css"]).optional(),
    framework: z.enum(["next", "vite"]).optional(),
    preview: z.boolean().optional(),
    verify: z.boolean().optional(),
    asyncVerify: z.boolean().optional(),
    maxRoutes: z.number().int().positive().optional(),
    selectedRoutes: z.array(z.string().min(1)).optional(),
    maxCollection: z.number().int().positive().optional(),
    captureConcurrency: z.number().int().positive().optional(),
    validationConcurrency: z.number().int().positive().optional(),
    viewportConcurrency: z.number().int().positive().optional(),

    // Deprecated compatibility aliases and dev-only escape hatches.
    multiPage: z.boolean().optional(),
    humanizeMode: z.enum(["tailwind", "css"]).optional(),
    viewports: z.array(z.number().int().positive()).min(1).optional(),
    interactions: z.boolean().optional(),
    components: z.boolean().optional(),
    motion: z.boolean().optional(),
    noCache: z.boolean().optional(),
    qualityTier: z.enum(["production", "dev", "draft"]).optional(),
  })
  .strict();

const ScanRequest = z.object({
  url: z.string().url(),
  maxRoutes: z.number().int().positive().max(50).optional(),
});

const CloneRequest = z.object({
  url: z.string().url(),
  options: OptionsSchema.optional(),
});

const SignupRequest = z
  .object({
    email: z.string().email().max(320).transform((s) => s.trim().toLowerCase()),
    label: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

const SignupVerifyRequest = z
  .object({
    token: z.string().min(24).max(256),
  })
  .strict();

export type SignupDeps = {
  createApiKey: (input: { keyHash: string; label: string; rateLimit?: number }) => Promise<void>;
  defaultRateLimit?: number;
  rateLimitPerHour?: number;
  directEnabled?: boolean;
  email?: {
    createToken: (input: { email: string; tokenHash: string; expiresAt: Date }) => Promise<void>;
    consumeToken: (tokenHash: string) => Promise<{ email: string } | undefined>;
    sendVerificationEmail: (input: { email: string; verifyUrl: string; expiresAt: Date }) => Promise<void>;
    verifyUrl: string;
    tokenTtlMs: number;
  };
};

export type AppDeps = {
  backend: Backend;
  /** absolute base URL used in MCP-returned references (binary/bundle URLs). */
  baseUrl?: string;
  /** mount the MCP Streamable-HTTP endpoint at /mcp (default true). */
  mcp?: boolean;
  /** require an API key on /v1/* and /mcp (omit = open). */
  auth?: AuthConfig;
  /** per-window request cap on /v1/* and /mcp (omit = unlimited). */
  rateLimitPerMinute?: number;
  /** public key minting endpoint at POST /v1/signup (omit = disabled). */
  signup?: SignupDeps;
  /** browser origins allowed to call public signup routes. */
  signupCorsOrigins?: string[];
  /** SSRF guard run on submit (omit = no check — set in production). Throws to reject. */
  assertUrl?: (url: string) => Promise<void>;
  /** Entry capture cache directory (for /v1/cache/check). */
  captureCacheDir?: string;
};

/** Build the Hono app over a Backend. The in-memory backend (M1) runs clones inline
 *  (POST → 200 + file map); the DB backend (M2) enqueues (POST → 202) and the worker
 *  fills the result (poll via GET). The HTTP surface is identical either way. */
export function createApp(deps: AppDeps): Hono {
  const { backend } = deps;
  const app = new Hono();
  const signupCorsOrigins = deps.signupCorsOrigins ?? [];

  if (signupCorsOrigins.length > 0) {
    const allowedOrigins = new Set(signupCorsOrigins);
    const signupCors = cors({
      origin: (origin) => (allowedOrigins.has(origin) ? origin : null),
      allowMethods: ["POST", "OPTIONS"],
      allowHeaders: ["content-type"],
      maxAge: 86400,
    });
    app.use("/v1/signup", signupCors);
    app.use("/v1/signup/*", signupCors);
  }

  app.get("/healthz", (c) => c.json({ ok: true }));

  app.get("/v1/patterns", (c) => c.json(loadPatternsPayload()));

  app.get("/v1/cache/check", (c) => {
    const url = c.req.query("url");
    if (!url) return c.json({ error: "url query required" }, 400);
    try {
      new URL(url);
    } catch {
      return c.json({ error: "invalid url" }, 400);
    }
    return c.json(checkCaptureCache(deps.captureCacheDir, url));
  });

  app.post("/v1/scan", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = ScanRequest.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "invalid request", details: parsed.error.flatten() }, 400);
    }
    const { url, maxRoutes } = parsed.data;
    if (!/^https?:\/\//i.test(url)) {
      return c.json({ error: "url must be http(s)" }, 400);
    }
    if (deps.assertUrl) {
      try {
        await deps.assertUrl(url);
      } catch (e) {
        return c.json({ error: "url not allowed", reason: String((e as Error).message ?? e) }, 400);
      }
    }
    try {
      const scan = await runSiteScan(url, { maxRoutes: maxRoutes ?? 20 });
      return c.json(scan, 200);
    } catch (e) {
      return c.json({ error: String(e).slice(0, 500) }, 500);
    }
  });

  /** Standalone pattern catalog page (same data as the in-app tab). */
  app.get("/patterns", (c) => c.redirect("/", 302));

  // Minimal dev/test UI (self-contained; talks to the same-origin /v1 API). The
  // API surface itself stays the product — this page is a testing convenience.
  app.get("/", (c) => c.html(SHELL_HTML));
  app.get("/wizard", (c) => c.html(WIZARD_HTML));
  app.get("/studio", (c) => c.html(STUDIO_HTML));

  if (deps.signup) {
    const signup = deps.signup;
    const signupRateLimit = signup.rateLimitPerHour ?? 3;
    const signupLimiter = rateLimit({ perMinute: signupRateLimit, windowMs: 60 * 60 * 1000 });
    const mintKey = async (email: string, label?: string) => {
      const apiKey = `dtto_live_${randomBytes(32).toString("base64url")}`;
      const storedLabel = label ? `${email} (${label})` : email;
      await signup.createApiKey({
        keyHash: hashApiKey(apiKey),
        label: storedLabel,
        rateLimit: signup.defaultRateLimit,
      });
      return apiKey;
    };

    const directSignupHandler = async (c: Context) => {
      const body = await c.req.json().catch(() => null);
      const parsed = SignupRequest.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: "invalid request", details: parsed.error.flatten() }, 400);
      }
      const apiKey = await mintKey(parsed.data.email, parsed.data.label);
      return c.json(
        {
          apiKey,
          message: "Save this key now; it will not be shown again.",
        },
        201,
      );
    };

    if (signup.directEnabled !== false) {
      if (signupRateLimit > 0) app.post("/v1/signup", signupLimiter, directSignupHandler);
      else app.post("/v1/signup", directSignupHandler);
    }

    const emailSignup = signup.email;
    if (emailSignup) {
      const requestSignupHandler = async (c: Context) => {
        const body = await c.req.json().catch(() => null);
        const parsed = SignupRequest.safeParse(body);
        if (!parsed.success) {
          return c.json({ error: "invalid request", details: parsed.error.flatten() }, 400);
        }
        const rawToken = `dtto_signup_${randomBytes(32).toString("base64url")}`;
        const expiresAt = new Date(Date.now() + emailSignup.tokenTtlMs);
        const url = new URL(emailSignup.verifyUrl);
        url.searchParams.set("token", rawToken);
        await emailSignup.createToken({
          email: parsed.data.email,
          tokenHash: hashApiKey(rawToken),
          expiresAt,
        });
        await emailSignup.sendVerificationEmail({
          email: parsed.data.email,
          verifyUrl: url.toString(),
          expiresAt,
        });
        return c.json({ message: "Check your email for a verification link." }, 202);
      };

      const verifySignupHandler = async (c: Context) => {
        const body = await c.req.json().catch(() => null);
        const parsed = SignupVerifyRequest.safeParse(body);
        if (!parsed.success) {
          return c.json({ error: "invalid request", details: parsed.error.flatten() }, 400);
        }
        const token = await emailSignup.consumeToken(hashApiKey(parsed.data.token));
        if (!token) {
          return c.json({ error: "invalid or expired signup token" }, 400);
        }
        const apiKey = await mintKey(token.email);
        return c.json(
          {
            apiKey,
            message: "Save this key now; it will not be shown again.",
          },
          201,
        );
      };

      if (signupRateLimit > 0) app.post("/v1/signup/request", signupLimiter, requestSignupHandler);
      else app.post("/v1/signup/request", requestSignupHandler);
      app.post("/v1/signup/verify", verifySignupHandler);
    }
  }

  const skipSignup = (mw: MiddlewareHandler): MiddlewareHandler => {
    return async (c, next) => {
      if (c.req.path === "/v1/signup" || c.req.path === "/v1/signup/request" || c.req.path === "/v1/signup/verify") return next();
      return mw(c, next);
    };
  };

  // Protect the clone API + MCP surfaces (not /healthz or /v1/signup). Auth
  // before rate-limit so the limiter can key by API key.
  if (deps.auth) {
    const mw = apiKeyAuth(deps.auth);
    app.use("/v1/*", skipSignup(mw));
    app.use("/mcp", mw);
  }
  if (deps.rateLimitPerMinute && deps.rateLimitPerMinute > 0) {
    const mw = rateLimit({ perMinute: deps.rateLimitPerMinute });
    app.use("/v1/*", skipSignup(mw));
    app.use("/mcp", mw);
  }

  app.post("/v1/clones", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = CloneRequest.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "invalid request", details: parsed.error.flatten() }, 400);
    }
    const { url, options } = parsed.data;
    if (!/^https?:\/\//i.test(url)) {
      return c.json({ error: "url must be http(s)" }, 400);
    }
    // SSRF guard (production): block private/link-local/metadata targets.
    if (deps.assertUrl) {
      try {
        await deps.assertUrl(url);
      } catch (e) {
        return c.json({ error: "url not allowed", reason: String((e as Error).message ?? e) }, 400);
      }
    }
    // Header alias for the per-request cache bypass.
    const noCacheHeader = (c.req.header("cache-control") ?? "").toLowerCase().includes("no-cache");
    const normalizedOptions = normalizeCloneRequestOptions(options ?? {});
    const opts = noCacheHeader ? { ...normalizedOptions, noCache: true } : normalizedOptions;

    try {
      const out = await backend.submit(url, opts);
      if (out.status === "queued") return c.json({ jobId: out.jobId, status: "queued" }, out.httpStatus);
      return c.json(out.result, 200);
    } catch (e) {
      const msg = String(e);
      if (msg.startsWith("BUSY:")) return c.json({ error: msg.slice(5).trim() }, 429);
      return c.json({ status: "failed", error: msg.slice(0, 500) }, 500);
    }
  });

  app.get("/v1/clones", async (c) => {
    return c.json({ clones: await backend.list() });
  });

  app.get("/v1/clones/:id", async (c) => {
    const view = await backend.status(c.req.param("id"));
    if (!view) return c.json({ error: "not found" }, 404);
    return c.json(view, 200);
  });

  app.get("/v1/clones/:id/result", async (c) => {
    const out = await backend.result(c.req.param("id"));
    if (!out) return c.json({ error: "not found" }, 404);
    if (!out.ready) return c.json({ jobId: c.req.param("id"), status: out.status, error: out.error }, 409);
    return c.json(out.result, 200);
  });

  app.get("/v1/clones/:id/bundle", async (c) => {
    const fmt = c.req.query("format") === "zip" ? "zip" : "tgz";
    const b = await backend.bundle(c.req.param("id"), fmt);
    if (!b) return c.json({ error: "not found or not ready" }, 404);
    if (b.url) return c.redirect(b.url, 302); // S3: hand off to the presigned URL
    c.header("content-type", fmt === "zip" ? "application/zip" : "application/gzip");
    c.header("content-disposition", `attachment; filename="clone-${c.req.param("id")}.${fmt}"`);
    c.header("content-length", String(b.bytes.length));
    c.header("x-content-sha256", b.sha256);
    return c.body(b.bytes);
  });

  app.get("/v1/clones/:id/files/:path{.+}", async (c) => {
    const file = await backend.file(c.req.param("id"), c.req.param("path"));
    if (!file) return c.json({ error: "file not found" }, 404);
    c.header("content-type", file.contentType);
    c.header("content-length", String(file.bytes.length));
    return c.body(file.bytes);
  });

  // Pipeline progress events (poll every ~300ms while a clone runs).
  app.get("/v1/clones/:id/events", async (c) => {
    const after = Math.max(0, Number(c.req.query("after") ?? "0") || 0);
    const events = backend.events ? await backend.events(c.req.param("id"), after) : null;
    if (!events) return c.json({ error: "not found" }, 404);
    return c.json({ jobId: c.req.param("id"), events });
  });

  // Browsable preview of the built clone (static export published by the preview
  // build under public/app-preview/). References are relative, so the export works
  // from this mount — the only requirement is a trailing slash on the root.
  const servePreviewBytes = (c: Context, file: { bytes: Buffer; contentType: string }, mountBase: string, relPath: string) => {
    if (isHtmlLike(relPath) || file.contentType.includes("html")) {
      const html = rewritePreviewHtml(file.bytes.toString("utf8"), mountBase);
      c.header("content-type", "text/html; charset=utf-8");
      return c.body(html);
    }
    c.header("content-type", file.contentType);
    c.header("content-length", String(file.bytes.length));
    return c.body(file.bytes);
  };

  const previewNotReady = (c: Context, title: string, detail: string, status: 404 | 503 = 404) => {
    c.header("content-type", "text/html; charset=utf-8");
    return c.body(previewErrorHtml(title, detail), status);
  };

  const previewFile = async (c: Context, sub: string) => {
    const id = c.req.param("id") ?? "";
    const mountBase = `/v1/clones/${id}/app-preview/`;
    const tryPaths = sub.includes(".")
      ? [`public/app-preview/${sub}`]
      : [
          `public/app-preview/${sub}`.replace(/\/$/, "") + "/index.html",
          `public/app-preview/${sub}`,
          `public/app-preview/${sub}.html`,
        ];
    for (const p of tryPaths) {
      let file = await backend.file(id, p);
      if (!file && backend.runArtifact) {
        file = await backend.runArtifact(id, join("generated", "app", p));
      }
      if (file) return servePreviewBytes(c, file, mountBase, p);
    }
    return previewNotReady(
      c,
      "App preview not ready",
      "The Next.js export is still building or was skipped. Try the static mirror preview, or wait for the build to finish.",
    );
  };
  /** Early WIP preview from the static HTML mirror (available right after generate, before npm build). */
  const mirrorPreviewFile = async (c: Context, sub: string) => {
    const id = c.req.param("id") ?? "";
    if (!backend.runArtifact) {
      return previewNotReady(c, "Preview unavailable", "This server does not support live mirror previews.", 503);
    }
    const mountBase = `/v1/clones/${id}/mirror-preview/`;
    const tryPaths = sub.includes(".")
      ? [
          `generated/app/public/static/${sub}`,
          `generated/app/public/${sub}`,
          `generated/app/public/app-preview/${sub}`,
        ]
      : [
          `generated/app/public/static/${sub}`.replace(/\/$/, "") + "/index.html",
          `generated/app/public/app-preview/${sub}`.replace(/\/$/, "") + "/index.html",
          `generated/app/public/static/index.html`,
        ];
    for (const p of tryPaths) {
      const file = await backend.runArtifact(id, p);
      if (file) return servePreviewBytes(c, file, mountBase, p);
    }
    return previewNotReady(
      c,
      "Mirror preview not ready",
      "Static HTML mirror is not available yet — capture and generate may still be running.",
    );
  };
  app.get("/v1/clones/:id/app-preview", (c) => c.redirect(`/v1/clones/${c.req.param("id")}/app-preview/`, 302));
  app.get("/v1/clones/:id/app-preview/", (c) => previewFile(c, "index.html"));
  app.get("/v1/clones/:id/app-preview/:path{.+}", (c) => previewFile(c, c.req.param("path") ?? ""));
  app.get("/v1/clones/:id/mirror-preview", (c) => c.redirect(`/v1/clones/${c.req.param("id")}/mirror-preview/`, 302));
  app.get("/v1/clones/:id/mirror-preview/", (c) => mirrorPreviewFile(c, "index.html"));
  app.get("/v1/clones/:id/mirror-preview/:path{.+}", (c) => mirrorPreviewFile(c, c.req.param("path") ?? ""));

  /** Pixel audit artifacts: source / clone / diff PNGs from the compiler run dir. */
  const auditKinds = new Set(["source", "clone", "diff"]);
  app.get("/v1/clones/:id/audit/:viewport/:kind.png", async (c) => {
    const kind = c.req.param("kind") ?? "";
    const vp = c.req.param("viewport") ?? "";
    if (!auditKinds.has(kind) || !/^\d+$/.test(vp)) return c.json({ error: "invalid audit path" }, 400);
    const rel =
      kind === "source"
        ? `source/screenshots/${vp}.png`
        : kind === "clone"
          ? `rendered/screenshots/${vp}.png`
          : `validation/diff/${vp}.png`;
    const file = backend.runArtifact ? await backend.runArtifact(c.req.param("id"), rel) : null;
    if (!file) return c.json({ error: "audit image not found (run with verify enabled)" }, 404);
    c.header("content-type", "image/png");
    c.header("content-length", String(file.bytes.length));
    return c.body(file.bytes);
  });

  app.get("/v1/clones/:id/audit", async (c) => {
    const view = await backend.status(c.req.param("id"));
    if (!view) return c.json({ error: "not found" }, 404);
    const verify = view.verify as {
      scorecard?: { total?: number };
      status?: string;
      stage2Pass?: boolean;
      gates?: Record<string, { pass?: boolean; metrics?: Record<string, unknown>; issues?: string[] }>;
    } | undefined;
    const perceptual = verify?.gates?.perceptual;
    const visual = verify?.gates?.visual_audit;
    const perVp = (perceptual?.metrics?.perViewport ?? visual?.metrics?.perViewport ?? {}) as Record<string, number>;
    const viewports = Object.keys(perVp).map(Number).sort((a, b) => a - b);
    const base = `/v1/clones/${c.req.param("id")}/audit`;
    const comparisons = viewports.map((vp) => ({
      viewport: vp,
      diffPct: perVp[vp] ?? perVp[String(vp)],
      sourceUrl: `${base}/${vp}/source.png`,
      cloneUrl: `${base}/${vp}/clone.png`,
      diffUrl: `${base}/${vp}/diff.png`,
    }));

    let captureMeta: { hover?: number; focus?: number; candidates?: number; motion?: boolean } | undefined;
    let patternIds: string[] | undefined;
    const jobId = c.req.param("id");
    if (backend.runArtifact) {
      const interFile = await backend.runArtifact(jobId, "interaction.json");
      if (interFile) {
        try {
          const inter = JSON.parse(interFile.bytes.toString("utf8")) as {
            hover?: Record<string, unknown>;
            focus?: Record<string, unknown>;
            hoverDesc?: Record<string, unknown>;
            candidates?: number;
          };
          captureMeta = {
            hover: Object.keys(inter.hover ?? {}).length + Object.keys(inter.hoverDesc ?? {}).length,
            focus: Object.keys(inter.focus ?? {}).length,
            candidates: inter.candidates,
          };
        } catch { /* optional */ }
      }
      const capFile = await backend.runArtifact(jobId, "capture/capture-result.json");
      if (capFile) {
        try {
          const cap = JSON.parse(capFile.bytes.toString("utf8")) as { motion?: boolean; interaction?: boolean };
          captureMeta = { ...captureMeta, motion: !!cap.motion };
        } catch { /* optional */ }
      }
      const patFile = await backend.runArtifact(jobId, "generated/patterns.json");
      if (patFile) {
        try {
          const pj = JSON.parse(patFile.bytes.toString("utf8")) as { matches?: Array<{ id: string }> };
          patternIds = pj.matches?.map((m) => m.id);
        } catch { /* optional */ }
      }
    }
    const behavior = buildBehaviorAudit(verify?.gates, captureMeta, patternIds);

    return c.json({
      jobId: c.req.param("id"),
      status: view.status,
      verifyStatus: verify?.status,
      score: verify?.scorecard?.total,
      stage2Pass: verify?.stage2Pass,
      perceptualPass: perceptual?.pass,
      visualAuditPass: visual?.pass,
      worstDiffPct: perceptual?.metrics?.worstDiffPct ?? visual?.metrics?.worstDiffPct,
      comparisons,
      behavior,
      gates: verify?.gates
        ? Object.fromEntries(
            Object.entries(verify.gates).map(([k, g]) => [k, { pass: g.pass, issues: (g.issues ?? []).slice(0, 5) }]),
          )
        : undefined,
    });
  });

  app.get("/v1/clones/:id/wip-files", async (c) => {
    const files = backend.listWipFiles ? await backend.listWipFiles(c.req.param("id")) : null;
    if (!files) return c.json({ error: "not found" }, 404);
    return c.json({ jobId: c.req.param("id"), files });
  });

  app.get("/v1/clones/:id/wip-files/:path{.+}", async (c) => {
    if (!backend.readWipFile) return c.json({ error: "not supported" }, 501);
    const f = await backend.readWipFile(c.req.param("id"), c.req.param("path") ?? "");
    if (!f) return c.json({ error: "file not found" }, 404);
    if (f.kind === "text") return c.json({ path: c.req.param("path"), kind: "text", content: f.content ?? "", bytes: f.bytes });
    return c.json({ path: c.req.param("path"), kind: "binary", bytes: f.bytes });
  });

  app.delete("/v1/clones/:id", async (c) => {
    const ok = await backend.remove(c.req.param("id"));
    return c.json({ deleted: ok }, ok ? 200 : 404);
  });

  // MCP over Streamable-HTTP (stateless): a fresh server+transport per request.
  // Requires the Node http req/res from @hono/node-server (not available under
  // app.request — MCP is exercised in tests via the in-memory transport instead).
  if (deps.mcp !== false) {
    app.all("/mcp", async (c) => {
      const env = c.env as { incoming?: IncomingMessage; outgoing?: ServerResponse };
      if (!env?.incoming || !env?.outgoing) {
        return c.json({ error: "MCP requires the Node HTTP server (run via @hono/node-server)" }, 501);
      }
      const server = createMcpServer(backend, { baseUrl: deps.baseUrl });
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      env.outgoing.on("close", () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      const body = c.req.method === "POST" ? await c.req.json().catch(() => undefined) : undefined;
      await transport.handleRequest(env.incoming, env.outgoing, body);
      return RESPONSE_ALREADY_SENT;
    });
  }

  return app;
}
