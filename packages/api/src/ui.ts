/** Minimal dev/test UI served at GET /. Self-contained (inline CSS/JS, no build). */
export const STUDIO_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ditto by ION — clone studio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    color-scheme: dark;
    --bg: #121417;
    --surface: #1a1d22;
    --surface-2: #22262c;
    --border: #2e3238;
    --gold: #e6b84a;
    --gold-dim: #c49a2e;
    --gold-glow: #e6b84a33;
    --text: #f4f4f5;
    --muted: #8b9099;
    --success: #6ee7a0;
    --error: #f87171;
    --accent: var(--gold);
    --accent-glow: var(--gold-glow);
  }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  body { margin: 0; font: 15px/1.55 "Inter", ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
  .topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; border-bottom: 1px solid var(--border); }
  .brand { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .ditto-mark { font-size: 20px; font-weight: 700; letter-spacing: -0.03em; }
  .by { font-size: 13px; font-weight: 500; color: var(--muted); }
  .ion-lockup { display: inline-flex; align-items: center; gap: 8px; }
  .ion-icon { width: 26px; height: 26px; flex-shrink: 0; }
  .ion-word { font-size: 18px; font-weight: 700; letter-spacing: 0.06em; }
  .crumb { font-size: 14px; color: var(--muted); margin-left: 4px; font-weight: 400; }
  .topbar-actions { display: flex; align-items: center; gap: 12px; }
  #score { font: 600 13px ui-monospace, monospace; color: var(--success); display: none; padding: 6px 12px; border-radius: 999px; background: #0d1f16; border: 1px solid #1f3d2a; }
  .clone-hero { padding: 28px 28px 22px; border-bottom: 1px solid var(--border); max-width: 960px; }
  .hero-lead { margin: 0 0 18px; font-size: 15px; line-height: 1.6; color: #c4c8cf; max-width: 620px; }
  .clone-bar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
  #url { flex: 1 1 280px; min-width: 200px; padding: 14px 18px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 15px; outline: none; }
  #url:focus { border-color: var(--gold-dim); box-shadow: 0 0 0 3px var(--gold-glow); }
  #url::placeholder { color: #5c6169; }
  .btn-primary { padding: 14px 24px; border-radius: 999px; border: 0; background: var(--gold); color: #121417; font: 600 15px "Inter", sans-serif; cursor: pointer; white-space: nowrap; }
  .btn-primary:hover { background: #f0c55a; }
  .btn-primary:disabled { opacity: .55; cursor: wait; }
  .mode-picker { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
  .mode { padding: 8px 16px; border-radius: 999px; border: 1px solid var(--border); background: transparent; color: var(--muted); font: 500 13px "Inter", sans-serif; cursor: pointer; }
  .mode:hover { border-color: #4a4f57; color: var(--text); }
  .mode.active { border-color: var(--gold-dim); background: #2a2418; color: var(--gold); }
  .mode-desc { font-size: 12px; color: var(--muted); margin: 0 0 8px; min-height: 1.2em; }
  .advanced-options { font-size: 13px; color: var(--muted); }
  .advanced-options summary { cursor: pointer; color: #6b7078; list-style: none; }
  .advanced-options summary::-webkit-details-marker { display: none; }
  .advanced-inner { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; margin-top: 10px; }
  label { display: flex; gap: 8px; align-items: center; color: var(--muted); font-size: 13px; cursor: pointer; user-select: none; }
  #cache-badge { font-size: 12px; padding: 5px 10px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); color: var(--muted); }
  #cache-badge.hit { color: var(--success); border-color: #1f3d2a; background: #0d1a12; }
  main.workspace { display: grid; grid-template-columns: 1fr 340px; height: calc(100vh - 230px); min-height: 400px; }
  #view { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid var(--border); }
  #tabs { display: flex; gap: 6px; padding: 12px 20px; border-bottom: 1px solid var(--border); }
  #tabs a { padding: 8px 16px; border-radius: 999px; color: var(--muted); text-decoration: none; font-size: 13px; font-weight: 500; border: 1px solid transparent; }
  #tabs a:hover { color: var(--text); background: var(--surface); }
  #tabs a.active { background: #2a2418; color: var(--gold); border-color: var(--gold-dim); }
  .hdr-btn { padding: 8px 16px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--muted); font: 500 13px "Inter", sans-serif; cursor: pointer; }
  .hdr-btn:hover { border-color: var(--gold-dim); color: var(--text); }
  .hdr-btn.active { border-color: var(--gold-dim); background: #2a2418; color: var(--gold); }
  iframe, #frame { flex: 1; border: 0; background: #fff; min-height: 0; width: 100%; }
  #view-body { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; position: relative; }
  #loading { display: none; flex-direction: column; align-items: center; justify-content: center; gap: 20px; padding: 40px; text-align: center; position: absolute; inset: 0; z-index: 3; background: rgba(18,20,23,.75); backdrop-filter: blur(4px); }
  #loading.show { display: flex; }
  .loading-ring { width: 96px; height: 96px; transform: rotate(-90deg); }
  .loading-ring-bg { fill: none; stroke: var(--border); stroke-width: 4; }
  .loading-ring-fill { fill: none; stroke: var(--gold); stroke-width: 4; stroke-linecap: round; transition: stroke-dashoffset .5s ease; }
  #loading-title { font-size: 20px; font-weight: 600; margin: 0; }
  #loading-activity { font-size: 14px; color: var(--muted); max-width: 420px; margin: 0; }
  #loading-timer { font: 600 14px ui-monospace, monospace; color: var(--gold); margin: 0; }
  #empty { flex: 1; display: grid; place-items: center; color: var(--muted); text-align: center; padding: 48px 28px; line-height: 1.6; }
  #pattern-panel { flex: 1; overflow-y: auto; padding: 20px 24px; display: none; }
  #pattern-panel.show { display: block; }
  #audit-panel { flex: 1; overflow-y: auto; padding: 20px 24px; display: none; }
  #audit-panel.show { display: block; }
  .audit-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .audit-score { font: 700 28px/1 ui-monospace, monospace; color: var(--gold); }
  .audit-badge { padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid var(--border); }
  .audit-badge.pass { color: var(--success); border-color: #1f3d2a; background: #0d1f16; }
  .audit-badge.fail { color: var(--error); border-color: #3d1f1f; background: #1a0d0d; }
  .audit-vp { margin-bottom: 24px; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: var(--surface); }
  .audit-vp-head { padding: 10px 14px; background: var(--surface-2); border-bottom: 1px solid var(--border); font-size: 13px; display: flex; justify-content: space-between; }
  .audit-triptych { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: var(--border); }
  .audit-triptych img { width: 100%; display: block; background: #fff; }
  .audit-triptych figcaption { font-size: 10px; text-align: center; padding: 6px; color: var(--muted); background: var(--surface-2); }
  .behavior-checklist { margin: 0 0 20px; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: var(--surface); }
  .behavior-checklist-head { padding: 10px 14px; background: var(--surface-2); border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 600; display: flex; justify-content: space-between; }
  .behavior-row { display: flex; align-items: center; gap: 10px; padding: 8px 14px; font-size: 13px; border-bottom: 1px solid var(--border); }
  .behavior-row:last-child { border-bottom: 0; }
  .behavior-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .behavior-dot.pass { background: var(--success); }
  .behavior-dot.fail, .behavior-dot.pruned { background: var(--error); }
  .behavior-dot.static, .behavior-dot.na { background: var(--muted); }
  .behavior-detail { color: var(--muted); font-size: 12px; margin-left: auto; }
  .preview-badge { position: absolute; top: 12px; left: 12px; z-index: 2; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; background: #0009; color: #fff; border: 1px solid #ffffff33; pointer-events: none; }
  #scan-panel { padding: 14px 18px; border-bottom: 1px solid var(--border); max-height: 220px; overflow-y: auto; }
  #scan-panel h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; }
  #scan-panel .scan-meta { font-size: 11px; color: var(--muted); margin: 0 0 10px; }
  .route-list { display: flex; flex-direction: column; gap: 4px; }
  .route-row { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 4px 0; cursor: pointer; }
  .route-row input { accent-color: var(--gold); }
  .route-row .path { font-family: ui-monospace, monospace; color: var(--muted); font-size: 10px; }
  .route-row.entry { font-weight: 600; }
  #scan-status { font-size: 11px; color: var(--muted); margin-top: 8px; }
  #hero-routes { margin: 14px 0 4px; padding: 14px 16px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface); }
  #hero-routes h3 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
  #pattern-panel h2 { margin: 0 0 6px; font-size: 18px; font-weight: 600; }
  #pattern-panel .lead { margin: 0 0 18px; font-size: 13px; color: var(--muted); line-height: 1.55; max-width: 720px; }
  .pattern-stats { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
  .pattern-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 10px 14px; font-size: 12px; color: var(--muted); }
  .pattern-stat b { display: block; font: 700 20px/1 ui-monospace, monospace; color: var(--text); margin-bottom: 2px; }
  .pattern-graph { display: flex; flex-direction: column; gap: 12px; }
  .pattern-kind { border: 1px solid var(--border); border-radius: 14px; background: var(--surface); overflow: hidden; }
  .pattern-kind-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: var(--surface-2); border-bottom: 1px solid var(--border); }
  .pattern-kind-icon { font-size: 18px; }
  .pattern-kind-title { font-weight: 600; font-size: 13px; flex: 1; text-transform: capitalize; }
  .pattern-kind-count { font: 11px ui-monospace, monospace; color: var(--muted); }
  .pattern-nodes { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 14px; }
  .pattern-node { font: 11px ui-monospace, monospace; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--muted); }
  .pattern-node.hit { border-color: var(--success); background: #0d1f16; color: var(--success); }
  .pattern-node .flags { display: block; font-size: 9px; color: #5c6169; margin-top: 3px; }
  #match-banner { margin: 0 0 14px; padding: 12px 14px; border-radius: 12px; background: #0d1f16; border: 1px solid #1f3d2a; font-size: 13px; color: var(--success); display: none; }
  #match-banner.show { display: block; }
  #sidebar { display: flex; flex-direction: column; min-height: 0; background: var(--surface); }
  .sidebar-head { padding: 18px 18px 12px; border-bottom: 1px solid var(--border); }
  .sidebar-title { font-size: 14px; font-weight: 600; margin: 0 0 4px; display: flex; align-items: center; gap: 8px; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #4b5563; }
  #progress-panel.running .status-dot { background: var(--success); box-shadow: 0 0 8px #6ee7a066; animation: pulse 1.4s ease infinite; }
  .sidebar-sub { font-size: 12px; color: var(--muted); margin: 0; }
  #progress-panel { padding: 16px 18px; border-bottom: 1px solid var(--border); }
  #progress-panel.idle { opacity: .65; }
  .timer-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
  #big-timer, #big-pct { font: 700 24px/1 ui-monospace, monospace; font-variant-numeric: tabular-nums; }
  #big-pct { color: var(--gold); }
  .bar-track { height: 4px; background: var(--border); border-radius: 99px; overflow: hidden; margin-bottom: 14px; }
  .bar-fill { height: 100%; width: 0%; background: linear-gradient(90deg, var(--gold-dim), var(--gold)); transition: width .4s ease; box-shadow: 0 0 10px var(--gold-glow); }
  #activity { font-size: 13px; color: #c4c8cf; line-height: 1.45; min-height: 2.8em; margin-bottom: 14px; }
  #activity .sub { display: block; font-size: 11px; color: var(--muted); margin-top: 4px; font-family: ui-monospace, monospace; }
  .stepper { display: flex; flex-direction: column; gap: 2px; }
  .step { display: flex; align-items: center; gap: 10px; padding: 6px 0; font-size: 12px; color: #4b5563; }
  .step.active { color: var(--gold); }
  .step.done { color: var(--success); }
  .step.fail { color: var(--error); }
  .step-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--border); flex-shrink: 0; }
  .step.active .step-dot { background: var(--gold); animation: pulse 1.4s ease infinite; }
  .step.done .step-dot { background: var(--success); }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
  .step-label { flex: 1; }
  .step-detail { font: 10px ui-monospace, monospace; color: var(--muted); max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #log { flex: 1; overflow-y: auto; padding: 12px 16px; font: 10px/1.65 ui-monospace, monospace; border-top: 1px solid var(--border); }
  #log .evt { color: var(--success); }
  #log .err { color: var(--error); }
  #log .meta { color: var(--muted); }
  @media (max-width: 900px) {
    main.workspace { grid-template-columns: 1fr; height: auto; }
    #sidebar { max-height: 300px; border-top: 1px solid var(--border); }
    #view { border-right: 0; min-height: 360px; }
  }
</style>
</head>
<body>
<header class="topbar">
  <div class="brand">
    <span class="ditto-mark">ditto</span>
    <span class="by">by</span>
    <span class="ion-lockup" aria-label="ION">
      <svg class="ion-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path fill="#E6B84A" d="M13 4h6v9h9v6h-9v9h-6v-9H4v-6h9V4z"/>
      </svg>
      <span class="ion-word">ION</span>
    </span>
    <span class="crumb">/ Clone studio</span>
  </div>
  <div class="topbar-actions">
    <button type="button" id="hdr-patterns" class="hdr-btn active">Patterns</button>
    <span id="score"></span>
  </div>
</header>
<section class="clone-hero">
  <p class="hero-lead">Paste any public URL. Ditto captures the page and builds a static Next.js clone you can preview here — without touching the live site.</p>
  <div class="clone-bar">
    <input id="url" type="text" inputmode="url" placeholder="https://example.com" autocomplete="url">
    <button type="button" id="go" class="btn-primary">Clone page →</button>
  </div>
  <div class="mode-picker" id="mode-picker">
    <button type="button" class="mode active" data-tier="production">Full quality</button>
    <button type="button" class="mode" data-tier="draft">Quick preview</button>
    <button type="button" class="mode" data-tier="dev">From cache</button>
  </div>
  <p class="mode-desc" id="tier-hint">Best fidelity — all viewports, motion, and validation.</p>
  <div id="hero-routes" hidden>
    <h3>Choose pages to replicate</h3>
    <p class="scan-meta" id="hero-scan-meta">Scanning site routes…</p>
    <div class="route-list" id="hero-route-list"></div>
  </div>
  <details class="advanced-options">
    <summary>More options</summary>
    <div class="advanced-inner">
      <label id="async-wrap"><input id="asyncVerify" type="checkbox"> Background validation</label>
      <label><input id="fresh" type="checkbox"> Skip cache</label>
      <span id="cache-badge">—</span>
    </div>
  </details>
  <select id="tier" hidden aria-hidden="true">
    <option value="production" selected>production</option>
    <option value="dev">dev</option>
    <option value="draft">draft</option>
  </select>
</section>
<main class="workspace">
  <div id="view">
    <div id="tabs">
      <a id="tab-live" href="#" class="active">Live site</a>
      <a id="tab-app" href="#">Clone preview</a>
      <a id="tab-audit" href="#">Audit</a>
      <a id="tab-patterns" href="#">Patterns</a>
      <a id="tab-json" href="#" target="_blank" hidden>JSON</a>
      <a id="tab-bundle" href="#" target="_blank" hidden>Download</a>
    </div>
    <div id="view-body">
      <span id="preview-badge" class="preview-badge" hidden>Live site</span>
      <div id="loading">
        <svg class="loading-ring" viewBox="0 0 96 96"><circle class="loading-ring-bg" cx="48" cy="48" r="42"/><circle class="loading-ring-fill" id="loading-ring-fill" cx="48" cy="48" r="42" stroke-dasharray="263.89" stroke-dashoffset="263.89"/></svg>
        <p id="loading-title">Cloning…</p>
        <p id="loading-activity">Starting</p>
        <p id="loading-timer">0:00 · 0%</p>
      </div>
      <div id="empty" hidden>Paste a URL above — the live homepage appears here instantly.</div>
      <div id="pattern-panel">
        <h2>Pattern catalog</h2>
        <p class="lead">Fingerprints for carousels, Shopify, cookie banners, analytics, and more. Matches light up green during a clone.</p>
        <div id="match-banner"></div>
        <div class="pattern-stats" id="pattern-stats"></div>
        <div class="pattern-graph" id="pattern-graph"><div class="meta">Loading…</div></div>
      </div>
      <div id="audit-panel">
        <div class="audit-head">
          <span class="audit-score" id="audit-score">—</span>
          <span class="audit-badge" id="audit-pass-badge">No audit yet</span>
        </div>
        <p class="lead" id="audit-lead">Pixel comparison of the live site vs the Next.js clone (requires Full quality + validation).</p>
        <div id="behavior-checklist" class="behavior-checklist" hidden>
          <div class="behavior-checklist-head"><span>Interaction &amp; motion</span><span id="behavior-summary" style="font-weight:400;color:var(--muted)"></span></div>
          <div id="behavior-rows"></div>
        </div>
        <div id="audit-comparisons"></div>
      </div>
      <iframe id="frame" hidden title="Site preview"></iframe>
    </div>
  </div>
  <aside id="sidebar">
    <div id="scan-panel">
      <h3>Pages to clone</h3>
      <p class="scan-meta" id="scan-meta">Enter a URL — we scan ~20 common routes before building.</p>
      <div class="route-list" id="route-list"></div>
      <p id="scan-status"></p>
    </div>
    <div class="sidebar-head">
      <p class="sidebar-title"><span class="status-dot"></span> Compiler at work</p>
      <p class="sidebar-sub" id="sidebar-status">Waiting for a URL</p>
    </div>
    <div id="progress-panel" class="idle">
      <div class="timer-row"><span id="big-timer">0:00</span><span id="big-pct">—</span></div>
      <div class="bar-track"><div class="bar-fill" id="bar-fill"></div></div>
      <div id="activity">Ready — paste a URL and click Clone page.</div>
      <div class="stepper" id="stepper">
        <div class="step" data-stage="navigate"><span class="step-dot"></span><span class="step-label">Load page</span><span class="step-detail" id="sd-navigate"></span></div>
        <div class="step" data-stage="capture"><span class="step-dot"></span><span class="step-label">Capture layout</span><span class="step-detail" id="sd-capture"></span></div>
        <div class="step" data-stage="assets"><span class="step-dot"></span><span class="step-label">Fetch assets</span><span class="step-detail" id="sd-assets"></span></div>
        <div class="step" data-stage="generate"><span class="step-dot"></span><span class="step-label">Generate app</span><span class="step-detail" id="sd-generate"></span></div>
        <div class="step" data-stage="preview"><span class="step-dot"></span><span class="step-label">Build preview</span><span class="step-detail" id="sd-preview"></span></div>
        <div class="step" data-stage="validate"><span class="step-dot"></span><span class="step-label">Validate</span><span class="step-detail" id="sd-validate"></span></div>
      </div>
    </div>
    <div id="log"><div class="meta">Event log</div></div>
  </aside>
</main>
<script>
const $ = (id) => document.getElementById(id);
const RING_C = 2 * Math.PI * 42;
const STAGES = ["navigate", "capture", "assets", "generate", "preview", "validate"];

const STAGE_FOR = {
  submitting: "navigate", queued: "navigate", clone_start: "navigate", crawl_start: "navigate", goto: "navigate",
  dismissed: "capture", captured: "capture", pseudo_states: "capture", motion_captured: "capture",
  capture_reuse: "capture", capture_done: "capture",
  css_text_parse_start: "assets", css_text_parse_done: "assets", refetch_pass: "assets", refetch_done: "assets",
  evidence_frozen: "assets", timing_summary: "assets",
  generate_start: "generate", ir_build_start: "generate", ir_built: "generate", inferred: "generate",
  app_generate_start: "generate", generated: "generate", patterns_resolved: "generate", clone_done: "generate",
  app_build_start: "preview", app_build_done: "preview", app_preview_failed: "preview",
  verify_start: "validate", build_start: "validate", build_done: "validate", verify_done: "validate", validated: "validate",
};

const BASE_PCT = {
  submitting: 1, goto: 6, captured: 10, capture_done: 22,
  refetch_done: 38, ir_built: 48, inferred: 55, patterns_resolved: 58, generated: 68,
  app_build_start: 78, app_build_done: 86, clone_done: 88,
  verify_start: 90, validated: 98, clone_failed: 100, clone_error: 100,
};

let targetPct = 0;
let displayPct = 0;
let seenEvents = 0;
let t0 = 0;
let timerId = null;
let creepId = null;
let lastEventAt = 0;
let captureVpCount = 0;
let refetchPass = 0;
let activeStage = null;
let cloneUrl = "";
let previewOk = true;
let previewFiles = 0;
let patternCatalog = null;
let matchedPatternIds = new Set();
let activeView = "live";
let previewBase = "";
let lastFinishedJobId = null;
let lastFinishedSummary = null;
let pendingPreviewJobId = null;
let lastPreviewError = "";
let livePreviewUrl = "";
let scanResult = null;
let selectedRoutePaths = new Set();
let scanTimer = null;
let liveTimer = null;
let asyncVerifyPending = false;
let activeJobId = null;
let previewMode = "live"; // live | wip | clone

const KIND_ICON = {
  carousel: "🎠", marquee: "📜", counter: "🔢", text_effect: "⌨️",
  scroll_animation: "✨", css_animation: "💫", parallax: "🌊", lottie: "🎬",
  background_effect: "🌌", video_player: "▶️", lightbox: "🖼️", platform: "🏗️",
  nav_toggle: "🍔", nav_menu: "📋", consent: "🍪", chat_widget: "💬",
  accordion: "📂", tabs: "📑", map: "🗺️", form: "📝", embed: "🔗",
  review_widget: "⭐", table: "📊",
};

function kindIcon(kind) { return KIND_ICON[kind] || "🧩"; }

function setSidebarStatus(t) {
  const el = $("sidebar-status");
  if (el) el.textContent = t;
}

function showView(name) {
  activeView = name;
  const showFrame = name === "live" || name === "preview" || (name === "loading" && (livePreviewUrl || previewBase));
  $("loading").classList.toggle("show", name === "loading");
  $("frame").hidden = !showFrame;
  $("empty").hidden = name !== "empty";
  $("pattern-panel").classList.toggle("show", name === "patterns");
  $("audit-panel").classList.toggle("show", name === "audit");
  $("tab-live").classList.toggle("active", name === "live");
  $("tab-app").classList.toggle("active", name === "preview");
  $("tab-audit").classList.toggle("active", name === "audit");
  $("tab-patterns").classList.toggle("active", name === "patterns");
  $("hdr-patterns").classList.toggle("active", name === "patterns");
  const badge = $("preview-badge");
  if (badge) {
    badge.hidden = !showFrame;
    badge.textContent = previewMode === "live" ? "Live site" : previewMode === "wip" ? "Building…" : "Next.js clone";
  }
}

function mountLivePreview(url) {
  if (!url) { showView("empty"); return; }
  livePreviewUrl = url;
  previewMode = "live";
  $("frame").src = url;
  $("frame").hidden = false;
  showView("live");
}

function mountWipPreview(jobId) {
  previewMode = "wip";
  previewBase = "/v1/clones/" + jobId;
  $("frame").src = previewBase + "/mirror-preview/?t=" + Date.now();
  $("frame").hidden = false;
  showView("loading");
}

function mountClonePreview(jobId, optimistic) {
  previewMode = "clone";
  previewBase = "/v1/clones/" + jobId;
  $("tab-app").href = previewBase + "/app-preview/";
  $("frame").src = previewBase + "/app-preview/?t=" + Date.now();
  $("frame").hidden = false;
  showView(optimistic ? "loading" : "preview");
}

async function runScan(url) {
  const status = $("scan-status");
  const meta = $("scan-meta");
  status.textContent = "Scanning site routes…";
  setSidebarStatus("Scanning " + shortHost(url));
  try {
    const r = await fetch("/v1/scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, maxRoutes: 20 }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || String(r.status));
    scanResult = d;
    selectedRoutePaths = new Set(d.suggestedPaths.length ? d.suggestedPaths : d.routes.map((rt) => rt.path));
    renderRouteList();
    const metaText = d.discovered + " routes found · " + selectedRoutePaths.size + " selected for cloning";
    meta.textContent = metaText;
    $("hero-scan-meta").textContent = metaText;
    $("hero-routes").hidden = false;
    status.textContent = "Adjust checkboxes, then click Clone page.";
    setSidebarStatus("Ready — " + selectedRoutePaths.size + " pages selected");
    log("scan: " + d.discovered + " discovered, " + d.routes.length + " shown", "evt");
  } catch (e) {
    status.textContent = "Scan failed: " + String(e).slice(0, 80);
    meta.textContent = "Could not scan — will clone homepage only.";
    selectedRoutePaths = new Set(["/"]);
    renderRouteList();
  }
}

function renderRouteList() {
  const routes = scanResult?.routes ?? [{ path: "/", label: "Home", role: "entry", suggested: true }];
  for (const listId of ["route-list", "hero-route-list"]) {
    const list = $(listId);
    if (!list) continue;
    list.innerHTML = "";
    for (const rt of routes) {
      const row = document.createElement("label");
      row.className = "route-row" + (rt.role === "entry" ? " entry" : "");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = selectedRoutePaths.has(rt.path);
      cb.disabled = rt.role === "entry";
      cb.addEventListener("change", () => {
        if (cb.checked) selectedRoutePaths.add(rt.path);
        else selectedRoutePaths.delete(rt.path);
        selectedRoutePaths.add(scanResult?.entryPath ?? "/");
        const t = (scanResult?.discovered ?? 0) + " routes found · " + selectedRoutePaths.size + " selected for cloning";
        $("scan-meta").textContent = t;
        $("hero-scan-meta").textContent = t;
        renderRouteList();
      });
      const label = document.createElement("span");
      label.textContent = rt.label;
      const path = document.createElement("span");
      path.className = "path";
      path.textContent = rt.path;
      row.appendChild(cb);
      row.appendChild(label);
      row.appendChild(path);
      list.appendChild(row);
    }
  }
}

function renderBehaviorChecklist(behavior) {
  const wrap = $("behavior-checklist");
  const rowsEl = $("behavior-rows");
  if (!behavior || !wrap || !rowsEl) { if (wrap) wrap.hidden = true; return; }
  const rows = [...(behavior.interaction?.rows || []), ...(behavior.motion?.rows || [])];
  if (!rows.length) { wrap.hidden = true; return; }
  wrap.hidden = false;
  rowsEl.innerHTML = rows.map(function(r) {
    return '<div class="behavior-row"><span class="behavior-dot ' + r.status + '"></span><span>' + r.label + '</span><span class="behavior-detail">' + (r.detail || r.status) + '</span></div>';
  }).join("");
  const ip = behavior.interaction?.pass;
  const mp = behavior.motion?.pass;
  const pr = behavior.interaction?.pruned || 0;
  let sum = (ip ? "Interaction OK" : "Interaction issues") + " · " + (mp ? "Motion OK" : "Motion issues");
  if (pr) sum += " · " + pr + " pruned";
  $("behavior-summary").textContent = sum;
}

async function loadAudit(jobId) {
  const panel = $("audit-comparisons");
  panel.innerHTML = '<div class="meta">Loading audit…</div>';
  try {
    const r = await fetch("/v1/clones/" + jobId + "/audit");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || String(r.status));
    const scoreEl = $("audit-score");
    const badge = $("audit-pass-badge");
    if (typeof d.score === "number") {
      scoreEl.textContent = d.score.toFixed(1);
      $("score").textContent = "score " + d.score.toFixed(1);
      $("score").style.display = "block";
    }
    const passed = d.stage2Pass || (d.perceptualPass && d.visualAuditPass);
    badge.textContent = d.comparisons?.length ? (passed ? "Pixel audit pass" : "Pixel diff detected") : "Validation pending";
    badge.className = "audit-badge" + (d.comparisons?.length ? (passed ? " pass" : " fail") : "");
    if (typeof d.worstDiffPct === "number") {
      $("audit-lead").textContent = "Worst viewport diff: " + (d.worstDiffPct * 100).toFixed(2) + "% — live site (left) vs Next.js clone (center) vs diff (right).";
    }
    renderBehaviorChecklist(d.behavior);
    panel.innerHTML = "";
    if (!d.comparisons?.length) {
      panel.innerHTML = '<div class="meta">No comparison images yet. Use Full quality without background validation, or wait for async verify.</div>';
      return;
    }
    for (const c of d.comparisons) {
      const block = document.createElement("div");
      block.className = "audit-vp";
      const pct = typeof c.diffPct === "number" ? (c.diffPct * 100).toFixed(2) + "% diff" : "";
      block.innerHTML =
        '<div class="audit-vp-head"><span>' + c.viewport + 'px viewport</span><span>' + pct + '</span></div>' +
        '<div class="audit-triptych">' +
          '<figure><img src="' + c.sourceUrl + '" alt="Live site"><figcaption>Live</figcaption></figure>' +
          '<figure><img src="' + c.cloneUrl + '" alt="Clone"><figcaption>Clone</figcaption></figure>' +
          '<figure><img src="' + c.diffUrl + '" alt="Diff"><figcaption>Diff</figcaption></figure>' +
        '</div>';
      panel.appendChild(block);
    }
  } catch (e) {
    panel.innerHTML = '<div class="meta">Audit unavailable: ' + e + '</div>';
  }
}

async function pollVerify(jobId) {
  for (let i = 0; i < 60; i++) {
    const r = await fetch("/v1/clones/" + jobId);
    if (!r.ok) return;
    const d = await r.json();
    if (d.verify && (d.verify.gates || d.verify.scorecard)) {
      lastFinishedSummary = { ...lastFinishedSummary, verify: d.verify };
      if (typeof d.verify.scorecard?.total === "number") {
        $("score").textContent = "score " + d.verify.scorecard.total.toFixed(1);
        $("score").style.display = "block";
      }
      void loadAudit(jobId);
      return;
    }
    await new Promise((res) => setTimeout(res, 2000));
  }
}

async function loadPatternCatalog() {
  try {
    const r = await fetch("/v1/patterns", { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    patternCatalog = await r.json();
    renderPatternGraph();
  } catch (e) {
    $("pattern-graph").innerHTML = '<div class="meta">Could not load pattern catalog: ' + e + '</div>';
  }
}

function renderPatternGraph() {
  if (!patternCatalog) return;
  const stats = $("pattern-stats");
  stats.innerHTML =
    '<div class="pattern-stat"><b>' + patternCatalog.total + '</b>patterns</div>' +
    '<div class="pattern-stat"><b>' + patternCatalog.kinds.length + '</b>families</div>' +
    '<div class="pattern-stat"><b title="' + patternCatalog.catalogHash + '">' + patternCatalog.catalogHash.slice(0, 8) + '…</b>pinned hash</div>' +
    (matchedPatternIds.size ? '<div class="pattern-stat"><b>' + matchedPatternIds.size + '</b>matched this page</div>' : '');
  const graph = $("pattern-graph");
  graph.innerHTML = "";
  for (const kind of patternCatalog.kinds) {
    const items = patternCatalog.byKind[kind] || [];
    const section = document.createElement("div");
    section.className = "pattern-kind";
    section.innerHTML =
      '<div class="pattern-kind-head">' +
        '<span class="pattern-kind-icon">' + kindIcon(kind) + '</span>' +
        '<span class="pattern-kind-title">' + kind.replace(/_/g, " ") + '</span>' +
        '<span class="pattern-kind-count">' + items.length + '</span>' +
      '</div>';
    const nodes = document.createElement("div");
    nodes.className = "pattern-nodes";
    for (const p of items) {
      const node = document.createElement("div");
      node.className = "pattern-node" + (matchedPatternIds.has(p.id) ? " hit" : "");
      node.title = JSON.stringify(p.match, null, 0);
      node.innerHTML = p.id + '<span class="flags">' + (p.flags.slice(0, 3).join(" · ") || kind) + '</span>';
      nodes.appendChild(node);
    }
    section.appendChild(nodes);
    graph.appendChild(section);
  }
  const banner = $("match-banner");
  if (matchedPatternIds.size) {
    banner.classList.add("show");
    banner.textContent = "Green nodes matched on the last clone — the compiler used these fingerprints while building the Next.js app.";
  } else {
    banner.classList.remove("show");
    banner.textContent = "";
  }
}

function applyPatternMatches(ids, platforms) {
  matchedPatternIds = new Set(ids || []);
  renderPatternGraph();
  if (platforms && platforms.length) {
    $("match-banner").classList.add("show");
    $("match-banner").textContent = "Platforms detected: " + platforms.join(", ") + ". Matched " + matchedPatternIds.size + " catalog pattern(s).";
  }
}

async function loadClonePatterns(jobId) {
  try {
    const r = await fetch("/v1/clones/" + jobId + "/files/generated/patterns.json");
    if (!r.ok) return;
    const hints = await r.json();
    applyPatternMatches((hints.matches || []).map((m) => m.id), hints.platforms || []);
  } catch { /* optional */ }
}

function fmtElapsed(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return "0:" + String(s).padStart(2, "0");
  return m + ":" + String(s).padStart(2, "0");
}

function describeEvent(ev, e) {
  if (ev === "goto") return { main: "Loading page in headless browser", sub: e.url || "" };
  if (ev === "captured") return { main: "Capturing layout at " + e.viewport + "px", sub: e.nodes + " DOM nodes · scroll " + (e.scrollHeight || "?") + "px" };
  if (ev === "dismissed") return { main: "Dismissing overlays & cookie banners", sub: (e.removed || 0) + " removed" };
  if (ev === "motion_captured") return { main: "Recording animations & Lottie", sub: "waapi " + (e.waapi||0) + " · lotties " + (e.lotties||0) + " · marquees " + (e.marquees||0) };
  if (ev === "pseudo_states") return { main: "Recovering hover/focus CSS", sub: (e.rules || 0) + " rules" };
  if (ev === "capture_done") return { main: "Capture complete — freezing evidence", sub: e.reused ? "cache hit" : "fresh capture" };
  if (ev === "refetch_pass") return { main: "Fetching cross-origin assets (pass " + ((e.pass||0)+1) + ")", sub: "" };
  if (ev === "refetch_done") return { main: "Asset recovery complete", sub: "" };
  if (ev === "css_text_parse_start") return { main: "Parsing stylesheets", sub: "" };
  if (ev === "ir_built") return { main: "Building intermediate representation", sub: (e.nodes || "") + " nodes" };
  if (ev === "inferred") return { main: "Inferring tokens, fonts & recipes", sub: (e.assets||0) + " assets · " + (e.fonts||0) + " fonts" };
  if (ev === "patterns_resolved") return { main: "Matched " + (e.matched||0) + " catalog patterns", sub: (e.platforms||[]).join(", ") || (e.ids||[]).slice(0,4).join(", ") };
  if (ev === "generated") return { main: "Generating Next.js app", sub: "" };
  if (ev === "app_build_start") return { main: "Building app preview (npm run build)", sub: "this can take a minute…" };
  if (ev === "app_build_done") return { main: e.ok ? "App preview ready" : "App preview build failed", sub: e.files ? e.files + " files · " + ((e.ms || 0)/1000).toFixed(1) + "s" : e.ms ? ((e.ms/1000).toFixed(1) + "s") : "" };
  if (ev === "app_preview_failed") return { main: "App preview failed", sub: String(e.error || "").slice(0, 80) };
  if (ev === "verify_start") return { main: "Running witness validation gates", sub: "" };
  if (ev === "validated") return { main: "Validation complete", sub: typeof e.score === "number" ? "score " + e.score.toFixed(1) : "" };
  if (ev === "clone_done") return { main: "Clone pipeline finished", sub: "" };
  const label = ev.replace(/_/g, " ");
  return { main: label.charAt(0).toUpperCase() + label.slice(1), sub: "" };
}

function pctForEvent(ev, e) {
  if (ev === "captured") {
    captureVpCount++;
    return Math.min(21, 8 + captureVpCount * 3);
  }
  if (ev === "refetch_pass") {
    refetchPass = (e.pass || 0) + 1;
    return Math.min(37, 28 + refetchPass * 2);
  }
  return BASE_PCT[ev];
}

function setStage(stage) {
  activeStage = stage;
  const idx = STAGES.indexOf(stage);
  document.querySelectorAll(".step").forEach((el) => {
    const s = el.getAttribute("data-stage");
    const si = STAGES.indexOf(s);
    el.classList.remove("active", "done");
    if (si < idx) el.classList.add("done");
    else if (si === idx) el.classList.add("active");
  });
}

function renderPct(pct) {
  const p = Math.round(Math.min(100, Math.max(0, pct)));
  $("big-pct").textContent = p + "%";
  $("bar-fill").style.width = p + "%";
  $("loading-ring-fill").style.strokeDashoffset = String(RING_C - (p / 100) * RING_C);
  $("loading-timer").textContent = fmtElapsed(Date.now() - t0) + " · " + p + "%";
}

function setActivity(desc) {
  $("activity").innerHTML = desc.main + (desc.sub ? '<span class="sub">' + desc.sub + '</span>' : "");
  $("loading-activity").textContent = desc.main + (desc.sub ? " — " + desc.sub : "");
}

function bumpEvent(ev, e) {
  lastEventAt = Date.now();
  if (ev === "app_build_done") {
    previewOk = !!(e.ok || e.fallback);
    previewFiles = e.files || 0;
    if (e.fallback) lastPreviewError = "Next.js export failed — showing static HTML mirror";
  }
  if (ev === "app_preview_failed") {
    previewOk = false;
    lastPreviewError = String(e.error || "App preview build failed").slice(0, 200);
  }
  if (ev === "generated" && activeJobId) void tryMountWipPreview(activeJobId);
  if (ev === "app_build_done" && activeJobId) {
    if (e.ok) mountClonePreview(activeJobId, true);
    else if (e.fallback) mountClonePreview(activeJobId, true);
  }
  if (ev === "patterns_resolved") applyPatternMatches(e.ids || [], e.platforms || []);
  const stage = STAGE_FOR[ev];
  if (stage) setStage(stage);
  const mapped = pctForEvent(ev, e);
  if (mapped != null) targetPct = Math.max(targetPct, mapped);
  const desc = describeEvent(ev, e);
  setActivity(desc);
  if (stage) {
    const sd = $("sd-" + stage);
    if (sd) sd.textContent = desc.sub || desc.main.slice(0, 32);
  }
}

function creepTick() {
  const idle = Date.now() - lastEventAt;
  const ceiling = Math.min(99, targetPct + (idle > 2000 ? 12 : 4));
  if (displayPct < targetPct) {
    displayPct += Math.max(0.4, (targetPct - displayPct) * 0.25);
  } else if (idle > 1500 && displayPct < ceiling) {
    displayPct += 0.08;
  }
  renderPct(displayPct);
}

function log(text, cls) {
  const div = document.createElement("div");
  div.className = cls || "meta";
  div.textContent = text;
  $("log").appendChild(div);
  $("log").scrollTop = $("log").scrollHeight;
}

function shortHost(url) {
  let u = url;
  const lower = u.toLowerCase();
  if (lower.startsWith("https://")) u = u.slice(8);
  else if (lower.startsWith("http://")) u = u.slice(7);
  while (u.endsWith("/")) u = u.slice(0, -1);
  return u || url;
}

function resetUi(url) {
  cloneUrl = url;
  targetPct = 0; displayPct = 0; seenEvents = 0;
  captureVpCount = 0; refetchPass = 0; activeStage = null;
  previewOk = true; previewFiles = 0;
  lastPreviewError = "";
  $("log").innerHTML = "";
  $("score").style.display = "none";
  $("score").textContent = "";
  matchedPatternIds = new Set();
  renderPatternGraph();
  $("tabs").hidden = false;
  $("frame").hidden = true;
  $("empty").hidden = true;
  $("loading").classList.remove("show");
  mountLivePreview(url);
  $("loading").classList.add("show");
  showView("loading");
  $("loading-title").textContent = "Cloning " + shortHost(url);
  document.querySelectorAll(".step").forEach((el) => { el.classList.remove("active", "done", "fail"); });
  document.querySelectorAll("[id^=sd-]").forEach((el) => { el.textContent = ""; });
  $("progress-panel").classList.remove("idle");
  $("progress-panel").classList.add("running");
  setSidebarStatus("Cloning " + shortHost(url));
  setStage("navigate");
  setActivity({ main: "Starting clone", sub: url });
  targetPct = 1; displayPct = 0;
  renderPct(0);
  if (timerId) clearInterval(timerId);
  if (creepId) clearInterval(creepId);
  t0 = Date.now();
  lastEventAt = t0;
  $("big-timer").textContent = "0:00";
  timerId = setInterval(() => { $("big-timer").textContent = fmtElapsed(Date.now() - t0); }, 200);
  creepId = setInterval(creepTick, 120);
}

function stopTimers() {
  if (timerId) { clearInterval(timerId); timerId = null; }
  if (creepId) { clearInterval(creepId); creepId = null; }
}

async function pollEvents(jobId) {
  try {
    const r = await fetch("/v1/clones/" + jobId + "/events?after=" + seenEvents);
    if (!r.ok) return false;
    const d = await r.json();
    const batch = d.events || [];
    for (const e of batch) {
      seenEvents++;
      const ev = String(e.event ?? "");
      bumpEvent(ev, e);
      const detail = Object.entries(e).filter(([k]) => !["t","event"].includes(k)).map(([k,v]) => k + "=" + JSON.stringify(v)).join(" ");
      log(ev + (detail ? " " + detail : ""), ev.includes("error") || ev.includes("failed") ? "err" : "evt");
    }
    return true;
  } catch { return false; }
}

async function flushAllEvents(jobId) {
  for (let i = 0; i < 16; i++) {
    await pollEvents(jobId);
    if (i) await new Promise((res) => setTimeout(res, 60));
  }
}

function syncPreviewFromSummary(d) {
  if (!d) return;
  if (d.previewReady) {
    previewOk = true;
    if (!previewFiles) previewFiles = 1;
  }
}

function onFrameLoad() {
  if (previewMode === "wip" || previewMode === "clone") {
    $("loading").classList.remove("show");
    showView("preview");
  }
}

async function tryMountWipPreview(jobId) {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch("/v1/clones/" + jobId + "/mirror-preview/", { cache: "no-store" });
      if (r.ok) { mountWipPreview(jobId); return true; }
    } catch { /* retry */ }
    await new Promise((res) => setTimeout(res, 500));
  }
  return false;
}

async function mountPreview(jobId, summary) {
  const base = "/v1/clones/" + jobId;
  previewBase = base;
  $("tab-app").href = base + "/app-preview/";
  syncPreviewFromSummary(summary);
  const serverReady = !!(summary && summary.previewReady);
  const shouldTry = serverReady || (previewOk && previewFiles > 0);
  if (!shouldTry) {
    const failedBuild = (summary?.timings?.previewMs ?? 0) > 0 && !serverReady;
    if (livePreviewUrl) { showView("live"); return false; }
    $("empty").textContent = failedBuild
      ? (lastPreviewError || "App preview build failed — try Full quality with Skip cache, or download .tgz")
      : "Clone finished but app preview did not build — try fresh (no cache) or download .tgz";
    showView("empty");
    pendingPreviewJobId = null;
    return false;
  }
  // Optimistic: load iframe immediately when server says previewReady
  if (serverReady) {
    mountClonePreview(jobId, false);
    pendingPreviewJobId = null;
    return true;
  }
  mountClonePreview(jobId, true);
  pendingPreviewJobId = null;
  return true;
}

async function findRunningJob(url) {
  try {
    const r = await fetch("/v1/clones");
    const d = await r.json();
    const job = (d.clones || []).find((j) => j.url === url && j.status === "running");
    return job ? job.jobId : null;
  } catch { return null; }
}

function normalizeUrl(raw) {
  let u = raw.trim();
  if (!u) return u;
  const lower = u.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://")) return u;
  while (u.startsWith("/")) u = u.slice(1);
  return "https://" + u;
}

function finishSuccess(d, jobId) {
  lastFinishedJobId = jobId;
  lastFinishedSummary = d;
  syncPreviewFromSummary(d);
  targetPct = 100; displayPct = 100;
  renderPct(100);
  STAGES.forEach((s) => {
    const el = document.querySelector('.step[data-stage="' + s + '"]');
    if (el) {
      el.classList.remove("active");
      const previewFailed = s === "preview" && !d.previewReady && !(d.timings?.previewMs > 0) && !previewOk;
      if (previewFailed) el.classList.add("fail");
      else el.classList.add("done");
    }
  });
  const previewLikely = d.previewReady || (d.timings?.previewMs ?? 0) > 0 || previewFiles > 0;
  setSidebarStatus(previewLikely ? "Clone complete" : "Done — preview unavailable");
  setActivity({ main: previewLikely ? "Done!" : "Done — preview unavailable", sub: fmtElapsed(Date.now() - t0) + " total" });
  $("progress-panel").classList.remove("running");
  $("progress-panel").classList.add("idle");
  const t = d.timings || {};
  log("done in " + fmtElapsed(Date.now() - t0) + " (capture " + ((t.captureMs||0)/1000).toFixed(1) + "s · generate " + ((t.generateMs||0)/1000).toFixed(1) + "s · preview " + ((t.previewMs||0)/1000).toFixed(1) + "s)" + (d.captureReused ? " [cache hit]" : ""), "evt");
  if (d.verify && typeof d.verify.scorecard?.total === "number") {
    $("score").textContent = "score " + d.verify.scorecard.total.toFixed(1);
    $("score").style.display = "block";
  } else if (d.verify && typeof d.verify.score === "number") {
    $("score").textContent = "score " + d.verify.score.toFixed(1);
    $("score").style.display = "block";
  }
  const base = "/v1/clones/" + jobId;
  previewBase = base;
  $("tab-app").href = base + "/app-preview/";
  $("tab-json").href = base + "/result";
  $("tab-bundle").href = base + "/bundle?format=tgz";
  $("tabs").hidden = false;
  $("tab-json").hidden = false;
  $("tab-bundle").hidden = false;
  $("loading").classList.remove("show");
  void mountPreview(jobId, d);
  void loadClonePatterns(jobId);
  void loadAudit(jobId);
  if (asyncVerifyPending) void pollVerify(jobId);
}

async function waitForJob(id) {
  for (;;) {
    const r = await fetch("/v1/clones/" + id);
    if (!r.ok) throw new Error("job not found (server may have restarted)");
    const d = await r.json();
    if (d.status === "succeeded") return d;
    if (d.status === "failed") throw new Error(d.error || "clone failed");
    await new Promise((res) => setTimeout(res, 400));
  }
}

$("go").onclick = async () => {
  const url = normalizeUrl($("url").value);
  if (!url) { log("Enter a URL first", "err"); return; }
  if (url !== $("url").value.trim()) $("url").value = url;
  $("go").disabled = true;
  resetUi(url);
  mountLivePreview(url);
  if (!scanResult || scanResult.url !== url) await runScan(url);
  const tier = $("tier").value;
  const fresh = $("fresh").checked;
  const asyncVerify = $("asyncVerify").checked;
  asyncVerifyPending = tier === "production" && asyncVerify;
  const routes = [...selectedRoutePaths];
  const options = { qualityTier: tier };
  if (fresh) options.noCache = true;
  if (tier === "production" && asyncVerify) options.asyncVerify = true;
  if (routes.length > 1) {
    options.mode = "multi";
    options.selectedRoutes = routes;
    options.maxRoutes = routes.length;
  }
  if (tier === "draft") log("Draft preview — low quality peek only", "meta");
  log("POST /v1/clones " + url + " tier=" + tier);
  let jobId = null;
  activeJobId = null;
  let poller = setInterval(async () => {
    if (!jobId) jobId = await findRunningJob(url);
    if (jobId) { activeJobId = jobId; await pollEvents(jobId); }
  }, 250);
  const stopPoller = () => { clearInterval(poller); poller = null; };
  try {
    const r = await fetch("/v1/clones", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, options }) });
    let d;
    try { d = await r.json(); } catch { throw new Error("API returned non-JSON (is the server running?)"); }
    if (!r.ok || d.error) {
      const detail = d.details?.fieldErrors?.url?.[0];
      throw new Error(detail || d.error || String(r.status));
    }
    jobId = d.jobId || jobId;
    if (jobId) activeJobId = jobId;
    if (r.status === 202 || d.status === "queued") {
      log("queued jobId=" + jobId + " — polling until done");
      if (!jobId) jobId = await findRunningJob(url);
    }
    if (!jobId) throw new Error("no job id returned");
    const summary = (r.status === 202 || d.status === "queued") ? await waitForJob(jobId) : d;
    await flushAllEvents(jobId);
    syncPreviewFromSummary(summary);
    stopPoller();
    stopTimers();
    $("big-timer").textContent = fmtElapsed(Date.now() - t0);
    finishSuccess(summary, jobId);
    activeJobId = null;
  } catch (e) {
    const msg = String(e);
    if (jobId && (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed"))) {
      log("POST connection dropped — recovering via jobId=" + jobId, "meta");
      setActivity({ main: "Connection dropped — waiting for clone to finish", sub: jobId.slice(0, 8) });
      try {
        const summary = await waitForJob(jobId);
        await flushAllEvents(jobId);
        syncPreviewFromSummary(summary);
        stopPoller();
        stopTimers();
        $("big-timer").textContent = fmtElapsed(Date.now() - t0);
        finishSuccess(summary, jobId);
        return;
      } catch (e2) {
        log("FAILED: " + e2, "err");
      }
    } else {
      log("FAILED: " + e, "err");
    }
    stopPoller();
    stopTimers();
    $("loading").classList.remove("show");
    $("empty").hidden = false;
    $("empty").textContent = "clone failed";
    setActivity({ main: "Failed", sub: msg.slice(0, 120) });
  } finally {
    stopPoller();
    $("go").disabled = false;
  }
};
$("tab-patterns").onclick = (ev) => {
  ev.preventDefault();
  showView("patterns");
  void loadPatternCatalog();
};
$("tab-live").onclick = (ev) => {
  ev.preventDefault();
  if (livePreviewUrl) mountLivePreview(livePreviewUrl);
  else showView("empty");
};
$("tab-audit").onclick = async (ev) => {
  ev.preventDefault();
  showView("audit");
  if (lastFinishedJobId) await loadAudit(lastFinishedJobId);
};
$("hdr-patterns").onclick = (ev) => {
  ev.preventDefault();
  showView("patterns");
  void loadPatternCatalog();
};
$("tab-app").onclick = async (ev) => {
  ev.preventDefault();
  const jobId = pendingPreviewJobId || lastFinishedJobId;
  if (!jobId) { showView("empty"); return; }
  await mountPreview(jobId, lastFinishedSummary);
};

void loadPatternCatalog();
showView("empty");
$("frame").addEventListener("load", onFrameLoad);

function scheduleLivePreview() {
  if (liveTimer) clearTimeout(liveTimer);
  liveTimer = setTimeout(() => {
    const url = normalizeUrl($("url").value);
    if (!url) { showView("empty"); return; }
    mountLivePreview(url);
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => { void runScan(url); }, 600);
    void refreshCacheBadge();
  }, 350);
}

$("url").addEventListener("input", scheduleLivePreview);
$("url").addEventListener("change", scheduleLivePreview);
$("url").addEventListener("keydown", (e) => { if (e.key === "Enter") $("go").click(); });

const TIER_HINTS = {
  production: "Best fidelity — all screen sizes, animations, and quality checks.",
  dev: "Reuse a previous capture when available — faster rebuild.",
  draft: "Fast peek — single viewport, no animations (interactions/motion off).",
};
function syncTierUi() {
  const tier = $("tier").value;
  $("tier-hint").textContent = TIER_HINTS[tier] || "";
  $("async-wrap").hidden = tier !== "production";
  document.querySelectorAll(".mode").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tier") === tier);
  });
}
document.querySelectorAll(".mode").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tier = btn.getAttribute("data-tier");
    if (!tier) return;
    $("tier").value = tier;
    syncTierUi();
  });
});
async function refreshCacheBadge() {
  const url = normalizeUrl($("url").value);
  const badge = $("cache-badge");
  if (!url) { badge.textContent = "—"; badge.classList.remove("hit"); badge.title = ""; return; }
  try {
    const r = await fetch("/v1/cache/check?url=" + encodeURIComponent(url));
    const d = await r.json();
    if (d.cached) {
      const ageMin = d.ageMs != null ? Math.round(d.ageMs / 60000) : null;
      badge.textContent = ageMin != null ? "cached · " + ageMin + "m" : "cached";
      badge.classList.add("hit");
      badge.title = d.hint || "Capture cache hit";
    } else {
      badge.textContent = "no cache";
      badge.classList.remove("hit");
      badge.title = d.hint || "First clone hits live site";
    }
  } catch {
    badge.textContent = "cache ?";
    badge.classList.remove("hit");
  }
}
$("tier").onchange = syncTierUi;
$("url").addEventListener("blur", refreshCacheBadge);
syncTierUi();
void refreshCacheBadge();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !pendingPreviewJobId) return;
  void mountPreview(pendingPreviewJobId, lastFinishedSummary);
});
</script>
</body>
</html>`;

/** @deprecated use STUDIO_HTML */
export const UI_HTML = STUDIO_HTML;
