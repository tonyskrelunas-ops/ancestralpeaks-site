/* ARRIVE WHOLE — The Far Messengers on Ancestral Peaks.
   One panel at a time. What you carry and the name you give stay in this browser (localStorage); nothing is sent anywhere.
   Three small tasks, none of them a test: hold the lamp through a counted breath, do nothing for twenty seconds,
   step once on each breath out. Rushing never loses anything; the lamp only waits. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var stage = $('#stage'); if (!stage) return;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'ap.fm.arrive-whole';

  /* the shared Peaks bar and footer */
  try { if (window.AP) { AP.nav(); AP.footer(); } } catch (e) {}

  var CARGO = {
    song:     { a: 'a song',         the: 'the song',       The: 'The song',       line: '“Every song learned to the last verse.”' },
    seed:     { a: 'a seed',         the: 'the seed',       The: 'The seed',       line: 'They loaded “more seed than you need for more futures than you can see.”' },
    medicine: { a: 'a medicine',     the: 'the medicine',   The: 'The medicine',   line: '“Every cure had to be given completely.”' },
    way:      { a: 'the way across', the: 'the way across', The: 'The way across', line: '“He carried no map. He was the map.”' }
  };
  var state = { cargo: null, name: '' };
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ cargo: state.cargo, name: state.name })); } catch (e) {} }

  var panels = $$('.fm-panel', stage), layers = $$('.fm-layer', stage);
  var hud = $('#hud'), marks = $$('#marks li'), voiceBtn = $('#voiceBtn');
  var cur = 0, stopTask = null;

  /* ---------- the voice: only after a tap, one line a scene, a clear off ---------- */
  var voiceOn = false, audio = null, hearBtn = $('#hearClose');
  function setVoice(on) {
    voiceOn = on;
    voiceBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    voiceBtn.textContent = on ? 'Voice on' : 'Voice off';
    if (!on) hush();
  }
  function hush() { if (audio) { try { audio.pause(); } catch (e) {} } if (hearBtn) { hearBtn.setAttribute('aria-pressed', 'false'); hearBtn.textContent = 'Hear it'; } }
  function say(name, force) {
    if (!name || (!voiceOn && !force)) return;
    if (!audio) { audio = new Audio(); audio.preload = 'none'; audio.addEventListener('ended', function () { if (hearBtn) { hearBtn.setAttribute('aria-pressed', 'false'); hearBtn.textContent = 'Hear it'; } }); }
    try { audio.pause(); audio.src = 'media/' + name + '.m4a'; var p = audio.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  voiceBtn.addEventListener('click', function () {
    setVoice(!voiceOn);
    if (voiceOn) say(panels[cur].getAttribute('data-voice'));
  });
  if (hearBtn) hearBtn.addEventListener('click', function () {
    if (hearBtn.getAttribute('aria-pressed') === 'true') { hush(); return; }
    say('a7-close', true); hearBtn.setAttribute('aria-pressed', 'true'); hearBtn.textContent = 'Stop';
  });
  var film = $('.fm-film video'); if (film) film.addEventListener('play', hush);

  /* ---------- moving between panels ---------- */
  function fill() {
    var c = CARGO[state.cargo]; if (!c) return;
    $$('[data-c]').forEach(function (el) { el.textContent = c[el.getAttribute('data-c')]; });
  }
  function show(i, quiet) {
    if (i < 0 || i >= panels.length) return;
    if (stopTask) { stopTask(); stopTask = null; }
    hush();
    panels[cur].classList.remove('on');
    cur = i; var p = panels[i]; p.classList.add('on');
    var bg = p.getAttribute('data-bg');
    layers.forEach(function (l) {
      var on = l.getAttribute('data-bg') === bg;
      if (on && l.getAttribute('data-img')) { l.style.backgroundImage = 'url(' + l.getAttribute('data-img') + ')'; l.removeAttribute('data-img'); }
      l.classList.toggle('on', on);
    });
    stage.classList.toggle('deep', p.hasAttribute('data-deep'));
    hud.hidden = i < 2;
    var m = +(p.getAttribute('data-mark') || 0);
    marks.forEach(function (li) { var n = +li.getAttribute('data-m'); li.classList.toggle('done', n < m); li.classList.toggle('now', n === m); if (n === m) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    if (!quiet) {
      window.scrollTo(0, 0);
      var h = $('h1,h2', p); if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
      say(p.getAttribute('data-voice'));
    }
    var t = p.getAttribute('data-task'); if (t && TASKS[t]) stopTask = TASKS[t](p);
  }
  function next() { show(cur + 1); }

  stage.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null; if (!b || !stage.contains(b)) return;
    if (b.hasAttribute('data-begin')) { setVoice(b.getAttribute('data-begin') === 'voice'); next(); }
    else if (b.hasAttribute('data-cargo')) { state.cargo = b.getAttribute('data-cargo'); fill(); save(); next(); }
    else if (b.hasAttribute('data-next')) next();
  });

  /* ---------- the lamp ---------- */
  function lamp(panel, label) {
    var box = $('[data-lamp]', panel);
    box.innerHTML = '<button type="button" class="fm-lamp" aria-label="' + label + '"><span class="glow"></span><span class="ring"></span></button>' +
      '<p class="fm-phase" aria-hidden="true"></p><div class="fm-prog"></div><p class="fm-say" role="status" aria-live="polite"></p>';
    var after = $('.fm-after', panel), outs = $('.fm-outs', panel);
    if (after) after.hidden = true; if (outs) outs.hidden = false;
    return { btn: $('.fm-lamp', box), ring: $('.ring', box), phase: $('.fm-phase', box), prog: $('.fm-prog', box), say: $('.fm-say', box),
      scale: function (s) { if (!still) this.ring.style.transform = 'scale(' + s.toFixed(3) + ')'; },
      finish: function (line) { this.btn.className = 'fm-lamp lit done'; this.phase.textContent = ''; this.say.textContent = line; if (outs) outs.hidden = true; if (after) { after.hidden = false; var b = $('button', after); if (b) { try { b.focus({ preventScroll: true }); } catch (e) {} } } } };
  }
  function pips(el, n) { el.innerHTML = '<ol class="fm-pips">' + new Array(n + 1).join('<li></li>') + '</ol>'; return $$('li', el); }
  function ticker(fn) { var id = 0, last = 0, live = true; function f(t) { if (!live) return; var dt = last ? Math.min(0.5, (t - last) / 1000) : 0; last = t; fn(dt); id = requestAnimationFrame(f); } id = requestAnimationFrame(f); return function () { live = false; cancelAnimationFrame(id); }; }
  var ease = function (x) { return 0.5 - Math.cos(Math.PI * x) / 2; };

  var TASKS = {
    /* the dry well: keep a thumb on the lamp through in 4, hold 4, out 6, hold 4, three rounds */
    hold: function (panel) {
      var L = lamp(panel, 'The lamp. Press and hold it while you breathe.');
      var PH = [['Breathe in', 4], ['Hold', 4], ['Breathe out', 6], ['Hold', 4]], ROUND = 18, ROUNDS = 3;
      var dots = pips(L.prog, ROUNDS), t = 0, held = false, auto = false, done = false, begun = false;
      L.say.textContent = 'Rest your thumb on the lamp when you are ready.';
      function hold(v) { if (done) return; held = v; if (v) begun = true; L.btn.classList.toggle('lit', v || auto); L.btn.classList.toggle('waiting', begun && !v && !auto);
        L.say.textContent = (v || auto) ? 'The lamp is steady. Stay with the ring.' : 'The lamp waits. Nothing is lost. Rest your thumb on it again.'; }
      var b = L.btn;
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} hold(true); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { b.addEventListener(n, function () { if (held) hold(false); }); });
      b.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); hold(true); } else if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); });
      b.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hold(false); } });
      b.addEventListener('blur', function () { if (held) hold(false); });
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      var autoBtn = $('[data-auto]', panel);
      function goAuto() { auto = true; begun = true; hold(false); L.btn.classList.add('lit'); L.btn.classList.remove('waiting'); L.say.textContent = 'The lamp is steady. Breathe with the ring.'; }
      if (autoBtn) autoBtn.addEventListener('click', goAuto);
      var stop = ticker(function (dt) {
        if (done) return;
        if (held || auto) t += dt;
        if (t >= ROUND * ROUNDS) { done = true; dots.forEach(function (d) { d.classList.add('on'); }); L.finish('Three rounds. Your heart has come down.'); return; }
        var r = Math.floor(t / ROUND), x = t - r * ROUND, i = 0;
        while (x >= PH[i][1]) { x -= PH[i][1]; i++; }
        var left = Math.ceil(PH[i][1] - x);
        L.phase.textContent = begun ? PH[i][0] + ' · ' + left : 'Ready';
        L.scale(i === 0 ? 0.62 + 0.38 * ease(x / 4) : i === 1 ? 1 : i === 2 ? 1 - 0.38 * ease(x / 6) : 0.62);
        dots.forEach(function (d, n) { d.classList.toggle('on', n < r); });
      });
      return function () { stop(); if (autoBtn) autoBtn.removeEventListener('click', goAuto); };
    },

    /* the windless night: hands open, nothing at all for twenty seconds */
    still: function (panel) {
      var L = lamp(panel, 'The masthead lamp'); L.btn.tabIndex = -1; L.btn.classList.add('lit'); if (!still) L.btn.classList.add('swing');
      L.prog.innerHTML = '<div class="fm-bar"><i></i></div>'; var bar = $('i', L.prog);
      var go = $('.fm-go', panel), startBtn = $('[data-start]', panel); if (go) go.hidden = false;
      var NEED = 20, t = 0, running = false, done = false, quietAt = 0, graceUntil = 0, lx = null, ly = null;
      L.say.textContent = 'When you are ready, press Hands open, then let go of everything.';
      function stir(e) {
        if (!running || done) return;
        if (e && e.type === 'pointermove') { var dx = e.clientX - (lx === null ? e.clientX : lx), dy = e.clientY - (ly === null ? e.clientY : ly); lx = e.clientX; ly = e.clientY; if (dx * dx + dy * dy < 16) return; }
        if (performance.now() < graceUntil) return;                // a moment to let go of the button
        quietAt = performance.now() + 2500;
        L.phase.textContent = 'The water stirs.'; L.say.textContent = 'Nothing is lost. Open your hands. It settles again.';
        if (!still) { L.btn.classList.remove('stirred'); void L.btn.offsetWidth; L.btn.classList.add('stirred'); }
      }
      var EV = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchmove', 'scroll'];
      function start() {
        if (running) return; running = true; if (go) go.hidden = true;
        graceUntil = performance.now() + 2500; quietAt = performance.now() + 1500;
        L.phase.textContent = 'Hands open.'; L.say.textContent = 'Let the lamp swing over you and away.';
        EV.forEach(function (n) { window.addEventListener(n, stir, { passive: true }); });
      }
      if (startBtn) startBtn.addEventListener('click', start);
      var stop = ticker(function (dt) {
        if (!running || done) return;
        var now = performance.now();
        if (now >= quietAt) { t += dt; if (L.phase.textContent !== 'Still.') { L.phase.textContent = 'Still.'; L.say.textContent = 'Breath slow. Nothing to do.'; } }
        bar.style.width = Math.min(100, t / NEED * 100) + '%';
        if (t >= NEED) { done = true; off(); L.btn.classList.remove('swing'); L.finish('Twenty seconds of nothing. The others have gone quiet too, “the way a room goes quiet when snow starts.”'); }
      });
      function off() { EV.forEach(function (n) { window.removeEventListener(n, stir, { passive: true }); }); }
      return function () { stop(); off(); if (startBtn) startBtn.removeEventListener('click', start); };
    },

    /* the border at night: one soft step on each long breath out, five steps */
    step: function (panel) {
      var L = lamp(panel, 'The lamp. Tap it once on each breath out.'); L.btn.classList.add('lit');
      var IN = 4, OUT = 6, STEPS = 5, dots = pips(L.prog, STEPS), t = -1.2, steps = 0, stepped = -1, done = false;
      L.say.textContent = 'Wait for the breath out, then tap the lamp once.';
      function tap() {
        if (done || t < 0) return;
        var c = Math.floor(t / (IN + OUT)), x = t - c * (IN + OUT);
        if (x < IN) { L.say.textContent = 'The frost creaks. Nothing is lost. Wait for the breath out.'; L.btn.classList.add('creak'); setTimeout(function () { L.btn.classList.remove('creak'); }, 700); return; }
        if (stepped === c) { L.say.textContent = 'One step to a breath. The next one is coming.'; return; }
        stepped = c; steps++; dots.forEach(function (d, n) { d.classList.toggle('on', n < steps); });
        if (steps >= STEPS) { done = true; L.finish('Five quiet steps. Nobody heard you cross.'); }
        else L.say.textContent = 'A quiet step. ' + steps + ' of ' + STEPS + '.';
      }
      L.btn.addEventListener('click', tap);
      var stop = ticker(function (dt) {
        if (done) return; t += dt;
        if (t < 0) { L.phase.textContent = 'Ready'; return; }
        var x = t % (IN + OUT);
        if (x < IN) { L.phase.textContent = 'Breathe in · ' + Math.ceil(IN - x); L.scale(0.62 + 0.38 * ease(x / IN)); }
        else { L.phase.textContent = 'Breathe out, and step · ' + Math.ceil(IN + OUT - x); L.scale(1 - 0.38 * ease((x - IN) / OUT)); }
      });
      return stop;
    }
  };

  /* ---------- arrival: a first name, kept here only ---------- */
  var form = $('#nameForm'), input = $('#forName'), handed = $('#handedLine');
  function arrive(name) {
    state.name = (name || '').replace(/\s+/g, ' ').trim().slice(0, 40); save();
    var c = CARGO[state.cargo] || CARGO.song;
    handed.textContent = c.The + ', carried whole, for ' + (state.name || 'someone you will not meet') + '.';
    next();
  }
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); arrive(input.value); });
  var noName = $('#noName'); if (noName) noName.addEventListener('click', function () { arrive(''); });
  var again = $('#again'); if (again) again.addEventListener('click', function () { show(1); });

  /* ---------- someone who has been here before ---------- */
  var old = load();
  if (old && CARGO[old.cargo]) {
    var lt = $('#lastTime');
    lt.textContent = 'Last time you carried ' + CARGO[old.cargo].a + (old.name ? ' for ' + old.name : '') + '. That is kept on this device only.';
    lt.hidden = false;
  }

  /* a panel can be opened directly for checking: #p=7&c=seed */
  var m = /[#&]p=(\d+)/.exec(location.hash), mc = /[#&]c=(\w+)/.exec(location.hash);
  if (m) { state.cargo = mc && CARGO[mc[1]] ? mc[1] : 'song'; fill(); if (+m[1] === 13) handed.textContent = CARGO[state.cargo].The + ', carried whole, for someone you will not meet.'; show(+m[1], true); }
})();
