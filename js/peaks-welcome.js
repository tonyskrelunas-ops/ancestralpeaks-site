/* The welcome film (11/8): a picture and a play button until someone presses it, so nothing heavy loads on its own.
   Phones in portrait get the tall 720 cut; laptops get the wide 1080 cut. The site's water and fire step back while it plays. */
(function () {
  var boxes = document.querySelectorAll('.wf');
  for (var i = 0; i < boxes.length; i++) (function (box) {
    var go = box.querySelector('.wf-go'); if (!go) return;
    go.addEventListener('click', function () {
      var wide = window.matchMedia('(min-width: 900px) and (orientation: landscape)').matches;
      var v = document.createElement('video');
      v.controls = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto';
      v.poster = wide ? box.dataset.posterWide : box.dataset.posterTall;
      v.src = wide ? box.dataset.wide : box.dataset.tall;
      box.classList.add('playing'); box.classList.toggle('is-wide', wide);
      var stage = box.querySelector('.wf-stage'); stage.innerHTML = ''; stage.appendChild(v);
      var duck = function (on) { try { if (window.AP && AP.sound && AP.sound.duck) AP.sound.duck(on); if (on && AP.current && AP.current.pause) AP.current.pause(); } catch (e) {} };
      v.addEventListener('play', function () { duck(true); });
      v.addEventListener('pause', function () { duck(false); });
      v.addEventListener('ended', function () { duck(false); });
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }, { once: true });
  })(boxes[i]);
})();
