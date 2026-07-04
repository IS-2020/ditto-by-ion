#!/usr/bin/env node
/**
 * Validate pattern-catalog.json: unique ids, lock pin, denylisted generic prefixes.
 * Exit 1 on failure. Run in CI after catalog edits.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(ROOT, "data/pattern-catalog.json");
const LOCK = join(ROOT, "data/pattern-catalog.lock");

const GENERIC_PREFIX_DENY = new Set([
  "flex-", "text-", "top-", "inset-", "pointer-", "rich-", "video-", "skeleton-",
  "max-", "gap-", "rounded-", "justify-", "items-", "font-", "color-", "css-",
]);

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const raw = readFileSync(CATALOG, "utf8");
const hash = createHash("sha256").update(raw).digest("hex");
let failed = false;

function err(msg) {
  console.error("validate-pattern-catalog:", msg);
  failed = true;
}

if (!Array.isArray(catalog.patterns) || catalog.patterns.length < 40) {
  err(`expected >= 40 patterns, got ${catalog.patterns?.length ?? 0}`);
}

const ids = new Set();
for (const p of catalog.patterns ?? []) {
  if (!p.id || ids.has(p.id)) err(`duplicate or missing id: ${p.id}`);
  ids.add(p.id);
  if (!p.kind || !p.match) err(`invalid pattern def: ${p.id}`);
  for (const pre of p.match.classPrefixes ?? []) {
    if (GENERIC_PREFIX_DENY.has(pre.toLowerCase())) err(`generic prefix in catalog: ${p.id} → ${pre}`);
  }
}

if (existsSync(LOCK)) {
  const pinned = readFileSync(LOCK, "utf8").trim();
  if (pinned !== hash) err(`lock mismatch: pinned ${pinned.slice(0, 12)}… actual ${hash.slice(0, 12)}…`);
} else {
  err("pattern-catalog.lock missing");
}

if (failed) process.exit(1);
console.log(`OK: ${catalog.patterns.length} patterns, v${catalog.version ?? "?"}, hash ${hash.slice(0, 12)}…`);
