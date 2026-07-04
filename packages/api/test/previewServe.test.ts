import test from "node:test";
import assert from "node:assert/strict";
import { rewritePreviewHtml } from "../src/previewServe.js";

test("rewritePreviewHtml fixes mirror base and /static/assets paths", () => {
  const html = `<!DOCTYPE html><html><head><base href="/static/"></head><body><img src="/static/assets/cloned/images/a.png"></body></html>`;
  const out = rewritePreviewHtml(html, "/v1/clones/abc/mirror-preview/");
  assert.match(out, /<base href="\/v1\/clones\/abc\/mirror-preview\/">/);
  assert.match(out, /src="\.\/assets\/cloned\/images\/a\.png"/);
});
