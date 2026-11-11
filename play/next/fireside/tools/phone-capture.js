// Phone captures of By the Fire for _review: the page inside a 390 px iframe in headless Chromium,
// two stills (the room; a story playing) and a short film. Serve the repo root first, for example
//   python3 -m http.server 8765        (from the repo root)
//   node play/next/fireside/tools/phone-capture.js http://localhost:8765/play/next/fireside/
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const url = process.argv[2] || 'http://localhost:8765/play/next/fireside/';
const out = path.join(__dirname, '..', '_review');
const wrap = `<!doctype html><meta name="viewport" content="width=device-width">
<body style="margin:0;background:#000"><iframe src="${url}" style="border:0;width:390px;height:844px;display:block"></iframe>`;
(async () => {
  const browser = await chromium.launch();
  // stills at 2x
  let ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  let page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('page: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.setContent(wrap);
  const fr = page.frameLocator('iframe');
  await fr.locator('#stories li').first().waitFor();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(out, 'phone-390x844.png') });
  await fr.locator('#stories li button').first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(out, 'phone-390x844-listening.png') });
  await ctx.close();
  // laptop still
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page = await ctx.newPage();
  await page.goto(url); await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(out, 'laptop-1440x900.png') });
  await ctx.close();
  // the film: the room, the sound button, a story starting, a short scroll
  const vdir = fs.mkdtempSync(path.join(os.tmpdir(), 'fire-'));
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true,
                                   recordVideo: { dir: vdir, size: { width: 390, height: 844 } } });
  page = await ctx.newPage();
  await page.setContent(wrap);
  const f2 = page.frameLocator('iframe');
  await f2.locator('#stories li').first().waitFor();
  await page.waitForTimeout(8000);
  await f2.locator('#amb').click();
  await page.waitForTimeout(4000);
  await f2.locator('#stories li button').first().click();
  await page.waitForTimeout(7000);
  await page.mouse.move(195, 600); await page.mouse.wheel(0, 260);
  await page.waitForTimeout(3000);
  const video = page.video();
  await ctx.close();
  const webm = await video.path();
  fs.copyFileSync(webm, path.join(vdir, 'room-phone-2.webm'));
  console.log('webm', path.join(vdir, 'room-phone-2.webm'));
  console.log('errors', errors.length ? errors : 'none');
  await browser.close();
})();
