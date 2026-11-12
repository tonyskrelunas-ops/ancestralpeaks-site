/* Ancestral Peaks — the one sign-up capture for the whole site (the Listening Room's free sign-up and the
   /reader/ page for book buyers both post here).

   It uses the same Web3Forms endpoint and access key written into the sign-up forms on ancestralwatch.com and
   tribeawaken.com (and the AncestralWatch book pages on this repo's preview branch, v2/aw/), as the lost 11/7
   Listening Room sign-up did. Web3Forms sends the team a notification email for each sign-up. Nothing automatic
   goes back to the reader, so the page copy never promises an email.
   Note: tribeawaken.com now reroutes its forms at run time to its own list (js/capture.js there, Netlify). If the
   team wants Peaks sign-ups on that list too, send() below is the one place to change (that list takes form fields).

   Every submission carries a `source` (for example "peaks-listening-room", or "peaks-reader-" and the word a book buyer typed) so the team
   can see where each person came in.

   PeaksCapture.send({ name, email, source, subject }) -> Promise<boolean>   (true when Web3Forms says success) */
(function(){
  'use strict';
  const ENDPOINT = 'https://api.web3forms.com/submit';
  const ACCESS_KEY = '057975c1-1a1a-465e-9b5e-3fb6692b2106';

  // 11/12: the one members list (ancestralpeaks-members, Netlify Blobs) behind First Light and the letters.
  // A plain-text POST, so the browser sends it without asking first; it never holds up the sign-up.
  const JOIN = 'https://ancestralpeaks-members.netlify.app/api/join';
  function join(f){
    try { fetch(JOIN, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify({ email: f.email || '', first: f.name || '', source: f.source || 'peaks', page: location.pathname }), keepalive: true }).catch(function () {}); } catch (e) {}
  }

  async function send(f){
    f = f || {};
    if (f.botcheck) return true;            // the honeypot was filled: a bot. Look like success, send nothing.
    join(f);
    const body = {
      access_key: ACCESS_KEY,
      subject: f.subject || 'Ancestral Peaks — a new sign-up',
      from_name: 'Ancestral Peaks',
      name: f.name || '',
      email: f.email || '',
      source: f.source || 'peaks',
      page: location.pathname,
      site: 'ancestralpeaks.com'
    };
    // the same sign-up also lands on the team's list (the capture list tribeawaken.com uses), tagged with where it came from
    try {
      const lb = new URLSearchParams({ 'form-name': 'tribe-capture', email: f.email || '', name: f.name || '', source: f.source || 'peaks', edition: 'en', page: 'ancestralpeaks.com' + location.pathname });
      fetch('https://tribeawaken-capture.netlify.app/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: lb.toString(), keepalive: true }).catch(function () {});
    } catch (e) {}
    try {
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body) });
      let j = null; try { j = await r.json(); } catch (e) {}
      return !!(r.ok && (!j || j.success !== false));
    } catch (e) { return false; }
  }

  const validEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
  window.PeaksCapture = { send, validEmail, ENDPOINT };
})();
