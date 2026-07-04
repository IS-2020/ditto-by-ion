import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { siteIdFromUrl } from "clone-static";

export type CacheCheckResult = {
  url: string;
  siteId: string;
  cached: boolean;
  cachePath: string;
  ageMs: number | null;
  hint: string;
};

export function checkCaptureCache(cacheDir: string | undefined, url: string): CacheCheckResult {
  const siteId = siteIdFromUrl(url);
  const cachePath = cacheDir ? join(cacheDir, siteId, "source") : "";
  const captureFile = cachePath ? join(cachePath, "capture", "capture-result.json") : "";
  const cached = !!(cachePath && existsSync(captureFile));
  let ageMs: number | null = null;
  if (cached) {
    try {
      ageMs = Date.now() - statSync(captureFile).mtimeMs;
    } catch {
      ageMs = null;
    }
  }
  const hint = cached
    ? "Cached capture available — Production tier reuses it when options match."
    : "No cached capture — first clone hits the live site.";
  return { url, siteId, cached, cachePath, ageMs, hint };
}
