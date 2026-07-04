/** First-run onboarding wizard — self-contained HTML/CSS/JS. */
export const WIZARD_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ditto by ION — get started</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{color-scheme:dark;--bg:#121417;--surface:#1a1d22;--surface2:#22262c;--border:#2e3238;--gold:#e6b84a;--text:#f4f4f5;--muted:#8b9099;--success:#6ee7a0;--error:#f87171}
*{box-sizing:border-box}[hidden]{display:none!important}
body{margin:0;font:15px/1.5 Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-bottom:1px solid var(--border)}
.brand{display:flex;align-items:center;gap:8px;font-weight:700}
.brand .by{color:var(--muted);font-weight:500;font-size:13px}
.steps{display:flex;gap:8px;padding:12px 24px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.step-pill{padding:6px 14px;border-radius:999px;border:1px solid var(--border);font-size:12px;color:var(--muted)}
.step-pill.active{border-color:var(--gold);color:var(--gold);background:#2a2418}
.step-pill.done{color:var(--success);border-color:#1f3d2a}
main{max-width:1200px;margin:0 auto;padding:24px}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px;margin-bottom:20px}
h1{margin:0 0 8px;font-size:24px}h2{margin:0 0 12px;font-size:18px}
.lead{color:var(--muted);margin:0 0 20px;line-height:1.6}
.url-row{display:flex;gap:10px;flex-wrap:wrap}
#wiz-url{flex:1;min-width:240px;padding:14px 18px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:15px}
.btn{padding:12px 22px;border-radius:999px;border:0;font:600 14px Inter,sans-serif;cursor:pointer}
.btn-gold{background:var(--gold);color:#121417}.btn-gold:disabled{opacity:.5;cursor:wait}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.timer{font:700 32px/1 "JetBrains Mono",monospace;color:var(--gold);font-variant-numeric:tabular-nums}
.route-list{display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto}
.route-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;border:1px solid transparent;font-size:13px;cursor:pointer}
.route-row:hover{background:var(--surface2)}.route-row.entry{font-weight:600}
.route-row .path{font:11px "JetBrains Mono",monospace;color:var(--muted);margin-left:auto}
.route-row.cloning{opacity:.7}.route-row.done .path{color:var(--success)}
.build-grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto 1fr auto;gap:12px;height:calc(100vh - 200px);min-height:520px}
.build-grid.full-clone{grid-template-columns:1fr}
.split-head{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.split-panes{display:contents}
.full-clone .split-panes{display:block;grid-column:1/-1}
.full-clone #pane-live{display:none!important}
.pane{border:1px solid var(--border);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-height:0;background:#000}
.pane-head{padding:8px 12px;background:var(--surface2);font-size:12px;font-weight:600;display:flex;justify-content:space-between;align-items:center}
.pane iframe{flex:1;border:0;width:100%;background:#fff;min-height:200px}
.embed-banner{grid-column:1/-1;padding:10px 14px;border-radius:10px;background:#2a2418;border:1px solid #4a4020;color:var(--gold);font-size:13px}
.code-panel{grid-column:1/-1;display:grid;grid-template-columns:220px 1fr;gap:0;border:1px solid var(--border);border-radius:12px;overflow:hidden;min-height:160px;max-height:220px}
.file-tree{background:var(--surface);overflow-y:auto;font:11px "JetBrains Mono",monospace;padding:8px}
.file-tree div{padding:4px 8px;border-radius:6px;cursor:pointer;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.file-tree div.active{background:#2a2418;color:var(--gold)}
.file-editor{background:#0d0f12;overflow:auto;padding:12px;font:12px/1.5 "JetBrains Mono",monospace;color:#c4c8cf;white-space:pre;margin:0}
.stage-bar{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;font-size:11px}
.stage-chip{padding:4px 10px;border-radius:999px;border:1px solid var(--border);color:var(--muted)}
.stage-chip.active{border-color:var(--gold);color:var(--gold)}.stage-chip.done{border-color:#1f3d2a;color:var(--success)}
.diff-wrap{position:relative;overflow:hidden;border-radius:12px;border:1px solid var(--border);height:360px;touch-action:none;user-select:none}
.diff-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:top;background:#fff}
.diff-wrap .after{clip-path:inset(0 0 0 50%)}
.diff-handle{position:absolute;top:0;bottom:0;left:50%;width:3px;background:var(--gold);cursor:ew-resize;transform:translateX(-50%);z-index:2}
.diff-handle::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:50%;background:var(--gold);border:2px solid #121417}
.route-switch{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.route-switch button{padding:6px 12px;border-radius:999px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:12px;cursor:pointer}
.route-switch button.active{border-color:var(--gold);color:var(--gold);background:#2a2418}
.behavior-panel{margin:20px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden}
.behavior-head{padding:10px 14px;background:var(--surface2);font-size:13px;font-weight:600;display:flex;justify-content:space-between;align-items:center}
.behavior-rows{padding:4px 0}
.behavior-row{display:flex;align-items:center;gap:10px;padding:7px 14px;font-size:13px;border-bottom:1px solid var(--border)}
.behavior-row:last-child{border-bottom:0}
.behavior-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.behavior-dot.pass{background:var(--success)}.behavior-dot.fail,.behavior-dot.pruned{background:var(--error)}
.behavior-dot.static,.behavior-dot.na{background:var(--muted)}
.behavior-detail{color:var(--muted);font-size:12px;margin-left:auto}
.build-actions .hint{color:var(--muted);font-size:13px;margin:0}
@media(max-width:800px){.build-grid{grid-template-columns:1fr;height:auto}.code-panel{grid-template-columns:1fr}}
</style>
</head>
<body>
<header class="topbar"><div class="brand"><span>ditto</span><span class="by">by</span><span>ION</span></div><div class="timer" id="wiz-timer">0:00</div></header>
<nav class="steps" id="wiz-steps">
  <span class="step-pill active" data-s="1">1 · URL</span>
  <span class="step-pill" data-s="2">2 · Scan</span>
  <span class="step-pill" data-s="3">3 · Pages</span>
  <span class="step-pill" data-s="4">4 · Build</span>
  <span class="step-pill" data-s="5">5 · Audit</span>
</nav>
<main>
  <section id="step-1" class="panel"><h1>Clone any website</h1><p class="lead">Enter a public URL. We'll scan it and start building the homepage immediately.</p>
    <div class="url-row"><input id="wiz-url" type="url" placeholder="https://example.com" autocomplete="url"><button type="button" class="btn btn-gold" id="wiz-start">Continue →</button></div>
  </section>
  <section id="step-2" class="panel" hidden><h2>Scanning site…</h2><p class="lead" id="scan-status">Discovering routes and starting homepage clone.</p></section>
  <section id="step-3" class="panel" hidden><h2>Choose pages to replicate</h2><p class="lead">Homepage is already cloning. Check additional pages — they'll build in the background after the homepage finishes.</p>
    <div class="route-list" id="wiz-routes"></div>
    <p style="margin:16px 0 0;font-size:13px;color:var(--muted)" id="home-status">Homepage: starting…</p>
    <button type="button" class="btn btn-gold" id="wiz-pages-continue" style="margin-top:16px">Open build view →</button>
  </section>
  <section id="step-4" class="panel" hidden style="padding:16px;background:transparent;border:0">
    <div class="build-grid" id="build-grid">
      <div class="split-head"><div class="stage-bar" id="stage-bar"></div><span id="build-pct" style="font:600 13px ui-monospace;color:var(--gold)">0%</span></div>
      <div id="embed-banner" class="embed-banner" hidden>Live embed blocked by this site — showing clone full width. <a id="live-link" href="#" target="_blank" rel="noopener" style="color:var(--gold)">Open live site ↗</a></div>
      <div class="split-panes">
        <div class="pane" id="pane-live"><div class="pane-head">Live site</div><iframe id="frame-live" title="Live"></iframe></div>
        <div class="pane" id="pane-clone"><div class="pane-head"><span id="clone-label">Next.js clone</span><span id="clone-stage" style="font-weight:400;color:var(--muted)">starting</span></div><iframe id="frame-clone" title="Clone"></iframe></div>
      </div>
      <div class="code-panel"><div class="file-tree" id="file-tree"><div class="meta">Waiting for files…</div></div><pre class="file-editor" id="file-editor">// Generated files appear here live</pre></div>
      <div class="build-actions" id="build-actions" hidden>
        <button type="button" class="btn btn-gold" id="wiz-go-audit">Continue to pixel audit →</button>
        <p class="hint" id="build-done-msg"></p>
      </div>
    </div>
  </section>
  <section id="step-5" class="panel" hidden><h2>Audit</h2><p class="lead">Pixel comparison plus interaction and motion checklists — see what replayed vs was left static.</p>
    <div id="behavior-panel" class="behavior-panel" hidden>
      <div class="behavior-head"><span>Behavior checklist</span><span id="behavior-summary" style="font-weight:400;color:var(--muted)"></span></div>
      <div class="behavior-rows" id="behavior-rows"></div>
    </div>
    <h3 style="margin:20px 0 8px;font-size:15px">Pixel diff</h3>
    <div class="route-switch" id="audit-routes"></div>
    <div class="diff-wrap" id="diff-wrap" hidden><img id="diff-before" alt="Live"><img id="diff-after" class="after" alt="Clone"><div class="diff-handle" id="diff-handle"></div></div>
    <p id="audit-meta" style="color:var(--muted);font-size:13px"></p>
    <button type="button" class="btn btn-gold" id="wiz-finish" style="margin-top:16px">Enter clone studio →</button>
  </section>
</main>
<script>
const $=id=>document.getElementById(id);
const ONBOARD='ditto_onboarded',PROJ='ditto_project';
const STAGES=['Load','Capture','Assets','Generate','Preview','Validate'];
const STAGE_EV={goto:0,captured:1,capture_done:1,refetch_done:2,generated:3,app_build_done:4,validated:5};
const S={step:1,url:'',scan:null,routes:new Set(['/']),homeJob:null,fullJob:null,seen:0,t0:0,timer:null,embedBlocked:false,expansionTimer:null,activeFile:null,routesDone:new Set(['/'])};
function fmt(ms){const s=Math.floor(ms/1000),m=Math.floor(s/60);return m+':'+String(s%60).padStart(2,'0')}
function norm(u){u=u.trim();if(!u)return u;if(!/^https?:\\/\\//i.test(u))u='https://'+u.replace(/^\\/+/, '');return u}
function saveProj(){localStorage.setItem(PROJ,JSON.stringify({url:S.url,selected:[...S.routes],homeJob:S.homeJob,fullJob:S.fullJob,savedAt:Date.now()}))}
function loadProj(){try{return JSON.parse(localStorage.getItem(PROJ)||'null')}catch{return null}}
function setStep(n){S.step=n;for(let i=1;i<=5;i++){$('step-'+i).hidden=i!==n;document.querySelector('.step-pill[data-s="'+i+'"]').classList.toggle('active',i===n);document.querySelector('.step-pill[data-s="'+i+'"]').classList.toggle('done',i<n)}}
function startTimer(){S.t0=Date.now();if(S.timer)clearInterval(S.timer);S.timer=setInterval(()=>{$('wiz-timer').textContent=fmt(Date.now()-S.t0)},200)}
async function apiScan(url){const r=await fetch('/v1/scan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url,maxRoutes:20})});const d=await r.json();if(!r.ok)throw new Error(d.error||r.status);return d}
async function apiClone(url,opts){const r=await fetch('/v1/clones',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url,options:opts})});const d=await r.json();if(!r.ok||d.error)throw new Error(d.error||d.details?.fieldErrors?.url?.[0]||r.status);return d.jobId}
async function waitJob(id){for(;;){const r=await fetch('/v1/clones/'+id);const d=await r.json();if(d.status==='succeeded')return d;if(d.status==='failed')throw new Error(d.error||'failed');await new Promise(r=>setTimeout(r,400))}}
function top5(scan){const rs=scan.routes.filter(r=>r.suggested);const pick=rs.slice(0,5).map(r=>r.path);pick.push(scan.entryPath||'/');return new Set(pick)}
function renderRoutes(){const el=$('wiz-routes');el.innerHTML='';const list=S.scan?.routes||[{path:'/',label:'Home',role:'entry'}];for(const rt of list){const row=document.createElement('label');row.className='route-row'+(rt.role==='entry'?' entry':'')+(S.routesDone.has(rt.path)?' done':'')+(S.routes.has(rt.path)&&!S.routesDone.has(rt.path)?' cloning':'');const cb=document.createElement('input');cb.type='checkbox';cb.checked=S.routes.has(rt.path);cb.disabled=rt.role==='entry';cb.onchange=()=>{if(cb.checked)S.routes.add(rt.path);else S.routes.delete(rt.path);S.routes.add(S.scan?.entryPath||'/');saveProj();renderRoutes();clearTimeout(S.expansionTimer);S.expansionTimer=setTimeout(()=>scheduleExpansion(),1200)};row.appendChild(cb);const lb=document.createElement('span');lb.textContent=rt.label;row.appendChild(lb);const p=document.createElement('span');p.className='path';p.textContent=rt.path+(S.routesDone.has(rt.path)?' ✓':'');row.appendChild(p);el.appendChild(row)}}
async function startHomeClone(){S.homeJob=await apiClone(S.url,{qualityTier:'production',mode:'single',preview:true,verify:true});saveProj();pollHomeStatus()}
function pollHomeStatus(){const iv=setInterval(async()=>{try{const d=await fetch('/v1/clones/'+S.homeJob).then(r=>r.json());$('home-status').textContent='Homepage: '+d.status+(d.previewReady?' · preview ready':'');if(d.status==='succeeded'){S.routesDone.add(S.scan?.entryPath||'/');clearInterval(iv);scheduleExpansion()}if(d.status==='failed'){$('home-status').textContent='Homepage failed: '+(d.error||'');clearInterval(iv)}}catch{}},800)}
let expansionQueued=false;
async function scheduleExpansion(){if(expansionQueued||S.routes.size<=1)return;try{const st=await fetch('/v1/clones/'+S.homeJob).then(r=>r.json());if(st.status!=='succeeded')return;const routes=[...S.routes];if(routes.length<=1)return;expansionQueued=true;S.fullJob=await apiClone(S.url,{qualityTier:'production',mode:'multi',selectedRoutes:routes,maxRoutes:routes.length,preview:true,verify:true});saveProj();pollExpansion();renderRoutes()}catch(e){expansionQueued=false}}
async function pollExpansion(){if(!S.fullJob)return;const iv=setInterval(async()=>{try{const d=await fetch('/v1/clones/'+S.fullJob).then(r=>r.json());if(d.status==='succeeded'){clearInterval(iv);expansionQueued=false;(d.routes||[]).forEach(r=>S.routesDone.add(r.route))}if(d.status==='failed'){clearInterval(iv);expansionQueued=false}}catch{}},1000)}
function testEmbed(url){return new Promise(res=>{const f=document.createElement('iframe');f.style.cssText='position:fixed;left:-9999px;width:1px;height:1px';let done=false;const fin=v=>{if(done)return;done=true;try{document.body.removeChild(f)}catch{}res(v)};f.onload=()=>setTimeout(()=>fin(false),1200);f.onerror=()=>fin(true);document.body.appendChild(f);f.src=url;setTimeout(()=>fin(true),4500)})}
function activeJob(){return S.fullJob||S.homeJob}
async function previewHtmlUrl(url){try{const r=await fetch(url,{headers:{Accept:'text/html'}});const ct=(r.headers.get('content-type')||'').toLowerCase();return r.ok&&ct.includes('html')}catch{return false}}
async function mountCloneFrame(stage){const id=activeJob();if(!id)return;const base='/v1/clones/'+id;const bust='?t='+Date.now();const mirror=base+'/mirror-preview/'+bust;const app=base+'/app-preview/'+bust;$('clone-stage').textContent='loading…';let st={};try{st=await fetch('/v1/clones/'+id).then(r=>r.json())}catch{};if(stage==='mirror'){if(await previewHtmlUrl(mirror)){$('frame-clone').removeAttribute('srcdoc');$('frame-clone').src=mirror;$('clone-stage').textContent='static mirror';return}}else{if(st.previewReady&&await previewHtmlUrl(app)){$('frame-clone').removeAttribute('srcdoc');$('frame-clone').src=app;$('clone-stage').textContent='Next.js export';return}if(await previewHtmlUrl(mirror)){$('frame-clone').removeAttribute('srcdoc');$('frame-clone').src=mirror;$('clone-stage').textContent='static mirror';return}if(await previewHtmlUrl(app)){$('frame-clone').removeAttribute('srcdoc');$('frame-clone').src=app;$('clone-stage').textContent='Next.js export';return}};$('frame-clone').removeAttribute('src');$('frame-clone').srcdoc='<!DOCTYPE html><html><body style="font:14px system-ui,sans-serif;background:#1a1d22;color:#8b9099;padding:24px;margin:0"><p style="margin:0 0 8px;color:#e6b84a">Preview loading…</p><p style="margin:0;font-size:13px">The clone preview appears after generate finishes.</p></body></html>';$('clone-stage').textContent='waiting'}
function onBuildComplete(st){$('build-pct').textContent='100%';$('stage-bar').querySelectorAll('.stage-chip').forEach(c=>{c.classList.add('done');c.classList.remove('active')});$('build-actions').hidden=false;const msg=st.status==='failed'?'Build failed: '+(st.error||'unknown error'):st.status==='succeeded'?'Build finished — open pixel audit to validate.':'Build stopped ('+st.status+').';$('build-done-msg').textContent=msg}
async function buildLoop(){const id=activeJob();if(!id)return;let seen=S.seen;const bar=$('stage-bar');bar.innerHTML=STAGES.map((s,i)=>'<span class="stage-chip" data-i="'+i+'">'+s+'</span>').join('');const poll=async()=>{try{const ev=await fetch('/v1/clones/'+id+'/events?after='+seen).then(r=>r.json());for(const e of ev.events||[]){seen++;const n=STAGE_EV[e.event];if(n!=null){bar.querySelectorAll('.stage-chip').forEach((c,i)=>{c.classList.toggle('done',i<n);c.classList.toggle('active',i===n)});$('build-pct').textContent=Math.min(99,Math.round((n+1)/STAGES.length*100))+'%'}if(e.event==='generated')void mountCloneFrame('mirror');if(e.event==='app_build_done'&&e.ok)void mountCloneFrame('export')}S.seen=seen;const wf=await fetch('/v1/clones/'+id+'/wip-files').then(r=>r.ok?r.json():null);if(wf?.files?.length)renderFiles(id,wf.files);const st=await fetch('/v1/clones/'+id).then(r=>r.json());if(st.status==='running')return;clearInterval(S.buildPoll);await mountCloneFrame('export');onBuildComplete(st)}catch(e){console.warn('build poll',e)}};S.buildPoll=setInterval(poll,350);poll()}
function wipFilePath(id,rel){return '/v1/clones/'+id+'/wip-files/'+rel.split('/').map(encodeURIComponent).join('/')}
function renderFiles(id,files){const tree=$('file-tree');const text=files.filter(f=>/\\.(tsx?|jsx?|css|json|html|md)$/.test(f)).slice(-80);tree.innerHTML=text.map(f=>'<div data-f="'+f.replace(/"/g,'&quot;')+'">'+f+'</div>').join('');tree.querySelectorAll('div[data-f]').forEach(el=>{el.onclick=async()=>{tree.querySelectorAll('div').forEach(x=>x.classList.remove('active'));el.classList.add('active');const r=await fetch(wipFilePath(id,el.dataset.f));if(!r.ok){$('file-editor').textContent='Could not load file';return}const d=await r.json();$('file-editor').textContent=d.content!=null?d.content:'(binary)'}});if(!S.activeFile&&text.length){S.activeFile=text[text.length-1];tree.querySelector('[data-f="'+S.activeFile+'"]')?.click()}}
function renderBehaviorAudit(a){const b=a.behavior;if(!b){$('behavior-panel').hidden=true;return}$('behavior-panel').hidden=false;const rows=[...(b.interaction?.rows||[]),...(b.motion?.rows||[])];const el=$('behavior-rows');el.innerHTML=rows.map(r=>'<div class="behavior-row"><span class="behavior-dot '+r.status+'"></span><span>'+r.label+'</span><span class="behavior-detail">'+(r.detail||r.status)+'</span></div>').join('')||'<div class="behavior-row"><span class="behavior-dot na"></span><span>No interaction/motion data — run with verify enabled.</span></div>';const ip=b.interaction?.pass;const mp=b.motion?.pass;const pr=b.interaction?.pruned||0;let sum='';if(b.interaction?.na&&b.motion?.na)sum='Static page (no interaction probe)';else sum=(ip?'Interaction OK':'Interaction issues')+' · '+(mp?'Motion OK':'Motion issues')+(pr?(' · '+pr+' pruned'):'');$('behavior-summary').textContent=sum;if(b.deferredPatterns?.length){el.innerHTML+='<div class="behavior-row"><span class="behavior-dot static"></span><span>Deferred widgets</span><span class="behavior-detail">'+b.deferredPatterns.slice(0,4).join(', ')+'</span></div>'}}
async function goAudit(){setStep(5);const id=activeJob();try{const a=await fetch('/v1/clones/'+id+'/audit').then(r=>r.json());renderBehaviorAudit(a);const routes=S.scan?.routes?.filter(r=>S.routes.has(r.path))||[{path:'/',label:'Home'}];const sw=$('audit-routes');sw.innerHTML='';for(const rt of routes){const b=document.createElement('button');b.textContent=rt.label;b.onclick=()=>showDiff(a,1280,rt.path);if(rt.path==='/'||rt.path===S.scan?.entryPath){b.classList.add('active');showDiff(a,1280,rt.path)}sw.appendChild(b)}const parts=[];if(typeof a.score==='number')parts.push('Score '+a.score.toFixed(1));if(a.worstDiffPct!=null)parts.push('worst diff '+(a.worstDiffPct*100).toFixed(1)+'%');if(a.behavior?.interaction?.pruned)parts.push(a.behavior.interaction.pruned+' pattern(s) pruned to static');$('audit-meta').textContent=parts.length?parts.join(' · '):'Audit pending — validation may still be running'}catch(e){$('audit-meta').textContent='Audit: '+e}}
function showDiff(a,vp,path){$('audit-routes').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.textContent.includes(path==='/'?'Home':path)));const c=(a.comparisons||[]).find(x=>x.viewport===vp)||a.comparisons?.[0];if(!c){$('diff-wrap').hidden=true;return}$('diff-before').src=c.sourceUrl+'?t='+Date.now();$('diff-after').src=c.cloneUrl+'?t='+Date.now();$('diff-wrap').hidden=false}
(function diffSlider(){let drag=false;const wrap=$('diff-wrap'),handle=$('diff-handle'),after=$('diff-after');const set=p=>{const x=Math.max(5,Math.min(95,p));handle.style.left=x+'%';after.style.clipPath='inset(0 0 0 '+x+'%)'};handle.onmousedown=()=>drag=true;window.onmouseup=()=>drag=false;window.onmousemove=e=>{if(!drag)return;const r=wrap.getBoundingClientRect();set(((e.clientX-r.left)/r.width)*100)};wrap.ontouchstart=e=>{drag=true;e.preventDefault()};wrap.ontouchmove=e=>{if(!drag)return;const r=wrap.getBoundingClientRect();set(((e.touches[0].clientX-r.left)/r.width)*100)};set(50)})();
$('wiz-start').onclick=async()=>{const url=norm($('wiz-url').value);if(!url)return;$('wiz-start').disabled=true;S.url=url;saveProj();setStep(2);startTimer();try{S.scan=await apiScan(url);S.routes=top5(S.scan);renderRoutes();setStep(3);await startHomeClone()}catch(e){$('scan-status').textContent='Error: '+e;$('wiz-start').disabled=false}};
$('wiz-pages-continue').onclick=async()=>{setStep(4);S.embedBlocked=await testEmbed(S.url);if(S.embedBlocked){$('build-grid').classList.add('full-clone');$('embed-banner').hidden=false;$('live-link').href=S.url}else{$('frame-live').src=S.url}$('wiz-pages-continue').disabled=true;try{const st=await fetch('/v1/clones/'+S.homeJob).then(r=>r.json());if(st.status!=='succeeded')await waitJob(S.homeJob);if(S.routes.size>1&&!S.fullJob){await scheduleExpansion();if(S.fullJob)await waitJob(S.fullJob).catch(()=>{})}}catch{}buildLoop()};
$('wiz-finish').onclick=()=>{localStorage.setItem(ONBOARD,'1');saveProj();location.href='/studio'};
$('wiz-go-audit').onclick=()=>goAudit();
$('wiz-url').onkeydown=e=>{if(e.key==='Enter')$('wiz-start').click()};
(function resume(){const p=loadProj();if(p?.url){$('wiz-url').value=p.url;if(p.homeJob)S.homeJob=p.homeJob;if(p.fullJob)S.fullJob=p.fullJob}})();
</script>
</body>
</html>`;
