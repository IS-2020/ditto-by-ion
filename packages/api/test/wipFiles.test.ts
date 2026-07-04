import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { listWipFiles, readWipFile } from "../src/wipFiles.js";

test("listWipFiles and readWipFile from generated app", () => {
  const base = join("/tmp", "wip-test-" + Date.now());
  const app = join(base, "generated", "app");
  mkdirSync(join(app, "src", "app"), { recursive: true });
  writeFileSync(join(app, "src", "app", "page.tsx"), "export default function P(){return null}");
  const files = listWipFiles(base);
  assert.ok(files.includes("src/app/page.tsx"));
  const f = readWipFile(base, "src/app/page.tsx");
  assert.ok(f?.text?.includes("export default"));
});
