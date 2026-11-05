// Bot de QA: juega el HTML real en Chromium (Playwright), recorre todo y caza errores. Uso: node tools/bot.js [partidas=3]
'use strict';
const { chromium } = require('playwright'), http = require('http'), fs = require('fs'), path = require('path');
const RUNS = +process.argv[2] || 3, DIST = path.join(__dirname, '../dist'), SHOTS = process.env.SHOTS || '';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const srv = http.createServer((q, r) => {
  let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith(path.sep) || f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const problems = [];
const VIEWS = [{ width: 390, height: 844, isMobile: true, hasTouch: true }, { width: 844, height: 390, isMobile: true, hasTouch: true }, { width: 1280, height: 760 }];

async function run(b, i, port) {
  const V = VIEWS[i % 3];
  const ctx = await b.newContext({ viewport: { width: V.width, height: V.height }, isMobile: !!V.isMobile, hasTouch: !!V.hasTouch, deviceScaleFactor: 1, acceptDownloads: true });
  const p = await ctx.newPage(), errs = [], tag = 'partida ' + (i + 1);
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push('console: ' + m.text()); });
  const E = (f, a) => p.evaluate(f, a);
  const step = async (name, f) => { try { await f(); } catch (e) { errs.push(name + ': ' + e.message.split('\n')[0]); } };
  const flush = async () => { for (let k = 0; k < 40 && await E(() => __bdp.dlg); k++) { await E(() => __bdp.dlgNext()); await sleep(20); } };
  const shot = async n => { if (SHOTS && i === 0) await p.screenshot({ path: path.join(SHOTS, n) }); };

  await p.goto('http://localhost:' + port + '/'); await sleep(700);
  const origin = ['discipulo', 'mercader', 'superviviente'][i % 3], el = ['fuego', 'agua', 'rayo', 'tierra', 'viento'][i % 5];
  await step('crear', async () => {
    await p.click('#cvNew'); await p.fill('#crName', 'Bot' + (i + 1));
    await p.click('[data-o="' + origin + '"]'); await p.click('[data-e="' + el + '"]'); await p.click('[data-k="shirt"][data-i="' + (i % 8) + '"]');
    await p.click('#crGo'); await sleep(400); await flush();
  });
  await shot('bot-world.png');
  await step('mover y pelear', async () => {
    for (const k of ['w', 'd', 's', 'a']) { await p.keyboard.down(k); await sleep(350); await p.keyboard.press('j'); await p.keyboard.press('l'); await p.keyboard.up(k); }
    await p.keyboard.press('k'); await flush();
  });
  for (const z of ['plaza', 'dojo', 'forja', 'tierras', 'coliseo']) {
    await step('zona ' + z, async () => {
      await E(z => __bdp.go(z), z); await sleep(250); await flush();
      const inter = await E(() => __bdp.MAP.inter.filter(it => !it.when || it.when()).map(it => ({ id: it.id, x: it.x, y: it.y })));
      for (const it of inter) {
        await E(it => { const P = __bdp.P; P.x = it.x; P.y = it.y + 20; }, it); await sleep(120);
        await E(() => __bdp.interact()); await sleep(150); await flush(); await sleep(80); await flush();
        if (await E(() => !document.getElementById('mg').hidden)) {
          for (let t = 0; t < 14; t++) { await E(() => __bdp.mgAct('down')); await sleep(t % 3 ? 160 : 900); await E(() => __bdp.mgAct('up')); await sleep(120); }
          await E(() => __bdp.mgEnd());
        }
        if (await E(() => !document.getElementById('ov').hidden)) {
          const btns = await p.$$('#ov [data-a]:not([disabled])');
          for (const bt of btns.slice(0, 4)) {
            const a = await bt.getAttribute('data-a'); if (['close', 'reset', 'imp', 'tourGo', 'exp'].includes(a)) continue;
            try { await bt.click({ timeout: 800 }); } catch (e) { /* el panel se re-dibujó */ }
            await sleep(60);
          }
          await E(() => { if (!document.getElementById('ov').hidden) __bdp.close(); }); await flush();
          if (await E(() => !document.getElementById('mg').hidden)) { // minijuego abierto desde un panel (cocina)
            for (let t = 0; t < 10; t++) { await p.click('#mgB'); await sleep(400); const bb = await p.$('#mgc'); const bx = await bb.boundingBox(); await p.mouse.click(bx.x + bx.width * (t % 2 ? .75 : .25), bx.y + bx.height * (t % 3 ? .3 : .7)); await sleep(150); }
            await E(() => __bdp.mgEnd());
          }
        }
      }
      if (z === 'tierras') {
        for (let t = 0; t < 40; t++) {
          await E(() => { const P = __bdp.P, f = __bdp.ents().find(e => e.k === 'foe' && !e.dead); if (f && !P.dead) { P.x = f.x - 30; P.y = f.y; } __bdp.inp.atk = 1; if (Math.random() < .2) __bdp.inp.sk = 1; if (Math.random() < .2) __bdp.inp.dash = 1; });
          await sleep(90);
        }
        await shot('bot-tierras.png'); await flush();
      }
    });
  }
  await step('amigos y grupo', async () => {
    await E(() => __bdp.go('plaza')); await sleep(300); await flush();
    await E(() => { const b = __bdp.ents().find(e => e.k === 'bot'); if (b) { __bdp.P.x = b.x + 30; __bdp.P.y = b.y; } __bdp.chat('¿Amigos?'); }); await sleep(2200);
    await E(() => { if (!__bdp.S.friends.length) __bdp.C.addFriend(__bdp.S, 7); __bdp.panel('menu', 'amigos'); }); await sleep(150);
    await p.click('#ov [data-a="party"]'); await sleep(150); await E(() => __bdp.close());
    await E(() => __bdp.go('tierras')); await sleep(400); await flush();
    const n = await E(() => __bdp.ents().filter(e => e.k === 'ally').length); if (n < 1) errs.push('el aliado no apareció en Tierras');
    for (let t = 0; t < 30; t++) { await E(() => { const P = __bdp.P, f = __bdp.ents().find(e => e.k === 'foe' && !e.dead); if (f) { P.x = f.x - 40; P.y = f.y; } }); await sleep(100); }
    await p.click('#mini'); await sleep(100); await p.click('#mini');
  });
  await step('menú', async () => { for (const t of ['perfil', 'mis', 'amigos', 'clan', 'logros', 'codice', 'brz', 'rank', 'shop', 'cfg', 'guia']) { await E(t => __bdp.panel('menu', t), t); await sleep(80); } await E(() => __bdp.close()); });
  await step('torneo', async () => {
    await E(() => { __bdp.S.stats.fue += 150; __bdp.go('coliseo'); }); await sleep(200); await flush();
    await E(() => __bdp.tourStart()); await sleep(200); await p.click('#ov [data-a="cineOk"]'); await sleep(300);
    for (let t = 0; t < 25; t++) { await E(() => { __bdp.inp.atk = 1; __bdp.keys.d = Math.random() < .5 ? 1 : 0; __bdp.keys.w = Math.random() < .5 ? 1 : 0; }); await sleep(80); }
    await shot('bot-night.png');
    if (i % 3 === 2) await E(() => __bdp.hurtMe()); else await E(() => __bdp.nightSkip());
    for (let g = 0; g < 90; g++) {
      await sleep(250); await flush();
      const st = await E(() => { const b = document.querySelector('#ov [data-a]'); return { m: __bdp.mode, a: !document.getElementById('ov').hidden && b ? b.dataset.a : '' }; });
      if (st.a === 'strat') { await p.click('#ov [data-a="strat"]'); continue; }
      if (st.a === 'cineOk') { await p.click('#ov [data-a="cineOk"]'); continue; }
      if (st.a === 'resOk') { await shot('bot-result.png'); await p.click('#ov [data-a="resOk"]'); await sleep(500); await flush(); break; }
      if (st.m === 'duel') {
        for (let t = 0; t < 8; t++) { await E(() => { __bdp.inp.atk = 1; __bdp.inp.sk = 1; }); await sleep(60); }
        if (g < 8) await shot('bot-duel.png');
        if (g % 4 === 3 && i % 3 === 1) await E(() => __bdp.hurtMe()); else await E(() => __bdp.killOpp());
      }
    }
    const S = await E(() => ({ tours: __bdp.S.cnt.tours, pend: __bdp.S.pend, mode: __bdp.mode }));
    if (S.tours < 1 || S.pend) errs.push('el torneo no terminó bien: ' + JSON.stringify(S));
  });
  await step('guardar y recargar', async () => {
    const before = await E(() => { __bdp.save(); return { n: __bdp.S.name, p: __bdp.C.poder(__bdp.S), t: __bdp.S.cnt.tours }; });
    await p.reload(); await sleep(600); await p.click('#cvCont'); await sleep(400); await flush();
    const after = await E(() => ({ n: __bdp.S.name, p: __bdp.C.poder(__bdp.S), t: __bdp.S.cnt.tours, v: __bdp.C.validate(__bdp.S) }));
    if (after.n !== before.n || after.t !== before.t || Math.abs(after.p - before.p) > before.p * .05 + 2 || after.v.length) errs.push('carga distinta: ' + JSON.stringify([before, after]));
  });
  await step('exportar', async () => {
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }), E(() => __bdp.act('exp'))]);
    const j = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')); if (!j.name || !j.stats) errs.push('exportación inválida');
  });
  const fps = await E(() => new Promise(r => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(f); else r(Math.round(n / 1.5)); })(); }));
  errs.push(...(await E(() => __bdp.errors.slice())).map(e => 'juego: ' + e));
  const u = [...new Set(errs)];
  console.log((u.length ? '✖ ' : '✔ ') + tag + ' · ' + origin + '/' + el + ' · ' + V.width + 'x' + V.height + ' · ~' + fps + ' fps' + (u.length ? '\n   ' + u.slice(0, 8).join('\n   ') : ''));
  problems.push(...u.map(e => tag + ': ' + e));
  await ctx.close();
}

(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch();
  for (let i = 0; i < RUNS; i++) await run(b, i, port);
  const ctx = await b.newContext(), p = await ctx.newPage();
  await p.goto('http://localhost:' + port + '/'); await p.evaluate(() => navigator.serviceWorker.ready); await sleep(1000);
  await ctx.setOffline(true); await p.reload(); await sleep(600);
  const offOk = await p.evaluate(() => !!document.getElementById('cvNew'));
  console.log((offOk ? '✔' : '✖') + ' abre sin conexión (service worker)'); if (!offOk) problems.push('no abre offline');
  // celular modesto: CPU 4× más lenta, calidad baja
  const pc = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }), pp = await pc.newPage();
  const cdp = await pc.newCDPSession(pp); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await pp.goto('http://localhost:' + port + '/'); await sleep(800);
  await pp.click('#cvNew'); await pp.fill('#crName', 'Lento'); await pp.click('#crGo'); await sleep(600);
  const fpsOf = () => pp.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(Math.round(n / 2)); })(); }));
  const perf = {};
  for (const q of [1, 0]) {
    await pp.evaluate(q => { while (__bdp.dlg) __bdp.dlgNext(); if (__bdp.S.cfg.q !== q) __bdp.act('cfg', 'q'); __bdp.close(); __bdp.go('tierras'); }, q); await sleep(500); perf['tierras q' + q] = await fpsOf();
  }
  await pp.evaluate(() => { __bdp.S.stats.fue += 200; __bdp.tourStart(); }); await sleep(200); await pp.click('#ov [data-a="cineOk"]'); await sleep(500); perf['noche q0'] = await fpsOf();
  console.log('ℹ rendimiento con CPU 4× más lenta (fps): ' + JSON.stringify(perf));
  if (Math.min(...Object.values(perf)) < 24) problems.push('rendimiento bajo en celular modesto: ' + JSON.stringify(perf));
  await b.close(); srv.close();
  console.log(problems.length ? 'BOT: ' + problems.length + ' problema(s)' : 'BOT OK · ' + RUNS + ' partidas jugadas sin errores');
  process.exit(problems.length ? 1 : 0);
})();
