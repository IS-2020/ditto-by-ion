import * as esbuild from "esbuild";
import { rmSync } from "node:fs";

rmSync("api/index.js", { force: true });

await esbuild.build({
  entryPoints: ["packages/api/src/vercel.ts"],
  outfile: "api/index.js",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external",
  logLevel: "info",
});

console.log("Bundled Vercel handler → api/index.js");
