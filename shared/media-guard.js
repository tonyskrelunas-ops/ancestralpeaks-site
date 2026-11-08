/* Media guard (11/7/2026): phones close a page that holds too many films in memory, so films far from the screen
   hand their memory back and load again just before they come into view. Nothing changes on screen. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (!window.matchMedia('(max-width: 980px), (pointer: coarse)').matches) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (v.dataset.guardSrc && !v.getAttribute('src')) {
          v.src = v.dataset.guardSrc; delete v.dataset.guardSrc; v.load();
          if (v.muted && v.loop) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        }
      } else {
        var s = v.getAttribute('src');
        if (s && !v.controls) { v.pause(); v.dataset.guardSrc = s; v.removeAttribute('src'); v.load(); }
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
