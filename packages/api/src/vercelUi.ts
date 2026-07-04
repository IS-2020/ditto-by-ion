import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";
import { WIZARD_HTML } from "./wizard.js";
import { STUDIO_HTML } from "./ui.js";
import { SHELL_HTML } from "./shell.js";
import { proxyToWorker, workerApiBase } from "./vercelProxy.js";

const app = new Hono();

const LOCAL_HINT = "https://github.com/IS-2020/ditto-by-ion#quick-start-local";
const DEPLOY_HINT = "https://github.com/IS-2020/ditto-by-ion/blob/main/docs/DEPLOY.md";

app.get("/", (c) => c.html(SHELL_HTML));
app.get("/wizard", (c) => c.html(WIZARD_HTML));
app.get("/studio", (c) => c.html(STUDIO_HTML));
app.get("/health", (c) =>
  c.json({
    ok: true,
    mode: "vercel-ui",
    worker: workerApiBase() ? "proxied" : "stub",
    workerUrl: workerApiBase() ?? undefined,
  }),
);

const scanStub = (c: { json: (body: unknown, status: number) => Response }) =>
  c.json(
    {
      error: "Site scan requires the full API (Playwright). Run locally: PORT=8899 npm run dev:api",
      hint: LOCAL_HINT,
      scanUnavailable: true,
    },
    503,
  );

const cloneStub = (c: { json: (body: unknown, status: number) => Response }) =>
  c.json(
    {
      error: "Clone jobs require Playwright and are not supported on Vercel serverless.",
      hint: DEPLOY_HINT,
      cloneUnavailable: true,
    },
    503,
  );

app.post("/v1/scan", async (c) => (await proxyToWorker(c)) ?? scanStub(c));

app.post("/v1/clones", async (c) => (await proxyToWorker(c)) ?? cloneStub(c));

app.all("/v1/clones/*", async (c) => (await proxyToWorker(c)) ?? cloneStub(c));

app.all("/v1/*", async (c) => {
  const proxied = await proxyToWorker(c);
  if (proxied) return proxied;
  return c.json(
    { error: "Full clone API unavailable on Vercel demo. Use local or Railway deployment.", hint: DEPLOY_HINT },
    503,
  );
});

export default handle(app);
