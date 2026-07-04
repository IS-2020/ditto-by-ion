import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  defectsFromGates,
  planRepairHints,
  repairableFailures,
} from "../src/validate/auditRepair.js";
import type { GateResult } from "../src/validate/gates.js";

const pass: GateResult = { gate: "x", pass: true, metrics: {}, issues: [] };
const fail = (gate: string, issues: string[]): GateResult => ({ gate, pass: false, metrics: {}, issues });

describe("auditRepair", () => {
  it("extracts repairable defects from failing gates", () => {
    const gates = {
      layout: pass,
      style: fail("style", ["computed style pass 90.0% (< 95%)"]),
      perceptual: pass,
      visual_audit: pass,
      responsive: pass,
    };
    const defects = defectsFromGates(gates);
    assert.equal(defects.length, 1);
    assert.equal(defects[0]!.kind, "style");
    assert.ok(repairableFailures(gates));
  });

  it("plans deterministic repair hints with escalating strategies", () => {
    const defects = defectsFromGates({
      layout: fail("layout", ["vp1280 leaf median bbox delta 12.0px"]),
      style: pass,
      perceptual: fail("perceptual", ["vp1280 diff 18%"]),
      visual_audit: pass,
      responsive: pass,
    });
    const plan = planRepairHints(defects, undefined, 1);
    assert.ok(plan);
    assert.ok(plan!.enableReflow);
    assert.ok(plan!.generateFixes.includes("scroll_anim_freeze"));
    assert.ok(plan!.forceBackgroundScroll);
  });

  it("accumulates fixes across iterations", () => {
    const prev = planRepairHints(
      defectsFromGates({ style: fail("style", ["computed style pass 90%"]), layout: pass, perceptual: pass, visual_audit: pass, responsive: pass }),
      undefined,
      1,
    )!;
    const next = planRepairHints(
      defectsFromGates({ responsive: fail("responsive", ["overflow"]), layout: pass, style: pass, perceptual: pass, visual_audit: pass }),
      prev,
      2,
    )!;
    assert.ok(next.generateFixes.includes("scroll_anim_freeze"));
    assert.ok(next.generateFixes.includes("carousel_flatten"));
  });
});
