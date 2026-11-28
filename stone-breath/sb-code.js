/* STONE BREATH · THE IMMERSIVE EDITION · paste your link (11/28/2026)
   Each buyer's own link is on their Payhip receipt (/stone-breath/open/?k=SB-...). Tapping it is all it takes. This box is
   for the times they have it copied instead: paste the link (or just the SB- part) and this device is let in at once
   (js/peaks-members.js, redeem(); members service /api/redeem). No email, no password.
   SBCode.mount(el, after): draws the box inside el; after() runs once they are in (default: open Day 1). */
(function () {
  'use strict';
  var SAY = {
    code: 'That does not look like the link from your receipt. Paste all of it, or write to far-messenger@ancestralpeaks.com.',
    used: 'That link is open on ten devices already. Write to far-messenger@ancestralpeaks.com and we will help.',
    slow: 'A few too many tries. Wait a little and try once more.',
    net: 'That did not go through. Check the connection and try once more.'
  };
  function mount(el, after) {
    if (!el || el.dataset.sbcode) return; el.dataset.sbcode = '1';
    el.innerHTML =
      '<form class="sbc" novalidate>' +
      '<label><span>Paste the link from your receipt</span><input name="code" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ancestralpeaks.com/stone-breath/open/?k=SB-…" required></label>' +
      '<button class="btn earth" type="submit">Open my edition</button>' +
      '<p class="sbc-msg" aria-live="polite"></p></form>';
    var f = el.querySelector('form'), msg = el.querySelector('.sbc-msg'), btn = el.querySelector('button');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var P = window.PeaksMembers, v = f.code.value.trim();
      if (!/SB[\s-]*[0-9A-Za-z]{4}[\s-]*[0-9A-Za-z]{4}[\s-]*[0-9A-Za-z]{4}/i.test(v)) { msg.textContent = SAY.code; msg.className = 'sbc-msg bad'; return; }
      if (!P || !P.redeem) { msg.textContent = SAY.net; msg.className = 'sbc-msg bad'; return; }
      btn.disabled = true; msg.textContent = 'Opening…'; msg.className = 'sbc-msg';
      P.redeem(v, '').then(function (j) {
        if (j && j.ok) { msg.innerHTML = '<b>You are in.</b> All twenty-two days are open on this device.'; (after || function () { location.href = '/stone-breath/day-01/'; })(); }
        else { btn.disabled = false; msg.textContent = SAY[(j && j.reason)] || SAY.net; msg.className = 'sbc-msg bad'; }
      }).catch(function () { btn.disabled = false; msg.textContent = SAY.net; msg.className = 'sbc-msg bad'; });
    });
  }
  window.SBCode = { mount: mount };
})();
