// Verifica el sitio publicado: carga, service worker activo, abre sin conexión, instalabilidad (Chrome) y archivos PWA.
// Uso: node tools/verify.js [url]
'use strict';
const { chromium } = require('playwright');
const URL = process.argv[2] || 'https://juanfeliperico369-stack.github.io/RobloxPower/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), p = await ctx.newPage();
  const errs = [], out = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const r = await p.goto(URL, { waitUntil: 'load' }); out.push(['Carga (HTTP ' + r.status() + ')', r.ok()]);
  await sleep(800);
  out.push(['Portada visible', await p.evaluate(() => !!document.getElementById('cvNew'))]);
  const sw = await p.evaluate(async () => { const reg = await navigator.serviceWorker.ready; return { active: !!reg.active, state: reg.active && reg.active.state, scope: reg.scope }; });
  out.push(['Service worker activo (' + sw.state + ')', sw.active && sw.state === 'activated']);
  const keys = await p.evaluate(async () => (await caches.keys()));
  out.push(['Caché propia: ' + keys.join(','), keys.some(k => k.indexOf('brazaletes-del-poder-v') === 0)]);
  const cdp = await ctx.newCDPSession(p);
  const inst = await cdp.send('Page.getInstallabilityErrors');
  out.push(['Chrome: errores de instalabilidad = ' + (inst.installabilityErrors.map(e => e.errorId).join(',') || 'ninguno'), inst.installabilityErrors.length === 0]);
  const man = await cdp.send('Page.getAppManifest');
  out.push(['Manifest sin errores' + (man.errors.length ? ': ' + man.errors.map(e => e.message).join('; ') : ''), man.errors.length === 0]);
  const meta = await p.evaluate(() => ({ og: document.querySelector('meta[property="og:image"]').content, ogu: document.querySelector('meta[property="og:url"]').content, cap: !!document.querySelector('meta[name="apple-mobile-web-app-capable"]'), tit: !!document.querySelector('meta[name="apple-mobile-web-app-title"]'), vp: document.querySelector('meta[name="viewport"]').content, ati: document.querySelector('link[rel="apple-touch-icon"]').getAttribute('href') }));
  out.push(['Open Graph absoluto (' + meta.og + ')', /^https:\/\//.test(meta.og) && /^https:\/\//.test(meta.ogu)]);
  out.push(['Metas iPhone + viewport-fit=cover', meta.cap && meta.tit && /viewport-fit=cover/.test(meta.vp) && !/^data:/.test(meta.ati)]);
  for (const f of ['manifest.webmanifest', 'sw.js', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon.png', 'compartir.png', '.nojekyll']) {
    const s = await p.evaluate(async u => (await fetch(u, { cache: 'no-store' })).status, URL + f); out.push(['Archivo ' + f + ' (' + s + ')', s === 200]);
  }
  await ctx.setOffline(true); await p.reload({ waitUntil: 'load' }); await sleep(800);
  out.push(['Abre SIN conexión', await p.evaluate(() => !!document.getElementById('cvNew'))]);
  await p.click('#cvNew'); await p.fill('#crName', 'Offline'); await p.click('#crGo'); await sleep(800);
  out.push(['Se puede jugar sin conexión', await p.evaluate(() => __bdp.mode === 'world' && __bdp.errors.length === 0)]);
  out.push(['Sin errores en consola' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''), errs.length === 0]);
  await b.close();
  let bad = 0; out.forEach(([t, ok]) => { if (!ok) bad++; console.log((ok ? '✔ ' : '✖ ') + t); });
  console.log(bad ? 'VERIFY: ' + bad + ' problema(s)' : 'VERIFY OK · ' + URL);
  process.exit(bad ? 1 : 0);
})();
