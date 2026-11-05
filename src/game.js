/* BRAZALETES DEL PODER · motor: mapas, entidades, render cómic, combate, torneo.
   Se concatena con ui.js dentro de un mismo IIFE (ver tools/build.js). */
var C = window.BDP, S = null, $ = function (id) { return document.getElementById(id); };
var T = 40, INK = '#0b0b0f', PAP = '#f2e8d5', TAU = Math.PI * 2;
var cv = $('cv'), ctx = cv.getContext('2d'), W = 1, H = 1, DPR = 1, Z = 1;
var cam = { x: 0, y: 0, sh: 0 }, MAP = null, ents = [], fx = [], P = null;
var mode = 'off', paused = 0, hitstop = 0, time = 0, lastTs = 0;
var keys = {}, joy = { id: -1, ox: 0, oy: 0, x: 0, y: 0 }, inp = { atk: 0, sk: 0, dash: 0, hold: 0 };
var errors = [], TR = null, curInter = null, spawnT = 0, botChatT = 0;
window.addEventListener('error', function (e) { errors.push(String(e.message || e)); });
window.addEventListener('unhandledrejection', function (e) { errors.push('promesa: ' + String(e.reason)); });

/* ---------- utilidades ---------- */
function rnd(a, b) { return a + Math.random() * (b - a); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function shade(hex, k) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; k = k || .7; return 'rgb(' + (r * k | 0) + ',' + (g * k | 0) + ',' + (b * k | 0) + ')'; }
function hsl(h, s, l) { return 'hsl(' + h + ',' + s + '%,' + l + '%)'; }
function vib(ms) { if (S && S.cfg.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } }

/* ---------- audio sintetizado (sin archivos) ---------- */
var AC = null, MST = null, NBUF = null, mus = { on: 0, step: 0, next: 0, zone: '' };
function au() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); MST = AC.createGain(); MST.gain.value = .55; MST.connect(AC.destination); var n = AC.sampleRate; NBUF = AC.createBuffer(1, n, n); var d = NBUF.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume();
}
function tone(f, d, type, vol, slide, at) {
  if (!AC || !S || !S.cfg.snd) return;
  var t = at || AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + d);
  g.gain.setValueAtTime(vol || .15, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(MST); o.start(t); o.stop(t + d + .03);
}
function noise(d, vol, fc, q) {
  if (!AC || !S || !S.cfg.snd) return;
  var t = AC.currentTime, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = NBUF; f.type = 'bandpass'; f.frequency.value = fc || 1000; f.Q.value = q || 1;
  g.gain.setValueAtTime(vol || .2, t); g.gain.exponentialRampToValueAtTime(.001, t + d); s.connect(f); f.connect(g); g.connect(MST); s.start(t); s.stop(t + d + .03);
}
var SFX = {
  swing: function () { noise(.09, .12, 2600, .8); }, hit: function () { noise(.1, .3, 700); tone(150, .12, 'square', .12, 60); },
  crit: function () { noise(.16, .4, 500); tone(90, .25, 'sawtooth', .18, 40); }, hurt: function () { tone(240, .22, 'sawtooth', .16, 80); },
  coin: function () { tone(988, .06, 'square', .07); tone(1318, .12, 'square', .07, 0, AC && AC.currentTime + .06); },
  up: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, .16, 'square', .09, 0, AC && AC.currentTime + i * .08); }); },
  dash: function () { noise(.16, .14, 4200, .6); }, skill: function () { tone(260, .45, 'sawtooth', .14, 900); noise(.3, .18, 1500); },
  ui: function () { tone(700, .04, 'square', .05); }, beat: function () { tone(70, .16, 'sine', .45, 40); },
  scare: function () { noise(.6, .22, 260, 2); tone(95, .7, 'sawtooth', .12, 45); }, ko: function () { tone(400, .6, 'square', .12, 60); noise(.5, .25, 400); },
  win: function () { [523, 659, 784, 1046, 784, 1046].forEach(function (f, i) { tone(f, .2, 'square', .08, 0, AC && AC.currentTime + i * .11); }); },
  step: function () { noise(.03, .03, 300); }
};
function sfx(n) { try { if (AC && SFX[n]) SFX[n](); } catch (e) { } }
var SCALES = { plaza: [0, 2, 4, 7, 9], dojo: [0, 3, 5, 7, 10], forja: [0, 2, 4, 5, 7], tierras: [0, 1, 5, 7, 8], coliseo: [0, 3, 6, 7, 10], night: [0, 1, 6], duel: [0, 3, 5, 6, 7] };
var ROOTS = { plaza: 220, dojo: 196, forja: 233, tierras: 174.6, coliseo: 164.8, night: 110, duel: 146.8 };
function musicTick() {
  if (!AC || !S || !S.cfg.mus || !MAP) return;
  var z = MAP.id, sc = SCALES[z] || SCALES.plaza, rt = ROOTS[z] || 220, spb = z === 'duel' ? .14 : z === 'night' ? .5 : .2;
  if (mus.zone !== z) { mus.zone = z; mus.next = AC.currentTime + .1; mus.step = 0; }
  while (mus.next < AC.currentTime + .3) {
    var st = mus.step++, t = mus.next; mus.next += spb;
    if (z === 'night') { if (st % 4 === 0) tone(rt / 2, 1.6, 'sine', .05, 0, t); if (st % 8 === 3) tone(rt * 1.414, .6, 'triangle', .015, rt, t); continue; }
    if (st % 4 === 0) tone(rt / 2 * Math.pow(2, sc[(st >> 4) % sc.length] / 12), spb * 3, 'triangle', .05, 0, t);
    var h = (Math.sin(st * 12.9898 + rt) * 43758.5453) % 1; h = h < 0 ? -h : h;
    if (h < .55) tone(rt * Math.pow(2, (sc[(h * 97 | 0) % sc.length] + 12 * ((h * 7 | 0) % 2)) / 12), spb * .9, 'square', .018, 0, t);
  }
}

/* ---------- temas por zona ---------- */
var TH = {
  plaza:   { f: ['#ddd0b3', '#d3c5a5'], p: '#b8a583', w: ['#0f5c66', '#08343b'], tr: ['#3f9a5a', '#25693b'], wa: '#39c8ff', bg: '#08343b' },
  dojo:    { f: ['#d2a457', '#c99c4f'], p: '#a97b36', w: ['#e0262f', '#8a1219'], tr: ['#ff8fb8', '#d0558a'], wa: '#5fd4ff', alt: '#0f5c66', bg: '#3a1a0c' },
  forja:   { f: ['#8a4535', '#80402f'], p: '#5e2b21', w: ['#3a3a46', '#1c1c24'], tr: ['#6b8f3a', '#46642a'], wa: '#ff7a2e', alt: '#a8740c', bg: '#1c1c24' },
  tierras: { f: ['#c9ab72', '#c2a36b'], p: '#a8875a', w: ['#6b5a4a', '#43372c'], tr: ['#7a6a55', '#54473a'], wa: '#5aa0b0', bg: '#2a2018', rf: [['#c9ab72', '#c2a36b'], ['#b38457', '#a97c50'], ['#7d5444', '#734c3d']] },
  coliseo: { f: ['#2d3249', '#293044'], p: '#3c4466', w: ['#a42cff', '#4d1785'], tr: ['#2f6f5a', '#1d4a3b'], wa: '#39c8ff', bg: '#100a1c' },
  night:   { f: ['#1a1524', '#16121f'], p: '#221c2f', w: ['#2c2542', '#16121f'], tr: ['#222', '#111'], wa: '#223', bg: '#000' },
  duel:    { f: ['#6a2a22', '#62261f'], p: '#7a3328', w: ['#26262e', '#0b0b0f'], tr: ['#222', '#111'], wa: '#223', bg: '#0b0b0f' }
};
var NPCZ = { ren: 'dojo', tobias: 'forja', kira: 'tierras', pip: 'plaza', heraldo: 'coliseo', dax: 'tierras', nima: 'plaza', sol: 'plaza', vant: 'coliseo' };
var NPCL = {
  ren: { skin: '#f5d0a9', shirt: '#e0262f', pants: '#1b1b22', hair: '#1b1b22', bun: 1 },
  tobias: { skin: '#c68642', shirt: '#7a4a2a', pants: '#33333d', hair: '#d6dee9', beard: 1 },
  kira: { skin: '#e0ac69', shirt: '#0f5c66', pants: '#43372c', hair: '#e0262f', scarf: '#2dffb3' },
  pip: { skin: '#ffdbac', shirt: '#39c8ff', pants: '#f0b429', hair: '#5a3825', cap: '#e0262f', sc: .82 },
  heraldo: { skin: '#f5d0a9', shirt: '#f2e8d5', pants: '#d6c9a8', hair: '#f0b429', robe: 1 },
  vant: { skin: '#e8dcff', shirt: '#1b1b22', pants: '#1b1b22', hair: '#f2e8d5', cape: '#a42cff', crown: 1, sc: 1.15 },
  dax: { skin: '#8d5524', shirt: '#ff2fb3', pants: '#1b1b22', hair: '#1b1b22', scarf: '#1b1b22' },
  nima: { skin: '#c68642', shirt: '#fff1a8', pants: '#e8d98a', hair: '#f2e8d5', robe: 1, hood: '#0f5c66' },
  sol: { skin: '#e0ac69', shirt: '#f0b429', pants: '#0f5c66', hair: '#e0262f', cape: '#e0262f', scarf: '#0f5c66' },
  nar: { skin: '#f2e8d5', shirt: '#0b0b0f', pants: '#0b0b0f', hair: '#0b0b0f' }
};
function playerLook() {
  return { skin: C.LOOK.skin[S.look.skin], shirt: C.LOOK.shirt[S.look.shirt], pants: S.look.shirt === 7 ? '#33333d' : '#1b1b22', hair: C.LOOK.hair[S.look.hair], cape: S.cos.capa ? '#a42cff' : 0 };
}
function botLook(h) { return { skin: C.LOOK.skin[h % 5], shirt: hsl(h, 70, 50), pants: hsl((h + 180) % 360, 25, 22), hair: C.LOOK.hair[h % 6], cap: h % 4 === 0 ? hsl((h + 90) % 360, 70, 45) : 0 }; }
function brzColor() { return C.EL[C.eqB(S).el].c; }

/* ---------- construcción de mapas ---------- */
function newMap(id, w, h, th) { return { id: id, w: w, h: h, th: TH[th || id], g: new Uint8Array(w * h), objs: [], inter: [], portals: [], arrive: {}, npcs: [], spawn: { x: w * T / 2, y: h * T / 2 } }; }
function tAt(m, x, y) { return (x < 0 || y < 0 || x >= m.w || y >= m.h) ? 9 : m.g[y * m.w + x]; }
function tSet(m, x, y, v) { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.g[y * m.w + x] = v; }
function tRect(m, x, y, w, h, v) { for (var j = y; j < y + h; j++) for (var i = x; i < x + w; i++) tSet(m, i, j, v); }
function isSolid(m, x, y) { var v = tAt(m, x, y); return v === 2 || v >= 8; }
function block(m, x, y, w, h, z, cols, ex) { tRect(m, x, y, w, h, 8); var o = { t: 'blk', x: x, y: y, w: w, h: h, z: z, c: cols || m.th.w, k: (y + h) * T }; for (var q in ex || {}) o[q] = ex[q]; m.objs.push(o); return o; }
function wallRuns(m, test, z, cols) {
  for (var j = 0; j < m.h; j++) { var s = -1; for (var i = 0; i <= m.w; i++) { var w = i < m.w && test(i, j); if (w && s < 0) s = i; if (!w && s >= 0) { block(m, s, j, i - s, 1, z, cols); s = -1; } } }
}
function border(m, open) {
  var isOpen = function (i, j) { for (var k = 0; k < open.length; k++) if (Math.abs(open[k][0] - i) <= 1 && Math.abs(open[k][1] - j) <= 1) return true; return false; };
  wallRuns(m, function (i, j) { return (i === 0 || j === 0 || i === m.w - 1 || j === m.h - 1) && !isOpen(i, j); }, 34);
  open.forEach(function (o) { tSet(m, o[0], o[1], 9); for (var d = -1; d <= 1; d++) { if (o[0] === 0 || o[0] === m.w - 1) tSet(m, o[0], o[1] + d, 9); else tSet(m, o[0] + d, o[1], 9); } });
}
function tree(m, x, y, s) { tSet(m, x, y, 8); m.objs.push({ t: 'tree', x: (x + .5) * T, y: (y + .8) * T, k: (y + .8) * T, s: s || 1 }); }
function rock(m, x, y, s) { tSet(m, x, y, 8); m.objs.push({ t: 'rock', x: (x + .5) * T, y: (y + .75) * T, k: (y + .75) * T, s: s || 1, v: Math.random() }); }
function deco(m, d, x, y, ex) { var o = { t: 'deco', d: d, x: (x + .5) * T, y: (y + .7) * T, k: (y + .7) * T }; for (var q in ex || {}) o[q] = ex[q]; m.objs.push(o); return o; }
function inter(m, id, x, y, label, act, when) { var it = { id: id, x: x, y: y, label: label, act: act, when: when }; m.inter.push(it); return it; }
function station(m, kind, x, y, label) { tSet(m, x, y, 8); var o = deco(m, kind, x, y); inter(m, kind, (x + .5) * T, (y + 1.3) * T, label, function () { mgStart(kind); }); return o; }
function portal(m, x, y, to, side) {
  var px = (x + .5) * T, py = (y + .5) * T, nx = side === 'W' ? 1 : side === 'E' ? -1 : 0, ny = side === 'N' ? 1 : side === 'S' ? -1 : 0;
  m.portals.push({ x: px, y: py, to: to }); m.arrive[to] = { x: px + nx * T * 1.6, y: py + ny * T * 1.6 };
  m.objs.push({ t: 'portal', x: px, y: py, k: -1, to: to, floor: 1 });
}
function npc(m, key, x, y, when) {
  var e = { k: 'npc', key: key, x: (x + .5) * T, y: (y + .6) * T, r: 13, dir: 0, look: NPCL[key], when: when, walk: 0 };
  m.npcs.push(e);
  inter(m, 'npc:' + key, e.x, e.y, 'HABLAR · ' + C.NPC[key].n, function () { talkTo(key); }, when);
}
function scatter(m, R, n, fn, x0, y0, x1, y1, avoid) {
  for (var k = 0, tries = 0; k < n && tries < n * 30; tries++) {
    var x = x0 + Math.floor(R() * (x1 - x0)), y = y0 + Math.floor(R() * (y1 - y0));
    if (tAt(m, x, y) !== 0 || tAt(m, x, y + 1) === 9) continue;
    var near = false; for (var i = 0; i < m.inter.length; i++) if (Math.abs(m.inter[i].x / T - x) < 2.5 && Math.abs(m.inter[i].y / T - y) < 2.5) near = true;
    for (i = 0; i < m.portals.length; i++) if (Math.abs(m.portals[i].x / T - x) < 3 && Math.abs(m.portals[i].y / T - y) < 3) near = true;
    if (near || (avoid && avoid(x, y))) continue;
    fn(m, x, y); k++;
  }
}
/* fragmentos del Brazalete del Origen: brillan con un haz de luz visible desde lejos */
function fragsIn(m) {
  C.FRAG.forEach(function (f) {
    if (f.z !== m.id) return;
    var w = function () { return !S.frag[f.id]; };
    tSet(m, f.x, f.y, 0); deco(m, 'frag', f.x, f.y, { when: w });
    inter(m, 'frag:' + f.id, (f.x + .5) * T, (f.y + 1) * T, 'FRAGMENTO DEL ORIGEN', function () { takeFrag(f); }, w);
  });
}
function takeFrag(f) {
  var r = C.fragTake(S, f.id); if (!r) return;
  sfx('win'); vib([20, 40, 20]); parts(P.x, P.y - 30, '#39c8ff', 18, 260); refreshCombat(); save();
  showPage(f, r === 'all');
}
var MAPS = {};
function buildPlaza() {
  var m = newMap('plaza', 35, 29), R = C.mulberry(11);
  tRect(m, 1, 13, 33, 3, 1); tRect(m, 16, 1, 3, 27, 1); tRect(m, 12, 9, 11, 11, 1);
  border(m, [[17, 0], [17, 28], [0, 14], [34, 14]]); fragsIn(m);
  tRect(m, 15, 12, 5, 5, 2); block(m, 17, 14, 1, 1, 62, ['#f0b429', '#a8740c'], { statue: 1 });
  portal(m, 17, 1, 'coliseo', 'N'); portal(m, 17, 27, 'tierras', 'S'); portal(m, 1, 14, 'dojo', 'W'); portal(m, 33, 14, 'forja', 'E');
  npc(m, 'pip', 13, 10); npc(m, 'sol', 24, 11);
  inter(m, 'pesca', 17.5 * T, 17.4 * T, 'PESCAR EN LA FUENTE', function () { mgStart('pesca'); }); deco(m, 'sign', 14, 17, { txt: '🎣 PESCA AQUÍ' });
  block(m, 20, 9, 2, 1, 30, ['#f2e8d5', '#b8a583'], { sign: 'TABLÓN' }); inter(m, 'board', 21 * T, 10.6 * T, 'TABLÓN · MISIONES DIARIAS', function () { openPanel('board'); });
  block(m, 12, 18, 2, 1, 44, ['#e0262f', '#8a1219'], { sign: 'RANKING' }); inter(m, 'rank', 13 * T, 19.6 * T, 'RANKING MUNDIAL', function () { openPanel('rank'); });
  block(m, 20, 18, 3, 1, 34, ['#a42cff', '#4d1785'], { sign: 'TIENDA' }); inter(m, 'shop', 21.5 * T, 19.6 * T, 'TIENDA DE GEMAS', function () { openPanel('shop'); });
  npc(m, 'nima', 17, 21, function () { return S.story.i >= C.STI.c1; });
  [[6, 11], [28, 11], [6, 17], [28, 17], [14, 4], [20, 4], [14, 24], [20, 24]].forEach(function (p) { deco(m, 'lamp', p[0], p[1]); });
  scatter(m, R, 26, tree, 2, 2, 33, 27);
  var gs = [[3, 3], [31, 25], [30, 4]][S.seed % 3], gw = function () { return S.side.gato && S.side.gato.s === 1 && S.side.gato.n < 1; };
  tSet(m, gs[0], gs[1], 0); deco(m, 'gato', gs[0], gs[1], { when: gw });
  inter(m, 'gato', (gs[0] + .5) * T, (gs[1] + 1) * T, '¿UN MAULLIDO?', function () { C.ev(S, 'find', { id: 'gato' }); sfx('up'); toast('¡Encontraste a Bigotes! Llévalo con Pip 🐱', 'gold'); }, gw);
  MAPS.plaza = m; return m;
}
function buildDojo() {
  var m = newMap('dojo', 31, 23), R = C.mulberry(22);
  tRect(m, 1, 10, 29, 3, 1); border(m, [[30, 11]]); fragsIn(m);
  tRect(m, 18, 1, 11, 3, 2); deco(m, 'fall', 23, 1);
  [[19, 5], [22, 5], [25, 5]].forEach(function (p) { tRect(m, p[0], p[1], 2, 2, 3); inter(m, 'medita', (p[0] + 1) * T, (p[1] + 1) * T, 'MEDITAR · ESPÍRITU', function () { mgStart('medita'); }); });
  [5, 8, 11].forEach(function (x) { station(m, 'saco', x, 5, 'SACO · FUERZA'); station(m, 'kata', x, 15, 'KATAS · TÉCNICA'); });
  [[2, 2], [14, 2], [2, 19], [14, 19]].forEach(function (p) { block(m, p[0], p[1], 1, 1, 52, ['#e0262f', '#8a1219'], { pillar: 1 }); });
  npc(m, 'ren', 16, 8);
  portal(m, 29, 11, 'plaza', 'E');
  scatter(m, R, 9, tree, 17, 14, 29, 22); scatter(m, R, 3, tree, 1, 17, 14, 22);
  MAPS.dojo = m; return m;
}
var PADS = [[3, 3], [9, 3], [21, 3], [3, 17], [9, 17], [21, 17]];
function buildForja() {
  var m = newMap('forja', 33, 27), R = C.mulberry(33);
  tRect(m, 1, 12, 31, 3, 1); tRect(m, 15, 1, 3, 25, 1); border(m, [[0, 13]]); fragsIn(m);
  PADS.forEach(function (p) { tRect(m, p[0], p[1], 5, 5, 3); });
  block(m, 19, 9, 2, 1, 26, ['#f0b429', '#a8740c'], { sign: 'TYCOON' }); inter(m, 'mesa', 20 * T, 10.6 * T, 'MESA DEL TYCOON', function () { openPanel('tycoon'); });
  tSet(m, 28, 8, 8); deco(m, 'yunque', 28, 8); inter(m, 'yunque', 28.5 * T, 9.8 * T, 'YUNQUE · GANA ORO', function () { mgStart('yunque'); });
  block(m, 27, 17, 2, 1, 30, ['#a42cff', '#4d1785'], { sign: 'ALQUIMIA' }); inter(m, 'alq', 28 * T, 18.6 * T, 'ALQUIMIA · ELIXIRES', function () { openPanel('alq'); });
  block(m, 27, 21, 3, 2, 40, ['#3a3a46', '#1c1c24'], { glow: 1, sign: 'FORJA' }); npc(m, 'tobias', 25, 23);
  block(m, 3, 23, 3, 1, 28, ['#f0b429', '#a8740c'], { sign: 'PAN' }); inter(m, 'pan', 4.5 * T, 24.6 * T, 'PANADERÍA · COMER', function () { openPanel('pan'); });
  tRect(m, 26, 1, 6, 2, 2);
  portal(m, 1, 13, 'plaza', 'W');
  scatter(m, R, 6, tree, 26, 3, 32, 15);
  MAPS.forja = m; refreshForja(); return m;
}
function refreshForja() {
  var m = MAPS.forja; if (!m || !S) return;
  m.objs = m.objs.filter(function (o) { return o.t !== 'bld'; });
  C.BLD.forEach(function (d, i) {
    var p = PADS[i], lv = S.tyc[d.id];
    tRect(m, p[0] + 1, p[1] + 1, 3, 3, lv > 0 ? 8 : 3);
    m.objs.push({ t: 'bld', x: p[0] + 1, y: p[1] + 1, w: 3, h: 3, z: lv > 0 ? 26 + Math.min(lv, 60) * 1.1 : 0, lv: lv, d: d, k: (p[1] + 4) * T, un: C.bUnlocked(S, d.id) });
  });
}
function buildTierras() {
  var m = newMap('tierras', 45, 37), R = C.mulberry(44);
  tRect(m, 1, 17, 7, 3, 1); border(m, [[0, 18]]); fragsIn(m);
  m.ringOf = function (x) { return x < 15 * T ? 0 : x < 30 * T ? 1 : 2; };
  for (var j = 2; j < 35; j += 2) { if (j % 8 !== 0) { rock(m, 15, j, .7); rock(m, 30, j, .7); } }
  [[35, 13], [41, 13], [35, 23], [41, 23]].forEach(function (p) { block(m, p[0], p[1], 2, 1, 34, ['#2a2433', '#15111f'], { ruin: 1 }); });
  npc(m, 'kira', 4, 14); npc(m, 'dax', 4, 22, function () { return S.story.i >= C.STI.b1; });
  portal(m, 1, 18, 'plaza', 'W');
  deco(m, 'sign', 14, 18, { txt: 'ANILLO 2 · PODER 100+' }); deco(m, 'sign', 29, 18, { txt: 'ANILLO 3 · PODER 400+' });
  var lair = function (x, y) { return Math.hypot(x - 39, y - 18) < 5.5 || Math.hypot(x - 9, y - 6) < 3.5 || Math.hypot(x - 22, y - 28) < 3.5 || (x < 8 && Math.abs(y - 18) < 4); };
  scatter(m, R, 46, rock, 2, 2, 44, 35, lair);
  scatter(m, R, 14, function (mm, x, y) { tree(mm, x, y, .9); mm.objs[mm.objs.length - 1].dead = 1; }, 2, 2, 44, 35, lair);
  MAPS.tierras = m; return m;
}
function buildColiseo() {
  var m = newMap('coliseo', 31, 25), R = C.mulberry(55);
  tRect(m, 14, 5, 3, 19, 1); tRect(m, 7, 7, 17, 7, 1); border(m, [[15, 24]]); fragsIn(m);
  block(m, 4, 1, 23, 4, 74, ['#a42cff', '#4d1785'], { arches: 1, sign: 'COLISEO DEL ECLIPSE' });
  npc(m, 'heraldo', 15, 7); npc(m, 'vant', 20, 12, function () { return S.story.i >= C.STI.d2; });
  block(m, 7, 9, 2, 2, 92, ['#2c2542', '#16121f'], { statue: 2 }); inter(m, 'estatua', 8 * T, 11.8 * T, 'ESTATUA DE VANT', function () { dialog([['nar', 'Una estatua de Vant, el Anfitrión. La placa dice: “El poder es lo único que vale”. Alguien rayó debajo: “mentira”.']]); });
  block(m, 22, 9, 2, 2, 70, ['#f0b429', '#a8740c'], { statue: 3 });
  [[5, 6], [25, 6], [5, 15], [25, 15]].forEach(function (p) { deco(m, 'torch', p[0], p[1]); });
  portal(m, 15, 23, 'plaza', 'S');
  scatter(m, R, 10, tree, 2, 15, 29, 23);
  MAPS.coliseo = m; return m;
}
function buildArena(kind) {
  var big = kind === 'night', n = big ? 30 : 18, rad = big ? 13.6 : 7.6, m = newMap(kind, n, n), c = n / 2, R = C.mulberry(big ? 66 : 77);
  for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) if (Math.hypot(i + .5 - c, j + .5 - c) > rad) tSet(m, i, j, 9);
  wallRuns(m, function (i, j) { return tAt(m, i, j) === 9 && (tAt(m, i + 1, j) !== 9 || tAt(m, i - 1, j) !== 9 || tAt(m, i, j + 1) !== 9 || tAt(m, i, j - 1) !== 9); }, big ? 40 : 30);
  if (big) scatter(m, R, 16, function (mm, x, y) { block(mm, x, y, 1, 1, 70, mm.th.w, { pillar: 1 }); }, 3, 3, 27, 27, function (x, y) { return Math.hypot(x - c, y - c) < 4; });
  else tRect(m, 8, 8, 2, 2, 1);
  m.spawn = { x: c * T, y: c * T };
  return m;
}
function getMap(id) {
  if (MAPS[id]) return MAPS[id];
  var b = { plaza: buildPlaza, dojo: buildDojo, forja: buildForja, tierras: buildTierras, coliseo: buildColiseo }[id];
  var m = b(); renderGround(m); return m;
}

/* ---------- suelo pre-renderizado ---------- */
function renderGround(m) {
  var q = S && S.cfg.q ? 1 : .5, c = document.createElement('canvas'); c.width = m.w * T * q; c.height = m.h * T * q;
  var g = c.getContext('2d'), th = m.th, R = C.mulberry(m.w * 131 + m.h);
  g.scale(q, q);
  for (var j = 0; j < m.h; j++) for (var i = 0; i < m.w; i++) {
    var v = tAt(m, i, j), x = i * T, y = j * T, f = th.f;
    if (th.rf) f = th.rf[i < 15 ? 0 : i < 30 ? 1 : 2];
    g.fillStyle = v === 1 ? th.p : v === 2 ? th.wa : v === 3 ? (th.alt || th.p) : v === 9 ? th.bg : f[(i + j) & 1];
    g.fillRect(x, y, T, T);
    if (v === 1) { g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 1.5; g.strokeRect(x + 2, y + 2, T - 4, T - 4); }
    else if (v === 2) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); var o = R() * 10; g.moveTo(x + 6 + o, y + 14); g.lineTo(x + 18 + o, y + 14); g.moveTo(x + 4, y + 28); g.lineTo(x + 14, y + 28); g.stroke(); }
    else if (v === 3) { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.strokeRect(x + 3, y + 3, T - 6, T - 6); }
    else if (v === 0) {
      if (m.id === 'dojo') { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x, y + T - 3, T, 3); }
      if (m.id === 'forja') { g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1; g.strokeRect(x, y, T / 2, T / 2); g.strokeRect(x + T / 2, y + T / 2, T / 2, T / 2); }
      if (m.id === 'tierras' && R() < .18) { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + R() * T, y + R() * T); g.lineTo(x + R() * T, y + R() * T); g.lineTo(x + R() * T, y + R() * T); g.stroke(); }
      if ((m.id === 'plaza' || m.id === 'coliseo') && R() < .08) { g.fillStyle = m.id === 'plaza' ? '#4c9a5e' : '#3c4466'; g.fillRect(x + R() * 30, y + R() * 30, 4, 6); }
    }
  }
  /* trama de puntos (halftone) */
  g.fillStyle = 'rgba(0,0,0,.07)';
  for (var yy = 0; yy < m.h * T; yy += 8) for (var xx = (yy / 8 & 1) * 4; xx < m.w * T; xx += 8) g.fillRect(xx, yy, 1.6, 1.6);
  m.ground = c; m.gq = q;
  var mc = document.createElement('canvas'), mg2; mc.width = m.w * 3; mc.height = m.h * 3; mg2 = mc.getContext('2d');
  for (j = 0; j < m.h; j++) for (i = 0; i < m.w; i++) { var t2 = tAt(m, i, j); mg2.fillStyle = t2 === 9 ? '#0b0b0f' : t2 === 8 ? shade(th.w[0], .6) : t2 === 2 ? th.wa : t2 === 1 ? th.p : (th.rf ? th.rf[i < 15 ? 0 : i < 30 ? 1 : 2][0] : th.f[0]); mg2.fillRect(i * 3, j * 3, 3, 3); }
  m.mini = mc;
}
function drawMini() {
  var c = $('mini'); if (!c || !MAP || !MAP.mini) return; var g = c.getContext('2d'), mw = MAP.mini.width, mh = MAP.mini.height, k = Math.min(c.width / mw, c.height / mh);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b0b0f'; g.fillRect(0, 0, c.width, c.height);
  var ox = (c.width - mw * k) / 2, oy = (c.height - mh * k) / 2; g.imageSmoothingEnabled = false; g.drawImage(MAP.mini, ox, oy, mw * k, mh * k);
  var pt = function (x, y, col, r) { g.fillStyle = col; g.fillRect(ox + x / T * 3 * k - r, oy + y / T * 3 * k - r, r * 2, r * 2); };
  MAP.portals.forEach(function (p) { pt(p.x, p.y, '#a42cff', 3); });
  MAP.npcs.forEach(function (n) { if (!n.when || n.when()) pt(n.x, n.y, '#f0b429', 2.5); });
  if (mode === 'world') ents.forEach(function (e) { if (e.k === 'foe' && !e.dead) pt(e.x, e.y, e.boss ? '#ff2fb3' : '#e0262f', e.boss ? 3 : 1.5); else if (e.k === 'ally') pt(e.x, e.y, '#2dffb3', 2); });
  var ob = objTarget(); if (ob && Math.sin(time * 8) > 0) pt(ob.x, ob.y + 40, '#ffffff', 3.5);
  pt(P.x, P.y, '#39c8ff', 3); g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(ox + P.x / T * 3 * k - 4, oy + P.y / T * 3 * k - 4, 8, 8);
}

/* ---------- dibujo cómic ---------- */
function rr(g, x, y, w, h, fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h); }
function ctext(g, t, x, y, size, fill, rot, font) {
  g.save(); g.translate(x, y); if (rot) g.rotate(rot);
  g.font = size + 'px ' + (font || 'Titulos, Impact, sans-serif'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = Math.max(3, size / 4.5); g.strokeStyle = INK; g.strokeText(t, 0, 0); g.fillStyle = fill; g.fillText(t, 0, 0); g.restore();
}
function star(g, x, y, r1, r2, n, fill) {
  g.beginPath(); for (var i = 0; i < n * 2; i++) { var a = i * Math.PI / n, r = i & 1 ? r2 : r1; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  g.closePath(); g.fillStyle = fill; g.fill(); g.stroke();
}
function drawAvatar(g, x, y, L, o) {
  o = o || {}; var d = o.dir || 0, mv = o.mv ? 1 : 0, sw = Math.sin(o.walk || 0) * mv, sc = (L.sc || 1) * (o.sc || 1), side = d >= 2;
  g.save(); g.translate(x, y); g.scale(sc, sc);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 0, 13, 5, 0, 0, TAU); g.fill();
  if (o.aura) { g.strokeStyle = o.aura; g.lineWidth = 3; g.globalAlpha = .55 + Math.sin(time * 8) * .2; g.beginPath(); g.ellipse(0, -22, 19, 28, 0, 0, TAU); g.stroke(); g.globalAlpha = 1; }
  if (d === 3) g.scale(-1, 1);
  g.lineWidth = 2; g.strokeStyle = INK; g.lineJoin = 'round';
  var pants = L.pants || '#1b1b22', sh = L.shirt, sk = L.skin, ha = L.hair, elc = o.el || '#ffd23a', atk = o.atk > 0;
  if (L.cape && d !== 1) { g.fillStyle = L.cape; g.beginPath(); g.moveTo(-9, -28); g.lineTo(9, -28); g.lineTo(12 + sw * 2, -4); g.lineTo(-12 + sw * 2, -4); g.closePath(); g.fill(); g.stroke(); }
  if (!side) { var a = sw * 3; rr(g, -7, -14 + Math.max(0, a), 6, 14 - Math.max(0, a), pants); rr(g, 1, -14 + Math.max(0, -a), 6, 14 - Math.max(0, -a), pants); }
  else { rr(g, -3 - sw * 4, -14, 6, 14, shade(pants.charAt(0) === '#' ? pants : '#1b1b22', .6)); rr(g, -3 + sw * 4, -14, 6, 14, pants); }
  if (L.robe) { g.fillStyle = sh; g.beginPath(); g.moveTo(-9, -29); g.lineTo(9, -29); g.lineTo(12, -2); g.lineTo(-12, -2); g.closePath(); g.fill(); g.stroke(); }
  var tw = side ? 12 : 18; rr(g, -tw / 2, -29, tw, 16, sh);
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(side ? -tw / 2 + 1 : 1, -28, tw / 2 - 1, 14);
  if (L.scarf) rr(g, -tw / 2 - 1, -30, tw + 2, 4, L.scarf);
  if (!side) {
    rr(g, -13, -28 - sw * 2, 5, 14, sh); rr(g, -13, -16 - sw * 2, 5, 3, sk);
    if (atk) { rr(g, 8, -42, 5, 15, sh); rr(g, 8, -46, 5, 4, sk); rr(g, 8, -41, 5, 4, elc); }
    else { rr(g, 8, -28 + sw * 2, 5, 14, sh); rr(g, 8, -16 + sw * 2, 5, 3, sk); rr(g, 8, -19 + sw * 2, 5, 3, elc); }
  } else {
    if (atk) { rr(g, -2, -25, 18, 5, sh); rr(g, 15, -26, 5, 7, sk); rr(g, 10, -26, 4, 7, elc); }
    else { rr(g, -3 - sw * 3, -28, 5, 14, sh); rr(g, -3 - sw * 3, -16, 5, 3, sk); rr(g, -3 - sw * 3, -19, 5, 3, elc); }
  }
  var hw = side ? 14 : 16; rr(g, -hw / 2, -45, hw, 16, sk);
  if (L.hood) { g.fillStyle = L.hood; g.fillRect(-hw / 2 - 2, -48, hw + 4, 6); g.strokeRect(-hw / 2 - 2, -48, hw + 4, 6); if (d !== 0) rr(g, -hw / 2 - 2, -48, hw + 4, 16, L.hood); }
  else if (d === 1) rr(g, -hw / 2, -47, hw, 14, ha);
  else { rr(g, -hw / 2, -47, hw, 6, ha); if (side) rr(g, -hw / 2, -47, 6, 12, ha); }
  if (L.bun) { g.fillStyle = ha; g.beginPath(); g.arc(0, -50, 5, 0, TAU); g.fill(); g.stroke(); }
  if (L.cap && d !== 1) { rr(g, -hw / 2 - 1, -49, hw + 2, 6, L.cap); rr(g, side ? 4 : -6, -44, side ? 8 : 12, 3, L.cap); }
  if (L.crown) { g.fillStyle = '#f0b429'; g.beginPath(); g.moveTo(-8, -47); g.lineTo(-8, -55); g.lineTo(-4, -50); g.lineTo(0, -57); g.lineTo(4, -50); g.lineTo(8, -55); g.lineTo(8, -47); g.closePath(); g.fill(); g.stroke(); }
  if (d === 0) {
    g.fillStyle = INK; g.fillRect(-5, -39, 2.5, 4); g.fillRect(2.5, -39, 2.5, 4);
    if (o.mad) { g.fillRect(-6, -41, 4, 1.5); g.fillRect(2, -41, 4, 1.5); }
    g.fillRect(-2, -33, 4, 1.5);
    if (L.beard) rr(g, -6, -34, 12, 6, ha);
  } else if (side) { g.fillStyle = INK; g.fillRect(3, -39, 2.5, 4); if (L.beard) rr(g, 0, -34, 7, 6, ha); }
  if (L.cape && d === 1) { g.fillStyle = L.cape; g.beginPath(); g.moveTo(-9, -29); g.lineTo(9, -29); g.lineTo(12, -3); g.lineTo(-12, -3); g.closePath(); g.fill(); g.stroke(); }
  if (o.flash > 0) { g.globalAlpha = Math.min(1, o.flash * 6); g.fillStyle = '#fff'; g.fillRect(-12, -48, 24, 48); g.globalAlpha = 1; }
  g.restore();
}
function drawFoe(g, e) {
  var t = e.type, x = e.x, y = e.y;
  if (t === 'bandido' || e.pvp) {
    drawAvatar(g, x, y, e.look, { dir: e.dir, walk: e.walk, mv: e.mv, atk: e.atkA, flash: e.flash, el: C.EL[e.el || 'fuego'].c, mad: 1, aura: e.type === 'vant' ? '#a42cff' : 0 });
    if (t === 'bandido') { g.fillStyle = '#e0262f'; g.fillRect(x - 8 * (e.look.sc || 1), y - 41, 16, 4); }
    return;
  }
  g.save(); g.translate(x, y); g.lineWidth = 2; g.strokeStyle = INK;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 0, e.r + 2, 5, 0, 0, TAU); g.fill();
  var fl = e.flash > 0, b = Math.sin(time * 6 + e.ph) * 2;
  if (t === 'reyeco') { g.scale(2, 2); t = 'eco'; }
  if (t === 'alfa') { g.scale(1.6, 1.6); t = 'lobo'; e.mane = 1; }
  if (t === 'eco') {
    g.fillStyle = fl ? '#fff' : '#2b1640'; g.beginPath(); g.ellipse(0, -12 + b * .5, 13, 12 - b * .3, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#ff2fb3'; g.fillRect(-6, -16, 4, 4); g.fillRect(3, -16, 4, 4);
    if (e.type === 'reyeco') { g.fillStyle = '#f0b429'; g.beginPath(); g.moveTo(-8, -22); g.lineTo(-8, -30); g.lineTo(-3, -25); g.lineTo(0, -32); g.lineTo(3, -25); g.lineTo(8, -30); g.lineTo(8, -22); g.closePath(); g.fill(); g.stroke(); }
  } else if (t === 'lobo') {
    var s = e.dir === 2 ? -1 : 1; g.scale(s, 1);
    g.fillStyle = fl ? '#fff' : '#6b6b78'; g.beginPath(); g.ellipse(0, -13, 16, 9, 0, 0, TAU); g.fill(); g.stroke();
    var lg = Math.sin(e.walk) * 4 * (e.mv ? 1 : 0); g.beginPath(); g.moveTo(-9, -6); g.lineTo(-9 + lg, 0); g.moveTo(8, -6); g.lineTo(8 - lg, 0); g.stroke();
    g.beginPath(); g.arc(15, -18, 7, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(12, -24); g.lineTo(14, -31); g.lineTo(18, -24); g.fill(); g.stroke();
    g.fillStyle = '#e0262f'; g.fillRect(16, -20, 3, 3);
    if (e.mane) { g.fillStyle = '#e0262f'; g.beginPath(); g.moveTo(4, -22); g.lineTo(9, -30); g.lineTo(12, -22); g.lineTo(6, -16); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#ffd23a'; g.fillRect(16, -20, 3, 3); }
  } else if (t === 'golem') {
    var c1 = fl ? '#fff' : '#2a2433';
    rr(g, -20, -30, 40, 28, c1); rr(g, -26, -28 + b, 10, 22, c1); rr(g, 16, -28 - b, 10, 22, c1); rr(g, -12, -48, 24, 18, c1);
    g.strokeStyle = '#ff2fb3'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-10, -26); g.lineTo(-2, -16); g.lineTo(-8, -8); g.moveTo(6, -28); g.lineTo(10, -14); g.stroke();
    g.fillStyle = '#ff2fb3'; g.fillRect(-7, -42, 5, 4); g.fillRect(3, -42, 5, 4);
  } else if (t === 'sombra') {
    g.globalAlpha = e.lit ? .9 : .97;
    g.fillStyle = fl ? '#888' : '#000'; g.beginPath(); g.moveTo(-9, 0); g.quadraticCurveTo(-13, -40, 0, -54 + b); g.quadraticCurveTo(13, -40, 9, 0); g.closePath(); g.fill();
    if (e.lit) { g.strokeStyle = '#5c5470'; g.stroke(); }
    g.globalAlpha = 1;
  }
  g.restore();
}
function drawObj(g, o) {
  var th = MAP.th;
  if (o.t === 'blk' || (o.t === 'bld' && o.lv > 0)) {
    var x = o.x * T, y = o.y * T, w = o.w * T, h = o.h * T, z = o.z, c = o.c || th.w;
    if (o.t === 'bld') c = [['#f2e8d5', '#c9b88f'], ['#e0262f', '#8a1219'], ['#a42cff', '#4d1785'], ['#f0b429', '#a8740c'], ['#0f5c66', '#08343b'], ['#39c8ff', '#1f6f99']][o.d.i];
    g.lineWidth = 2; g.strokeStyle = INK;
    g.fillStyle = c[1]; g.fillRect(x, y + h - z, w, z); g.strokeRect(x, y + h - z, w, z);
    g.fillStyle = c[0]; g.fillRect(x, y - z, w, h); g.strokeRect(x, y - z, w, h);
    if (z > 30 && w > T) { g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); for (var k = x + 14; k < x + w - 6; k += 18) { g.moveTo(k, y + h - z + 6); g.lineTo(k, y + h - 4); } g.stroke(); g.strokeStyle = INK; }
    if (o.arches) { g.fillStyle = '#100a1c'; for (var a = x + 30; a < x + w - 30; a += 56) { g.beginPath(); g.moveTo(a - 14, y + h); g.lineTo(a - 14, y + h - z + 34); g.arc(a, y + h - z + 34, 14, Math.PI, 0); g.lineTo(a + 14, y + h); g.fill(); g.stroke(); } }
    if (o.statue === 1) { g.fillStyle = '#f0b429'; g.beginPath(); g.arc(x + w / 2, y - z - 8, 13, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#39c8ff'; g.beginPath(); g.arc(x + w / 2, y - z - 8, 7, 0, TAU); g.fill(); g.stroke(); }
    if (o.statue === 2) drawAvatar(g, x + w / 2, y - z + h / 2 + 10, { skin: '#5c5470', shirt: '#3d3654', pants: '#2c2542', hair: '#5c5470', crown: 1, cape: '#3d3654' }, { sc: 1.6 });
    if (o.statue === 3) drawAvatar(g, x + w / 2, y - z + h / 2 + 10, { skin: '#f0b429', shirt: '#d9a020', pants: '#a8740c', hair: '#d9a020' }, { sc: 1.5, atk: 1 });
    if (o.glow) { g.fillStyle = 'rgba(255,122,46,' + (.55 + Math.sin(time * 5) * .25) + ')'; g.fillRect(x + 10, y + h - z + 8, w - 20, z - 16); g.strokeRect(x + 10, y + h - z + 8, w - 20, z - 16); }
    if (o.sign) ctext(g, o.sign, x + w / 2, y - z + h / 2, o.sign.length > 10 ? 15 : 17, PAP);
    if (o.t === 'bld') { ctext(g, o.d.ic, x + w / 2, y - z + h / 2 - 6, 26, '#fff', 0, 'sans-serif'); ctext(g, 'NV ' + o.lv, x + w / 2, y - z + h / 2 + 22, 15, '#f0b429'); }
    return;
  }
  if (o.t === 'bld') { var bx = o.x * T, by = o.y * T; g.strokeStyle = 'rgba(0,0,0,.4)'; g.setLineDash([6, 5]); g.lineWidth = 2; g.strokeRect(bx, by, 3 * T, 3 * T); g.setLineDash([]); ctext(g, o.un ? 'SE VENDE' : '🔒', bx + 1.5 * T, by + 1.2 * T, o.un ? 16 : 20, o.un ? '#f0b429' : '#fff', -.08, o.un ? 0 : 'sans-serif'); ctext(g, o.d.n, bx + 1.5 * T, by + 1.9 * T, 12, PAP); return; }
  g.lineWidth = 2; g.strokeStyle = INK;
  if (o.t === 'tree') {
    var s = o.s, x2 = o.x, y2 = o.y;
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x2, y2, 16 * s, 6 * s, 0, 0, TAU); g.fill();
    rr(g, x2 - 4 * s, y2 - 22 * s, 8 * s, 22 * s, '#5a3825');
    if (o.dead) { g.beginPath(); g.moveTo(x2, y2 - 20 * s); g.lineTo(x2 - 14 * s, y2 - 40 * s); g.moveTo(x2, y2 - 22 * s); g.lineTo(x2 + 12 * s, y2 - 44 * s); g.moveTo(x2 + 6 * s, y2 - 34 * s); g.lineTo(x2 + 16 * s, y2 - 34 * s); g.lineWidth = 3; g.strokeStyle = '#3a2a1a'; g.stroke(); return; }
    var tc = th.tr; g.fillStyle = tc[1]; g.beginPath(); g.arc(x2, y2 - 36 * s, 20 * s, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = tc[0]; g.beginPath(); g.arc(x2 - 4 * s, y2 - 40 * s, 14 * s, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(x2 - 8 * s, y2 - 46 * s, 4 * s, 0, TAU); g.fill();
  } else if (o.t === 'rock') {
    var r = 15 * o.s; g.fillStyle = th.w[0]; g.beginPath(); g.moveTo(o.x - r, o.y); g.lineTo(o.x - r * .8, o.y - r * 1.1); g.lineTo(o.x - r * .1, o.y - r * 1.5 - o.v * 6); g.lineTo(o.x + r * .9, o.y - r); g.lineTo(o.x + r, o.y); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(o.x + r * .1, o.y - r * 1.2); g.lineTo(o.x + r * .9, o.y - r); g.lineTo(o.x + r, o.y); g.lineTo(o.x + r * .2, o.y); g.fill();
  } else if (o.t === 'deco') {
    var X = o.x, Y = o.y;
    if (o.d === 'lamp' || o.d === 'torch') {
      rr(g, X - 2, Y - 34, 4, 34, o.d === 'lamp' ? '#1b1b22' : '#5a3825');
      g.fillStyle = o.d === 'lamp' ? '#f0b429' : '#ff7a2e'; g.beginPath(); g.arc(X, Y - 38, o.d === 'lamp' ? 6 : 5 + Math.sin(time * 12 + X) * 1.5, 0, TAU); g.fill(); g.stroke();
    } else if (o.d === 'saco') {
      rr(g, X - 14, Y - 62, 28, 4, '#5a3825'); g.beginPath(); g.moveTo(X, Y - 58); g.lineTo(X, Y - 50); g.stroke();
      var sw2 = MG.on && MG.kind === 'saco' ? 0 : Math.sin(time * 2 + X) * 2; rr(g, X - 9 + sw2, Y - 50, 18, 40, '#e0262f'); rr(g, X - 9 + sw2, Y - 36, 18, 5, '#f2e8d5');
    } else if (o.d === 'kata') {
      rr(g, X - 6, Y - 46, 12, 46, '#a97b36'); rr(g, X - 14, Y - 36, 28, 5, '#7a5525'); rr(g, X - 14, Y - 22, 28, 5, '#7a5525');
    } else if (o.d === 'yunque') {
      rr(g, X - 8, Y - 14, 16, 14, '#3a3a46'); rr(g, X - 17, Y - 24, 34, 10, '#55555f'); g.fillStyle = '#ff7a2e'; g.fillRect(X - 4, Y - 27, 8, 3);
    } else if (o.d === 'fall') {
      g.fillStyle = 'rgba(255,255,255,.55)'; for (var k2 = 0; k2 < 6; k2++) { var yy = (time * 90 + k2 * 22) % 120; g.fillRect(X - 50 + k2 * 18, Y - 30 + yy * .5, 3, 10); }
    } else if (o.d === 'sign') {
      rr(g, X - 2, Y - 30, 4, 30, '#5a3825'); rr(g, X - 46, Y - 44, 92, 18, PAP); g.fillStyle = INK; g.font = '700 10px Cuerpo, sans-serif'; g.textAlign = 'center'; g.fillText(o.txt, X, Y - 31);
    } else if (o.d === 'frag') {
      var fy2 = Math.sin(time * 3 + X) * 4;
      g.globalAlpha = .18 + Math.sin(time * 2) * .06; g.fillStyle = '#39c8ff'; g.fillRect(X - 7, Y - 260, 14, 250); g.globalAlpha = 1;
      g.fillStyle = '#39c8ff'; g.beginPath(); g.moveTo(X, Y - 40 + fy2); g.lineTo(X + 11, Y - 22 + fy2); g.lineTo(X, Y - 4 + fy2); g.lineTo(X - 11, Y - 22 + fy2); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(X - 2, Y - 32 + fy2); g.lineTo(X + 4, Y - 24 + fy2); g.lineTo(X - 2, Y - 18 + fy2); g.closePath(); g.fill();
      if (Math.random() < .2) parts(X + rnd(-10, 10), Y - 30, '#bfefff', 1, 40);
    } else if (o.d === 'gato') {
      var j = Math.sin(time * 5) * 2; g.fillStyle = '#f0b429'; g.beginPath(); g.ellipse(X, Y - 8, 11, 7, 0, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.arc(X + 10, Y - 16 + j * .3, 7, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(X + 5, Y - 21); g.lineTo(X + 7, Y - 28); g.lineTo(X + 10, Y - 22); g.moveTo(X + 11, Y - 22); g.lineTo(X + 14, Y - 28); g.lineTo(X + 16, Y - 20); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(X - 10, Y - 10); g.quadraticCurveTo(X - 20, Y - 22 + j, X - 14, Y - 26); g.stroke();
      if (Math.sin(time * 1.3) > .6) ctext(g, '¡miau!', X, Y - 42, 13, PAP);
    } else if (o.d === 'llama') {
      var fy = Math.sin(time * 6 + X) * 3; g.fillStyle = '#ffb02e'; g.beginPath(); g.moveTo(X, Y - 26 + fy); g.quadraticCurveTo(X + 10, Y - 10, X, Y - 4); g.quadraticCurveTo(X - 10, Y - 10, X, Y - 26 + fy); g.fill(); g.stroke();
      g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(X, Y - 10, 3, 0, TAU); g.fill();
    }
  }
}
function drawPortal(g, o) {
  var c = o.to === 'plaza' ? '#f0b429' : o.to === 'tierras' ? '#e0262f' : o.to === 'coliseo' ? '#a42cff' : o.to === 'dojo' ? '#ff8fb8' : '#39c8ff', p = (time * 1.5) % 1;
  g.lineWidth = 4; g.strokeStyle = c; g.globalAlpha = .9; g.beginPath(); g.ellipse(o.x, o.y, 26, 12, 0, 0, TAU); g.stroke();
  g.globalAlpha = 1 - p; g.beginPath(); g.ellipse(o.x, o.y - p * 30, 26 * (1 - p * .4), 12 * (1 - p * .4), 0, 0, TAU); g.stroke(); g.globalAlpha = 1;
  ctext(g, C.ZONES[o.to].n, o.x, o.y - 44, 14, c);
}

/* ---------- entidades ---------- */
function mkPlayer() {
  var cs = C.combat(S);
  return { k: 'pl', x: 0, y: 0, r: 12, dir: 0, fx: 0, fy: 1, walk: 0, mv: 0, cs: cs, hp: S.hp > 0 ? Math.min(S.hp, cs.maxHp) : cs.maxHp, aura: 30, atkCd: 0, skCd: 0, dashCd: 0, dashT: 0, iT: 0, combo: 0, lastAtk: -9, atkA: 0, flash: 0, shieldT: 0, lastHurt: -9, buf: { atk: 1, hp: 1, au: 1 } };
}
function refreshCombat() { if (!P) return; var r = P.hp / P.cs.maxHp; P.cs = C.combat(S); P.cs.atk *= P.buf.atk; P.cs.maxHp = Math.round(P.cs.maxHp * P.buf.hp * (mode === 'duel' ? C.TOUR.duelHp : 1)); P.cs.aura *= P.buf.au; P.hp = Math.max(1, Math.min(P.cs.maxHp, r * P.cs.maxHp)); }
function mkFoe(type, x, y, eP, ex) {
  var st = C.foeStats(type, eP, ex && ex.el), F = C.FOES[type];
  var e = { k: 'foe', type: type, x: x, y: y, hx: x, hy: y, r: F.r, eP: eP, hp: st.hp, maxHp: st.hp, dmg: st.dmg, crit: st.crit, sp: F.sp, st: 'idle', t: rnd(0, 2), dir: 0, walk: 0, mv: 0, flash: 0, kbT: 0, ph: rnd(0, 6), aggro: F.boss ? 260 : 210, ring: 0, aura: 0, skCd: 3, dodgeCd: 0, atkA: 0, spm: 1, pvp: F.pvp, boss: F.boss };
  for (var q in ex || {}) e[q] = ex[q];
  if (!e.el) e.el = C.FOE_EL[type] || 'fuego';
  return e;
}
function foes() { return ents.filter(function (e) { return e.k === 'foe' && e.hp > 0; }); }
function hitT(x, y, r) {
  var x0 = Math.floor((x - r) / T), x1 = Math.floor((x + r) / T), y0 = Math.floor((y - r * .6) / T), y1 = Math.floor((y + r * .4) / T);
  for (var j = y0; j <= y1; j++) for (var i = x0; i <= x1; i++) if (isSolid(MAP, i, j)) return true;
  return false;
}
function moveEnt(e, dx, dy) {
  var r = e.r * .8, hit = 0;
  if (dx) { if (!hitT(e.x + dx, e.y, r)) e.x += dx; else hit = 1; }
  if (dy) { if (!hitT(e.x, e.y + dy, r)) e.y += dy; else hit = 1; }
  return hit;
}
function setDir(e, x, y) { if (Math.abs(x) > Math.abs(y)) e.dir = x < 0 ? 2 : 3; else e.dir = y < 0 ? 1 : 0; }
function face(e, tx, ty) { var dx = tx - e.x, dy = ty - e.y, l = Math.hypot(dx, dy) || 1; e.fx = dx / l; e.fy = dy / l; setDir(e, e.fx, e.fy); }
function nearestFoe(e, max) { var b = null, bd = max; foes().forEach(function (f) { var d = dist(e, f); if (d < bd) { bd = d; b = f; } }); return b; }
function inArc(a, b, r, ang) { var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); if (d > r) return false; if (d < 18) return true; return (dx * a.fx + dy * a.fy) / d > Math.cos(ang); }

/* ---------- efectos ---------- */
var ONO = ['¡PAM!', '¡ZAS!', '¡POW!', '¡KRAK!', '¡BAM!', '¡TOING!'];
function addFx(o) { if (fx.length > 140) fx.shift(); o.t = 0; fx.push(o); return o; }
function burst(x, y, c, big) { addFx({ k: 'burst', x: x, y: y, c: c || '#fff', life: .22, r: big ? 26 : 16 }); }
function txt(x, y, s, c, size, life) { addFx({ k: 'txt', x: x + rnd(-6, 6), y: y, s: s, c: c || '#fff', size: size || 18, life: life || .8, rot: rnd(-.2, .2) }); }
function parts(x, y, c, n, sp) { for (var i = 0; i < (S.cfg.q ? n : n / 2); i++) { var a = rnd(0, TAU), v = rnd(40, sp || 220); addFx({ k: 'part', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, c: c, life: rnd(.3, .6), sz: rnd(3, 6) }); } }
function ring(x, y, r, c, life) { addFx({ k: 'ring', x: x, y: y, r: r, c: c, life: life || .35 }); }
function shake(v) { if (S && S.cfg.calm) return; cam.sh = Math.max(cam.sh, v); }
function updFx(dt) {
  for (var i = fx.length - 1; i >= 0; i--) {
    var f = fx[i]; f.t += dt;
    if (f.k === 'part') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 400 * dt; }
    else if (f.k === 'orb') {
      if (f.t < .3) { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= .9; f.vy *= .9; }
      else { var dx = P.x - f.x, dy = P.y - 24 - f.y, l = Math.hypot(dx, dy) || 1, sp = 260 + f.t * 500; f.x += dx / l * Math.min(l, sp * dt); f.y += dy / l * Math.min(l, sp * dt); if (l < 14) { f.t = f.life; if (Math.random() < .3) tone(1200 + Math.random() * 400, .04, 'square', .03); } }
    }
    if (f.t >= f.life) fx.splice(i, 1);
  }
}
function drawFx(g) {
  for (var i = 0; i < fx.length; i++) {
    var f = fx[i], p = f.t / f.life;
    g.globalAlpha = Math.max(0, 1 - p); g.lineWidth = 2; g.strokeStyle = INK;
    if (f.k === 'burst') star(g, f.x, f.y, f.r * (.6 + p), f.r * .45 * (.6 + p), 9, f.c);
    else if (f.k === 'txt') ctext(g, f.s, f.x, f.y - p * 40, f.size * (p < .15 ? .6 + p * 3 : 1.05), f.c, f.rot);
    else if (f.k === 'part') { g.fillStyle = f.c; g.fillRect(f.x - f.sz / 2, f.y - f.sz / 2, f.sz, f.sz); }
    else if (f.k === 'orb') { g.globalAlpha = 1; g.fillStyle = f.c; g.beginPath(); g.arc(f.x, f.y, 5, 0, TAU); g.fill(); g.stroke(); }
    else if (f.k === 'ring') { g.strokeStyle = f.c; g.lineWidth = 5 * (1 - p) + 1; g.beginPath(); g.ellipse(f.x, f.y, f.r * (.3 + p * .7), f.r * (.3 + p * .7) * .55, 0, 0, TAU); g.stroke(); }
    else if (f.k === 'slash') { g.strokeStyle = f.c; g.lineWidth = 8 * (1 - p) + 2; g.lineCap = 'round'; g.beginPath(); g.arc(f.x, f.y, f.r, f.a - 1.1 + p * .4, f.a + 1.1 + p * .4); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); g.lineCap = 'butt'; }
    else if (f.k === 'lines') { g.strokeStyle = f.c; g.lineWidth = 2; g.beginPath(); for (var k = 0; k < 4; k++) { var o = (k - 1.5) * 8; g.moveTo(f.x - f.fy * o, f.y + f.fx * o - 20); g.lineTo(f.x - f.fx * 40 - f.fy * o, f.y - f.fy * 40 + f.fx * o - 20); } g.stroke(); }
  }
  g.globalAlpha = 1;
}

/* ---------- combate ---------- */
function attack() {
  if (P.dead || P.atkCd > 0) return;
  var cs = P.cs, tg = nearestFoe(P, 130); if (tg) face(P, tg.x, tg.y);
  P.combo = time - P.lastAtk < .75 ? (P.combo + 1) % 3 : 0; P.lastAtk = time;
  var mul = [1, 1.1, 1.7][P.combo]; P.atkCd = cs.cd * (P.combo === 2 ? 1.35 : 1); P.atkA = .16;
  addFx({ k: 'slash', x: P.x + P.fx * 10, y: P.y - 20 + P.fy * 10, a: Math.atan2(P.fy, P.fx), r: 34, c: brzColor(), life: .16 });
  sfx('swing');
  var hit = 0;
  foes().forEach(function (f) { if (inArc(P, f, 60 + f.r, 1.15)) { var cr = Math.random() < cs.crit; dmgFoe(f, cs.atk * mul * (cr ? 1.8 : 1), cr || P.combo === 2, P.fx, P.fy, P.combo === 2 ? 300 : 150); hit++; } });
  if (hit) { P.aura = Math.min(100, P.aura + 7 * hit); hitstop = P.combo === 2 ? .07 : .04; shake(P.combo === 2 ? 7 : 3); vib(12); }
}
function dmgFoe(f, d, big, kx, ky, kb) {
  if (f.hp <= 0) return;
  if (f.type === 'sombra') { f.burn += .5; f.kbx = kx * 200; f.kby = ky * 200; f.kbT = .15; burst(f.x, f.y - 26, '#ddd'); sfx('hit'); return; }
  if (f.pvp && f.st !== 'wind' && !f.frozen && Math.random() < .22) { d *= .3; txt(f.x, f.y - 70, '¡BLOQUEO!', '#39c8ff', 16, .6); kb *= .3; }
  var kf = f.boss ? .25 : f.pvp ? (f.st === 'wind' ? 0 : .4) : 1; /* los rivales no se interrumpen al cargar su golpe */
  var af = C.afin(C.eqB(S).el, f.el); d *= af;
  if (af !== 1 && time - (f.afT || -9) > 1.2) { f.afT = time; txt(f.x + 26, f.y - 88, af > 1 ? '¡EFICAZ!' : 'RESISTE', af > 1 ? '#2dffb3' : '#9b917c', 15, .8); }
  d = Math.max(1, d); f.hp -= d; f.flash = .12; f.kbx = kx * kb * kf; f.kby = ky * kb * kf; f.kbT = kf ? .12 : 0;
  if (f.st === 'idle' || f.st === 'home') f.st = 'chase';
  txt(f.x, f.y - 50, C.fmt(d), big ? '#f0b429' : '#fff', big ? 24 : 17);
  burst(f.x + rnd(-6, 6), f.y - 22, big ? '#f0b429' : '#fff', big);
  if (big) { txt(f.x, f.y - 76, ONO[Math.random() * ONO.length | 0], '#f0b429', 28, .7); sfx('crit'); } else sfx('hit');
  if (P.cs.steal) heal(d * P.cs.steal);
  if (f.hp <= 0) killFoe(f);
}
function killFoe(f) {
  f.hp = 0; f.dead = 1; parts(f.x, f.y - 20, f.type === 'eco' || f.type === 'golem' ? '#a42cff' : '#f2e8d5', 14);
  ring(f.x, f.y, 60, '#f0b429'); txt(f.x, f.y - 70, f.boss ? '¡DERROTADO!' : '¡K.O.!', '#e0262f', f.boss ? 34 : 24, 1);
  if (mode === 'world' && C.FOES[f.type].x) {
    var r = C.killReward(S, f.type, f.eP);
    if (r) {
      txt(f.x, f.y - 92, '+' + r.g.toFixed(1) + ' PODER', '#2dffb3', 16, 1.2); txt(f.x + 30, f.y - 60, '+' + r.o + ' ●', '#f0b429', 14, 1.1);
      if (r.ch) txt(f.x - 30, f.y - 60, '+' + r.ch + ' ✧', '#39c8ff', 16, 1.2); if (r.gem) toast('¡Encontraste 1 gema! ◆', 'gold');
      sfx('coin'); orbs(f.x, f.y, '#2dffb3', 4); orbs(f.x, f.y, '#f0b429', 3); if (r.ch) orbs(f.x, f.y, '#39c8ff', 2);
      refreshCombat(); if (f.type === 'rival' && f.bi >= 0 && S.bots[f.bi]) S.bots[f.bi].p *= .97;
      if (f.type === 'rival') feed('<b>' + S.name + '</b> venció a ' + f.name + ' en PvP');
    }
    if (f.type === 'golem') MAP.golemT = 60;
    if (f.type === 'reyeco' || f.type === 'alfa') { MAP.bossT[f.type] = 90; banner('¡' + C.FOES[f.type].n.toUpperCase() + ' CAE!', '+chispas garantizadas'); }
  }
}
function heal(n) { P.hp = Math.min(P.cs.maxHp, P.hp + n); }
function hurtP(d, src) {
  if (P.dead || mode === 'off') return;
  if (P.iT > 0) { if (P.dashT > 0) txt(P.x, P.y - 60, '¡ESQUIVA!', '#2dffb3', 18, .6); return; }
  d = d * (1 - P.cs.def) * (P.shieldT > 0 ? .4 : 1) * (src && src.el ? C.afin(src.el, C.eqB(S).el) : 1); tip('esquiva', 'Las zonas ROJAS avisan un ataque. Toca » ESQUIVA: eres invulnerable un instante.');
  P.hp -= d; P.iT = .35; P.flash = .15; P.lastHurt = time; shake(6); vib(30); sfx('hurt');
  txt(P.x, P.y - 56, '-' + C.fmt(d), '#e0262f', 19);
  if (src) { var dx = P.x - src.x, dy = P.y - src.y, l = Math.hypot(dx, dy) || 1; P.kbx = dx / l * 220; P.kby = dy / l * 220; P.kbT = .12; }
  if (P.hp <= 0) playerDown();
}
function skill() {
  var E = C.EL[C.eqB(S).el], cs = P.cs, el = C.eqB(S).el;
  if (P.dead) return;
  if (P.skCd > 0) return;
  if (P.aura < E.cost) { txt(P.x, P.y - 70, 'AURA INSUFICIENTE', '#a42cff', 13, .7); return; }
  P.aura -= E.cost; P.skCd = E.cd; sfx('skill'); vib(25);
  var tg = nearestFoe(P, 300); if (tg) face(P, tg.x, tg.y);
  var dmg = cs.atk * E.x * cs.skm;
  ctextBanner(E.sk.toUpperCase(), E.c);
  if (el === 'fuego') { ents.push({ k: 'proj', team: 'pl', x: P.x + P.fx * 20, y: P.y - 22 + P.fy * 10, vx: P.fx * 430, vy: P.fy * 430, r: 14, dmg: dmg, life: .9, c: E.c, aoe: 55 }); }
  else if (el === 'agua') { heal(cs.maxHp * .3); ring(P.x, P.y, 280, E.c, .5); foes().forEach(function (f) { if (dist(P, f) < 150) { var l = dist(P, f) || 1; dmgFoe(f, dmg, false, (f.x - P.x) / l, (f.y - P.y) / l, 520); } }); txt(P.x, P.y - 70, '+30% VIDA', '#2dffb3', 18); }
  else if (el === 'rayo') { P.dashT = .18; P.iT = .25; P.ddx = P.fx; P.ddy = P.fy; P.dashSp = 900; P.rayo = dmg; P.rayHit = []; addFx({ k: 'lines', x: P.x, y: P.y, fx: P.fx, fy: P.fy, c: E.c, life: .3 }); }
  else if (el === 'tierra') { P.shieldT = 4; ring(P.x, P.y, 230, E.c, .45); shake(9); foes().forEach(function (f) { if (dist(P, f) < 115) { f.stun = .7; dmgFoe(f, dmg, true, 0, 0, 0); } }); }
  else if (el === 'viento') { ring(P.x, P.y, 260, E.c, .6); foes().forEach(function (f) { var d = dist(P, f); if (d < 140) { var l = d || 1; dmgFoe(f, dmg, true, -(f.x - P.x) / l, -(f.y - P.y) / l, Math.min(400, d * 3)); } }); }
  else if (el === 'sombra') { var tot = 0; foes().forEach(function (f) { if (inArc(P, f, 95 + f.r, .9)) { var h = f.hp; dmgFoe(f, dmg, true, P.fx, P.fy, 260); tot += Math.max(0, h - Math.max(0, f.hp)); } }); heal(tot * .5); addFx({ k: 'slash', x: P.x, y: P.y - 22, a: Math.atan2(P.fy, P.fx), r: 60, c: E.c, life: .3 }); }
  else if (el === 'luz') { ring(P.x, P.y, 320, E.c, .6); heal(cs.maxHp * .15); foes().forEach(function (f) { if (dist(P, f) < 160) dmgFoe(f, dmg, true, 0, 0, 0); }); }
  parts(P.x, P.y - 20, E.c, 16, 260);
}
function ctextBanner(t, c) { addFx({ k: 'txt', x: P.x, y: P.y - 86, s: t, c: c, size: 22, life: .9, rot: -.06 }); }
function dash() {
  if (P.dead || P.dashCd > 0 || P.dashT > 0) return;
  var mv = moveVec(), dx = mv.l > .1 ? mv.x / mv.l : P.fx, dy = mv.l > .1 ? mv.y / mv.l : P.fy;
  P.dashT = .16; P.ddx = dx; P.ddy = dy; P.dashSp = 560; P.iT = .22; P.dashCd = .75; P.rayo = 0;
  addFx({ k: 'lines', x: P.x, y: P.y, fx: dx, fy: dy, c: '#f2e8d5', life: .25 }); sfx('dash');
}
function moveVec() {
  var x = 0, y = 0;
  if (keys.a || keys.arrowleft) x -= 1; if (keys.d || keys.arrowright) x += 1; if (keys.w || keys.arrowup) y -= 1; if (keys.s || keys.arrowdown) y += 1;
  if (joy.id >= 0) { x = joy.x; y = joy.y; }
  var l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; l = 1; }
  return { x: x, y: y, l: l };
}
function updPlayer(dt) {
  if (P.dead) return;
  var cs = P.cs, mv = moveVec(), vx = 0, vy = 0;
  if (P.dashT > 0) {
    P.dashT -= dt; vx = P.ddx * P.dashSp; vy = P.ddy * P.dashSp;
    if (P.rayo) foes().forEach(function (f) { if (P.rayHit.indexOf(f) < 0 && dist(P, f) < 46 + f.r) { P.rayHit.push(f); dmgFoe(f, P.rayo, true, P.ddx, P.ddy, 200); } });
  } else if (P.kbT > 0) { P.kbT -= dt; vx = P.kbx; vy = P.kby; }
  else { vx = mv.x * cs.spd; vy = mv.y * cs.spd; }
  P.mv = mv.l > .1 && P.dashT <= 0;
  if (P.mv) { P.fx = mv.x / mv.l; P.fy = mv.y / mv.l; setDir(P, P.fx, P.fy); var w0 = P.walk; P.walk += dt * 11 * mv.l; if ((w0 % Math.PI) > (P.walk % Math.PI)) sfx('step'); }
  moveEnt(P, vx * dt, vy * dt);
  for (var i = 0; i < MAP.npcs.length; i++) { var n = MAP.npcs[i]; if (n.when && !n.when()) continue; var d = dist(P, n); if (d < 26 && d > 0) { var push = (26 - d); moveEnt(P, (P.x - n.x) / d * push, (P.y - n.y) / d * push); } }
  P.atkCd -= dt; P.skCd -= dt; P.dashCd -= dt; P.iT -= dt; P.flash -= dt; P.atkA -= dt; P.shieldT -= dt;
  P.aura = Math.min(100, P.aura + cs.aura * .35 * dt);
  if (time - P.lastHurt > 3) heal(cs.maxHp * cs.regen * dt * (mode === 'world' ? 3 : 1));
  if (inp.atk || (inp.hold && P.atkCd <= 0)) { attack(); inp.atk = 0; }
  if (inp.sk) { skill(); inp.sk = 0; }
  if (inp.dash) { dash(); inp.dash = 0; }
  if (P.shieldT > 0 && Math.random() < .3) parts(P.x + rnd(-14, 14), P.y - rnd(0, 40), '#d08a3c', 1, 30);
  if (S.cos.aura && P.mv && Math.random() < .4) addFx({ k: 'part', x: P.x - P.fx * 12, y: P.y - rnd(5, 35), vx: -P.fx * 40, vy: -20, c: '#0b0b0f', life: .35, sz: 4 });
}
function playerDown() {
  P.dead = 1; P.hp = 0; sfx('ko'); vib([60, 40, 60]); txt(P.x, P.y - 70, '¡K.O.!', '#e0262f', 40, 1.6); shake(12);
  if (mode === 'world') {
    S.cnt.deaths++; var lost = Math.floor(S.oro * .05); S.oro -= lost;
    setTimeout(function () { toast('Te derrotaron. Perdiste ' + C.fmt(lost) + ' de oro. ¡Levántate!', 'bad'); P.dead = 0; P.hp = P.cs.maxHp; go(MAP.id === 'tierras' ? 'tierras' : MAP.id, 'respawn'); }, 1400);
  } else if (mode === 'night') setTimeout(function () { nightLose(); }, 1300);
  else if (mode === 'duel') setTimeout(function () { duelEnd(false); }, 1300);
}

/* ---------- IA de enemigos ---------- */
function updFoe(f, dt) {
  var F = C.FOES[f.type];
  f.flash -= dt; f.atkA -= dt; f.mv = 0;
  if (f.kbT > 0) { f.kbT -= dt; moveEnt(f, f.kbx * dt, f.kby * dt); return; }
  if (f.stun > 0) { f.stun -= dt; return; }
  if (f.frozen) return;
  var d = dist(f, P), alive = !P.dead;
  var step = function (tx, ty, sp) { var dx = tx - f.x, dy = ty - f.y, l = Math.hypot(dx, dy) || 1; if (l < 4) return; if (moveEnt(f, dx / l * sp * dt, dy / l * sp * dt)) { f.stuck = (f.stuck || 0) + dt; } f.mv = 1; f.walk += dt * 10; setDir(f, dx, dy); };
  if (f.pvp) { f.aura = Math.min(100, f.aura + (8 + f.eP * .01) * dt); f.skCd -= dt; f.dodgeCd -= dt; }
  switch (f.st) {
    case 'idle':
      f.t -= dt; if (f.t <= 0) { f.tx = f.hx + rnd(-90, 90); f.ty = f.hy + rnd(-90, 90); f.t = rnd(1.5, 4); }
      if (f.tx !== undefined && Math.hypot(f.tx - f.x, f.ty - f.y) > 8) step(f.tx, f.ty, f.sp * .4);
      if (alive && d < f.aggro) { f.st = 'chase'; if (mode === 'world') tip('golpe', '¡Un enemigo! Toca ⚔ GOLPE. Tres golpes seguidos hacen un COMBO.'); }
      break;
    case 'chase':
      if (!alive) { f.st = 'idle'; break; }
      if (mode === 'world' && Math.hypot(f.x - f.hx, f.y - f.hy) > 560) { f.st = 'home'; break; }
      if (mode === 'world' && d > f.aggro * 2) { f.st = 'idle'; break; }
      if (f.pvp) {
        if (P.atkA > 0 && d < 90 && f.dodgeCd <= 0 && Math.random() < (f.type === 'vant' ? .5 : .3)) { f.dodgeCd = 1.6; var sd = Math.random() < .5 ? 1 : -1; f.kbx = (-(P.y - f.y) / d * sd - (P.x - f.x) / d) * 420; f.kby = ((P.x - f.x) / d * sd - (P.y - f.y) / d) * 420; f.kbT = .16; addFx({ k: 'lines', x: f.x, y: f.y, fx: f.kbx / 420, fy: f.kby / 420, c: '#fff', life: .2 }); break; }
        if (f.aura >= 45 && f.skCd <= 0 && d < 340 && d > 70) { foeSkill(f); break; }
      }
      step(P.x, P.y, f.sp * f.spm);
      if (d < F.rng + P.r) { f.st = 'wind'; f.t = F.wind * (f.type === 'vant' && f.hp < f.maxHp / 2 ? .7 : 1); f.ax = (P.x - f.x) / (d || 1); f.ay = (P.y - f.y) / (d || 1); setDir(f, f.ax, f.ay); }
      break;
    case 'wind':
      f.t -= dt; if (f.t <= 0 && f.type === 'alfa') { f.st = 'charge'; f.t = .42; f.hitDone = 0; sfx('dash'); break; }
      if (f.t <= 0) { foeStrike(f); if (f.pvp && !f.combo && Math.random() < .35) { f.combo = 1; f.st = 'wind'; f.t = F.wind * .6; break; } f.combo = 0; f.st = 'rec'; f.t = F.cd * rnd(.8, 1.2) * (f.spm > 1 ? .75 : 1); }
      break;
    case 'charge': /* embestida en línea recta del Alfa */
      f.t -= dt; moveEnt(f, f.ax * 560 * dt, f.ay * 560 * dt); if (Math.random() < .6) addFx({ k: 'part', x: f.x, y: f.y - 10, vx: 0, vy: -20, c: '#ff7a2e', life: .3, sz: 5 });
      if (!f.hitDone && dist(f, P) < P.r + f.r + 8) { f.hitDone = 1; hurtP(f.dmg * 1.3, f); }
      if (f.t <= 0) { f.st = 'rec'; f.t = F.cd; }
      break;
    case 'rec':
      f.t -= dt; if (f.pvp && d < 60) step(f.x * 2 - P.x, f.y * 2 - P.y, f.sp * .5); if (f.t <= 0) f.st = 'chase';
      break;
    case 'home':
      step(f.hx, f.hy, f.sp); f.hp = Math.min(f.maxHp, f.hp + f.maxHp * .2 * dt);
      if (Math.hypot(f.x - f.hx, f.y - f.hy) < 20 || f.stuck > 3) { f.st = 'idle'; f.stuck = 0; }
      break;
  }
  if (f.type === 'vant' && f.hp < f.maxHp / 2 && !f.ph2) { f.ph2 = 1; f.spm = 1.25; txt(f.x, f.y - 90, '¡NO PUEDES GANARME!', '#a42cff', 22, 1.6); shake(10); summon(f, 3); }
  if (f.type === 'vant') { f.sumT = (f.sumT || 10) - dt; if (f.sumT <= 0) { f.sumT = 12; summon(f, 2); } }
  if (f.type === 'reyeco' && f.st !== 'idle') { f.sumT = (f.sumT || 6) - dt; if (f.sumT <= 0 && ents.filter(function (q) { return q.type === 'eco' && !q.dead; }).length < 14) { f.sumT = 9; summon(f, 2); txt(f.x, f.y - 90, '¡HIJOS DEL ECO!', '#a42cff', 18, 1); } }
}
function summon(f, n) { for (var i = 0; i < n; i++) { var a = rnd(0, TAU); var e = mkFoe('eco', f.x + Math.cos(a) * 60, f.y + Math.sin(a) * 60, f.eP * .35); e.st = 'chase'; e.aggro = 900; ents.push(e); parts(e.x, e.y, '#a42cff', 8); } }
function foeStrike(f) {
  var F = C.FOES[f.type], d = dist(f, P); f.atkA = .18;
  if (F.aoe) { ring(f.x, f.y, F.rng * 2.2, '#ff2fb3', .4); shake(8); if (d < F.rng + P.r) hurtP(f.dmg * (Math.random() < f.crit ? 1.6 : 1), f); return; }
  addFx({ k: 'slash', x: f.x + f.ax * 10, y: f.y - 20 + f.ay * 10, a: Math.atan2(f.ay, f.ax), r: 30, c: '#e0262f', life: .15 });
  if (d < F.rng + P.r + 10) { var dot = ((P.x - f.x) * f.ax + (P.y - f.y) * f.ay) / (d || 1); if (d < 20 || dot > .35) hurtP(f.dmg * (Math.random() < f.crit ? 1.6 : 1), f); }
}
function foeSkill(f) {
  f.aura -= 45; f.skCd = f.type === 'vant' ? 3 : 4.5; var d = dist(f, P) || 1, c = C.EL[f.el || 'fuego'].c;
  ents.push({ k: 'proj', team: 'foe', x: f.x, y: f.y - 22, vx: (P.x - f.x) / d * 360, vy: (P.y - f.y) / d * 360, r: 13, dmg: f.dmg * 1.8, life: 1.2, c: c, el: f.el });
  txt(f.x, f.y - 70, f.type === 'vant' ? '¡ECLIPSE!' : '¡TOMA!', c, 18, .7); sfx('skill');
}
function updProj(p, dt) {
  p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
  if (Math.random() < .6) addFx({ k: 'part', x: p.x, y: p.y, vx: 0, vy: 0, c: p.c, life: .25, sz: 6 });
  if (hitT(p.x, p.y + 22, 4)) p.life = 0;
  if (p.team === 'pl') { var hit = null; foes().forEach(function (f) { if (!hit && Math.hypot(f.x - p.x, f.y - 22 - p.y) < f.r + p.r + 6) hit = f; }); if (hit) { p.life = 0; ring(p.x, p.y + 22, p.aoe * 2, p.c, .35); foes().forEach(function (f) { if (Math.hypot(f.x - p.x, f.y - 22 - p.y) < p.aoe + f.r) dmgFoe(f, p.dmg, true, p.vx / 430, p.vy / 430, 240); }); } }
  else if (!P.dead && Math.hypot(P.x - p.x, P.y - 22 - p.y) < P.r + p.r) { p.life = 0; burst(p.x, p.y, p.c, true); hurtP(p.dmg, p); }
  if (p.life <= 0) p.dead = 1;
}

/* ---------- bots sociales ---------- */
var BOTN = { plaza: 7, dojo: 5, forja: 4, tierras: 5, coliseo: 5 };
function spawnBots(id) {
  var n = BOTN[id] || 0, used = {};
  for (var i = 0; i < n; i++) {
    var bi = Math.random() * 99 | 0; if (used[bi]) continue; used[bi] = 1; var b = S.bots[bi], pos = freeSpot(T * 3);
    if (!pos) continue;
    ents.push({ k: 'bot', bi: bi, name: b.n, el: b.el, x: pos.x, y: pos.y, r: 12, dir: 0, walk: 0, mv: 0, look: botLook(b.h), t: rnd(0, 3), chatT: rnd(4, 18), atkA: 0, stuck: 0 });
  }
}
function freeSpot(minD) {
  for (var k = 0; k < 60; k++) {
    var i = 2 + Math.random() * (MAP.w - 4) | 0, j = 2 + Math.random() * (MAP.h - 4) | 0;
    if (isSolid(MAP, i, j) || isSolid(MAP, i, j - 1) || isSolid(MAP, i + 1, j) || isSolid(MAP, i - 1, j)) continue;
    var x = (i + .5) * T, y = (j + .6) * T; if (P && Math.hypot(x - P.x, y - P.y) < minD) continue;
    return { x: x, y: y };
  }
  return null;
}
function updBot(b, dt) {
  b.t -= dt; b.mv = 0; b.atkA -= dt; b.chatT -= dt;
  if (b.chatT <= 0) { b.chatT = rnd(10, 26); var l = C.BOTCHAT[MAP.id], cl = C.CLANS[b.bi % 3]; if (S.clan.id === cl.id && Math.random() < .3) say(b, '¡Vamos ' + cl.n.replace('Clan ', '') + '! ' + cl.ic); else if (l) say(b, l[Math.random() * l.length | 0]); }
  if (MAP.id === 'tierras' && b.t > 0) { var f = null, bd = 230; foes().forEach(function (q) { var d = dist(b, q); if (d < bd) { bd = d; f = q; } }); if (f) { if (bd > 40) stepTo(b, f.x, f.y, 120, dt); else if (b.atkA <= 0) { b.atkA = .6; face(b, f.x, f.y); f.hp -= f.maxHp * .08; f.flash = .1; burst(f.x, f.y - 22, '#fff'); if (f.hp <= 0) { f.hp = 0; f.dead = 1; parts(f.x, f.y - 20, '#a42cff', 10); txt(f.x, f.y - 60, '¡K.O.!', '#fff', 18); if (f.type === 'golem') MAP.golemT = 60; } } return; } }
  if (b.t <= 0) { var p = freeSpot(0); if (p && Math.random() < .7) { b.tx = p.x; b.ty = p.y; } else b.tx = undefined; b.t = rnd(3, 8); }
  if (b.tx !== undefined) { if (Math.hypot(b.tx - b.x, b.ty - b.y) > 10) stepTo(b, b.tx, b.ty, 105, dt); else b.tx = undefined; }
  else if (MAP.id === 'dojo' && Math.sin(time * 3 + b.bi) > .6) b.atkA = .15;
}
function stepTo(e, tx, ty, sp, dt) { var dx = tx - e.x, dy = ty - e.y, l = Math.hypot(dx, dy) || 1; if (moveEnt(e, dx / l * sp * dt, dy / l * sp * dt)) { e.stuck += dt; if (e.stuck > 1) { e.tx = undefined; e.stuck = 0; } } e.mv = 1; e.walk += dt * 10; setDir(e, dx, dy); }
function say(e, t) { e.bub = { t: t, life: 4 }; if (e.name) feed('<b>' + e.name + ':</b> ' + t); }
function quickChat(t) {
  say(P, t); P.name = S.name;
  if (t.indexOf('Amigos') >= 0) {
    ents.forEach(function (b) {
      if (b.k !== 'bot' || dist(b, P) > 340) return;
      setTimeout(function () { if (ents.indexOf(b) < 0) return; var ok = Math.random() < .6 && C.addFriend(S, b.bi); say(b, ok ? '¡Sí! 🤝' : S.friends.some(function (f) { return f.bi === b.bi; }) ? '¡ya somos amigos! :D' : 'jaja luego'); if (ok) { toast('¡Nuevo amigo: ' + b.name + '! Invítalo a tu grupo en Menú → Amigos', 'ok'); sfx('up'); save(); } }, rnd(600, 1800));
    });
    return;
  }
  ents.forEach(function (b) { if (b.k === 'bot' && dist(b, P) < 320 && Math.random() < .6) setTimeout(function () { if (ents.indexOf(b) >= 0) say(b, C.REPLY[Math.random() * C.REPLY.length | 0]); }, rnd(700, 2200)); });
}

/* ---------- grupo de amigos (aliados que te siguen y pelean contigo) ---------- */
function spawnParty() {
  S.party.forEach(function (bi, k) { var b = S.bots[bi]; if (!b) return; ents.push({ k: 'ally', bi: bi, name: b.n, el: b.el, look: botLook(b.h), x: P.x - 40 + k * 80, y: P.y + 30, r: 12, dir: 0, walk: 0, mv: 0, atkA: 0, cd: 0, slot: k, stuck: 0 }); });
}
function updAlly(a, dt) {
  a.mv = 0; a.atkA -= dt; a.cd -= dt;
  var d = dist(a, P); if (d > 620) { a.x = P.x - 30; a.y = P.y + 30; }
  if (MAP.id === 'tierras' && !P.dead) {
    var f = null, bd = 240; foes().forEach(function (q) { var dd = Math.min(dist(q, P), dist(q, a)); if (dd < bd && dist(q, P) < 320) { bd = dd; f = q; } });
    if (f) {
      var df = dist(a, f); if (df > 40) stepTo(a, f.x, f.y, 175, dt);
      else if (a.cd <= 0) { a.cd = .8; a.atkA = .16; face(a, f.x, f.y); var dm = f.maxHp * (f.boss ? .02 : .07); f.hp -= dm; f.flash = .1; burst(f.x, f.y - 22, C.EL[a.el].c); txt(f.x, f.y - 46, C.fmt(dm), '#2dffb3', 14, .6); if (f.st === 'idle') f.st = 'chase'; if (f.hp <= 0) { killFoe(f); var g = C.friendXP(S, a.bi, f.boss ? 5 : .5); if (g) toast(a.name + ' te regaló ' + g + ' ◆ (¡amistad!)', 'gold'); } }
      return;
    }
  }
  var tx = P.x - P.fx * 50 + (a.slot ? 34 : -34), ty = P.y - P.fy * 50;
  if (Math.hypot(tx - a.x, ty - a.y) > 46) stepTo(a, tx, ty, d > 200 ? 260 : 175, dt);
}
function orbs(x, y, c, n) { for (var i = 0; i < n; i++) { var an = rnd(0, TAU); addFx({ k: 'orb', x: x, y: y - 20, vx: Math.cos(an) * rnd(80, 180), vy: Math.sin(an) * rnd(80, 180), c: c, life: 2.5 }); } }

/* ---------- población de Tierras Rotas ---------- */
var RINGX = [[3, 14], [16, 29], [31, 43]];
function spawnFoes(dt) {
  spawnT -= dt; if (spawnT > 0) return; spawnT = 1;
  var cnt = [0, 0, 0], gol = null, bos = {};
  ents.forEach(function (e) { if (e.k === 'foe' && !e.dead) { if (e.type === 'golem') gol = e; else if (e.boss) bos[e.type] = 1; else cnt[e.ring]++; } });
  MAP.bossT = MAP.bossT || { reyeco: 0, alfa: 0 };
  [['reyeco', 0, 9.5, 6.6], ['alfa', 1, 22.5, 28.6]].forEach(function (b) { if (bos[b[0]]) return; MAP.bossT[b[0]] -= 1; if (MAP.bossT[b[0]] <= 0 && Math.hypot(b[2] * T - P.x, b[3] * T - P.y) > 300) { ents.push(mkFoe(b[0], b[2] * T, b[3] * T, C.ringPower(S, b[1]) * 1.15, { ring: b[1], name: C.FOES[b[0]].n })); MAP.bossT[b[0]] = 90; } });
  for (var r = 0; r < 3; r++) {
    if (cnt[r] >= [7, 7, 6][r]) continue;
    for (var k = 0; k < 20; k++) {
      var i = RINGX[r][0] + Math.random() * (RINGX[r][1] - RINGX[r][0]) | 0, j = 2 + Math.random() * (MAP.h - 4) | 0;
      if (isSolid(MAP, i, j) || isSolid(MAP, i, j - 1)) continue;
      var x = (i + .5) * T, y = (j + .6) * T; if (Math.hypot(x - P.x, y - P.y) < 340) continue;
      var q = Math.random(), type = r === 0 ? (q < .7 ? 'eco' : 'lobo') : r === 1 ? (q < .5 ? 'lobo' : 'bandido') : (q < .55 ? 'bandido' : q < .8 ? 'lobo' : 'rival');
      var eP = C.ringPower(S, r) * rnd(.9, 1.1), ex = { ring: r };
      if (type === 'rival') { var bi = Math.random() * 99 | 0, b = S.bots[bi]; ex.name = b.n; ex.el = b.el; ex.look = botLook(b.h); ex.bi = bi; eP = Math.max(C.RINGS[2].min, C.poder(S) * rnd(.85, 1.15)); }
      if (type === 'bandido') ex.look = { skin: '#c68642', shirt: '#43372c', pants: '#1b1b22', hair: '#1b1b22', scarf: '#e0262f' };
      ents.push(mkFoe(type, x, y, eP, ex)); break;
    }
  }
  if (!gol) { MAP.golemT = (MAP.golemT || 0) - 1; if (MAP.golemT <= 0) { ents.push(mkFoe('golem', 39.5 * T, 18.6 * T, C.ringPower(S, 2) * 1.1, { ring: 2, name: 'Gólem de Obsidiana' })); MAP.golemT = 60; } }
}

/* ---------- cambio de zona ---------- */
function go(id, from) {
  var f = $('fade'); f.classList.add('on'); paused++;
  setTimeout(function () {
    try { loadZone(id, from); } catch (e) { errors.push('loadZone ' + e.message); }
    paused = Math.max(0, paused - 1); f.classList.remove('on');
  }, 260);
}
function loadZone(id, from) {
  var prev = MAP && MAP.id;
  MAP = getMap(id); if (id === 'forja') refreshForja();
  mode = 'world'; S.zone = id; ents = []; fx = []; $('tbar').hidden = true; document.body.classList.remove('tour');
  if (!P) P = mkPlayer(); P.dead = 0; refreshCombat();
  var a = (from && MAP.arrive[from]) || (prev && MAP.arrive[prev]) || null;
  if (from === 'respawn' && MAP.portals[0]) a = MAP.arrive[MAP.portals[0].to];
  if (!a) { var n = MAP.npcs[0]; a = n ? { x: n.x, y: n.y + T * 1.4 } : MAP.spawn; }
  P.x = a.x; P.y = a.y; P.portCd = 1; cam.x = P.x; cam.y = P.y;
  ents.push(P); spawnParty(); spawnBots(id); spawnT = 0;
  if (id === 'tierras') { MAP.golemT = MAP.golemT || 0; for (var i = 0; i < 6; i++) spawnFoes(1); }
  C.ev(S, 'visit', { z: id });
  var ZT = { plaza: 'En la Plaza puedes hacer amigos (toca 💬 y di «¿Amigos?») y unirte a un clan con la Capitana Sol.', forja: 'Tu negocio gana oro aunque no juegues. Compra edificios en la MESA DEL TYCOON.', tierras: 'Tres anillos: más lejos del portal = más peligro y más premio. Mira el minimapa (arriba a la derecha).', coliseo: 'El Torneo Mundial: pierdes el % de poder de tu puesto. Habla con el Heraldo cuando tengas 120 de Poder.', dojo: 'Entrena con ritmo en el saco, precisión en las katas y calma en la cascada.' };
  if (ZT[id]) tip('z_' + id, ZT[id], 1);
  zoneTitle(); hudFull();
}

/* ---------- interacción ---------- */
function findInter() {
  var best = null, bd = 64;
  MAP.inter.forEach(function (it) { if (it.when && !it.when()) return; var d = Math.hypot(it.x - P.x, it.y - P.y); if (d < bd) { bd = d; best = it; } });
  return best;
}
function interact() { if (curInter && !P.dead && mode === 'world') { sfx('ui'); curInter.act(); } }

/* ---------- objetivo (flecha guía) ---------- */
function objTarget() {
  var o = C.stepObj(S); if (!o) return null;
  var z = null, id = null;
  if (o.k === 'talk' || o.k === 'give') { var w = C.who(S, o.who); z = NPCZ[w]; id = 'npc:' + w; }
  else if (o.k === 'train') { z = 'dojo'; id = { fue: 'saco', tec: 'kata', esp: 'medita' }[o.st]; }
  else if (o.k === 'build' || o.k === 'oro') { z = 'forja'; id = 'mesa'; }
  else if (o.k === 'kill') { z = 'tierras'; if (o.type === 'golem') id = 'golem'; }
  else if (o.k === 'forge') { z = 'forja'; id = 'npc:tobias'; }
  else if (o.k === 'tourney' || o.k === 'boss') { z = 'coliseo'; id = 'npc:heraldo'; }
  else if (o.k === 'fish') { z = 'plaza'; id = 'pesca'; }
  if (!z || mode !== 'world') return null;
  if (MAP.id !== z) { var to = MAP.id === 'plaza' ? z : 'plaza'; for (var i = 0; i < MAP.portals.length; i++) if (MAP.portals[i].to === to) return { x: MAP.portals[i].x, y: MAP.portals[i].y, por: 1 }; return null; }
  if (id === 'golem') { var g = null; ents.forEach(function (e) { if (e.type === 'golem' && !e.dead) g = e; }); return g ? { x: g.x, y: g.y - 40 } : { x: 39.5 * T, y: 18 * T }; }
  if (!id) return null;
  for (var k = 0; k < MAP.inter.length; k++) { var it = MAP.inter[k]; if (it.id === id && (!it.when || it.when())) return { x: it.x, y: it.y - 40 }; }
  return null;
}

/* ---------- bucle ---------- */
function update(dt) {
  if (mode === 'world') {
    curInter = findInter();
    if (MAP.id === 'tierras') spawnFoes(dt);
    P.portCd -= dt;
    if (P.portCd <= 0 && !P.dead) for (var i = 0; i < MAP.portals.length; i++) { var pt = MAP.portals[i]; if (Math.hypot(pt.x - P.x, pt.y - P.y) < 24) { P.portCd = 2; go(pt.to, MAP.id); return; } }
  } else curInter = null;
  updPlayer(dt);
  for (var j = 0; j < ents.length; j++) {
    var e = ents[j];
    if (e.k === 'foe' && !e.dead) { if (e.type === 'sombra') updShadow(e, dt); else updFoe(e, dt); }
    else if (e.k === 'bot') updBot(e, dt);
    else if (e.k === 'ally') updAlly(e, dt);
    else if (e.k === 'proj') updProj(e, dt);
    else if (e.k === 'cont') updCont(e, dt);
    if (e.bub) { e.bub.life -= dt; if (e.bub.life <= 0) e.bub = null; }
  }
  ents = ents.filter(function (e) { return !e.dead || e === P; });
  updFx(dt);
  if (mode === 'night') updNight(dt);
  else if (mode === 'duel') updDuel(dt);
}
function render() {
  var th = MAP ? MAP.th : TH.plaza;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = th.bg; ctx.fillRect(0, 0, cv.width, cv.height);
  if (!MAP || mode === 'off') return;
  cam.x += (P.x - cam.x) * .14; cam.y += (P.y - 20 - cam.y) * .14;
  var sx = 0, sy = 0; if (cam.sh > 0) { sx = rnd(-cam.sh, cam.sh); sy = rnd(-cam.sh, cam.sh); cam.sh *= .85; if (cam.sh < .3) cam.sh = 0; }
  var k = Z * DPR;
  ctx.setTransform(k, 0, 0, k, (W / 2 - (cam.x + sx) * Z) * DPR, (H / 2 - (cam.y + sy) * Z) * DPR);
  var vx0 = cam.x - W / 2 / Z - T, vy0 = cam.y - H / 2 / Z - T, vx1 = cam.x + W / 2 / Z + T, vy1 = cam.y + H / 2 / Z + 3 * T;
  var gx0 = Math.max(0, vx0), gy0 = Math.max(0, vy0), gx1 = Math.min(MAP.w * T, vx1), gy1 = Math.min(MAP.h * T, vy1), q = MAP.gq;
  if (gx1 > gx0 && gy1 > gy0) ctx.drawImage(MAP.ground, gx0 * q, gy0 * q, (gx1 - gx0) * q, (gy1 - gy0) * q, gx0, gy0, gx1 - gx0, gy1 - gy0);
  var list = [];
  MAP.objs.forEach(function (o) {
    if (o.t === 'portal') { if (o.x > vx0 && o.x < vx1 && o.y > vy0 && o.y < vy1) drawPortal(ctx, o); return; }
    if (o.when && !o.when()) return;
    var ox = o.t === 'blk' || o.t === 'bld' ? o.x * T : o.x, oy = o.t === 'blk' || o.t === 'bld' ? o.y * T : o.y, ow = o.w ? o.w * T : 0;
    if (ox + ow < vx0 || ox > vx1 || o.k < vy0 || oy - 120 > vy1) return; list.push(o);
  });
  ents.forEach(function (e) {
    if (e.x < vx0 || e.x > vx1 || e.y < vy0 || e.y > vy1 + 60) return;
    if (e.k === 'foe' && e.st === 'wind' && !e.dead) drawTele(ctx, e);
    list.push(e);
  });
  MAP.npcs.forEach(function (n) { if (!n.when || n.when()) { if (n.x > vx0 && n.x < vx1 && n.y > vy0 && n.y < vy1 + 60) list.push(n); } });
  list.sort(function (a, b) { return (a.k !== undefined && typeof a.k === 'number' ? a.k : a.y) - (b.k !== undefined && typeof b.k === 'number' ? b.k : b.y); });
  for (var i = 0; i < list.length; i++) {
    var e = list[i];
    if (typeof e.k === 'number') drawObj(ctx, e);
    else if (e.k === 'pl') { if (!P.dead || Math.sin(time * 20) > 0) drawAvatar(ctx, e.x, e.y, playerLook(), { dir: e.dir, walk: e.walk, mv: e.mv, atk: e.atkA, flash: e.flash, el: brzColor(), aura: S.cos.aura ? brzColor() : 0 }); if (e.shieldT > 0) { ctx.strokeStyle = '#d08a3c'; ctx.lineWidth = 3; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(e.x, e.y - 22, 22, 30, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; } }
    else if (e.k === 'npc') drawAvatar(ctx, e.x, e.y, e.look, { dir: Math.hypot(P.x - e.x, P.y - e.y) < 120 ? (P.y < e.y - 20 ? 1 : P.x < e.x - 30 ? 2 : P.x > e.x + 30 ? 3 : 0) : 0, el: C.NPC[e.key].c });
    else if (e.k === 'bot' || e.k === 'cont' || e.k === 'ally') drawAvatar(ctx, e.x, e.y, e.look, { dir: e.dir, walk: e.walk, mv: e.mv, atk: e.atkA, el: C.EL[e.el].c });
    else if (e.k === 'foe') drawFoe(ctx, e);
    else if (e.k === 'proj') { ctx.fillStyle = e.c; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e.x - 3, e.y - 3, e.r * .35, 0, TAU); ctx.fill(); }
  }
  drawFx(ctx);
  if (mode === 'night') drawDark();
  /* etiquetas, barras y globos */
  var k2 = Z * DPR; ctx.setTransform(k2, 0, 0, k2, (W / 2 - (cam.x + sx) * Z) * DPR, (H / 2 - (cam.y + sy) * Z) * DPR);
  for (i = 0; i < list.length; i++) {
    e = list[i]; if (typeof e.k === 'number') continue;
    var sc = (e.look && e.look.sc) || 1, top = e.y - 54 * sc;
    if (mode === 'night' && e !== P && dist(e, P) > lightR()) continue;
    if (e.k === 'npc') { nameTag(e.x, top - 6, C.NPC[e.key].n, C.NPC[e.key].c); var ob = objTarget(); if (ob && !ob.por && Math.abs(ob.x - e.x) < 2 && Math.abs(ob.y + 40 - e.y) < 2) ctext(ctx, '!', e.x, top - 30 + Math.sin(time * 6) * 4, 30, '#f0b429'); else { var sq = C.sideFor(S, e.key); if (sq) { var rd = sq.st && (C.sideReady(S, sq.q.id) || (sq.q.o.k === 'giveCh' && S.chispas >= sq.q.o.n)); if (!sq.st || rd) ctext(ctx, rd ? '✓' : '?', e.x, top - 30 + Math.sin(time * 5) * 3, 26, rd ? '#2dffb3' : '#f2e8d5'); } } }
    else if (e.k === 'bot' || e.k === 'cont') { var cl = C.CLANS[e.bi % 3]; nameTag(e.x, top - 6, (e.k === 'bot' ? cl.ic + ' ' : '') + e.name, e.k === 'bot' && S.clan.id === cl.id ? cl.c : '#f2e8d5'); }
    else if (e.k === 'ally') nameTag(e.x, top - 6, '🤝 ' + e.name, '#2dffb3');
    else if (e.k === 'foe' && !e.dead && e.type !== 'sombra') { var bw = e.boss ? 70 : 40; ctx.fillStyle = INK; ctx.fillRect(e.x - bw / 2 - 2, top - 12, bw + 4, 8); ctx.fillStyle = '#e0262f'; ctx.fillRect(e.x - bw / 2, top - 10, bw * Math.max(0, e.hp / e.maxHp), 4); if (e.name || e.boss) nameTag(e.x, top - 20, e.name || C.FOES[e.type].n, e.pvp ? '#ff2fb3' : '#f0b429'); }
    if (e.bub) bubble(e.x, top - (e.k === 'foe' ? 34 : 22), e.bub.t);
  }
  if (P.bub) bubble(P.x, P.y - 76, P.bub.t);
  if (mode === 'world' && S.cfg.q) { var ob2 = objTarget(); if (ob2) arrow(ob2); }
}
function drawTele(g, e) {
  var F = C.FOES[e.type], p = 1 - e.t / F.wind; g.globalAlpha = .25 + p * .35; g.fillStyle = '#e0262f';
  if (e.type === 'alfa') { g.save(); g.translate(e.x, e.y); g.rotate(Math.atan2(e.ay, e.ax)); g.beginPath(); g.rect(0, -22, 250 * (.4 + p * .6), 44); g.fill(); g.restore(); g.beginPath(); g.save(); g.translate(e.x, e.y); g.rotate(Math.atan2(e.ay, e.ax)); g.rect(0, -22, 250, 44); g.restore(); }
  else if (C.FOES[e.type].aoe) { g.beginPath(); g.ellipse(e.x, e.y, F.rng * p, F.rng * p * .55, 0, 0, TAU); g.fill(); g.globalAlpha = .8; g.strokeStyle = '#e0262f'; g.lineWidth = 2; g.beginPath(); g.ellipse(e.x, e.y, F.rng, F.rng * .55, 0, 0, TAU); g.stroke(); }
  else { var a = Math.atan2(e.ay, e.ax); g.beginPath(); g.moveTo(e.x, e.y); g.arc(e.x, e.y, (F.rng + 14) * (.5 + p * .5), a - 1, a + 1); g.closePath(); g.fill(); }
  /* rayas blancas: el aviso se entiende sin depender del color (daltonismo) */
  g.save(); g.clip(); g.globalAlpha = .45; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath();
  for (var k = -90; k < 90; k += 12) { g.moveTo(e.x + k, e.y - 60); g.lineTo(e.x + k + 60, e.y + 60); } g.stroke(); g.restore();
  g.globalAlpha = 1;
}
function nameTag(x, y, t, c) { ctx.font = '700 11px Cuerpo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeText(t, x, y); ctx.fillStyle = c; ctx.fillText(t, x, y); }
function bubble(x, y, t) {
  ctx.font = '600 12px Cuerpo, sans-serif'; var w = Math.min(170, ctx.measureText(t).width + 14);
  ctx.fillStyle = PAP; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(x - w / 2, y - 22, w, 20); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 5, y - 2); ctx.lineTo(x, y + 6); ctx.lineTo(x + 5, y - 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = PAP; ctx.fillRect(x - 4, y - 4, 8, 3);
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y - 12, w - 8);
}
function arrow(o) {
  var sx = (o.x - cam.x) * Z + W / 2, sy = (o.y - cam.y) * Z + H / 2, m = 70;
  if (sx > m && sx < W - m && sy > m + 60 && sy < H - m - 60) { if (o.por) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctext(ctx, '▼', sx, sy - 30 + Math.sin(time * 6) * 5, 26, '#f0b429'); } return; }
  var cx = W / 2, cy = H / 2, a = Math.atan2(sy - cy, sx - cx), r = Math.min(W, H) / 2 - 64;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.save(); ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .95); ctx.rotate(a);
  ctx.fillStyle = '#f0b429'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -13); ctx.lineTo(-4, 0); ctx.lineTo(-10, 13); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}

/* ---------- torneo: la Noche ---------- */

function tourStart() {
  if (C.poder(S) < C.TOUR.req) { toast('Necesitas ' + C.TOUR.req + ' de Poder para inscribirte.', 'bad'); return; }
  TR = { field: C.makeField(S, Math.random), P: Math.max(C.poder(S), C.TOUR.req), t: 0, out: 0, round: 0, buf: { atk: 1, hp: 1, au: 1 }, fuel: 100, whisp: 0, beatT: 0, pendT: 0 };
  TR.order = C.nightOrder(TR.field, TR.P, Math.random);
  C.setPend(S, 100); save();
  cinematic('LA NOCHE DEL ECLIPSE', 'Fase 1 · Sobrevive 75 segundos. Las sombras se congelan con tu luz.', function () { loadNight(); });
}
function loadNight() {
  MAP = buildArena('night'); renderGround(MAP); mode = 'night'; ents = []; fx = [];
  P.buf = TR.buf; refreshCombat(); P.hp = P.cs.maxHp; P.dead = 0; P.x = MAP.spawn.x; P.y = MAP.spawn.y; cam.x = P.x; cam.y = P.y; ents.push(P);
  var nv = S.cfg.q ? 16 : 9, vis = TR.order.slice(TR.order.length - nv); for (var i = 0; i < nv; i++) { var pos = freeSpot(120); if (!pos) continue; var b = TR.field[vis[i]]; ents.push({ k: 'cont', fi: vis[i], name: b.n, el: b.el, look: botLook(b.h), x: pos.x, y: pos.y, r: 12, dir: 0, walk: 0, mv: 0, t: 0, atkA: 0, stuck: 0 }); }
  for (i = 0; i < 6; i++) addLlama();
  for (i = 0; i < 3; i++) addShadow();
  TR.shT = 0; zoneTitle(); hudFull(); $('tbar').hidden = false; document.body.classList.add('tour');
}
function addLlama() { var p = freeSpot(160); if (p) MAP.objs.push({ t: 'deco', d: 'llama', x: p.x, y: p.y, k: p.y, ll: 1 }); }
function addShadow() {
  for (var k = 0; k < 30; k++) { var p = freeSpot(330); if (!p) continue; var e = mkFoe('sombra', p.x, p.y, 1); e.burn = 0; e.lit = 0; ents.push(e); return; }
}
function updCont(c, dt) {
  c.t -= dt; if (c.t <= 0) { var p = freeSpot(0); if (p) { c.tx = p.x; c.ty = p.y; } c.t = rnd(2, 5); }
  if (c.tx !== undefined && Math.hypot(c.tx - c.x, c.ty - c.y) > 10) stepTo(c, c.tx, c.ty, 95, dt); else c.mv = 0;
}
function lightR() { return 60 + TR.fuel * 1.1; }
function isLit(e) {
  var d = dist(P, e); if (d < lightR() * .85) return true;
  if (TR.fuel <= 0 || d > 270) return false;
  return ((e.x - P.x) * P.fx + (e.y - P.y) * P.fy) / (d || 1) > Math.cos(.5);
}
function updShadow(e, dt) {
  e.lit = isLit(e); e.flash -= dt;
  if (e.kbT > 0) { e.kbT -= dt; moveEnt(e, e.kbx * dt, e.kby * dt); return; }
  if (e.lit) { e.burn += dt; if (e.burn > 1.3) { parts(e.x, e.y - 26, '#5c5470', 10); var p = freeSpot(380); if (p) { e.x = p.x; e.y = p.y; } e.burn = 0; } return; }
  e.burn = Math.max(0, e.burn - dt * .5);
  var sp = 88 * (TR.fuel <= 0 ? 1.35 : 1) * (1 + TR.t / 150), dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1;
  moveEnt(e, dx / d * sp * dt, dy / d * sp * dt);
  if (d < 24 && !P.dead) { sfx('scare'); hurtP(P.cs.maxHp * .21, e); flashScreen(); var q = freeSpot(380); if (q) { e.x = q.x; e.y = q.y; } }
}
function updNight(dt) {
  TR.t += dt; TR.fuel = Math.max(0, TR.fuel - 1.45 * dt);
  MAP.objs = MAP.objs.filter(function (o) { if (o.ll && Math.hypot(o.x - P.x, o.y - P.y) < 30) { TR.fuel = Math.min(100, TR.fuel + 38); sfx('coin'); txt(P.x, P.y - 60, '+LUZ', '#ffb02e', 20); setTimeout(addLlama, 2500); return false; } return true; });
  TR.shT += dt; var want = Math.min(9, 3 + Math.floor(TR.t / 11)), have = ents.filter(function (e) { return e.type === 'sombra'; }).length; if (have < want && TR.shT > 2) { TR.shT = 0; addShadow(); }
  var alive = C.aliveAt(TR.t);
  while (99 - TR.out > alive && TR.out < TR.order.length) {
    var fi = TR.order[TR.out++], b = TR.field[fi]; feed('✖ <b>' + b.n + '</b> cayó en la oscuridad');
    ents.forEach(function (e) { if (e.k === 'cont' && e.fi === fi) { e.dead = 1; parts(e.x, e.y - 20, '#000', 12); txt(e.x, e.y - 60, '¡AAAH!', '#fff', 18); } });
  }
  TR.pendT -= dt; if (TR.pendT <= 0) { TR.pendT = 1; C.setPend(S, 99 - TR.out + 1); }
  var near = 999; ents.forEach(function (e) { if (e.type === 'sombra') near = Math.min(near, dist(e, P)); });
  TR.beatT -= dt; if (near < 260 && TR.beatT <= 0) { sfx('beat'); TR.beatT = near < 130 ? .45 : .8; }
  if (TR.t > 22 && TR.whisp === 0) { TR.whisp = 1; whisper('…tu poder… será mío…'); }
  if (TR.t > 50 && TR.whisp === 1) { TR.whisp = 2; whisper('…nadie vale nada sin poder…'); }
  var left = Math.max(0, C.TOUR.nightT - TR.t);
  tbar('NOCHE · <b>' + Math.ceil(left) + 's</b> · QUEDAN <b>' + (99 - TR.out + (P.dead ? 0 : 1)) + '</b> · LUZ <b>' + Math.round(TR.fuel) + '%</b>');
  if (left <= 0 && !P.dead) nightWin();
}
/* Oscuridad de la Noche en UNA sola pasada: degradado de dos círculos con forma de linterna (el círculo exterior
   se adelanta hacia donde miras). Sin lienzo intermedio ni reescalado → ~20 fps más en celulares modestos. */
function drawDark() {
  var px = P.x, py = P.y - 20, r = lightR(), L = TR.fuel > 0 ? 270 : 0;
  var cx = px + P.fx * L * .42, cy = py + P.fy * L * .42, R2 = Math.max(r, L * .62);
  var gr = ctx.createRadialGradient(px, py, r * .22, cx, cy, R2);
  gr.addColorStop(0, 'rgba(3,1,8,0)'); gr.addColorStop(.6, 'rgba(3,1,8,.6)'); gr.addColorStop(1, 'rgb(3,1,8)');
  /* solo se mezcla (caro) dentro del recuadro de la linterna; fuera, relleno opaco (barato) */
  var x0 = cam.x - W / 2 / Z - 40, y0 = cam.y - H / 2 / Z - 40, x1 = x0 + W / Z + 80, y1 = y0 + H / Z + 80;
  var bx0 = Math.max(x0, cx - R2), by0 = Math.max(y0, cy - R2), bx1 = Math.min(x1, cx + R2), by1 = Math.min(y1, cy + R2);
  ctx.fillStyle = '#030108';
  if (bx1 <= bx0 || by1 <= by0) ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  else { ctx.fillRect(x0, y0, x1 - x0, by0 - y0); ctx.fillRect(x0, by1, x1 - x0, y1 - by1); ctx.fillRect(x0, by0, bx0 - x0, by1 - by0); ctx.fillRect(bx1, by0, x1 - bx1, by1 - by0); ctx.fillStyle = gr; ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0); }
  ctx.globalCompositeOperation = 'lighter';
  ents.forEach(function (e) { if (e.k === 'cont') { ctx.fillStyle = 'rgba(255,176,46,.16)'; ctx.beginPath(); ctx.arc(e.x, e.y - 20, 18, 0, TAU); ctx.fill(); } });
  MAP.objs.forEach(function (o) { if (o.ll) { ctx.fillStyle = 'rgba(255,176,46,.3)'; ctx.beginPath(); ctx.arc(o.x, o.y - 14, 26, 0, TAU); ctx.fill(); } });
  ctx.globalCompositeOperation = 'source-over';
  ents.forEach(function (e) { if (e.type === 'sombra' && !e.lit && dist(e, P) < 420) { ctx.fillStyle = '#fff'; ctx.globalAlpha = .6 + Math.sin(time * 9 + e.ph) * .3; ctx.fillRect(e.x - 5, e.y - 46, 3, 3); ctx.fillRect(e.x + 2, e.y - 46, 3, 3); ctx.globalAlpha = 1; } });
}
function nightLose() { var rk = 99 - TR.out + 1; finishTour(rk); }
function nightWin() {
  mode = 'pause'; sfx('win');
  var surv = TR.order.slice(TR.out).map(function (i) { return { i: i, p: TR.field[i].p }; });
  surv.push({ i: -1, p: C.poder(S) }); surv.sort(function (a, b) { return b.p - a.p; });
  var br = []; for (var k = 0; k < surv.length / 2; k++) { br.push(surv[k]); br.push(surv[surv.length - 1 - k]); }
  TR.br = br; TR.round = 0; C.setPend(S, 32); save(); $('tbar').hidden = true;
  banner('¡SOBREVIVISTE!', 'Top 32 · Ahora, los duelos');
  setTimeout(nextDuel, 1800);
}
function nextDuel() {
  var br = TR.br, me = -1; for (var i = 0; i < br.length; i++) if (br[i].i === -1) me = i;
  var opp = br[me ^ 1], b = TR.field[opp.i];
  var names = ['DIECISEISAVOS', 'OCTAVOS', 'CUARTOS DE FINAL', 'SEMIFINAL', 'GRAN FINAL'];
  showStrategy(names[TR.round], b, function () { loadDuel({ type: 'duelo', eP: opp.p, name: b.n, el: b.el, look: botLook(b.h) }); });
}
function loadDuel(o) {
  MAP = buildArena('duel'); renderGround(MAP); mode = 'duel'; ents = []; fx = [];
  P.buf = TR ? TR.buf : { atk: 1, hp: 1, au: 1 }; refreshCombat(); P.hp = P.cs.maxHp; P.dead = 0; P.aura = TR && TR.buf.au > 1 ? 60 : 30;
  P.x = MAP.spawn.x - 120; P.y = MAP.spawn.y; P.fx = 1; P.fy = 0; P.dir = 3; cam.x = P.x + 60; cam.y = P.y;
  var f = mkFoe(o.type, MAP.spawn.x + 120, MAP.spawn.y, o.eP, { name: o.name, el: o.el, look: o.look, st: 'chase', aggro: 2000 });
  f.frozen = 1; ents.push(P); ents.push(f);
  TR.opp = f; TR.dt = 0; TR.cd = 3; TR.boss = o.type === 'vant';
  zoneTitle(); hudFull(); $('tbar').hidden = false; document.body.classList.add('tour');
}
function updDuel(dt) {
  var f = TR.opp;
  if (TR.cd > 0) { var c0 = Math.ceil(TR.cd); TR.cd -= dt; if (Math.ceil(TR.cd) !== c0) { if (TR.cd > 0) banner(String(Math.ceil(TR.cd)), ''); else { banner('¡PELEA!', ''); f.frozen = 0; } sfx('ui'); } tbar('VS <b>' + f.name + '</b> · PODER <b>' + C.fmt(f.eP) + '</b>'); return; }
  if (TR.ended) return;
  TR.dt += dt; var left = Math.max(0, (TR.boss ? 120 : 60) - TR.dt);
  tbar('VS <b>' + f.name + '</b> · <b>' + Math.ceil(left) + 's</b> · TÚ ' + Math.round(P.hp / P.cs.maxHp * 100) + '% · ÉL ' + Math.round(Math.max(0, f.hp) / f.maxHp * 100) + '%');
  if (f.hp <= 0 || f.dead) { TR.ended = 1; hitstop = .3; setTimeout(function () { duelEnd(true); }, 1200); }
  else if (left <= 0) { TR.ended = 1; duelEnd(P.hp / P.cs.maxHp >= f.hp / f.maxHp); }
}
function duelEnd(won) {
  if (mode !== 'duel') return; var f = TR.opp, frac = 1 - Math.max(0, f.hp) / f.maxHp; mode = 'pause'; TR.ended = 0; $('tbar').hidden = true;
  if (TR.duelTest) return;
  if (TR.boss) { vantEnd(won); return; }
  if (!won) { finishTour(C.rankLoss(TR.round, frac)); return; }
  sfx('win'); banner('¡VICTORIA!', '');
  var nb = []; for (var i = 0; i < TR.br.length; i += 2) { var a = TR.br[i], b = TR.br[i + 1]; if (a.i === -1 || b.i === -1) nb.push(a.i === -1 ? a : b); else nb.push(Math.random() < C.duelP(a.p, b.p) ? a : b); }
  TR.round++;
  if (nb.length === 1) { setTimeout(function () { finishTour(1); }, 1400); return; }
  var r2 = []; for (i = 0; i < nb.length / 2; i++) { r2.push(nb[i]); r2.push(nb[nb.length - 1 - i]); }
  TR.br = r2; C.setPend(S, nb.length); save();
  setTimeout(nextDuel, 1500);
}
function finishTour(rk) {
  mode = 'pause'; $('tbar').hidden = true;
  var res = C.applyTour(S, rk); save(); refreshCombat();
  S.bots.forEach(function (b) { if (Math.random() < .3) b.p *= 1 - Math.random() * .3; });
  showResults(res, function () {
    var go2 = function () { TR = null; P.buf = { atk: 1, hp: 1, au: 1 }; refreshCombat(); P.hp = P.cs.maxHp; loadZone('coliseo', 'arena'); storyCheck(true); };
    if (rk === 1 && C.STORY[S.story.i].id === 'c5') { dialog([['vant', 'Felicidades, campeón. Sube a mi palco… y veamos cuánto vale tu poder contra el de miles.']], function () { startVant(); }); }
    else go2();
  });
}
function startVant() {
  TR = TR || {}; TR.buf = { atk: 1.1, hp: 1.1, au: 1.2 };
  cinematic('EL PALCO DEL ANFITRIÓN', 'Vant pelea con el poder robado de miles. Esquiva sus eclipses.', function () { loadDuel({ type: 'vant', eP: C.poder(S) * 1.25, name: 'VANT', el: 'sombra', look: NPCL.vant }); });
}
function vantEnd(won) {
  if (won) { C.ev(S, 'boss', { who: 'vant' }); save(); TR = null; loadZone('coliseo', 'arena'); storyCheck(true); }
  else { TR = null; toast('Vant te venció. Gana otro torneo para volver a enfrentarlo.', 'bad'); loadZone('coliseo', 'arena'); }
}
