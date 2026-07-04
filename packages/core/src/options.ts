import type { CloneFramework, CloneMode, CloneOptions, CloneStyling } from "./types.js";
import { applyQualityTier } from "./qualityTiers.js";

export type ResolvedCloneOptions = CloneOptions & {
  mode: CloneMode;
  styling: CloneStyling;
  framework: CloneFramework;
  multiPage: boolean;
  humanizeMode: CloneStyling;
  interactions: boolean;
  components: boolean;
  motion: boolean;
  preview: boolean;
};

export function resolveCloneMode(options: CloneOptions = {}): CloneMode {
  if (options.selectedRoutes && options.selectedRoutes.length > 1) return "multi";
  return options.mode ?? (options.multiPage ? "multi" : "single");
}

export function resolveCloneStyling(options: CloneOptions = {}): CloneStyling {
  return options.styling ?? options.humanizeMode ?? "tailwind";
}

export function resolveCloneFramework(options: CloneOptions = {}): CloneFramework {
  return options.framework ?? "next";
}

/** Normalize the request-facing shape. Deprecated aliases are consumed but not
 * echoed, so REST/MCP results present the product-level option names. */
export function normalizeCloneRequestOptions(options: CloneOptions = {}): CloneOptions {
  const normalized: CloneOptions = {
    ...options,
    mode: resolveCloneMode(options),
    styling: resolveCloneStyling(options),
    framework: resolveCloneFramework(options),
  };
  delete normalized.multiPage;
  delete normalized.humanizeMode;
  return normalized;
}

/** Resolve options for the compiler adapter. This is where automatic internal
 * defaults live; callers should not need to choose these in normal use. */
export function resolveCloneOptions(options: CloneOptions = {}): ResolvedCloneOptions {
  const tiered = applyQualityTier(options);
  const mode = resolveCloneMode(tiered);
  const styling = resolveCloneStyling(tiered);
  const framework = resolveCloneFramework(tiered);
  return {
    ...tiered,
    mode,
    styling,
    framework,
    multiPage: mode === "multi",
    humanizeMode: styling,
    interactions: tiered.interactions ?? true,
    components: tiered.components ?? true,
    motion: tiered.motion ?? true,
    preview: tiered.preview ?? mode === "single",
  };
}
