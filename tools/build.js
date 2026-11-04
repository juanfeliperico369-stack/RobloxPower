// Construye dist/index.html (un solo archivo, offline) + archivos PWA. Uso: node tools/build.js
'use strict';
const fs = require('fs'), path = require('path');
const R = p => path.join(__dirname, '..', p), rd = p => fs.readFileSync(R(p), 'utf8');
const core = rd('src/core.js'), VER = (core.match(/VERSION = '([^']+)'/) || [])[1];
const SITE = 'https://juanfeliperico369-stack.github.io/RobloxPower/';
const css = rd('src/style.css')
  .replace('{{FONT_TITULOS}}', fs.readFileSync(R('src/fonts/titulos.woff')).toString('base64'))
  .replace('{{FONT_CUERPO}}', fs.readFileSync(R('src/fonts/cuerpo.woff2')).toString('base64'));
const game = "(function(){'use strict';\n" + rd('src/game.js') + '\n' + rd('src/ui.js') + '\n})();';
const html = rd('src/shell.html').split('{{SITE}}').join(SITE).replace('{{CSS}}', () => css).replace('{{CORE}}', () => core).replace('{{GAME}}', () => game);
fs.mkdirSync(R('dist'), { recursive: true });
fs.writeFileSync(R('dist/index.html'), html);
fs.writeFileSync(R('dist/sw.js'), rd('pwa/sw.js').replace('{{VER}}', VER));
fs.copyFileSync(R('pwa/manifest.webmanifest'), R('dist/manifest.webmanifest'));
fs.writeFileSync(R('dist/.nojekyll'), '');
for (const f of fs.readdirSync(R('pwa'))) if (/\.png$/.test(f)) fs.copyFileSync(R('pwa/' + f), R('dist/' + f));
console.log('dist/index.html', (html.length / 1024).toFixed(0) + ' KB · versión ' + VER);
