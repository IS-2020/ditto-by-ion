import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PATTERN_FIXES, generateFixCss, resolveFixes } from "../src/knowledge/applyPatternHints.js";
import type { PatternHints } from "../src/knowledge/patternIndex.js";

describe("applyPatternHints", () => {
  it("wires 30+ pattern ids to fix bundles", () => {
    assert.ok(Object.keys(PATTERN_FIXES).length >= 30);
  });

  it("resolves consent + carousel fixes from hints", () => {
    const hints: PatternHints = {
      catalogVersion: 4,
      catalogHash: "x",
      matches: [
        { id: "consent_iubenda", kind: "consent", flags: ["consent_overlay"], count: 1, cids: ["c1"] },
        { id: "carousel_owl", kind: "carousel", flags: ["deferred_interactive"], count: 2, cids: ["c2"] },
        { id: "chat_intercom", kind: "chat_widget", flags: ["third_party_widget"], count: 1, cids: ["c3"] },
      ],
      flags: [],
      platforms: [],
      simpleStatic: false,
      warnings: [],
    };
    const fx = resolveFixes(hints);
    assert.ok(fx.capture.has("dismiss_iubenda"));
    assert.ok(fx.capture.has("freeze_carousel_slide0"));
    assert.ok(fx.capture.has("hide_chat_widget"));
    assert.ok(fx.generate.has("carousel_flatten"));
    assert.ok(fx.generate.has("chat_widget_hidden"));
  });

  it("generateFixCss emits deterministic snippets", () => {
    const css = generateFixCss(new Set(["scroll_anim_freeze", "carousel_flatten"]));
    assert.match(css, /scroll_anim_freeze/);
    assert.match(css, /carousel_flatten/);
    assert.equal(generateFixCss(new Set()), "");
  });
});
