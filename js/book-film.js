/* Ancestral Peaks — THE BOOK'S FILM, WHOLE, ON THE BOOK'S OWN PAGE (11/27).
   Tony, 11/27: "im in my own website using the link but it wont let me watch the whole films of the book.. the films are
   hard to find too". The three book pages played only the one-minute taste, even for a signed-in member, and sent members
   to Payhip. Now, on a device where a member has signed in (js/peaks-members.js), the taste's frame plays the whole film
   in top quality from members.ancestralpeaks.com (signed HLS, the signed MP4 as the fallback), and the words around it say so.
   Everyone else keeps the taste and the door.

   In the page:
     <video data-whole="film-id" data-whole-alt="film-id-2|Label">   the taste; the whole film takes its place for members
     [data-film-member]="text"   an element whose text becomes this for members (a note, a label)
     [data-film-buy]             hidden for members (the year's button, the old members' link)
     [data-film-go]              an element whose text becomes the whole film's label (a play button's caption)
   The page's own scripts keep working: the taste element stays (hidden) and passes play/pause/ended on, so the page's sound
   and voices still hush for the film, and taste.play()/pause() now play and pause the whole film. */
(function () {
  var M = window.PeaksMembers;
  if (!M || !M.on) return;
  var taste = document.querySelector('video[data-whole]');
  if (!taste) return;
  var id = taste.dataset.whole, alt = (taste.dataset.wholeAlt || '').split('|');

  // the whole film's own frame, made like the taste's (a fresh one for each cut, so no earlier player hangs on)
  var w = null, cur = null;
  function frame(label) {
    var v = document.createElement('video');
    v.className = taste.className; v.setAttribute('playsinline', ''); v.preload = 'none'; v.controls = true;
    if (taste.poster) v.poster = taste.poster;
    v.setAttribute('aria-label', label);
    ['play', 'pause', 'ended'].forEach(function (t) { v.addEventListener(t, function () { if (v === w) taste.dispatchEvent(new Event(t)); }); });
    v.addEventListener('error', function () { if (v === w && cur && M.renew) M.renew(v, cur); });
    if (w) { try { w.pause(); if (window.APHQ) APHQ.release(w); } catch (e) {} w.parentNode.replaceChild(v, w); }
    else taste.parentNode.insertBefore(v, taste);
    w = v;
  }
  if (window.APHQ) APHQ.release(taste);
  try { taste.pause(); } catch (e) {}
  taste.style.display = 'none'; taste.removeAttribute('controls');
  taste.play = function () { return w.play(); };
  taste.pause = function () { w.pause(); };

  function load(fid, label, autoplay) {
    cur = fid; frame(label); var v = w;
    return M.get(fid).then(function (mp4) {
      if (v !== w) return;
      var hq = M.hls && M.hls(fid);
      if (mp4) v.src = mp4;
      if (hq && window.APHQ) APHQ.wire(v, hq, mp4 || '');
      if (autoplay) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    });
  }
  load(id, taste.dataset.wholeLabel || 'The whole film', false);

  document.querySelectorAll('[data-film-member]').forEach(function (el) { el.textContent = el.getAttribute('data-film-member'); });
  document.querySelectorAll('[data-film-go]').forEach(function (el) { el.textContent = taste.dataset.wholeLabel || 'The whole film'; });
  document.querySelectorAll('[data-film-buy]').forEach(function (el) { el.hidden = true; el.style.display = 'none'; });
  var go = document.querySelector('[data-film-go]'); var gb = go && go.closest('button');
  if (gb) gb.setAttribute('aria-label', 'Watch ' + (taste.dataset.wholeLabel || 'the whole film'));

  // a second cut (Stone Breath's 22 minutes): two buttons to choose between them
  if (alt[0]) {
    var row = document.createElement('div'); row.className = 'acts film-cuts';
    [[id, taste.dataset.wholeLabel || 'The whole film'], [alt[0], alt[1] || 'The shorter cut']].forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (c[0] === id ? '' : ' ghost dark'); b.textContent = c[1];
      b.addEventListener('click', function () {
        row.querySelectorAll('button').forEach(function (x) { x.className = 'btn ghost dark'; }); b.className = 'btn';
        if (cur !== c[0]) load(c[0], c[1], true); else { var p = w.play(); if (p && p.catch) p.catch(function () {}); }
      });
      row.appendChild(b);
    });
    var holder = w.closest('.vid') || w.parentNode;
    holder.parentNode.insertBefore(row, holder.nextSibling);
  }
})();
