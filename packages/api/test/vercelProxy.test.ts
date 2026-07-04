import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { Hono } from "hono";
import { proxyToWorker, workerApiBase } from "../src/vercelProxy.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.DITTO_WORKER_URL;
  delete process.env.CLONE_API_URL;
});

test("workerApiBase prefers DITTO_WORKER_URL and strips trailing slash", () => {
  process.env.DITTO_WORKER_URL = "https://api.example.com/";
  assert.equal(workerApiBase(), "https://api.example.com");
});

test("workerApiBase falls back to CLONE_API_URL", () => {
  process.env.CLONE_API_URL = "https://worker.railway.app";
  assert.equal(workerApiBase(), "https://worker.railway.app");
});

test("proxyToWorker returns null when no worker URL is configured", async () => {
  const app = new Hono();
  app.post("/v1/scan", async (c) => {
    const proxied = await proxyToWorker(c);
    return proxied ?? c.json({ stub: true }, 503);
  });
  const res = await app.request("/v1/scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "https://example.com/" }),
  });
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { stub: true });
});

test("proxyToWorker forwards POST body and returns worker response", async () => {
  process.env.DITTO_WORKER_URL = "https://worker.test";
  let seenUrl = "";
  let seenBody = "";
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    seenUrl = String(input);
    seenBody = init?.body ? new TextDecoder().decode(init.body as ArrayBuffer) : "";
    return new Response(JSON.stringify({ ok: true, routes: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  const app = new Hono();
  app.post("/v1/scan", async (c) => {
    const proxied = await proxyToWorker(c);
    assert.ok(proxied);
    return proxied;
  });

  const res = await app.request("/v1/scan?foo=1", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "https://example.com/" }),
  });

  assert.equal(res.status, 200);
  assert.equal(seenUrl, "https://worker.test/v1/scan?foo=1");
  assert.match(seenBody, /example\.com/);
  assert.deepEqual(await res.json(), { ok: true, routes: [] });
});

test("proxyToWorker returns 502 when worker fetch throws", async () => {
  process.env.DITTO_WORKER_URL = "https://worker.test";
  globalThis.fetch = (async () => {
    throw new Error("ECONNREFUSED");
  }) as typeof fetch;

  const app = new Hono();
  app.get("/v1/clones/job-1", async (c) => {
    const proxied = await proxyToWorker(c);
    assert.ok(proxied);
    return proxied;
  });

  const res = await app.request("/v1/clones/job-1");
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.match(body.error, /unreachable/i);
});
