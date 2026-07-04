import type { Page } from "playwright";
import type { PatternHints } from "./patternIndex.js";

/** Actionable fix bundles keyed by matched pattern id (frozen data). */
export const PATTERN_FIXES: Record<string, { capture?: string[]; generate?: string[] }> = {
  // Carousels — freeze slide 0 at capture, flatten track at generate
  carousel_swiper: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_slick: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_splide: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_embla: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_bootstrap: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_owl: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_flickity: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_glide: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_glider: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_keen: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_lightslider: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_tiny: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_siema: { capture: ["freeze_carousel_slide0"], generate: ["carousel_flatten"] },
  carousel_pagination_bullets: { generate: ["carousel_flatten"] },

  // Scroll / entrance animations
  anim_aos: { generate: ["scroll_anim_freeze"] },
  anim_wow: { generate: ["scroll_anim_freeze"] },
  anim_sal: { generate: ["scroll_anim_freeze"] },
  anim_scrollreveal: { generate: ["scroll_anim_freeze"] },
  anim_animate_css: { generate: ["scroll_anim_freeze"] },
  anim_gsap_scrolltrigger: { generate: ["scroll_anim_freeze"] },
  anim_locomotive: { generate: ["scroll_anim_freeze", "parallax_to_scroll"] },
  anim_lenis: { generate: ["scroll_anim_freeze"] },
  anim_rellax: { generate: ["parallax_to_scroll"] },
  anim_luxy: { generate: ["parallax_to_scroll"] },

  // Lottie / Rive
  lottie_widget: { generate: ["lottie_static_frame"] },
  anim_rive: { generate: ["lottie_static_frame"] },

  // Consent overlays — dismiss before snapshot
  consent_onetrust: { capture: ["dismiss_onetrust"] },
  consent_cookiebot: { capture: ["dismiss_cookiebot"] },
  consent_iubenda: { capture: ["dismiss_iubenda"] },
  consent_usercentrics: { capture: ["dismiss_usercentrics"] },
  consent_termly: { capture: ["dismiss_termly"] },
  consent_klaro: { capture: ["dismiss_klaro"] },
  consent_quantcast: { capture: ["dismiss_quantcast"] },
  consent_trustarc: { capture: ["dismiss_trustarc"] },
  consent_didomi: { capture: ["dismiss_didomi"] },
  consent_osano: { capture: ["dismiss_osano"] },
  consent_complianz: { capture: ["dismiss_complianz"] },
  consent_cookieyes: { capture: ["dismiss_cookieyes"] },
  platform_cmp_consent: { capture: ["dismiss_cmp_generic"] },

  // Chat widgets — hide floating UI during capture
  chat_intercom: { capture: ["hide_chat_widget"], generate: ["chat_widget_hidden"] },
  chat_hubspot: { capture: ["hide_chat_widget"], generate: ["chat_widget_hidden"] },
  chat_crisp: { capture: ["hide_chat_widget"], generate: ["chat_widget_hidden"] },
  chat_drift: { capture: ["hide_chat_widget"], generate: ["chat_widget_hidden"] },
  chat_zendesk: { capture: ["hide_chat_widget"], generate: ["chat_widget_hidden"] },
  chat_tawk: { capture: ["hide_chat_widget"], generate: ["chat_widget_hidden"] },
  chat_olark: { capture: ["hide_chat_widget"], generate: ["chat_widget_hidden"] },
  chat_livechat: { capture: ["hide_chat_widget"], generate: ["chat_widget_hidden"] },
  chat_freshchat: { capture: ["hide_chat_widget"], generate: ["chat_widget_hidden"] },
  chat_help_scout: { capture: ["hide_chat_widget"], generate: ["chat_widget_hidden"] },
  chat_gorgias: { capture: ["hide_chat_widget"], generate: ["chat_widget_hidden"] },

  // Captcha badges
  captcha_recaptcha: { capture: ["hide_captcha_badge"], generate: ["captcha_badge_hidden"] },
  captcha_hcaptcha: { capture: ["hide_captcha_badge"], generate: ["captcha_badge_hidden"] },

  // Scheduling embeds — static placeholder in clone
  scheduling_calendly: { generate: ["embed_static_block"] },
  scheduling_cal_com: { generate: ["embed_static_block"] },

  // Platforms
  platform_shopify: { generate: ["shopify_section_stable"] },

  // Marquees — CSS loop instead of JS track
  marquee_generic: { generate: ["marquee_css_loop"] },
  marquee_rfm: { generate: ["marquee_css_loop"] },
};

export type ResolvedFixes = {
  capture: Set<string>;
  generate: Set<string>;
  matchedIds: string[];
};

export function resolveFixes(hints: PatternHints): ResolvedFixes {
  const capture = new Set<string>();
  const generate = new Set<string>();
  for (const m of hints.matches) {
    const fx = PATTERN_FIXES[m.id];
    if (!fx) continue;
    for (const c of fx.capture ?? []) capture.add(c);
    for (const g of fx.generate ?? []) generate.add(g);
  }
  return {
    capture,
    generate,
    matchedIds: hints.matches.map((m) => m.id),
  };
}

const CHAT_SELECTORS = [
  "#intercom-container", ".intercom-lightweight-app", "#hubspot-messages-iframe-container",
  ".crisp-client", "#drift-widget", "#launcher", ".zEWidget-launcher", "#tawk-bubble-container",
  "#olark-wrapper", "#chat-widget-container", "#fc_frame", ".BeaconContainer",
  "#gorgias-chat-container", "[data-testid='chat-widget']",
].join(",");

const CAPTCHA_SELECTORS = [
  ".grecaptcha-badge", ".h-captcha", "iframe[src*='recaptcha']", "iframe[src*='hcaptcha']",
].join(",");

/** Capture-time fixes applied in the browser before snapshot. */
export async function applyCaptureFixes(page: Page, fixes: Set<string>): Promise<void> {
  if (fixes.has("freeze_carousel_slide0")) {
    await page.evaluate(() => {
      for (const track of document.querySelectorAll(
        ".swiper-wrapper, .slick-track, .splide__list, .embla__container, .owl-stage, .flickity-slider, .glide__track, .glider-track, .keen-slider, .lightSlider, .siema, .carousel-inner, .tiny-slider",
      )) {
        const el = track as HTMLElement;
        el.style.transform = "none";
        el.style.transition = "none";
      }
    });
  }
  const consentClicks: [string, string][] = [
    ["dismiss_onetrust", "#onetrust-accept-btn-handler, .onetrust-close-btn-handler"],
    ["dismiss_cookiebot", "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll, #CybotCookiebotDialogBodyButtonAccept"],
    ["dismiss_iubenda", ".iubenda-cs-accept-btn, #iubenda-cs-banner .iubenda-cs-close-btn"],
    ["dismiss_usercentrics", "#usercentrics-root button[data-testid='uc-accept-all-button'], .uc-btn-accept"],
    ["dismiss_termly", "#termly-code-snippet-support button[data-tid='banner-accept'], .t-acceptAllButton"],
    ["dismiss_klaro", ".klaro .cm-btn-success, .klaro .cn-ok"],
    ["dismiss_quantcast", ".qc-cmp2-summary-buttons button[mode='primary'], #qcCmpButtons button:first-child"],
    ["dismiss_trustarc", "#truste-consent-button, .truste_button1"],
    ["dismiss_didomi", "#didomi-notice-agree-button, .didomi-continue-without-agreeing"],
    ["dismiss_osano", ".osano-cm-accept-all, .osano-cm-button--type_accept"],
    ["dismiss_complianz", ".cmplz-btn.cmplz-accept, .cmplz-accept"],
    ["dismiss_cookieyes", ".cky-btn-accept, .cky-consent-bar .cky-btn"],
    ["dismiss_cmp_generic", ".cmp-button.is-primary, button[id*='accept'], button[class*='accept-all']"],
  ];
  for (const [key, sel] of consentClicks) {
    if (!fixes.has(key)) continue;
    try {
      await page.locator(sel).first().click({ timeout: 800 });
    } catch { /* optional */ }
  }
  if (fixes.has("hide_chat_widget")) {
    await page.evaluate((sel) => {
      for (const el of document.querySelectorAll(sel)) (el as HTMLElement).style.setProperty("display", "none", "important");
    }, CHAT_SELECTORS);
  }
  if (fixes.has("hide_captcha_badge")) {
    await page.evaluate((sel) => {
      for (const el of document.querySelectorAll(sel)) (el as HTMLElement).style.setProperty("visibility", "hidden", "important");
    }, CAPTCHA_SELECTORS);
  }
}

/** CSS snippets appended during generation when fixes require it. */
export function generateFixCss(fixes: Set<string>): string {
  const parts: string[] = [];
  if (fixes.has("carousel_flatten")) {
    parts.push(
      "/* pattern-fix: carousel_flatten */",
      ".swiper-wrapper,.slick-track,.splide__list,.embla__container,.owl-stage,.flickity-slider,.glide__track,.glider-track,.keen-slider,.carousel-inner{transform:none!important;transition:none!important}",
    );
  }
  if (fixes.has("scroll_anim_freeze")) {
    parts.push(
      "/* pattern-fix: scroll_anim_freeze */",
      "[data-aos],[data-wow-delay],.aos-init,.aos-animate,.wow,[data-sal],[data-scroll-reveal],.scroll-reveal,.animate__animated,.gsap-marker-start,.gsap-marker-end,.gsap-marker-scroller-start,.gsap-marker-scroller-end{opacity:1!important;transform:none!important;transition:none!important;animation:none!important}",
    );
  }
  if (fixes.has("parallax_to_scroll")) {
    parts.push(
      "/* pattern-fix: parallax_to_scroll */",
      "[data-rellax-speed],[data-parallax],.rellax,.locomotive-scroll,.luxy-el{background-attachment:scroll!important;transform:none!important}",
    );
  }
  if (fixes.has("lottie_static_frame")) {
    parts.push("/* pattern-fix: lottie_static_frame */", "lottie-player,canvas.rive{animation-play-state:paused!important}");
  }
  if (fixes.has("shopify_section_stable")) {
    parts.push("/* pattern-fix: shopify_section_stable */", ".shopify-section{visibility:visible!important}");
  }
  if (fixes.has("chat_widget_hidden")) {
    parts.push("/* pattern-fix: chat_widget_hidden */", `${CHAT_SELECTORS}{display:none!important;visibility:hidden!important}`);
  }
  if (fixes.has("captcha_badge_hidden")) {
    parts.push("/* pattern-fix: captcha_badge_hidden */", `${CAPTCHA_SELECTORS}{visibility:hidden!important;opacity:0!important;pointer-events:none!important}`);
  }
  if (fixes.has("embed_static_block")) {
    parts.push(
      "/* pattern-fix: embed_static_block */",
      ".calendly-inline-widget,.cal-embed,[data-cal-link]{min-height:320px;background:#f4f4f5;border-radius:8px}",
    );
  }
  if (fixes.has("marquee_css_loop")) {
    parts.push("/* pattern-fix: marquee_css_loop */", ".rfm-marquee,.marquee,.rfm-initial-child-container{animation-play-state:running!important}");
  }
  return parts.length ? parts.join("\n") + "\n" : "";
}
