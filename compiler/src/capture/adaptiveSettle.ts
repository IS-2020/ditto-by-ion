/** Page-weight-scaled settle budgets — shorter on simple pages, full depth on Shopify/Elementor. */

export type SettlePhase = "navigate" | "resize" | "dismiss" | "post_scroll";

const BASE_MS: Record<SettlePhase, number> = {
  navigate: 2500,
  resize: 1500,
  dismiss: 1000,
  post_scroll: 1500,
};

export function settleBudgetMs(nodeCount: number, phase: SettlePhase, simpleStatic = false): number {
  let weight = 1;
  if (simpleStatic || nodeCount < 150) weight = 0.45;
  else if (nodeCount < 400) weight = 0.6;
  else if (nodeCount < 900) weight = 0.75;
  else if (nodeCount < 1800) weight = 1;
  else weight = 1.15;
  return Math.max(200, Math.round(BASE_MS[phase] * weight));
}

/** Lightweight in-page probe for heavy widget signatures (before full IR exists). */
export const QUICK_PATTERN_PROBE = `(() => {
  const html = document.documentElement.outerHTML.slice(0, 500_000).toLowerCase();
  const nodes = document.querySelectorAll("*").length;
  const captureFixes = [];
  const heavyMarkers = ["swiper", "slick-", "splide", "embla", "lottie", "data-aos", "data-wow", "elementor-", "shopify-section", "odometer", "marquee", "gsap", "particles-js"];
  const heavy = heavyMarkers.some((s) => html.includes(s));
  if (html.includes("swiper") || html.includes("slick-") || html.includes("splide") || html.includes("embla")) captureFixes.push("freeze_carousel_slide0");
  if (html.includes("onetrust-") || html.includes("ot-sdk-")) captureFixes.push("dismiss_onetrust");
  if (html.includes("cybotcookiebot")) captureFixes.push("dismiss_cookiebot");
  return { nodes, heavy, simpleStatic: nodes < 1500 && !heavy, captureFixes };
})()`;
