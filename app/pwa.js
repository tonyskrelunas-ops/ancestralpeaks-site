/* Ancestral Peaks on the phone: register the app, offer "Add to Home Screen" once, quietly. */
(function () {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(function () {});
  var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) return;
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var set = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  if (get('peaks-app-hint') === 'done') return;
  var visits = (Number(get('peaks-visits')) || 0) + 1; set('peaks-visits', String(visits));
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  var deferred = null;
  function banner(html, onAdd) {
    var b = document.createElement('div');
    b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Add Ancestral Peaks to your phone');
    b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9999;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;background:rgba(16,11,13,.94);color:#F3EFE5;font:500 15px/1.35 Georgia,serif;box-shadow:0 18px 40px rgba(0,0,0,.45)';
    b.innerHTML = '<img src="/app/icon-192.png" alt="" width="44" height="44" style="border-radius:11px;flex:none">' +
      '<div style="flex:1">' + html + '</div>' +
      (onAdd ? '<button type="button" data-add style="flex:none;border:0;border-radius:999px;padding:9px 14px;background:#D1A63C;color:#100B0D;font:600 14px system-ui">Add</button>' : '') +
      '<button type="button" data-x aria-label="Not now" style="flex:none;border:0;background:none;color:#F3EFE5;font-size:22px;line-height:1;padding:4px 6px">×</button>';
    document.body.appendChild(b);
    b.querySelector('[data-x]').onclick = function () { set('peaks-app-hint', 'done'); b.remove(); };
    if (onAdd) b.querySelector('[data-add]').onclick = function () { onAdd(); set('peaks-app-hint', 'done'); b.remove(); };
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    if (visits >= 2) banner('<b>Keep Ancestral Peaks on your phone.</b><br>The sessions, one tap away.', function () { deferred.prompt(); });
  });
  if (ios && visits >= 2) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        banner('<b>Keep Ancestral Peaks on your phone.</b><br>Tap <span aria-label="Share">Share</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v8h14v-8"/></svg>, then <b>Add to Home Screen</b>.', null);
      }, 4000);
    });
  }
})();
