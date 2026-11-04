// Genera para Roblox (Rojo):
//   roblox/src/shared/Datos.luau   → todos los datos del juego (historia, enemigos, edificios…) traducidos desde src/core.js
//   roblox/src/server/Golden.luau  → casos de prueba “de oro” calculados con el núcleo JS, que Pruebas.server.luau compara en Studio
// Además verifica aquí que el literal Luau generado se lee de vuelta idéntico a los datos JS.
// Uso: TZ=UTC node tools/gen-roblox.js
'use strict';
process.env.TZ = 'UTC';
const fs = require('fs'), path = require('path'), C = require('../src/core.js');
const OUT = p => path.join(__dirname, '../roblox/src', p);

/* ---------- serializador a literal Luau ---------- */
function num(v) { if (!isFinite(v)) throw new Error('número no finito'); return Object.is(v, -0) ? '0' : String(v); }
function str(v) { return '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"'; }
function lua(v, ind, cmp) {
  ind = ind || '';
  if (v === null || v === undefined) return 'nil';
  if (typeof v === 'number') return num(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') return str(v);
  const i2 = ind + '\t';
  if (Array.isArray(v)) { if (v.some(x => x === null || x === undefined)) throw new Error('arreglo con huecos'); return v.length ? '{' + v.map(x => lua(x, i2, cmp)).join(cmp ? ',' : ', ') + '}' : '{}'; }
  const ks = Object.keys(v).filter(k => v[k] !== undefined && typeof v[k] !== 'function');
  if (!ks.length) return '{}';
  const kv = k => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(k) && !LUAKW.has(k) ? k : '[' + str(k) + ']') + (cmp ? '=' : ' = ') + lua(v[k], i2, cmp);
  return cmp ? '{' + ks.map(kv).join(',') + '}' : '{\n' + ks.map(k => i2 + kv(k)).join(',\n') + '\n' + ind + '}';
}
const LUAKW = new Set('and break do else elseif end false for function if in local nil not or repeat return then true until while continue'.split(' '));

/* ---------- lector mínimo de literales Luau (para verificar el generador) ---------- */
function parseLua(src) {
  let i = 0; const ws = () => { while (i < src.length) { if (/\s/.test(src[i])) i++; else if (src.startsWith('--', i)) { while (i < src.length && src[i] !== '\n') i++; } else break; } };
  const val = () => {
    ws(); const c = src[i];
    if (c === '{') { i++; const arr = [], obj = {}; let isArr = true, any = false;
      for (;;) { ws(); if (src[i] === '}') { i++; break; } any = true;
        let key = null; const save = i;
        if (src[i] === '[') { i++; key = val(); ws(); i++; ws(); i++; isArr = false; }
        else { const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i)); if (m) { let j = i + m[0].length; while (/\s/.test(src[j])) j++; if (src[j] === '=' && src[j + 1] !== '=') { key = m[0]; i = j + 1; isArr = false; } } }
        if (key === null) i = save;
        const v = val(); if (key === null) arr.push(v); else obj[key] = v; ws(); if (src[i] === ',') i++; }
      return !any ? {} : isArr ? arr : obj; }
    if (c === '"') { i++; let s = ''; while (src[i] !== '"') { if (src[i] === '\\') { i++; s += src[i] === 'n' ? '\n' : src[i]; i++; } else s += src[i++]; } i++; return Buffer.from(s, 'latin1').toString('utf8') === s ? s : s; }
    const m = /^(true|false|nil|-?[0-9.]+(?:e[-+]?[0-9]+)?)/i.exec(src.slice(i)); if (!m) throw new Error('literal inesperado en ' + i + ': ' + src.slice(i, i + 30)); i += m[0].length;
    return m[0] === 'true' ? true : m[0] === 'false' ? false : m[0] === 'nil' ? null : Number(m[0]);
  };
  return val();
}
const norm = v => JSON.parse(JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) && !Object.keys(x).length) ? {} : x));

/* ---------- 1. Datos.luau ---------- */
const DATA = { VERSION: C.VERSION, SAVE_KEY: C.SAVE_KEY, M: C.M, EL: C.EL, ELK5: C.ELK5, TIERS: C.TIERS, RANKS: C.RANKS, ORIG: C.ORIG, NPC: C.NPC, ZONES: C.ZONES, FOES: C.FOES, RINGS: C.RINGS,
  BLD: C.BLD, ACT: C.ACT, GEAR: C.GEAR, SHOP: C.SHOPL, TOUR: C.TOUR, LOOK: C.LOOK, CHAT: C.CHAT, BOTCHAT: C.BOTCHAT, REPLY: C.REPLY, STORY: C.STORY, SIDE: C.SIDE, DQ: C.DQ,
  FORGE: C.FORGE.slice(1), NEWB: C.NEWB, NA: C.NA, NB: C.NB, BAD: C.BAD };
const datosSrc = '--!nonstrict\n-- ARCHIVO GENERADO por tools/gen-roblox.js desde src/core.js — NO EDITAR A MANO.\n-- Índices: BLD[i].i y STI son base 0 (igual que en la versión HTML) para que las partidas sean compatibles.\nreturn ' + lua(DATA) + '\n';
const back = parseLua(datosSrc.slice(datosSrc.indexOf('return ') + 7));
if (JSON.stringify(norm(back)) !== JSON.stringify(norm(DATA))) { console.error('✖ Datos.luau no coincide al releerlo'); process.exit(1); }
fs.writeFileSync(OUT('shared/Datos.luau'), datosSrc);

/* ---------- 2. Golden.luau: casos de prueba ---------- */
const NOW = Date.UTC(2026, 10, 4, 12, 0, 0);
const snap = s => {
  const o = JSON.parse(JSON.stringify(s));
  delete o.bots; delete o.look; delete o.cfg; delete o.tips; if (o.pend) delete o.pend.t; (o.tours || []).forEach(t => delete t.d);
  o.botsP = s.bots.reduce((a, b) => a + b.p, 0); o.bots3 = s.bots.slice(0, 3).map(b => b.n + '|' + b.el + '|' + b.h);
  return o;
};
const cases = { rng: [], fn: [], sc: [] };
for (const seed of [1, 7, 12345, 2147483648, 4294967295, 99991]) { const R = C.mulberry(seed); cases.rng.push({ seed, v: Array.from({ length: 8 }, R) }); }
const fn = (f, a, r) => cases.fn.push({ f, a, r: r === undefined ? null : r });
[0, 9999, 10000, 12345, 99999, 123456, 1250000, 999999, 1e6, 15e6, 2.5e9, 7.77e12].forEach(n => fn('fmt', [n], C.fmt(n)));
[1, 2, 7, 50, 99, 100].forEach(r => fn('lossPct', [r], C.lossPct(r)));
[0, 10, 37.5, 75, 80].forEach(t => fn('aliveAt', [t], C.aliveAt(t)));
[[100, 100], [150, 100], [10, 3000]].forEach(a => fn('duelP', a, C.duelP(...a)));
for (let r = 0; r < 5; r++) [0, .3, .999, 1].forEach(f => fn('rankLoss', [r, f], C.rankLoss(r, f)));
[0, 1, 7, 25, 60].forEach(n => { fn('bMile', [n], C.bMile(n)); fn('gearCost', [n % 21], C.gearCost(n % 21)); fn('gearMul', [n % 21], C.gearMul(n % 21)); fn('elixCost', [n], C.elixCost(n)); fn('cajaCost', [n % 9], C.cajaCost(n % 9)); });
C.BLD.forEach(d => [0, 3, 40].forEach(n => fn('bCost', [d.id, n], C.bCost(d.id, n))));
[NOW, Date.UTC(2024, 1, 29, 23, 59), Date.UTC(2030, 11, 31, 5), Date.UTC(1999, 0, 1)].forEach(t => fn('today', [t], C.today(t)));
['  Nova<script>  ', 'idiota123', 'Ñandú   Pro', 'José_María-99 extra largo', '', 'ÁÉÍÓÚ áéíóú ñÑüÜ'].forEach(n => fn('cleanName', [n], C.cleanName(n)));
[0, 59, 60, 1500, 999999, 1e6].forEach(p => fn('rankOf', [p], C.rankOf(p)));
[1, 300, 1e6].forEach(p => fn('statsOfPower', [p], C.statsOfPower(p)));
Object.keys(C.EL).forEach(el => fn('fighter', [{ fue: 120, tec: 80, esp: 60 }, 1.7, el], C.fighter({ fue: 120, tec: 80, esp: 60 }, 1.7, el)));
Object.keys(C.FOES).forEach(t => [15, 500].forEach(eP => fn('foeStats', [t, eP], C.foeStats(t, eP))));
{ const R = C.mulberry(5), used = {}; fn('botNames', [5], Array.from({ length: 12 }, () => C.botName(R, used))); }

/* escenarios: operaciones aleatorias deterministas sobre un estado */
const ACTS = ['saco', 'kata', 'medita'], STS = ['fue', 'tec', 'esp'], ELS = Object.keys(C.EL), TYPES = ['eco', 'lobo', 'bandido', 'golem', 'rival', 'duelo'];
function scenario(origin, seed, el, nops) {
  const R = C.mulberry(seed * 31 + 7), pk = a => a[Math.floor(R() * a.length)];
  const s = C.newState({ name: 'Prueba ' + origin, origin, seed, el, now: NOW, skin: 2, shirt: 3, hair: 1 });
  const sc = { origin, seed, el, now: NOW, init: snap(s), ops: [] };
  let now = NOW;
  for (let k = 0; k < nops; k++) {
    let f, a = [], r;
    const x = R();
    if (x < .14) { f = 'train'; a = [pk(ACTS), pk([0, .6, 1, 1.25])]; r = C.train(s, ...a); }
    else if (x < .24) { f = 'killReward'; a = [pk(TYPES), Math.round(R() * 2000) + 15, Math.floor(R() * 1e6)]; r = C.killReward(s, a[0], a[1], C.mulberry(a[2])); }
    else if (x < .30) { f = 'buyB'; a = [pk(C.BLD).id]; r = C.buyB(s, a[0]); }
    else if (x < .33) { f = 'buyGear'; a = [pk(STS)]; r = C.buyGear(s, a[0]); }
    else if (x < .36) { f = 'buyElix'; a = [pk(STS)]; r = C.buyElix(s, a[0]); }
    else if (x < .38) { f = 'eat'; r = C.eat(s); }
    else if (x < .42) { f = 'tapOro'; r = C.tapOro(s); }
    else if (x < .43) { f = 'buyCaja'; r = C.buyCaja(s); }
    else if (x < .45) { f = 'forgeNew'; a = [pk(ELS)]; r = C.forgeNew(s, a[0]); }
    else if (x < .47) { f = 'forgeUp'; a = [pk(s.brz).id]; r = C.forgeUp(s, a[0]); }
    else if (x < .48) { f = 'equip'; a = [pk(s.brz).id]; r = C.equip(s, a[0]); }
    else if (x < .50) { f = 'shopBuy'; a = [pk(['plata', 'oro', 'aura', 'capa', 'caja', 'nada']), pk(ELS)]; r = C.shopBuy(s, a[0], a[1]); }
    else if (x < .55) { f = 'tick'; a = [Math.round(R() * 600) / 100]; r = C.tick(s, a[0]); }
    else if (x < .57) { now += Math.round(R() * 5e7); f = 'offline'; a = [now]; r = C.offline(s, now); }
    else if (x < .59) { now += Math.round(R() * 1e8); f = 'dailyCheck'; a = [now]; r = C.dailyCheck(s, now); }
    else if (x < .61) { f = 'dailyClaim'; a = [Math.floor(R() * 3)]; r = C.dailyClaim(s, a[0]); }
    else if (x < .70) { const o = C.stepObj(s) || {}; f = 'ev'; const t = pk(['train', 'kill', 'build', 'oro', 'talk', 'give', 'boss', 'forge', 'tourney', 'visit', 'perf', 'anvil', 'find']);
      const d = { st: pk(STS), type: pk(TYPES), n: pk([undefined, 1, 3, 250]), who: R() < .6 ? C.who(s, o.who || 'pip') : 'pip', t: Math.floor(R() * 4), rank: Math.floor(R() * 100) + 1, z: pk(['plaza', 'coliseo']), id: 'gato' };
      if (t === 'oro' && d.n === undefined) d.n = 100;
      a = [t, JSON.parse(JSON.stringify(d))]; r = C.ev(s, t, d); }
    else if (x < .74) { f = 'advance'; r = C.stepDone(s) || R() < .5 ? C.advance(s).id : (f = 'stepDone', C.stepDone(s)); }
    else if (x < .75) { f = 'choose'; a = [pk(['compartir', 'corona'])]; r = C.choose(s, a[0]); }
    else if (x < .78) { f = 'applyTour'; a = [Math.floor(R() * 100) + 1]; r = C.applyTour(s, a[0]); }
    else if (x < .80) { f = 'sideAccept'; a = [pk(C.SIDE).id]; r = C.sideAccept(s, a[0]); }
    else if (x < .82) { f = 'sideFinish'; a = [pk(C.SIDE).id]; r = C.sideFinish(s, a[0]); }
    else if (x < .83) { f = 'giveChispas'; a = [pk(C.SIDE).id]; r = C.giveChispas(s, a[0]); }
    else if (x < .85) { f = 'addFriend'; a = [Math.floor(R() * 110)]; r = C.addFriend(s, a[0]); }
    else if (x < .86) { f = 'setParty'; a = [s.friends.length ? pk(s.friends).bi : 3, R() < .7]; r = C.setParty(s, a[0], a[1]); }
    else if (x < .87) { f = 'friendXP'; a = [s.friends.length ? pk(s.friends).bi : 3, Math.round(R() * 40)]; r = C.friendXP(s, a[0], a[1]); }
    else if (x < .89) { f = 'cheat'; a = [{ oro: Math.round(R() * 5e4), gemas: Math.round(R() * 200), chispas: Math.round(R() * 60), fue: Math.round(R() * 300) }];
      s.oro += a[0].oro; s.gemas += a[0].gemas; s.chispas += a[0].chispas; s.stats.fue += a[0].fue; }
    else if (x < .91) { f = 'makeField'; a = [Math.floor(R() * 1e6)]; const fld = C.makeField(s, C.mulberry(a[0])); const ord = C.nightOrder(fld, Math.max(C.poder(s), C.TOUR.req), C.mulberry(a[0] + 1)); r = { first: fld.slice(0, 4), n: fld.length, ord: ord.slice(0, 12) }; }
    else if (x < .93) { f = 'board'; const b = C.board(s); r = [b[0].n, b[1].n, b[2].n, b.length, b.findIndex(z => z.me)]; }
    else if (x < .95) { f = 'migrate'; r = C.serialize(C.migrate(JSON.parse(C.serialize(s)))) === C.serialize(s) ? 1 : 0; }
    else if (x < .965) { f = 'stepProg'; r = C.stepProg(s); }
    else if (x < .98) { f = 'stepHint'; r = C.stepHint(s); }
    else if (x < .99) { f = 'combat'; r = C.combat(s); }
    else { f = 'ringPower'; a = [Math.floor(R() * 3)]; r = C.ringPower(s, a[0]); }
    const op = { f, a, r: r === undefined ? null : JSON.parse(JSON.stringify(r)) };
    if (k % 16 === 15 || k === nops - 1) op.s = snap(s);
    op.p = C.poder(s); op.v = C.validate(s).length;
    sc.ops.push(op);
  }
  return sc;
}
cases.sc.push(scenario('discipulo', 11, 'fuego', 260), scenario('mercader', 22, 'agua', 260), scenario('superviviente', 33, 'rayo', 260));
const goldSrc = '--!nonstrict\n-- ARCHIVO GENERADO por tools/gen-roblox.js — casos calculados con el núcleo JS (versión ' + C.VERSION + '). NO EDITAR.\nreturn ' + lua(cases, '', 1) + '\n';
fs.writeFileSync(OUT('server/Golden.luau'), goldSrc);
const nOps = cases.sc.reduce((a, s) => a + s.ops.length, 0);
console.log('Datos.luau ' + (datosSrc.length / 1024).toFixed(0) + ' KB (verificado) · Golden.luau ' + (goldSrc.length / 1024).toFixed(0) + ' KB · ' + (cases.rng.length + cases.fn.length + nOps) + ' casos');
