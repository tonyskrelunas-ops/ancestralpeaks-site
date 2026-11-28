/* STONE BREATH · THE IMMERSIVE EDITION · the door of each day (11/27/2026)
   Day 1 is open to everyone: its pictures and sound sit beside the page (window.SB_FREE).
   Days 2-22 are for members and for the edition's readers: on a device where they have signed in (js/peaks-members.js),
   the day's chapter read aloud, its tool, its pictures and its study sheet come from their own signed folder on
   members.ancestralpeaks.com (good for some hours, renewed on the next visit). Everyone else sees the day's title and a door.
   In the page, a link to the day's own files is written data-sb-src="scenes/x.jpg" (or data-sb-href, data-sb-data-src,
   data-sb-poster); it is filled in here before the day's script (../day.js) starts. */
(function () {
  'use strict';
  var id = window.SB_DAY, P = window.PeaksMembers;
  function fill(base) {
    ['src', 'href', 'data-src', 'poster'].forEach(function (a) {
      document.querySelectorAll('[data-sb-' + a + ']').forEach(function (el) {
        el.setAttribute(a, base + el.getAttribute('data-sb-' + a)); el.removeAttribute('data-sb-' + a);
      });
    });
  }
  // a workout or guide from the members' library (the day shows its 30-second taste to everyone else): the whole of it
  function whole() {
    if (!P || !P.on) return;
    document.querySelectorAll('[data-lib]').forEach(function (el) {
      var u = P.src(el.getAttribute('data-lib')); if (!u) return;
      el.setAttribute('data-src', u);
      var d = P.dur(el.getAttribute('data-lib')); if (d) el.setAttribute('data-duration', String(Math.round(d)));
      var sub = el.getAttribute('data-sub') || ''; el.setAttribute('data-sub', sub.replace(/^A 30-second taste · the whole (\w+) is /, 'The whole $1 · '));
    });
  }
  function go(base) {
    window.SB_BASE = base; fill(base); whole();
    var s = document.createElement('script'); s.src = '../day.js?v=1127a'; document.body.appendChild(s);
  }
  function door() {
    document.body.classList.add('sb-locked');
    var d = document.getElementById('sbDoor'); if (d) d.hidden = false;
    // 11/27: the book code, right here in the door: typed once, the day opens at once
    if (d && !d.querySelector('.sbc-box')) {
      var box = document.createElement('div'); box.className = 'sbc-box';
      box.innerHTML = '<p class="say" style="margin-top:1.4rem"><b>Have your book code?</b> Type it with the email you bought with.</p><div></div>';
      (d.querySelector('.in') || d).appendChild(box);
      var s = document.createElement('script'); s.src = '../sb-code.js?v=1127c';
      s.onload = function () { if (window.SBCode) SBCode.mount(box.lastChild, function () { location.reload(); }); };
      document.body.appendChild(s);
    }
    try { window.AP.nav(); window.AP.season(); window.AP.footer(); } catch (e) {}
  }
  if (!id) return go(window.SB_FREE || 'media/');
  if (!P || !P.on) return door();
  var have = P.hls && P.hls(id);
  (have ? Promise.resolve(have) : P.refresh().then(function () { return P.hls && P.hls(id); }))
    .then(function (u) { if (u) go(u.replace(/master\.m3u8(\?.*)?$/, '')); else door(); }, door);
})();
