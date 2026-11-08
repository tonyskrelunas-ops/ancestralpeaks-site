/* The welcome film (11/8). On a phone it opens on its own quiet page (welcome/), because the home page already runs
   several water loops and a 3-minute film on top closed the app about 15 seconds in. On a laptop it plays here, and
   every other film on the page is paused and handed back first so the welcome has the memory to itself. */
(function () {
  var phone = window.matchMedia('(max-width: 1099px), (orientation: portrait), (pointer: coarse)').matches;
  var boxes = document.querySelectorAll('.wf');
  for (var i = 0; i < boxes.length; i++) (function (box) {
    var go = box.querySelector('.wf-go'); if (!go) return;
    go.addEventListener('click', function () {
      if (phone && box.dataset.page) { window.location.href = box.dataset.page + '?play'; return; }
      var others = document.querySelectorAll('video');
      for (var k = 0; k < others.length; k++) { var o = others[k]; try { o.pause(); if (o.getAttribute('src')) { o.dataset.guardSrc = o.getAttribute('src'); o.removeAttribute('src'); o.load(); } } catch (e) {} }
      var v = document.createElement('video');
      v.controls = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto';
      v.poster = box.dataset.posterWide; v.src = box.dataset.wide;
      box.classList.add('playing', 'is-wide');
      var stage = box.querySelector('.wf-stage'); stage.innerHTML = ''; stage.appendChild(v);
      var duck = function (on) { try { if (window.AP && AP.sound && AP.sound.duck) AP.sound.duck(on); if (on && AP.current && AP.current.pause) AP.current.pause(); } catch (e) {} };
      v.addEventListener('play', function () { duck(true); });
      v.addEventListener('pause', function () { duck(false); });
      v.addEventListener('ended', function () { duck(false); });
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
  })(boxes[i]);
})();
