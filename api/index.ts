import { handle } from "hono/vercel";
import { createBootstrapApp } from "../packages/api/src/bootstrap.js";

const { app } = createBootstrapApp();

export default handle(app);

/** Vercel: allow long-running clone jobs when Playwright is available. */
export const config = {
  maxDuration: 300,
  memory: 3009,
};
