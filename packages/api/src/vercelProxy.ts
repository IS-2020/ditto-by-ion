import type { Context } from "hono";

/** Remote clone API base (Railway worker). Checked in order. */
export function workerApiBase(): string | null {
  const raw = process.env.DITTO_WORKER_URL?.trim() || process.env.CLONE_API_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

const FORWARD_REQUEST_HEADERS = ["content-type", "accept", "authorization", "x-api-key"] as const;

/** Proxy the incoming request to the worker when `DITTO_WORKER_URL` / `CLONE_API_URL` is set. */
export async function proxyToWorker(c: Context): Promise<Response | null> {
  const base = workerApiBase();
  if (!base) return null;

  const incoming = new URL(c.req.url);
  const target = `${base}${incoming.pathname}${incoming.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = c.req.header(name);
    if (value) headers.set(name, value);
  }

  const method = c.req.method;
  const init: RequestInit = { method, headers, redirect: "manual" };
  if (method !== "GET" && method !== "HEAD") {
    init.body = await c.req.arrayBuffer();
  }

  let res: Response;
  try {
    res = await fetch(target, init);
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: "Worker unreachable",
        detail: String((e as Error).message ?? e).slice(0, 200),
      }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  const outHeaders = new Headers();
  for (const name of ["content-type", "cache-control", "content-disposition", "location"]) {
    const value = res.headers.get(name);
    if (value) outHeaders.set(name, value);
  }

  return new Response(res.body, { status: res.status, headers: outHeaders });
}
