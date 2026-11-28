// Ancestral Peaks — THE MEMBERS' LIBRARY (2026-11-26). A member signs in once on a device (/member/, an email link or the
// 6-digit code in the same email) and from then on every page plays the whole recording or film right there, from
// members.ancestralpeaks.com, with a signed link that lasts a few hours. Nothing to download. Everyone else sees the
// members' door as before. Load it before the page's own script; it never blocks the page.
//   localStorage['ap.member']       {s: the device session (a year, re-checked by the server on every use), first, at}
//   localStorage['ap.member.urls']  {exp, urls: {library id: signed URL}, durs}   (both wrapped in try/catch)
// PeaksMembers.on        this device is signed in (known at once, from the device itself)
// PeaksMembers.src(id)   the whole file's signed URL now, or null while the links are being fetched
// PeaksMembers.get(id)   the same as a promise (fetches the links first if needed)
// PeaksMembers.ready     a promise: the links are fresh. A membership that ended signs the device out and reloads once.
(function(){
'use strict';
const host = location.hostname;
const API = window.AP_MEMBERS_API || (/^(localhost|127\.0\.0\.1)$/.test(host) ? 'http://' + host + ':8788' : 'https://members.ancestralpeaks.com');
const K = 'ap.member', KU = 'ap.member.urls';
const local = { get(k){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del(k){ try { localStorage.removeItem(k); } catch (e) {} } };
let me = local.get(K), cache = local.get(KU);
if (me && !me.s) { me = null; local.del(K); }
const fresh = () => cache && cache.urls && cache.exp - Date.now() > 45 * 60000;   // links last 8 hours; renew with 45 minutes left
let pending = null;

function post(path, body, auth){
  return fetch(API + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, auth ? { Authorization: 'Bearer ' + auth } : {}), body: JSON.stringify(body || {}), credentials: 'omit' })
    .then(r => r.json().catch(() => ({})).then(j => Object.assign({ _status: r.status }, j)));
}
function refresh(){
  if (!me) return Promise.resolve(false);
  if (pending) return pending;
  pending = post('/api/media', { all: true }, me.s).then(j => {
    pending = null;
    if (j.member === false) { signOut(true); return false; }                 // the membership ended: back to the door
    if (!j.urls) return !!fresh();
    cache = { exp: j.exp, at: Date.now(), urls: j.urls, durs: j.durs || {}, hls: j.hls || {} }; local.set(KU, cache);   // hls: the long films in top quality (11/26)
    if (j.first !== undefined && j.first !== me.first) { me.first = j.first; local.set(K, me); }
    dispatchEvent(new CustomEvent('ap:member', { detail: { on: true } }));
    return true;
  }).catch(() => { pending = null; return !!fresh(); });                     // offline: keep what we have
  return pending;
}
function signOut(ended){
  const was = !!me; me = null; cache = null; local.del(K); local.del(KU);
  dispatchEvent(new CustomEvent('ap:member', { detail: { on: false, ended: !!ended } }));
  if (was && ended && !/\/member\//.test(location.pathname)) { try { if (!sessionStorage.getItem('ap.member.ended')) { sessionStorage.setItem('ap.member.ended', '1'); location.reload(); } } catch (e) {} }
}
function signedIn(session, first){
  me = { s: session, first: first || '', at: Date.now() }; local.set(K, me); cache = null; local.del(KU);
  return refresh();
}

window.PeaksMembers = {
  API,
  get on(){ return !!me; },
  get first(){ return (me && me.first) || ''; },
  has(id){ return !!me && (!cache || !cache.urls || id in cache.urls); },
  src(id){ return me && fresh() && cache.urls[id] || null; },
  get(id){ return fresh() ? Promise.resolve(this.src(id)) : refresh().then(() => this.src(id)); },
  dur(id){ return cache && cache.durs && cache.durs[id] || 0; },
  hls(id){ return me && fresh() && cache.hls && cache.hls[id] || null; },
  refresh, signOut,
  // sign-in, used by /member/
  ask(email){ return post('/api/signin', { email }); },
  link(t){ return post('/api/verify', { t }).then(j => j.ok ? signedIn(j.session, j.first).then(() => j) : j); },
  code(email, code){ return post('/api/verify', { email, code }).then(j => j.ok ? signedIn(j.session, j.first).then(() => j) : j); },
  // 11/27: the Stone Breath edition's book code (from the Payhip receipt), typed with the buyer's email: in at once
  redeem(code, email, first){ return post('/api/redeem', { code, email, first }).then(j => j.ok ? signedIn(j.session, j.first).then(() => j) : j); },
  ready: Promise.resolve(false)
};
// the links are used at once when fresh; the membership itself is re-checked in the background every 20 minutes
if (me) window.PeaksMembers.ready = fresh() && cache.at && Date.now() - cache.at < 20 * 60000 ? Promise.resolve(true) : (fresh() ? (refresh(), Promise.resolve(true)) : refresh());
document.documentElement.classList.toggle('is-member', !!me);
addEventListener('ap:member', e => document.documentElement.classList.toggle('is-member', !!(e.detail && e.detail.on)));
// a link that ran out while a long film or session sat paused: renew it and carry on from the same second
window.PeaksMembers.renew = function(el, id){
  if (!el || el.dataset.apRenewed === id) return false;
  el.dataset.apRenewed = id;
  const t = el.currentTime || 0;
  cache = null; local.del(KU);
  refresh().then(() => { const u = window.PeaksMembers.src(id); if (!u) return; el.src = u; el.addEventListener('loadedmetadata', () => { try { el.currentTime = t; } catch (e) {} el.play().catch(() => {}); }, { once: true }); el.load(); });
  return true;
};
})();
