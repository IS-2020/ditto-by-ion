import test from "node:test";
import assert from "node:assert/strict";
import { previewErrorHtml, rewritePreviewHtml } from "../src/previewServe.js";

test("previewErrorHtml returns HTML (never JSON pretty-print in iframes)", () => {
  const html = previewErrorHtml("Not ready", "Still building");
  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /Not ready/);
  assert.doesNotMatch(html, /application\/json|"error"/);
});

test("rewritePreviewHtml fixes mirror base and /static/assets paths", () => {
  const html = `<!DOCTYPE html><html><head><base href="/static/"></head><body><img src="/static/assets/cloned/images/a.png"></body></html>`;
  const out = rewritePreviewHtml(html, "/v1/clones/abc/mirror-preview/");
  assert.match(out, /<base href="\/v1\/clones\/abc\/mirror-preview\/">/);
  assert.match(out, /src="\.\/assets\/cloned\/images\/a\.png"/);
});
