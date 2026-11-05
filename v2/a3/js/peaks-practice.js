// Ancestral Peaks — THE PRACTICE. The stone breath over his real Oak Creek water, the path kept in this browser,
// and the far messenger's day as four pinned scenes. Built on the shared shell (window.AP) + PeaksField + PeaksVoice.
(function(){
'use strict';
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const html=document.documentElement;
const MEDIA='../media/';
const motion=()=>window.AP?AP.motion:true;

/* ---------- the path, kept in this browser (same key and thresholds as the home page) ---------- */
const KEY='ap.path';
function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
function save(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){} }
const dayKey=d=>d.toISOString().slice(0,10);
function state(){
  const o=load(); const days=o.days||[]; const today=dayKey(new Date());
  const first=o.first?new Date(o.first):null;
  const since=first?Math.floor((Date.now()-first.getTime())/864e5):0;
  const weekAgo=Date.now()-7*864e5;
  const week=days.filter(d=>new Date(d).getTime()>=weekAgo).length;
  const sittings=o.sittings||0;
  let tier=0; if(sittings>=1) tier=1; if(sittings>=7 && since>=6) tier=2; if(since>=30 && sittings>=20 && week>=3) tier=3;
  return {sittings,since,week,tier,today,sawToday:days.includes(today)};
}
function record(){
  const o=load(); const today=dayKey(new Date());
  o.sittings=(o.sittings||0)+1; o.first=o.first||new Date().toISOString(); o.days=o.days||[]; if(!o.days.includes(today)) o.days.push(today); o.days=o.days.slice(-90); save(o); paint(); return state();
}
const NAMES=['','The Door','The Fire','The Crossing','The Council'];
function paint(){
  const s=state();
  $('#ySit').textContent=s.sittings; $('#yDays').textContent=s.since; $('#yWeek').textContent=s.week;
  $('#yTier').textContent=s.sittings?(NAMES[s.tier]||'The Door')+(s.sawToday?' · today, done':''):'Your first sitting is the door';
  $$('.station').forEach(el=>el.classList.toggle('open', Number(el.dataset.tier)<=s.tier));
  $('#pSit').textContent=s.sittings; $('#pDays').textContent=s.since; $('#pWeek').textContent=s.week;
}
paint();

/* ---------- the breath ---------- */
const sec=$('#breath'), vid=$('#pebblesVid'), fieldCanvas=$('#breathField');
const field=PeaksField(fieldCanvas,'water',{maxDpr:1.25});
let ring=null, running=false, t0=0, settleShown=false;
function fadeVol(el,to,ms){ const from=el.volume, s=performance.now(); (function f(){ const p=Math.min(1,(performance.now()-s)/ms); try{ el.volume=from+(to-from)*p; }catch(e){} if(p<1) requestAnimationFrame(f); })(); }
function onStart(){
  running=true; settleShown=false; t0=performance.now();
  sec.classList.add('running'); $('#done').classList.remove('show'); $('#settle').classList.remove('show');
  const b=$('#beginBtn'); b.textContent='Breathing…'; b.disabled=true;
  // the layered water: his real creek under the footage, and the creek bed from the sound layer
  try{ vid.muted=false; vid.volume=0; vid.play().catch(()=>{}); fadeVol(vid,0.35,2500); }catch(e){}
  if(window.AP){ AP.sound.ensure(); if(AP.sound.on){ AP.sound.set('creek'); AP.sound.level(.7); } }
  if(window.AP&&AP.scrollTo) AP.scrollTo(sec,{offset:0});
}
function onFinish(){
  running=false;
  const s=record();
  $('#doneH').textContent= s.sittings===1 ? 'That was your first sitting. The door is open.' : `That was sitting ${s.sittings}.`;
  $('#doneP').textContent= s.sittings<7 ? `Did your shoulders drop? ${7-s.sittings} more morning${7-s.sittings===1?'':'s'} and the fire is lit.` : (s.tier>=3?'Did your shoulders drop? The crossing is held. Come back tomorrow.':'Did your shoulders drop? Come back tomorrow, and the path keeps opening.');
  $('#done').classList.add('show'); $('#settle').classList.remove('show');
  const b=$('#beginBtn'); b.textContent='Sit again'; b.disabled=false;
  setTimeout(()=>{ sec.classList.remove('running'); },1200);
  setTimeout(()=>{ try{ fadeVol(vid,0,4000); setTimeout(()=>{ vid.muted=true; },4200); }catch(e){} if(window.AP&&AP.sound.on) AP.sound.level(1); },9000);
  setTimeout(()=>$('#done').classList.remove('show'), 14000);
  PeaksVoice.cue('done');
}
function makeRing(){
  const host=$('#ring'); host.innerHTML='';
  ring=AP.breathRing(host,{rounds:5,legend:true,tones:true,rest:['Breathe','with the water'],onStart,onFinish});
  return ring;
}
if(window.AP) makeRing();
$('#beginBtn').addEventListener('click',()=>{ if(!ring) makeRing(); ring.start(); PeaksVoice.cue('tick'); });
$('#settledLink').addEventListener('click',e=>{ e.preventDefault(); if(window.AP&&AP.scrollTo) AP.scrollTo($('#path')); else $('#path').scrollIntoView({behavior:'smooth'}); });

// the water moves with the breath
let last=performance.now(), onScreen=true;
function breathLevels(t){
  const s=ring.stepAt(t);
  const k=s.i===0?AP.breathe(s.u/4):s.i===1?1:s.i===2?1-AP.breathe(s.u/6):0;
  return {level:.18+.6*k,low:.15+.5*k,mid:.2+.55*k,high:.08+.3*k};
}
function loop(now){
  const dt=Math.min(.05,(now-last)/1000); last=now;
  if(onScreen){
    let L;
    if(running&&ring){
      const t=(now-t0)/1000;
      if(t<ring.SESSION) L=breathLevels(t);
      else { L={level:.22,low:.3,mid:.2,high:.1}; if(!settleShown){ settleShown=true; $('#settle').classList.add('show'); try{ fadeVol(vid,0.6,1500); }catch(e){} } }
    } else L=PeaksVoice.levels(null,dt);
    field.frame(L,dt);
  }
  requestAnimationFrame(loop);
}
if(motion()) requestAnimationFrame(loop); else field.still();
addEventListener('resize',()=>field.resize());
if('IntersectionObserver' in window) new IntersectionObserver(es=>es.forEach(e=>{ onScreen=e.isIntersecting; }),{threshold:0}).observe(sec);
// a touch on the water
let lastRip=0;
sec.addEventListener('pointermove',e=>{ const n=performance.now(); if(n-lastRip<70) return; lastRip=n; const r=fieldCanvas.getBoundingClientRect(); field.ripple(e.clientX-r.left,e.clientY-r.top,.5); });

/* ---------- above the fold never waits on an observer ---------- */
setTimeout(()=>$$('.breath .reveal, .breath [data-words]').forEach(el=>el.classList.add('in')),700);

/* ---------- the hero sound button mirrors the bar's ---------- */
(function soundBtn(){
  const b=$('#soundBtn'); if(!b||!window.AP) return;
  const paint=()=>{ b.setAttribute('aria-pressed',String(AP.sound.on)); b.textContent=AP.sound.on?'Sound off':'Sound on'; };
  b.addEventListener('click',()=>{ AP.sound.toggle(); paint(); });
  addEventListener('ap:sound',paint); paint();
})();

/* ---------- the far messenger's day: four pinned scenes, each with footage, a photo, a drawn line and its own bed ---------- */
const scenes=$$('.scene');
const sceneFields=[];
scenes.forEach((sc,i)=>{
  const c=$('canvas.field',sc); const kind=sc.dataset.field||'water';
  const f=PeaksField(c,kind,{maxDpr:1.25});
  const v=$('video',sc);
  const o={sc,f,v,on:false,last:performance.now()};
  sceneFields.push(o);
  if('IntersectionObserver' in window) new IntersectionObserver(es=>es.forEach(e=>{ o.on=e.isIntersecting; if(v){ if(e.isIntersecting&&motion()){ v.play().then(()=>v.classList.add('on')).catch(()=>{}); } else v.pause(); } }),{threshold:.05}).observe(sc);
  else o.on=true;
  if(!motion()) f.still();
});
function sceneLoop(now){
  sceneFields.forEach(o=>{ const dt=Math.min(.05,(now-o.last)/1000); o.last=now; if(o.on){ o.f.frame(PeaksVoice.levels(null,dt),dt); } });
  requestAnimationFrame(sceneLoop);
}
if(motion()) requestAnimationFrame(sceneLoop);
addEventListener('resize',()=>sceneFields.forEach(o=>o.f.resize()));
// pin and parallax
if(window.AP&&AP.gsap&&AP.ST&&!AP.flat&&!AP.prefersReduced){
  scenes.forEach(sc=>{
    const tl=AP.gsap.timeline({scrollTrigger:{trigger:sc,start:'top top',end:'+=90%',pin:true,scrub:AP.render?true:0.6,anticipatePin:1}});
    tl.fromTo($('.still img',sc),{yPercent:-5,scale:1.1},{yPercent:5,scale:1.02,ease:'none',duration:1},0)
      .fromTo(sc,{'--wipe':1},{'--wipe':0,ease:'none',duration:.55},0)
      .fromTo($('.text',sc),{y:40,opacity:0},{y:0,opacity:1,ease:'none',duration:.3},.05)
      .fromTo($('.text .side',sc),{opacity:0},{opacity:1,ease:'none',duration:.2},.5);
  });
} else { scenes.forEach(sc=>{ sc.style.setProperty('--wipe',0); }); }

/* ---------- render mode: the 48 s film ---------- */
if(window.AP&&AP.render){
  window.DURATION=48;
  window.seek=async function(t){
    if(t<11){
      window.scrollTo(0,0);
      if(t<2){ ring.seek(0,false); field.frame(PeaksVoice.levelsAt?{level:.25,low:.25,mid:.25,high:.1}:{level:.25,low:.25,mid:.25,high:.1},1/30); sec.classList.remove('running'); }
      else { sec.classList.add('running'); const tt=t-2; ring.seek(tt,true); field.frame(breathLevels(tt),1/30); }
    } else {
      sec.classList.remove('running');
      AP.scrollThrough(t,{hold:11,end:45.5,from:0,to:1});
      sceneFields.forEach(o=>{ const r=o.sc.getBoundingClientRect(); if(r.bottom>0&&r.top<innerHeight) o.f.frame({level:.3+.15*Math.sin(t),low:.3,mid:.3,high:.15},1/30); });
    }
    if(AP.ST) AP.ST.update();
    AP.seekAll(t);
    $$('.reveal,[data-words]').forEach(el=>el.classList.add('in'));
    scenes.forEach(sc=>{ const v=$('video',sc); if(v&&!v.classList.contains('on')) v.classList.add('on'); });
    await AP.seekVideos(t);
    return true;
  };
}
window.PeaksPractice={state,record,paint,get ring(){return ring;}};
})();
