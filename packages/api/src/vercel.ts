import { handle } from "hono/vercel";
import { createBootstrapApp } from "./bootstrap.js";

const { app } = createBootstrapApp();

export default handle(app);
