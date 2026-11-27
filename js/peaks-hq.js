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
  function attach(v, hls, mp4) {
    function fallback() { if (mp4 && v.getAttribute('src') !== mp4) { try { if (v._hls) v._hls.destroy(); } catch (e) {} v._hls = null; v.src = mp4; var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
    if (!hls) { if (mp4) v.src = mp4; return Promise.resolve(); }
    if (v.canPlayType('application/vnd.apple.mpegurl')) { v.src = hls; v.addEventListener('error', fallback, { once: true }); return Promise.resolve(); }
    return lib().then(function (H) {
      if (!H || !H.isSupported()) { if (mp4) v.src = mp4; return; }
      var h = new H({ capLevelToPlayerSize: true, startLevel: -1, abrEwmaDefaultEstimate: 4000000, maxBufferLength: 30 });
      h.on(H.Events.ERROR, function (e, d) { if (d && d.fatal) fallback(); });
      h.loadSource(hls); h.attachMedia(v); v._hls = h;
    }).catch(function () { if (mp4) v.src = mp4; });
  }
  window.APHQ = { attach: attach, warm: function () { if (!document.createElement('video').canPlayType('application/vnd.apple.mpegurl')) lib().catch(function () {}); } };
})();
