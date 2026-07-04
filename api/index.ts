import { handle } from "hono/vercel";
import { createBootstrapApp } from "../packages/api/src/bootstrap.js";

const { app } = createBootstrapApp();

export default handle(app);
