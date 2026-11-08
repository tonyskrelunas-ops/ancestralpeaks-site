// Ancestral Peaks — THE READING ROOM, a store window beside the Listening Room (built 2026-11-07).
// Everyone sees every piece: title, image, one line and the opening. The free pieces show a generous excerpt and
// send the reader to the original on tribeawaken.com; the science shelf and the longer writings show their opening
// and the members' door. Built on the shared shell (window.AP) + PeaksField + PeaksVoice. Runs BEFORE AP.init
// (data-noinit), so the rows exist when the shell wires reveal, parallax and the bar. Nothing is stored.
(function(){
'use strict';
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const D=window.PEAKS_READINGS||{free:[],science:[],writings:[]};
const MEDIA='../media/';
const JOIN=(window.AP&&AP.JOIN)||{monthly:'#members',yearly:'#members'};
const html=document.documentElement;
const hoverable=matchMedia('(hover:hover) and (pointer:fine)').matches;
const motion=()=>window.AP?AP.motion:true;
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const mins=w=>Math.max(1,Math.round((w||0)/220))+' min read';
const LOCK='<svg class="lk" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z"/></svg>';
const doorBtn=(title,small,dark)=>`<a class="${small?'door-link':'btn ghost'+(dark?'':' dark')+' door'}" href="${JOIN.monthly}" data-offer="member-monthly" aria-label="Members read ${esc(title)} in full">${LOCK}Members read in full <span class="arrow">→</span></a>`;
const paras=(list,shown)=>{
  const a=list.slice(0,shown), b=list.slice(shown);
  return `<div class="excerpt">${a.map((p,i)=>`<p${i===a.length-1&&b.length?' class="fade"':''}>${esc(p)}</p>`).join('')}${b.length?`<div class="more">${b.map(p=>`<p>${esc(p)}</p>`).join('')}</div>`:''}</div>`;
};

/* ---------- the free pieces: his published articles, a generous excerpt, then the original ---------- */
function freeCard(s,i){
  return `<article class="rcard" data-id="${s.id}" data-bed="${s.bed}">
    <div class="pic"><img src="${MEDIA}reading/${s.img}.jpg" alt="" loading="${i<2?'eager':'lazy'}"><span class="dur">Free · ${mins(s.words)}</span></div>
    <div class="body">
      <div class="num">${String(i+1).padStart(2,'0')}</div>
      <p class="kick">${esc(s.date)} · TribeAwaken journal</p>
      <h3>${esc(s.title)}</h3>
      <p class="dek">${esc(s.dek)}</p>
      ${paras(s.excerpt,2)}
      <div class="acts">${s.excerpt.length>2?`<button class="keep" type="button" aria-expanded="false">Keep reading <span class="arrow">→</span></button>`:''}<a class="ta-link" href="${s.href}" rel="noopener">Read the whole piece on TribeAwaken <span class="arrow">→</span></a></div>
    </div>
  </article>`;
}
const shelf=$('#freeShelf'); if(shelf) shelf.innerHTML=D.free.map(freeCard).join('');

/* ---------- the science shelf: editorial rows, the opening, the door ---------- */
function rowHTML(s,i){
  return `<li class="sess locked" data-id="${s.id}" data-bed="${s.bed}">
    <div class="pic" data-parallax="0.08"><img src="${MEDIA}img/${s.img}.jpg" alt="" loading="lazy">${s.video?`<video muted loop playsinline preload="none" data-src="${MEDIA}video/${s.video}.mp4"></video>`:''}<span class="dur">${LOCK}${mins(s.words)}</span></div>
    <div class="body">
      <div class="num reveal">${String(i+D.free.length+1).padStart(2,'0')}</div>
      <p class="kick reveal">The science shelf · ${esc(s.kick)}</p>
      <h3 class="reveal">${esc(s.title)}</h3>
      <p class="blurb reveal">${esc(s.dek)}</p>
      <div class="reveal">${paras(s.excerpt,s.excerpt.length)}</div>
      <div class="meta reveal"><span class="mem">${LOCK}${esc(String(s.words.toLocaleString('en-US')))} words in full for members</span></div>
      <div class="acts reveal">${doorBtn(s.title)}</div>
    </div></li>`;
}
const list=$('#list'); if(list) list.innerHTML=D.science.map(rowHTML).join('');

/* ---------- longer writings ---------- */
function writingHTML(s,i){
  return `<li class="srow" data-id="${s.id}" data-bed="${s.bed}">
    <div class="th"><img src="${MEDIA}img/${s.img}.jpg" alt="" loading="lazy"><span class="dur">${LOCK}${mins(s.words)}</span></div>
    <div class="tx">
      <p class="kick"><span class="n">${String(i+D.free.length+D.science.length+1).padStart(2,'0')}</span>${esc(s.kick)}</p>
      <h3>${esc(s.title)}</h3>
      <p class="blurb">${esc(s.dek)}</p>
      ${paras(s.excerpt,s.excerpt.length)}
      <div class="acts">${doorBtn(s.title,true)}</div>
    </div></li>`;
}
const wr=$('#writingRows'); if(wr) wr.innerHTML=D.writings.map(writingHTML).join('');
if(!D.writings.length){ const ws=$('#writings'); if(ws) ws.hidden=true; document.querySelectorAll('a[href="#writings"]').forEach(a=>{ const li=a.closest('li'); (li||a).hidden=true; }); }   // the longer writings wait for Tony's approval

/* ---------- keep reading: the rest of the excerpt opens in place ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('.keep'); if(!b) return;
  const card=b.closest('.rcard'), ex=$('.excerpt',card); if(!ex) return;
  const open=!ex.classList.contains('open');
  ex.classList.toggle('open',open); b.setAttribute('aria-expanded',String(open));
  b.firstChild.textContent=open?'Fold it back ':'Keep reading ';
  if(window.AP&&AP.ST) setTimeout(()=>AP.ST.refresh(),50);
  if(window.AP) AP.sound.tick(0.015);
});

/* ---------- hover: a row's loop wakes and the bed crossfades (no sound plays without a press) ---------- */
$$('.sess,.rcard,.srow').forEach(li=>{
  if(!hoverable) return;
  li.addEventListener('pointerenter',()=>{
    const v=$('video',li); if(v&&motion()){ if(!v.src&&v.dataset.src) v.src=v.dataset.src; v.play().then(()=>{ v.classList.add('on'); li.classList.add('live'); }).catch(()=>{}); }
    if(window.AP&&AP.sound.on&&li.dataset.bed) AP.sound.set(li.dataset.bed);
  });
  li.addEventListener('pointerleave',()=>{
    const v=$('video',li); if(v){ v.pause(); v.classList.remove('on'); } li.classList.remove('live');
    if(window.AP&&AP.sound.on&&html.dataset.scene) AP.sound.set(html.dataset.scene);
  });
});

/* ---------- the arrival: embers over the fire that answer the pointer ---------- */
(function arrival(){
  const c=$('#roomField'); if(!c||!window.PeaksField) return;
  const f=PeaksField(c,'embers',{maxDpr:1.25});
  let on=true, last=performance.now(), lastRip=0;
  const sec=c.closest('section');
  function tick(now){ const dt=Math.min(.05,(now-last)/1000); last=now; if(on){ f.frame(window.PeaksVoice?PeaksVoice.levels(null,dt):{low:.1,mid:.08,high:.05,level:.08},dt); } requestAnimationFrame(tick); }
  if(motion()) requestAnimationFrame(tick); else if(f.still) f.still();
  addEventListener('resize',()=>f.resize());
  sec.addEventListener('pointermove',e=>{ const n=performance.now(); if(n-lastRip<90) return; lastRip=n; const r=c.getBoundingClientRect(); try{ f.ripple(e.clientX-r.left,e.clientY-r.top,.5); }catch(x){} });
  sec.addEventListener('pointerdown',e=>{ const r=c.getBoundingClientRect(); try{ f.ripple(e.clientX-r.left,e.clientY-r.top,1.4); }catch(x){} if(window.PeaksVoice) PeaksVoice.cue('tick'); });
  if('IntersectionObserver' in window){ new IntersectionObserver(es=>es.forEach(e=>{ on=e.isIntersecting; }),{threshold:0}).observe(sec); }
})();

/* ---------- in-page doors glide (the shell's smooth scroller does not follow # links by itself) ---------- */
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]'); if(!a) return;
  const t=a.getAttribute('href'); if(t.length<2) return;
  const el=document.getElementById(t.slice(1)); if(!el) return;
  e.preventDefault(); history.replaceState(null,'',t);
  if(window.AP&&AP.scrollTo) AP.scrollTo(el,{offset:-8}); else el.scrollIntoView({behavior:'smooth'});
});

/* ---------- above the fold never waits on an observer ---------- */
setTimeout(()=>$$('.arrive .reveal, .arrive [data-words]').forEach(el=>el.classList.add('in')),700);

/* ---------- the hero sound button mirrors the bar's ---------- */
(function soundBtn(){
  const b=$('#soundBtn'); if(!b||!window.AP) return;
  const paint=()=>{ b.setAttribute('aria-pressed',String(AP.sound.on)); b.textContent=AP.sound.on?'Sound off':'Sound on'; };
  b.addEventListener('click',()=>{ AP.sound.toggle(); paint(); });
  addEventListener('ap:sound',paint); paint();
})();

window.PeaksReading={get pieces(){return D;}};
})();
