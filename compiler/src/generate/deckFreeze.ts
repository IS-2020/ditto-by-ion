/** Opacity-cycling deck freeze — generate-side normalization for autoplay widgets
 *  that stack same-geometry siblings and cycle visibility via opacity. Capture freezes
 *  a mid-cycle frame; this pass forces the first card visible and hides siblings so
 *  static gates and no-JS rendering show one complete card. Pure function of frozen IR. */
import type { IR, IRNode, IRChild } from "../normalize/ir.js";
import { matchCatalogNode } from "../knowledge/patternIndex.js";

function isElement(c: IRChild): c is IRNode {
  return (c as IRNode).id !== undefined;
}

const overlap = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean =>
  Math.abs(a.x - b.x) < 8 && Math.abs(a.y - b.y) < 8 &&
  Math.abs(a.width - b.width) < 16 && Math.abs(a.height - b.height) < 16;

function carouselScopedIds(ir: IR): Set<string> {
  const scoped = new Set<string>();
  const mark = (n: IRNode): void => {
    scoped.add(n.id);
    for (const c of n.children) if (isElement(c)) mark(c);
  };
  const walk = (n: IRNode): void => {
    if (matchCatalogNode(n).some((d) => d.kind === "carousel")) mark(n);
    for (const c of n.children) if (isElement(c)) walk(c);
  };
  walk(ir.root);
  return scoped;
}

function underScope(id: string, ir: IR, scoped: Set<string>, parentOf: Map<string, string>): boolean {
  let cur: string | undefined = id;
  while (cur) {
    if (scoped.has(cur)) return true;
    cur = parentOf.get(cur);
  }
  return false;
}

function buildParentMap(root: IRNode): Map<string, string> {
  const m = new Map<string, string>();
  const walk = (n: IRNode): void => {
    for (const c of n.children) {
      if (!isElement(c)) continue;
      m.set(c.id, n.id);
      walk(c);
    }
  };
  walk(root);
  return m;
}

function isOpacityCyclingDeck(stacked: IRNode[], vp: number): boolean {
  const opacities = stacked.map((k) => parseFloat(k.computedByVp[vp]?.opacity ?? "1"));
  const low = opacities.filter((o) => o < 0.05).length;
  const vis = stacked.filter((k) => k.visibleByVp[vp]);
  return stacked.length >= 3 && vis.length <= 1 && low >= stacked.length - 1;
}

/** Same-geometry sibling stacks where <=1 child is visible per viewport (opacity
 *  cycling deck). Returns cids to force-show (first child) and force-hide (rest). */
export function planDeckFreeze(ir: IR): { show: Set<string>; hide: Set<string> } {
  const show = new Set<string>(), hide = new Set<string>();
  const scoped = carouselScopedIds(ir);
  const parentOf = buildParentMap(ir.root);

  const walk = (n: IRNode): void => {
    const kids = n.children.filter(isElement);
    const inScope = underScope(n.id, ir, scoped, parentOf);
    for (const vp of ir.doc.viewports) {
      const boxed = kids.filter((k) => k.bboxByVp[vp]);
      if (boxed.length < 3) continue;
      const base = boxed[0]!.bboxByVp[vp]!;
      const stacked = boxed.filter((k) => overlap(k.bboxByVp[vp]!, base));
      const visible = stacked.filter((k) => k.visibleByVp[vp]);
      const opacityDeck = isOpacityCyclingDeck(stacked, vp);
      if (stacked.length >= 3 && visible.length <= 1 && (inScope || opacityDeck)) {
        show.add(stacked[0]!.id);
        for (const k of stacked.slice(1)) hide.add(k.id);
      }
    }
    for (const k of kids) walk(k);
  };
  walk(ir.root);
  for (const id of show) hide.delete(id);
  return { show, hide };
}

export function generateDeckFreezeCss(ir: IR): string {
  const { show, hide } = planDeckFreeze(ir);
  if (!show.size && !hide.size) return "";
  const lines: string[] = [];
  for (const cid of [...show].sort()) {
    lines.push(`[data-cid="${cid}"] { opacity: 1 !important; visibility: visible !important; }`);
  }
  for (const cid of [...hide].sort()) {
    lines.push(`[data-cid="${cid}"] { display: none !important; }`);
  }
  return (
    "\n/* Opacity-cycling deck freeze — show first stacked card deterministically. */\n" +
    lines.join("\n") +
    "\n"
  );
}
