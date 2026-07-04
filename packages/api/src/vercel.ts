import { handle } from "@hono/node-server/vercel";
import { createBootstrapApp } from "./bootstrap.js";

const { app } = createBootstrapApp();

export default handle(app);
