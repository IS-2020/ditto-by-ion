import * as esbuild from "esbuild";
import { rmSync } from "node:fs";

rmSync("api/index.js", { force: true });
rmSync("api/package.json", { force: true });

await esbuild.build({
  entryPoints: ["packages/api/src/vercelUi.ts"],
  outfile: "api/index.js",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
  },
  external: [
    "playwright",
    "playwright-core",
    "@playwright/test",
    "fsevents",
    "sharp",
    "canvas",
  ],
  logLevel: "info",
});

console.log("Bundled Vercel handler → api/index.js");
