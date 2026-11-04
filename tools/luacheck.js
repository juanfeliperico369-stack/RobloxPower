// Revisión estática ligera de los .luau (sin ejecutar Luau): bloques function/if/do ↔ end, paréntesis y llaves,
// operadores de JavaScript colados (!=, &&, ||, ===, !x) y variables locales usadas sin declarar en Reglas.
// Uso: node tools/luacheck.js
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '../roblox/src');
const files = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.luau')) files.push(p); } })(ROOT);
let bad = 0;
function strip(src) { // quita comentarios y cadenas, conservando saltos de línea
  let out = '', i = 0;
  while (i < src.length) {
    if (src.startsWith('--[[', i)) { let j = src.indexOf(']]', i); if (j < 0) j = src.length; const seg = src.slice(i, j + 2); out += seg.replace(/[^\n]/g, ' '); i = j + 2; continue; }
    if (src.startsWith('--', i)) { while (i < src.length && src[i] !== '\n') { out += ' '; i++; } continue; }
    if (src[i] === '"' || src[i] === "'") { const q = src[i]; out += q; i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') { out += '  '; i += 2; continue; } out += src[i] === '\n' ? '\n' : ' '; i++; } out += q; i++; continue; }
    if (src.startsWith('[[', i)) { let j = src.indexOf(']]', i); if (j < 0) j = src.length; out += src.slice(i, j + 2).replace(/[^\n]/g, ' '); i = j + 2; continue; }
    out += src[i++];
  }
  return out;
}
for (const f of files) {
  const rel = path.relative(path.join(__dirname, '..'), f), src = fs.readFileSync(f, 'utf8'), code = strip(src), errs = [];
  const words = code.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
  let open = 0, close = 0; for (const w of words) { if (w === 'function' || w === 'do' || w === 'if' || w === 'repeat') open++; else if (w === 'end' || w === 'until') close++; }
  if (open !== close) errs.push('bloques abiertos ' + open + ' ≠ cerrados ' + close);
  const pairs = { '(': ')', '{': '}', '[': ']' }, st = [];
  for (let i = 0; i < code.length; i++) { const c = code[i]; if (pairs[c]) st.push([c, i]); else if (')}]'.includes(c)) { const t = st.pop(); if (!t || pairs[t[0]] !== c) { errs.push('“' + c + '” desbalanceado en línea ' + (code.slice(0, i).split('\n').length)); break; } } }
  if (st.length) errs.push('falta cerrar “' + st[st.length - 1][0] + '” de la línea ' + code.slice(0, st[st.length - 1][1]).split('\n').length);
  code.split('\n').forEach((l, n) => { if (/!=|&&|\|\||===|(^|[^~=<>])!\w|\bvar\b|\belse if\b|\bnull\b|\bundefined\b/.test(l)) errs.push('sintaxis JS en línea ' + (n + 1) + ': ' + l.trim().slice(0, 60)); });
  // cadenas de una línea mal cerradas
  src.split('\n').forEach((l, n) => { const s = strip(l); if ((s.match(/"/g) || []).length % 2) errs.push('comillas impares en línea ' + (n + 1)); });
  if (errs.length) { bad++; console.error('✖ ' + rel + '\n   ' + errs.slice(0, 8).join('\n   ')); } else console.log('✔ ' + rel);
}
// funciones de Reglas usadas en otros scripts deben existir
const reg = fs.readFileSync(path.join(ROOT, 'shared/Reglas.luau'), 'utf8'), defs = new Set([...reg.matchAll(/function Reglas\.(\w+)|Reglas\.(\w+)\s*=/g)].map(m => m[1] || m[2]));
for (const f of files) { const s = fs.readFileSync(f, 'utf8'); for (const m of s.matchAll(/Reglas\.(\w+)/g)) if (!defs.has(m[1]) && !['D', 'BLDI', 'STI', 'SIDEI', 'clamp', 'round', 'deepcopy', 'nowMs'].includes(m[1])) { bad++; console.error('✖ ' + path.basename(f) + ' usa Reglas.' + m[1] + ' que no existe'); } }
// las funciones del núcleo JS deben tener su par en Luau
const C = require('../src/core.js'), skip = new Set(['serialize', 'deserialize', 'clamp', 'pick']);
const miss = Object.keys(C).filter(k => typeof C[k] === 'function' && !defs.has(k) && !skip.has(k) && !['gauss', 'mulberry', 'fmt', 'today', 'botName', 'cleanName'].includes(k) ? !defs.has(k) : false);
if (miss.length) { bad++; console.error('✖ Faltan en Reglas.luau: ' + miss.join(', ')); }
console.log(bad ? 'LUACHECK: ' + bad + ' problema(s)' : 'LUACHECK OK · ' + files.length + ' archivos');
process.exit(bad ? 1 : 0);
