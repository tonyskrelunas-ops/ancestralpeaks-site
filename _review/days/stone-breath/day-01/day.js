/* STONE BREATH · 22 DAYS · one day's page · 2026-11-26
   The same file serves every day. What changes per day: index.html (the words), data/chapter.js (the chapter and its
   word timings, made by make_day.py), data/scenes.js (the pictures), media/.
   Nothing a visitor does here is sent anywhere: the place in the chapter, the days walked and the line they write
   are kept on the device only (localStorage, always inside try/catch). */
(function(){
'use strict';
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const AP = window.AP || {};
try { AP.nav(); AP.season(); AP.footer(); } catch (e) {}
const DAY = Number(document.body.dataset.day) || 1, DAYS = Number(document.body.dataset.days) || 22;
const still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || AP.motion === false;
const fmt = t => { t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };

/* ---------- kept on the device ---------- */
const KEY = 'ap.sb22';
function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }
let state = load(); state.days = state.days || {}; state.lines = state.lines || {}; state.pos = state.pos || {};
const mine = () => (state.days[DAY] = state.days[DAY] || {});
const walked = d => { const x = state.days[d]; return !!(x && (x.chapter || x.breath)); };

/* ---------- the day count: gentle, no streaks ---------- */
function drawDays(){
  const strip = $('#strip'); if (!strip) return;
  strip.innerHTML = '';
  for (let d = 1; d <= DAYS; d++) { const li = document.createElement('li'); li.textContent = d; if (walked(d)) li.className = 'done'; if (d === DAY) li.classList.add('now'); li.setAttribute('aria-label', 'Day ' + d + (walked(d) ? ', walked' : '') + (d === DAY ? ', today' : '')); strip.appendChild(li); }
  const n = Object.keys(state.days).filter(walked).length;
  $('#walked').textContent = n ? 'Days walked so far: ' + n + ' of ' + DAYS + '. Kept on this device only.' : 'No days walked yet. This one counts when you finish the chapter or the breath.';
  const did = $('#didIt'); if (did) { const on = !!mine().breath; did.setAttribute('aria-pressed', on ? 'true' : 'false'); did.textContent = on ? 'The breath is done for today ✓' : 'I did the breath today'; }
}
function mark(what, on){ mine()[what] = on === false ? 0 : 1; save(state); drawDays(); }

/* ---------- the chapter: the text, word by word ---------- */
const CH = window.DAY_CHAPTER, SC = window.DAY_SCENES || [];
const reader = $('#chapter'), book = $('#book');
const W = [], T = [], BLOCK = [];          // every word's span, its time, its block
const blockEl = [], blockStart = [];
if (CH && book) {
  const frag = document.createDocumentFragment();
  CH.blocks.forEach((b, bi) => {
    const el = document.createElement(b.t === 'sec' || b.t === 'head' ? 'h3' : 'p');
    if (b.t === 'head') el.className = 'title'; if (b.t === 'epi') el.className = 'epi';
    el.dataset.b = bi; blockStart[bi] = W.length;
    b.w.forEach((w, wi) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; el.appendChild(s); if (wi < b.w.length - 1) el.appendChild(document.createTextNode(' ')); W.push(s); T.push(b.s[wi]); BLOCK.push(bi); });
    blockEl[bi] = el; frag.appendChild(el);
  });
  book.appendChild(frag);
}
const DUR = CH ? CH.dur : 0;

/* ---------- the pictures ---------- */
const pics = $('#pics'), cap = $('#cap'); let scene = -1; const made = {};
function sceneFor(bi){ let k = 0; for (let i = 0; i < SC.length; i++) if (SC[i].at <= bi) k = i; return k; }
function build(i){
  if (made[i]) return made[i]; const s = SC[i]; if (!s) return null;
  const d = document.createElement('div'); d.className = 'pic ' + s.kind;
  const img = new Image(); img.alt = ''; img.decoding = 'async';
  img.src = 'media/scenes/' + s.id + (s.kind === 'plate' ? '.webp' : '.jpg'); d.appendChild(img);
  if (s.kind === 'clip' && !still) { const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'none'; v.poster = img.src; v.dataset.src = 'media/scenes/' + s.id + '.mp4'; d.appendChild(v); }
  pics.appendChild(d); return (made[i] = d);
}
function showScene(i){
  if (i === scene || !SC[i]) return;
  const old = made[scene], now = build(i); scene = i;
  if (old) { old.classList.remove('on'); const ov = $('video', old); if (ov) ov.pause(); setTimeout(() => { if (made[scene] !== old && old.parentNode && Object.keys(made).length > 6) { /* keep the room light: drop pictures long gone */ for (const k in made) if (made[k] === old) { delete made[k]; old.remove(); } } }, 4000); }
  void now.offsetWidth; now.classList.add('on');   // the read of offsetWidth lets a new picture fade in from clear
  cap.textContent = SC[i].cap || '';
  moveClip(); if (SC[i + 1]) setTimeout(() => build(i + 1), 1200);   // have the next one ready
}
function moveClip(){ const d = made[scene]; const v = d && $('video', d); if (!v) return; if (playing() && !still) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause(); }
if (SC.length && pics) showScene(0);

/* ---------- the reading ---------- */
const audio = new Audio(); audio.preload = 'none'; if (CH) audio.src = 'media/chapter.m4a';
const playing = () => !audio.paused && !audio.ended;
const ctl = $('#ctl'), begin = $('#begin'), pp = $('#pp'), fill = $('#fill'), time = $('#time'), track = $('#track'), followBtn = $('#follow');
let cur = -1, curBlock = -1, follow = true, started = false, raf = 0, lastSave = 0, pendingSeek = null;

function lightTo(i){               // i = the word being read now (-1 = none yet)
  if (i === cur) return;
  if (i < cur) { for (let k = Math.max(0, i); k <= cur && k < W.length; k++) W[k].className = 'w'; }
  else for (let k = Math.max(0, cur); k < i; k++) W[k].className = 'w r';
  if (i >= 0 && W[i]) W[i].className = 'w r c';
  cur = i;
  const bi = i >= 0 ? BLOCK[i] : 0;
  if (bi !== curBlock) {
    if (blockEl[curBlock]) blockEl[curBlock].classList.remove('now');
    curBlock = bi; if (blockEl[bi]) blockEl[bi].classList.add('now');
    showScene(sceneFor(bi)); if (follow && started) bring(blockEl[bi]);
  }
}
function wordAt(t){ let lo = 0, hi = T.length - 1, a = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (T[m] <= t) { a = m; lo = m + 1; } else hi = m - 1; } return a; }
function readLine(){ const sc = $('.stagecol'); const wide = matchMedia('(min-width:1000px)').matches; const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 72; return wide ? bar + innerHeight * .22 : bar + sc.offsetHeight + 22; }   // on a phone: just under the picture, where it rests once it has stuck to the top
function bring(el){ if (!el) return; const y = el.getBoundingClientRect().top + scrollY - readLine(); scrollTo({ top: Math.max(0, y), behavior: still || Math.abs(y - scrollY) > innerHeight * 1.5 ? 'instant' : 'smooth' }); }   // a long jump lands at once
function paint(){
  const t = audio.currentTime || 0;
  lightTo(wordAt(t + 0.06));
  fill.style.width = (DUR ? 100 * t / DUR : 0) + '%'; time.textContent = fmt(t); track.setAttribute('aria-valuenow', DUR ? Math.round(100 * t / DUR) : 0); track.setAttribute('aria-valuetext', fmt(t) + ' of ' + fmt(DUR));
  if (t - lastSave > 5 || t < lastSave) { lastSave = t; state.pos[DAY] = Math.floor(t); save(state); }
}
function loop(){ paint(); if (playing()) raf = requestAnimationFrame(loop); }
function start(from){
  if (!CH) return;
  started = true; reader.classList.add('started', 'reading'); begin.hidden = true; ctl.hidden = false; $('#hint').textContent = 'Tap any paragraph to hear the reading from there.';
  try { if (AP.current) AP.current.pause(); } catch (e) {}
  if (typeof from === 'number') seek(from);
  audio.play().catch(() => {});
}
function seek(t){ t = Math.max(0, Math.min(DUR - .2, t)); if (audio.readyState >= 1) { audio.currentTime = t; } else { pendingSeek = t; audio.load(); } lastSave = t; lightTo(wordAt(t + .06)); fill.style.width = (100 * t / DUR) + '%'; time.textContent = fmt(t); }
audio.addEventListener('loadedmetadata', () => { if (pendingSeek != null) { audio.currentTime = pendingSeek; pendingSeek = null; } });
audio.addEventListener('play', () => { reader.classList.add('playing'); pp.setAttribute('aria-label', 'Pause'); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); moveClip(); });
audio.addEventListener('pause', () => { reader.classList.remove('playing'); pp.setAttribute('aria-label', 'Play'); moveClip(); paint(); });
audio.addEventListener('ended', () => { reader.classList.remove('playing'); mark('chapter'); state.pos[DAY] = 0; save(state); W.forEach(w => { w.className = 'w r'; }); cur = W.length; follow = false; });
audio.addEventListener('timeupdate', () => { if (document.hidden || still) paint(); });   // the screen is off or motion is reduced: still keep the place

if (CH) {
  const mins = Math.round(DUR / 60), saved = Number(state.pos[DAY]) || 0, bb = $('#beginBtn'), note = $('#beginNote');
  note.textContent = 'About ' + mins + ' minutes. The words light as they are read and the pictures move with the story.';
  if (saved > 20 && saved < DUR - 30) {
    bb.lastChild.textContent = ' Pick up at ' + fmt(saved);
    const again = document.createElement('button'); again.type = 'button'; again.className = 'btn ghost'; again.textContent = 'From the beginning'; again.addEventListener('click', () => start(0)); bb.after(again);
    bb.addEventListener('click', () => start(saved));
  } else bb.addEventListener('click', () => start(0));
  pp.addEventListener('click', () => { playing() ? audio.pause() : audio.play().catch(() => {}); });
  $('#back15').addEventListener('click', () => seek((audio.currentTime || 0) - 15));
  $('#fwd15').addEventListener('click', () => seek((audio.currentTime || 0) + 15));
  const rates = [1, 1.15, 0.9]; let ri = 0;
  $('#rate').addEventListener('click', e => { ri = (ri + 1) % rates.length; audio.playbackRate = rates[ri]; e.currentTarget.textContent = rates[ri] + '×'; });
  // the track, with a tick at each part of the chapter
  const ticks = $('#ticks'); CH.blocks.forEach(b => { if (b.t === 'sec') { const s = document.createElement('span'); s.style.left = (100 * b.s[0] / DUR) + '%'; ticks.appendChild(s); } });
  const at = e => { const r = track.getBoundingClientRect(); return DUR * Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
  let drag = false;
  track.addEventListener('pointerdown', e => { drag = true; try { track.setPointerCapture(e.pointerId); } catch (x) {} follow = true; followBtn.hidden = true; seek(at(e)); });
  track.addEventListener('pointermove', e => { if (drag) seek(at(e)); });
  track.addEventListener('pointerup', () => { drag = false; }); track.addEventListener('pointercancel', () => { drag = false; });
  track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') seek((audio.currentTime || 0) + 15); if (e.key === 'ArrowLeft') seek((audio.currentTime || 0) - 15); });
  // tap a paragraph to hear it from there
  book.addEventListener('click', e => { const el = e.target.closest('[data-b]'); if (!el || String(getSelection()).length) return; const bi = Number(el.dataset.b); follow = true; followBtn.hidden = true; start(T[blockStart[bi]] || 0); });
  // the reader's own scrolling wins: stop following until they ask to come back
  const letGo = () => { if (started && playing() && follow) { follow = false; followBtn.hidden = false; } };
  addEventListener('wheel', letGo, { passive: true }); addEventListener('touchmove', letGo, { passive: true });
  addEventListener('keydown', e => { if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key) && e.target === document.body) letGo(); });
  followBtn.addEventListener('click', () => { follow = true; followBtn.hidden = true; bring(blockEl[curBlock]); });
  // reading in quiet: the pictures still move with the page
  let tick = false;
  addEventListener('scroll', () => { if (tick || playing()) return; tick = true; requestAnimationFrame(() => { tick = false; const r = reader.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const y = readLine() + 40; let bi = 0; for (let i = 0; i < blockEl.length; i++) { if (blockEl[i].getBoundingClientRect().top <= y) bi = i; else break; } showScene(sceneFor(bi)); }); }, { passive: true });
  // checking aid: add #at=300 to the address to see the page as it looks 300 seconds into the reading (no sound is started)
  const m = /^#at=(\d+)/.exec(location.hash);
  if (m) { started = true; reader.classList.add('started', 'reading'); begin.hidden = true; ctl.hidden = false; seek(Number(m[1])); addEventListener('load', () => setTimeout(() => bring(blockEl[curBlock]), 300)); }
  addEventListener('pagehide', () => { if (started) { state.pos[DAY] = Math.floor(audio.currentTime || 0); save(state); } });
}
// one voice at a time
addEventListener('ap:play', () => { if (playing()) audio.pause(); });

/* ---------- the challenge: the ring and the guided audio ---------- */
$$('.ap-player[data-src]').forEach(el => { try { AP.player(el, { env: '' }); } catch (e) {} });   // no sound-shape file for these: the picture moves by itself
(function(){
  const host = $('#ring'), btn = $('#ringBtn'); if (!host || !btn || !AP.breathRing) return;
  let ring = null, going = false, tick = 0;
  function done(){ going = false; clearInterval(tick); btn.disabled = false; btn.textContent = 'Five more rounds'; mark('breath'); }
  function make(){ if (!ring) ring = AP.breathRing(host, { rounds: 5, legend: true, tones: true, rest: ['Breathe', 'with the stone'], onFinish: done }); }
  if ('IntersectionObserver' in window) new IntersectionObserver((es, ob) => { if (es.some(e => e.isIntersecting)) { make(); ob.disconnect(); } }, { rootMargin: '200px' }).observe(host); else make();
  btn.addEventListener('click', () => {
    make(); if (going) return; going = true; btn.disabled = true; btn.textContent = 'Breathing…';
    if (playing()) audio.pause(); try { if (AP.current) AP.current.pause(); } catch (e) {}
    if (!still) ring.start();
    else { let t = 0; ring.seek(0, true); tick = setInterval(() => { t += 1; if (t >= ring.SESSION) { ring.seek(0, false); done(); } else ring.seek(t, true); }, 1000); }
  });
})();
const did = $('#didIt'); if (did) did.addEventListener('click', () => mark('breath', !mine().breath));

/* ---------- one line to write ---------- */
(function(){
  const box = $('#lineBox'), note = $('#lineNote'); if (!box) return;
  const base = note.textContent; let t = 0;
  if (state.lines[DAY]) box.value = state.lines[DAY];
  box.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.lines[DAY] = box.value.slice(0, 400); note.textContent = save(state) ? 'Kept on this device. ' + base : 'This browser would not keep it, so write it on paper too. ' + base; }, 500); });
})();

drawDays();
})();
