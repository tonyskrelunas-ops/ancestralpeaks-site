/* ANCESTRAL PEAKS — shared engine — 2026-11-04
   Everything hangs off window.AP. Names are stable: add new ones, never rename or remove.
   Works with or without GSAP/ScrollTrigger/Lenis (vendor/): load them before this file to get smooth scroll,
   parallax and scrubbed line drawing; without them everything degrades to IntersectionObserver + CSS.
   See shared/README.md for every class and function. */
(function(){
'use strict';
const AP = window.AP = window.AP || {};
AP.version = '2026-11-04';
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const html = document.documentElement;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const ease  = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const breathe = x => (1 - Math.cos(Math.PI * clamp(x, 0, 1))) / 2;
AP.ease = ease; AP.clamp = clamp; AP.breathe = breathe;

/* ---------- modes ---------- */
AP.render = location.hash === '#render' || !!window.__render;   // frame renderer (render.js): deterministic, no smoothing
AP.flat   = location.hash === '#flat'   || !!window.__flat;     // full-page screenshots: no pinned scenes
AP.prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
AP.motion = !AP.render && !AP.prefersReduced;                    // run continuous animation?
AP.fileMode = location.protocol === 'file:';                     // opened from a folder: Web Audio cannot read media elements
if (AP.render) html.classList.add('render');
if (AP.flat) html.classList.add('flat');
AP.root = html.dataset.root !== undefined ? html.dataset.root : '';   // path prefix for site links ('' on the live site, '..' in a preview folder)
AP.BEGIN = 'https://app.ancestralpeaks.com';

/* ---------- the pages (one source of truth for nav + footer) ---------- */
AP.pages = [
  { href: '/',          label: 'Home',           n: '' },
  { href: '/#path',     label: 'The Path',       n: '01' },
  { href: '/weeks/',    label: 'Eight Weeks',    n: '02' },
  { href: '/listen/',   label: 'Listening Room', n: '03' },
  { href: '/practice/', label: 'Practice',       n: '04' },
  { href: '/books/',    label: 'The Books',      n: '05' },
  { href: '/work/',     label: 'For Your Work',  n: '06' }
];
AP.markSVG = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M3 31 L15 11 L22 22 L27 15 L37 31 Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="20" cy="34.5" rx="6" ry="2.3" fill="currentColor" opacity=".9"/></svg>';
AP.href = p => (AP.root || '') + p;

/* ---------- nav ---------- */
AP.nav = function(host, opts){
  host = typeof host === 'string' ? $(host) : (host || $('[data-ap-nav]'));
  if (!host) return null;
  opts = Object.assign({ active: host.dataset.active || '', light: host.dataset.light === '1', begin: AP.BEGIN, menuImage: host.dataset.menuImage || '' }, opts || {});
  host.classList.add('ap-bar'); if (opts.light) host.classList.add('on-light');
  const links = AP.pages.map(p => `<a href="${AP.href(p.href)}"${p.href === opts.active ? ' aria-current="page"' : ''}>${p.label}</a>`).join('');
  host.innerHTML = `<a class="ap-mark" href="${AP.href('/')}" aria-label="Ancestral Peaks">${AP.markSVG}Ancestral Peaks</a>
    <nav class="ap-nav" aria-label="Pages">${links}</nav>
    <div class="acts">
      <button class="ap-sound" type="button" aria-pressed="false" title="Turn the sound layer on"><i><b></b><b></b><b></b></i><span class="lbl"></span></button>
      <a class="btn light" href="${opts.begin}">Begin <span class="arrow">→</span></a>
      <button class="ap-burger" type="button" aria-expanded="false" aria-controls="apMenu" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>`;
  // phone menu
  let menu = $('#apMenu');
  if (!menu) {
    menu = document.createElement('div'); menu.className = 'ap-menu'; menu.id = 'apMenu'; menu.setAttribute('aria-hidden', 'true');
    menu.innerHTML = `${opts.menuImage ? `<div class="bg"><img src="${opts.menuImage}" alt=""></div>` : ''}
      <nav aria-label="Pages">${AP.pages.map((p, i) => `<a href="${AP.href(p.href)}" style="transition-delay:${.08 + i * .05}s"><small>${p.n}</small>${p.label}</a>`).join('')}</nav>
      <div class="foot"><span class="masked">Sessions spoken in a masked voice</span><a class="btn light" href="${opts.begin}">Begin <span class="arrow">→</span></a></div>`;
    document.body.appendChild(menu);
  }
  const burger = $('.ap-burger', host);
  const setOpen = o => { burger.setAttribute('aria-expanded', String(o)); menu.classList.toggle('open', o); menu.setAttribute('aria-hidden', String(!o)); host.classList.toggle('menu-open', o); if (AP.lenis) { o ? AP.lenis.stop() : AP.lenis.start(); } document.body.style.overflow = o ? 'hidden' : ''; };
  burger.addEventListener('click', () => { setOpen(burger.getAttribute('aria-expanded') !== 'true'); AP.sound.tick(); });
  $$('a', menu).forEach(a => a.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  // sound toggle
  const sb = $('.ap-sound', host);
  sb.addEventListener('click', () => AP.sound.toggle());
  AP.sound._buttons.push(sb);
  // solid after the first screen
  const onScroll = () => host.classList.toggle('solid', (window.scrollY || html.scrollTop) > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  // light bar over light sections ([data-bar="light"])
  const lights = $$('[data-bar="light"]');
  if (lights.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) host.classList.add('on-light'); else if (!opts.light) host.classList.remove('on-light'); }); }, { rootMargin: `0px 0px -${Math.max(0, innerHeight - 72)}px 0px`, threshold: 0 });
    lights.forEach(el => io.observe(el));
  }
  $$('.ap-nav a', host).forEach(a => a.addEventListener('pointerenter', () => AP.sound.tick(0.012)));
  return host;
};

/* ---------- footer ---------- */
AP.footer = function(host, opts){
  host = typeof host === 'string' ? $(host) : (host || $('[data-ap-foot]'));
  if (!host) return null;
  opts = Object.assign({ tag: 'A place to practice. The companion to the books. Every photograph and every second of film is our own; every session is spoken in a masked voice.' }, opts || {});
  host.classList.add('ap-foot');
  host.innerHTML = `<div class="row"><div><b>${AP.markSVG}Ancestral Peaks</b><p class="tag">${opts.tag}</p></div>
    <nav aria-label="Pages">${AP.pages.map(p => `<a href="${AP.href(p.href)}">${p.label}</a>`).join('')}<a href="${AP.BEGIN}">Begin</a></nav></div>
    <div class="fine"><span>© 2026 Ancestral Peaks</span><span>Preview. Nothing here is published.</span></div>`;
  return host;
};

/* ---------- motion: the slow push-in clock, reveal, words, counts ---------- */
let kb0 = performance.now();
function kbLoop(now){ html.style.setProperty('--kb', ((now - kb0) / 1000).toFixed(2)); requestAnimationFrame(kbLoop); }

AP.reveal = function(root){
  const els = $$('.reveal, [data-words]', root);
  if (AP.render || AP.prefersReduced) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  els.forEach(el => io.observe(el));
};
AP.words = function(root){
  $$('[data-words]', root).forEach(el => {
    if (el.dataset.wordsDone) return; el.dataset.wordsDone = '1';
    const step = Number(el.dataset.words) || 70;
    let i = 0;
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3 && n.textContent.trim()) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span'); s.className = 'w'; s.textContent = part; s.style.transitionDelay = (i++ * step) + 'ms'; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
      });
    };
    walk(el);
  });
};
AP.counts = function(root){
  const els = $$('[data-count]', root);
  const run = el => {
    const to = Number(el.dataset.count) || 0, suf = el.dataset.suffix || '', dur = Number(el.dataset.dur) || 1600, t0 = performance.now();
    const f = now => { const p = ease(clamp((now - t0) / dur, 0, 1)); el.textContent = Math.round(to * p).toLocaleString('en-US') + suf; if (p < 1) requestAnimationFrame(f); };
    if (!AP.motion) { el.textContent = to.toLocaleString('en-US') + suf; return; }
    requestAnimationFrame(f);
  };
  if (!('IntersectionObserver' in window) || !AP.motion || AP.flat) { els.forEach(run); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .4 });
  els.forEach(el => io.observe(el));
};

/* ---------- GSAP + ScrollTrigger + Lenis ---------- */
AP.gsap = window.gsap || null;
AP.ST = window.ScrollTrigger || null;
AP.lenis = null;
AP.smooth = function(){
  if (!AP.gsap || !AP.ST) return;
  AP.gsap.registerPlugin(AP.ST);
  if (window.Lenis && AP.motion && !AP.flat) {
    AP.lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
    AP.lenis.on('scroll', AP.ST.update);
    AP.gsap.ticker.add(time => AP.lenis.raf(time * 1000));
    AP.gsap.ticker.lagSmoothing(0);
    html.classList.add('lenis');
  }
  if (AP.render) AP.ST.config({ autoRefreshEvents: 'load,resize' });
};
AP.scrollTo = function(target, opts){
  const el = typeof target === 'string' ? $(target) : target; if (!el) return;
  if (AP.lenis) AP.lenis.scrollTo(el, Object.assign({ offset: -8, duration: 1.4 }, opts || {})); else el.scrollIntoView({ behavior: AP.motion ? 'smooth' : 'auto', block: 'start' });
};
// [data-parallax="0.25"] moves the element against the scroll by that fraction of its parent's travel
AP.parallax = function(root){
  const els = $$('[data-parallax]', root); if (!els.length) return;
  if (!AP.gsap || !AP.ST || !AP.motion) return;
  els.forEach(el => {
    const p = Number(el.dataset.parallax) || .2, trig = el.closest('[data-parallax-trigger]') || el.parentElement;
    AP.gsap.fromTo(el, { yPercent: -p * 50 }, { yPercent: p * 50, ease: 'none', scrollTrigger: { trigger: trig, start: 'top bottom', end: 'bottom top', scrub: AP.render ? true : 0.6 } });
  });
};
// svg path.draw draws itself as it comes into view
AP.draw = function(root){
  $$('svg path.draw, svg polyline.draw, svg circle.draw', root).forEach(p => {
    let L = 1; try { L = p.getTotalLength(); } catch (e) {}
    p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    const trig = p.closest('[data-draw-trigger]') || p.closest('section') || p.ownerSVGElement;
    if (AP.gsap && AP.ST && AP.motion) {
      AP.gsap.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: trig, start: p.dataset.start || 'top 80%', end: p.dataset.end || 'top 20%', scrub: AP.render ? true : 0.5 } });
    } else if (AP.render || AP.prefersReduced) { p.style.strokeDashoffset = 0; }
    else { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { p.style.transition = 'stroke-dashoffset 2.4s ease'; p.style.strokeDashoffset = 0; io.unobserve(p); } }), { threshold: .2 }); io.observe(p); }
  });
};

/* ---------- looping video component ---------- */
/* <div class="ap-loop" data-src="clip.mp4" data-poster="clip.jpg" [data-audio="1"]></div> */
AP.loops = [];
AP.loop = function(el){
  if (el.dataset.loopDone) return el._loop; el.dataset.loopDone = '1';
  const poster = el.dataset.poster;
  if (poster) { const im = document.createElement('img'); im.className = 'poster'; im.src = poster; im.alt = ''; im.loading = 'lazy'; el.appendChild(im); }
  const v = document.createElement('video');
  v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.preload = AP.render ? 'auto' : 'none'; v.disableRemotePlayback = true;
  if (poster) v.poster = poster;
  el.appendChild(v);
  const api = { el, video: v, loaded: false,
    load(){ if (api.loaded) return; api.loaded = true; v.src = el.dataset.src; v.load(); },
    play(){ if (!AP.motion && !AP.render) return; api.load(); v.play().then(() => el.classList.add('playing')).catch(() => {}); },
    pause(){ v.pause(); },
    seek(t){ return seekVideo(v, t); } };
  v.addEventListener('playing', () => el.classList.add('playing'));
  if (AP.render) { api.load(); v.pause(); el.classList.add('playing'); }
  else if (AP.prefersReduced) { /* poster only */ }
  else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) api.play(); else api.pause(); }), { rootMargin: '25% 0px 25% 0px', threshold: 0.01 });
    io.observe(el);
  } else api.play();
  el._loop = api; AP.loops.push(api); return api;
};
function seekVideo(v, t){
  return new Promise(res => {
    if (!v.src || v.readyState < 1) { const once = () => { v.removeEventListener('loadedmetadata', once); seekVideo(v, t).then(res); }; v.addEventListener('loadedmetadata', once); if (!v.src && v.parentElement && v.parentElement.dataset.src) v.src = v.parentElement.dataset.src; setTimeout(res, 1200); return; }
    v.pause(); const d = v.duration || 10; const tt = ((t % d) + d) % d;
    if (Math.abs(v.currentTime - tt) < .02) return res();
    const done = () => { v.removeEventListener('seeked', done); res(); };
    v.addEventListener('seeked', done); v.currentTime = tt; setTimeout(res, 600);
  });
}
AP.seekVideos = function(t){
  const vids = $$('video').filter(v => { const r = v.getBoundingClientRect(); return r.bottom > -innerHeight && r.top < innerHeight * 2 && v.offsetParent !== null; });
  return Promise.all(vids.map(v => seekVideo(v, t)));
};

/* ---------- cinematic cut: shots crossfading on a timeline ---------- */
/* <div class="ap-cut" data-fade="1.8"><div class="shot" data-dur="6"><video …></div><div class="shot" data-dur="5"><img …></div>…</div> */
AP.cut = function(el, opts){
  opts = Object.assign({ fade: Number(el.dataset.fade) || 1.8, zoom: 0.08, loop: true }, opts || {});
  const shots = $$('.shot', el);
  const durs = shots.map(s => Number(s.dataset.dur) || 6);
  const starts = []; let acc = 0; durs.forEach(d => { starts.push(acc); acc += d; });
  const DUR = acc;
  shots.forEach(s => { const lp = $('.ap-loop', s); if (lp) AP.loop(lp); });
  const vids = shots.map(s => $('video', s));
  let running = false, t0 = 0, raf = 0, last = -1;
  function seek(t){
    const tt = opts.loop ? ((t % DUR) + DUR) % DUR : clamp(t, 0, DUR);
    let active = -1;
    shots.forEach((s, i) => {
      const a = starts[i], b = a + durs[i], f = opts.fade;
      // visible from a - f (fading in under the previous) to b (the next fades in over us)
      let o = 0;
      if (tt >= a - f && tt < b) o = tt < a ? breathe((tt - (a - f)) / f) : 1;
      // the first shot also shows at the very end so the loop closes
      if (i === 0 && opts.loop && tt >= DUR - f) o = breathe((tt - (DUR - f)) / f);
      if (i === shots.length - 1 && tt >= b - f && tt < b && opts.loop) o = 1 - breathe((tt - (b - f)) / f);
      s.style.opacity = o.toFixed(3);
      s.style.zIndex = o > 0 ? (i === 0 && tt >= DUR - f ? 5 : 2) : 1;
      const local = clamp((tt - a + f) / (durs[i] + f), 0, 1);
      s.style.transform = `scale(${(1 + opts.zoom * local).toFixed(4)})`;
      if (o > 0.02 && active < 0) active = i;
    });
    if (active !== last) { last = active; if (!AP.render) vids.forEach((v, i) => { if (!v) return; const lp = shots[i]._loopApi || (shots[i].querySelector('.ap-loop') || {})._loop; if (Math.abs(i - active) <= 1 || (active === 0 && i === shots.length - 1) || (active === shots.length - 1 && i === 0)) { if (lp) lp.play(); else v.play().catch(() => {}); } else { if (lp) lp.pause(); else v.pause(); } }); }
    return tt;
  }
  function loop(now){ seek((now - t0) / 1000); raf = requestAnimationFrame(loop); }
  const api = { el, DUR, seek, shots,
    start(){ if (running || !AP.motion) { seek(0); return; } running = true; t0 = performance.now(); raf = requestAnimationFrame(loop); },
    stop(){ running = false; cancelAnimationFrame(raf); } };
  if (AP.render) { shots.forEach(s => { const v = $('video', s); if (v) { v.preload = 'auto'; if (!v.src && v.dataset.src) v.src = v.dataset.src; } }); }
  seek(0);
  AP.registerSeek(t => { seek(t); });
  el._cut = api; return api;
};

/* ---------- the site-wide sound layer ---------- */
/* Beds: real files (AP.sound.register('creek', 'media/bed-creek.mp3')) or synthesized in Web Audio (dawn, wind/desert, ocean, hearth/fire, creek).
   Sections carry data-scene="creek|dawn|wind|ocean|hearth"; AP.scenes() crossfades the bed as each section crosses the middle of the screen. */
AP.sound = {
  on: false, scene: null, ctx: null, master: null, _buttons: [], files: {}, _bed: null, _fileBed: null, _level: 1, _duck: 1, _noise: null, _started: false,
  register(scene, url){ AP.sound.files[scene] = url; },
  ensure(){
    const S = AP.sound; if (S.ctx) { if (S.ctx.state === 'suspended') S.ctx.resume(); return S.ctx; }
    try { S.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    S.master = S.ctx.createGain(); S.master.gain.value = 0; S.master.connect(S.ctx.destination);
    S.fx = S.ctx.createGain(); S.fx.gain.value = 1; S.fx.connect(S.ctx.destination);
    return S.ctx;
  },
  noise(){ const S = AP.sound; if (S._noise) return S._noise; const n = S.ctx.sampleRate * 2, b = S.ctx.createBuffer(2, n, S.ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; } S._noise = b; return b; },
  toggle(){ AP.sound.on ? AP.sound.stop() : AP.sound.start(); },
  start(){
    const S = AP.sound; if (!S.ensure()) return;
    S.on = true; S._started = true; html.classList.add('sound-on');
    S._buttons.forEach(b => b.setAttribute('aria-pressed', 'true'));
    S.master.gain.cancelScheduledValues(S.ctx.currentTime); S.master.gain.setTargetAtTime(0.5, S.ctx.currentTime, 0.8);
    S.set(S.scene || html.dataset.scene || 'creek', true);
    try { localStorage.setItem('ap.sound', '1'); } catch (e) {}
    S.tick(0.02);
    dispatchEvent(new CustomEvent('ap:sound', { detail: { on: true } }));
  },
  stop(){
    const S = AP.sound; S.on = false; html.classList.remove('sound-on');
    S._buttons.forEach(b => b.setAttribute('aria-pressed', 'false'));
    if (S.ctx) { S.master.gain.cancelScheduledValues(S.ctx.currentTime); S.master.gain.setTargetAtTime(0, S.ctx.currentTime, 0.5); }
    if (S._fileBed) S._fadeEl(S._fileBed, 0, 1500, true);
    S._fileBed = null;
    setTimeout(() => { if (!S.on && S._bed) { S._bed.stop(); S._bed = null; } }, 2600);
    try { localStorage.setItem('ap.sound', '0'); } catch (e) {}
    dispatchEvent(new CustomEvent('ap:sound', { detail: { on: false } }));
  },
  level(v){ const S = AP.sound; S._level = v; if (S.ctx && S.on) S.master.gain.setTargetAtTime(0.5 * v, S.ctx.currentTime, 0.6); if (S._fileBed) S._fadeEl(S._fileBed, 0.55 * v * S._duck, 700); },
  duck(d){ const S = AP.sound; S._duck = d ? 0.3 : 1; if (S.ctx && S.on) S.master.gain.setTargetAtTime(0.5 * S._level * S._duck, S.ctx.currentTime, d ? 0.4 : 1.2); if (S._fileBed) S._fadeEl(S._fileBed, 0.55 * S._level * S._duck, d ? 500 : 1500); },
  set(scene, force){
    const S = AP.sound; if (!scene) return; if (scene === S.scene && !force) return; S.scene = scene;
    if (!S.on || !S.ctx) return;
    // fade out whatever plays
    if (S._bed) { const old = S._bed; old.out.gain.setTargetAtTime(0, S.ctx.currentTime, 1.1); setTimeout(() => old.stop(), 3200); S._bed = null; }
    if (S._fileBed) { S._fadeEl(S._fileBed, 0, 2800, true); S._fileBed = null; }
    if (S.files[scene]) {
      const a = new Audio(); a.src = S.files[scene]; a.loop = true; a.preload = 'auto'; a.volume = 0; a.crossOrigin = 'anonymous';
      a.play().then(() => S._fadeEl(a, 0.55 * S._level * S._duck, 2600)).catch(() => {});
      S._fileBed = a;
    } else {
      const bed = S._synth(scene); if (bed) { bed.out.gain.setValueAtTime(0, S.ctx.currentTime); bed.out.gain.setTargetAtTime(1, S.ctx.currentTime, 1.4); S._bed = bed; }
    }
    dispatchEvent(new CustomEvent('ap:scene', { detail: { scene } }));
  },
  _fadeEl(a, to, ms, stopAfter){
    const from = a.volume, t0 = performance.now();
    const f = now => { const p = clamp((now - t0) / ms, 0, 1); a.volume = from + (to - from) * p; if (p < 1) requestAnimationFrame(f); else if (stopAfter) { a.pause(); a.src = ''; } };
    requestAnimationFrame(f);
  },
  // synthesized beds, the same recipes as the session masters (peaks_master.py)
  _synth(scene){
    const S = AP.sound, c = S.ctx, now = c.currentTime; if (!c) return null;
    const out = c.createGain(); out.gain.value = 0; out.connect(S.master);
    const nodes = [], timers = [];
    const src = () => { const s = c.createBufferSource(); s.buffer = S.noise(); s.loop = true; s.start(); nodes.push(s); return s; };
    const bp = (lo, hi) => { const h = c.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = lo; h.Q.value = .5; const l = c.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = hi; l.Q.value = .5; h.connect(l); return { i: h, o: l }; };
    const lfo = (period, base, depth, shape) => { // returns an AudioParam-driving node: base + depth*(0.5+0.5 sin)
      const o = c.createOscillator(); o.frequency.value = 1 / period; o.start(now); nodes.push(o);
      const g = c.createGain(); g.gain.value = depth * .5; o.connect(g);
      const k = c.createConstantSource(); k.offset.value = base + depth * .5; k.start(now); nodes.push(k);
      const sum = c.createGain(); g.connect(sum); k.connect(sum);
      if (shape) { // shaped swell: base + depth * ((0.5+0.5 sin)^shape), mapped through a curve on the raw oscillator
        const ws = c.createWaveShaper(); const cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; cv[i] = base + depth * Math.pow((x + 1) / 2, shape); } ws.curve = cv; ws.oversample = 'none'; o.connect(ws); return ws; }
      return sum;
    };
    const mod = (node, ctl) => { const g = c.createGain(); g.gain.value = 0; ctl.connect(g.gain); node.connect(g); return g; };
    const mix = (node, gain) => { const g = c.createGain(); g.gain.value = gain; node.connect(g); g.connect(out); return g; };
    const burstBuf = (len, decay) => { const n = Math.max(8, Math.floor(len * c.sampleRate)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n / decay)); return b; };
    if (scene === 'creek' || scene === 'water') {
      const a = bp(450, 5000); src().connect(a.i); mix(a.o, .55);
      const b = bp(900, 7000); src().connect(b.i); mix(mod(b.o, lfo(0.95, .4, .6)), .22);
      out.gain.value = 0; mix(out, 0); out._base = .9;
    } else if (scene === 'dawn' || scene === 'morning') {
      const a = bp(120, 1400); src().connect(a.i); const m1 = mod(a.o, lfo(9.5, 0, 1)); const m2 = mod(m1, lfo(23, 0, 1)); mix(m2, .65 * .9); mix(a.o, .35 * .9);
      // distant birds
      const birds = bp(1800, 4000); mix(birds.o, .9);
      const chirp = () => { if (!S.on) return; const f0 = 2300 + Math.random() * 1100, o = c.createOscillator(), g = c.createGain(), t = c.currentTime; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 - 500, t + .22); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .08); g.gain.linearRampToValueAtTime(0, t + .22); o.connect(g); g.connect(birds.i); o.start(t); o.stop(t + .25); timers.push(setTimeout(chirp, (7 + Math.random() * 9) * 1000)); };
      timers.push(setTimeout(chirp, 4000));
    } else if (scene === 'wind' || scene === 'desert' || scene === 'mesa') {
      const a = bp(300, 3200); src().connect(a.i); let m = mod(a.o, lfo(11, 0, 1)); m = mod(m, lfo(5.3, 0, 1)); m = mod(m, lfo(31, 0, 1)); mix(m, .75 * .75); mix(a.o, .25 * .75);
      const b = bp(60, 300); src().connect(b.i); mix(mod(b.o, lfo(17, 0, 1)), .25);
    } else if (scene === 'ocean' || scene === 'sea') {
      const sw = lfo(7.2, 0, 1, 2.2), sw3 = lfo(7.2, 0, 1, 6.6);
      const a = bp(80, 700); src().connect(a.i); mix(mod(a.o, sw), .75 * .9); mix(a.o, .25 * .9);
      const b = bp(1500, 7000); src().connect(b.i); mix(mod(b.o, sw3), .35);
    } else if (scene === 'hearth' || scene === 'fire' || scene === 'council') {
      const a = bp(60, 500); src().connect(a.i); mix(mod(a.o, lfo(3.1, .7, .3)), .35);
      const cr = bp(800, 6000); mix(cr.o, 1.0);
      const bufs = [burstBuf(.006, 4), burstBuf(.012, 4), burstBuf(.02, 4), burstBuf(.009, 3)];
      const crackle = () => { if (!S.on) return; const s = c.createBufferSource(); s.buffer = bufs[Math.floor(Math.random() * bufs.length)]; const g = c.createGain(); g.gain.value = .05 + Math.random() * .2; s.connect(g); g.connect(cr.i); s.start(); timers.push(setTimeout(crackle, -Math.log(1 - Math.random()) * 350)); };
      timers.push(setTimeout(crackle, 200));
    } else { return S._synth('creek'); }
    return { out, stop(){ nodes.forEach(n => { try { n.stop(); } catch (e) {} }); timers.forEach(clearTimeout); try { out.disconnect(); } catch (e) {} } };
  },
  // soft interaction sounds (only when the layer is on)
  tone(f, dur, gain){ const S = AP.sound; if (!S.on || !S.ctx) return; const c = S.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.value = 0; o.connect(g); g.connect(S.fx); const n = c.currentTime; g.gain.linearRampToValueAtTime(gain, n + .04); g.gain.exponentialRampToValueAtTime(.0001, n + dur); o.start(n); o.stop(n + dur + .05); },
  tick(g){ AP.sound.tone(1320, .12, g || .02); },
  chime(){ AP.sound.tone(392, 1.6, .05); setTimeout(() => AP.sound.tone(587, 1.4, .035), 180); }
};
// remembered preference: arm on the first gesture (browsers need one)
AP.onFirstGesture = function(fn){ const h = () => { removeEventListener('pointerdown', h); removeEventListener('keydown', h); fn(); }; addEventListener('pointerdown', h, { once: true }); addEventListener('keydown', h, { once: true }); };

/* ---------- scenes: data-scene sections drive the sound layer and <html data-scene> ---------- */
AP.scenes = function(root){
  const secs = $$('[data-scene]', root); if (!secs.length) return;
  let chip = $('.ap-scene-chip'); if (!chip) { chip = document.createElement('div'); chip.className = 'ap-scene-chip'; chip.innerHTML = '<i></i><span></span>'; document.body.appendChild(chip); }
  const apply = el => { const sc = el.dataset.scene; html.dataset.scene = sc; $('span', chip).textContent = el.dataset.sceneLabel || ({ creek: 'the creek', dawn: 'first light on the mesa', wind: 'wind on the mesa', desert: 'wind over sand', ocean: 'the Pacific', hearth: 'the fire' })[sc] || sc; AP.sound.set(sc); };
  if (AP.render || !('IntersectionObserver' in window)) { apply(secs[0]); return; }
  const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) apply(e.target); }); }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  secs.forEach(s => io.observe(s));
};

/* ---------- audio-reactive visuals (shared by players and voice lines) ---------- */
/* bands come from an AnalyserNode when the page is served over http(s); from a sidecar envelope file (name.env.json,
   made by shared/tools/make_env.py) when opened from a folder; from a slow breath when idle. */
AP.Visual = function(canvas, kind, opts){
  opts = Object.assign({ color: '#44665A', color2: '#D1A63C', bg: 'transparent' }, opts || {});
  const ctx = canvas.getContext('2d'); let W = 0, H = 0, dpr = 1;
  function resize(){ dpr = Math.min(2, window.devicePixelRatio || 1); const r = canvas.getBoundingClientRect(); W = Math.max(2, Math.round(r.width)); H = Math.max(2, Math.round(r.height)); canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  resize(); if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  const sm = { low: 0, mid: 0, high: 0, level: 0 };
  const ripples = [];
  function draw(b, t){
    // smooth the bands so the picture breathes instead of jittering
    for (const k in sm) sm[k] += ((b[k] || 0) - sm[k]) * (b[k] > sm[k] ? .35 : .08);
    ctx.clearRect(0, 0, W, H);
    const c1 = opts.color, c2 = opts.color2;
    if (kind === 'horizon') {
      // a breathing horizon line, like the ridge of the Peaks
      const base = H * .62, n = 48; ctx.beginPath(); ctx.moveTo(0, H);
      for (let i = 0; i <= n; i++) { const x = i / n * W; const k = i / n; const hill = Math.sin(k * Math.PI * 1.1 + t * .15) * .5 + Math.sin(k * 6.3 + t * .4) * .25 + Math.sin(k * 13 + t * .9) * .12; const y = base - hill * H * .22 * (0.25 + sm.low * 1.1) - Math.sin(k * 31 + t * 3) * H * .06 * sm.high; ctx.lineTo(x, y); }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = hexA(c1, .18 + sm.mid * .3); ctx.fill();
      ctx.beginPath(); for (let i = 0; i <= n; i++) { const x = i / n * W; const k = i / n; const hill = Math.sin(k * Math.PI * 1.1 + t * .15) * .5 + Math.sin(k * 6.3 + t * .4) * .25 + Math.sin(k * 13 + t * .9) * .12; const y = base - hill * H * .22 * (0.25 + sm.low * 1.1) - Math.sin(k * 31 + t * 3) * H * .06 * sm.high; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.strokeStyle = c2; ctx.lineWidth = 1.6; ctx.globalAlpha = .7 + sm.level * .3; ctx.stroke(); ctx.globalAlpha = 1;
      // the sun: a disc that brightens with the voice
      ctx.beginPath(); ctx.arc(W * .78, base - H * .3, 4 + sm.level * 9, 0, Math.PI * 2); ctx.fillStyle = hexA(c2, .35 + sm.level * .6); ctx.fill();
    } else if (kind === 'ripples') {
      const cx = W / 2, cy = H * .5, R = Math.max(W, H) * .6;
      if (sm.level > .22 && (ripples.length === 0 || t - ripples[ripples.length - 1].t > .18 - sm.level * .1)) ripples.push({ t, a: .5 + sm.level * .5 });
      while (ripples.length && t - ripples[0].t > 2.8) ripples.shift();
      ripples.forEach(r => { const age = (t - r.t) / 2.8; ctx.beginPath(); ctx.ellipse(cx, cy, 6 + age * R, (6 + age * R) * .36, 0, 0, Math.PI * 2); ctx.strokeStyle = hexA(c1, (1 - age) * .55 * r.a); ctx.lineWidth = 1.5 + (1 - age) * 1.5; ctx.stroke(); });
      ctx.beginPath(); ctx.ellipse(cx, cy, 5 + sm.low * 14, (5 + sm.low * 14) * .36, 0, 0, Math.PI * 2); ctx.fillStyle = hexA(c2, .5 + sm.level * .5); ctx.fill();
      // resting water lines
      for (let i = 0; i < 3; i++) { const y = cy + (i - 1) * H * .28 + Math.sin(t * .7 + i) * 2; ctx.beginPath(); for (let x = 0; x <= W; x += 6) ctx.lineTo(x, y + Math.sin(x * .05 + t * 1.3 + i * 2) * (1.2 + sm.mid * 3)); ctx.strokeStyle = hexA(c1, .18); ctx.lineWidth = 1; ctx.stroke(); }
    } else if (kind === 'bars') {
      const n = Math.max(8, Math.floor(W / 5)); for (let i = 0; i < n; i++) { const k = i / n; const v = (k < .33 ? sm.low : k < .66 ? sm.mid : sm.high) * (0.6 + 0.4 * Math.sin(i * 1.7 + t * 4)) + .08; const h = Math.max(2, v * H * .9); ctx.fillStyle = hexA(c1, .6 + .4 * v); ctx.fillRect(i * (W / n) + 1, H / 2 - h / 2, Math.max(1, W / n - 2), h); }
    } else { // rings
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .42 + Math.max(0, (W - H)) * .08;
      for (let i = 5; i >= 0; i--) { const k = i / 5; const r = R * (0.18 + k * .95) * (1 + sm.low * .18 * (1 - k * .5)) + Math.sin(t * .9 + i) * 1.2; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.9, r * .62, 0, 0, Math.PI * 2); ctx.strokeStyle = hexA(i % 2 ? c1 : c2, .12 + (1 - k) * .3 + sm.mid * .3); ctx.lineWidth = 1 + (1 - k) * 1.2 + sm.high * 1.5; ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(cx, cy, 6 + sm.level * 16, (6 + sm.level * 16) * .5, 0, 0, Math.PI * 2); ctx.fillStyle = hexA(c2, .55 + sm.level * .45); ctx.fill();
    }
  }
  return { draw, resize, canvas };
};
function hexA(hex, a){ if (hex[0] !== '#') return hex; const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1).toFixed(3)})`; }
AP.hexA = hexA;

/* band source for an <audio>: analyser (http) → envelope sidecar (file://) → idle breath */
function BandSource(audio, envUrl){
  const S = { bands: { low: 0, mid: 0, high: 0, level: 0 }, env: null, an: null, data: null, tainted: false };
  const useEnv = j => { if (j && j.data) { S.env = j; S.env.bytes = Uint8Array.from(atob(j.data), ch => ch.charCodeAt(0)); } };
  if (envUrl) {
    const key = envUrl.split('/').pop().replace(/\.env\.(json|js)$/, '');
    if (window.AP_ENV && window.AP_ENV[key]) useEnv(window.AP_ENV[key]);
    else if (AP.fileMode) { // fetch() is refused on file:// pages, so load the sidecar as a script (make_env.py writes name.env.js beside name.env.json)
      const sc = document.createElement('script'); sc.src = envUrl.replace(/\.env\.json$/, '.env.js'); sc.onload = () => { if (window.AP_ENV && window.AP_ENV[key]) useEnv(window.AP_ENV[key]); }; document.head.appendChild(sc);
    } else fetch(envUrl).then(r => r.ok ? r.json() : null).then(useEnv).catch(() => {});
  }
  S.attach = () => {
    if (S.an || AP.fileMode || !AP.sound.ensure()) return;
    try { const c = AP.sound.ctx; const srcNode = c.createMediaElementSource(audio); S.an = c.createAnalyser(); S.an.fftSize = 512; S.an.smoothingTimeConstant = .6; srcNode.connect(S.an); S.an.connect(c.destination); S.data = new Uint8Array(S.an.frequencyBinCount); } catch (e) { S.an = null; }
  };
  S.read = t => {
    const b = S.bands;
    if (S.an && !S.tainted) {
      S.an.getByteFrequencyData(S.data); const n = S.data.length; let lo = 0, mi = 0, hi = 0; const a = Math.floor(n * .06), bq = Math.floor(n * .25);
      for (let i = 1; i < a; i++) lo += S.data[i]; for (let i = a; i < bq; i++) mi += S.data[i]; for (let i = bq; i < n * .7; i++) hi += S.data[i];
      lo /= (a - 1) * 255; mi /= (bq - a) * 255; hi /= (n * .7 - bq) * 255;
      if (!audio.paused && audio.currentTime > .7 && lo + mi + hi === 0) S.tainted = true;
      else { b.low = Math.min(1, lo * 1.6); b.mid = Math.min(1, mi * 2.2); b.high = Math.min(1, hi * 3.5); b.level = Math.min(1, (lo * 1.2 + mi * 1.6 + hi * 1.2) / 1.6); return b; }
    }
    if (S.env && S.env.bytes) {
      const i = Math.floor(audio.currentTime * S.env.rate) * 3; const E = S.env.bytes;
      if (i + 2 < E.length) { b.low = E[i] / 255; b.mid = E[i + 1] / 255; b.high = E[i + 2] / 255; b.level = Math.min(1, (b.low + b.mid + b.high) / 2.2); return b; }
    }
    // idle: a slow breath, faintly alive
    const s = .06 + .05 * (0.5 + 0.5 * Math.sin(t * .7)); b.low = s; b.mid = s * .6; b.high = s * .3; b.level = s; return b;
  };
  return S;
}

/* ---------- the audio player ---------- */
/* <div class="ap-player" data-src="x.mp3" data-title="…" data-sub="…" data-visual="rings|horizon|ripples|bars" [data-env="x.env.json"] [data-masked="1"] [data-color="#44665A"]></div> */
AP.players = []; AP.current = null;
AP.player = function(el, opts){
  if (el.dataset.playerDone) return el._player; el.dataset.playerDone = '1';
  opts = Object.assign({ src: el.dataset.src, title: el.dataset.title || '', sub: el.dataset.sub || '', visual: el.dataset.visual || 'rings', env: el.dataset.env || (el.dataset.src ? el.dataset.src.replace(/\.(mp3|m4a|wav|ogg)$/i, '.env.json') : ''), masked: el.dataset.masked !== '0', color: el.dataset.color || getComputedStyle(el).getPropertyValue('--pc').trim() || '#44665A', color2: el.dataset.color2 || '#D1A63C', duration: Number(el.dataset.duration) || 0 }, opts || {});
  el.innerHTML = `<button class="play" type="button" aria-label="Play ${opts.title}"><svg class="ic-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><svg class="ic-pause" viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg></button>
    <div class="meta"><h3 class="t">${opts.title}</h3>${opts.sub ? `<p>${opts.sub}</p>` : ''}</div>
    <div class="vis"><canvas aria-hidden="true"></canvas></div>
    <div class="bar"><span class="cur">0:00</span><div class="meter" role="slider" aria-label="Position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><i></i></div><span class="dur">${opts.duration ? fmt(opts.duration) : '–:––'}</span></div>
    ${opts.masked ? '<span class="masked">Spoken in a masked voice</span>' : ''}`;
  const audio = new Audio(); audio.preload = 'none'; audio.src = opts.src;
  const canvas = $('canvas', el), vis = AP.Visual(canvas, opts.visual, { color: opts.color, color2: opts.color2 });
  const bands = BandSource(audio, opts.env);
  const meter = $('.meter', el), fill = $('.meter i', el), cur = $('.cur', el), dur = $('.dur', el), btn = $('.play', el);
  let raf = 0, t0 = performance.now(), visible = true;
  function frame(now){ const t = (now - t0) / 1000; if (visible || !audio.paused) vis.draw(bands.read(t), t); raf = requestAnimationFrame(frame); }
  if (AP.motion) raf = requestAnimationFrame(frame); else { vis.draw(bands.read(0), 0); AP.registerSeek(t => vis.draw(bands.read(t), t)); } // the renderer still sees the picture breathe
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; }), { threshold: 0 }).observe(el);
  const api = { el, audio, opts,
    play(){ if (AP.current && AP.current !== api) AP.current.pause(); AP.current = api; bands.attach(); audio.play().then(() => { el.classList.add('playing'); AP.sound.duck(true); dispatchEvent(new CustomEvent('ap:play', { detail: api })); }).catch(() => {}); },
    pause(){ audio.pause(); el.classList.remove('playing'); if (AP.current === api) AP.sound.duck(false); },
    toggle(){ audio.paused ? api.play() : api.pause(); },
    seek(frac){ if (audio.duration) audio.currentTime = clamp(frac, 0, 1) * audio.duration; } };
  btn.addEventListener('click', () => { api.toggle(); AP.sound.tick(0.015); });
  audio.addEventListener('timeupdate', () => { const d = audio.duration || opts.duration || 1; fill.style.width = (100 * audio.currentTime / d) + '%'; cur.textContent = fmt(audio.currentTime); meter.setAttribute('aria-valuenow', Math.round(100 * audio.currentTime / d)); });
  audio.addEventListener('loadedmetadata', () => { dur.textContent = fmt(audio.duration); });
  audio.addEventListener('ended', () => { el.classList.remove('playing'); AP.sound.duck(false); AP.sound.chime(); dispatchEvent(new CustomEvent('ap:ended', { detail: api })); });
  audio.addEventListener('pause', () => el.classList.remove('playing'));
  meter.addEventListener('click', e => { const r = meter.getBoundingClientRect(); api.seek((e.clientX - r.left) / r.width); });
  meter.addEventListener('keydown', e => { if (e.key === 'ArrowRight') audio.currentTime += 15; if (e.key === 'ArrowLeft') audio.currentTime -= 15; });
  el._player = api; AP.players.push(api); return api;
};
function fmt(s){ s = Math.max(0, Math.round(s || 0)); const m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); }
AP.fmt = fmt;

/* ---------- "hear him say it": a short line, words arriving with the voice ---------- */
/* <button class="ap-say" data-src="snip.mp3" data-text="…" [data-who="Week one"] [data-auto="1"]></button> */
AP.says = [];
AP.say = function(el){
  if (el.dataset.sayDone) return el._say; el.dataset.sayDone = '1';
  const text = el.dataset.text || el.textContent.trim(), who = el.dataset.who || '';
  const words = text.split(/\s+/);
  el.innerHTML = `<span class="ic"><canvas aria-hidden="true"></canvas><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span><span class="txt">${words.map(w => `<span class="w">${w}</span>`).join(' ')}</span>${who ? `<span class="who">${who} · spoken in a masked voice</span>` : ''}`;
  el.classList.add('armed'); el.setAttribute('aria-label', `Hear it said: ${text}`);
  const audio = new Audio(); audio.preload = 'none'; audio.src = el.dataset.src;
  const canvas = $('canvas', el), vis = AP.Visual(canvas, 'bars', { color: '#100B0D', color2: '#100B0D' });
  const bands = BandSource(audio, el.dataset.env || el.dataset.src.replace(/\.(mp3|m4a|wav)$/i, '.env.json'));
  const W = $$('.txt .w', el);
  let raf = 0, t0 = 0, played = false;
  function frame(now){ const t = (now - t0) / 1000; vis.draw(bands.read(t), t); const d = audio.duration || Number(el.dataset.duration) || words.length * .38; const lead = .25; const k = (audio.currentTime + lead) / d; W.forEach((w, i) => w.classList.toggle('on', i / W.length <= k)); if (!audio.paused) raf = requestAnimationFrame(frame); }
  const api = { el, audio, play(){ if (AP.current && AP.current.audio !== audio) AP.current.pause(); AP.says.forEach(s => { if (s !== api) s.stop(); }); bands.attach(); W.forEach(w => w.classList.remove('on')); el.classList.remove('done'); audio.currentTime = 0; audio.play().then(() => { played = true; el.classList.add('playing'); AP.sound.duck(true); t0 = performance.now(); raf = requestAnimationFrame(frame); }).catch(() => {}); }, stop(){ audio.pause(); el.classList.remove('playing'); cancelAnimationFrame(raf); } };
  el.addEventListener('click', () => { audio.paused ? api.play() : api.stop(); });
  audio.addEventListener('ended', () => { el.classList.remove('playing'); el.classList.add('done'); W.forEach(w => w.classList.add('on')); AP.sound.duck(false); cancelAnimationFrame(raf); });
  audio.addEventListener('pause', () => { if (AP.current !== api) AP.sound.duck(false); });
  // auto: say it once when it scrolls into view, if the visitor has the sound on
  if (el.dataset.auto && AP.motion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && AP.sound.on && !played && !(AP.current && !AP.current.audio.paused)) { api.play(); io.unobserve(el); } }), { rootMargin: '-30% 0px -30% 0px', threshold: 0 });
    io.observe(el);
  }
  el._say = api; AP.says.push(api); return api;
};

/* ---------- particle fields (deterministic in t, so the renderer can seek them) ---------- */
/* <canvas class="ap-particles" data-kind="ripples|sand|embers|stars|pollen" [data-n="120"] [data-color="#fff"]></canvas> */
AP.particles = function(canvas, kind, opts){
  kind = kind || canvas.dataset.kind || 'pollen';
  opts = Object.assign({ n: Number(canvas.dataset.n) || ({ ripples: 7, sand: 140, embers: 80, stars: 260, pollen: 70 })[kind] || 80, color: canvas.dataset.color || ({ ripples: '#FFFFFF', sand: '#E8D9B8', embers: '#F0A24A', stars: '#FFF6DE', pollen: '#FFE9B8' })[kind], speed: Number(canvas.dataset.speed) || 1, pivot: (canvas.dataset.pivot || '50,110').split(',').map(Number), opacity: Number(canvas.dataset.opacity) || 1 }, opts || {});
  const ctx = canvas.getContext('2d'); let W = 0, H = 0, dpr = 1;
  function resize(){ dpr = Math.min(2, window.devicePixelRatio || 1); const r = canvas.getBoundingClientRect(); W = Math.max(2, Math.round(r.width)); H = Math.max(2, Math.round(r.height)); canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  resize(); if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  // seeded particles
  let s = 7 + kind.length * 31; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const P = []; for (let i = 0; i < opts.n; i++) P.push({ x: rnd(), y: rnd(), z: rnd(), ph: rnd() * Math.PI * 2, w: .5 + rnd(), v: .4 + rnd() * .8, r: rnd() });
  const col = opts.color;
  function seek(t){
    t = t * opts.speed; ctx.clearRect(0, 0, W, H); ctx.globalAlpha = opts.opacity;
    if (kind === 'embers') {
      P.forEach(p => { const life = 14 + p.w * 10; const k = ((t * p.v / life) + p.y) % 1; const y = H * (1.08 - k * 1.2); const x = W * (p.x + .06 * Math.sin(t * (.4 + p.v * .3) + p.ph) + .02 * Math.sin(t * 1.7 + p.ph * 2)); const a = (1 - k) * (.45 + .55 * (0.5 + 0.5 * Math.sin(t * (3 + p.v * 4) + p.ph))) * (k < .08 ? k / .08 : 1); const r = .8 + p.z * 2.2 * (1 - k * .5); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = hexA(p.r > .7 ? '#FFE08A' : col, a); ctx.fill(); if (p.z > .8) { ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fillStyle = hexA(col, a * .12); ctx.fill(); } });
    } else if (kind === 'sand') {
      ctx.lineCap = 'round';
      P.forEach(p => { const span = 6 + p.w * 6; const k = ((t * p.v / span) + p.x) % 1.2 - .1; const x = W * k; const gust = .5 + .5 * Math.sin(t * .35 + p.ph) * Math.sin(t * .11); const y = H * (p.y + .03 * Math.sin(t * .9 + p.ph) + .015 * Math.sin(t * 2.3 + p.ph * 3)); const len = 6 + p.z * 22 * (0.4 + gust); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y - len * .08); ctx.strokeStyle = hexA(col, .08 + p.z * .22 * (0.3 + gust)); ctx.lineWidth = .6 + p.z * .9; ctx.stroke(); });
    } else if (kind === 'pollen') {
      P.forEach(p => { const x = W * (p.x + .04 * Math.sin(t * (.18 + p.v * .12) + p.ph) + .015 * Math.sin(t * .9 + p.ph * 2)); const y = H * (((p.y - t * .006 * p.v) % 1 + 1) % 1 + .02 * Math.cos(t * (.22 + p.v * .1) + p.ph)); const a = .25 + .5 * (0.5 + 0.5 * Math.sin(t * (.6 + p.v) + p.ph)); const r = .7 + p.z * 2.6; const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4); g.addColorStop(0, hexA(col, a)); g.addColorStop(.35, hexA(col, a * .35)); g.addColorStop(1, hexA(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8); });
    } else if (kind === 'stars') {
      const cx = W * opts.pivot[0] / 100, cy = H * opts.pivot[1] / 100, R = Math.hypot(W, H) * 1.1, rot = t * .0045;
      P.forEach(p => { const a = p.ph + rot, r = R * Math.sqrt(p.z); const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); if (x < -4 || y < -4 || x > W + 4 || y > H + 4) return; const tw = .55 + .45 * Math.sin(t * (1.1 + p.v * 2) + p.ph * 7); const sz = p.r > .93 ? 1.6 : p.r > .7 ? 1.1 : .7; ctx.beginPath(); ctx.arc(x, y, sz, 0, Math.PI * 2); ctx.fillStyle = hexA(col, (0.35 + p.r * .65) * tw); ctx.fill(); if (p.r > .96) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = hexA(col, .08 * tw); ctx.fill(); } });
      // faint star roads: short arcs behind the brightest
      ctx.strokeStyle = hexA(col, .06); ctx.lineWidth = 1; P.slice(0, 18).forEach(p => { const r = R * Math.sqrt(p.z); ctx.beginPath(); ctx.arc(cx, cy, r, p.ph + rot - .25, p.ph + rot); ctx.stroke(); });
    } else { // ripples
      P.forEach(p => { const per = 5 + p.w * 4; const cx = W * (.1 + p.x * .8), cy = H * (.15 + p.y * .7); for (let j = 0; j < 3; j++) { const k = ((t / per) + p.ph / 6.283 + j / 3) % 1; const r = 4 + k * (40 + p.z * 90); ctx.beginPath(); ctx.ellipse(cx, cy, r, r * .42, 0, 0, Math.PI * 2); ctx.strokeStyle = hexA(col, (1 - k) * (1 - k) * .45); ctx.lineWidth = 1 + (1 - k) * 1.4; ctx.stroke(); } });
    }
    ctx.globalAlpha = 1;
  }
  let raf = 0, running = false, t0 = performance.now(), visible = true;
  function loop(now){ if (visible) seek((now - t0) / 1000); raf = requestAnimationFrame(loop); }
  const api = { canvas, kind, seek, resize, start(){ if (running || !AP.motion) { seek(3); return; } running = true; t0 = performance.now(); raf = requestAnimationFrame(loop); }, stop(){ running = false; cancelAnimationFrame(raf); } };
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; }), { rootMargin: '10% 0px', threshold: 0 }).observe(canvas);
  AP.registerSeek(t => seek(t));
  api.start(); canvas._particles = api; return api;
};

/* ---------- the breath ring: in four, hold four, out six, hold four ---------- */
AP.breathRing = function(host, opts){
  opts = Object.assign({ rounds: 3, legend: true, tones: true, size: 600, rest: ['Breathe', 'with the water'], onFinish: null, onStart: null }, opts || {});
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const STEPS = [['In', 4], ['Hold', 4], ['Out', 6], ['Hold', 4]], ROUND = 18, ROUNDS = opts.rounds, SESSION = ROUND * ROUNDS, R0 = 120, R1 = 215;
  host.classList.add('ap-ring');
  const svg = el('svg', { viewBox: '0 0 600 600', role: 'img', 'aria-label': 'The stone breath: a ring that grows for four, holds four, settles for six, holds four' }, host);
  el('circle', { cx: 300, cy: 300, r: 190, fill: 'none', stroke: 'rgba(255,255,255,.22)', 'stroke-width': 1.5 }, svg);
  const halo = el('circle', { cx: 300, cy: 300, r: 140, fill: 'none', stroke: '#D9A84C', 'stroke-width': 28, opacity: .14 }, svg);
  const disc = el('circle', { cx: 300, cy: 300, r: 140, fill: '#D9A84C', 'fill-opacity': .06, stroke: '#D9A84C', 'stroke-width': 5 }, svg);
  const dotsG = el('g', {}, svg);
  for (let i = 0; i < ROUNDS; i++) el('circle', { cx: 300 + (i - (ROUNDS - 1) / 2) * 34, cy: 380, r: 7, fill: '#D9A84C', 'fill-opacity': 0, stroke: '#fff', 'stroke-opacity': .6, 'stroke-width': 2 }, dotsG);
  const word = el('text', { class: 'word', x: 300, y: 292, 'text-anchor': 'middle' }, svg); word.textContent = opts.rest[0];
  const count = el('text', { class: 'count', x: 300, y: 342, 'text-anchor': 'middle' }, svg); count.textContent = opts.rest[1];
  if (opts.legend) { const lg = el('text', { class: 'legend', x: 300, y: 560, 'text-anchor': 'middle' }, svg); lg.textContent = 'IN 4 · HOLD 4 · OUT 6 · HOLD 4'; }
  function stepAt(t){ const tr = ((t % ROUND) + ROUND) % ROUND; let u = tr, i = 0; while (u >= STEPS[i][1]) { u -= STEPS[i][1]; i++; } return { i, name: STEPS[i][0], n: STEPS[i][1], u, round: Math.floor(t / ROUND) }; }
  function draw(t, active){
    const s = stepAt(t); const k = s.i === 0 ? breathe(s.u / 4) : s.i === 1 ? 1 : s.i === 2 ? 1 - breathe(s.u / 6) : 0; const r = R0 + (R1 - R0) * k;
    disc.setAttribute('r', r); halo.setAttribute('r', r); disc.setAttribute('fill-opacity', .05 + .09 * k); halo.setAttribute('opacity', .1 + .12 * k);
    if (active) { word.textContent = s.name; count.textContent = String(Math.min(s.n, Math.floor(s.u) + 1)); Array.from(dotsG.childNodes).forEach((c, i) => c.setAttribute('fill-opacity', i < s.round ? 1 : (i === s.round ? .5 : 0))); }
    return s;
  }
  let active = false, t0 = 0, lastStep = -1, raf = 0, running = false;
  function tone(f, d, g){ if (!opts.tones) return; const S = AP.sound; if (!S.ensure()) return; const c = S.ctx, o = c.createOscillator(), gn = c.createGain(); o.type = 'sine'; o.frequency.value = f; gn.gain.value = 0; o.connect(gn); gn.connect(S.fx); const n = c.currentTime; gn.gain.linearRampToValueAtTime(g, n + .05); gn.gain.exponentialRampToValueAtTime(.0001, n + d); o.start(n); o.stop(n + d + .05); }
  function loop(){
    const t = (performance.now() - t0) / 1000;
    if (!active) { draw(t, false); raf = requestAnimationFrame(loop); return; }
    if (t < SESSION) { const s = draw(t, true); if (s.i !== lastStep) { lastStep = s.i; tone(s.i === 0 ? 330 : s.i === 2 ? 262 : 294, s.i === 2 ? 1.2 : .8, .05); } raf = requestAnimationFrame(loop); }
    else if (t < SESSION + 6) { word.textContent = 'Settle'; count.textContent = 'listen to the water'; draw(SESSION, false); raf = requestAnimationFrame(loop); }
    else finish();
  }
  function finish(){ active = false; t0 = performance.now(); word.textContent = opts.rest[0]; count.textContent = opts.rest[1]; Array.from(dotsG.childNodes).forEach(c => c.setAttribute('fill-opacity', 0)); tone(392, 1.6, .05); if (opts.onFinish) opts.onFinish(); }
  const api = { svg, STEPS, ROUND, ROUNDS, SESSION, DUR: SESSION + 6, draw, stepAt,
    seek(t, act){ draw(t, !!act); },
    start(){ if (active) return; AP.sound.ensure(); active = true; t0 = performance.now(); lastStep = -1; if (opts.onStart) opts.onStart(); if (!running) api.rest(); },
    rest(){ if (running || !AP.motion) { draw(0, false); return; } running = true; t0 = performance.now(); raf = requestAnimationFrame(loop); },
    stop(){ active = false; running = false; cancelAnimationFrame(raf); },
    get active(){ return active; } };
  api.rest();
  AP.registerSeek(t => { if (!active) draw(t, false); });
  return api;
};

/* ---------- render mode: deterministic seek for the frame renderer ---------- */
AP.seekers = [];
AP.registerSeek = fn => { AP.seekers.push(fn); };
AP.seekAll = function(t){ html.style.setProperty('--kb', t.toFixed(2)); AP.seekers.forEach(fn => { try { fn(t); } catch (e) {} }); };
// standard scroll-through: hold at the top, scroll the page with an eased curve, hold at the bottom
AP.scrollThrough = function(t, o){
  o = Object.assign({ hold: 4, end: (window.DURATION || 30) - 3, dur: window.DURATION || 30, from: 0, to: 1, curve: null }, o || {});
  const H = html.scrollHeight - innerHeight;
  let p = t <= o.hold ? 0 : t >= o.end ? 1 : (1 - Math.cos(Math.PI * (t - o.hold) / (o.end - o.hold))) / 2;
  if (o.curve) p = o.curve(p);
  const y = Math.round(H * (o.from + (o.to - o.from) * p));
  window.scrollTo(0, y);
  return y;
};
AP.seekPage = async function(t, o){
  AP.scrollThrough(t, o);
  if (AP.ST) AP.ST.update();
  AP.seekAll(t);
  $$('.reveal, [data-words]').forEach(el => el.classList.add('in'));
  await AP.seekVideos(t);
  return true;
};

/* ---------- init ---------- */
AP.init = function(root){
  AP.smooth();
  AP.nav(); AP.footer();
  AP.words(root); AP.reveal(root); AP.counts(root);
  $$('.ap-loop[data-src]', root).forEach(el => { if (!el.closest('.ap-cut')) AP.loop(el); });
  $$('.ap-cut', root).forEach(el => AP.cut(el).start());
  $$('.ap-player[data-src]', root).forEach(el => AP.player(el));
  $$('.ap-say[data-src]', root).forEach(el => AP.say(el));
  $$('canvas.ap-particles', root).forEach(c => AP.particles(c));
  AP.parallax(root); AP.draw(root); AP.scenes(root);
  if (AP.motion) requestAnimationFrame(kbLoop);
  // remembered sound preference: start on the first gesture
  try { if (localStorage.getItem('ap.sound') === '1' && AP.motion) AP.onFirstGesture(() => { if (!AP.sound._started) AP.sound.start(); }); } catch (e) {}
  dispatchEvent(new CustomEvent('ap:ready'));
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { if (!html.dataset.noinit) AP.init(); });
else if (!html.dataset.noinit) AP.init();
})();
