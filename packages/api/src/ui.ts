/** Minimal dev/test UI served at GET /. Self-contained (inline CSS/JS, no build). */
export const UI_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ditto — clone studio</title>
<style>
  :root { color-scheme: dark; --accent: #2f6feb; --accent-glow: #5b8def44; --success: #3dd68c; --warn: #f5a623; --error: #ff7b72; --muted: #6b7280; --surface: #0f131a; --border: #1d2330; }
  * { box-sizing: border-box; }
  /* id-selector display rules below beat the UA's [hidden]{display:none} — restore it */
  [hidden] { display: none !important; }
  body { margin: 0; font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; background: #0b0e14; color: #e6e6e6; }
  header { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  header h1 { font-size: 15px; margin: 0 8px 0 0; font-weight: 600; color: #9ecbff; }
  #score { margin-left: auto; font: 13px ui-monospace, monospace; color: var(--success); display: none; }
  input[type=text] { flex: 1 1 320px; min-width: 240px; padding: 8px 10px; border-radius: 6px; border: 1px solid #2a3245; background: #121722; color: inherit; }
  button { padding: 8px 16px; border-radius: 6px; border: 0; background: var(--accent); color: #fff; font-weight: 600; cursor: pointer; }
  button:disabled { opacity: .5; cursor: wait; }
  label { display: flex; gap: 6px; align-items: center; color: #9aa4b2; user-select: none; font-size: 13px; }
  select { padding: 7px 10px; border-radius: 6px; border: 1px solid #2a3245; background: #121722; color: inherit; font-size: 13px; }
  #cache-badge { font-size: 12px; padding: 4px 8px; border-radius: 6px; background: #121722; border: 1px solid #2a3245; color: #9aa4b2; }
  #cache-badge.hit { color: #7ee787; border-color: #1f3d2a; background: #0d1a12; }
  #tier-hint { font-size: 11px; color: var(--muted); max-width: 220px; line-height: 1.35; }
  main { display: grid; grid-template-columns: 380px 1fr; height: calc(100vh - 61px); }
  #sidebar { border-right: 1px solid var(--border); display: flex; flex-direction: column; min-height: 0; background: #0a0d12; }
  #progress-panel { padding: 18px 16px 14px; border-bottom: 1px solid var(--border); background: var(--surface); }
  #progress-panel.idle { opacity: .5; }
  #progress-panel.running { opacity: 1; }
  .timer-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
  #big-timer { font: 700 28px/1 ui-monospace, monospace; color: #fff; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
  #big-pct { font: 700 28px/1 ui-monospace, monospace; color: var(--accent); font-variant-numeric: tabular-nums; }
  .bar-track { height: 6px; background: #1a2030; border-radius: 99px; overflow: hidden; margin-bottom: 12px; }
  .bar-fill { height: 100%; width: 0%; background: linear-gradient(90deg, var(--accent-dim, #1a3d7a), var(--accent)); border-radius: 99px; transition: width .4s ease; box-shadow: 0 0 12px var(--accent-glow); }
  #activity { font-size: 13px; color: #c9d4e3; line-height: 1.45; min-height: 2.9em; margin-bottom: 14px; }
  #activity .sub { display: block; font-size: 11px; color: var(--muted); margin-top: 3px; font-family: ui-monospace, monospace; }
  .stepper { display: flex; flex-direction: column; gap: 0; }
  .step { display: flex; align-items: center; gap: 10px; padding: 5px 0; font-size: 12px; color: #4b5563; transition: color .25s; }
  .step.active { color: #9ecbff; }
  .step.done { color: #7ee787; }
  .step.fail { color: var(--error); }
  .step.fail .step-dot { background: var(--error); }
  .step-dot { width: 8px; height: 8px; border-radius: 50%; background: #2a3245; flex-shrink: 0; transition: background .25s, box-shadow .25s; }
  .step.active .step-dot { background: var(--accent); box-shadow: 0 0 8px var(--accent-glow); animation: pulse 1.4s ease infinite; }
  .step.done .step-dot { background: var(--success); box-shadow: none; animation: none; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
  .step-label { flex: 1; }
  .step-detail { font: 10px ui-monospace, monospace; color: var(--muted); }
  .step.active .step-detail { color: #6b8cce; }
  #log { flex: 1; overflow-y: auto; padding: 10px 14px; font: 10px/1.65 ui-monospace, monospace; min-height: 0; border-top: 1px solid var(--border); }
  #log .evt { color: #7ee787; } #log .err { color: var(--error); } #log .meta { color: #8b949e; }
  #view { display: flex; flex-direction: column; min-height: 0; position: relative; background: #0b0e14; }
  #tabs { display: flex; gap: 4px; padding: 10px 12px; flex-shrink: 0; background: #121722; border-bottom: 1px solid var(--border); align-items: center; }
  #tabs a { padding: 8px 16px; border-radius: 6px; background: transparent; color: #9aa4b2; text-decoration: none; font-size: 13px; font-weight: 500; border: 1px solid transparent; }
  #tabs a:hover { color: #e6e6e6; background: #1a2030; }
  #tabs a.active { background: #1d2330; color: #9ecbff; border-color: #2f6feb; box-shadow: 0 0 0 1px #2f6feb44; }
  header .hdr-btn { padding: 8px 14px; border-radius: 6px; border: 1px solid #2a3245; background: #121722; color: #9ecbff; font-weight: 600; cursor: pointer; font-size: 13px; }
  header .hdr-btn:hover { border-color: #2f6feb; background: #1a2030; }
  header .hdr-btn.active { border-color: #2f6feb; background: #1a2d4a; }
  iframe { flex: 1; border: 0; background: #fff; min-height: 0; }
  #loading { flex: 1; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 20px; padding: 40px; background: radial-gradient(ellipse at 50% 30%, #121722 0%, #0b0e14 70%); text-align: center; }
  #loading.show { display: flex; }
  .loading-ring { width: 96px; height: 96px; transform: rotate(-90deg); }
  .loading-ring-bg { fill: none; stroke: #1d2330; stroke-width: 4; }
  .loading-ring-fill { fill: none; stroke: var(--accent); stroke-width: 4; stroke-linecap: round; transition: stroke-dashoffset .5s ease; }
  #loading-title { font-size: 18px; font-weight: 600; color: #e6e6e6; margin: 0; }
  #loading-activity { font-size: 14px; color: #9aa4b2; max-width: 420px; line-height: 1.5; margin: 0; }
  #loading-timer { font: 600 15px ui-monospace, monospace; color: var(--accent); margin: 0; }
  #empty { flex: 1; display: grid; place-items: center; color: #4b5563; text-align: center; padding: 24px; }
  #view-body { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; position: relative; }
  #pattern-panel { flex: 1; overflow-y: auto; padding: 16px 18px; min-height: 0; display: none; }
  #pattern-panel.show { display: block; }
  #pattern-panel h2 { margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #9ecbff; }
  #pattern-panel .lead { margin: 0 0 16px; font-size: 12px; color: #8b949e; line-height: 1.5; max-width: 720px; }
  .pattern-stats { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
  .pattern-stat { background: #121722; border: 1px solid #2a3245; border-radius: 8px; padding: 8px 12px; font-size: 12px; }
  .pattern-stat b { display: block; font: 700 18px/1 ui-monospace, monospace; color: #e6e6e6; margin-bottom: 2px; }
  .pattern-graph { display: flex; flex-direction: column; gap: 14px; }
  .pattern-kind { border: 1px solid #1d2330; border-radius: 10px; background: #0f131a; overflow: hidden; }
  .pattern-kind-head { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #121722; border-bottom: 1px solid #1d2330; }
  .pattern-kind-icon { font-size: 18px; line-height: 1; }
  .pattern-kind-title { font-weight: 600; font-size: 13px; color: #c9d4e3; flex: 1; }
  .pattern-kind-count { font: 11px ui-monospace, monospace; color: #6b7280; }
  .pattern-nodes { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 12px; }
  .pattern-node { font: 11px ui-monospace, monospace; padding: 6px 9px; border-radius: 6px; border: 1px solid #2a3245; background: #0b0e14; color: #9aa4b2; cursor: default; transition: border-color .2s, background .2s, color .2s; }
  .pattern-node:hover { border-color: #3d4f6f; color: #c9d4e3; }
  .pattern-node.hit { border-color: #3dd68c; background: #0d1f16; color: #7ee787; box-shadow: 0 0 0 1px #3dd68c33; }
  .pattern-node .flags { display: block; font-size: 9px; color: #6b7280; margin-top: 3px; }
  .pattern-node.hit .flags { color: #5cb87a; }
  #match-banner { margin: 0 0 14px; padding: 10px 12px; border-radius: 8px; background: #0d1a12; border: 1px solid #1f3d2a; font-size: 12px; color: #7ee787; display: none; }
  #match-banner.show { display: block; }
  #view-body { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
</style>
</head>
<body>
<header>
  <h1>ditto</h1>
  <input id="url" type="text" inputmode="url" placeholder="https://cropin.com/" value="" autocomplete="url">
  <select id="tier" title="Quality tier">
    <option value="production" selected>Production</option>
    <option value="dev">Dev (cache regen)</option>
    <option value="draft">Draft preview</option>
  </select>
  <span id="cache-badge" title="Capture cache">—</span>
  <label id="async-wrap"><input id="asyncVerify" type="checkbox" checked> async verify</label>
  <label><input id="fresh" type="checkbox"> fresh (no cache)</label>
  <span id="tier-hint">Full viewports + motion + validate. Reuses cache when unchanged.</span>
  <button type="button" id="hdr-patterns" class="hdr-btn active">Pattern catalog</button>
  <button id="go">Clone</button>
  <span id="score"></span>
</header>
<main>
  <div id="sidebar">
    <div id="progress-panel" class="idle">
      <div class="timer-row">
        <span id="big-timer">0:00</span>
        <span id="big-pct">—</span>
      </div>
      <div class="bar-track"><div class="bar-fill" id="bar-fill"></div></div>
      <div id="activity">Ready — enter a URL and hit Clone.</div>
      <div class="stepper" id="stepper">
        <div class="step" data-stage="navigate"><span class="step-dot"></span><span class="step-label">Navigate</span><span class="step-detail" id="sd-navigate"></span></div>
        <div class="step" data-stage="capture"><span class="step-dot"></span><span class="step-label">Capture</span><span class="step-detail" id="sd-capture"></span></div>
        <div class="step" data-stage="assets"><span class="step-dot"></span><span class="step-label">Assets</span><span class="step-detail" id="sd-assets"></span></div>
        <div class="step" data-stage="generate"><span class="step-dot"></span><span class="step-label">Generate</span><span class="step-detail" id="sd-generate"></span></div>
        <div class="step" data-stage="preview"><span class="step-dot"></span><span class="step-label">App preview</span><span class="step-detail" id="sd-preview"></span></div>
        <div class="step" data-stage="validate"><span class="step-dot"></span><span class="step-label">Validate</span><span class="step-detail" id="sd-validate"></span></div>
      </div>
    </div>
    <div id="log"><div class="meta">Event log</div></div>
  </div>
  <div id="view">
    <div id="tabs">
      <a id="tab-patterns" href="#">Pattern catalog</a>
      <a id="tab-app" href="#">App preview</a>
      <a id="tab-json" href="#" target="_blank" hidden>result.json</a>
      <a id="tab-bundle" href="#" target="_blank" hidden>download .tgz</a>
    </div>
    <div id="view-body">
    <div id="loading">
      <svg class="loading-ring" viewBox="0 0 96 96" aria-hidden="true">
        <circle class="loading-ring-bg" cx="48" cy="48" r="42"/>
        <circle class="loading-ring-fill" id="loading-ring-fill" cx="48" cy="48" r="42" stroke-dasharray="263.89" stroke-dashoffset="263.89"/>
      </svg>
      <p id="loading-title">Cloning…</p>
      <p id="loading-activity">Starting</p>
      <p id="loading-timer">0:00 · 0%</p>
    </div>
    <div id="empty">No clone yet — enter a URL above and hit Clone, or browse the pattern catalog.</div>
    <div id="pattern-panel">
      <h2>Pattern catalog</h2>
      <p class="lead">Frozen library of common website building blocks (carousels, Shopify, Lottie, cookie banners…). During a clone the compiler scans captured HTML for these fingerprints and uses them to infer layout recipes and generation hints.</p>
      <div id="match-banner"></div>
      <div class="pattern-stats" id="pattern-stats"></div>
      <div class="pattern-graph" id="pattern-graph"><div class="meta">Loading catalog…</div></div>
    </div>
    <iframe id="frame" hidden></iframe>
    </div>
  </div>
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
let activeView = "empty";
let previewBase = "";
let lastFinishedJobId = null;
let lastFinishedSummary = null;
let pendingPreviewJobId = null;

const KIND_ICON = {
  carousel: "🎠", marquee: "📜", counter: "🔢", text_effect: "⌨️",
  scroll_animation: "✨", css_animation: "💫", parallax: "🌊", lottie: "🎬",
  background_effect: "🌌", video_player: "▶️", lightbox: "🖼️", platform: "🏗️",
  nav_toggle: "🍔", nav_menu: "📋", consent: "🍪", chat_widget: "💬",
  accordion: "📂", tabs: "📑", map: "🗺️", form: "📝", embed: "🔗",
  review_widget: "⭐", table: "📊",
};

function kindIcon(kind) { return KIND_ICON[kind] || "🧩"; }

function showView(name) {
  activeView = name;
  $("loading").classList.toggle("show", name === "loading");
  $("frame").hidden = name !== "preview";
  $("empty").hidden = name !== "empty";
  $("pattern-panel").classList.toggle("show", name === "patterns");
  $("tab-app").classList.toggle("active", name === "preview" || name === "empty" || name === "loading");
  $("tab-patterns").classList.toggle("active", name === "patterns");
  $("hdr-patterns").classList.toggle("active", name === "patterns");
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
  if (ev === "app_build_done") { previewOk = !!e.ok; previewFiles = e.files || 0; }
  if (ev === "app_preview_failed") previewOk = false;
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
  $("log").innerHTML = "";
  $("score").style.display = "none";
  $("score").textContent = "";
  matchedPatternIds = new Set();
  renderPatternGraph();
  $("tabs").hidden = false;
  $("frame").hidden = true;
  $("empty").hidden = true;
  $("loading").classList.add("show");
  showView("loading");
  $("loading-title").textContent = "Cloning " + shortHost(url);
  document.querySelectorAll(".step").forEach((el) => { el.classList.remove("active", "done", "fail"); });
  document.querySelectorAll("[id^=sd-]").forEach((el) => { el.textContent = ""; });
  $("progress-panel").classList.remove("idle");
  $("progress-panel").classList.add("running");
  setStage("navigate");
  setActivity({ main: "Submitting clone job", sub: url });
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
  } else if ((d.timings?.previewMs ?? 0) > 0) {
    previewOk = true;
  }
}

async function previewReachable(base) {
  const url = base + "/app-preview/index.html";
  for (let i = 0; i < 12; i++) {
    try {
      const pr = await fetch(url, { method: "HEAD" });
      if (pr.ok) return true;
      const gr = await fetch(url, { method: "GET", headers: { range: "bytes=0-0" } });
      if (gr.ok) return true;
    } catch { /* tab throttling / server still publishing */ }
    await new Promise((res) => setTimeout(res, 100 * (i + 1)));
  }
  return false;
}

async function mountPreview(jobId, summary) {
  const base = "/v1/clones/" + jobId;
  previewBase = base;
  $("tab-app").href = base + "/app-preview/";
  syncPreviewFromSummary(summary);
  const serverReady = !!(summary && summary.previewReady);
  const timedPreview = (summary?.timings?.previewMs ?? 0) > 0;
  const shouldTry = serverReady || timedPreview || previewFiles > 0;
  if (!shouldTry) {
    $("empty").textContent = "Clone finished but app preview did not build — try fresh (no cache) or download .tgz";
    showView("empty");
    pendingPreviewJobId = null;
    return false;
  }
  if (!(await previewReachable(base))) {
    $("empty").textContent = "App preview is still publishing — click App preview or return to this tab in a moment";
    showView("empty");
    pendingPreviewJobId = jobId;
    return false;
  }
  pendingPreviewJobId = null;
  $("frame").src = base + "/app-preview/";
  showView("preview");
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
  setActivity({ main: previewLikely ? "Done!" : "Done — preview unavailable", sub: fmtElapsed(Date.now() - t0) + " total" });
  const t = d.timings || {};
  log("done in " + fmtElapsed(Date.now() - t0) + " (capture " + ((t.captureMs||0)/1000).toFixed(1) + "s · generate " + ((t.generateMs||0)/1000).toFixed(1) + "s · preview " + ((t.previewMs||0)/1000).toFixed(1) + "s)" + (d.captureReused ? " [cache hit]" : ""), "evt");
  if (d.verify && typeof d.verify.score === "number") {
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
  void mountPreview(jobId, d);
  void loadClonePatterns(jobId);
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
  const tier = $("tier").value;
  const fresh = $("fresh").checked;
  const asyncVerify = $("asyncVerify").checked;
  const options = { qualityTier: tier };
  if (fresh) options.noCache = true;
  if (tier === "production" && asyncVerify) options.asyncVerify = true;
  if (tier === "draft") log("Draft preview — low quality peek only", "meta");
  log("POST /v1/clones " + url + " tier=" + tier);
  let jobId = null;
  let poller = setInterval(async () => {
    if (!jobId) jobId = await findRunningJob(url);
    if (jobId) await pollEvents(jobId);
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
showView("patterns");
$("url").addEventListener("keydown", (e) => { if (e.key === "Enter") $("go").click(); });

const TIER_HINTS = {
  production: "Full viewports + motion + validate. Reuses cache when unchanged.",
  dev: "Regen from cache — skip live capture when cached. No witness gates.",
  draft: "Draft preview only — 1280px, no motion/interactions/validate.",
};
function syncTierUi() {
  const tier = $("tier").value;
  $("tier-hint").textContent = TIER_HINTS[tier] || "";
  $("async-wrap").hidden = tier !== "production";
}
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
$("url").addEventListener("change", refreshCacheBadge);
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
