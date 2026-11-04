// Verificador estático: sintaxis (acorn) + llamadas/identificadores no declarados. Uso: node tools/check.js
'use strict';
const fs = require('fs'), path = require('path'), acorn = require('acorn'), walk = require('acorn-walk');
let bad = 0;
const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const GLOBALS = new Set(('window document navigator location console Math Date JSON Array Object String Number Boolean Promise Set Map Blob URL FileReader ' +
  'setTimeout clearTimeout setInterval clearInterval requestAnimationFrame performance localStorage confirm alert isFinite parseInt parseFloat isNaN ' +
  'matchMedia innerWidth innerHeight devicePixelRatio AudioContext caches self fetch module globalThis Uint8Array Error undefined NaN Infinity arguments ' +
  'addEventListener getComputedStyle structuredClone').split(' '));
scripts.forEach((src, i) => {
  let ast;
  try { ast = acorn.parse(src, { ecmaVersion: 2020, locations: true }); } catch (e) { bad++; console.error('SINTAXIS script', i, e.message); return; }
  const decl = new Set();
  walk.full(ast, n => {
    if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression') { if (n.id) decl.add(n.id.name); n.params.forEach(p => p.type === 'Identifier' && decl.add(p.name)); }
    if (n.type === 'ArrowFunctionExpression') n.params.forEach(p => p.type === 'Identifier' && decl.add(p.name));
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier') decl.add(n.id.name);
    if (n.type === 'CatchClause' && n.param) decl.add(n.param.name);
  });
  const miss = new Map();
  walk.ancestor(ast, { Identifier(n, anc) {
    const p = anc[anc.length - 2];
    if (p && p.type === 'MemberExpression' && p.property === n && !p.computed) return;
    if (p && p.type === 'Property' && p.key === n && !p.computed) return;
    if (p && (p.type === 'MethodDefinition')) return;
    if (decl.has(n.name) || GLOBALS.has(n.name)) return;
    miss.set(n.name, n.loc.start.line);
  } });
  if (miss.size) { bad++; console.error('NO DECLARADOS en script', i, [...miss].map(([k, l]) => k + '@' + l).join(', ')); }
});
try { acorn.parse(fs.readFileSync(path.join(__dirname, '../pwa/sw.js'), 'utf8'), { ecmaVersion: 2020 }); } catch (e) { bad++; console.error('sw.js', e.message); }
try { JSON.parse(fs.readFileSync(path.join(__dirname, '../pwa/manifest.webmanifest'), 'utf8')); } catch (e) { bad++; console.error('manifest inválido', e.message); }
console.log(bad ? 'CHECK: ' + bad + ' problema(s)' : 'CHECK OK · ' + scripts.length + ' scripts, sin identificadores sin declarar');
process.exit(bad ? 1 : 0);
