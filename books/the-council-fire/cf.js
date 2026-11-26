/* SIT AT THE FIRE — The Council Fire on Ancestral Peaks — 2026-11-26
   Twelve seats, one fire, one seat left for the visitor.
   Every line a keeper speaks is from the book. What the visitor types stays on the device (localStorage). */
(function(){
'use strict';
var $ = function(s, r){ return (r || document).querySelector(s); };
var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// name, people and place, what they keep and the token, the moment in the book, the line
var K = [
  { id:'kathe',   name:'Käthe',    place:'Ruhr · Germany',        keep:'Keeper of the water. Her token: a lump of coal.',
    setup:'Forty years on, with everything they had built still holding, she wrote the others a letter one sentence long.',
    line:'We built everything, except the way back to each other.', chip:'The way back to each other',
    alt:'The Tetraeder lit at night on an old mine heap in Bottrop, Germany' },
  { id:'ugne',    name:'Ugnė',     place:'Lithuania',             keep:'Keeper of the songs. Her token: an amber bead.',
    setup:'Teaching girls a song that takes three voices, three melodies that rub against each other on purpose.',
    line:'You are listening to them. Stop listening. Lean into them. The beauty is in the rub.', chip:'Lean in where it rubs',
    alt:'The green hill forts of Kernavė, Lithuania, in summer light' },
  { id:'illary',  name:'Illary',   place:'The Andes',             keep:'Keeper of the seeds. Her token: a carved stone llama.',
    setup:'Why her valley still held thousands of varieties when the efficient valleys held four: for a thousand years nobody had kept their seed to themselves.',
    line:'The giving was the storage. There was no other vault. There was never going to be another vault.', chip:'Give it away so it lasts',
    alt:'A herd grazing below the snow peak of Ausangate, Peru' },
  { id:'nizhoni', name:'Nizhoní',  place:'Diné · Navajo Nation',  keep:'Keeper of the land. Her token: a river stone.',
    setup:'On how the people who come to help count her country.',
    line:'They look at our land and see what is missing. No factory. No mall. They never see what is there.', chip:'See what is already there',
    alt:'A flock of sheep walking out through sagebrush on the high desert' },
  { id:'aoi',     name:'Aoi',      place:'Japan',                 keep:'Keeper of the tools. Her token: a black go stone.',
    setup:'The engineer who walked away from the towers, and then went back to the work, differently.',
    line:'A tool can be pointed at something else entirely. … But somebody has to decide where. And it will not be the tool. And it will not be the market. And if it is not us, it will be whoever is still in the room.', chip:'Decide where the tool points',
    alt:'A farmhouse above a ripe rice field in autumn, Nara, Japan' },
  { id:'vahan',   name:'Vahan',    place:'Armenian Highlands',    keep:'Keeper of the record. His token: a stone cross.',
    setup:'Too old now to travel, he wrote letters to the names his grandfather had left him, and sent them out like seed before rain.',
    line:'Gather the keepers. We were never meant to do this alone.', chip:'Gather the keepers',
    alt:'The monastery of Tatev above its gorge, Armenia' },
  { id:'lobsang', name:'Lobsang',  place:'Tibet',                 keep:'Keeper of the long view. His token: a mala of bodhi seeds.',
    setup:'Everything they built would be judged by people not born yet. He said that is not a reason for humility. It is a reason for speed.',
    line:'We are the ancestors. That is not a compliment. It is a job. And we are late.', chip:'It is a job, and we are late',
    alt:'A high blue lake on the Tibetan plateau' },
  { id:'terangi', name:'Te Rangi', place:'Aotearoa · Māori',      keep:'Keeper of the star compass. His token: a pounamu.',
    setup:'On the voyaging canoe one voice can stop everything. The navigator says no, and eighty people unload, and wait.',
    line:'You want to know what that costs. I will tell you. It costs everything. Every single time.', chip:'One voice can say no',
    alt:'The Bay of Islands at dusk, Aotearoa New Zealand' },
  { id:'warrun',  name:'Warrun',   place:'Aboriginal Australia',  keep:'Keeper of the songlines. His token: a lump of spinifex resin.',
    setup:'Where the song reaches the edge of what his people hold, it does not stop. The next people take it up, in their own language, and hand it on again.',
    line:'So there is a person in the middle of that, singing a stretch of country they have never walked and will never walk. Holding it right. Getting it exactly right, for thousands of years, for the sake of somebody they are never going to meet, who might one day have to cross it.', chip:'Hold my stretch right',
    alt:'Desert oak and red hills in Central Australia' },
  { id:'kiprono', name:'Kiprono',  place:'Kalenjin · Kenya',      keep:'Keeper of the covenant. His token: a beaded bracelet.',
    setup:'Of the man everyone went to, who listened longer than anyone expected. Then they were told to modernize, and he had to campaign for the seat against his own cousin.',
    line:'That man could have carried us for thirty years. We had him. We had him for free. And we ran him through a machine that was built somewhere else, and it broke him in eighteen months, and now he is gone.', chip:'Stop breaking the ones who carry us',
    alt:'The Great Rift Valley at sundown, Kenya' },
  { id:'hamish',  name:'Hamish',   place:'Scottish Highlands',    keep:'Keeper of the clan. His token: a granite clan stone.',
    setup:'Nineteen crofts put their wool together. The rule that changed the most was the one about their meetings.',
    line:'You bring the problem and you bring it plainly, and then you bring it as work: here is the thing, here is who does it, here is when. … Because a room that rehearses its own ruin every winter will get exactly what it rehearsed.', chip:'Bring the problem as work',
    alt:'A roofless stone croft on the Isle of Skye, Scotland' },
  { id:'chariya', name:'Chariya',  place:'Thailand',              keep:'Keeper of the rice. Her token: a rice seed.',
    setup:'A thousand years of sharing one water. The man at the top of the hill has to look at the man at the bottom, in a room, every year, for the whole of his life.',
    line:'Do not ask anyone to be fair to a person they will never meet. That has never worked anywhere on earth and it is not going to start working now. Put them in the room together. Every year. Forever.', chip:'The same room, every year',
    alt:'Rice terraces in the hills of northern Thailand' }
];

var ring = $('#ring'), card = $('#card'), rest = $('#panelRest');
var heard = {}, order = [], current = -1, lit = false, seated = false;
var store = { get: function(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
              set: function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} },
              del: function(k){ try { localStorage.removeItem(k); } catch (e) {} } };

/* ---------- the voice ---------- */
var voicesOn = store.get('ap.cf.voices') !== '0';
var voice = new Audio(); voice.preload = 'none';
voice.setAttribute('aria-hidden', 'true'); voice.style.display = 'none'; document.body.appendChild(voice);   // in the page, so the Peaks sign-up never opens over a keeper mid-sentence
var voiceBtn = $('#voiceBtn');
function paintVoice(){ voiceBtn.setAttribute('aria-pressed', voicesOn ? 'true' : 'false'); $('span', voiceBtn).textContent = voicesOn ? 'Voices on' : 'Voices off, words only'; }
function duck(d){ try { if (window.AP && AP.sound && AP.sound.on) AP.sound.duck(d); } catch (e) {} }
function say(file){
  voice.pause();
  if (!voicesOn) return;
  var fv = $('#filmMedia video'); if (fv && !fv.paused) fv.pause();
  voice.src = 'audio/' + file + '.m4a';
  var p = voice.play(); duck(true);
  if (p && p.catch) p.catch(function(){ duck(false); });
}
voice.addEventListener('ended', function(){ duck(false); });
voice.addEventListener('pause', function(){ duck(false); });
voiceBtn.addEventListener('click', function(){ voicesOn = !voicesOn; store.set('ap.cf.voices', voicesOn ? '1' : '0'); if (!voicesOn) voice.pause(); paintVoice(); });
paintVoice();

/* ---------- the ring: thirteen places, the bottom one left empty ---------- */
var R = 40.5, N = K.length + 1, seatEls = [];
function place(el, slot){
  var a = (90 + slot * 360 / N) * Math.PI / 180;       // slot 0 is the bottom; then clockwise round the fire
  el.style.left = (50 + R * Math.cos(a)).toFixed(2) + '%';
  el.style.top  = (48 + R * Math.sin(a)).toFixed(2) + '%';
}
K.forEach(function(k, i){
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'cf-seatbtn';
  b.setAttribute('aria-label', k.name + ', ' + k.place.replace(' · ', ', ') + '. Hear this keeper.');
  b.innerHTML = '<span class="ph"><img src="img/' + k.id + '.jpg" alt="" loading="lazy" width="640" height="480"></span><span class="nm" aria-hidden="true">' + k.name + '</span>';
  place(b, i + 1);
  b.addEventListener('click', function(){ hear(i, true); });
  ring.appendChild(b); seatEls.push(b);
});
var you = document.createElement('button');
you.type = 'button'; you.className = 'cf-seatbtn you';
you.setAttribute('aria-label', 'The empty seat. It is yours. Take your seat.');
you.innerHTML = '<span class="ph">You</span>';
place(you, 0);
you.addEventListener('click', takeSeat);
ring.appendChild(you);

function count(){ return order.length; }
function heat(){
  var h = (lit ? 0.12 : 0.03) + count() * (0.88 / K.length);
  if (seated) h = 1.12;
  ring.style.setProperty('--heat', h.toFixed(3));
  ring.classList.toggle('lit', lit && !reduced);
}
function paintCount(){
  var n = count(); $('#count').textContent = n; $('#count2').textContent = n;
  you.classList.toggle('ready', n >= K.length && !seated);
  $('#nextBtn').innerHTML = (n >= K.length ? 'Take your seat' : 'The next seat') + ' <span class="arrow">→</span>';
  paintChips();
}

function hear(i, speak){
  var k = K[i]; current = i; lit = true;
  if (!heard[k.id]) { heard[k.id] = 1; order.push(k.id); store.set('ap.cf.heard', order.join(',')); }
  seatEls.forEach(function(el, j){ el.classList.toggle('now', j === i); el.classList.toggle('heard', !!heard[K[j].id]); });
  $('#cPic').src = 'img/' + k.id + '.jpg'; $('#cPic').alt = k.alt;
  $('#cName').textContent = k.name; $('#cPlace').textContent = k.place;
  $('#cCarry').textContent = k.keep; $('#cSetup').textContent = k.setup;
  $('#cLine').textContent = '“' + k.line + '”';
  rest.hidden = true; card.hidden = false;
  card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
  heat(); paintCount();
  if (speak) say(k.id);
}
$('#againBtn').addEventListener('click', function(){ if (current >= 0) { if (!voicesOn) { voicesOn = true; store.set('ap.cf.voices', '1'); paintVoice(); } say(K[current].id); } });
$('#nextBtn').addEventListener('click', function(){
  if (count() >= K.length) return takeSeat();
  for (var s = 1; s <= K.length; s++) { var j = (current + s) % K.length; if (!heard[K[j].id]) { hear(j, true); seatEls[j].focus({ preventScroll: true }); return; } }
});

/* ---------- before the fire: set it down (never stored) ---------- */
function go(el){ el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
$('#setForm').addEventListener('submit', function(e){
  e.preventDefault();
  var f = e.currentTarget; $('#setIn').value = ''; $('#setIn').blur();
  f.classList.add('gone'); lit = true; heat();
  setTimeout(function(){ f.hidden = true; var d = $('#setDone'); d.hidden = false; }, reduced ? 0 : 700);
  setTimeout(function(){ go($('#circle')); }, reduced ? 50 : 1900);
});

/* ---------- your seat ---------- */
var seatSec = $('#seat'), peopleIn = $('#peopleIn'), thingIn = $('#thingIn');
function takeSeat(){
  lit = true; seatSec.hidden = false; you.classList.remove('ready'); you.classList.add('taken'); heat();
  say('room');
  go(seatSec); setTimeout(function(){ $('#seatH').focus({ preventScroll: true }); }, 60);
}
function paintChips(){
  var box = $('#thingChips'); if (!box) return;
  var list = K.filter(function(k){ return heard[k.id]; }); if (!list.length) list = K;
  box.innerHTML = '';
  list.forEach(function(k){
    var b = document.createElement('button'); b.type = 'button'; b.textContent = k.chip; b.title = 'From ' + k.name;
    b.addEventListener('click', function(){ thingIn.value = k.chip; pick(box, b); });
    box.appendChild(b);
  });
}
function pick(box, b){ Array.prototype.forEach.call(box.children, function(c){ c.classList.toggle('on', c === b); }); }
Array.prototype.forEach.call($('#peopleChips').children, function(b){
  b.addEventListener('click', function(){ peopleIn.value = b.textContent; pick($('#peopleChips'), b); });
});
function showAnswer(people, thing, speak){
  $('#ansFor').textContent = 'For ' + people + ':';
  $('#ansThing').textContent = thing;
  $('#seatForm').hidden = true; var a = $('#answer'); a.hidden = false;
  seated = true; heat(); paintCount();
  if (speak) { say('yours'); setTimeout(function(){ a.focus({ preventScroll: true }); a.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }, 60); }
}
$('#seatForm').addEventListener('submit', function(e){
  e.preventDefault();
  var thing = thingIn.value.trim().slice(0, 120), people = (peopleIn.value.trim() || 'my people').slice(0, 40);
  if (!thing) { thingIn.placeholder = 'One thing. A few words are enough.'; thingIn.focus(); return; }
  store.set('ap.cf.seat', JSON.stringify({ people: people, thing: thing }));
  showAnswer(people, thing, true);
});
$('#changeBtn').addEventListener('click', function(){ $('#answer').hidden = true; $('#seatForm').hidden = false; seated = false; heat(); thingIn.focus(); });
$('#clearBtn').addEventListener('click', function(){
  store.del('ap.cf.seat'); store.del('ap.cf.heard'); peopleIn.value = ''; thingIn.value = '';
  $('#answer').hidden = true; $('#seatForm').hidden = false; seated = false; heat();
});

/* ---------- the film taste ---------- */
(function(){
  var m = $('#filmMedia'), v = $('video', m), goBtn = $('#filmGo');
  goBtn.addEventListener('click', function(){ voice.pause(); m.classList.add('playing'); v.controls = true; var p = v.play(); if (p && p.catch) p.catch(function(){}); });
  v.addEventListener('play', function(){ voice.pause(); duck(true); });
  v.addEventListener('pause', function(){ duck(false); });
  v.addEventListener('ended', function(){ duck(false); });
})();

/* ---------- a returning visitor: the seats they heard, the thing they carried ---------- */
(function(){
  var h = (store.get('ap.cf.heard') || '').split(',');
  h.forEach(function(id){ if (id && !heard[id] && K.some(function(k){ return k.id === id; })) { heard[id] = 1; order.push(id); } });
  if (order.length) { lit = true; seatEls.forEach(function(el, j){ el.classList.toggle('heard', !!heard[K[j].id]); }); }
  var s = null; try { s = JSON.parse(store.get('ap.cf.seat') || 'null'); } catch (e) {}
  if (s && s.thing) {
    peopleIn.value = s.people || ''; thingIn.value = s.thing;
    seatSec.hidden = false; you.classList.add('taken'); lit = true;
    showAnswer(String(s.people || 'my people').slice(0, 40), String(s.thing).slice(0, 120), false);
  }
  heat(); paintCount();
})();

/* the flames rest when the ring is off the screen */
if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ es.forEach(function(e){ ring.classList.toggle('offscreen', !e.isIntersecting); }); }).observe(ring);

/* test hook for screenshots only: #shot=circle|seat fills the state without a tap */
(function(){
  var m = /shot=(\w+)/.exec(location.hash); if (!m) return;
  voicesOn = false; paintVoice();
  var n = m[1] === 'some' ? 5 : 12; for (var i = 0; i < n; i++) hear(i, false);
  if (m[1] === 'seat' || m[1] === 'answer') { seatSec.hidden = false; you.classList.add('taken'); }
  if (m[1] === 'answer') showAnswer('my team', 'Bring the problem as work', false);
  var t = { some: '#circle', circle: '#circle', seat: '#seat', answer: '#seat', film: '#film', doors: '#work' }[m[1]];
  if (t) { var secs = document.querySelectorAll('body > section'), tgt = $(t); for (var q = 0; q < secs.length && secs[q] !== tgt; q++) secs[q].classList.add('cf-shot-hide'); }
})();
})();
