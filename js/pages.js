/* ANCESTRAL PEAKS — Agent 4 page engine (Books, Films, For your work, Why it works) — 2026-11-04
   Sits on top of shared/site.js (window.AP). Adds: scroll-pinned scenes driven by ScrollTrigger progress,
   covers in three dimensions, the three book graphics on his footage, the film theater with a live chapter rail,
   the animated diagrams for Work and Why, and render/flat hooks. Nothing here edits shared/. */
(function(){
'use strict';
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const P = window.P4 = {};
const clamp = (x, a, b) => x < a ? a : x > b ? b : x, ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const seg = (p, a, b) => ease((p - a) / (b - a));   // 0→1 across [a,b] of progress
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
// The shared particle field can ask for a negative ripple radius on its very first frame (a rAF timestamp a few ms
// before its own start time). Canvas throws on that. Clamp it here so no page logs an error; reported to Agent 1.
if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype._apSafe) {
  const _ellipse = CanvasRenderingContext2D.prototype.ellipse, _arc = CanvasRenderingContext2D.prototype.arc;
  CanvasRenderingContext2D.prototype.ellipse = function(x, y, rx, ry, ...rest){ return _ellipse.call(this, x, y, Math.max(0, rx), Math.max(0, ry), ...rest); };
  CanvasRenderingContext2D.prototype.arc = function(x, y, r, ...rest){ return _arc.call(this, x, y, Math.max(0, r), ...rest); };
  CanvasRenderingContext2D.prototype._apSafe = true;
}

/* ---------- a scroll-pinned scene: the tall .scene drives draw(p) ---------- */
P.scene = function(sceneEl, draw, opts){
  opts = Object.assign({ rest: .62 }, opts || {});
  const bar = $('.progress i', sceneEl);
  const run = p => { draw(p); if (bar) bar.style.width = (p * 100).toFixed(2) + '%'; };
  if (AP.gsap && AP.ST && AP.motion && !AP.flat || (AP.gsap && AP.ST && AP.render)) {
    AP.ST.create({ trigger: sceneEl, start: 'top top', end: 'bottom bottom', scrub: AP.render ? true : 0.45, onUpdate: self => run(self.progress) });
    run(0);
  } else run(opts.rest);
  // cursor parallax on the covers inside the scene
  const covers = $$('.cover3d', sceneEl);
  if (covers.length && matchMedia('(pointer:fine)').matches && AP.motion) {
    sceneEl.addEventListener('pointermove', e => { const r = sceneEl.getBoundingClientRect(); const mx = (e.clientX - r.left) / r.width - .5, my = (e.clientY - r.top) / innerHeight - .5; covers.forEach(c => { c.style.setProperty('--mx', mx.toFixed(3)); c.style.setProperty('--my', my.toFixed(3)); }); });
    sceneEl.addEventListener('pointerleave', () => covers.forEach(c => { c.style.setProperty('--mx', 0); c.style.setProperty('--my', 0); }));
  }
  return { run };
};
// stage the copy blocks: each .st turns on at its data-at progress
function stages(sceneEl, p){ $$('.copy .st', sceneEl).forEach(s => s.classList.toggle('on', p >= Number(s.dataset.at || 0))); }
// cover tilt from progress: closed and turned at the start, square and lit by the end
function tilt(sceneEl, p){ const c = $('.cover3d', sceneEl); if (!c) return; c.style.setProperty('--ry0', (-34 + 40 * ease(p * 1.3)).toFixed(2) + 'deg'); c.style.setProperty('--rx0', (6 - 4 * ease(p)).toFixed(2) + 'deg'); c.style.setProperty('--tz', (-40 + 60 * ease(p)).toFixed(1) + 'px'); }
P.stages = stages; P.tilt = tilt;
// cursor parallax for covers outside a scene (the hero shelf)
P.hoverCovers = function(host){
  const covers = $$('.cover3d', host); if (!covers.length || !matchMedia('(pointer:fine)').matches || !AP.motion) return;
  host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); const mx = (e.clientX - r.left) / r.width - .5, my = (e.clientY - r.top) / r.height - .5; covers.forEach(c => { c.style.setProperty('--mx', mx.toFixed(3)); c.style.setProperty('--my', my.toFixed(3)); }); });
  host.addEventListener('pointerleave', () => covers.forEach(c => { c.style.setProperty('--mx', 0); c.style.setProperty('--my', 0); }));
};

/* ---------- the three drawn graphics, placed on his footage ---------- */
P.graphic = function(host, kind){
  let g = null;
  if (kind === 'ring' && window.StoneBreathPractice) g = window.StoneBreathPractice(host);
  else if (kind === 'tokens' && window.CouncilTokens) g = window.CouncilTokens(host);
  else if (kind === 'stars' && window.FarMessengersStars) g = window.FarMessengersStars(host, { words: true });
  if (!g) return { seek(){}, DUR: 1 };
  const svg = $('svg', host); if (svg) { svg.removeAttribute('style'); svg.style.width = '100%'; svg.style.height = '100%'; svg.style.display = 'block'; }
  return g;
};

/* ---------- a soft time clock for canvases: real time, or the renderer's t ---------- */
P.clock = function(fn){
  let t0 = performance.now(), raf = 0, visible = true;
  const loop = now => { if (visible) fn((now - t0) / 1000); raf = requestAnimationFrame(loop); };
  if (AP.motion) raf = requestAnimationFrame(loop); else fn(6);
  AP.registerSeek(t => fn(t));
  return { setVisible(v){ visible = v; } };
};
function watch(elm, api){ if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => api.setVisible(e.isIntersecting)), { rootMargin: '10% 0px' }).observe(elm); }

/* ---------- canvases for the Why page: the breath and the heart; the noise floor ---------- */
P.breathTrace = function(canvas){
  const ctx = canvas.getContext('2d'); let W = 0, H = 0;
  function resize(){ const dpr = Math.min(2, devicePixelRatio || 1); const r = canvas.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height); canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  resize(); if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  const ROUND = 18;
  const breath = t => { const u = ((t % ROUND) + ROUND) % ROUND; if (u < 4) return (1 - Math.cos(Math.PI * u / 4)) / 2; if (u < 8) return 1; if (u < 14) return 1 - (1 - Math.cos(Math.PI * (u - 8) / 6)) / 2; return 0; };
  // the pulse: a short beat shape; beats arrive a little further apart on the long breath out, and further apart as the rounds go on (an illustration of his words, not a measurement)
  const beatAt = (x, t) => { const r = 1 + Math.min(2, t / ROUND) * .12; const u = ((t % ROUND) + ROUND) % ROUND; const slow = u >= 8 && u < 14 ? 1.22 : 1.0; return 0.78 * r * slow; };
  function draw(t){
    ctx.clearRect(0, 0, W, H);
    const pad = 18, w = W - pad * 2, span = 24;        // 24 s across the canvas
    // the breath wave (top)
    const yb = H * .34, ab = H * .2;
    ctx.beginPath(); for (let i = 0; i <= w; i += 2) { const tt = t - span + i / w * span; const y = yb - breath(tt) * ab; i ? ctx.lineTo(pad + i, y) : ctx.moveTo(pad + i, y); } ctx.strokeStyle = '#D9A84C'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.font = '600 11px Figtree, Helvetica, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('THE BREATH   in 4 · hold 4 · out 6 · hold 4', pad, yb - ab - 10);
    const u = ((t % ROUND) + ROUND) % ROUND; const name = u < 4 ? 'In' : u < 8 ? 'Hold' : u < 14 ? 'Out' : 'Hold';
    ctx.font = '800 22px "Bricolage Grotesque", Helvetica, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText(name, W - pad, yb - ab + 8); ctx.textAlign = 'left';
    // the heart (bottom): beats placed by walking back from now
    const yh = H * .74, ah = H * .16;
    ctx.beginPath(); let x = w, bt = t; const beats = [];
    while (x > 0) { const gap = beatAt(0, bt); bt -= gap; x = w - (t - bt) / span * w; beats.push(x); }
    for (let i = 0; i <= w; i += 1) { let y = yh; beats.forEach(bx => { const d = i - bx; if (d > -6 && d < 14) { const k = d < 0 ? (6 + d) / 6 : 1 - d / 14; y -= Math.max(0, Math.sin(k * Math.PI)) * ah * (d >= 0 && d < 5 ? 1 : .22); } }); i ? ctx.lineTo(pad + i, y) : ctx.moveTo(pad + i, y); }
    ctx.strokeStyle = '#E0714A'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = '600 11px Figtree, Helvetica, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('THE HEART   even and slow on the long breath out', pad, yh - ah - 10);
    // the now line
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(W - pad - 1, H * .08, 1, H * .84);
  }
  const api = P.clock(draw); watch(canvas, api); return api;
};
P.noiseFloor = function(canvas){
  const ctx = canvas.getContext('2d'); let W = 0, H = 0;
  function resize(){ const dpr = Math.min(2, devicePixelRatio || 1); const r = canvas.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height); canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  resize(); if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  let s = 11; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const N = 420, noise = []; for (let i = 0; i < N; i++) noise.push(rnd() * 2 - 1);
  function draw(t){
    ctx.clearRect(0, 0, W, H);
    const cyc = 22, k = (t % cyc) / cyc;                 // the noise settles over 22 s, then the picture begins again
    const quiet = ease((k - .1) / .55);                  // 0 loud → 1 quiet
    const amp = (1 - quiet) * H * .3 + H * .02, pad = 18, w = W - pad * 2, mid = H * .52;
    // the faint signal under it: a slow sine, always there
    ctx.beginPath(); for (let i = 0; i <= w; i += 2) { const y = mid - Math.sin(i / w * Math.PI * 3 + t * 1.1) * H * .09; i ? ctx.lineTo(pad + i, y) : ctx.moveTo(pad + i, y); } ctx.strokeStyle = 'rgba(217,168,76,' + (0.25 + quiet * .75).toFixed(3) + ')'; ctx.lineWidth = 2.4; ctx.stroke();
    // the noise on top
    ctx.beginPath(); for (let i = 0; i <= w; i += 2) { const j = (i / 2 + Math.floor(t * 30)) % N; const y = mid - Math.sin(i / w * Math.PI * 3 + t * 1.1) * H * .09 + noise[j] * amp; i ? ctx.lineTo(pad + i, y) : ctx.moveTo(pad + i, y); } ctx.strokeStyle = 'rgba(255,255,255,' + (0.75 - quiet * .55).toFixed(3) + ')'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.font = '600 11px Figtree, Helvetica, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('THE INTERNAL NOISE', pad, 20); ctx.textAlign = 'right'; ctx.fillStyle = '#D9A84C'; ctx.fillText(quiet > .6 ? 'the faint signal comes through' : 'the signal is under there', W - pad, 20); ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '500 11px Figtree, Helvetica, sans-serif'; ctx.fillText(quiet < .3 ? 'alarm' : quiet < .75 ? 'settling' : 'quiet body, wide eye', pad, H - 12);
  }
  const api = P.clock(draw); watch(canvas, api); return api;
};

/* ---------- the diagrams (Work and Why): each returns draw(p) and is scrubbed by its section ---------- */
P.scrub = function(trigger, draw, o){
  o = Object.assign({ start: 'top 78%', end: 'bottom 55%', rest: 1 }, o || {});
  if (AP.gsap && AP.ST && (AP.motion && !AP.flat || AP.render)) { AP.ST.create({ trigger, start: o.start, end: o.end, scrub: AP.render ? true : 0.5, onUpdate: self => draw(self.progress) }); draw(0); }
  else draw(o.rest);
};
P.diagrams = {
  // 1 · the house, not the star: stars rise at one point of the horizon and climb out of reach; the house holds
  house(svg){
    const W = 600, HZ = 262, HX = 420;
    el('line', { x1: 30, y1: HZ, x2: 570, y2: HZ, class: 'thin' }, svg);
    for (let i = 0; i < 17; i++) { const x = 40 + i * 32.5; el('line', { x1: x, y1: HZ, x2: x, y2: HZ + (i % 4 ? 5 : 10), class: 'thin' }, svg); }
    // the house: a mark on the horizon
    const house = el('g', {}, svg);
    el('path', { d: `M${HX - 16},${HZ} L${HX - 16},${HZ - 16} L${HX},${HZ - 30} L${HX + 16},${HZ - 16} L${HX + 16},${HZ}`, class: 'gold' }, house);
    el('path', { d: `M${HX - 22},${HZ + 2} A${22},${22} 0 0 1 ${HX + 22},${HZ + 2}`, class: 'gold', 'stroke-opacity': .5 }, house);
    const hl = el('text', { x: HX, y: HZ + 36, 'text-anchor': 'middle', 'font-size': 14 }, svg); hl.textContent = 'the house';
    const eye = el('circle', { cx: 300, cy: 332, r: 5, class: 'gdot' }, svg);
    const sight = el('line', { x1: 300, y1: 332, x2: HX, y2: HZ, class: 'gold', 'stroke-dasharray': '3 9', 'stroke-width': 2, 'stroke-opacity': .6 }, svg);
    // the star road: an arc from the house up and to the left
    const road = el('path', { d: `M${HX},${HZ} Q${HX - 60},${HZ - 150} ${HX - 170},${HZ - 232}`, class: 'thin', 'stroke-dasharray': '2 8' }, svg);
    const L = road.getTotalLength();
    const stars = [0, 1, 2].map(() => { const g = el('g', { opacity: 0 }, svg); el('circle', { r: 11, fill: '#FFE9B8', opacity: .25 }, g); el('path', { d: 'M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9 Z', fill: '#D9A84C' }, g); return g; });
    const t1 = el('text', { x: 60, y: 44, 'font-size': 13, fill: 'rgba(255,255,255,.7)' }, svg); t1.textContent = 'stars: useful while low, then gone';
    const t2 = el('text', { x: 60, y: 62, 'font-size': 13, fill: 'rgba(255,255,255,.7)' }, svg); t2.textContent = 'markets · products · roles';
    // four kinds of wealth: four arcs around the house, drawn at the end
    const kinds = ['financial', 'relational', 'cultural', 'ecological'];
    const arcs = kinds.map((k, i) => { const r = 56 + i * 16; const a0 = Math.PI * 1.05, a1 = Math.PI * 1.95; const p = el('path', { d: `M${HX + r * Math.cos(a0)},${HZ + r * Math.sin(a0)} A${r},${r} 0 0 1 ${HX + r * Math.cos(a1)},${HZ + r * Math.sin(a1)}`, class: i % 2 ? 'creekl' : 'skyl', 'stroke-width': 2 }, svg); const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len; const tx = el('text', { x: HX + (r + 4) * Math.cos(a1) + 6, y: HZ + (r + 4) * Math.sin(a1) + 4, 'font-size': 11, opacity: 0 }, svg); tx.textContent = k; return { p, len, tx }; });
    const cap = el('text', { x: HX, y: 118, 'text-anchor': 'middle', 'font-size': 12, opacity: 0, fill: '#D9A84C' }, svg); cap.textContent = 'four kinds of wealth, counted at once';
    return p => {
      stars.forEach((g, i) => { const a = i * .22, k = seg(p, a, a + .5); const pt = road.getPointAtLength(L * k); const fade = 1 - seg(k, .62, .95); g.setAttribute('opacity', (k > 0 && k < 1 ? fade : 0).toFixed(3)); g.setAttribute('transform', `translate(${pt.x.toFixed(1)},${pt.y.toFixed(1)}) scale(${(0.8 + 0.3 * (1 - k)).toFixed(3)})`); });
      house.setAttribute('opacity', (0.5 + 0.5 * seg(p, .05, .3)).toFixed(3));
      sight.setAttribute('opacity', seg(p, .15, .4).toFixed(3));
      arcs.forEach((a, i) => { const k = seg(p, .55 + i * .08, .8 + i * .08); a.p.style.strokeDashoffset = (a.len * (1 - k)).toFixed(1); a.tx.setAttribute('opacity', seg(k, .6, 1).toFixed(3)); });
      cap.setAttribute('opacity', seg(p, .82, 1).toFixed(3));
    };
  },
  // 2 · the relay: short legs, all the care in the hand-off, said back before the runner lets go
  relay(svg){
    const pts = [[36, 150], [160, 120], [292, 158], [424, 118], [560, 146]];
    const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0] + ',' + q[1]).join(' ');
    const base = el('path', { d, class: 'thin' }, svg);
    const lit = el('path', { d, class: 'gold' }, svg); const L = lit.getTotalLength(); lit.style.strokeDasharray = L; lit.style.strokeDashoffset = L;
    const nodes = pts.map((q, i) => { const g = el('g', { transform: `translate(${q[0]},${q[1]})` }, svg); el('circle', { r: 7, fill: '#100B0D', stroke: '#fff', 'stroke-width': 2 }, g); const pulse = el('circle', { r: 7, fill: 'none', stroke: '#D9A84C', 'stroke-width': 2, opacity: 0 }, g); const said = el('text', { y: -18, 'text-anchor': 'middle', 'font-size': 11, opacity: 0, fill: '#D9A84C' }, g); said.textContent = i === 0 ? 'the start' : 'said back'; return { g, pulse, said }; });
    const runner = el('circle', { r: 9, class: 'gdot' }, svg);
    const legs = pts.slice(1).map((q, i) => { const a = pts[i]; const t = el('text', { x: (a[0] + q[0]) / 2, y: Math.max(a[1], q[1]) + 30, 'text-anchor': 'middle', 'font-size': 11, fill: 'rgba(255,255,255,.6)' }, svg); t.textContent = 'a short leg'; return t; });
    const cap = el('text', { x: 300, y: 36, 'text-anchor': 'middle', 'font-size': 14 }, svg); cap.textContent = 'Nobody carries the whole way.';
    return p => {
      const k = ease(p); lit.style.strokeDashoffset = (L * (1 - k)).toFixed(1);
      const pt = lit.getPointAtLength(L * k); runner.setAttribute('cx', pt.x.toFixed(1)); runner.setAttribute('cy', pt.y.toFixed(1));
      nodes.forEach((n, i) => { const at = i / (pts.length - 1); const near = Math.max(0, 1 - Math.abs(k - at) * 14); n.pulse.setAttribute('r', (7 + near * 16).toFixed(1)); n.pulse.setAttribute('opacity', (near * .9).toFixed(3)); n.said.setAttribute('opacity', (k >= at - .01 && i > 0 ? Math.min(1, (k - at + .01) * 12) : 0).toFixed(3)); });
    };
  },
  // 3 · a room where people can think: settle the room first, then the seats light; two channels in every report
  room(svg){
    const CX = 300, CY = 150, R = 92;
    const halo = el('circle', { cx: CX, cy: CY, r: 30, fill: '#D9A84C', 'fill-opacity': .08, stroke: '#D9A84C', 'stroke-width': 3 }, svg);
    const word = el('text', { x: CX, y: CY + 6, 'text-anchor': 'middle', class: 'big', 'font-size': 18 }, svg); word.textContent = 'settle';
    const seats = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI * 2; const g = el('g', { transform: `translate(${(CX + R * Math.cos(a)).toFixed(1)},${(CY + R * Math.sin(a)).toFixed(1)})` }, svg); const c = el('circle', { r: 9, fill: 'rgba(255,255,255,.12)', stroke: 'rgba(255,255,255,.4)', 'stroke-width': 1.5 }, g); seats.push(c); }
    const l1 = el('line', { x1: 60, y1: 300, x2: 540, y2: 300, class: 'skyl' }, svg); const l2 = el('line', { x1: 60, y1: 326, x2: 540, y2: 326, class: 'creekl' }, svg);
    [l1, l2].forEach(l => { l.style.strokeDasharray = 480; l.style.strokeDashoffset = 480; });
    const t1 = el('text', { x: 60, y: 290, 'font-size': 12, opacity: 0 }, svg); t1.textContent = 'the numbers';
    const t2 = el('text', { x: 60, y: 346, 'font-size': 12, opacity: 0 }, svg); t2.textContent = 'what they mean';
    const cap = el('text', { x: 300, y: 262, 'text-anchor': 'middle', 'font-size': 12, fill: 'rgba(255,255,255,.65)', opacity: 0 }, svg); cap.textContent = 'two channels in every report';
    return p => {
      // one breath round over the first half: in 4, hold 4, out 6, hold 4
      const u = seg(p, 0, .5) * 18; const k = u < 4 ? (1 - Math.cos(Math.PI * u / 4)) / 2 : u < 8 ? 1 : u < 14 ? 1 - (1 - Math.cos(Math.PI * (u - 8) / 6)) / 2 : 0;
      halo.setAttribute('r', (30 + 34 * k).toFixed(1)); halo.setAttribute('fill-opacity', (.06 + .1 * k).toFixed(3));
      word.textContent = p < .5 ? (u < 4 ? 'in' : u < 8 ? 'hold' : u < 14 ? 'out' : 'hold') : 'decide';
      seats.forEach((c, i) => { const on = seg(p, .5 + i * .035, .58 + i * .035); c.setAttribute('fill', `rgba(217,168,76,${(0.12 + on * .8).toFixed(3)})`); c.setAttribute('stroke', on > .5 ? '#D9A84C' : 'rgba(255,255,255,.4)'); });
      const d = seg(p, .78, 1); l1.style.strokeDashoffset = (480 * (1 - d)).toFixed(1); l2.style.strokeDashoffset = (480 * (1 - seg(p, .84, 1))).toFixed(1);
      t1.setAttribute('opacity', d.toFixed(3)); t2.setAttribute('opacity', seg(p, .86, 1).toFixed(3)); cap.setAttribute('opacity', seg(p, .74, .9).toFixed(3));
    };
  },
  // 4 · the One Question: four generations on one thread; decisions woven, not voted to a winning half
  generations(svg){
    const names = ['you', 'the children', 'the grandchildren', 'the great-grandchildren'];
    const xs = [70, 220, 370, 520], Y = 110;
    const thread = el('path', { d: `M${xs[0]},${Y} L${xs[3]},${Y}`, class: 'gold' }, svg); thread.style.strokeDasharray = 450; thread.style.strokeDashoffset = 450;
    const gens = names.map((n, i) => { const g = el('g', { transform: `translate(${xs[i]},${Y})`, opacity: 0 }, svg); el('circle', { r: 16 + i * 5, fill: 'rgba(217,168,76,.12)', stroke: '#D9A84C', 'stroke-width': 2.5 }, g); const t = el('text', { y: 50 + i * 4, 'text-anchor': 'middle', 'font-size': 12 }, g); t.textContent = n; return g; });
    // left: voted to a winning half; right: woven
    const vote = el('g', { opacity: 0 }, svg);
    el('rect', { x: 60, y: 236, width: 110, height: 18, fill: 'rgba(255,255,255,.75)' }, vote); el('rect', { x: 172, y: 236, width: 104, height: 18, fill: 'rgba(255,255,255,.22)' }, vote);
    const vt = el('text', { x: 60, y: 280, 'font-size': 12, fill: 'rgba(255,255,255,.65)' }, vote); vt.textContent = 'voted to a winning half';
    const weave = el('g', { opacity: 0 }, svg);
    const wl = []; for (let i = 0; i < 6; i++) { const y = 232 + i * 5; const pth = el('path', { d: `M330,${y} C360,${y + (i % 2 ? 16 : -4)} 390,${y - (i % 2 ? 16 : -4)} 420,${y} S480,${y + (i % 2 ? 14 : -6)} 540,${y}`, class: i % 2 ? 'creekl' : 'skyl', 'stroke-width': 2.2 }, weave); const l = pth.getTotalLength(); pth.style.strokeDasharray = l; pth.style.strokeDashoffset = l; wl.push({ pth, l }); }
    const wt = el('text', { x: 330, y: 280, 'font-size': 12, fill: '#D9A84C' }, weave); wt.textContent = 'woven';
    const q = el('text', { x: 300, y: 196, 'text-anchor': 'middle', 'font-size': 13, opacity: 0 }, svg); q.textContent = 'Will this make the great-grandchildren whole, or hollow them out?';
    return p => {
      thread.style.strokeDashoffset = (450 * (1 - seg(p, 0, .5))).toFixed(1);
      gens.forEach((g, i) => g.setAttribute('opacity', seg(p, .05 + i * .12, .18 + i * .12).toFixed(3)));
      q.setAttribute('opacity', seg(p, .5, .62).toFixed(3));
      vote.setAttribute('opacity', (seg(p, .62, .72) * (1 - .55 * seg(p, .85, 1))).toFixed(3));
      weave.setAttribute('opacity', seg(p, .7, .8).toFixed(3));
      wl.forEach((w, i) => { w.pth.style.strokeDashoffset = (w.l * (1 - seg(p, .72 + i * .03, .95 + i * .03))).toFixed(1); });
    };
  },
  // 5 · fullness is equipment: a room moves away from the one who needs something from it
  fullness(svg){
    const CX = 300, CY = 150; let s = 5; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const others = []; for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2 + rnd() * .3, r0 = 70 + rnd() * 30; const c = el('circle', { r: 7, fill: 'rgba(255,255,255,.8)' }, svg); others.push({ c, a, r0 }); }
    const halo = el('circle', { cx: CX, cy: CY, r: 20, fill: 'none', stroke: '#E0714A', 'stroke-width': 2, opacity: .7 }, svg);
    const me = el('circle', { cx: CX, cy: CY, r: 10, fill: '#E0714A' }, svg);
    const st = el('text', { x: CX, y: CY + 60, 'text-anchor': 'middle', 'font-size': 13 }, svg);
    const q = el('text', { x: 300, y: 300, 'text-anchor': 'middle', 'font-size': 13, fill: 'rgba(255,255,255,.75)' }, svg); q.textContent = 'Wanting is not a feeling. It’s a heart rate.';
    const q2 = el('text', { x: 300, y: 320, 'text-anchor': 'middle', 'font-size': 11, fill: 'rgba(255,255,255,.5)' }, svg); q2.textContent = 'The Far Messengers';
    return p => {
      const want = 1 - seg(p, .45, .8);            // 1 = wanting, 0 = full
      const jitter = want * 5 * Math.sin(p * 90);    // a fast pulse while wanting
      me.setAttribute('fill', want > .5 ? '#E0714A' : '#D9A84C'); halo.setAttribute('stroke', want > .5 ? '#E0714A' : '#D9A84C');
      halo.setAttribute('r', (20 + jitter + (1 - want) * 10 * (0.5 + 0.5 * Math.sin(p * 12))).toFixed(1));
      const away = seg(p, .05, .45) * want;          // the room drifts off while the center wants
      others.forEach(o => { const r = o.r0 + away * 60 - (1 - want) * 14; o.c.setAttribute('cx', (CX + r * Math.cos(o.a)).toFixed(1)); o.c.setAttribute('cy', (CY + r * .72 * Math.sin(o.a)).toFixed(1)); o.c.setAttribute('fill', `rgba(255,255,255,${(0.45 + (1 - away) * .4).toFixed(3)})`); });
      st.textContent = want > .5 ? 'needing something from the room' : 'fullness: the room comes near';
    };
  },
  // 6 · calm is stored, not summoned: built on quiet days, spent on hard ones
  reservoir(svg){
    const X = 150, Y = 60, W = 300, H = 200;
    el('path', { d: `M${X},${Y} L${X},${Y + H} L${X + W},${Y + H} L${X + W},${Y}`, class: 'thin', 'stroke-width': 2 }, svg);
    const clip = el('clipPath', { id: 'resclip' }, el('defs', {}, svg)); el('rect', { x: X, y: Y, width: W, height: H }, clip);
    const water = el('path', { d: '', fill: 'rgba(92,139,208,.45)', 'clip-path': 'url(#resclip)' }, svg);
    const line = el('path', { d: '', class: 'skyl' }, svg);
    const ticks = []; for (let i = 0; i < 7; i++) { const t = el('g', { transform: `translate(${X + 24 + i * 42},${Y + H + 26})`, opacity: 0 }, svg); el('circle', { r: 4, class: 'gdot' }, t); ticks.push(t); }
    const tl = el('text', { x: X, y: Y + H + 54, 'font-size': 12, fill: 'rgba(255,255,255,.7)' }, svg); tl.textContent = 'quiet days, stored';
    const hard = el('g', { opacity: 0 }, svg); el('path', { d: `M${X + W + 14},${Y + 70} L${X + W + 14},${Y + 150}`, class: 'earthl', 'marker-end': '' }, hard); el('path', { d: `M${X + W + 6},${Y + 140} L${X + W + 14},${Y + 150} L${X + W + 22},${Y + 140}`, class: 'earthl' }, hard);
    const ht = el('text', { x: X + W + 30, y: Y + 115, 'font-size': 12, fill: '#E0714A' }, hard); ht.textContent = 'a hard day, spent';
    const cap = el('text', { x: 300, y: 36, 'text-anchor': 'middle', 'font-size': 14 }, svg); cap.textContent = 'Built on quiet days, spent on hard ones.';
    return p => {
      const fill = seg(p, 0, .66) * .8 - seg(p, .74, 1) * .3; const lvl = Y + H - H * fill;
      let d = `M${X},${lvl}`; for (let i = 0; i <= 12; i++) { const x = X + i / 12 * W; d += ` L${x.toFixed(1)},${(lvl + Math.sin(i * 1.3 + p * 20) * 3).toFixed(1)}`; }
      water.setAttribute('d', d + ` L${X + W},${Y + H} L${X},${Y + H} Z`); line.setAttribute('d', d);
      ticks.forEach((t, i) => t.setAttribute('opacity', seg(p, .04 + i * .09, .1 + i * .09).toFixed(3)));
      hard.setAttribute('opacity', seg(p, .72, .82).toFixed(3));
    };
  },
  // the crossing: a team exercise, as a road across the screen
  crossing(svg){
    const d = 'M30,150 C140,60 230,210 340,130 S560,60 650,150 S860,230 970,120';
    const road = el('path', { d, class: 'thin', 'stroke-dasharray': '3 9' }, svg); const L = road.getTotalLength();
    const lit = el('path', { d, class: 'gold' }, svg); lit.style.strokeDasharray = L; lit.style.strokeDashoffset = L;
    const at = k => road.getPointAtLength(L * k);
    const mark = (k, label, sub) => { const q = at(k); const g = el('g', { transform: `translate(${q.x.toFixed(1)},${q.y.toFixed(1)})`, opacity: 0 }, svg); el('circle', { r: 16, fill: 'none', stroke: '#E0714A', 'stroke-width': 2, 'stroke-dasharray': '4 6' }, g); const t = el('text', { y: 40, 'text-anchor': 'middle', 'font-size': 13, fill: '#E0714A' }, g); t.textContent = label; const t2 = el('text', { y: 56, 'text-anchor': 'middle', 'font-size': 11, fill: 'rgba(255,255,255,.65)' }, g); t2.textContent = sub; return g; };
    const dry = mark(.36, 'the dry spring', 'panic'), arrive = mark(.9, 'the arrival', 'ego and pride');
    // the table of five at the start: coach, carrier, steady one, wild one, and the Eagle above
    const start = at(0); const table = el('g', { transform: `translate(${start.x},${start.y})` }, svg);
    [[-10, -30, 'coach'], [12, -34, 'steady'], [26, -8, 'wild'], [0, 0, 'carrier']].forEach(q => { el('circle', { cx: q[0], cy: q[1], r: q[2] === 'carrier' ? 8 : 6, fill: q[2] === 'carrier' ? '#D9A84C' : 'rgba(255,255,255,.8)' }, table); });
    const eagle = el('path', { d: 'M-22,-70 Q-8,-82 0,-70 Q8,-82 22,-70', class: 'gold', 'stroke-width': 2 }, table); const et = el('text', { x: 0, y: -90, 'text-anchor': 'middle', 'font-size': 11, fill: '#D9A84C' }, table); et.textContent = 'the Eagle, watching';
    const tt = el('text', { x: 0, y: 30, 'text-anchor': 'middle', 'font-size': 11, fill: 'rgba(255,255,255,.7)' }, table); tt.textContent = 'a table of five';
    // the carrier and the three sentences
    const carrier = el('circle', { r: 9, class: 'gdot' }, svg);
    const sent = [0, 1, 2].map(i => el('rect', { width: 26, height: 5, rx: 2, fill: '#fff', opacity: .95 }, svg));
    const companions = [0, 1].map(() => el('circle', { r: 6, fill: 'rgba(255,255,255,.85)', opacity: 0 }, svg));
    const half = el('text', { x: at(.52).x, y: at(.52).y - 48, 'text-anchor': 'middle', 'font-size': 12, opacity: 0 }, svg); half.textContent = 'halfway: give two of the three away';
    const endq = el('text', { x: 970, y: 70, 'text-anchor': 'end', 'font-size': 12, opacity: 0, fill: '#D9A84C' }, svg); endq.textContent = 'what was written · what arrived';
    return p => {
      const k = ease(p); lit.style.strokeDashoffset = (L * (1 - k)).toFixed(1);
      const q = at(k); carrier.setAttribute('cx', q.x.toFixed(1)); carrier.setAttribute('cy', q.y.toFixed(1));
      const give = seg(k, .5, .62);
      sent.forEach((r, i) => { let x = q.x - 13, y = q.y - 24 - i * 8; if (i > 0 && give > 0) { const c = companions[i - 1]; const cx = q.x - 30 - i * 16 - give * 10, cy = q.y + 26 + i * 12; c.setAttribute('cx', cx.toFixed(1)); c.setAttribute('cy', cy.toFixed(1)); c.setAttribute('opacity', give.toFixed(3)); x = x + (cx - 13 - x) * give; y = y + (cy - 14 - y) * give; } r.setAttribute('x', x.toFixed(1)); r.setAttribute('y', y.toFixed(1)); });
      dry.setAttribute('opacity', seg(k, .28, .36).toFixed(3)); arrive.setAttribute('opacity', seg(k, .8, .88).toFixed(3));
      half.setAttribute('opacity', (seg(k, .46, .52) * (1 - seg(k, .72, .8))).toFixed(3)); endq.setAttribute('opacity', seg(k, .9, 1).toFixed(3));
      $$('.steps div', svg.closest('.crossing')).forEach((d, i) => d.classList.toggle('on', k >= [0, .3, .5, .86][i]));
    };
  },
  // WHY · one loop: the body opens the mind, the mind reaches the body, purpose holds both and returns to the body
  loop(svg){
    const CX = 280, CY = 250, R = 150;
    const nodes = [['the body', Math.PI / 2], ['the mind', Math.PI + Math.PI / 6], ['purpose', -Math.PI / 6]].map(n => { const x = CX + R * Math.cos(n[1]), y = CY + R * Math.sin(n[1]); const g = el('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, svg); const c = el('circle', { r: 34, fill: 'rgba(16,11,13,.6)', stroke: 'rgba(255,255,255,.5)', 'stroke-width': 2 }, g); const t = el('text', { y: 5, 'text-anchor': 'middle', 'font-size': 14, class: 'big' }, g); t.textContent = n[0]; return { g, c, x, y }; });
    const ring = el('circle', { cx: CX, cy: CY, r: R, class: 'thin', 'stroke-dasharray': '3 10' }, svg);
    const arcs = [[0, 1, 'The body opens the mind.'], [1, 0, 'The mind reaches the body.'], [2, 1, 'Purpose holds both.'], [2, 0, 'Purpose returns to the body.']].map((a, i) => { const A = nodes[a[0]], B = nodes[a[1]]; const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2; const nx = CX - mx, ny = CY - my; const bend = i % 2 ? -.35 : .35; const cx = mx + nx * bend * (i === 2 || i === 3 ? 1.6 : 1), cy = my + ny * bend * (i === 2 || i === 3 ? 1.6 : 1); const p = el('path', { d: `M${A.x},${A.y} Q${cx.toFixed(1)},${cy.toFixed(1)} ${B.x},${B.y}`, class: i % 2 ? 'creekl' : 'skyl', 'stroke-width': 3 }, svg); const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; return { p, l }; });
    const pulse = el('circle', { r: 7, class: 'gdot' }, svg);
    const claims = $$('.claims div', svg.closest('.loopsec'));
    return p => {
      arcs.forEach((a, i) => { const k = seg(p, i * .24, i * .24 + .26); a.p.style.strokeDashoffset = (a.l * (1 - k)).toFixed(1); if (k > 0 && k < 1) { const q = a.p.getPointAtLength(a.l * k); pulse.setAttribute('cx', q.x.toFixed(1)); pulse.setAttribute('cy', q.y.toFixed(1)); } if (claims[i]) claims[i].classList.toggle('on', k > .15); });
      nodes.forEach((n, i) => n.c.setAttribute('stroke', p > [0, .1, .5][i] ? '#D9A84C' : 'rgba(255,255,255,.5)'));
    };
  },
  // WHY · the inner map: places, not files (a songline with its stations, and the houses on the horizon)
  innermap(svg){
    const HZ = 250;
    const dome = el('path', { d: `M60,${HZ} A240,240 0 0 1 540,${HZ}`, class: 'thin' }, svg);
    const ticks = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI; const x1 = 300 + 240 * Math.cos(a), y1 = HZ + 240 * Math.sin(a), x2 = 300 + 228 * Math.cos(a), y2 = HZ + 228 * Math.sin(a); ticks.push(el('line', { x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), class: 'thin', opacity: 0 }, svg)); }
    const road = el('path', { d: 'M80,320 C160,290 200,340 280,300 S420,270 520,318', class: 'gold' }, svg); const L = road.getTotalLength(); road.style.strokeDasharray = L; road.style.strokeDashoffset = L;
    const places = ['this rock', 'the water hole', 'where the ridge turns', 'go left, not right'].map((n, i) => { const k = .08 + i * .28; const q = road.getPointAtLength(L * k); const g = el('g', { transform: `translate(${q.x.toFixed(1)},${q.y.toFixed(1)})`, opacity: 0 }, svg); el('circle', { r: 6, class: 'gdot' }, g); const t = el('text', { y: i % 2 ? 24 : -14, 'text-anchor': 'middle', 'font-size': 12 }, g); t.textContent = n; return g; });
    const t1 = el('text', { x: 300, y: 36, 'text-anchor': 'middle', 'font-size': 13 }, svg); t1.textContent = 'the houses on the horizon';
    const t2 = el('text', { x: 300, y: 372, 'text-anchor': 'middle', 'font-size': 13, opacity: 0 }, svg); t2.textContent = 'the song is the country itself, in order';
    const star = el('circle', { r: 5, fill: '#FFE9B8', opacity: 0 }, svg);
    return p => {
      ticks.forEach((t, i) => t.setAttribute('opacity', (0.7 * seg(p, i * .02, .1 + i * .02)).toFixed(3)));
      const k = seg(p, .25, .4); const a = Math.PI + .72 * Math.PI - k * .5; star.setAttribute('cx', (300 + 232 * Math.cos(a)).toFixed(1)); star.setAttribute('cy', (HZ + 232 * Math.sin(a) * (1 - k * .55)).toFixed(1)); star.setAttribute('opacity', (seg(p, .22, .3) * (1 - seg(p, .36, .44))).toFixed(3));
      road.style.strokeDashoffset = (L * (1 - seg(p, .4, .95))).toFixed(1);
      places.forEach((g, i) => g.setAttribute('opacity', seg(p, .44 + i * .13, .5 + i * .13).toFixed(3)));
      t2.setAttribute('opacity', seg(p, .9, 1).toFixed(3));
    };
  }
};

/* ---------- the film theater ---------- */
P.theater = function(root, chaptersEl){
  const loopV = $('video.loop', root), film = $('video.film', root), poster = $('img.poster', root);
  const big = $('.bigplay', root), ctl = $('.controls', root), playBtn = $('.pp', ctl), seekEl = $('.seek', ctl), fill = $('.seek i', ctl), timeEl = $('.time', ctl), fsBtn = $('.fs', ctl), muteBtn = $('.mute', ctl);
  const now = $('.now', root), nowTxt = $('.now span', root);
  const chapters = chaptersEl ? $$('.chapter', chaptersEl) : [];
  const DUR = Number(film.dataset.duration) || 381.5;
  // the right copy for the screen
  const src = innerWidth < 700 ? film.dataset.srcPhone : film.dataset.src;
  film.src = src; film.preload = AP.render ? 'none' : 'metadata';
  // the living poster: a muted loop of the film's own water and ring
  if (loopV && AP.motion) { loopV.play().then(() => root.classList.add('loopon')).catch(() => {}); }
  // chapter marks on the seek bar
  chapters.forEach(c => { const b = document.createElement('b'); b.style.left = (Number(c.dataset.t) / DUR * 100) + '%'; seekEl.appendChild(b); });
  let started = false;
  function start(){
    if (!started) { started = true; root.classList.add('started'); if (loopV) { loopV.pause(); loopV.style.display = 'none'; } if (poster) poster.style.display = 'none'; film.style.display = 'block'; if (AP.current) AP.current.pause(); AP.says.forEach(s => s.stop()); }
    film.muted = false; film.play().then(() => { root.classList.add('playing'); root.classList.remove('paused'); AP.sound.duck(true); }).catch(() => {});
  }
  function pause(){ film.pause(); root.classList.remove('playing'); root.classList.add('paused'); AP.sound.duck(false); }
  big.addEventListener('click', start);
  playBtn.addEventListener('click', () => film.paused ? start() : pause());
  $('.screen', root).addEventListener('click', e => { if (started && !e.target.closest('.controls')) film.paused ? start() : pause(); });
  film.addEventListener('ended', () => { root.classList.remove('playing'); root.classList.add('paused'); AP.sound.duck(false); AP.sound.chime(); });
  film.addEventListener('timeupdate', () => {
    const t = film.currentTime; fill.style.width = (t / DUR * 100) + '%'; timeEl.textContent = AP.fmt(t) + ' / ' + AP.fmt(DUR);
    let cur = null; chapters.forEach(c => { const a = Number(c.dataset.t), b = Number(c.dataset.end || DUR); const on = t >= a && t < b; c.classList.toggle('on', on); const bar = $('.bar i', c); if (bar) bar.style.width = (on ? clamp((t - a) / (b - a), 0, 1) * 100 : t >= b ? 100 : 0) + '%'; if (on) cur = c; });
    if (cur) { nowTxt.textContent = $('.t b', cur).textContent; if (chaptersEl && !AP.render && cur !== chaptersEl._last) { chaptersEl._last = cur; const rail = cur.parentElement; rail.scrollTo({ left: cur.offsetLeft - rail.offsetLeft - 16, behavior: 'smooth' }); } }
  });
  seekEl.addEventListener('click', e => { const r = seekEl.getBoundingClientRect(); film.currentTime = clamp((e.clientX - r.left) / r.width, 0, 1) * DUR; if (!started) start(); });
  chapters.forEach(c => c.addEventListener('click', () => { const t = Number(c.dataset.t); if (!started) start(); film.currentTime = t; if (film.paused) start(); root.scrollIntoView({ behavior: AP.motion ? 'smooth' : 'auto', block: 'start' }); }));
  if (fsBtn) fsBtn.addEventListener('click', () => { const s = $('.screen', root); if (document.fullscreenElement) document.exitFullscreen(); else if (s.requestFullscreen) s.requestFullscreen(); else if (film.webkitEnterFullscreen) film.webkitEnterFullscreen(); });
  if (muteBtn) muteBtn.addEventListener('click', () => { film.muted = !film.muted; muteBtn.setAttribute('aria-pressed', String(film.muted)); muteBtn.querySelector('span').textContent = film.muted ? 'Sound' : 'Mute'; });
  addEventListener('ap:play', () => { if (!film.paused) pause(); });
  return { start, pause, film };
};

/* ---------- fallbacks when a block scrolls into view (bars, timeline) ---------- */
P.inview = function(sel){ const els = $$(sel); if (!els.length) return; if (!('IntersectionObserver' in window) || !AP.motion) { els.forEach(e => e.classList.add('in')); return; } const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .3 }); els.forEach(e => io.observe(e)); };

/* ---------- render hooks: every page's scroll-through film ---------- */
P.render = function(dur, o){ window.DURATION = dur || 48; window.seek = t => AP.seekPage(t, Object.assign({ hold: 3.5, end: (dur || 48) - 3 }, o || {})); };

/* ---------- beds: real loop files instead of the synthesized ones ---------- */
P.beds = function(base){ ['creek', 'hearth', 'ocean', 'dawn', 'night'].forEach(s => AP.sound.register(s, base + 'loop-' + s + '-48s.mp3')); };
})();
