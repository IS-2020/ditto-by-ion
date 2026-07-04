/** Shape interaction + motion gate metrics for the audit API and wizard UI. */

export type BehaviorPatternRow = {
  kind: "tabs" | "accordion" | "carousel" | "disclosure" | "menu" | "hover" | "focus" | "motion";
  label: string;
  status: "pass" | "fail" | "pruned" | "na" | "static";
  detail?: string;
};

export type BehaviorAudit = {
  interaction: {
    pass: boolean;
    na?: boolean;
    patterns: number;
    reproduced: number;
    pruned: number;
    hoverCaptured?: number;
    focusCaptured?: number;
    candidates?: number;
    tabs?: string;
    accordions?: string;
    carousels?: string;
    disclosures?: string;
    menus?: string;
    rejected?: string[];
    issues?: string[];
    rows: BehaviorPatternRow[];
  };
  motion: {
    pass: boolean;
    na?: boolean;
    animations: number;
    css?: string;
    waapi?: string;
    rotators?: string;
    reveals?: string;
    marquees?: string;
    issues?: string[];
    rows: BehaviorPatternRow[];
  };
  deferredPatterns?: string[];
};

type GateSlice = { pass?: boolean; metrics?: Record<string, unknown>; issues?: string[] };

export function buildBehaviorAudit(
  gates: Record<string, GateSlice> | undefined,
  captureMeta?: { hover?: number; focus?: number; candidates?: number; motion?: boolean },
  patternIds?: string[],
): BehaviorAudit {
  const ig = gates?.interaction;
  const mg = gates?.motion;
  const im = ig?.metrics ?? {};
  const mm = mg?.metrics ?? {};

  const rejected = (im.rejected as string[] | undefined) ?? [];
  const rows: BehaviorPatternRow[] = [];

  const pushKind = (kind: BehaviorPatternRow["kind"], label: string, ratio: string | undefined, prefix: string) => {
    if (!ratio || ratio === "0/0") return;
    const [ok, total] = ratio.split("/").map((x) => parseInt(x, 10));
    if (!total) return;
    const prunedKeys = rejected.filter((k) => k.startsWith(prefix));
    const okN = ok ?? 0;
    if (okN === total && prunedKeys.length === 0) {
      rows.push({ kind, label, status: "pass", detail: ratio });
    } else if (okN > 0) {
      rows.push({ kind, label, status: "fail", detail: `${okN}/${total} reproduced; ${prunedKeys.length} pruned` });
    } else {
      rows.push({ kind, label, status: "pruned", detail: `${prunedKeys.length} pruned to static` });
    }
  };

  pushKind("tabs", "Tabs", im.tabs as string | undefined, "t:");
  pushKind("accordion", "Accordions", im.accordions as string | undefined, "a:");
  pushKind("carousel", "Carousels", im.carousels as string | undefined, "c:");
  pushKind("disclosure", "Dropdowns / modals", im.disclosures as string | undefined, "d:");
  pushKind("menu", "Portal menus", im.menus as string | undefined, "m:");

  const hoverN = captureMeta?.hover ?? 0;
  const focusN = captureMeta?.focus ?? 0;
  if (hoverN > 0) rows.push({ kind: "hover", label: "CSS hover states", status: "pass", detail: `${hoverN} captured` });
  else if (!im.na) rows.push({ kind: "hover", label: "CSS hover states", status: "static", detail: "none captured" });

  if (focusN > 0) rows.push({ kind: "focus", label: "Focus states", status: "pass", detail: `${focusN} captured` });

  if (im.na) {
    rows.push({ kind: "tabs", label: "Interactions", status: "na", detail: "capture ran without interaction probe" });
  }

  for (const key of rejected) {
    const kind = key.startsWith("t:") ? "tabs" : key.startsWith("a:") ? "accordion" : key.startsWith("c:") ? "carousel" : key.startsWith("d:") ? "disclosure" : "menu";
    if (!rows.some((r) => r.status === "pruned" && r.detail?.includes(key))) {
      rows.push({ kind, label: `Pruned ${key}`, status: "pruned", detail: "failed interaction gate → static fallback" });
    }
  }

  const motionRows: BehaviorPatternRow[] = [];
  if (mg?.metrics?.na) {
    motionRows.push({ kind: "motion", label: "Motion", status: "na", detail: "no motion capture" });
  } else {
    const animTotal = (mm.animations as number) ?? 0;
    if (animTotal === 0) {
      motionRows.push({ kind: "motion", label: "Motion", status: "static", detail: "no animations captured" });
    } else {
      motionRows.push({ kind: "motion", label: "CSS animations", status: mg?.pass ? "pass" : "fail", detail: String(mm.css ?? "") });
      if (mm.waapi && mm.waapi !== "0/0") motionRows.push({ kind: "motion", label: "WAAPI / Framer", status: mg?.pass ? "pass" : "fail", detail: String(mm.waapi) });
      if (mm.rotators && mm.rotators !== "0/0") motionRows.push({ kind: "motion", label: "Text rotators", status: mg?.pass ? "pass" : "fail", detail: String(mm.rotators) });
      if (mm.reveals && mm.reveals !== "0/0") motionRows.push({ kind: "motion", label: "Scroll reveals", status: mg?.pass ? "pass" : "fail", detail: String(mm.reveals) });
      if (mm.marquees && mm.marquees !== "0/0") motionRows.push({ kind: "motion", label: "Marquees", status: mg?.pass ? "pass" : "fail", detail: String(mm.marquees) });
    }
  }

  const deferred = (patternIds ?? []).filter((id) =>
    id.includes("swiper") || id.includes("deferred") || id.startsWith("chat_") || id.startsWith("captcha_"),
  );

  return {
    interaction: {
      pass: !!ig?.pass,
      na: !!im.na,
      patterns: (im.patterns as number) ?? 0,
      reproduced: (im.reproduced as number) ?? 0,
      pruned: (im.pruned as number) ?? rejected.length,
      hoverCaptured: hoverN || undefined,
      focusCaptured: focusN || undefined,
      candidates: captureMeta?.candidates,
      tabs: im.tabs as string | undefined,
      accordions: im.accordions as string | undefined,
      carousels: im.carousels as string | undefined,
      disclosures: im.disclosures as string | undefined,
      menus: im.menus as string | undefined,
      rejected: rejected.length ? rejected : undefined,
      issues: ig?.issues?.slice(0, 8),
      rows,
    },
    motion: {
      pass: !!mg?.pass,
      na: !!mm.na,
      animations: (mm.animations as number) ?? 0,
      css: mm.css as string | undefined,
      waapi: mm.waapi as string | undefined,
      rotators: mm.rotators as string | undefined,
      reveals: mm.reveals as string | undefined,
      marquees: mm.marquees as string | undefined,
      issues: mg?.issues?.slice(0, 8),
      rows: motionRows,
    },
    deferredPatterns: deferred.length ? deferred : undefined,
  };
}
