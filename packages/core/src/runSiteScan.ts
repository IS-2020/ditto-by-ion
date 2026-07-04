import { crawlSite, selectRoutes } from "clone-static";

export type ScanRoute = {
  path: string;
  label: string;
  role: string;
  template: string;
  /** Included in the compiler's default route plan (top N). */
  suggested: boolean;
  depth: number;
};

export type SiteScanResult = {
  url: string;
  origin: string;
  entryPath: string;
  discovered: number;
  routes: ScanRoute[];
  suggestedPaths: string[];
};

const COMMON_LABELS: Record<string, string> = {
  "/": "Home",
  "/about": "About",
  "/about-us": "About us",
  "/pricing": "Pricing",
  "/plans": "Plans",
  "/contact": "Contact",
  "/blog": "Blog",
  "/docs": "Docs",
  "/help": "Help",
  "/faq": "FAQ",
  "/features": "Features",
  "/product": "Product",
  "/products": "Products",
  "/shop": "Shop",
  "/store": "Store",
  "/cart": "Cart",
  "/login": "Login",
  "/signin": "Sign in",
  "/signup": "Sign up",
  "/careers": "Careers",
  "/privacy": "Privacy",
  "/terms": "Terms",
};

function titleCase(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function labelFor(path: string, role: string): string {
  const key = path.toLowerCase().replace(/\/+$/, "") || "/";
  if (COMMON_LABELS[key]) return COMMON_LABELS[key]!;
  if (role === "entry") return "Home";
  if (role === "listing") {
    const segs = path.split("/").filter(Boolean);
    const name = segs[segs.length - 1] ?? "listing";
    return `${titleCase(name)} (listing)`;
  }
  if (role === "representative") {
    const segs = path.split("/").filter(Boolean);
    const name = segs[segs.length - 1] ?? "detail";
    return `${titleCase(name)} (sample)`;
  }
  const segs = path.split("/").filter(Boolean);
  return titleCase(segs[segs.length - 1] ?? "Home");
}

/** Lightweight site scan: crawl + route plan for UI route pickers. */
export async function runSiteScan(
  url: string,
  opts?: { maxRoutes?: number; log?: (e: Record<string, unknown>) => void },
): Promise<SiteScanResult> {
  const maxRoutes = opts?.maxRoutes ?? 20;
  const log = opts?.log ?? (() => {});
  log({ event: "scan_start", url });
  const crawl = await crawlSite({ url, maxDiscoverPages: 40, log });
  const plan = selectRoutes({ entryPath: crawl.entryPath, paths: crawl.paths, maxRoutes });
  const suggested = new Set(plan.selected.map((r) => r.path));
  const roleByPath = new Map(plan.selected.map((r) => [r.path, r.role]));
  const templateByPath = new Map(plan.selected.map((r) => [r.path, r.template]));

  const paths = [...new Set([crawl.entryPath, ...crawl.paths])].sort(
    (a, b) => (crawl.depthByPath[a] ?? 99) - (crawl.depthByPath[b] ?? 99) || a.localeCompare(b),
  );

  const routes: ScanRoute[] = [];
  const seen = new Set<string>();
  for (const p of paths) {
    if (seen.has(p)) continue;
    seen.add(p);
    const role = roleByPath.get(p) ?? (p === crawl.entryPath ? "entry" : "page");
    routes.push({
      path: p,
      label: labelFor(p, role),
      role,
      template: templateByPath.get(p) ?? "",
      suggested: suggested.has(p),
      depth: crawl.depthByPath[p] ?? 0,
    });
    if (routes.length >= maxRoutes) break;
  }

  log({ event: "scan_done", discovered: crawl.paths.length, routes: routes.length, suggested: suggested.size });
  return {
    url: crawl.entryUrl,
    origin: crawl.origin,
    entryPath: crawl.entryPath,
    discovered: crawl.paths.length,
    routes,
    suggestedPaths: [...suggested],
  };
}
