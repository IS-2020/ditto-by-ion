import { join } from "node:path";
import type { GateResult } from "./gates.js";
import { readJSON, writeJSON, fileExists } from "../util/fsx.js";

/** Tier G: structured defect from a failing gate. */
export type StructuredDefect = {
  gate: string;
  kind: "layout" | "style" | "perceptual" | "visual" | "responsive";
  summary: string;
};

export type AuditRepairHints = {
  /** Extra generate-time CSS fixes to merge (beyond pattern-hint fixes). */
  generateFixes: string[];
  /** Opt into reflow geometry for layout/style recovery. */
  enableReflow?: boolean;
  /** Force background-attachment:scroll on mobile. */
  forceBackgroundScroll?: boolean;
  /** Iteration that produced these hints (for logging). */
  iteration: number;
};

const REPAIR_FILE = "audit-repair.json";

export function auditRepairPath(sourceDir: string): string {
  return join(sourceDir, REPAIR_FILE);
}

export function readAuditRepairHints(sourceDir: string): AuditRepairHints | undefined {
  const p = auditRepairPath(sourceDir);
  if (!fileExists(p)) return undefined;
  return readJSON<AuditRepairHints>(p);
}

export function writeAuditRepairHints(sourceDir: string, hints: AuditRepairHints): void {
  writeJSON(auditRepairPath(sourceDir), hints);
}

/** Map gate failures to structured defects (repairable subset). */
export function defectsFromGates(gates: Record<string, GateResult>): StructuredDefect[] {
  const out: StructuredDefect[] = [];
  const push = (gate: string, kind: StructuredDefect["kind"], summary: string) => {
    out.push({ gate, kind, summary });
  };
  if (gates.layout && !gates.layout.pass) {
    for (const issue of gates.layout.issues.slice(0, 3)) push("layout", "layout", issue);
  }
  if (gates.style && !gates.style.pass) {
    for (const issue of gates.style.issues.slice(0, 3)) push("style", "style", issue);
  }
  if (gates.perceptual && !gates.perceptual.pass) {
    for (const issue of gates.perceptual.issues.slice(0, 2)) push("perceptual", "perceptual", issue);
  }
  if (gates.visual_audit && !gates.visual_audit.pass) {
    for (const issue of gates.visual_audit.issues.slice(0, 2)) push("visual_audit", "visual", issue);
  }
  if (gates.responsive && !gates.responsive.pass) {
    for (const issue of gates.responsive.issues.slice(0, 2)) push("responsive", "responsive", issue);
  }
  return out;
}

/** Pick regeneration strategies from defects (deterministic order). */
export function planRepairHints(
  defects: StructuredDefect[],
  existing: AuditRepairHints | undefined,
  iteration: number,
): AuditRepairHints | null {
  if (!defects.length) return null;
  const generateFixes = new Set(existing?.generateFixes ?? []);
  let enableReflow = existing?.enableReflow ?? false;
  let forceBackgroundScroll = existing?.forceBackgroundScroll ?? false;

  for (const d of defects) {
    if (d.kind === "layout" && !enableReflow) enableReflow = true;
    if (d.kind === "style") {
      generateFixes.add("scroll_anim_freeze");
      if (/height|bbox|leaf/.test(d.summary)) enableReflow = true;
    }
    if (d.kind === "perceptual" || d.kind === "visual") {
      generateFixes.add("scroll_anim_freeze");
      generateFixes.add("parallax_to_scroll");
      forceBackgroundScroll = true;
      if (/height|layout|section/.test(d.summary)) enableReflow = true;
    }
    if (d.kind === "responsive") {
      enableReflow = true;
      generateFixes.add("carousel_flatten");
    }
  }

  return {
    generateFixes: [...generateFixes].sort(),
    enableReflow: enableReflow || undefined,
    forceBackgroundScroll: forceBackgroundScroll || undefined,
    iteration,
  };
}

export function mergeAuditRepairCss(hints: AuditRepairHints | undefined, baseCss: string): string {
  if (!hints?.forceBackgroundScroll) return baseCss;
  const extra = "/* audit-repair: background scroll */\n@media (max-width:768px){*{background-attachment:scroll!important}}\n";
  return baseCss.includes("audit-repair: background scroll") ? baseCss : extra + baseCss;
}

/** Whether any gate failure is eligible for Tier G repair. */
export function repairableFailures(gates: Record<string, GateResult>): boolean {
  return defectsFromGates(gates).length > 0;
}
