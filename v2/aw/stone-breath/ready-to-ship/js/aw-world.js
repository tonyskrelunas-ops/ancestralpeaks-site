/* ═══════════════════════════════════════════════════════════════════════
   ANCESTRAL WATCH — the layered book pages: motion, scenes, particles, sound.
   Depends on GSAP + ScrollTrigger + Lenis (loaded before this file from /js/vendor/).
   Everything degrades: no JS = the page reads top to bottom; reduced motion = no pinning,
   no smooth scroll, scenes shown at their final frame, videos paused with controls.
   Render mode (?render=1) exposes window.DURATION and window.seek(t) for render.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
var AW = window.AW = {};
var q = new URLSearchParams(location.search);
var RENDER = q.get('render') === '1';
var STATIC = q.get('static') === '1';
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var MOTION = !reduce && !STATIC;
AW.render = RENDER; AW.motion = MOTION; AW.reduce = reduce;
if(!MOTION) document.documentElement.classList.add('no-motion');

/* ── one clock for everything that moves on time ───────────────────────── */
var clock = {t:0, use:false, t0:performance.now()/1000};
AW.now = function(){ return clock.use ? clock.t : performance.now()/1000 - clock.t0; };
var tickers = [];
AW.tick = function(fn){ tickers.push(fn); return fn; };
AW.untick = function(fn){ var i=tickers.indexOf(fn); if(i>=0) tickers.splice(i,1); };
function runTickers(t){ for(var i=0;i<tickers.length;i++){ try{ tickers[i](t); }catch(e){ console.error(e); } } }
if(!RENDER){ (function loop(){ runTickers(AW.now()); requestAnimationFrame(loop); })(); }

/* ── smooth scroll + ScrollTrigger ─────────────────────────────────────── */
var lenis = null;
function initScroll(){
  if(!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if(MOTION && !RENDER && window.Lenis){
    lenis = new Lenis({lerp:.085, smoothWheel:true, syncTouch:false});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(t){ lenis.raf(t*1000); });
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add('lenis','lenis-smooth');
  }
  ScrollTrigger.config({ignoreMobileResize:true});
}
AW.scrollTo = function(target){ if(lenis) lenis.scrollTo(target, {offset:-60}); else { var el=typeof target==='string'?document.querySelector(target):target; if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); } };

/* ── reveal ────────────────────────────────────────────────────────────── */
function initReveal(){
  var els = document.querySelectorAll('[data-reveal]');
  if(!MOTION || !('IntersectionObserver' in window)){ els.forEach(function(e){ e.classList.add('is-in'); }); return; }
  var io = new IntersectionObserver(function(en){ en.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add('is-in'); io.unobserve(x.target); } }); }, {rootMargin:'0px 0px -8% 0px', threshold:.08});
  els.forEach(function(e){ io.observe(e); });
  setTimeout(function(){ els.forEach(function(e){ e.classList.add('is-in'); }); }, 2500);
}

/* ── parallax on his photographs ───────────────────────────────────────── */
function initParallax(){
  if(!MOTION || !window.gsap) return;
  document.querySelectorAll('.wc-par[data-parallax]').forEach(function(box){
    var media = box.querySelector('img,video'); if(!media) return;
    var amt = parseFloat(box.getAttribute('data-parallax')) || 12;
    gsap.set(media, {scale:1 + amt/100*1.6, transformOrigin:'50% 50%'});
    gsap.fromTo(media, {yPercent:-amt}, {yPercent:amt, ease:'none', scrollTrigger:{trigger:box, start:'top bottom', end:'bottom top', scrub:true}});
  });
}

/* ── the cover in motion (image untouched) ─────────────────────────────── */
function initCover(){
  document.querySelectorAll('.wc-cover3d').forEach(function(wrap){
    var card = wrap.querySelector('.wc-cover3d__card'); var sheen = wrap.querySelector('.wc-cover3d__sheen');
    if(!card || !MOTION || !window.gsap) return;
    var rx = gsap.quickTo(card, 'rotationX', {duration:.9, ease:'power3.out'});
    var ry = gsap.quickTo(card, 'rotationY', {duration:.9, ease:'power3.out'});
    var sx = sheen ? gsap.quickTo(sheen, 'backgroundPositionX', {duration:1.1, ease:'power2.out'}) : null;
    gsap.set(card, {rotationY:-9, rotationX:3, transformPerspective:1400});
    var hero = wrap.closest('section') || document.body;
    var hover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if(hover){
      hero.addEventListener('pointermove', function(e){
        var r = wrap.getBoundingClientRect(); var cx = r.left + r.width/2, cy = r.top + r.height/2;
        var dx = (e.clientX - cx) / Math.max(r.width, 420), dy = (e.clientY - cy) / Math.max(r.height, 520);
        dx = Math.max(-1, Math.min(1, dx)); dy = Math.max(-1, Math.min(1, dy));
        ry(-9 + dx*14); rx(3 - dy*10); if(sx) sx((50 - dx*50) + '%');
      });
      hero.addEventListener('pointerleave', function(){ ry(-9); rx(3); if(sx) sx('100%'); });
    }
    // on scroll the book settles and drifts up a little slower than the page
    gsap.to(card, {y:-40, rotationY:-16, ease:'none', scrollTrigger:{trigger:hero, start:'top top', end:'bottom top', scrub:true}});
    // a slow idle breath so it is never dead still
    var t0 = Math.random()*10;
    AW.tick(function(t){ if(!hover) { card.style.setProperty('--idle', ''); ry(-9 + Math.sin((t+t0)*.5)*4); rx(3 + Math.cos((t+t0)*.37)*2); if(sx) sx((60 + Math.sin((t+t0)*.3)*40) + '%'); } });
  });
}

/* ── pinned, scrubbed scenes ───────────────────────────────────────────── */
/* AW.scene(section, {length:'+=180%', onProgress:function(p){...}, caps:[{el, at, until}]}) */
AW.scene = function(section, opts){
  opts = opts || {};
  var stage = section.querySelector('.wc-scene__stage') || section;
  var bar = section.querySelector('.wc-scene__progress i');
  var caps = Array.prototype.slice.call(section.querySelectorAll('.wc-cap')).map(function(el){
    return {el:el, at:parseFloat(el.getAttribute('data-at')||0), until:parseFloat(el.getAttribute('data-until')||1)};
  });
  var last = -1;
  function apply(p){
    p = Math.max(0, Math.min(1, p)); if(p===last) return; last = p;
    if(opts.onProgress) opts.onProgress(p);
    if(bar) bar.style.width = (p*100).toFixed(2)+'%';
    caps.forEach(function(c){
      var fin = Math.max(0, Math.min(1, (p - c.at)/.06)), fout = c.until >= 1 ? 1 : Math.max(0, Math.min(1, (c.until - p)/.05));
      var o = Math.min(fin, fout); c.el.style.opacity = o; c.el.style.transform = 'translateY(' + ((1-fin)*14) + 'px)';
    });
  }
  section.__apply = apply;
  // the site header is sticky, so the stage sits below it: shorter by the header, pinned under it
  function headerH(){ var h = document.querySelector('.site-header'); var b = document.getElementById('pv-banner'); return (h ? h.getBoundingClientRect().height : 0) + (b ? b.offsetHeight : 0); }
  function sizeStage(){ var hh = headerH(); stage.style.height = 'calc(100vh - ' + Math.round(hh) + 'px)'; stage.style.minHeight = '480px'; return hh; }
  var hh = sizeStage();
  if(!MOTION || !window.gsap){ apply(opts.restAt != null ? opts.restAt : 1); return {apply:apply}; }
  var st = ScrollTrigger.create({trigger:section, start:function(){ return 'top ' + Math.round(headerH()) + 'px'; }, end:opts.length || '+=180%', pin:stage, pinSpacing:true, scrub:true, anticipatePin:1,
    onRefreshInit:sizeStage, onUpdate:function(self){ apply(self.progress); }});
  apply(0);
  return {apply:apply, st:st};
};

/* ── particle fields: all deterministic in t, so render mode is exact ──── */
function fitCanvas(c){ var r=c.getBoundingClientRect(); var dpr=Math.min(window.devicePixelRatio||1, 2); var w=Math.max(1,Math.round(r.width*dpr)), h=Math.max(1,Math.round(r.height*dpr)); if(c.width!==w||c.height!==h){ c.width=w; c.height=h; } return {w:w,h:h,dpr:dpr}; }
function rng(seed){ var s=seed>>>0; return function(){ s = (s*1664525 + 1013904223)>>>0; return s/4294967296; }; }
function visible(el){ var r=el.getBoundingClientRect(); return r.bottom>-40 && r.top<innerHeight+40 && r.width>0; }

AW.particles = function(canvas, kind, opts){
  opts = opts || {}; var ctx = canvas.getContext('2d'); var R = rng(opts.seed||7);
  var N = opts.count || (kind==='stars'?260: kind==='embers'?90:120);
  var P = []; for(var i=0;i<N;i++) P.push({x:R(), y:R(), s:R(), p:R()*Math.PI*2, v:.4+R()*.9, r:R()});
  var still = !MOTION;
  function draw(t){
    if(!still && !RENDER && !visible(canvas)) return;
    var d = fitCanvas(canvas), w=d.w, h=d.h, dpr=d.dpr; ctx.clearRect(0,0,w,h);
    if(kind==='water'){
      // soft caustic ripples drifting with the current, lit from the sun
      ctx.globalCompositeOperation='lighter';
      for(var i=0;i<P.length;i++){ var o=P[i];
        var x=((o.x + t*0.012*o.v + Math.sin(t*.35+o.p)*.008)%1+1)%1*w, y=((o.y + Math.sin(t*.22+o.p*2)*.01)%1+1)%1*h;
        var rad=(10+o.s*34)*dpr*(1+.25*Math.sin(t*.9+o.p)); var a=.05+.07*(.5+.5*Math.sin(t*1.3+o.p*3));
        var g=ctx.createRadialGradient(x,y,0,x,y,rad); g.addColorStop(0,'rgba(255,250,235,'+a+')'); g.addColorStop(.55,'rgba(214,236,232,'+(a*.5)+')'); g.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,rad,0,Math.PI*2); ctx.fill(); }
    } else if(kind==='embers'){
      ctx.globalCompositeOperation='lighter';
      for(var j=0;j<P.length;j++){ var e=P[j];
        var life=((t*0.09*e.v + e.p/6.283)%1+1)%1;                        // 0 at birth near the fire, 1 when it is gone
        var x=(e.x*0.5+0.25 + Math.sin(t*.7+e.p)*.04*life + (e.r-.5)*.5*life)*w, y=(1 - life*1.05)*h + e.s*h*.08;
        var a=Math.max(0,(1-life))*(.45+.4*Math.sin(t*6+e.p)); var rad=(1.2+e.s*2.2)*dpr*(1+life*.6);
        ctx.fillStyle='rgba(255,'+(150+Math.round(60*e.s))+','+Math.round(40+40*e.s)+','+a.toFixed(3)+')';
        ctx.beginPath(); ctx.arc(x,y,rad,0,Math.PI*2); ctx.fill();
        if(e.s>.7){ var g2=ctx.createRadialGradient(x,y,0,x,y,rad*6); g2.addColorStop(0,'rgba(255,160,60,'+(a*.25)+')'); g2.addColorStop(1,'rgba(255,120,30,0)'); ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(x,y,rad*6,0,Math.PI*2); ctx.fill(); } }
    } else if(kind==='stars'){
      ctx.globalCompositeOperation='source-over';
      var drift = (opts.drift==null? .0025 : opts.drift);
      for(var k=0;k<P.length;k++){ var s=P[k];
        var x=((s.x - t*drift*(0.3+s.r))%1+1)%1*w, y=s.y*h*(opts.band||1);
        var tw=.55+.45*Math.sin(t*(1.2+s.v*2)+s.p); var a=(.25+.7*s.s)*tw; var rad=(.5+s.s*1.5)*dpr;
        ctx.fillStyle='rgba(250,244,228,'+a.toFixed(3)+')'; ctx.beginPath(); ctx.arc(x,y,rad,0,Math.PI*2); ctx.fill();
        if(s.s>.93){ ctx.strokeStyle='rgba(250,244,228,'+(a*.35)+')'; ctx.lineWidth=dpr*.7; ctx.beginPath(); ctx.moveTo(x-rad*4,y); ctx.lineTo(x+rad*4,y); ctx.moveTo(x,y-rad*4); ctx.lineTo(x,y+rad*4); ctx.stroke(); } }
    }
  }
  if(still){ draw(0); window.addEventListener('resize', function(){ draw(0); }); }
  else AW.tick(draw);
  return {draw:draw};
};

/* ── videos: play only in view; reduced motion shows the poster + controls ─ */
function initVideos(){
  document.querySelectorAll('video[data-loop]').forEach(function(v){
    v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline','');
    // one loop cut two ways: the wide crop for desktop, the tall original for the phone
    var wide = v.getAttribute('data-src-wide'), tall = v.getAttribute('data-src-tall');
    if(wide || tall){ var pick = (window.innerWidth > 700 ? (wide||tall) : (tall||wide)); if(pick && v.getAttribute('src') !== pick){ v.setAttribute('src', pick); v.load(); } }
    if(!MOTION){ v.removeAttribute('autoplay'); v.pause(); if(v.hasAttribute('data-decor')){ v.style.display='none'; } else { v.controls = true; v.classList.add('is-ready'); } return; }
    v.addEventListener('loadeddata', function(){ v.classList.add('is-ready'); });
    if(v.readyState >= 2) v.classList.add('is-ready');
    if(RENDER){ v.pause(); return; }
    var io = new IntersectionObserver(function(en){ en.forEach(function(x){ if(x.isIntersecting){ var p=v.play(); if(p&&p.catch) p.catch(function(){}); } else v.pause(); }); }, {threshold:.08});
    io.observe(v);
  });
}

/* ── sound: one dock for the book's soundscape, plus short voice cards ──── */
AW.sound = (function(){
  var bed = null, dock = null, on = false, target = 0, cur = 0, ducked = false, BED = .5, voices = [];
  function mk(){
    var b = document.createElement('button'); b.className='wc-sound'; b.type='button'; b.setAttribute('aria-pressed','false');
    b.setAttribute('aria-label', 'Sound: ' + (document.body.getAttribute('data-sound-name')||'soundscape'));
    b.innerHTML = '<span class="wc-sound__ic" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="wc-sound__l">Sound <b>·</b> ' + (document.body.getAttribute('data-sound-name')||'on') + '</span>';
    document.body.appendChild(b); return b;
  }
  function ensure(){ if(bed) return bed; var src=document.body.getAttribute('data-sound-src'); if(!src) return null; bed=new Audio(src); bed.loop=true; bed.preload='none'; bed.volume=0; return bed; }
  function set(v){ on = v; target = v ? (ducked? BED*.28 : BED) : 0; if(dock){ dock.setAttribute('aria-pressed', String(v)); } try{ localStorage.setItem('aw-sound', v?'1':'0'); }catch(e){} if(v){ var b=ensure(); if(b){ var p=b.play(); if(p&&p.catch) p.catch(function(){}); } } }
  function duck(d){ ducked = d; if(on) target = d ? BED*.28 : BED; }
  AW.tick(function(){ if(!bed) return; var k = .035; cur += (target-cur)*k; if(Math.abs(cur-target)<.002) cur=target; bed.volume = Math.max(0, Math.min(1, cur)); if(!on && cur<=0.002 && !bed.paused) bed.pause(); });
  document.addEventListener('visibilitychange', function(){ if(!bed) return; if(document.hidden) bed.pause(); else if(on) { var p=bed.play(); if(p&&p.catch) p.catch(function(){}); } });
  function init(){
    if(!document.body.getAttribute('data-sound-src')) return;
    dock = mk(); dock.addEventListener('click', function(){ set(!on); });
    var remembered = null; try{ remembered = localStorage.getItem('aw-sound'); }catch(e){}
    if(remembered==='1'){ // browsers will not play until a gesture; arm it for the first one
      var arm = function(){ set(true); window.removeEventListener('pointerdown', arm); window.removeEventListener('keydown', arm); };
      window.addEventListener('pointerdown', arm); window.addEventListener('keydown', arm);
    }
    document.querySelectorAll('.wc-voice').forEach(initVoice);
  }
  function initVoice(card){
    var src = card.getAttribute('data-src'); var btn = card.querySelector('.wc-voice__btn'); var bars = card.querySelectorAll('.wc-voice__bars i');
    if(!src || !btn) return;
    var a = new Audio(src); a.preload = 'none'; voices.push(a);
    var ctx=null, an=null, data=null;
    function analyser(){ if(ctx || !(window.AudioContext||window.webkitAudioContext)) return; try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); var s=ctx.createMediaElementSource(a); an=ctx.createAnalyser(); an.fftSize=64; s.connect(an); an.connect(ctx.destination); data=new Uint8Array(an.frequencyBinCount); }catch(e){ ctx=null; } }
    btn.addEventListener('click', function(){
      if(!a.paused){ a.pause(); return; }
      voices.forEach(function(o){ if(o!==a) o.pause(); });
      analyser(); if(ctx && ctx.state==='suspended') ctx.resume();
      var p=a.play(); if(p&&p.catch) p.catch(function(){});
    });
    a.addEventListener('play', function(){ card.classList.add('is-playing'); duck(true); });
    a.addEventListener('pause', function(){ card.classList.remove('is-playing'); duck(false); bars.forEach(function(b){ b.style.height='4px'; }); });
    a.addEventListener('ended', function(){ a.currentTime=0; });
    AW.tick(function(t){ if(a.paused) return; if(an){ an.getByteFrequencyData(data); bars.forEach(function(b,i){ var v=data[Math.min(data.length-1, 2+i*2)]/255; b.style.height=(4+v*18)+'px'; }); } else bars.forEach(function(b,i){ b.style.height=(6+10*Math.abs(Math.sin(t*5+i)))+'px'; }); });
  }
  return {init:init, set:set, duck:duck, isOn:function(){ return on; }};
})();

/* ── render hooks for render.js (?render=1) ─────────────────────────────── */
function initRender(){
  if(!RENDER) return;
  clock.use = true; clock.t = 0;
  var DUR = parseFloat(q.get('dur')) || 48;
  window.DURATION = DUR;
  document.documentElement.classList.add('is-render');
  // the site's own `html{scroll-behavior:smooth}` would turn every seek into an animation the frame stepper cuts short
  document.documentElement.style.scrollBehavior = 'auto'; document.body.style.scrollBehavior = 'auto';
  var vids = Array.prototype.slice.call(document.querySelectorAll('video'));
  function easeInOut(x){ return x<.5 ? 2*x*x : 1-Math.pow(-2*x+2,2)/2; }
  function easeScroll(u){ // a slow start, a steady middle, a slow landing
    var a=.08, b=.92; if(u<a) return (u/a)*(u/a)*a*.5*2; if(u>b){ var v=(u-b)/(1-b); return b + (1-b)*(1-(1-v)*(1-v)); } return u; }
  // when does each [id] section reach the upper half of the frame? (for placing sound in the film)
  window.markTimes = function(ids){
    var out = {}, max = document.documentElement.scrollHeight - innerHeight, hold = parseFloat(q.get('hold')) || 1.2;
    ids.forEach(function(id){ var el = document.getElementById(id); if(!el) return; var top = el.getBoundingClientRect().top + scrollY;
      for(var t=0; t<=DUR; t+=.1){ var u = Math.max(0, Math.min(1, (t - hold) / (DUR - hold - 1.5))); var y = max * easeScroll(u); if(top - y < innerHeight*.45){ out[id] = Math.round(t*10)/10; break; } } });
    return out;
  };
  window.seek = function(t){
    clock.t = t;
    var max = document.documentElement.scrollHeight - innerHeight;
    var hold = parseFloat(q.get('hold')) || 1.2;                 // seconds held at the top before the scroll begins
    var u = Math.max(0, Math.min(1, (t - hold) / (DUR - hold - 1.5)));
    window.scrollTo({top: Math.round(max * easeScroll(u)), left: 0, behavior: 'instant'});
    if(window.ScrollTrigger) ScrollTrigger.update();
    runTickers(t);
    var waits = [];
    vids.forEach(function(v){
      if(!v.duration || !visible(v)) return;
      var want = (t % v.duration);
      if(Math.abs(v.currentTime - want) > .02){ waits.push(new Promise(function(res){ var done=function(){ v.removeEventListener('seeked',done); res(); }; v.addEventListener('seeked',done); setTimeout(res,400); v.currentTime = want; })); }
    });
    return Promise.all(waits).then(function(){ return new Promise(function(r){ requestAnimationFrame(function(){ requestAnimationFrame(r); }); }); });
  };
}

/* ── boot ──────────────────────────────────────────────────────────────── */
function boot(){
  document.body.classList.add('wc');
  initScroll(); initReveal(); initParallax(); initCover(); initVideos(); AW.sound.init(); initRender();
  if(window.ScrollTrigger){ setTimeout(function(){ ScrollTrigger.refresh(); }, 400); window.addEventListener('load', function(){ ScrollTrigger.refresh(); }); }
  document.dispatchEvent(new CustomEvent('aw:ready'));
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
