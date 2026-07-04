import { handle } from "hono/vercel";
import { createBootstrapApp } from "./bootstrap.js";

const { app } = createBootstrapApp();

/** Lazy-load compiler so wizard HTML serves before Playwright modules initialize. */
let ready = handle(app);
export default async function handler(req: unknown, ctx: unknown) {
  return ready(req, ctx);
}
