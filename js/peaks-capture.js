/* Ancestral Peaks — the one sign-up capture for the whole site (the Listening Room's free sign-up and the
   /reader/ page for book buyers both post here).

   It uses the same Web3Forms form, endpoint and access key that every sign-up form on Tony's sites already uses
   (tribeawaken.com, ancestralwatch.com, and the AncestralWatch book pages kept in this repo under v2/aw/).
   Web3Forms sends the team a notification email for each sign-up. Nothing automatic goes back to the reader, so
   the page copy never promises an email.

   Every submission carries a `source` (for example "peaks-listening-room" or "peaks-reader-pebble") so the team
   can see where each person came in.

   PeaksCapture.send({ name, email, source, subject }) -> Promise<boolean>   (true when Web3Forms says success) */
(function(){
  'use strict';
  const ENDPOINT = 'https://api.web3forms.com/submit';
  const ACCESS_KEY = '057975c1-1a1a-465e-9b5e-3fb6692b2106';

  async function send(f){
    f = f || {};
    if (f.botcheck) return true;            // the honeypot was filled: a bot. Look like success, send nothing.
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
    try {
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body) });
      let j = null; try { j = await r.json(); } catch (e) {}
      return !!(r.ok && (!j || j.success !== false));
    } catch (e) { return false; }
  }

  const validEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
  window.PeaksCapture = { send, validEmail, ENDPOINT };
})();
