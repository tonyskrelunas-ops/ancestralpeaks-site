// Ancestral Peaks — THE LISTENING ROOM. Built on the shared shell (window.AP) + PeaksField + PeaksVoice.
// Data: media/sessions.js (window.PEAKS_SESSIONS). Progress: localStorage['ap.listen'].
(function(){
'use strict';
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const D=window.PEAKS_SESSIONS||{sessions:[],notes:[]};
const MEDIA='../media/';
const KEY='ap.listen';
const html=document.documentElement;
const hoverable=matchMedia('(hover:hover) and (pointer:fine)').matches;
const motion=()=>window.AP?AP.motion:true;
const store={load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){return {};}},save(o){try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}};
let prog=store.load();
const fmt=s=>{s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const mins=s=>Math.round(s/60)+' min';
const byId=id=>D.sessions.find(s=>s.id===id);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');

/* ---------- today's pick: rotates by the day of the year ---------- */
const now=new Date(), doy=Math.floor((now-new Date(now.getFullYear(),0,0))/864e5);
const today=D.sessions[doy%D.sessions.length];
(function paintToday(){
  const el=$('#today'); if(!el||!today) return;
  $('#todayImg').src=MEDIA+'img/'+today.img+'.jpg';
  $('#todayKick').textContent='Today · '+today.n+' · '+mins(today.dur);
  $('#todayTitle').textContent=today.title;
  $('#todayLine').textContent=today.line;
  el.addEventListener('click',e=>{e.preventDefault();open(today.id);});
  const b=$('#playToday'); if(b) b.addEventListener('click',()=>open(today.id));
})();

/* ---------- the rows ---------- */
function stateText(s){
  const p=prog[s.id];
  if(!p) return 'Not yet heard';
  if(p.done) return '<b>Heard</b> · sit again any time';
  if(p.t>20) return 'You stopped at <b>'+fmt(p.t)+'</b>';
  return 'Not yet heard';
}
function rowHTML(s,i){
  const p=prog[s.id], pct=p&&p.dur?Math.min(100,100*p.t/p.dur):0;
  return `<li class="sess" data-id="${s.id}" data-bed="${s.bed}" tabindex="0" role="button" aria-label="Open ${esc(s.title)}">
    <div class="pic" data-parallax="0.08"><img src="${MEDIA}img/${s.img}.jpg" alt="" loading="lazy">${s.video?`<video muted loop playsinline preload="none" src="${MEDIA}video/${s.video}.mp4"></video>`:''}<span class="dur">${mins(s.dur)}</span></div>
    <div class="body">
      <div class="num reveal">${String(i+1).padStart(2,'0')}</div>
      <p class="kick reveal">${esc(s.n)} · ${esc(s.where)}</p>
      <h3 class="reveal">${esc(s.title)}</h3>
      <p class="blurb reveal">${esc(s.blurb)}</p>
      <p class="line reveal">${esc(s.line)}</p>
      <div class="meta reveal"><span class="masked">Spoken in a masked voice</span><span class="state">${stateText(s)}</span></div>
      <div class="prog reveal"><i style="width:${pct}%"></i></div>
      <div class="acts reveal"><button class="btn earth openbtn" type="button">${p&&p.t>20&&!p.done?'Continue':'Listen'} <span class="arrow">→</span></button><canvas class="wave" width="320" height="56" aria-hidden="true"></canvas><span class="hint">a few seconds of this session</span></div>
    </div></li>`;
}
const list=$('#list');
if(list){ list.innerHTML=D.sessions.map(rowHTML).join(''); }
function refreshRows(){
  prog=store.load();
  $$('.sess').forEach(li=>{ const s=byId(li.dataset.id), p=prog[s.id]; $('.state',li).innerHTML=stateText(s); $('.prog i',li).style.width=(p&&p.dur?Math.min(100,100*p.t/p.dur):0)+'%'; $('.openbtn',li).firstChild.textContent=(p&&p.t>20&&!p.done?'Continue ':'Listen '); });
}

/* ---------- hover: a few seconds of the voice, the bed crossfades, the loop wakes ---------- */
const snip=new Audio(); snip.preload='none';
let hoverTimer=0, liveRow=null, waveRaf=0, waveT=performance.now();
function drawWave(canvas){
  const ctx=canvas.getContext('2d'); const W=canvas.width,H=canvas.height;
  const t=performance.now(), dt=(t-waveT)/1000; waveT=t;
  const L=PeaksVoice.levels(snip,dt);
  ctx.clearRect(0,0,W,H);
  const n=28, gap=W/n;
  for(let i=0;i<n;i++){
    const ph=i/n, env=Math.sin(Math.PI*ph);
    const h=H*(0.12+0.85*env*(0.25*L.low+0.55*L.mid+0.4*L.high)*(0.7+0.3*Math.sin(t/180+i)));
    ctx.fillStyle=i%3?'rgba(68,102,90,.9)':'rgba(209,166,60,.95)';
    ctx.fillRect(i*gap+gap*.3,(H-h)/2,gap*.4,h);
  }
  if(liveRow) waveRaf=requestAnimationFrame(()=>drawWave(canvas));
}
function rowEnter(li){
  if(!hoverable||html.classList.contains('player-open')) return;
  clearTimeout(hoverTimer);
  hoverTimer=setTimeout(()=>{
    const s=byId(li.dataset.id); if(!s) return;
    liveRow=li; li.classList.add('live');
    const v=$('video',li); if(v&&motion()){ v.play().then(()=>v.classList.add('on')).catch(()=>{}); }
    if(window.AP&&AP.sound.on) AP.sound.set(s.bed);
    if(s.snip){
      try{ snip.pause(); snip.src=MEDIA+'snips/'+s.snip; snip.volume=1; PeaksVoice.attach(snip); snip.play().catch(()=>{}); }catch(e){}
      waveT=performance.now(); cancelAnimationFrame(waveRaf); drawWave($('.wave',li));
    }
    PeaksVoice.cue('tick');
  },380);
}
function rowLeave(li){
  clearTimeout(hoverTimer);
  if(liveRow!==li) return;
  liveRow=null; li.classList.remove('live');
  const v=$('video',li); if(v){ v.pause(); v.classList.remove('on'); }
  // fade the snippet out
  const a=snip, t0=performance.now(), v0=a.volume; (function f(){ const p=Math.min(1,(performance.now()-t0)/260); try{a.volume=v0*(1-p);}catch(e){} if(p<1&&!liveRow) requestAnimationFrame(f); else if(!liveRow){ a.pause(); } })();
  if(window.AP&&AP.sound.on&&html.dataset.scene) AP.sound.set(html.dataset.scene);
}
$$('.sess').forEach(li=>{
  li.addEventListener('pointerenter',()=>rowEnter(li));
  li.addEventListener('pointerleave',()=>rowLeave(li));
  li.addEventListener('click',e=>{ open(li.dataset.id); });
  li.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(li.dataset.id); } });
});

/* ---------- the voice notes shelf (shared compact players) ---------- */
(function notes(){
  const shelf=$('#shelf'), sec=$('#notes'); if(!shelf) return;
  if(!D.notes||!D.notes.length){ if(sec) sec.hidden=true; return; }
  shelf.innerHTML=D.notes.map(n=>`<div class="note"><div class="ap-player compact dark" data-src="${MEDIA}notes/${n.src}" data-env="${MEDIA}notes/${n.src.replace(/\.mp3$/,'.env.json')}" data-title="${esc(n.title)}" data-sub="${esc(n.sub)} · ${fmt(n.dur)}" data-visual="bars" data-duration="${n.dur}" data-color="#D1A63C" data-color2="#5C8BD0"></div></div>`).join('');
  $('#noteCount').textContent=D.notes.length+' short ones';
})();

/* ---------- THE PLAYER ---------- */
const P={
  el:$('#player'), img:$('#pImg'), video:$('#pVideo'), canvas:$('#pField'), audio:$('#voice'),
  kick:$('#pKick'), title:$('#pTitle'), line:$('#pLine'), cur:$('#pCur'), dur:$('#pDur'), scrub:$('#pScrub'),
  pp:$('#pPlay'), back:$('#pBack'), fwd:$('#pFwd'), close:$('#pClose'), fin:$('#pFin'), finH:$('#pFinH'), finP:$('#pFinP'), next:$('#pNext'), again:$('#pAgain')
};
let cur=null, field=null, raf=0, lastT=0, saveAt=0, scrubbing=false;
function sizeField(){ if(field) field.resize(); }
addEventListener('resize',()=>{ clearTimeout(sizeField._t); sizeField._t=setTimeout(sizeField,120); });

function loop(now){
  const dt=Math.min(.05,(now-lastT)/1000||1/60); lastT=now;
  const L=PeaksVoice.levels(P.audio,dt);
  if(field) field.frame(L,dt);
  if(!scrubbing){ const t=P.audio.currentTime||0, d=P.audio.duration||cur.dur; P.cur.textContent=fmt(t); P.scrub.value=Math.round(1000*t/d); P.scrub.style.setProperty('--p',(100*t/d)+'%'); }
  raf=requestAnimationFrame(loop);
}
function setScene(s){
  P.img.src=MEDIA+'img/'+s.img+'.jpg';
  P.video.classList.remove('on'); P.video.pause(); P.video.removeAttribute('src'); P.video.load();
  if(s.video&&motion()){ P.video.src=MEDIA+'video/'+s.video+'.mp4'; P.video.poster=MEDIA+'video/'+s.video+'-poster.jpg'; P.video.play().then(()=>P.video.classList.add('on')).catch(()=>{}); }
  if(field) field.destroy();
  field=PeaksField(P.canvas,s.field,{maxDpr:innerWidth<900?1.25:1.5});
  P.el.dataset.field=s.field;
}
function open(id,opts){
  opts=opts||{};
  const s=byId(id); if(!s) return;
  if(liveRow) rowLeave(liveRow);
  try{ snip.pause(); }catch(e){}
  if(window.AP&&AP.current) AP.current.pause();
  cur=s;
  P.kick.textContent=s.n+' · '+s.where+' · '+mins(s.dur);
  P.title.textContent=s.title; P.line.textContent=s.line; P.dur.textContent=fmt(s.dur);
  P.el.classList.remove('finished');
  html.classList.add('player-open'); P.el.style.opacity=0;
  if(window.AP&&AP.lenis) AP.lenis.stop();
  setScene(s);
  // the voice
  PeaksVoice.loadEnv(MEDIA+'env/'+s.id+'.env.js', s.id);
  if(!opts.silent){
    P.audio.src=MEDIA+'audio/'+s.src;
    PeaksVoice.attach(P.audio);
    const p=prog[s.id]; const start=(p&&!p.done&&p.t>5&&p.t<s.dur-15)?p.t:0;
    const begin=()=>{ try{ P.audio.currentTime=start; }catch(e){} P.audio.play().then(()=>{ P.el.classList.add('playing'); if(window.AP) AP.sound.duck(true); }).catch(()=>{ P.el.classList.remove('playing'); }); };
    if(P.audio.readyState>=1) begin(); else P.audio.addEventListener('loadedmetadata',begin,{once:true});
    P.audio.load();
  }
  if(window.gsap&&motion()){
    gsap.to(P.el,{opacity:1,duration:.7,ease:'power2.out'});
    gsap.fromTo('#player .pcopy',{y:26,opacity:0},{y:0,opacity:1,duration:.9,delay:.25,ease:'power3.out'});
    gsap.fromTo('#player .ptop',{opacity:0},{opacity:1,duration:.6,delay:.4});
  } else { P.el.style.opacity=1; }
  PeaksVoice.cue('open');
  if('mediaSession' in navigator){ try{ navigator.mediaSession.metadata=new MediaMetadata({title:s.title,artist:'Ancestral Peaks · spoken in a masked voice',album:'The Listening Room',artwork:[{src:MEDIA+'img/'+s.img+'.jpg',sizes:'1400x1400',type:'image/jpeg'}]}); navigator.mediaSession.setActionHandler('play',()=>toggle()); navigator.mediaSession.setActionHandler('pause',()=>toggle()); navigator.mediaSession.setActionHandler('seekbackward',()=>skip(-15)); navigator.mediaSession.setActionHandler('seekforward',()=>skip(15)); }catch(e){} }
  lastT=performance.now(); cancelAnimationFrame(raf); if(motion()) raf=requestAnimationFrame(loop); else { field.still(); }
  P.close.focus({preventScroll:true});
  dispatchEvent(new CustomEvent('ap:listen-open',{detail:s}));
}
function save(done){
  if(!cur) return;
  const t=done?0:(P.audio.currentTime||0), d=P.audio.duration||cur.dur;
  const was=prog[cur.id]||{};
  prog[cur.id]={t,dur:d,done:done||was.done||false,at:Date.now()};
  if(done) prog[cur.id].done=true;
  store.save(prog);
}
function toggle(){ if(!cur) return; if(P.audio.paused){ PeaksVoice.attach(P.audio); P.audio.play().then(()=>{P.el.classList.add('playing'); if(window.AP) AP.sound.duck(true);}).catch(()=>{}); } else { P.audio.pause(); } PeaksVoice.cue('tick'); }
function skip(n){ if(!cur) return; try{ P.audio.currentTime=Math.max(0,Math.min((P.audio.duration||cur.dur)-1,P.audio.currentTime+n)); }catch(e){} PeaksVoice.cue('tick'); }
function close(silent){
  if(!cur) return;
  save(false);
  P.audio.pause();
  P.video.pause(); P.video.classList.remove('on');
  cancelAnimationFrame(raf);
  if(field){ field.destroy(); }
  html.classList.remove('player-open'); P.el.classList.remove('playing','finished');
  if(window.AP){ AP.sound.duck(false); if(AP.lenis) AP.lenis.start(); }
  if(!silent) PeaksVoice.cue('close');
  const li=$(`.sess[data-id="${cur.id}"]`); cur=null; refreshRows();
  if(li&&!silent) li.focus({preventScroll:true});
}
P.audio.addEventListener('pause',()=>{ P.el.classList.remove('playing'); if(window.AP&&!P.audio.ended) AP.sound.duck(false); save(false); });
P.audio.addEventListener('play',()=>{ P.el.classList.add('playing'); });
P.audio.addEventListener('timeupdate',()=>{ const n=Date.now(); if(n-saveAt>2000){ saveAt=n; save(false); } });
P.audio.addEventListener('ended',()=>{
  save(true); P.el.classList.remove('playing'); P.el.classList.add('finished');
  if(window.AP) AP.sound.duck(false);
  PeaksVoice.cue('done');
  const i=D.sessions.indexOf(cur), nx=D.sessions[(i+1)%D.sessions.length];
  P.finH.textContent='That was '+cur.title+'.';
  P.finP.textContent='Notice how you feel. Next in the room: '+nx.title+', '+mins(nx.dur)+'.';
  P.next.onclick=()=>{ P.el.classList.remove('finished'); open(nx.id); };
  P.again.onclick=()=>{ P.el.classList.remove('finished'); try{P.audio.currentTime=0;}catch(e){} toggle(); };
  refreshRows();
});
P.pp.addEventListener('click',toggle);
P.back.addEventListener('click',()=>skip(-15));
P.fwd.addEventListener('click',()=>skip(15));
P.close.addEventListener('click',()=>close(false));
P.scrub.addEventListener('input',()=>{ scrubbing=true; const d=P.audio.duration||(cur&&cur.dur)||1; const t=d*P.scrub.value/1000; P.cur.textContent=fmt(t); P.scrub.style.setProperty('--p',(100*t/d)+'%'); });
P.scrub.addEventListener('change',()=>{ const d=P.audio.duration||(cur&&cur.dur)||1; try{ P.audio.currentTime=d*P.scrub.value/1000; }catch(e){} scrubbing=false; });
addEventListener('keydown',e=>{
  if(!html.classList.contains('player-open')) return;
  if(e.key==='Escape') close(false);
  else if(e.key===' '&&!/input|button/i.test(e.target.tagName)){ e.preventDefault(); toggle(); }
  else if(e.key==='ArrowLeft') skip(-15);
  else if(e.key==='ArrowRight') skip(15);
});
addEventListener('ap:play',()=>{ if(cur&&!P.audio.paused) P.audio.pause(); });
addEventListener('pagehide',()=>save(false));

/* ---------- the arrival: water that answers the pointer ---------- */
(function arrival(){
  const c=$('#roomField'); if(!c) return;
  const f=PeaksField(c,'water',{maxDpr:1.25});
  let on=true, last=performance.now(), lastRip=0;
  const sec=c.closest('section');
  function tick(now){ const dt=Math.min(.05,(now-last)/1000); last=now; if(on&&!html.classList.contains('player-open')){ f.frame(PeaksVoice.levels(null,dt),dt); } requestAnimationFrame(tick); }
  if(motion()) requestAnimationFrame(tick); else f.still();
  addEventListener('resize',()=>f.resize());
  sec.addEventListener('pointermove',e=>{ const n=performance.now(); if(n-lastRip<70) return; lastRip=n; const r=c.getBoundingClientRect(); f.ripple(e.clientX-r.left,e.clientY-r.top,.6); });
  sec.addEventListener('pointerdown',e=>{ const r=c.getBoundingClientRect(); f.ripple(e.clientX-r.left,e.clientY-r.top,1.6); PeaksVoice.cue('tick'); });
  if('IntersectionObserver' in window){ new IntersectionObserver(es=>es.forEach(e=>{ on=e.isIntersecting; }),{threshold:0}).observe(sec); }
  window.__roomField=f;
})();

/* ---------- above the fold never waits on an observer ---------- */
setTimeout(()=>$$('.arrive .reveal, .arrive [data-words]').forEach(el=>el.classList.add('in')),700);

/* ---------- the hero sound button mirrors the bar's ---------- */
(function soundBtn(){
  const b=$('#soundBtn'); if(!b||!window.AP) return;
  const paint=()=>{ b.setAttribute('aria-pressed',String(AP.sound.on)); b.textContent=AP.sound.on?'Sound off':'Sound on'; };
  b.addEventListener('click',()=>{ AP.sound.toggle(); paint(); });
  addEventListener('ap:sound',paint); paint();
})();

/* ---------- render mode: the 50 s scroll-through film ---------- */
if(window.AP&&AP.render){
  window.DURATION=50;
  const RID='week1-settle-yourself-first', OFF=262; // mix time: "so this week, before a hard meeting…" into the first counted breath
  let opened=false;
  window.seek=async function(t){
    const H=html.scrollHeight-innerHeight;
    const secEnd=$('#sessions').offsetTop+$('#sessions').offsetHeight-innerHeight;
    if(t<17){
      if(opened){ close(true); opened=false; }
      AP.scrollThrough(t,{hold:2.5,end:16.5,from:0,to:Math.min(1,secEnd/H)});
    } else if(t<44){
      if(!opened){ open(RID,{silent:true}); opened=true; P.el.style.opacity=1; P.el.classList.add('playing'); }
      const at=OFF+(t-17);
      const L=PeaksVoice.levelsAt(at);
      field.frame(L,1/30);
      P.cur.textContent=fmt(at); P.scrub.value=Math.round(1000*at/cur.dur); P.scrub.style.setProperty('--p',(100*at/cur.dur)+'%');
    } else {
      if(opened){ close(true); opened=false; }
      AP.scrollThrough(t,{hold:44,end:49.2,from:Math.min(1,secEnd/H),to:1});
    }
    if(window.__roomField&&t<17){ window.__roomField.frame({level:.3+.2*Math.sin(t*1.3),low:.3,mid:.3,high:.2},1/30); if(t%1.7<0.04) window.__roomField.ripple(innerWidth*(0.3+0.4*Math.random()),innerHeight*(0.4+0.4*Math.random()),1.2); }
    if(AP.ST) AP.ST.update();
    AP.seekAll(t);
    $$('.reveal,[data-words]').forEach(el=>el.classList.add('in'));
    await AP.seekVideos(t);
    return true;
  };
}
window.PeaksListen={open,close,toggle,today,snip,get current(){return cur;}};
})();
