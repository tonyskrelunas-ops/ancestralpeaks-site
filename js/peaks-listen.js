// Ancestral Peaks — THE LISTENING ROOM, a store window (rebuilt 2026-11-07).
// Everyone sees every recording and can play its 30-second preview. Two sessions (free: true in media/sessions.js)
// open in full on this device after the free sign-up; every other recording shows its preview and the members' door.
// Built on the shared shell (window.AP) + PeaksField + PeaksVoice + PeaksCapture. Runs BEFORE AP.init (data-noinit),
// so the rows exist when the shell wires reveal, parallax and the bar.
// Storage (both wrapped in try/catch): localStorage['ap.free'] = {name, at}   localStorage['ap.listen'] = progress
(function(){
'use strict';
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const D=window.PEAKS_SESSIONS||{sessions:[],notes:[]};
const html=document.documentElement;
const MEDIA=(html.dataset.root||'..')+'/media/';   // '..' in the room, '../..' on the coaching pages under it
const JOIN=(window.AP&&AP.JOIN)||{monthly:'#members',yearly:'#members'};
const hoverable=matchMedia('(hover:hover) and (pointer:fine)').matches;
const motion=()=>window.AP?AP.motion:true;
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt=s=>{s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const local={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
// Tony's owner pass: open ancestralpeaks.com/listen/?owner once on a device and the free sessions open without the sign-up
if(/[?&]owner\b/.test(location.search)&&!local.get('ap.free',null))local.set('ap.free',{name:'Tony',at:Date.now(),owner:true});
const GUIDES=D.guides||[];
// the member pass (the same one shared/site.js sets): ?member opens the free pieces on the first load, not the second
if(/[?&]member\b/.test(location.search)&&!local.get('ap.free',null))local.set('ap.free',{name:'Member',at:Date.now(),pass:true});
const byId=id=>D.sessions.find(s=>s.id===id)||D.notes.find(n=>n.id===id)||GUIDES.find(g=>g.id===id);
// 11/26 THE MEMBERS' LIBRARY (js/peaks-members.js): on a device where a member has signed in, every recording here plays
// in full, from members.ancestralpeaks.com, with a signed link. The free ones keep playing from this site.
const MEM=window.PeaksMembers||null;
const member=()=>!!(MEM&&MEM.on);
const memItem=it=>!!(it&&member()&&!(it.free&&it.full)&&MEM.has(it.id));
const shortOne=it=>D.notes.indexOf(it)>-1||GUIDES.indexOf(it)>-1;
const FREE=D.sessions.filter(s=>s.free);
const ROOM=D.sessions.filter(s=>s.shelf==='sessions');
const SITS=D.sessions.filter(s=>s.shelf==='sittings');
const preview=id=>MEDIA+'previews/'+id+'-30s.mp3';
// 11/26 (Tony: "yes"): the free quarter also opens three voice notes in full after the sign-up
// 11/26: the short guides on the coaching pages open the same way
const fullNote=it=>!!(it&&shortOne(it)&&((it.free&&it.full&&unlocked)||memItem(it)));
const LOCK='<svg class="lk" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z"/></svg>';
const PLAY='<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';

let unlocked=local.get('ap.free',null)||(member()?{name:MEM.first,member:true,at:Date.now()}:null);
let prog=local.get('ap.listen',{});

/* ---------- pieces ---------- */
const pvBtn=(id,title,small)=>{ const it=byId(id), whole=typeof unlocked!=='undefined'&&fullNote(it); return `<button class="pv${small?' sm':''}" type="button" data-pv="${id}" aria-pressed="false" aria-label="${whole?'Play '+esc(title)+' in full':'Play a 30-second preview of '+esc(title)}"><span class="ic">${PLAY}</span>${small?'':'<span class="lb">Hear 30 seconds</span>'}<span class="tm">${whole?fmt(it.dur):'0:30'}</span><i class="fill"></i></button>`; };
const doorBtn=(title,small,dark,id)=>{ const it=id&&byId(id);
  if(it&&member()){   // a member: no door. A short one plays in full on its own button; a session opens the full player.
    if(shortOne(it)) return small?'<span class="opened">Yours in full</span>':'';
    return `<a class="${small?'door-link':'btn earth'}" href="#" data-full="${id}" aria-label="Listen to ${esc(title)} in full">Listen in full <span class="arrow">→</span></a>`;
  }
  return `<a class="${small?'door-link':'btn ghost'+(dark?'':' dark')+' door'}" href="${JOIN.monthly}" data-offer="member-monthly" aria-label="Members listen to ${esc(title)} in full">${LOCK}Members listen in full <span class="arrow">→</span></a>`; };

/* ---------- the two free sessions ---------- */
function freeCard(s,i){
  return `<article class="fcard${s.open?' gift':''}" data-id="${s.id}" data-bed="${s.bed}">
    <div class="pic"><img src="${MEDIA}img/${s.img}.jpg" alt="" loading="lazy"><span class="dur">${s.open?'A gift · no sign-up':'Free'} · ${esc(s.mins)}</span></div>
    <div class="body">
      <div class="num">${String(i+1).padStart(2,'0')}</div>
      <p class="kick">${esc(s.n)} · ${esc(s.where)}</p>
      <h3>${esc(s.title)}</h3>
      <p class="blurb">${esc(s.blurb)}</p>
      <p class="line">${esc(s.line)}</p>
      <div class="acts">${pvBtn(s.id,s.title)}<button class="btn earth full" type="button" data-full="${s.id}">${'Listen in full'} <span class="arrow">→</span></button><span class="state"></span></div>
    </div>
  </article>`;
}
const pair=$('#freePair'); if(pair) pair.innerHTML=FREE.map(freeCard).join('');

/* ---------- the rest of the room: editorial rows ---------- */
function rowHTML(s,i){
  return `<li class="sess locked" data-id="${s.id}" data-bed="${s.bed}">
    <div class="pic" data-parallax="0.08"><img src="${MEDIA}img/${s.img}.jpg" alt="" loading="lazy">${s.video?`<video muted loop playsinline preload="none" data-src="${MEDIA}video/${s.video}.mp4"></video>`:''}<span class="dur">${member()?'':LOCK}${esc(s.mins)}</span></div>
    <div class="body">
      <div class="num reveal">${String(i+FREE.length+1).padStart(2,'0')}</div>
      <p class="kick reveal">${esc(s.n)} · ${esc(s.where)}</p>
      <h3 class="reveal">${esc(s.title)}</h3>
      <p class="blurb reveal">${esc(s.blurb)}</p>
      <p class="line reveal">${esc(s.line)}</p>
      <div class="meta reveal"><span class="mem">${member()?esc(s.mins)+', yours in full':LOCK+esc(s.mins)+' in full for members'}</span></div>
      <div class="acts reveal">${pvBtn(s.id,s.title)}${doorBtn(s.title,false,false,s.id)}</div>
    </div></li>`;
}
const list=$('#list'); if(list) list.innerHTML=ROOM.map(rowHTML).join('');

/* ---------- short practices and long sittings ---------- */
function sitHTML(s,i){
  return `<li class="srow" data-id="${s.id}" data-bed="${s.bed}">
    <div class="th"><img src="${MEDIA}img/${s.img}.jpg" alt="" loading="lazy"><span class="dur">${member()?'':LOCK}${esc(s.mins)}</span></div>
    <div class="tx">
      <p class="kick"><span class="n">${String(i+FREE.length+ROOM.length+1).padStart(2,'0')}</span>${esc(s.mins)} · ${esc(s.where)}</p>
      <h3>${esc(s.title)}</h3>
      <p class="blurb">${esc(s.blurb)}</p>
      <div class="acts">${pvBtn(s.id,s.title)}${doorBtn(s.title,true,false,s.id)}</div>
    </div></li>`;
}
const sit=$('#sitRows'); if(sit) sit.innerHTML=SITS.map(sitHTML).join('');

/* ---------- voice notes ---------- */
function renderNotes(){
  const host=$('#noteList'), sec=$('#notes'); if(!host) return;
  if(!D.notes||!D.notes.length){ if(sec) sec.hidden=true; return; }
  host.innerHTML=D.notes.map((n,i)=>`<li class="nrow" data-id="${n.id}" data-bed="${n.bed}">
    <span class="th"><img src="${MEDIA}img/${n.img}.jpg" alt="" loading="lazy"></span>
    <span class="nn">${String(i+1).padStart(2,'0')}</span>
    <span class="tt"><b>${esc(n.title)}</b><small>${esc(n.sub)} · ${member()?'Yours in full · '+fmt(n.dur):n.free?(unlocked?'Open on this device · '+fmt(n.dur):LOCK+fmt(n.dur)+' free with a sign-up'):LOCK+fmt(n.dur)+' for members'}</small></span>
    ${pvBtn(n.id,n.title,true)}
    ${n.free||member()?'':doorBtn(n.title,true,true,n.id)}
  </li>`).join('');
  const c=$('#noteCount'); if(c) c.textContent=['','One short one','Two short ones','Three short ones','Four short ones','Five short ones','Six short ones','Seven short ones','Eight short ones','Nine short ones','Ten short ones'][D.notes.length]||(D.notes.length+' short ones');
}
renderNotes();

/* ---------- the coaching pages (move, drive, rest): the room's own rows, in the order that fits the moment ----------
   <div id="coachRows" data-coach="move"> on /listen/move/ and its two neighbours. Nothing here runs in the room itself. */
function coachRow(it){
  const note=D.notes.indexOf(it)>-1, guide=GUIDES.indexOf(it)>-1, len=note?fmt(it.dur):it.mins;
  const kind=guide?it.kind:note?'Voice note':'From the room';
  const act=member()?doorBtn(it.title,true,false,it.id)
    :!it.free?doorBtn(it.title,true)
    :!unlocked?`<a class="door-link" href="#joinBox">${LOCK}Free in full with a sign-up</a>`
    :(note||guide)?'<span class="opened">Open on this device</span>'
    :`<button class="btn earth full" type="button" data-full="${it.id}">Listen in full</button>`;
  return `<li class="srow" data-id="${it.id}" data-bed="${it.bed}">
    <div class="th"><img src="${MEDIA}img/${it.img}.jpg" alt="" loading="lazy"><span class="dur">${(it.free&&unlocked)||member()?'':LOCK}${esc(len)}</span></div>
    <div class="tx">
      <p class="kick">${esc(kind)}, ${esc(len)}</p>
      <h3>${esc(it.title)}</h3>
      <p class="blurb">${esc(it.blurb||it.sub)}</p>
      <div class="acts">${pvBtn(it.id,it.title)}${act}</div>
    </div></li>`;
}
function renderCoach(){
  const host=$('#coachRows'); if(!host) return;
  const groups=(D.coach||{})[host.dataset.coach]||[];
  host.innerHTML=groups.map(g=>`<h3 class="when">${esc(g.h)}</h3><ul class="rows">${g.ids.map(byId).filter(Boolean).map(coachRow).join('')}</ul>`).join('');
}

/* ---------- 30-second previews: one at a time, anywhere on the page ---------- */
const pv=new Audio(); pv.preload='none';
let pvId=null, pvRaf=0;
const pvApi={ el:null, audio:pv, pause(){ stopPreview(); } };
function paintPv(){
  $$('.pv').forEach(b=>{
    const on=b.dataset.pv===pvId && !pv.paused;
    b.classList.toggle('playing',on); b.setAttribute('aria-pressed',String(on));
    const lb=$('.lb',b); if(lb) lb.textContent=on?'Playing':(b.dataset.pv===pvId&&pv.currentTime>0.5&&!pv.ended?'Paused':(fullNote(byId(b.dataset.pv))?'Listen':'Hear 30 seconds'));
  });
}
function tickPv(){
  const d=pv.duration||30, t=pv.currentTime||0;
  $$(`.pv[data-pv="${pvId}"]`).forEach(b=>{ $('.fill',b).style.width=(100*t/d)+'%'; $('.tm',b).textContent=fmt(Math.max(0,d-t)); });
  if(!pv.paused) pvRaf=requestAnimationFrame(tickPv);
}
function resetPv(id){ const it=byId(id); $$(`.pv[data-pv="${id}"]`).forEach(b=>{ $('.fill',b).style.width='0%'; $('.tm',b).textContent=fullNote(it)?fmt(it.dur):'0:30'; }); }
function playPreview(id){
  const item=byId(id); if(!item) return;
  if(pvId===id && pv.src){ if(pv.paused){ pv.play().catch(()=>{}); } else { pv.pause(); } return; }
  if(pvId) resetPv(pvId);
  if(window.AP&&AP.current&&AP.current!==pvApi) try{ AP.current.pause(); }catch(e){}
  if(P.audio&&!P.audio.paused) P.audio.pause();
  pvId=id;
  if(memItem(item)&&fullNote(item)){
    const u=MEM.src(id);
    if(!u){ paintPv(); MEM.get(id).then(u2=>{ if(pvId===id&&u2){ pv.src=u2; pv.play().catch(()=>{}); } }); return; }   // the links were still on their way
    pv.src=u;
  } else pv.src=fullNote(item)?MEDIA+item.full:preview(id);
  pv.currentTime=0;
  pv.play().then(()=>{ if(window.AP){ AP.current=pvApi; AP.sound.duck(true); if(AP.sound.on&&item.bed) AP.sound.set(item.bed); } }).catch(()=>{});
  paintPv();
}
function stopPreview(){ if(!pvId) return; pv.pause(); }
pv.addEventListener('error',()=>{ const it=pvId&&byId(pvId); if(memItem(it)) MEM.renew(pv,pvId); });
pv.addEventListener('play',()=>{ paintPv(); cancelAnimationFrame(pvRaf); pvRaf=requestAnimationFrame(tickPv); });
pv.addEventListener('pause',()=>{ paintPv(); if(window.AP&&AP.current===pvApi&&!pv.ended) AP.sound.duck(false); });
pv.addEventListener('ended',()=>{
  const id=pvId; paintPv(); resetPv(id);
  if(window.AP){ AP.sound.duck(false); }
  // the door glows once the half minute is over
  const item=byId(id); if(item&&!item.free){ $$(`[data-id="${id}"] .door, [data-id="${id}"] .door-link`).forEach(a=>{ a.classList.remove('lit'); void a.offsetWidth; a.classList.add('lit'); }); }
  pvId=null;
});
document.addEventListener('click',e=>{
  const b=e.target.closest('.pv'); if(b){ e.preventDefault(); playPreview(b.dataset.pv); return; }
  const f=e.target.closest('[data-full]'); if(f){ e.preventDefault(); if(unlocked||(byId(f.dataset.full)||{}).open||memItem(byId(f.dataset.full))) open(f.dataset.full); else { const j=$('#joinBox'); if(j){ (window.AP&&AP.scrollTo?AP.scrollTo(j,{offset:-90}):j.scrollIntoView({behavior:'smooth'})); setTimeout(()=>{ const n=$('#suName'); if(n) n.focus({preventScroll:true}); },700); } } }
});
addEventListener('ap:play',e=>{ if(e.detail!==pvApi) stopPreview(); });

/* ---------- hover: the row's loop wakes and the bed crossfades (no sound plays without a press) ---------- */
$$('.sess,.fcard,.srow').forEach(li=>{
  if(!hoverable) return;
  li.addEventListener('pointerenter',()=>{
    const v=$('video',li); if(v&&motion()){ if(!v.src&&v.dataset.src) v.src=v.dataset.src; v.play().then(()=>{ v.classList.add('on'); li.classList.add('live'); }).catch(()=>{}); }
    if(window.AP&&AP.sound.on&&li.dataset.bed&&!(pvId&&!pv.paused)) AP.sound.set(li.dataset.bed);
  });
  li.addEventListener('pointerleave',()=>{
    const v=$('video',li); if(v){ v.pause(); v.classList.remove('on'); } li.classList.remove('live');
    if(window.AP&&AP.sound.on&&html.dataset.scene&&!(pvId&&!pv.paused)) AP.sound.set(html.dataset.scene);
  });
});

/* ---------- the free sign-up ---------- */
function paintUnlock(){
  const on=!!unlocked;
  document.body.classList.toggle('unlocked',on);
  $$('.fcard').forEach(c=>{
    const s=byId(c.dataset.id), p=prog[s.id];
    const st=$('.state',c), btn=$('.full',c);
    const can=on||s.open;
    btn.firstChild.textContent=can&&p&&p.t>20&&!p.done?'Continue ':'Listen in full ';
    st.innerHTML=can?(p&&p.done?'<b>Heard</b> · sit with it again any time':p&&p.t>20?'You stopped at <b>'+fmt(p.t)+'</b>':s.open?'Open to everyone. No name, no email.':'Open on this device'):LOCK+'Opens in full when you leave your name and email';
  });
  const form=$('#signup'), wel=$('#welcome');
  if(form) form.hidden=on; if(wel) wel.hidden=!on;
  if(on&&unlocked.member){   // a member
    const h=$('#welcomeH'); if(h) h.textContent=(unlocked.name?'Welcome back, '+unlocked.name+'. ':'Welcome back. ')+'Everything here is yours in full.';
    const wp=$('#welcome p'); if(wp) wp.textContent='Every session, voice note, guide and workout plays in full on this device, right on the page. The room remembers where you stopped.';
  } else if(on){ const h=$('#welcomeH'); if(h&&!h.dataset.keep) h.textContent=(unlocked.name?'Welcome, '+unlocked.name+'. ':'')+'They are open: three sessions and three voice notes.'; }
  renderNotes(); renderCoach(); paintPv();
}
(function signup(){
  const form=$('#signup'); if(!form) return;
  const name=$('#suName'), email=$('#suEmail'), btn=$('#suBtn'), status=$('#suStatus');
  const say=(t,bad)=>{ status.textContent=t; status.classList.toggle('bad',!!bad); };
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const n=name.value.trim().replace(/\s+/g,' '), m=email.value.trim();
    if(!n){ say('Your first name, please, so the team knows who came in.',true); name.focus(); return; }
    if(!window.PeaksCapture||!PeaksCapture.validEmail(m)){ say('That email does not look complete yet. Check it once more.',true); email.focus(); return; }
    btn.disabled=true; btn.classList.add('busy'); say('Opening them…');
    const ok=await PeaksCapture.send({ name:n, email:m, source:form.dataset.source||'peaks-listening-room', subject:'Ancestral Peaks — the free quarter (Listening Room)', botcheck:form.botcheck&&form.botcheck.checked });
    btn.disabled=false; btn.classList.remove('busy');
    if(!ok){ say('That did not go through. Please try once more in a moment.',true); return; }
    unlocked={name:n.split(' ')[0].slice(0,40),at:Date.now()}; local.set('ap.free',unlocked);
    say(''); paintUnlock();
    const first=$('.fcard .full'); if(first) first.focus({preventScroll:true});
    dispatchEvent(new CustomEvent('ap:free-open',{detail:{source:'peaks-listening-room'}}));
  });
})();
paintUnlock();

/* ---------- THE PLAYER: the two free sessions in full, a full-screen scene ---------- */
const P={
  el:$('#player'), img:$('#pImg'), video:$('#pVideo'), canvas:$('#pField'), audio:$('#voice'),
  kick:$('#pKick'), title:$('#pTitle'), line:$('#pLine'), cur:$('#pCur'), dur:$('#pDur'), scrub:$('#pScrub'),
  pp:$('#pPlay'), back:$('#pBack'), fwd:$('#pFwd'), close:$('#pClose'), fin:$('#pFin'), finH:$('#pFinH'), finP:$('#pFinP'), next:$('#pNext'), join:$('#pJoin')
};
let cur=null, field=null, raf=0, lastT=0, saveAt=0, scrubbing=false;
addEventListener('resize',()=>{ clearTimeout(P._t); P._t=setTimeout(()=>{ if(field) field.resize(); },120); });
function loop(now){
  const dt=Math.min(.05,(now-lastT)/1000||1/60); lastT=now;
  const L=PeaksVoice.levels(P.audio,dt);
  if(field) field.frame(L,dt);
  if(!scrubbing&&cur){ const t=P.audio.currentTime||0, d=P.audio.duration||cur.dur; P.cur.textContent=fmt(t); P.scrub.value=Math.round(1000*t/d); P.scrub.style.setProperty('--p',(100*t/d)+'%'); }
  raf=requestAnimationFrame(loop);
}
function setScene(s){
  P.img.src=MEDIA+'img/'+s.img+'.jpg';
  P.video.classList.remove('on'); P.video.pause(); P.video.removeAttribute('src'); P.video.load();
  if(s.video&&motion()){ P.video.poster=MEDIA+'video/'+s.video+'-poster.jpg'; P.video.src=MEDIA+'video/'+s.video+'.mp4'; P.video.play().then(()=>P.video.classList.add('on')).catch(()=>{}); }
  if(field) field.destroy();
  field=PeaksField(P.canvas,s.field,{maxDpr:innerWidth<900?1.25:1.5});
  P.el.dataset.field=s.field;
}
function open(id){
  const s=byId(id), mem=memItem(s);
  if(!s||!(mem||(s.free&&s.full&&(unlocked||s.open)))) return;   // the free sessions after the sign-up; the gift (open: true) for everyone; all of them for a member
  stopPreview();
  if(window.AP&&AP.current&&AP.current!==pvApi) try{ AP.current.pause(); }catch(e){}
  cur=s;
  P.kick.textContent=s.n+' · '+s.where+' · '+s.mins;
  P.title.textContent=s.title; P.line.textContent=s.line; P.dur.textContent=fmt(s.dur);
  P.el.classList.remove('finished');
  html.classList.add('player-open'); P.el.style.opacity=0;
  if(window.AP&&AP.lenis) AP.lenis.stop();
  setScene(s);
  if(s.env) PeaksVoice.loadEnv(MEDIA+s.env, s.id);
  P.audio.crossOrigin='anonymous';   // the members' files come from members.ancestralpeaks.com; the picture still hears the voice
  if(mem){ const u=MEM.src(s.id); if(u) P.audio.src=u; else MEM.get(s.id).then(u2=>{ if(cur===s&&u2){ P.audio.src=u2; P.audio.load(); } }); }
  else P.audio.src=MEDIA+s.full;
  PeaksVoice.attach(P.audio);
  const p=prog[s.id]; const start=(p&&!p.done&&p.t>5&&p.t<s.dur-15)?p.t:0;
  const begin=()=>{ try{ P.audio.currentTime=start; }catch(e){} P.audio.play().then(()=>{ P.el.classList.add('playing'); if(window.AP) AP.sound.duck(true); }).catch(()=>{ P.el.classList.remove('playing'); }); };
  if(P.audio.readyState>=1) begin(); else P.audio.addEventListener('loadedmetadata',begin,{once:true});
  P.audio.load();
  if(window.gsap&&motion()){
    gsap.to(P.el,{opacity:1,duration:.7,ease:'power2.out'});
    gsap.fromTo('#player .pcopy',{y:26,opacity:0},{y:0,opacity:1,duration:.9,delay:.25,ease:'power3.out'});
    gsap.fromTo('#player .ptop',{opacity:0},{opacity:1,duration:.6,delay:.4});
  } else { P.el.style.opacity=1; }
  PeaksVoice.cue('open');
  if('mediaSession' in navigator){ try{ navigator.mediaSession.metadata=new MediaMetadata({title:s.title,artist:'Ancestral Peaks',album:'The Listening Room',artwork:[{src:MEDIA+'img/'+s.img+'.jpg',sizes:'1400x1400',type:'image/jpeg'}]}); navigator.mediaSession.setActionHandler('play',()=>toggle()); navigator.mediaSession.setActionHandler('pause',()=>toggle()); navigator.mediaSession.setActionHandler('seekbackward',()=>skip(-15)); navigator.mediaSession.setActionHandler('seekforward',()=>skip(15)); }catch(e){} }
  lastT=performance.now(); cancelAnimationFrame(raf); if(motion()) raf=requestAnimationFrame(loop); else if(field) field.still();
  P.close.focus({preventScroll:true});
}
function save(done){
  if(!cur) return;
  const t=done?0:(P.audio.currentTime||0), d=P.audio.duration||cur.dur, was=prog[cur.id]||{};
  prog[cur.id]={t,dur:d,done:!!(done||was.done),at:Date.now()};
  local.set('ap.listen',prog);
}
function toggle(){ if(!cur) return; if(P.audio.paused){ PeaksVoice.attach(P.audio); P.audio.play().then(()=>{P.el.classList.add('playing'); if(window.AP) AP.sound.duck(true);}).catch(()=>{}); } else { P.audio.pause(); } PeaksVoice.cue('tick'); }
function skip(n){ if(!cur) return; try{ P.audio.currentTime=Math.max(0,Math.min((P.audio.duration||cur.dur)-1,P.audio.currentTime+n)); }catch(e){} PeaksVoice.cue('tick'); }
function close(){
  if(!cur) return;
  save(false);
  P.audio.pause(); P.video.pause(); P.video.classList.remove('on');
  cancelAnimationFrame(raf); if(field){ field.destroy(); field=null; }
  html.classList.remove('player-open'); P.el.classList.remove('playing','finished');
  if(window.AP){ AP.sound.duck(false); if(AP.lenis) AP.lenis.start(); }
  PeaksVoice.cue('close');
  const card=$(`.fcard[data-id="${cur.id}"] .full`); cur=null; paintUnlock();
  if(card) card.focus({preventScroll:true});
}
P.audio.addEventListener('pause',()=>{ P.el.classList.remove('playing'); if(window.AP&&!P.audio.ended) AP.sound.duck(false); save(false); });
P.audio.addEventListener('play',()=>{ P.el.classList.add('playing'); });
P.audio.addEventListener('error',()=>{ if(cur&&memItem(cur)) MEM.renew(P.audio,cur.id); });
P.audio.addEventListener('timeupdate',()=>{ const n=Date.now(); if(n-saveAt>2000){ saveAt=n; save(false); } });
P.audio.addEventListener('ended',()=>{
  save(true); P.el.classList.remove('playing'); P.el.classList.add('finished');
  if(window.AP) AP.sound.duck(false);
  PeaksVoice.cue('done');
  const other=FREE.find(s=>s!==cur&&!s.open&&!(prog[s.id]&&prog[s.id].done))||FREE.find(s=>s!==cur&&!s.open)||FREE.find(s=>s!==cur)||cur;
  P.finH.textContent='That was '+cur.title+'.';
  if(member()){   // a member: the next one in the room
    const all=D.sessions, i=all.indexOf(cur), after=all.slice(i+1).concat(all.slice(0,i));
    const nx=after.find(x=>!(prog[x.id]&&prog[x.id].done))||after[0]||cur;
    P.finP.textContent='Notice how you feel. Next in the room: '+nx.title+', '+nx.mins+'.';
    P.next.firstChild.textContent='Play the next one ';
    P.next.onclick=()=>{ P.el.classList.remove('finished'); open(nx.id); };
    if(P.join) P.join.hidden=true;
  } else if(!unlocked){   // the gift was heard without a sign-up: only now, the invitation
    P.finP.textContent='Notice how you feel. If it served you, three more sessions and three voice notes open free when you leave your first name and email.';
    P.next.firstChild.textContent='Open the free sessions ';
    P.next.onclick=()=>{ close(); const j=$('#joinBox'); if(j){ (window.AP&&AP.scrollTo?AP.scrollTo(j,{offset:-90}):j.scrollIntoView({behavior:'smooth'})); setTimeout(()=>{ const n=$('#suName'); if(n) n.focus({preventScroll:true}); },700); } };
  } else {
    P.finP.textContent='Notice how you feel. Another free session is '+other.title+', '+other.mins+'. The rest of the room is open to members.';
    P.next.firstChild.textContent='Another free session ';
    P.next.onclick=()=>{ P.el.classList.remove('finished'); open(other.id); };
  }
  P.join.onclick=()=>{ close(); };
});
P.pp.addEventListener('click',toggle);
P.back.addEventListener('click',()=>skip(-15));
P.fwd.addEventListener('click',()=>skip(15));
P.close.addEventListener('click',close);
P.scrub.addEventListener('input',()=>{ scrubbing=true; const d=P.audio.duration||(cur&&cur.dur)||1; const t=d*P.scrub.value/1000; P.cur.textContent=fmt(t); P.scrub.style.setProperty('--p',(100*t/d)+'%'); });
P.scrub.addEventListener('change',()=>{ const d=P.audio.duration||(cur&&cur.dur)||1; try{ P.audio.currentTime=d*P.scrub.value/1000; }catch(e){} scrubbing=false; });
addEventListener('keydown',e=>{
  if(!html.classList.contains('player-open')) return;
  if(e.key==='Escape') close();
  else if(e.key===' '&&!/input|button/i.test(e.target.tagName)){ e.preventDefault(); toggle(); }
  else if(e.key==='ArrowLeft') skip(-15);
  else if(e.key==='ArrowRight') skip(15);
});
addEventListener('ap:play',()=>{ if(cur&&!P.audio.paused) P.audio.pause(); });
addEventListener('pagehide',()=>{ save(false); });

/* ---------- the arrival: water that answers the pointer ---------- */
(function arrival(){
  const c=$('#roomField'); if(!c||!window.PeaksField) return;
  const f=PeaksField(c,'water',{maxDpr:1.25});
  let on=true, last=performance.now(), lastRip=0;
  const sec=c.closest('section');
  function tick(now){ const dt=Math.min(.05,(now-last)/1000); last=now; if(on&&!html.classList.contains('player-open')){ f.frame(PeaksVoice.levels(null,dt),dt); } requestAnimationFrame(tick); }
  if(motion()) requestAnimationFrame(tick); else f.still();
  addEventListener('resize',()=>f.resize());
  sec.addEventListener('pointermove',e=>{ const n=performance.now(); if(n-lastRip<70) return; lastRip=n; const r=c.getBoundingClientRect(); f.ripple(e.clientX-r.left,e.clientY-r.top,.6); });
  sec.addEventListener('pointerdown',e=>{ const r=c.getBoundingClientRect(); f.ripple(e.clientX-r.left,e.clientY-r.top,1.6); PeaksVoice.cue('tick'); });
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

window.PeaksListen={open,close,toggle,playPreview,stopPreview,get unlocked(){return !!unlocked;},get current(){return cur;},get previewing(){return pvId;}};
})();
