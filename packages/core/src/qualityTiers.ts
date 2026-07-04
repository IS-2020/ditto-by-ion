import type { CloneOptions } from "./types.js";

/** Product quality tiers — map to capture/generate/verify defaults. */
export type QualityTier = "production" | "dev" | "draft";

const PRODUCTION_VIEWPORTS = [375, 768, 1280, 1920] as const;

/** Merge tier defaults; explicit options on the request win. */
export function applyQualityTier(options: CloneOptions = {}): CloneOptions {
  const tier = options.qualityTier ?? "production";
  const { qualityTier: _qt, ...rest } = options;

  if (tier === "draft") {
    return {
      viewports: [1280],
      interactions: false,
      motion: false,
      components: false,
      verify: false,
      asyncVerify: false,
      preview: true,
      noCache: false,
      ...rest,
    };
  }

  if (tier === "dev") {
    return {
      noCache: false,
      verify: false,
      preview: true,
      ...rest,
    };
  }

  return {
    viewports: [...PRODUCTION_VIEWPORTS],
    interactions: true,
    motion: true,
    components: true,
    verify: true,
    asyncVerify: false,
    noCache: false,
    preview: true,
    viewportConcurrency: 2,
    ...rest,
  };
}
