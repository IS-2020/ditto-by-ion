import { readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

export type PatternCatalogEntry = {
  id: string;
  kind: string;
  flags: string[];
  match: {
    classTokens?: string[];
    classPrefixes?: string[];
    tags?: string[];
    attrNames?: string[];
    idPrefixes?: string[];
  };
};

export type PatternsPayload = {
  version: number;
  catalogHash: string;
  description?: string;
  total: number;
  /** patterns grouped by kind for the UI graph */
  byKind: Record<string, PatternCatalogEntry[]>;
  kinds: string[];
};

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const CATALOG_PATH = join(REPO_ROOT, "compiler/data/pattern-catalog.json");

let cached: PatternsPayload | null = null;
let cachedMtimeMs = 0;

export function loadPatternsPayload(): PatternsPayload {
  const mtimeMs = statSync(CATALOG_PATH).mtimeMs;
  if (cached && mtimeMs === cachedMtimeMs) return cached;
  const raw = readFileSync(CATALOG_PATH, "utf8");
  const catalog = JSON.parse(raw) as {
    version: number;
    description?: string;
    patterns: PatternCatalogEntry[];
  };
  const byKind: Record<string, PatternCatalogEntry[]> = {};
  for (const p of catalog.patterns) {
    const list = byKind[p.kind] ?? [];
    list.push(p);
    byKind[p.kind] = list;
  }
  for (const k of Object.keys(byKind)) {
    byKind[k]!.sort((a, b) => a.id.localeCompare(b.id));
  }
  const kinds = Object.keys(byKind).sort();
  cachedMtimeMs = mtimeMs;
  cached = {
    version: catalog.version,
    catalogHash: createHash("sha256").update(raw).digest("hex"),
    description: catalog.description,
    total: catalog.patterns.length,
    byKind,
    kinds,
  };
  return cached;
}

/** Test hook: drop in-memory cache after catalog edits. */
export function clearPatternsCache(): void {
  cached = null;
  cachedMtimeMs = 0;
}
