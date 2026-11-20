/* Media guard (11/7/2026): phones close a page that holds too many films in memory, so films far from the screen
   hand their memory back and load again just before they come into view. Nothing changes on screen.
   11/19/2026, Tony: "i played them off my phone at that page and they all cut off at some point". A film someone was
   watching was handed back as soon as they scrolled down past it to read: it stopped and went back to 0:00.
   Now a film playing with sound is never touched, and a film that was paused partway comes back at the same moment. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (!window.matchMedia('(max-width: 980px), (pointer: coarse)').matches) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (v.dataset.guardSrc && !v.getAttribute('src')) {
          var t = Number(v.dataset.guardT) || 0;
          v.src = v.dataset.guardSrc; delete v.dataset.guardSrc; delete v.dataset.guardT; v.load();
          if (t > 0) v.addEventListener('loadedmetadata', function back() { v.removeEventListener('loadedmetadata', back); try { v.currentTime = t; } catch (x) {} });
          if (v.muted && v.loop) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        }
      } else {
        var s = v.getAttribute('src');
        if (!s || v.controls) return;
        if (!v.paused && !v.muted) return;              // someone is watching it: leave it playing
        var at = (!v.loop && v.currentTime > 0) ? v.currentTime : 0;
        v.pause(); v.dataset.guardSrc = s; if (at) v.dataset.guardT = String(at); v.removeAttribute('src'); v.load();
      }
    });
  }, { rootMargin: '120% 0px 120% 0px' });
  function watch() {
    var vs = document.querySelectorAll('video');
    for (var i = 0; i < vs.length; i++) if (!vs[i].__guard) { vs[i].__guard = 1; io.observe(vs[i]); }
  }
  watch();
  new MutationObserver(watch).observe(document.documentElement, { childList: true, subtree: true });
})();
