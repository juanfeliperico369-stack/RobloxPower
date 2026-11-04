// Genera íconos PWA y la imagen para compartir (compartir.png 1200×630) con el propio motor de dibujo del juego.
// Uso: node tools/build.js && node tools/assets.js && node tools/build.js
'use strict';
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, '../pwa');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, '../dist/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => document.fonts.ready);
  const icon = async (size, mask, opaque, file) => {
    const data = await p.evaluate(([size, mask, opaque]) => {
      const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), D = __bdp.draw, k = size / 512;
      g.fillStyle = '#0b0b0f'; g.fillRect(0, 0, size, size);
      g.fillStyle = 'rgba(224,38,47,.35)'; for (let y = 0; y < size; y += 10 * k) for (let x = (y / (10 * k) & 1) * 5 * k; x < size; x += 10 * k) g.fillRect(x, y, 2.4 * k, 2.4 * k);
      g.save(); g.translate(size / 2, size / 2); const s = (mask ? .78 : 1) * k; g.scale(s, s); g.lineWidth = 8; g.strokeStyle = '#0b0b0f'; g.lineJoin = 'round';
      D.star(g, 0, 0, 250, 165, 12, '#e0262f'); D.star(g, 0, 0, 185, 135, 10, '#f0b429');
      g.lineWidth = 12; g.strokeStyle = '#0b0b0f'; g.fillStyle = '#ffc23a';
      g.beginPath(); g.ellipse(0, 18, 150, 78, 0, 0, Math.PI * 2); g.ellipse(0, 18, 104, 44, 0, 0, Math.PI * 2, true); g.fill('evenodd'); g.stroke();
      g.beginPath(); g.ellipse(0, 18, 104, 44, 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#a8740c'; g.beginPath(); g.ellipse(0, 40, 150, 78, 0, 0.15, Math.PI - 0.15); g.ellipse(0, 18, 150, 78, 0, Math.PI - 0.15, 0.15, true); g.fill(); g.stroke();
      g.fillStyle = '#39c8ff'; g.beginPath(); g.moveTo(0, 30); g.lineTo(46, 86); g.lineTo(0, 140); g.lineTo(-46, 86); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-8, 64); g.lineTo(10, 64); g.lineTo(-2, 92); g.closePath(); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 9; g.lineCap = 'round'; [[-190, -120, -150, -80], [190, -120, 150, -80], [0, -205, 0, -150]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); });
      g.restore();
      return c.toDataURL('image/png');
    }, [size, mask, opaque]);
    fs.writeFileSync(path.join(OUT, file), Buffer.from(data.split(',')[1], 'base64'));
  };
  await icon(512, false, true, 'icon-512.png'); await icon(192, false, true, 'icon-192.png');
  await icon(512, true, true, 'icon-maskable-512.png'); await icon(180, false, true, 'apple-touch-icon.png'); await icon(32, false, true, 'favicon.png');
  // imagen para compartir (Open Graph) 1200×630
  await p.evaluate(() => {
    document.body.innerHTML = '<div id="og" style="position:fixed;inset:0;background:#0b0b0f;overflow:hidden;font-family:Cuerpo,sans-serif">' +
      '<canvas id="ogc" width="1200" height="630" style="position:absolute;inset:0"></canvas>' +
      '<div style="position:absolute;left:0;right:0;top:0;height:48px;background:#f0b429;border-bottom:5px solid #0b0b0f;display:flex;align-items:center;justify-content:space-between;padding:0 28px;font-weight:800;letter-spacing:.32em;font-size:15px;color:#0b0b0f">EDICIÓN Nº 1 · ÁNIMA<span style="background:#0b0b0f;color:#f0b429;padding:6px 14px">FUNCIONA SIN INTERNET</span></div>' +
      '<div style="position:absolute;left:44px;top:84px;width:640px">' +
      '<div style="font-family:Titulos;text-transform:uppercase;font-size:124px;line-height:.86;color:#fff;text-shadow:6px 6px 0 #e0262f,12px 12px 0 #0b0b0f">Brazaletes</div>' +
      '<div style="font-family:Titulos;text-transform:uppercase;font-size:104px;line-height:.9;color:transparent;-webkit-text-stroke:4px #f0b429">del Poder</div>' +
      '<div style="font-family:Georgia,serif;font-style:italic;font-size:34px;color:#ff2fb3;margin:14px 0 10px">¿Cuánto vale tu poder?</div>' +
      '<div style="font-family:Titulos;text-transform:uppercase;font-size:42px;line-height:.95;color:#2dffb3;text-shadow:3px 3px 0 #0b0b0f">Entrena · Forja · Sobrevive a la Noche</div></div>' +
      '<div style="position:absolute;left:0;right:0;bottom:0;height:62px;background:#e0262f;border-top:5px solid #0b0b0f;display:flex;align-items:center;justify-content:space-between;padding:0 28px;font-family:Titulos;font-size:28px;color:#fff;text-transform:uppercase">RPG de acción · Cómic & anime · Tycoon · Torneo<span style="border:3px solid #fff;padding:2px 10px;font-size:22px">7 a 25 años</span></div></div>';
    const c = document.getElementById('ogc'), g = c.getContext('2d'), D = __bdp.draw;
    g.fillStyle = 'rgba(224,38,47,.28)'; for (let y = 0; y < 630; y += 9) for (let x = (y / 9 & 1) * 4.5; x < 1200; x += 9) g.fillRect(x, y, 2.2, 2.2);
    g.lineWidth = 5; g.strokeStyle = '#0b0b0f'; D.star(g, 930, 330, 300, 190, 14, '#e0262f'); D.star(g, 930, 330, 215, 160, 10, '#f0b429');
    g.save(); g.translate(1060, 520); g.scale(5.2, 5.2); g.globalAlpha = .9; D.avatar(g, 0, 0, D.NPCL.vant, { dir: 0, mad: 1, aura: '#a42cff' }); g.restore();
    g.save(); g.translate(880, 560); g.scale(7.2, 7.2); D.avatar(g, 0, 0, { skin: '#e0ac69', shirt: '#e0262f', pants: '#1b1b22', hair: '#1b1b22' }, { dir: 0, atk: 1, el: '#39c8ff', aura: '#39c8ff' }); g.restore();
    D.ctext(g, '¡POW!', 720, 200, 64, '#f0b429', -.2);
  });
  await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(OUT, 'compartir.png') });
  await b.close();
  console.log('Íconos y compartir.png generados en pwa/');
})();
