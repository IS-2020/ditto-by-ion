import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";
import { WIZARD_HTML } from "./wizard.js";
import { STUDIO_HTML } from "./ui.js";
import { SHELL_HTML } from "./shell.js";

const app = new Hono();

app.get("/", (c) => c.html(SHELL_HTML));
app.get("/wizard", (c) => c.html(WIZARD_HTML));
app.get("/studio", (c) => c.html(STUDIO_HTML));
app.get("/health", (c) => c.json({ ok: true, mode: "vercel-ui" }));

app.post("/v1/scan", (c) =>
  c.json(
    {
      error: "Site scan requires the full API (Playwright). Run locally: PORT=8899 npm run dev:api",
      hint: "https://github.com/IS-2020/ditto-by-ion#quick-start-local",
    },
    503,
  ),
);

app.post("/v1/clones", (c) =>
  c.json(
    {
      error: "Clone jobs require Playwright and are not supported on Vercel serverless.",
      hint: "Use local dev or Railway worker — see docs/DEPLOY.md",
    },
    503,
  ),
);

app.all("/v1/*", (c) =>
  c.json({ error: "Full clone API unavailable on Vercel demo. Use local or Railway deployment." }, 503),
);

export default handle(app);
