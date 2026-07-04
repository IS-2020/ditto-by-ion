import test from "node:test";
import assert from "node:assert/strict";
import { buildBehaviorAudit } from "../src/behaviorAudit.js";
import { planInteractionRepair } from "../../../compiler/src/validate/interactionRepair.js";

test("buildBehaviorAudit summarizes interaction and motion gates", () => {
  const behavior = buildBehaviorAudit(
    {
      interaction: {
        pass: true,
        metrics: {
          patterns: 2,
          reproduced: 2,
          pruned: 0,
          tabs: "1/1",
          accordions: "1/1",
          carousels: "0/0",
          disclosures: "0/0",
          menus: "0/0",
          rejected: [],
        },
      },
      motion: {
        pass: false,
        metrics: { animations: 3, css: "2/2", waapi: "0/1", rotators: "0/0", reveals: "0/0", marquees: "0/0" },
        issues: ["waapi cid c12 missing"],
      },
    },
    { hover: 5, focus: 2, candidates: 100 },
    ["carousel_swiper"],
  );
  assert.equal(behavior.interaction.pass, true);
  assert.equal(behavior.interaction.reproduced, 2);
  assert.ok(behavior.interaction.rows.some((r) => r.kind === "hover"));
  assert.equal(behavior.motion.pass, false);
  assert.ok(behavior.motion.rows.some((r) => r.label.includes("WAAPI")));
});

test("planInteractionRepair maps rejected carousel to flatten fix", () => {
  const hints = planInteractionRepair(["c:c99"], { gate: "interaction", pass: false, metrics: {}, issues: [] }, 1);
  assert.ok(hints);
  assert.ok(hints!.generateFixes.includes("carousel_flatten"));
});
