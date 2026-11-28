/* STONE BREATH · THE IMMERSIVE EDITION · the book code (11/27/2026)
   Tony: "Once they enter a book code ... we should make it available immediately ... instantly".
   Payhip gives each buyer a book code (SB-XXXX-XXXX-XXXX) on their receipt. Typed here with their email, the members service
   checks it at once, makes them a reader of the edition, and signs this device in (js/peaks-members.js, redeem()).
   SBCode.mount(el, after): draws the form inside el; after() runs once they are in (default: open Day 1). */
(function () {
  'use strict';
  var SAY = {
    code: 'That code does not look right. It starts with SB- and is on your Payhip receipt.',
    email: 'That email does not look complete yet.',
    taken: 'That code is already open for another email. Write to far-messenger@ancestralpeaks.com and we will sort it out today.',
    used: 'That code is open on ten devices already. Write to far-messenger@ancestralpeaks.com and we will help.',
    slow: 'A few too many tries. Wait a little and try once more.',
    net: 'That did not go through. Check the connection and try once more.'
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mount(el, after) {
    if (!el || el.dataset.sbcode) return; el.dataset.sbcode = '1';
    el.innerHTML =
      '<form class="sbc" novalidate>' +
      '<label><span>Book code</span><input name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="SB-XXXX-XXXX-XXXX" required></label>' +
      '<label><span>The email you bought with</span><input name="email" type="email" inputmode="email" autocomplete="email" required></label>' +
      '<button class="btn earth" type="submit">Open my edition</button>' +
      '<p class="sbc-msg" aria-live="polite"></p></form>';
    var f = el.querySelector('form'), msg = el.querySelector('.sbc-msg'), btn = el.querySelector('button');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var P = window.PeaksMembers, code = f.code.value.trim(), email = f.email.value.trim();
      if (!/[0-9A-Za-z]{4}[\s-]*[0-9A-Za-z]{4}[\s-]*[0-9A-Za-z]{4}\s*$/.test(code)) { msg.textContent = SAY.code; msg.className = 'sbc-msg bad'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = SAY.email; msg.className = 'sbc-msg bad'; return; }
      if (!P || !P.redeem) { msg.textContent = SAY.net; msg.className = 'sbc-msg bad'; return; }
      btn.disabled = true; msg.textContent = 'Opening…'; msg.className = 'sbc-msg';
      P.redeem(code, email).then(function (j) {
        if (j && j.ok) {
          msg.innerHTML = '<b>You are in' + (j.first ? ', ' + esc(j.first) : '') + '.</b> All twenty-two days are open on this device.';
          (after || function () { location.href = '/stone-breath/day-01/'; })();
        } else { btn.disabled = false; msg.textContent = SAY[(j && j.reason)] || SAY.net; msg.className = 'sbc-msg bad'; }
      }).catch(function () { btn.disabled = false; msg.textContent = SAY.net; msg.className = 'sbc-msg bad'; });
    });
  }
  window.SBCode = { mount: mount };
})();
