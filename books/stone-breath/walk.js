/* THE WALK HOME · Stone Breath on Ancestral Peaks · 2026-11-26
   Uses the shared Peaks engine (window.AP): the bar, the footer, the sound layer, the breath ring.
   Kept on this device only, never sent: ap.hth.five (the same five Heal the Healer keeps), ap.sb.walk.for. */
(function(){
'use strict';
const AP = window.AP || {};
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const local = {
  get(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k){ try { localStorage.removeItem(k); } catch (e) {} }
};
const clean = v => String(v || '').trim().replace(/\s+/g, ' ').slice(0, 30);
const sound = AP.sound || { on: false, start(){}, stop(){}, set(){}, duck(){}, chime(){}, tick(){} };

/* the Peaks shell: bar, season line and footer (no sign-up over the walk, no smooth-scroll engine needed) */
try { AP.nav(); AP.season(); AP.footer(); } catch (e) {}

/* ---------- the voice: one player, used only after a tap ---------- */
const voice = new Audio(); voice.preload = 'none';
let queue = [], nowBtn = null;
function mark(btn){ if (nowBtn) nowBtn.classList.remove('playing'); nowBtn = btn || null; if (nowBtn) nowBtn.classList.add('playing'); }
function playNext(){
  const n = queue.shift();
  if (!n) { mark(null); sound.duck(false); return; }
  voice.src = 'media/voice/' + n + '.m4a';
  const p = voice.play(); sound.duck(true);
  if (p && p.catch) p.catch(() => { mark(null); sound.duck(false); });
}
voice.addEventListener('ended', playNext);
function hush(){ queue = []; voice.pause(); mark(null); sound.duck(false); }
function say(){ if (!sound.on) return; hush(); queue = Array.from(arguments); playNext(); }   // only when the sound layer is on
$$('.hear').forEach(b => b.addEventListener('click', () => {                                  // a tap on "Hear it" always plays
  if (nowBtn === b && !voice.paused) { hush(); return; }
  hush(); const t = $('#taste'); if (t) t.pause(); queue = [b.dataset.say]; mark(b); playNext();
}));
addEventListener('ap:sound', e => { if (!e.detail.on) hush(); });

/* ---------- stations ---------- */
const sts = $$('.st'), dots = $$('.trail i'), trailName = $('#trailName'), inhand = $('#inhand');
let cur = 0, hasStone = false;
const enter = {}, leave = {}, demo = {};   // demo: the finished state of a station, for checking the page (#s3.done)
function show(i, quiet){
  i = Math.max(0, Math.min(sts.length - 1, i));
  if (leave[cur]) leave[cur]();
  hush();
  sts.forEach((s, k) => { s.hidden = k !== i; });
  cur = i;
  const st = sts[i];
  trailName.textContent = st.dataset.name || '';
  dots.forEach((d, k) => { d.className = k + 1 < i ? 'done' : k + 1 === i ? 'now' : ''; });
  $('#trail').style.visibility = i === 0 ? 'hidden' : '';
  document.body.classList.toggle('at-home', i === sts.length - 1);
  const bar = $('[data-ap-nav]'); if (bar) bar.classList.toggle('on-light', i === sts.length - 1);   // the dawn is a light page
  inhand.hidden = !(hasStone && i > 0 && i < sts.length - 1);
  const foot = $('[data-ap-foot]'); if (foot) foot.hidden = i !== sts.length - 1;
  window.scrollTo(0, 0);
  const h = $('h1,h2', st); if (h && !quiet) { try { h.focus({ preventScroll: true }); } catch (e) {} }
  if (enter[i]) enter[i]();
}
function ready(i){ const b = $('[data-next]', sts[i]); if (b) b.classList.add('ready'); }
$$('[data-next]').forEach(b => b.addEventListener('click', () => show(cur + 1)));
$$('[data-back]').forEach(b => b.addEventListener('click', () => show(cur - 1)));

/* ---------- your light ---------- */
function lamp(scene, onMove){
  let x = 0, y = 0, raf = 0;
  const put = () => { raf = 0; scene.style.setProperty('--lx', x + 'px'); scene.style.setProperty('--ly', y + 'px'); };
  const set = (nx, ny) => { const r = scene.getBoundingClientRect(); x = Math.max(0, Math.min(r.width, nx)); y = Math.max(0, Math.min(r.height, ny)); if (!raf) raf = requestAnimationFrame(put); if (onMove) onMove(x, y, scene); };
  const at = e => { const r = scene.getBoundingClientRect(); set(e.clientX - r.left, e.clientY - r.top); };
  scene.addEventListener('pointerdown', at);
  scene.addEventListener('pointermove', at);
  scene.addEventListener('keydown', e => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d || e.target !== scene) return; e.preventDefault(); set(x + d[0] * 28, y + d[1] * 28);
  });
  const home = () => { const r = scene.getBoundingClientRect(), p = (scene.dataset.lamp || '50,45').split(','); x = r.width * p[0] / 100; y = r.height * p[1] / 100; put(); };
  return { home, get r(){ return parseFloat(getComputedStyle(scene).getPropertyValue('--lr')) || 0; } };
}

/* ---------- 0 · the threshold ---------- */
$('#startSound').addEventListener('click', () => { try { sound.set('wind'); sound.start(); } catch (e) {} show(1); });
$('#startQuiet').addEventListener('click', () => { if (sound.on) sound.stop(); show(1); });

/* ---------- 1 · the stone, pressed into the hand ---------- */
(function(){
  const scene = $('#s1 .scene'), L = lamp(scene), btn = $('#stoneBtn'), label = $('span', btn), doP = $('#do1');
  let timer = 0, held = false;
  function done(){
    held = true; hasStone = true; btn.classList.remove('holding'); btn.classList.add('held');
    label.textContent = 'It is yours'; btn.setAttribute('aria-label', 'The stone is in your hand');
    doP.textContent = 'The stone is in your hand. It stays in your hand.'; doP.classList.add('done');
    inhand.hidden = false; sound.chime(); ready(1);
  }
  function start(keep){
    if (held || timer) return; btn.classList.add('holding'); label.textContent = 'Keep holding';
    timer = setTimeout(() => { timer = 0; done(); }, 3000); btn._keep = !!keep;
  }
  function cancel(){ if (held || !timer || btn._keep) return; clearTimeout(timer); timer = 0; btn.classList.remove('holding'); label.textContent = 'Press and hold'; }
  btn.addEventListener('pointerdown', e => { e.preventDefault(); start(false); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => btn.addEventListener(t, cancel));
  btn.addEventListener('contextmenu', e => e.preventDefault());
  btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(true); } });   // keyboard: one press, three seconds
  enter[1] = () => { L.home(); sound.set('wind'); say('stone'); };
  demo[1] = done;
})();

/* ---------- 2 · the breath: the ring Peaks already has ---------- */
(function(){
  const host = $('#ring'), btn = $('#breathBtn'), after = $('#after2');
  let ring = null, tick = 0, going = false;
  function finished(){ going = false; clearInterval(tick); btn.textContent = 'Three more rounds'; btn.disabled = false; after.hidden = false; ready(2); say('breath'); }
  function make(){
    if (ring || !AP.breathRing) return;
    ring = AP.breathRing(host, { rounds: 3, legend: true, tones: true, rest: ['Breathe', 'with the stone'], onFinish: finished });
  }
  btn.addEventListener('click', () => {
    make(); if (!ring || going) return; going = true; btn.disabled = true; btn.textContent = 'Breathing…'; hush();
    if (AP.motion) ring.start();
    else { let t = 0; ring.seek(0, true); tick = setInterval(() => { t += 1; if (t >= ring.SESSION) { ring.seek(0, false); finished(); } else ring.seek(t, true); }, 1000); }   // reduced motion: the count steps once a second
  });
  enter[2] = () => { make(); sound.set('creek'); };
  demo[2] = () => { if (ring) ring.seek(2.6, true); after.hidden = false; ready(2); };
  leave[2] = () => { if (going && ring) { ring.stop(); clearInterval(tick); going = false; btn.disabled = false; btn.textContent = 'Begin three rounds'; if (AP.motion) ring.rest(); } };
})();

/* ---------- 3 · the long night: three things to find ---------- */
(function(){
  const scene = $('#s3 .scene'), embers = $$('.ember', scene), items = $$('#found3 li'), doP = $('#do3'), all = $('#lightAll');
  let n = 0;
  function find(b, silent){
    if (b.classList.contains('on')) return; b.classList.add('on'); n++;
    const li = items[b.dataset.n - 1]; li.hidden = false;
    if (!silent) { say('night' + b.dataset.n); sound.tick(.03); }
    doP.textContent = n < 3 ? (n === 1 ? 'One found. Two more are out there.' : 'Two found. One more.') : 'You found all three. He kept walking.';
    if (n === 3) { doP.classList.add('done'); all.hidden = true; ready(3); }
  }
  const L = lamp(scene, (x, y) => {
    const r = scene.getBoundingClientRect(), reach = Math.max(46, L.r * .42);
    embers.forEach(b => { if (b.classList.contains('on')) return; const bx = parseFloat(b.style.left) / 100 * r.width, by = parseFloat(b.style.top) / 100 * r.height; if (Math.hypot(bx - x, by - y) < reach) find(b); });
  });
  embers.forEach(b => b.addEventListener('click', () => find(b)));
  all.addEventListener('click', () => embers.forEach(b => find(b, true)));
  enter[3] = () => { sound.set('wind'); L.home(); };
  demo[3] = () => { embers.forEach(b => find(b, true)); scene.style.setProperty('--lx', '46%'); scene.style.setProperty('--ly', '42%'); };
})();

/* ---------- 4 · mile 77: the glaciers polish the stone ---------- */
(function(){
  const btn = $('#rub'), rock = $('#rock'), scratches = $('#scratches'), shine = $('#shine'), meter = $('#meter'), after = $('#after4'), doP = $('#do4');
  const N = 44, CX = 200, CY = 150, RX = 150, RY = 104, NS = 'http://www.w3.org/2000/svg';
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const jag = Array.from({ length: N }, (_, i) => (rnd() - .5) * .46 + (i % 5 === 0 ? .14 : 0));
  for (let i = 0; i < 16; i++) { const l = document.createElementNS(NS, 'line'), x = 95 + rnd() * 210, y = 85 + rnd() * 130, a = rnd() * 3.1, len = 10 + rnd() * 26; l.setAttribute('x1', x); l.setAttribute('y1', y); l.setAttribute('x2', x + Math.cos(a) * len); l.setAttribute('y2', y + Math.sin(a) * len); scratches.appendChild(l); }
  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  let p = 0, done = false, last = null, raf = 0;
  function draw(){
    raf = 0; let d = '';
    for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, k = 1 + jag[i] * (1 - p); d += (i ? 'L' : 'M') + (CX + Math.cos(a) * RX * k).toFixed(1) + ' ' + (CY + Math.sin(a) * RY * k).toFixed(1); }
    rock.setAttribute('d', d + 'Z');
    scratches.style.opacity = (1 - p).toFixed(2); shine.style.opacity = (p * p * .75).toFixed(2);
    $('#rg0').setAttribute('stop-color', `rgb(${mix(141, 240, p)},${mix(138, 214, p)},${mix(132, 160, p)})`);
    $('#rg1').setAttribute('stop-color', `rgb(${mix(60, 150, p)},${mix(58, 104, p)},${mix(56, 48, p)})`);
    meter.style.width = (p * 100).toFixed(0) + '%';
  }
  function add(v){
    if (done) return; p = Math.min(1, p + v); if (!raf) raf = requestAnimationFrame(draw);
    if (p >= 1) { done = true; btn.classList.add('done'); btn.setAttribute('aria-label', 'The stone is polished'); doP.textContent = 'All that friction, all that pressure.'; doP.classList.add('done'); after.hidden = false; sound.chime(); ready(4); }
  }
  btn.addEventListener('pointerdown', e => { last = [e.clientX, e.clientY]; try { btn.setPointerCapture(e.pointerId); } catch (x) {} });
  btn.addEventListener('pointermove', e => { if (!last) { last = [e.clientX, e.clientY]; return; } const d = Math.hypot(e.clientX - last[0], e.clientY - last[1]); last = [e.clientX, e.clientY]; if (d < 120) add(d / 2600); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => btn.addEventListener(t, () => { last = null; }));
  btn.addEventListener('click', e => { if (e.detail === 0) add(.13); });          // keyboard: Enter or Space
  btn.addEventListener('contextmenu', e => e.preventDefault());
  draw();
  enter[4] = () => { sound.set('wind'); say('polish'); };
  demo[4] = () => add(1);
})();

/* ---------- 5 · mile 95: the lamps fall in ---------- */
(function(){
  const scene = $('#scene5'), log = $('#log5'), btn = $('#stepBtn'), after = $('#after5'), many = $('#many');
  const steps = [
    ['back',  '<b>Mile 80.</b> Austėja ran beside him. Every twenty minutes she said <i>Drink.</i> She watched his stride. She watched his eyes. When the circle closes she takes the rear.'],
    ['left',  '<b>Mile 90.</b> Lukas fell in on his left. “You gave me a stone,” he said. “I’m returning the favor.”'],
    ['front', '<b>Mile 94.</b> Rytis, on his old knees, called from ahead: “From 95, unlimited. The whole tribe.”'],
    ['right', '<b>Mile 95.</b> A small figure stepped onto the trail. Headlamp bobbing. Braids. Twelve years old. Ugnė handed him the frybread. “Mama said you would need home.”'],
    ['many',  'Behind them, a constellation of smaller lights spreading across the trail. Without a word, without any of them having planned it, they had fallen into a diamond around him.']
  ];
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 16; i++) { const d = document.createElement('i'); d.style.left = (8 + rnd() * 84) + '%'; d.style.top = (4 + rnd() * 20 + (i % 2 ? 70 : 0)) + '%'; d.style.transitionDelay = (i * .09) + 's'; many.appendChild(d); }
  let k = 0;
  function mask(){
    const on = $$('.lamp.on', scene).map(l => `radial-gradient(circle ${l.classList.contains('you') ? 'calc(var(--lr)*.62)' : 'calc(var(--lr)*.72)'} at ${l.style.left} ${l.style.top},#000 0,rgba(0,0,0,.8) 45%,transparent 100%)`);
    if (many.classList.contains('on')) on.push('linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.55))');
    scene.style.setProperty('--mask', on.join(','));
  }
  btn.addEventListener('click', () => {
    if (k >= steps.length) return; const s = steps[k++];
    if (s[0] === 'many') many.classList.add('on'); else $(`.lamp[data-k="${s[0]}"]`, scene).classList.add('on');
    log.innerHTML = s[1]; mask(); sound.tick(.03);
    if (k === steps.length) { btn.hidden = true; after.hidden = false; ready(5); sound.chime(); say('mile95'); }
  });
  enter[5] = () => { mask(); sound.set('wind'); };
  demo[5] = () => { for (let i = 0; i < 5; i++) btn.click(); };
})();

/* ---------- 6 · your circle: your five, then the turn ---------- */
(function(){
  const scene = $('#scene6'), form = $('#fiveForm'), boxes = $$('input', form), lamps = $$('.lamp:not(.you):not(.far)', scene), clear = $('#fiveClear');
  const forBox = $('#forName'), far = $('#farLamp'), goTo = $('#goTo'), goName = $('#goToName');
  function paint(){
    let any = false;
    boxes.forEach((b, i) => { const v = clean(b.value); lamps[i].classList.toggle('on', !!v); $('b', lamps[i]).textContent = v; if (v) any = true; });
    clear.hidden = !any;
    const f = clean(forBox.value); far.classList.toggle('on', !!f); $('b', far).textContent = f; goTo.hidden = !f; goName.textContent = f ? 'Go to ' + f + '.' : '';
  }
  function keep(){ const names = boxes.map(b => clean(b.value)).filter(Boolean); if (names.length) local.set('ap.hth.five', names); else local.del('ap.hth.five'); const f = clean(forBox.value); if (f) local.set('ap.sb.walk.for', f); else local.del('ap.sb.walk.for'); }
  function load(){ const raw = local.get('ap.hth.five', []), names = (Array.isArray(raw) ? raw : []).map(clean).filter(Boolean).slice(0, 5); boxes.forEach((b, i) => { b.value = names[i] || ''; }); forBox.value = clean(local.get('ap.sb.walk.for', '')); paint(); }
  let lit = 0;
  [...boxes, forBox].forEach(b => { b.addEventListener('input', () => { paint(); keep(); const n = $$('.lamp.on', scene).length; if (n > lit) sound.tick(.025); lit = n; }); });
  boxes.forEach((b, i) => b.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); (boxes[i + 1] || forBox).focus(); } }));
  forBox.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); forBox.blur(); } });
  form.addEventListener('submit', e => e.preventDefault());
  clear.addEventListener('click', () => { boxes.forEach(b => { b.value = ''; }); paint(); keep(); boxes[0].focus(); });
  enter[6] = () => { load(); lit = $$('.lamp.on', scene).length; sound.set('hearth'); say('circle'); };
  demo[6] = () => { ['Ada', 'Marcus', 'Jurgita', 'Ben', 'Keiko'].forEach((n, i) => { boxes[i].value = n; }); forBox.value = 'Sam'; paint(); };   // sample names, shown only, not kept
})();

/* ---------- 7 · home ---------- */
(function(){
  const taste = $('#taste');
  taste.addEventListener('play', () => { hush(); sound.duck(true); });
  ['pause', 'ended'].forEach(t => taste.addEventListener(t, () => sound.duck(false)));
  $('#again').addEventListener('click', () => show(0));
  enter[7] = () => { sound.set('dawn'); say('enough', 'austeja'); try { AP.thumb(); } catch (e) {} };
  leave[7] = () => { taste.pause(); };
})();

/* open at a station with #s3 (used for checking the page) */
const m = /^#s([0-7])(\.done)?$/.exec(location.hash);
show(m ? +m[1] : 0, true);
if (m && m[2] && demo[m[1]]) demo[m[1]]();
})();
