#!/usr/bin/env node
/**
 * Mine homepage fingerprints from Tranco top-N domains and suggest catalog entries.
 * Read-only HTTP GETs; outputs data/top-site-fingerprints.json + stdout summary.
 *
 * Usage: node scripts/mine-top-site-patterns.mjs [--limit=100] [--concurrency=8]
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_PATH = join(ROOT, "data/pattern-catalog.json");
const OUT_PATH = join(ROOT, "data/top-site-fingerprints.json");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);
const LIMIT = Math.min(500, Math.max(10, parseInt(args.limit ?? "100", 10)));
const CONCURRENCY = Math.min(16, Math.max(1, parseInt(args.concurrency ?? "8", 10)));
const MINE_SUBPAGES = args["mine-subpages"] !== "false";
const UA =
  "Mozilla/5.0 (compatible; DittoPatternMiner/1.0; +https://github.com/ion-design/ditto.site)";

/** Curated fallback if Tranco fetch fails (approx global top properties). */
const FALLBACK_TOP = [
  "google.com", "youtube.com", "facebook.com", "instagram.com", "chatgpt.com", "x.com",
  "reddit.com", "amazon.com", "wikipedia.org", "linkedin.com", "microsoft.com", "apple.com",
  "netflix.com", "tiktok.com", "pinterest.com", "whatsapp.com", "live.com", "office.com",
  "bing.com", "yahoo.com", "ebay.com", "zoom.us", "github.com", "stackoverflow.com",
  "adobe.com", "salesforce.com", "paypal.com", "spotify.com", "twitch.tv", "discord.com",
  "cnn.com", "nytimes.com", "bbc.com", "bbc.co.uk", "weather.com", "imdb.com", "etsy.com",
  "indeed.com", "chase.com", "wellsfargo.com", "bankofamerica.com", "roblox.com", "canva.com",
  "dropbox.com", "medium.com", "quora.com", "wordpress.com", "cloudflare.com", "mozilla.org",
  "walmart.com", "target.com", "bestbuy.com", "homedepot.com", "costco.com", "nike.com",
  "adidas.com", "zara.com", "shein.com", "aliexpress.com", "booking.com", "airbnb.com",
  "expedia.com", "tripadvisor.com", "uber.com", "lyft.com", "doordash.com", "grubhub.com",
  "stripe.com", "shopify.com", "squarespace.com", "wix.com", "notion.so", "figma.com",
  "slack.com", "atlassian.com", "hubspot.com", "mailchimp.com", "zendesk.com", "intercom.com",
  "okta.com", "cisco.com", "oracle.com", "ibm.com", "intel.com", "nvidia.com", "tesla.com",
  "samsung.com", "sony.com", "playstation.com", "steampowered.com", "epicgames.com",
  "craigslist.org", "yelp.com", "glassdoor.com", "monster.com", "usps.com", "ups.com", "fedex.com",
  "archive.org", "w3.org", "python.org", "npmjs.com", "docker.com", "vercel.com", "netlify.com",
  "heroku.com", "digitalocean.com", "aws.amazon.com", "azure.com", "cloud.google.com",
];

async function fetchTrancoTop(n) {
  try {
    const meta = await fetch("https://tranco-list.eu/api/lists/date/latest", {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(20_000),
    });
    if (!meta.ok) throw new Error(`meta ${meta.status}`);
    const { download } = await meta.json();
    if (!download) throw new Error("no download url");
    const r = await fetch(download, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(60_000),
    });
    if (!r.ok) throw new Error(String(r.status));
    const text = await r.text();
    const domains = text
      .split("\n")
      .slice(0, n)
      .map((line) => line.trim().split(",")[1] ?? line.trim())
      .filter(Boolean);
    if (domains.length >= 50) return domains.slice(0, n);
  } catch (e) {
    console.warn("Tranco fetch failed, using fallback list:", e.message);
  }
  return FALLBACK_TOP.slice(0, n);
}

function extractFingerprints(html, url) {
  const classTokens = new Map();
  const classPrefixes = new Map();
  const attrNames = new Map();
  const idPrefixes = new Map();
  const scriptHints = new Map();
  const tags = new Map();
  const generators = [];

  for (const m of html.matchAll(/\bclass=(["'])([^"']+)\1/gi)) {
    for (const tok of m[2].split(/\s+/)) {
      const t = tok.toLowerCase().trim();
      if (!t || t.length < 3 || t.length > 64) continue;
      classTokens.set(t, (classTokens.get(t) ?? 0) + 1);
      const dash = t.indexOf("-");
      const under = t.indexOf("_");
      const cut = dash > 2 ? dash : under > 2 ? under : -1;
      if (cut > 2) {
        const pre = t.slice(0, cut + 1);
        if (pre.length >= 3 && pre.length <= 20) classPrefixes.set(pre, (classPrefixes.get(pre) ?? 0) + 1);
      }
    }
  }

  for (const m of html.matchAll(/\b([a-z][a-z0-9_-]*)=(["'])/gi)) {
    const a = m[1].toLowerCase();
    if (a.startsWith("data-") || a.startsWith("aria-")) attrNames.set(a, (attrNames.get(a) ?? 0) + 1);
  }

  for (const m of html.matchAll(/\bid=(["'])([^"']+)\1/gi)) {
    const id = m[2];
    const dash = id.indexOf("-");
    if (dash > 2) {
      const pre = id.slice(0, dash + 1).toLowerCase();
      if (pre.length <= 24) idPrefixes.set(pre, (idPrefixes.get(pre) ?? 0) + 1);
    }
  }

  for (const m of html.matchAll(/<script[^>]+src=(["'])([^"']+)\1/gi)) {
    const src = m[2].toLowerCase();
    for (const hint of [
      "swiper", "slick", "splide", "gsap", "jquery", "bootstrap", "react", "vue", "angular",
      "next", "gtm.js", "googletagmanager", "fbevents", "hotjar", "segment", "mixpanel",
      "fullstory", "clarity", "optimizely", "vwo", "recaptcha", "stripe", "paypal",
      "shopify", "magento", "hubspot", "marketo", "pardot", "intercom", "drift", "zendesk",
      "cookiebot", "onetrust", "termly", "cloudflare", "cdn.ampproject", "lottie", "rive",
      "mapbox", "leaflet", "youtube", "vimeo", "plyr", "datatables", "aos", "wow", "lenis",
      "framer", "webflow", "elementor", "wp-includes", "wp-content", "squarespace",
    ]) {
      if (src.includes(hint)) scriptHints.set(hint, (scriptHints.get(hint) ?? 0) + 1);
    }
  }

  for (const m of html.matchAll(/<meta[^>]+(?:name|property)=(["'])generator\1[^>]+content=(["'])([^"']+)\2/gi)) {
    generators.push(m[3].toLowerCase());
  }
  for (const m of html.matchAll(/<meta[^>]+content=(["'])([^"']+)\1[^>]+(?:name|property)=(["'])generator\3/gi)) {
    generators.push(m[2].toLowerCase());
  }

  for (const m of html.matchAll(/<([a-z][a-z0-9-]*)[\s>]/gi)) {
    const t = m[1].toLowerCase();
    if (t.includes("-")) tags.set(t, (tags.get(t) ?? 0) + 1);
  }

  return { classTokens, classPrefixes, attrNames, idPrefixes, scriptHints, tags, generators, url };
}

/** Subpages commonly mined for checkout/login/product fingerprints. */
const SUBPAGE_PATHS = ["/login", "/signin", "/checkout", "/cart", "/pricing", "/products", "/contact"];

/** Script-hint → DOM signature candidates (when script src matches, look for these in HTML). */
const SCRIPT_HINT_DOM = {
  next: { id: "platform_next_script", kind: "platform", match: { classTokens: ["__next"], idPrefixes: ["__next"] } },
  react: { id: "platform_react_script", kind: "platform", match: { classTokens: ["react-root"] } },
  stripe: { id: "pay_stripe_script", kind: "form", match: { classPrefixes: ["StripeElement", "stripe-"] } },
  intercom: { id: "chat_intercom_script", kind: "chat_widget", match: { classPrefixes: ["intercom-"], idPrefixes: ["intercom-"] } },
  hubspot: { id: "form_hubspot_script", kind: "form", match: { classPrefixes: ["hubspot-"], classTokens: ["hubspot-form"] } },
  onetrust: { id: "consent_onetrust_script", kind: "consent", match: { classPrefixes: ["onetrust-"], idPrefixes: ["onetrust-"] } },
  googletagmanager: { id: "analytics_gtm_script", kind: "embed", match: { idPrefixes: ["GTM-"] } },
  recaptcha: { id: "captcha_recaptcha_script", kind: "form", match: { classTokens: ["g-recaptcha"] } },
  swiper: { id: "carousel_swiper_script", kind: "carousel", match: { classTokens: ["swiper"], classPrefixes: ["swiper-"] } },
};

async function fetchSite(domain, extraPaths = []) {
  const urls = [`https://${domain}/`, `https://www.${domain}/`];
  for (const path of extraPaths) {
    urls.push(`https://${domain}${path}`, `https://www.${domain}${path}`);
  }
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html" },
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
      });
      if (!r.ok) continue;
      const ct = r.headers.get("content-type") ?? "";
      if (!ct.includes("text/html") && !ct.includes("application/xhtml")) continue;
      const html = (await r.text()).slice(0, 800_000);
      return { domain, url: r.url, ok: true, html, bytes: html.length };
    } catch {
      /* try next */
    }
  }
  return { domain, ok: false };
}

async function pool(items, limit, fn) {
  const out = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return out;
}

function mergeMaps(into, from, weight = 1) {
  for (const [k, v] of from) into.set(k, (into.get(k) ?? 0) + v * weight);
}

function catalogSignatures(catalog) {
  const tokens = new Set();
  const prefixes = new Set();
  const attrs = new Set();
  const ids = new Set();
  const scriptKeys = new Set();
  for (const p of catalog.patterns) {
    for (const t of p.match.classTokens ?? []) tokens.add(t.toLowerCase());
    for (const pre of p.match.classPrefixes ?? []) prefixes.add(pre.toLowerCase());
    for (const a of p.match.attrNames ?? []) attrs.add(a.toLowerCase());
    for (const pre of p.match.idPrefixes ?? []) ids.add(pre.toLowerCase());
    for (const part of p.id.split("_")) if (part.length > 3) scriptKeys.add(part);
  }
  return { tokens, prefixes, attrs, ids, scriptKeys };
}

/** Generic Tailwind/CSS utility prefixes — never auto-add to catalog. */
const MINED_PREFIX_DENY = new Set([
  "flex-", "text-", "top-", "inset-", "pointer-", "rich-", "video-", "skeleton-",
  "max-", "gap-", "rounded-", "justify-", "items-", "font-", "color-", "weight-",
  "appearance-", "focus-", "image-", "media-", "footer-", "nav-", "btn-", "cta-",
  "global-", "standard-", "css-", "tab_", "nav_", "styles_",
]);

/** High-signal design systems observed on Tranco top sites (from fingerprint report). */
const TOP_SITE_PLATFORMS = [
  { id: "platform_aem", kind: "platform", flags: ["platform_aem", "third_party_widget"], match: { classPrefixes: ["aem-"] }, note: "Adobe Experience Manager" },
  { id: "platform_bbc_ssrcss", kind: "platform", flags: ["platform_bbc"], match: { classPrefixes: ["ssrcss-"] }, note: "BBC SSRCSS" },
  { id: "platform_github_primer", kind: "platform", flags: ["platform_github"], match: { classPrefixes: ["primer_brand__"] }, note: "GitHub Primer design system" },
  { id: "platform_airbnb", kind: "platform", flags: ["platform_airbnb"], match: { classPrefixes: ["atm_"] }, note: "Airbnb design system" },
  { id: "platform_nike", kind: "platform", flags: ["platform_nike"], match: { classPrefixes: ["ncss-"] }, note: "Nike.com NCSS" },
  { id: "platform_samsung_oneui", kind: "platform", flags: ["platform_samsung"], match: { classPrefixes: ["sui-"] }, note: "Samsung One UI web" },
  { id: "platform_cmp_consent", kind: "consent", flags: ["consent_overlay", "third_party_widget"], match: { classPrefixes: ["cmp-"] }, note: "IAB CMP / consent managers" },
  { id: "platform_google_material", kind: "platform", flags: ["platform_google"], match: { classPrefixes: ["dwg-"] }, note: "Google Material Web (dwg-)" },
];

/** Known high-value patterns derived from top-site prevalence + Wappalyzer-style libs. */
const CURATED_ADDITIONS = [
  ...TOP_SITE_PLATFORMS,
  { id: "analytics_gtm", kind: "embed", flags: ["third_party_widget"], match: { classTokens: ["gtm"], attrNames: ["data-gtm"], idPrefixes: ["GTM-"] }, note: "Google Tag Manager" },
  { id: "analytics_ga4", kind: "embed", flags: ["third_party_widget"], match: { attrNames: ["data-gtag", "data-analytics"], classTokens: ["google-analytics"] }, note: "Google Analytics" },
  { id: "analytics_hotjar", kind: "embed", flags: ["third_party_widget"], match: { classPrefixes: ["hotjar-"], idPrefixes: ["hotjar-"] }, note: "Hotjar session replay" },
  { id: "analytics_clarity", kind: "embed", flags: ["third_party_widget"], match: { classTokens: ["clarity"], idPrefixes: ["clarity-"] }, note: "Microsoft Clarity" },
  { id: "analytics_segment", kind: "embed", flags: ["third_party_widget"], match: { classTokens: ["segment-track"], attrNames: ["data-segment"] }, note: "Segment" },
  { id: "analytics_fullstory", kind: "embed", flags: ["third_party_widget"], match: { classPrefixes: ["fs-"], idPrefixes: ["fullstory"] }, note: "FullStory" },
  { id: "ab_optimizely", kind: "embed", flags: ["third_party_widget", "deferred_interactive"], match: { classPrefixes: ["optly-"], classTokens: ["optimizely"] }, note: "Optimizely" },
  { id: "ab_vwo", kind: "embed", flags: ["third_party_widget"], match: { classPrefixes: ["vwo-"], idPrefixes: ["vwo-"] }, note: "VWO" },
  { id: "captcha_recaptcha", kind: "form", flags: ["third_party_widget", "deferred_interactive"], match: { classTokens: ["g-recaptcha", "grecaptcha-badge"], classPrefixes: ["rc-"] }, note: "reCAPTCHA" },
  { id: "captcha_hcaptcha", kind: "form", flags: ["third_party_widget", "deferred_interactive"], match: { classTokens: ["h-captcha"], classPrefixes: ["hcaptcha"] }, note: "hCaptcha" },
  { id: "pay_stripe_elements", kind: "form", flags: ["third_party_widget", "deferred_interactive"], match: { classPrefixes: ["StripeElement", "stripe-"], classTokens: ["StripeElement"] }, note: "Stripe Elements" },
  { id: "pay_paypal_buttons", kind: "form", flags: ["third_party_widget", "deferred_interactive"], match: { classTokens: ["paypal-buttons", "paypal-button-container"], "tags": ["paypal-button"] }, note: "PayPal buttons" },
  { id: "platform_drupal", kind: "platform", flags: ["platform_drupal"], match: { classTokens: ["drupal", "block-system"], classPrefixes: ["block-"], attrNames: ["data-drupal-messages"] }, note: "Drupal" },
  { id: "platform_joomla", kind: "platform", flags: ["platform_joomla"], match: { classTokens: ["joomla", "com-content"], classPrefixes: ["mod_"] }, note: "Joomla" },
  { id: "platform_blogger", kind: "platform", flags: ["platform_google"], match: { classTokens: ["blogger", "post-body"], idPrefixes: ["Blog1"] }, note: "Blogger" },
  { id: "platform_tumblr", kind: "platform", flags: ["platform_tumblr"], match: { classTokens: ["tumblr", "post-micro"], classPrefixes: ["tumblr-"] }, note: "Tumblr" },
  { id: "platform_medium", kind: "platform", flags: ["platform_medium"], match: { classPrefixes: ["pw-"], classTokens: ["metabar", "screenContent"] }, note: "Medium" },
  { id: "platform_substack", kind: "platform", flags: ["platform_substack"], match: { classTokens: ["substack", "post-content"], classPrefixes: ["substack-"] }, note: "Substack" },
  { id: "platform_nuxt", kind: "platform", flags: ["platform_nuxt"], match: { classTokens: ["nuxt-progress"], idPrefixes: ["__nuxt"] }, note: "Nuxt" },
  { id: "platform_remix", kind: "platform", flags: ["platform_remix"], match: { idPrefixes: ["__remix"] }, note: "Remix" },
  { id: "platform_sveltekit", kind: "platform", flags: ["platform_svelte"], match: { classTokens: ["svelte-"], idPrefixes: ["svelte-"] }, note: "SvelteKit" },
  { id: "platform_vue", kind: "platform", flags: ["platform_vue"], match: { classTokens: ["v-application", "v-main"], attrNames: ["data-v-app"] }, note: "Vue / Vuetify" },
  { id: "platform_angular", kind: "platform", flags: ["platform_angular"], match: { classTokens: ["ng-star-inserted", "mat-app-background"], attrNames: ["ng-version"] }, note: "Angular / Material" },
  { id: "platform_react_root", kind: "platform", flags: ["platform_react"], match: { classTokens: ["react-root"] }, note: "CRA-style React root" },
  { id: "platform_wordpress_classic", kind: "platform", flags: ["platform_wordpress"], match: { classTokens: ["wp-site-blocks", "wp-block-post-content"], classPrefixes: ["wp-block-"] }, note: "WordPress block theme" },
  { id: "platform_craft", kind: "platform", flags: ["platform_craft"], match: { classTokens: ["craftcms"], idPrefixes: ["craft-"] }, note: "Craft CMS" },
  { id: "platform_contentful", kind: "platform", flags: ["platform_contentful"], match: { attrNames: ["data-contentful-field-id"] }, note: "Contentful preview" },
  { id: "platform_sanity", kind: "platform", flags: ["platform_sanity"], match: { attrNames: ["data-sanity"] }, note: "Sanity" },
  { id: "platform_stripe_press", kind: "platform", flags: ["platform_stripe"], match: { classPrefixes: ["Stripe-"], classTokens: ["StripeSite"] }, note: "Stripe marketing sites" },
  { id: "nav_headroom", kind: "nav_toggle", flags: ["motion_lib"], match: { classTokens: ["headroom", "headroom--pinned", "headroom--unpinned"] }, note: "Headroom.js sticky nav" },
  { id: "nav_sticky_header", kind: "nav_toggle", flags: ["nav_toggle"], match: { classTokens: ["sticky-header", "site-header--sticky", "header-sticky"] }, note: "CSS sticky headers" },
  { id: "search_algolia", kind: "form", flags: ["deferred_interactive", "third_party_widget"], match: { classPrefixes: ["ais-"], classTokens: ["algolia-autocomplete"] }, note: "Algolia InstantSearch" },
  { id: "search_elastic", kind: "form", flags: ["deferred_interactive"], match: { classPrefixes: ["elastic-"], classTokens: ["search-ui"] }, note: "Elastic Site Search" },
  { id: "auth_auth0", kind: "form", flags: ["third_party_widget", "deferred_interactive"], match: { classTokens: ["auth0-lock", "auth0-login"], classPrefixes: ["auth0-"] }, note: "Auth0 Lock" },
  { id: "auth_clerk", kind: "form", flags: ["third_party_widget"], match: { classPrefixes: ["cl-"], classTokens: ["cl-rootBox"], attrNames: ["data-clerk"] }, note: "Clerk auth" },
  { id: "auth_firebaseui", kind: "form", flags: ["third_party_widget"], match: { classTokens: ["firebaseui-container", "firebaseui-id-page-sign-in"] }, note: "Firebase UI" },
  { id: "social_sharethis", kind: "embed", flags: ["third_party_widget"], match: { classTokens: ["sharethis-inline-share-buttons"], idPrefixes: ["st-"] }, note: "ShareThis" },
  { id: "social_addtoany", kind: "embed", flags: ["third_party_widget"], match: { classTokens: ["a2a_kit", "addtoany_share"] }, note: "AddToAny share" },
  { id: "video_wistia", kind: "video_player", flags: ["deferred_interactive"], match: { classTokens: ["wistia_embed", "w-video-wrapper"], classPrefixes: ["wistia_"] }, note: "Wistia" },
  { id: "video_jwplayer_ext", kind: "video_player", flags: ["deferred_interactive"], match: { classTokens: ["jwplayer", "jw-reset"], classPrefixes: ["jw-"] }, note: "JW Player (extended)" },
  { id: "carousel_pagination_bullets", kind: "carousel", flags: ["deferred_interactive", "gallery"], match: { classTokens: ["swiper-pagination", "slick-dots", "splide__pagination"] }, note: "Carousel pagination (shared)" },
  { id: "lazy_lazyload", kind: "scroll_animation", flags: ["deferred_interactive"], match: { classTokens: ["lazyload", "lazyloaded", "lazyloading"], attrNames: ["data-src", "data-lazy"] }, note: "LazyLoad.js / native lazy patterns" },
  { id: "modal_micromodal", kind: "lightbox", flags: ["deferred_interactive"], match: { classTokens: ["modal", "modal__overlay", "micromodal-slide"], classPrefixes: ["modal__"] }, note: "Micromodal / generic modals" },
  { id: "modal_fancybox_legacy", kind: "lightbox", flags: ["deferred_interactive", "gallery"], match: { classTokens: ["fancybox-container", "fancybox-slide"] }, note: "Fancybox 3+" },
  { id: "ecom_stripe_buy", kind: "form", flags: ["ecommerce", "third_party_widget"], match: { classTokens: ["stripe-buy-button"], tags: ["stripe-buy-button"] }, note: "Stripe Buy Button" },
  { id: "ecom_snipcart", kind: "platform", flags: ["ecommerce", "platform_snipcart"], match: { classTokens: ["snipcart", "snipcart-modal"], classPrefixes: ["snipcart-"] }, note: "Snipcart" },
  { id: "ecom_gumroad", kind: "platform", flags: ["ecommerce"], match: { classTokens: ["gumroad-product-embed"], classPrefixes: ["gumroad-"] }, note: "Gumroad embed" },
  { id: "consent_iubenda", kind: "consent", flags: ["consent_overlay", "third_party_widget"], match: { classPrefixes: ["iubenda-"], idPrefixes: ["iubenda-"] }, note: "Iubenda cookie solution" },
  { id: "consent_usercentrics", kind: "consent", flags: ["consent_overlay", "third_party_widget"], match: { classPrefixes: ["uc-"], idPrefixes: ["usercentrics-"] }, note: "Usercentrics CMP" },
  { id: "chat_freshchat", kind: "chat_widget", flags: ["third_party_widget"], match: { classPrefixes: ["fc-"], idPrefixes: ["freshchat"] }, note: "Freshchat / Freshworks" },
  { id: "chat_help_scout", kind: "chat_widget", flags: ["third_party_widget"], match: { classPrefixes: ["BeaconContainer"], classTokens: ["helpscout-beacon"] }, note: "Help Scout Beacon" },
  { id: "scheduling_calendly", kind: "embed", flags: ["third_party_widget", "deferred_interactive"], match: { classTokens: ["calendly-inline-widget"], tags: ["calendly-inline-widget"] }, note: "Calendly embed" },
  { id: "scheduling_cal_com", kind: "embed", flags: ["third_party_widget"], match: { classTokens: ["cal-embed"], tags: ["cal-inline"] }, note: "Cal.com embed" },
  { id: "newsletter_beehiiv", kind: "form", flags: ["third_party_widget"], match: { classPrefixes: ["beehiiv-"], classTokens: ["beehiiv-embed"] }, note: "Beehiiv newsletter" },
  { id: "newsletter_convertkit", kind: "form", flags: ["third_party_widget"], match: { classTokens: ["formkit-form", "seva-form"], classPrefixes: ["formkit-"] }, note: "ConvertKit / Kit" },
];

function suggestFromMining(agg, sig, minSites = 4) {
  const suggestions = [];
  const prefixSites = new Map();
  for (const [pre, count] of agg.classPrefixes) {
    if (sig.prefixes.has(pre)) continue;
    if (MINED_PREFIX_DENY.has(pre)) continue;
    if (count >= minSites && /^[a-z][a-z0-9_-]{2,18}$/.test(pre)) {
      prefixSites.set(pre, count);
    }
  }
  for (const [pre, count] of [...prefixSites.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    suggestions.push({
      id: `mined_prefix_${pre.replace(/[^a-z0-9]/g, "_").replace(/_+$/, "")}`,
      kind: "platform",
      flags: ["third_party_widget"],
      match: { classPrefixes: [pre] },
      note: `Class prefix "${pre}" on ${count} top sites`,
      siteCount: count,
    });
  }
  return suggestions;
}

function mergeCatalog(existing, additions) {
  const byId = new Map(existing.patterns.map((p) => [p.id, p]));
  const added = [];
  for (const p of additions) {
    const { note, siteCount, ...def } = p;
    if (byId.has(def.id)) continue;
    byId.set(def.id, def);
    added.push(def.id);
  }
  const patterns = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  return { patterns, added };
}

async function main() {
  const apply = args.apply === "true";
  console.log(`Fetching Tranco top ${LIMIT}…`);
  const domains = await fetchTrancoTop(LIMIT);
  console.log(`Probing ${domains.length} domains (concurrency ${CONCURRENCY})…`);

  const results = await pool(domains, CONCURRENCY, (d) => fetchSite(d, MINE_SUBPAGES ? SUBPAGE_PATHS : []));
  const ok = results.filter((r) => r.ok);
  console.log(`Fetched ${ok.length}/${domains.length} homepages`);

  const agg = {
    classTokens: new Map(),
    classPrefixes: new Map(),
    attrNames: new Map(),
    idPrefixes: new Map(),
    scriptHints: new Map(),
    tags: new Map(),
  };
  const perSite = [];

  for (const r of ok) {
    const fp = extractFingerprints(r.html, r.url);
    perSite.push({
      domain: r.domain,
      url: r.url,
      bytes: r.bytes,
      topClasses: [...fp.classTokens.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => k),
      scriptHints: [...fp.scriptHints.keys()],
      generators: fp.generators,
    });
    mergeMaps(agg.classTokens, fp.classTokens);
    mergeMaps(agg.classPrefixes, fp.classPrefixes);
    mergeMaps(agg.attrNames, fp.attrNames);
    mergeMaps(agg.idPrefixes, fp.idPrefixes);
    mergeMaps(agg.scriptHints, fp.scriptHints);
    mergeMaps(agg.tags, fp.tags);
  }

  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const sig = catalogSignatures(catalog);
  const mined = suggestFromMining(
    {
      classPrefixes: new Map([...agg.classPrefixes.entries()].map(([k, v]) => [k, Math.min(v, ok.length)])),
    },
    sig,
    Math.max(3, Math.floor(ok.length * 0.04)),
  );

  const scriptReport = [...agg.scriptHints.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
  const prefixReport = [...agg.classPrefixes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);

  const scriptDomCandidates = [];
  const catalogIds = new Set(catalog.patterns.map((p) => p.id));
  for (const [hint, count] of scriptReport) {
    const dom = SCRIPT_HINT_DOM[hint];
    if (dom && count >= 2 && !catalogIds.has(dom.id)) {
      scriptDomCandidates.push({ ...dom, flags: ["third_party_widget"], note: `Script hint "${hint}" on ${count} pages`, siteCount: count });
    }
  }

  const report = {
    minedAt: new Date().toISOString(),
    limit: LIMIT,
    mineSubpages: MINE_SUBPAGES,
    domainsAttempted: domains.length,
    domainsFetched: ok.length,
    scriptHints: scriptReport,
    scriptDomCandidates,
    topClassPrefixes: prefixReport,
    minedSuggestions: mined,
    perSiteSample: perSite.slice(0, 30),
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + "\n");

  const includeMined = args["include-mined-prefixes"] === "true";
  const additions = [...CURATED_ADDITIONS, ...scriptDomCandidates];
  if (includeMined) {
    for (const m of mined.slice(0, 8)) additions.push(m);
  }

  const { patterns, added } = mergeCatalog(catalog, additions);
  console.log("\nScript hints (top):");
  for (const [k, v] of scriptReport.slice(0, 15)) console.log(`  ${v}x ${k}`);
  console.log("\nClass prefixes (top, not in catalog):");
  for (const [k, v] of prefixReport.filter(([k]) => !sig.prefixes.has(k)).slice(0, 12)) {
    console.log(`  ${v} sites  ${k}`);
  }
  console.log(`\nCurated + mined additions: ${additions.length} candidates, ${added.length} new ids`);

  if (apply && added.length) {
    catalog.version = (catalog.version ?? 1) + 1;
    catalog.patterns = patterns;
    catalog.description =
      (catalog.description ?? "") +
      " Expanded via scripts/mine-top-site-patterns.mjs (Tranco top sites + curated SaaS/ecom/analytics fingerprints).";
    writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n");
    console.log(`\nApplied ${added.length} patterns to ${CATALOG_PATH} (v${catalog.version})`);
    console.log("Run: node --import tsx src/knowledge/patternIndex.ts --write-lock");
  } else if (added.length) {
    console.log("\nRe-run with --apply=true to merge into pattern-catalog.json");
    console.log("New ids:", added.slice(0, 20).join(", "), added.length > 20 ? "…" : "");
  }

  console.log(`\nFull report: ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
