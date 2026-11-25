# Builds the review copy of the business-plan site as files that sit BESIDE the live pages:
#   /next.html, /listen/next.html, /founding/next.html …   plus shared/site.next.js, shared/site.next.css, js/peaks-capture.next.js, css/plan.css
# A review page lives in the same folder as its live page, so every picture, film and sound resolves exactly as it does live.
# Nothing that is live is changed. Every review page is kept out of search engines.
import os, re, json, shutil, sys
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else SITE      # with no argument the review files are written into the site itself
PAGES = ['index.html', 'begin/index.html', 'books/index.html', 'course/index.html', 'films/index.html', 'first-light/index.html', 'founding/index.html',
         'gift/index.html', 'listen/index.html', 'mountain-within/index.html', 'mountain-within/a-good-relationship-with-stress/index.html',
         'mountain-within/guide/index.html', 'mountain-within/leaving-home/index.html', 'mountain-within/the-hard-day/index.html', 'play/index.html',
         'practice/index.html', 'reader/index.html', 'reading/index.html', 'weeks/index.html', 'why/index.html', 'work/index.html']
DIRS = sorted('/' + (os.path.dirname(p) + '/' if os.path.dirname(p) else '') for p in PAGES)
HEAD_ADD = '<script>try{sessionStorage.setItem("ap.founding.peek","1")}catch(e){}</script>   <!-- review copy: the founding season shows, so it can be looked at before November 27 -->\n'
FIXER = '''<script>
/* REVIEW COPY ONLY. Links to pages that have a review copy lead to that copy, so a visitor who is reviewing stays in the review. */
(function(){
  var M = %s;
  function fix(){
    var as = document.querySelectorAll('a[href]');
    for (var i = 0; i < as.length; i++) {
      var a = as[i], u; try { u = new URL(a.href); } catch (e) { continue; }
      if (u.origin !== location.origin) continue;
      var p = u.pathname.replace(/index\\.html$/, '');
      if (M.indexOf(p) < 0) continue;
      a.href = p + 'next.html' + u.search + u.hash;
    }
  }
  fix();
  if (window.MutationObserver) { var t = 0; new MutationObserver(function(){ clearTimeout(t); t = setTimeout(fix, 60); }).observe(document.body, { childList: true, subtree: true }); }
  var c = document.createElement('div'); c.textContent = 'Review copy';
  c.style.cssText = 'position:fixed;z-index:57;left:10px;bottom:calc(' + (document.querySelector('.ap-thumb') ? '128px' : '12px') + ' + env(safe-area-inset-bottom,0px));padding:.25em .7em;border-radius:99px;background:rgba(16,11,13,.86);border:1px solid rgba(209,166,60,.8);color:#fff;font:700 11px/1.4 system-ui,sans-serif;pointer-events:none';
  document.body.appendChild(c);
})();
</script>
''' % json.dumps(DIRS)
def w(rel, text):
    f = os.path.join(OUT, rel); os.makedirs(os.path.dirname(f), exist_ok=True); open(f, 'w', encoding='utf-8').write(text)
if os.path.isdir(OUT) and os.path.abspath(OUT) != SITE: shutil.rmtree(OUT)
n = 0
for p in PAGES:
    s = open(os.path.join(SITE, p), encoding='utf-8').read()
    s, a = re.subn(r'shared/site\.js', 'shared/site.next.js', s)
    s, b = re.subn(r'shared/site\.css', 'shared/site.next.css', s)
    s, c = re.subn(r'js/peaks-capture\.js', 'js/peaks-capture.next.js', s)
    assert a >= 1 and b >= 1, (p, a, b)
    if 'name="robots"' not in s:
        assert s.count('<meta charset="utf-8">') == 1, p
        s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex">')
    assert s.count('</head>') == 1 and s.count('</body>') == 1, p
    s = s.replace('</head>', HEAD_ADD + '</head>').replace('</body>', FIXER + '</body>')
    w(os.path.join(os.path.dirname(p), 'next.html'), s); n += 1
js = open(os.path.join(SITE, 'shared/site.js'), encoding='utf-8').read()
assert js.count("AP.href('/js/peaks-capture.js?v=1125c')") == 1
w('shared/site.next.js', js.replace("AP.href('/js/peaks-capture.js?v=1125c')", "AP.href('/js/peaks-capture.next.js?v=1125c')"))
for src, dst in (('shared/site.css', 'shared/site.next.css'), ('js/peaks-capture.js', 'js/peaks-capture.next.js')):
    w(dst, open(os.path.join(SITE, src), encoding='utf-8').read())
print('review pages written:', n, '(plus shared/site.next.js, shared/site.next.css, js/peaks-capture.next.js)')
