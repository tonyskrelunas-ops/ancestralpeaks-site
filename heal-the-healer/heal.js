// Ancestral Peaks — HEAL THE HEALER (/heal-the-healer/), 2026-11-26. This page's own script.
// For the people who carry others: six guides for one day, each in two voices.
// Access follows the Listening Room: everyone can play 30 seconds of every guide; the dawn guide, Peak State (free: true) plays
// in full on this device after the free sign-up (localStorage['ap.free'], the same key and three-month clock as
// shared/site.js); the rest is for members, inside the membership. Today's line (the daily lines) is open to everyone.
// Kept on this device only, never sent: ap.hth.voice, ap.hth.stop, ap.hth.five.
// Runs before AP.init (data-noinit), so the rows exist when the shell wires reveal and the bar. No per-frame work.
(function(){
'use strict';
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt=s=>{s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const local={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}},del(k){try{localStorage.removeItem(k);}catch(e){}}};
// the member pass, as in js/peaks-listen.js: ?member opens the free piece on the first load
if(/[?&]member\b/.test(location.search)&&!local.get('ap.free',null))local.set('ap.free',{name:'Member',at:Date.now(),pass:true});
let unlocked=local.get('ap.free',null);
let voice=local.get('ap.hth.voice','m')==='f'?'f':'m';
const LOCK='<svg class="lk" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z"/></svg>';
const PLAY='<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
const SB='Stone Breath, by Tony Skrelūnas', TS='From the teaching of Tony Skrelūnas';

/* ---------- the six guides ---------- */
/*LEN*/const LEN={"peak-state":{"f":484,"m":494},"refocus":{"f":239,"m":243},"mile-95":{"f":245,"m":250},"the-crossing":{"f":1988,"m":2046},"summit":{"f":288,"m":296},"basecamp":{"f":562,"m":562}};/*LEN*/
const PIECES=[
  { id:'peak-state', name:'Peak State', when:'Dawn', free:true, img:'dark-trail', loop:'blue-hour-trail',
    alt:'Three runners on a mountain trail at blue hour, seen from behind, their headlamps lighting the ground ahead.',
    hook:'A grandmother\'s instruction in Stone Breath, for the hour before the sun. You are not starting the day. You are entering state.',
    inside:'Standing, facing east, before the phone. The stone breath, five counted rounds. Thanks before anything is asked. Three hard things you have already carried. One intention, said out loud.',
    safe:'Stand still for this one. It is not for the road.',
    say:'The dawn is walking the land. Don\'t let it find you asleep.', src:SB },
  { id:'refocus', name:'Refocus', when:'Midday', img:'fog-trail',
    alt:'A runner climbs a steep trail through fog and pines.',
    hook:'Nothing is wrong. Attention leaks in the long middle of a day, so you gather it back. A few minutes, and the afternoon is better for it.',
    inside:'Three breaths with the stone. Five words that loosen the face and shoulders. Then one question: does this feed my mountain, or my foothills?',
    safe:'Safe to hear while driving. Eyes open, the stone stays in the pocket.',
    say:'It doesn\'t make you calm. It makes you ready.', src:SB },
  { id:'mile-95', name:'Mile 95', when:'Late afternoon', img:'runner-headlamps',
    alt:'A runner with a headlamp on a ridge in the Swiss Alps before dawn, a line of headlamps on the trail far behind her.',
    hook:'Tired is not broken. Mile 95 is the stretch near the end, in the dark, where you cannot go alone, and where the others fall in beside you.',
    inside:'The Mountain Within, the daily touch of the stone. One exhibit from the museum of proof. Then you choose how you will walk through your own door tonight.',
    safe:'If you are driving, eyes stay open. The closing of the eyes is for when you are parked.',
    say:'Rest is not the reward for the work. It is the root of it.', src:SB },
  { id:'summit', name:'Summit', when:'Before the room', img:'', loop:'summit-sunrise',
    alt:'A man sits in stillness on a summit above the clouds at sunrise.',
    hook:'"The summit wasn\'t the point. The summit was just where the photos were taken." Before a talk, a hard meeting, a hearing or a shift, what matters is that you walk in whole, and present.',
    inside:'Five rounds of the stone breath. One room you have already carried. Your first sentence, chosen. Then the words at the door.',
    safe:'Stand still for this one, in a hallway or a parked car.',
    say:'This meeting will never come again.', src:SB },
  { id:'the-crossing', name:'The Crossing', when:'Your workout', img:'snow-steps',
    alt:'A climber kicks steps up a steep snow slope, in blowing snow.',
    hook:'A coached half hour for a run, a walk or the weights, over a running drum. All day you held the room. Here you only move, breathe and listen.',
    inside:'A walking warm-up with the stone breath. Breath locked to the feet. The museum of proof, room by room. The far messenger\'s crossing. Four hard minutes. A cool-down that is only for you.',
    safe:'The breath is held only in the walking warm-up, never during effort. On a road, keep your eyes up and your ears open.',
    say:'They did not send the fastest runner. They sent the one who could arrive whole.', src:TS },
  { id:'basecamp', name:'Basecamp', when:'Night', img:'night-headlamps',
    alt:'A line of headlamps comes down a dark mountain trail under a field of stars.',
    hook:'Where you are fed, and you set down what is not yours to carry. You held a great deal today. Tonight you are the field left fallow.',
    inside:'Three questions that clear the day. Setting down what is not yours. The faces of the ones who carried you. Long silences, and then sleep.',
    safe:'For bed. Never while driving.',
    say:'He had been enough all along. He had just forgotten.', src:SB }
];
const byId=id=>PIECES.find(p=>p.id===id);
const len=p=>(LEN[p.id]||{})[voice]||0;
const mins=p=>{ const d=len(p); return d?Math.max(1,Math.round(d/60))+' min':''; };
// 11/26 THE MEMBERS' LIBRARY (js/peaks-members.js): a signed-in member hears all six in full, in either voice; the five
// members' guides come from members.ancestralpeaks.com with a signed link (library ids hth-<guide>-<m|f>)
const MEM=window.PeaksMembers||null;
const member=()=>!!(MEM&&MEM.on);
const libId=p=>'hth-'+p.id+'-'+voice;
const fromLib=p=>!!(p&&!p.free&&member()&&MEM.has(libId(p)));
const whole=p=>!!(p&&((p.free&&(unlocked||member()))||fromLib(p)));
const fileOf=p=>fromLib(p)?(MEM.src(libId(p))||''):'audio/'+p.id+'-'+voice+(whole(p)?'.mp3':'-30s.mp3');

/* ---------- which guide fits this hour ---------- */
function pieceForHour(d){
  const h=d.getHours()+d.getMinutes()/60;
  if(h>=4&&h<10.5) return 'peak-state';
  if(h>=10.5&&h<14.5) return 'refocus';
  if(h>=14.5&&h<17.5) return 'mile-95';
  if(h>=17.5&&h<20.5) return 'the-crossing';
  return 'basecamp';
}
const hourId=pieceForHour(new Date());
let nowId=hourId;

/* ---------- pieces of markup ---------- */
function pic(p,sizes,eager){
  if(p.loop) return `<video class="hh-loop" muted loop playsinline preload="none" poster="loops/${p.loop}-poster.jpg" data-src="loops/${p.loop}.mp4" aria-label="${esc(p.alt)}"></video>`;
  return `<picture><source type="image/webp" srcset="img/${p.img}-900.webp 900w, img/${p.img}-1600.webp 1600w" sizes="${sizes}"><img src="img/${p.img}-900.jpg" srcset="img/${p.img}-900.jpg 900w, img/${p.img}-1600.jpg 1600w" sizes="${sizes}" alt="${esc(p.alt)}"${eager?'':' loading="lazy"'}></picture>`;
}
function playBtn(p){
  const w=whole(p);
  return `<button class="pv" type="button" data-pv="${p.id}" aria-pressed="false" aria-label="${w?'Play '+esc(p.name)+' in full':'Play a 30-second preview of '+esc(p.name)}"><span class="ic">${PLAY}</span><span class="lb">${w?'Listen in full':'Hear 30 seconds'}</span><span class="tm">${w?fmt(len(p)):'0:30'}</span><i class="fill"></i></button>`;
}
function doorOf(p){
  if(member()) return '<span class="opened">Yours in full</span>';
  if(!p.free) return `<a class="door-link" href="#members">${LOCK}Members listen in full</a>`;
  if(!unlocked) return `<a class="door-link" href="#joinBox">${LOCK}Free in full with a sign-up</a>`;
  return '<span class="opened">Open on this device</span>';
}
const scrub=p=>whole(p)?`<input class="hh-scrub" type="range" min="0" max="1000" value="0" data-scrub="${p.id}" aria-label="Position in ${esc(p.name)}" hidden>`:'';
const voiceSwitch=()=>`<div class="hh-voice"><span>Voice</span><span class="sw"><button type="button" data-voice="m" aria-pressed="${voice==='m'}">Masculine</button><button type="button" data-voice="f" aria-pressed="${voice==='f'}">Feminine</button></span></div>`;

function renderNow(){
  const p=byId(nowId), host=$('#nowCard'); if(!host||!p) return;
  host.innerHTML=`<div class="pic">${pic(p,'(max-width:900px) 100vw, 50vw',true)}</div>
    <div class="tx">
      <p class="when">${esc(p.when)}${mins(p)?', '+mins(p):''}</p>
      <h3>${esc(p.name)}</h3>
      <p class="say">${esc(p.say)}</p>
      <p class="src">${esc(p.src)}</p>
      <div class="acts">${playBtn(p)}${doorOf(p)}</div>
      ${scrub(p)}
      ${voiceSwitch()}
      <p class="safe">${esc(p.safe)}</p>
    </div>`;
  const hb=$('#hourBtn'), rb=$('#roomBtn');
  if(hb) hb.hidden=nowId===hourId; if(rb) rb.hidden=nowId==='summit';
  watchLoops();
}
function renderPieces(){
  const host=$('#pieces'); if(!host) return;
  host.innerHTML=PIECES.map(p=>`<li class="hh-piece${p.id===hourId?' now':''}" id="${p.id}" data-id="${p.id}">
    <div class="pic">${pic(p,'(max-width:900px) 100vw, 46vw')}<span class="tag">${whole(p)?'':LOCK}${esc(mins(p))}${p.free?(unlocked?', open':', free with a sign-up'):''}</span></div>
    <div class="tx">
      <p class="when">${esc(p.when)}${p.id===hourId?', where you are now':''}</p>
      <h3>${esc(p.name)}</h3>
      <p class="hook">${esc(p.hook)}</p>
      <p class="inside">${esc(p.inside)}</p>
      <div class="acts">${playBtn(p)}${doorOf(p)}</div>
      ${scrub(p)}
      <p class="safe">${esc(p.safe)}</p>
    </div></li>`).join('');
  watchLoops();
}

/* ---------- the short loops: silent, and only while they are on screen ---------- */
let loopIO=null;
function watchLoops(){
  const still=(window.AP&&AP.motion===false)||matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(still||!('IntersectionObserver' in window)) return;
  if(!loopIO) loopIO=new IntersectionObserver(es=>es.forEach(e=>{
    const v=e.target;
    if(e.isIntersecting){ if(!v.src&&v.dataset.src) v.src=v.dataset.src; v.muted=true; v.play().catch(()=>{}); }
    else v.pause();
  }),{rootMargin:'120px 0px'});
  $$('video.hh-loop').forEach(v=>{ if(!v.dataset.w){ v.dataset.w='1'; loopIO.observe(v); } });
}

/* ---------- playing: one guide at a time ---------- */
const au=new Audio(); au.preload='none';
let playing=null;
const api={ el:null, audio:au, pause(){ au.pause(); } };
function paint(){
  $$('.pv').forEach(b=>{
    const p=byId(b.dataset.pv), mine=b.dataset.pv===playing, on=mine&&!au.paused;
    b.classList.toggle('playing',on); b.setAttribute('aria-pressed',String(on));
    $('.lb',b).textContent=on?'Playing':(mine&&au.currentTime>0.5&&!au.ended?'Paused':(whole(p)?'Listen in full':'Hear 30 seconds'));
  });
  $$('.hh-scrub').forEach(r=>{ r.hidden=r.dataset.scrub!==playing; });
}
function tick(){
  if(!playing) return;
  const p=byId(playing), d=au.duration||(whole(p)?len(p):30), t=au.currentTime||0;
  $$(`.pv[data-pv="${playing}"]`).forEach(b=>{ $('.fill',b).style.width=(100*t/d)+'%'; $('.tm',b).textContent=fmt(Math.max(0,d-t)); });
  $$(`.hh-scrub[data-scrub="${playing}"]`).forEach(r=>{ if(document.activeElement!==r) r.value=Math.round(1000*t/d); });
}
function reset(id){ const p=byId(id); $$(`.pv[data-pv="${id}"]`).forEach(b=>{ $('.fill',b).style.width='0%'; $('.tm',b).textContent=whole(p)?fmt(len(p)):'0:30'; }); }
function stop(){ if(playing){ au.pause(); reset(playing); playing=null; au.removeAttribute('src'); paint(); } }
function play(id){
  const p=byId(id); if(!p) return;
  if(playing===id&&au.src){ if(au.paused) au.play().catch(()=>{}); else au.pause(); return; }
  if(playing) reset(playing);
  if(window.AP&&AP.current&&AP.current!==api) try{ AP.current.pause(); }catch(e){}
  playing=id;
  if(fromLib(p)&&!MEM.src(libId(p))){ paint(); const want=libId(p); MEM.get(want).then(u=>{ if(playing===id&&u&&libId(p)===want){ au.src=u; au.play().catch(()=>{}); } }); return; }   // the links were still on their way
  au.src=fileOf(p);
  au.play().then(()=>{ if(window.AP){ AP.current=api; if(AP.sound&&AP.sound.duck) AP.sound.duck(true); } }).catch(()=>{});
  paint();
  if('mediaSession' in navigator){ try{ navigator.mediaSession.metadata=new MediaMetadata({title:p.name,artist:'Ancestral Peaks',album:'Heal the Healer'}); }catch(e){} }
}
au.addEventListener('play',paint);
au.addEventListener('error',()=>{ const p=playing&&byId(playing); if(fromLib(p)) MEM.renew(au,libId(p)); });
au.addEventListener('timeupdate',tick);
au.addEventListener('pause',()=>{ paint(); if(window.AP&&AP.sound&&AP.sound.duck&&!au.ended) AP.sound.duck(false); });
au.addEventListener('ended',()=>{
  const id=playing, p=byId(id); if(window.AP&&AP.sound&&AP.sound.duck) AP.sound.duck(false);
  reset(id); playing=null; paint();
  // after the half minute, the door is shown once
  if(p&&!whole(p)) $$(`[data-id="${id}"] .door-link, #nowCard .door-link`).forEach(a=>{ a.classList.remove('lit'); void a.offsetWidth; a.classList.add('lit'); });
});
addEventListener('ap:play',e=>{ if(e.detail!==api) au.pause(); });

function setVoice(v){
  if(v===voice) return;
  voice=v; local.set('ap.hth.voice',v); stop(); renderNow(); renderPieces(); paintVoice();
}
function paintVoice(){ $$('[data-voice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.voice===voice))); }

document.addEventListener('click',e=>{
  const b=e.target.closest('.pv'); if(b){ e.preventDefault(); play(b.dataset.pv); return; }
  const v=e.target.closest('[data-voice]'); if(v){ setVoice(v.dataset.voice); return; }
});
document.addEventListener('input',e=>{
  const r=e.target.closest('.hh-scrub'); if(!r||r.dataset.scrub!==playing) return;
  const d=au.duration; if(d) au.currentTime=d*r.value/1000;
});
const roomBtn=$('#roomBtn'), hourBtn=$('#hourBtn');
if(roomBtn) roomBtn.addEventListener('click',()=>{ stop(); nowId='summit'; renderNow(); });
if(hourBtn) hourBtn.addEventListener('click',()=>{ stop(); nowId=hourId; renderNow(); });

/* ---------- today's line: three lines a day for thirteen days, then round again; one to keep ---------- */
const LINES=[
  [['You are not starting the day. You are entering state.',TS],['Three breaths with the stone. It doesn\'t make you calm. It makes you ready.',SB],['Tired is not broken. Touch the stone. Breathe three times. See the place. Let it hold you.',TS]],
  [['Speak only what you want built.',TS],['What is the one thing that matters this afternoon? Does it feed your mountain, or your foothills?',TS],['Rest is not the reward for the work. It is the root of it.',SB]],
  [['Ahéhee\'. Ačiū. Arigatō. Say thank you before you ask for anything.',TS],['Temple. Jaws. Breath. Shoulders. Thoughts.',TS],['Open the museum. One hard thing you carried this week. You have done hard things before. You can do this one.',SB]],
  [['The tools were never lost, they were set down. Pick one up before the phone.',TS],['The stone doesn\'t remove the load. It reminds you that you can breathe while carrying it.',TS],['I am here for what matters. What is not mine, I leave at the door. What is mine, I carry with strength.',SB]],
  [['Gratitude is the only cargo that gets lighter the more of it you carry.',TS],['Confidence is not a feeling. It is a conclusion based on data. Check the data.',SB],['Choose now how you walk in the door tonight. One word. Arrive whole.',TS]],
  [['Morning has gold in its mouth. Face east. Name one direction for the day. One.','A Lithuanian proverb, and the Dawn Alignment in Stone Breath'],['Doubt is a feeling. Your preparation is a fact. Facts win.',SB],['Let yourself be carried. Walk in the middle. Let them light your way.',SB]],
  [['The power I was born with is still mine.',SB],['Run like there is already enough. It shows in the jaw first.',SB],['The field that gave everything is left fallow so it can give again. Wanting quiet is the fallow.',SB]],
  [['They were the vessel. Keep the vessel. Five rounds, stone in the hand.',TS],['Not the race. The machine. My breath. My next move.',SB],['You are not alone. The stone is warm. The circle holds.',SB]],
  [['What you name in the morning, you see all day. Name it out loud.',SB],['Set it as something coming, not something missing. Make sure nobody has to lose.',TS],['A slip is a comma, not a period. Name it, feel it, and begin again, from here.',TS]],
  [['They did not send the fastest runner. They sent the one who could arrive whole.',TS],['Become the rye. The answer to someone trying to reduce you is to keep building.',SB],['Count your wealth the old way. Relatives. Knowledge. Health. And goods enough.',TS]],
  [['Every sentence is a brick, and you are building either way. Lay a good one first.',TS],['This meeting will never come again. Walk in all the way.',SB],['Discipline that costs you sleep is not discipline. It is depletion wearing discipline\'s clothes.',TS]],
  [['Live in happiness. Control your thoughts. Speak only what you want built. Always have humor.',TS],['Enter full. Expect nothing. Leave one person genuinely seen.',TS],['You don\'t belong because you earn it. You belong because you show up. Because you stay.',SB]],
  [['Will this make the great-grandchildren whole? Hold today\'s one goal up to that.',TS],['Receive them like they were expected.',TS],['Name five who would show up at your mile ninety-five. Ask one of them for one thing this week.',SB]]
];
const KEEP=['Let your day be beautiful. Stay calm. Stay relaxed. The slow heart goes with you.',SB];
const today=new Date();
const dayNo=Math.floor((Date.UTC(today.getFullYear(),today.getMonth(),today.getDate())-Date.UTC(2026,10,26))/864e5);
(function todayLine(){
  const host=$('#todayLines'); if(!host) return;
  const set=LINES[((dayNo%LINES.length)+LINES.length)%LINES.length];
  const h=today.getHours()+today.getMinutes()/60, at=h<10.5?0:h<14.5?1:2;
  host.innerHTML=['Morning','Midday','Late afternoon'].map((m,i)=>`<li class="reveal${i===at?' on':''}"><p class="m">${m}${i===at?', now':''}</p><p class="l">${esc(set[i][0])}</p><p class="s">${esc(set[i][1])}</p></li>`).join('')
    +`<li class="keep reveal"><p class="m">One to keep, any hour</p><p class="l">${esc(KEEP[0])}</p><p class="s">${esc(KEEP[1])}</p></li>`;
})();

/* ---------- the hour you stop: kept on this device, shown back, nothing sent ---------- */
(function stopHour(){
  const form=$('#turnForm'), inp=$('#turnTime'), back=$('#turnBack'), clear=$('#turnClear'); if(!form) return;
  const nice=v=>{ const m=/^(\d{1,2}):(\d{2})$/.exec(v||''); if(!m) return ''; let h=+m[1]; const ap=h>=12?'PM':'AM'; h=h%12||12; return h+':'+m[2]+' '+ap; };
  function show(){
    const v=local.get('ap.hth.stop',null), n=nice(v);
    if(!n){ back.hidden=true; clear.hidden=true; return; }
    inp.value=v; clear.hidden=false; back.hidden=false;
    const m=/^(\d{1,2}):(\d{2})$/.exec(v), now=new Date(), past=now.getHours()*60+now.getMinutes()>=(+m[1])*60+(+m[2]);
    back.textContent=past?'It is past '+n+', the hour you set. What is not yours, leave at the door. Go home.':'Your hour to stop is '+n+'. The runner who never rests cannot run home.';
  }
  form.addEventListener('submit',e=>{ e.preventDefault(); if(nice(inp.value)){ local.set('ap.hth.stop',inp.value); show(); } });
  clear.addEventListener('click',()=>{ local.del('ap.hth.stop'); show(); });
  show();
})();

/* ---------- your five at mile 95: first names kept on this device, never sent ---------- */
(function five(){
  const form=$('#fiveForm'), out=$('#fiveToday'), clear=$('#fiveClear'); if(!form) return;
  const boxes=$$('input',form);
  function show(){
    const raw=local.get('ap.hth.five',[]), names=(Array.isArray(raw)?raw:[]).map(n=>String(n).trim().slice(0,30)).filter(Boolean).slice(0,5);
    boxes.forEach((b,i)=>{ b.value=names[i]||''; });
    clear.hidden=!names.length; out.hidden=!names.length;
    if(names.length){ const n=names[((dayNo%names.length)+names.length)%names.length]; out.innerHTML='Today: <b>'+esc(n)+'</b><br>Ask them for one thing this week. Let yourself be carried.'; }
  }
  form.addEventListener('submit',e=>{ e.preventDefault(); local.set('ap.hth.five',boxes.map(b=>b.value.trim().replace(/\s+/g,' ').slice(0,30)).filter(Boolean)); show(); });
  clear.addEventListener('click',()=>{ local.del('ap.hth.five'); show(); });
  show();
})();

/* ---------- the free sign-up (the Listening Room's own, through PeaksCapture) ---------- */
function paintUnlock(){
  const on=!!unlocked||member(), form=$('#signup'), wel=$('#welcome');
  if(form) form.hidden=on; if(wel) wel.hidden=!on;
  if(member()&&wel) wel.innerHTML='<h3>'+(MEM.first?esc(MEM.first)+', all six':'All six')+' are yours in full.</h3><p>Every guide plays in full on this device, in either voice, right on the page.</p>';
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
    btn.disabled=true; btn.classList.add('busy'); say('Opening it…');
    const ok=await PeaksCapture.send({ name:n, email:m, source:form.dataset.source, subject:'Ancestral Peaks — the free quarter (Heal the Healer)', botcheck:form.botcheck&&form.botcheck.checked });
    btn.disabled=false; btn.classList.remove('busy');
    if(!ok){ say('That did not go through. Please try once more in a moment.',true); return; }
    unlocked={name:n.split(' ')[0].slice(0,40),at:Date.now()}; local.set('ap.free',unlocked);
    say(''); stop(); paintUnlock(); renderNow(); renderPieces();
    $$('#pieces .reveal, #nowCard .reveal').forEach(x=>x.classList.add('in'));
    dispatchEvent(new CustomEvent('ap:free-open',{detail:{source:'peaks-heal-the-healer'}}));
  });
})();

renderNow(); renderPieces(); paintVoice(); paintUnlock();
})();
