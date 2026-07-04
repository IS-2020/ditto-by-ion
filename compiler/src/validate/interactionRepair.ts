import { join } from "node:path";
import type { GateResult } from "./gates.js";
import { readJSON, writeJSON, fileExists } from "../util/fsx.js";

/** Targeted regeneration hints when the interaction gate rejects patterns. */
export type InteractionRepairHints = {
  /** Pattern specKeys that failed (e.g. "a:c12", "c:c45"). */
  rejected: string[];
  /** Extra generate-time CSS / pipeline fixes to try before pruning. */
  generateFixes: string[];
  /** Opt into reflow for height-collapsing accordions. */
  enableReflow?: boolean;
  iteration: number;
};

const REPAIR_FILE = "interaction-repair.json";

export function interactionRepairPath(sourceDir: string): string {
  return join(sourceDir, REPAIR_FILE);
}

export function readInteractionRepairHints(sourceDir: string): InteractionRepairHints | undefined {
  const p = interactionRepairPath(sourceDir);
  if (!fileExists(p)) return undefined;
  return readJSON<InteractionRepairHints>(p);
}

export function writeInteractionRepairHints(sourceDir: string, hints: InteractionRepairHints): void {
  writeJSON(interactionRepairPath(sourceDir), hints);
}

/** Map rejected specKeys to deterministic repair strategies. */
export function planInteractionRepair(
  rejected: string[],
  gate: GateResult,
  iteration: number,
): InteractionRepairHints | null {
  if (!rejected.length) return null;
  const generateFixes = new Set<string>();
  let enableReflow = false;

  for (const key of rejected) {
    if (key.startsWith("c:")) generateFixes.add("carousel_flatten");
    if (key.startsWith("a:") || key.startsWith("d:")) {
      generateFixes.add("interaction_accordion_height");
      enableReflow = true;
    }
    if (key.startsWith("t:")) generateFixes.add("interaction_tab_focus");
  }

  // Broad failure: ensure scroll-entrance states don't block interaction wiring.
  const passPct = (gate.metrics?.patternPassPct as number | undefined) ?? 1;
  if (passPct < 0.85) generateFixes.add("scroll_anim_freeze");

  if (!generateFixes.size && !enableReflow) {
    generateFixes.add("interaction_accordion_height");
  }

  return {
    rejected: [...rejected].sort(),
    generateFixes: [...generateFixes].sort(),
    enableReflow: enableReflow || undefined,
    iteration,
  };
}

export function mergeInteractionRepairCss(hints: InteractionRepairHints | undefined, baseCss: string): string {
  if (!hints) return baseCss;
  const parts: string[] = [];
  if (hints.generateFixes.includes("interaction_accordion_height")) {
    parts.push(
      "/* interaction-repair: accordion height */",
      "[data-cid][style*='max-height: 0'],[data-cid][style*='max-height:0']{transition:max-height .2s ease,opacity .2s ease!important}",
    );
  }
  if (hints.generateFixes.includes("interaction_tab_focus")) {
    parts.push(
      "/* interaction-repair: tab focus */",
      "[role='tab'][data-cid]:focus-visible{outline:2px solid currentColor;outline-offset:2px}",
    );
  }
  if (!parts.length) return baseCss;
  const block = parts.join("\n") + "\n";
  return baseCss.includes("interaction-repair:") ? baseCss : block + baseCss;
}
