/* 11/26 TOP-QUALITY FILMS (Tony: "everything all films and pics can be top quality"). Each film lives on Hostinger
   (members.ancestralpeaks.com/p/films/...) in 1080p, 720p and 480p, made from the full-quality master. The phone or
   computer starts at once and climbs to the best picture its connection holds. iPhone, iPad and Safari play it on their
   own; other browsers get hls.js from cdnjs. If anything fails, the earlier MP4 plays, so a film never stops working. */
(function () {
  var HLSJS = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js', loading = null;
  function lib() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (!loading) loading = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = HLSJS; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = function () { res(window.Hls); }; s.onerror = function () { loading = null; rej(); };
      document.head.appendChild(s);
    });
    return loading;
  }
  /* for checking by hand: add ?hq=js to a page's address to use hls.js even where the browser plays HLS itself, ?hq=off for the MP4 only */
  var MODE = (location.search.match(/[?&]hq=(js|off)\b/) || [])[1];
  function nativeHls(v) { return MODE !== 'js' && !!v.canPlayType('application/vnd.apple.mpegurl'); }
  function fallbackFor(v, mp4) {
    return function () { if (v._hqOff) return; if (mp4 && v.getAttribute('src') !== mp4) { try { if (v._hls) v._hls.destroy(); } catch (e) {} v._hls = null; v.src = mp4; var p = v.play(); if (p && p.catch) p.catch(function () {}); } };
  }
  function mse(H, v, hls, mp4, at) {   // hls.js on this <video>, starting at `at` seconds when given
    var fallback = fallbackFor(v, mp4);
    var h = new H({ capLevelToPlayerSize: true, startLevel: -1, abrEwmaDefaultEstimate: 4000000, maxBufferLength: 30, startPosition: at > 0 ? at : -1 });
    h.on(H.Events.ERROR, function (e, d) { if (d && d.fatal) fallback(); });
    h.loadSource(hls); h.attachMedia(v); v._hls = h;
  }
  function attach(v, hls, mp4) {
    if (!hls || MODE === 'off') { if (mp4) v.src = mp4; return Promise.resolve(); }
    if (nativeHls(v)) { v.src = hls; v.addEventListener('error', fallbackFor(v, mp4), { once: true }); return Promise.resolve(); }
    return lib().then(function (H) {
      if (!H || !H.isSupported()) { if (mp4) v.src = mp4; return; }
      mse(H, v, hls, mp4, 0);
    }).catch(function () { if (mp4) v.src = mp4; });
  }
  /* For a <video> that already has its MP4 as src (or <source>): iPhone, iPad and Safari get the top-quality film at once;
     other browsers keep the MP4 untouched until the visitor presses play, then the top-quality film takes over at the
     same moment. If hls.js has not arrived by then, the MP4 simply plays. Nothing is fetched before play. */
  function wire(v, hls, mp4) {
    if (v._hq || !hls || MODE === 'off') return; v._hq = 1;
    function own() { var so = v.querySelector('source'); return mp4 || v.getAttribute('src') || (so && so.getAttribute('src')) || ''; }
    if (nativeHls(v)) { attach(v, hls, own()); return; }
    lib().catch(function () {});
    v.addEventListener('play', function first() {
      v.removeEventListener('play', first);
      var H = window.Hls; if (v._hqOff || v._hls || !H || !H.isSupported()) return;
      var m = own(), at = v.currentTime || 0;
      mse(H, v, hls, m, at);
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
  }
  /* Any <video data-hls="…/master.m3u8"> on a page is wired by itself. */
  function auto() { var vs = document.querySelectorAll('video[data-hls]'); for (var i = 0; i < vs.length; i++) wire(vs[i], vs[i].dataset.hls); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  /* hand the <video> back (the members' whole films use the same frame as the taste) */
  function release(v) { v._hqOff = true; try { if (v._hls) v._hls.destroy(); } catch (e) {} v._hls = null; }
  window.APHQ = { attach: attach, wire: wire, auto: auto, release: release, native: nativeHls, warm: function () { if (!document.createElement('video').canPlayType('application/vnd.apple.mpegurl')) lib().catch(function () {}); } };
})();
