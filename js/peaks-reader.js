/* Ancestral Peaks — /reader/: book buyers come in with the word printed at the end of their book.
   A right word (any case) opens the Book Reader plan: the first month free, then $12 a month.

   Neither the words nor the plan's link sit in this file in plain text. Each lock holds the SHA-256 of one
   lowercased word, and the link sealed with AES-GCM under a key derived from that word with PBKDF2 (SHA-256),
   so the link only exists in the page after a right word. To change a word or the link, regenerate the locks with
   make-reader-locks.js in Dropbox/WEBSITES/ANCESTRAL PEAKS/LISTENING ROOM STORE — rebuilt 2026-11-07/ (it holds the
   words, so it never goes in this public repo), never by hand.

   The reader's email goes to the team through the same capture as the free sign-up (js/peaks-capture.js), with
   source "peaks-reader-<word>", so the team knows which book brought them in. */
(function(){
  'use strict';
  const LOCK = { iter: 210000, locks: [
    { h: 'c2b2e5ddebda4dc3cfa79a51077bf86a1db4b6113760643153f6eeaf768f5864', book: 'Stone Breath',       salt: 'qtBSCsrYBC0MMA2pNVl4nw==', iv: 'rVnXHOkAvyEip7GL', ct: 'cZ061JaHvLxWsIBP4EogVZEVeU0bk+o+cj2qEKWtiR2ZAG5NAR9NsYhr/DDqdlEw8C9sbo7DxnOWRhtFyIRiLuRgxpP2Zx8tWrdU' },
    { h: 'ebb3de8a3d9a40366132eb5deb5af44e4c96c11696f8fc34ea2c1d8bd8399171', book: 'The Council Fire',   salt: '7TvFua6zbBfqUGwsaWPoKg==', iv: '9sj+peyBJIDTu1vH', ct: 'OEgLpTKph4/M92E8BX1MtjUaoUJp46JTD0tJqccbjVJU9tlaAFXEbAmyCLeOffhUbTM16c8HxcTe9DDrP3hGL4JeH708AmnMH9NZ' },
    { h: 'cf44886e54f424ce136dc38e4d9ef5b4b556d06060705262d6fcce02b4322539', book: 'The Far Messengers', salt: '/gA6NTRwiYCq6OviQi0F0A==', iv: '0XxZh5xEippUebOS', ct: '4Xtjq0MNkJWKX5tWKSvDGc8gCkQPBdDCRCnoi76lymmrjDizgVjZDctX7cWTigKMx7nyKf/Fbza4jIGyHlBvFBK1LRd8ZIbxgGMs' }
  ] };

  const $ = s => document.querySelector(s);
  const enc = new TextEncoder(), dec = new TextDecoder();
  const unb64 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0));
  const hex = buf => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  const clean = s => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

  async function openLock(word){
    const S = window.crypto && crypto.subtle; if (!S) throw new Error('nocrypto');
    const h = hex(await S.digest('SHA-256', enc.encode(word)));
    const lock = LOCK.locks.find(l => l.h === h); if (!lock) return null;
    const base = await S.importKey('raw', enc.encode(word), 'PBKDF2', false, ['deriveKey']);
    const key = await S.deriveKey({ name: 'PBKDF2', salt: unb64(lock.salt), iterations: LOCK.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const url = dec.decode(await S.decrypt({ name: 'AES-GCM', iv: unb64(lock.iv) }, key, unb64(lock.ct)));
    if (!/^https:\/\/payhip\.com\//.test(url)) return null;
    return { url, book: lock.book };
  }

  const form = $('#readerForm'); if (!form) return;
  const wordIn = $('#rdWord'), mailIn = $('#rdEmail'), btn = $('#rdBtn'), status = $('#rdStatus'), done = $('#rdDone');
  const say = (t, bad) => { status.textContent = t; status.classList.toggle('bad', !!bad); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const word = clean(wordIn.value), email = mailIn.value.trim();
    if (!word) { say('Type the word from the last page of your book.', true); wordIn.focus(); return; }
    if (!window.PeaksCapture || !PeaksCapture.validEmail(email)) { say('Your email, please, so the team knows which book brought you in.', true); mailIn.focus(); return; }
    btn.disabled = true; btn.classList.add('busy'); say('Checking the word…');
    let found = null;
    try { found = await openLock(word); }
    catch (err) { btn.disabled = false; btn.classList.remove('busy'); say('This browser cannot check the word. Please try a current version of Safari, Chrome, Edge or Firefox.', true); return; }
    if (!found) {
      btn.disabled = false; btn.classList.remove('busy');
      say('That word does not match yet. It is printed on the last page of your book, after the story ends. Check there, and try it once more.', true);
      wordIn.select(); return;
    }
    say('Opening your month…');
    // the team hears which book brought this reader; the door opens either way
    await PeaksCapture.send({ email, source: 'peaks-reader-' + word, subject: 'Ancestral Peaks — Book Reader sign-up (' + found.book + ')', botcheck: form.botcheck && form.botcheck.checked });
    btn.disabled = false; btn.classList.remove('busy'); say('');
    $('#rdBook').textContent = found.book;
    const go = $('#rdGo'); go.href = found.url;
    form.hidden = true; done.hidden = false;
    go.focus({ preventScroll: true });
  });
  wordIn.addEventListener('input', () => { if (status.classList.contains('bad')) say(''); });
})();
