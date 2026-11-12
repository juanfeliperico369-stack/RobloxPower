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
  FORGE: C.FORGE.slice(1), NEWB: C.NEWB, NA: C.NA, NB: C.NB, BAD: C.BAD, CYCLE: C.CYCLE, FOE_EL: C.FOE_EL, FRAG: C.FRAG, CLANS: C.CLANS, CLANPTS: C.CLANPTS, EVENTS: C.EVENTS, ACH: C.ACH, FISH: C.FISH, LEAGUES: C.LEAGUES, FURN: C.FURN, PETS: C.PETS, STYLES: C.STYLES };
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
[[40, 85], [105, 105], [50, 95]].forEach(a => fn('aliveAt', a, C.aliveAt(...a))); [0, 15, 30, 45, 60, 99].forEach(t => fn('aliveAt2', [t], C.aliveAt2(t)));
[0, 14, 15, 60, 500, 1500, 9999].forEach(m => fn('mastLv', [m], C.mastLv(m)));
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
[NOW, Date.UTC(2026, 10, 9, 0, 0), Date.UTC(2026, 10, 8, 23, 59), Date.UTC(1970, 0, 5)].forEach(t => fn('weekKey', [t], C.weekKey(t)));
[0, 1, 2, 3, 4, 5].forEach(w => fn('eventOfId', [NOW + w * 7 * 864e5], C.eventOf(NOW + w * 7 * 864e5).id));
Object.keys(C.EL).forEach(a => { fn('strongVs', [a], C.strongVs(a)); fn('weakVs', [a], C.weakVs(a)); Object.keys(C.EL).forEach(d => fn('afin', [a, d], C.afin(a, d))); });
[[1, 0], [2, .5], [3, 1], [99, .25]].forEach(([sd, q]) => { const R = C.mulberry(sd); fn('fishSeq', [sd, q], Array.from({ length: 25 }, () => C.fishRoll(R, q))); });
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
    else if (x < .66) { const o = C.stepObj(s) || {}; f = 'ev'; const t = pk(['train', 'kill', 'build', 'oro', 'talk', 'give', 'boss', 'forge', 'tourney', 'visit', 'perf', 'anvil', 'find', 'fish', 'cook', 'harvest', 'chest']);
      const d = { st: pk(STS), type: pk(TYPES), n: pk([undefined, 1, 3, 250]), who: R() < .6 ? C.who(s, o.who || 'pip') : 'pip', t: Math.floor(R() * 4), rank: Math.floor(R() * 100) + 1, z: pk(['plaza', 'coliseo']), id: 'gato' };
      if (t === 'oro' && d.n === undefined) d.n = 100;
      a = [t, JSON.parse(JSON.stringify(d))]; r = C.ev(s, t, d); }
    else if (x < .68) { const y = R(); now += Math.round(R() * 2e8); if (y < .02) { f = 'furnBuy'; a = [pk(C.FURN.map(q => q.id).concat('nada'))]; r = C.furnBuy(s, a[0]); } else if (y < .03) { f = 'styleBuy'; a = [pk(['tigre', 'grulla', 'dragon', 'nada'])]; r = C.styleBuy(s, a[0]); } else if (y < .035) { f = 'styleSet'; a = [pk(['tigre', 'grulla', 'dragon', ''])]; r = C.styleSet(s, a[0]); } else if (y < .04) { f = 'setLook'; a = [pk(['skin', 'shirt', 'hair', 'x']), Math.floor(R() * 9)]; r = C.setLook(s, a[0], a[1]); } else if (y < .045) { f = 'setPet'; a = [pk(['gato', 'zorro', 'luci', ''])]; r = C.setPet(s, a[0]); } else if (y < .06) { f = 'farmBuy'; a = [pk(['plot', 'lv', 'auto', 'nada'])]; r = C.farmBuy(s, a[0]); } else if (y < .07) { f = 'farmTick'; a = [Math.round(R() * 9000) / 100]; r = C.farmTick(s, a[0]); } else if (y < .09) { f = 'farmHarvest'; a = [Math.floor(R() * 5)]; r = C.farmHarvest(s, a[0]); } else if (y < .1) { f = 'farmWater'; a = [Math.floor(R() * 5)]; r = C.farmWater(s, a[0]); } else if (y < .12) { f = 'chestLoot'; a = [Math.floor(R() * 1e6), Math.floor(R() * 3)]; r = C.chestLoot(s, C.mulberry(a[0]), a[1]); } else if (y < .13) { f = 'bankBag'; a = [{ o: Math.round(R() * 900), ch: Math.floor(R() * 9), gem: Math.floor(R() * 3), n: Math.floor(R() * 4) }]; r = C.bankBag(s, a[0]); } else if (y < .16) { f = 'fishRoll'; a = [Math.floor(R() * 1e6), Math.round(R() * 100) / 100]; r = C.fishRoll(C.mulberry(a[0]), a[1]); } else if (y < .12) { f = 'fishCatch'; a = [R() < .9 ? pk(C.FISH).id : 'nada']; r = C.fishCatch(s, a[0]); } else if (y < .15) { f = 'cookRound'; a = [Math.floor(R() * 6)]; r = C.cookRound(s, a[0]); } else if (y < .2) { f = 'eventSync'; a = [now]; r = C.eventSync(s, now); } else if (y < .3) { f = 'achCheck'; r = C.achCheck(s); } else if (y < .5) { f = 'clanJoin'; a = [pk(['llama', 'viento', 'marea', 'nada']), now]; r = C.clanJoin(s, a[0], now); } else if (y < .8) { f = 'clanWeek'; a = [now]; r = C.clanWeek(s, now); } else { f = 'clanStand'; a = [now]; r = C.clanStand(s, now); } }
    else if (x < .70) { f = 'fragTake'; a = [R() < .9 ? pk(C.FRAG).id : 'zz']; r = C.fragTake(s, a[0]); }
    else if (x < .74) { f = 'advance'; r = C.stepDone(s) || R() < .5 ? C.advance(s).id : (f = 'stepDone', C.stepDone(s)); }
    else if (x < .75) { f = 'choose'; a = [pk(['compartir', 'corona'])]; r = C.choose(s, a[0]); }
    else if (x < .78) { f = 'applyTour'; a = [Math.floor(R() * 100) + 1, pk(['', 'bronce', 'plata', 'oro', 'leyenda'])]; r = C.applyTour(s, a[0], a[1]); }
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
cases.sc.push(scenario('discipulo', 11, 'fuego', 300), scenario('mercader', 22, 'agua', 300), scenario('superviviente', 33, 'rayo', 300));
/* escenario guionizado: clanes de punta a punta (unirse, aportar, cierre semanal con premio, cambiar de clan) */
{
  const s = C.newState({ name: 'Prueba clan', origin: 'mercader', seed: 44, el: 'viento', now: NOW, skin: 2, shirt: 3, hair: 1 });
  const sc = { origin: 'mercader', seed: 44, el: 'viento', now: NOW, name: 'Prueba clan', init: snap(s), ops: [] };
  const op = (f, a, r) => sc.ops.push({ f, a, r: r === undefined ? null : JSON.parse(JSON.stringify(r)), s: snap(s), p: C.poder(s), v: C.validate(s).length });
  op('clanJoin', ['marea', NOW], C.clanJoin(s, 'marea', NOW));
  op('clanJoin', ['llama', NOW + 36e5], C.clanJoin(s, 'llama', NOW + 36e5));
  for (let i = 0; i < 70; i++) op('ev', ['kill', { type: 'eco' }], C.ev(s, 'kill', { type: 'eco' }));
  op('ev', ['tourney', { rank: 3 }], C.ev(s, 'tourney', { rank: 3 }));
  op('train', ['medita', 1.25], C.train(s, 'medita', 1.25));
  op('buyB', ['pan'], C.buyB(s, 'pan')); op('tick', [3], C.tick(s, 3));
  op('clanStand', [NOW + 864e5], C.clanStand(s, NOW + 864e5));
  op('clanWeek', [NOW + 8 * 864e5], C.clanWeek(s, NOW + 8 * 864e5));
  op('clanWeek', [NOW + 8 * 864e5], C.clanWeek(s, NOW + 8 * 864e5));
  op('clanJoin', ['viento', NOW + 9 * 864e5], C.clanJoin(s, 'viento', NOW + 9 * 864e5));
  op('train', ['kata', 1.25], C.train(s, 'kata', 1.25));
  op('clanStand', [NOW + 10 * 864e5], C.clanStand(s, NOW + 10 * 864e5));
  for (let w = 0; w < 4; w++) { const t = NOW + w * 7 * 864e5; op('eventSync', [t], C.eventSync(s, t)); op('train', ['saco', 1], C.train(s, 'saco', 1)); op('killReward', ['lobo', 300, 77 + w], C.killReward(s, 'lobo', 300, C.mulberry(77 + w))); op('tick', [2], C.tick(s, 2)); op('friendXP', [3, 10], C.friendXP(s, 3, 10)); op('ev', ['kill', { type: 'eco' }], C.ev(s, 'kill', { type: 'eco' })); }
  s.oro += 1e6; op('cheat', [{ oro: 1e6, gemas: 0, chispas: 0, fue: 0 }]);
  for (const k of ['plot', 'plot', 'plot', 'lv', 'auto', 'lv']) op('farmBuy', [k], C.farmBuy(s, k));
  op('farmTick', [45], C.farmTick(s, 45)); op('farmWater', [3], C.farmWater(s, 3)); op('farmTick', [12], C.farmTick(s, 12)); op('farmHarvest', [3], C.farmHarvest(s, 3)); op('farmHarvest', [0], C.farmHarvest(s, 0));
  op('offline', [NOW + 9e6], C.offline(s, NOW + 9e6));
  for (let d2 = 0; d2 < 3; d2++) op('chestLoot', [500 + d2, d2], C.chestLoot(s, C.mulberry(500 + d2), d2)); op('bankBag', [{ o: 300, ch: 4, gem: 1, n: 3 }], C.bankBag(s, { o: 300, ch: 4, gem: 1, n: 3 }));
  for (const id of ['cama', 'sofa', 'cama', 'nada']) op('furnBuy', [id], C.furnBuy(s, id)); op('tick', [4], C.tick(s, 4));
  for (const id of ['tigre', 'grulla', 'dragon', 'tigre']) { op('styleBuy', [id], C.styleBuy(s, id)); op('combat', [], C.combat(s)); } op('styleSet', ['tigre'], C.styleSet(s, 'tigre')); op('combat', [], C.combat(s));
  for (let k = 0; k < 70; k++) op('killReward', ['eco', 200, 900 + k], C.killReward(s, 'eco', 200, C.mulberry(900 + k))); op('combat', [], C.combat(s));
  for (const [rk, lg] of [[1, 'plata'], [5, 'oro'], [1, 'bronce'], [1, 'leyenda'], [40, 'zzz']]) op('applyTour', [rk, lg], C.applyTour(s, rk, lg));
  op('setLook', ['hair', 2], C.setLook(s, 'hair', 2)); op('setPet', ['gato'], C.setPet(s, 'gato'));
  { const fld = C.makeField(s, C.mulberry(321), 'oro'); op('makeFieldLg', [321, 'oro'], fld.slice(0, 3)); }
  C.FISH.forEach((fi, k) => op('fishCatch', [fi.id], C.fishCatch(s, fi.id))); for (let r2 = 1; r2 <= 4; r2++) op('cookRound', [r2], C.cookRound(s, r2));
  for (const [st, en] of [['d1', 'compartir'], ['d1', 'corona'], ['d5', 'corona'], ['d8', '']]) { s.story.i = C.STI[st]; s.ending = en; op('setStory', [C.STI[st], en], C.stepDialog(s, 'd')); }
  s.story.i = 0; s.ending = ''; op('setStory', [0, ''], C.stepDialog(s, 'd'));
  s.cnt.taps = 600; s.cnt.kills = 1200; op('setCnt', [{ taps: 600, kills: 1200 }]); op('achCheck', [], C.achCheck(s)); op('achCheck', [], C.achCheck(s));
  cases.sc.push(sc);
}
const goldSrc = '--!nocheck\n-- ARCHIVO GENERADO por tools/gen-roblox.js — casos calculados con el núcleo JS (versión ' + C.VERSION + '). NO EDITAR.\nreturn ' + lua(cases, '', 1) + '\n';
fs.writeFileSync(OUT('server/Golden.luau'), goldSrc);
const nOps = cases.sc.reduce((a, s) => a + s.ops.length, 0);
console.log('Datos.luau ' + (datosSrc.length / 1024).toFixed(0) + ' KB (verificado) · Golden.luau ' + (goldSrc.length / 1024).toFixed(0) + ' KB · ' + (cases.rng.length + cases.fn.length + nOps) + ' casos');
