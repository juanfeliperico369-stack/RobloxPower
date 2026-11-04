// Simulador sin pantalla: pruebas unitarias de fórmulas + N partidas completas con jugadores-bot.
// Uso: node tools/sim.js [partidas=120] [minutos=180]
'use strict';
const C = require('../src/core.js');
const N = +process.argv[2] || 120, MIN = +process.argv[3] || 180;
let fails = 0; const fail = m => { fails++; if (fails < 40) console.error('✖', m); };
const eq = (a, b, m) => { if (a !== b) fail(m + ' → esperado ' + b + ', obtuvo ' + a); };
const ok = (c, m) => { if (!c) fail(m); };

/* ---------- 1. pruebas unitarias ---------- */
eq(C.lossPct(1), 0, 'puesto 1 pierde 0%'); eq(C.lossPct(2), 2, 'puesto 2 pierde 2%'); eq(C.lossPct(50), 50, 'puesto 50 pierde 50%'); eq(C.lossPct(100), 100, 'puesto 100 pierde 100%');
eq(C.aliveAt(0), 99, 'al inicio de la Noche hay 99 bots'); eq(C.aliveAt(C.TOUR.nightT), 31, 'al final de la Noche quedan 31 bots (+ jugador = 32)');
for (let r = 0; r < 5; r++) for (let f = 0; f <= 1; f += .1) { const k = C.rankLoss(r, f), R = [[17, 32], [9, 16], [5, 8], [3, 4], [2, 2]][r]; ok(k >= R[0] && k <= R[1], 'rankLoss fuera de rango r=' + r + ' f=' + f + ' → ' + k); }
eq(C.migrate(null), null, 'migrate(null)'); eq(C.migrate({ a: 1 }), null, 'migrate basura'); eq(C.deserialize('{roto'), null, 'deserialize roto');
eq(C.cleanName('  Nova<script>  '), 'Novascript', 'cleanName limpia'); eq(C.cleanName('idiota123'), '', 'cleanName filtra groserías');
{
  const s = C.newState({ name: 'Test', origin: 'mercader', el: 'agua', seed: 9, now: 1e12 });
  eq(C.validate(s).length, 0, 'estado nuevo válido'); eq(s.zone, 'forja', 'mercader empieza en la Forja'); eq(C.eqB(s).el, 'agua', 'brazalete inicial');
  const m = C.migrate(JSON.parse(JSON.stringify(Object.assign({}, s, { oro: 'x', stats: { fue: NaN, tec: 3, esp: 3 }, brz: [{ id: 7, el: 'zzz', t: 9 }] }))));
  ok(m && C.validate(m).length === 0, 'migrate repara estado corrupto: ' + (m && C.validate(m)));
  // primer torneo: tope del 25%
  s.stats = { fue: 100, tec: 100, esp: 100 }; const r1 = C.applyTour(s, 80); eq(r1.pct, 25, 'primer torneo tope 25%'); ok(Math.abs(C.base(s) - 225) < 1e-6, 'base tras -25%');
  const r2 = C.applyTour(s, 50); eq(r2.pct, 50, 'segundo torneo puesto 50 = 50%'); ok(Math.abs(C.base(s) - 112.5) < 1e-6, 'base tras -50%');
  ok(s.legado > 0, 'legado crece'); eq(s.brz.length, 1, 'el brazalete no se pierde');
  const b0 = C.base(s); C.applyTour(s, 1); ok(Math.abs(C.base(s) - b0) < 1e-9, 'campeón no pierde');
  const o0 = s.oro; s.last = 1e12; const off = C.offline(s, 1e12 + 30 * 3600e3); ok(off && off.capped, 'offline con tope'); ok(s.oro >= o0, 'offline no resta');
  s.daily.day = ''; C.dailyCheck(s, Date.now()); eq(s.daily.q.length, 3, '3 misiones diarias');
}
{ // misiones secundarias y amigos
  const s = C.newState({ name: 'Q', origin: 'discipulo', seed: 4 }); s.story.i = C.STORY.length - 1;
  for (const q of C.SIDE) {
    const f = C.sideFor(s, q.who); ok(f && f.q.id === q.id && !f.st, 'secundaria disponible ' + q.id); C.sideAccept(s, q.id);
    if (q.o.k === 'giveCh') { s.chispas = q.o.n; ok(C.giveChispas(s, q.id), 'entregar chispas'); eq(s.chispas, 0, 'chispas descontadas'); }
    else for (let i = 0; i < q.o.n; i++) C.ev(s, q.o.k, { st: q.o.st, type: q.o.type, id: q.o.id, rank: 1 });
    ok(C.sideReady(s, q.id), 'secundaria lista ' + q.id); const g0 = s.gemas; ok(C.sideFinish(s, q.id), 'terminar ' + q.id); ok(s.gemas >= g0, 'recompensa');
    ok(!C.sideFinish(s, q.id), 'no se cobra dos veces ' + q.id);
  }
  ok(C.addFriend(s, 1) && C.addFriend(s, 2) && C.addFriend(s, 3) && !C.addFriend(s, 1), 'amigos sin duplicar');
  ok(C.setParty(s, 1, true) && C.setParty(s, 2, true) && !C.setParty(s, 3, true) && !C.setParty(s, 50, true), 'grupo máx 2 y solo amigos');
  const g1 = s.gemas; eq(C.friendXP(s, 1, 60), 6, 'regalo de amistad cada 25'); eq(s.gemas - g1, 6, 'gemas de amistad'); eq(C.validate(s).length, 0, 'estado con amigos válido');
}
{ // historia completa por evento, para cada origen
  for (const o of Object.keys(C.ORIG)) {
    const s = C.newState({ name: 'H', origin: o, seed: 3 }); let guard = 0;
    while (C.STORY[s.story.i].id !== 'ep' && guard++ < 200) {
      const ob = C.stepObj(s);
      if (ob.k === 'talk' || ob.k === 'give' || ob.k === 'boss') C.ev(s, ob.k, { who: C.who(s, ob.who) });
      else if (ob.k === 'train') for (let i = 0; i < ob.n; i++) C.ev(s, 'train', { st: ob.st });
      else if (ob.k === 'kill') for (let i = 0; i < ob.n; i++) C.ev(s, 'kill', { type: ob.type || 'eco' });
      else if (ob.k === 'build') C.ev(s, 'build', { n: 1 });
      else if (ob.k === 'oro') C.addOro(s, ob.n);
      else if (ob.k === 'power') s.stats.fue += ob.n;
      else if (ob.k === 'forge') C.ev(s, 'forge', { t: ob.t });
      else if (ob.k === 'tourney') C.ev(s, 'tourney', { rank: ob.r });
      else if (ob.k === 'choice') { C.choose(s, 'compartir'); continue; }
      ok(C.stepDone(s), 'paso ' + C.STORY[s.story.i].id + ' (' + o + ') no se completa con su evento');
      C.advance(s);
    }
    eq(C.STORY[s.story.i].id, 'ep', 'historia llega al epílogo (' + o + ')');
    ok(s.unlock.act2 && s.unlock.act3, 'desbloqueos de elementos');
  }
}

/* ---------- 2. partidas simuladas ---------- */
function fight(s, ring, R, sk) {
  const types = [['eco', 'lobo'], ['lobo', 'bandido'], ['bandido', 'rival']][ring], type = types[R() < .6 ? 0 : 1];
  const eP = C.ringPower(s, ring) * (0.9 + R() * .2), e = C.foeStats(type, eP), cs = C.combat(s), F = C.FOES[type];
  const dps = cs.atk * (1 + cs.crit * .8) / cs.cd * (0.55 + sk * .4), ttk = e.hp / dps + 1.5;
  const taken = e.dmg / (F.cd + F.wind) * (0.75 - sk * .5) * ttk;
  return { type, eP, ttk, taken: taken * (1 - cs.def), max: cs.maxHp };
}
function tourney(s, R, sk) {
  const P = C.poder(s), field = C.makeField(s, R), order = C.nightOrder(field, P, R);
  if (R() > 0.3 + sk * .6) { const t = 3 + R() * (C.TOUR.nightT - 3); return 99 - (99 - C.aliveAt(t)) + 1; }
  let pool = order.slice(order.length - 31).map(i => field[i].p); pool.sort((a, b) => b - a);
  for (let round = 0; round < 5; round++) {
    const opp = pool[Math.floor(R() * pool.length)] * (1 + round * .08), me = P * (0.7 + sk * .6);
    if (R() > C.duelP(me, opp)) return C.rankLoss(round, R());
  }
  return 1;
}
const stats = { side: 0, friends: 0, p120: [], p600: [], act2: [], act3: [], fin: [], story: [], tours: 0, deaths: 0, minRank: 100, ending: 0, maxP: 0 };
const t0 = Date.now();
for (let g = 0; g < N; g++) {
  const R = C.mulberry(1000 + g), origin = Object.keys(C.ORIG)[g % 3], el = C.ELK5[g % 5];
  const s = C.newState({ name: 'Bot' + g, origin, el, seed: 77 + g, now: 1e12 });
  const sk = 0.2 + R() * 0.7, prefer = ['train', 'farm', 'tyc'][Math.floor(R() * 3)];
  let hp = C.combat(s).maxHp, lastStory = 0, act = '', actT = 0;
  const flags = {}, mark = (arr, cond, key) => { if (cond && !flags[key]) { flags[key] = 1; arr.push(s.cnt.play / 60); } };
  for (let sec = 0; sec < MIN * 60;) {
    // decidir actividad cada 60 s
    if (sec >= actT) {
      const ob = C.stepObj(s), w = { train: 1, farm: 1, tyc: 1 }; w[prefer] += 1.5;
      if (ob.k === 'train') w.train += 3; if (ob.k === 'kill') w.farm += 3; if (ob.k === 'oro' || ob.k === 'build') w.tyc += 3;
      const tot = w.train + w.farm + w.tyc, r = R() * tot; act = r < w.train ? 'train' : r < w.train + w.farm ? 'farm' : 'tyc'; actT = sec + 60;
      // gastos inteligentes
      for (let k = 0; k < 6; k++) { const ids = C.BLD.filter(d => C.bUnlocked(s, d.id)).map(d => d.id).sort((a, b) => C.bCost(a, s.tyc[a]) - C.bCost(b, s.tyc[b])); if (!C.buyB(s, ids[0])) break; }
      if (R() < .5) C.buyGear(s, ['fue', 'tec', 'esp'][Math.floor(R() * 3)]);
      if (s.oro > C.elixCost(s.elix) * 3) C.buyElix(s, ['fue', 'tec', 'esp'][Math.floor(R() * 3)]);
      const b = C.eqB(s); if (b.t < 3 && s.oro > C.FORGE[b.t + 1].o * 1.5) C.forgeUp(s, b.id);
      if (s.gemas >= 150 && R() < .2) C.shopBuy(s, 'plata', C.eqB(s).el);
      s.daily.q.forEach((q, i) => C.dailyClaim(s, i));
      // historia: hablar / dar / decidir
      if (ob.k === 'talk' || ob.k === 'boss') C.ev(s, ob.k === 'boss' ? 'boss' : 'talk', { who: C.who(s, ob.who) });
      if (ob.k === 'give' && s.oro >= ob.oro) { s.oro -= ob.oro; C.ev(s, 'give', { who: C.who(s, ob.who) }); }
      if (ob.k === 'choice') C.choose(s, R() < .7 ? 'compartir' : 'corona');
      for (const w of Object.keys(C.NPC)) { const f = C.sideFor(s, w); if (!f) continue; if (!f.st) C.sideAccept(s, f.q.id); else { if (f.q.o.k === 'giveCh') C.giveChispas(s, f.q.id); C.sideFinish(s, f.q.id); } }
      if (R() < .1) { const bi = Math.floor(R() * 99); if (C.addFriend(s, bi) && s.party.length < 2) C.setParty(s, bi, true); }
      if (C.poder(s) >= C.TOUR.req && (ob.k === 'tourney' || R() < .08)) {
        const rk = tourney(s, R, sk), res = C.applyTour(s, rk); stats.tours++; stats.minRank = Math.min(stats.minRank, rk);
        ok(res.pct === (res.first ? Math.min(25, C.lossPct(rk)) : C.lossPct(rk)), 'pérdida inconsistente en torneo');
        if (rk === 1 && C.stepObj(s).k === 'boss' && R() < .5 + sk * .4) C.ev(s, 'boss', { who: 'vant' });
        sec += 420; C.tick(s, 1); continue;
      }
      while (C.stepDone(s)) C.advance(s);
    }
    // actividad de 1 bloque (≈ 4 s)
    const dt = 4;
    if (act === 'train') {
      const k = ['saco', 'kata', 'medita'][Math.floor(R() * 3)];
      if (k === 'saco') for (let i = 0; i < 16; i++) { const q = R() < sk ? 1.25 : R() < .7 ? 1 : .6; if (C.train(s, 'saco', q) < 0) { C.train(s, 'medita', .8); if (s.tyc.pan) C.eat(s); break; } }
      else if (k === 'kata') for (let i = 0; i < 3; i++) { const q = R() < sk ? 1.25 : R() < .6 ? .6 : 0; if (C.train(s, 'kata', q) < 0) break; if (q > 1) C.ev(s, 'perf', { st: 'tec' }); }
      else if (R() < .5) { const q = R() < sk ? 1.25 : .8; C.train(s, 'medita', q); if (q > 1) C.ev(s, 'perf', { st: 'esp' }); }
    } else if (act === 'farm') {
      const P = C.poder(s), ring = P >= 450 && R() < .5 ? 2 : P >= 110 ? (R() < .7 ? 1 : 0) : 0, f = fight(s, ring, R, sk);
      hp -= f.taken; if (hp <= 0) { s.cnt.deaths++; stats.deaths++; s.oro -= Math.floor(s.oro * .05); hp = f.max; sec += 10; }
      else { C.killReward(s, f.type, f.eP, R); if (ring === 2 && R() < .03 * sk) C.killReward(s, 'golem', C.ringPower(s, 2) * 1.1, R); }
      hp = Math.min(f.max, hp + f.max * .012 * 3 * f.ttk);
      sec += Math.max(0, f.ttk - dt);
    } else { for (let i = 0; i < 12; i++) { C.tapOro(s); C.ev(s, 'anvil', {}); } if (s.story.i >= C.STI.a1 && R() < .05) C.ev(s, 'find', { id: 'gato' }); }
    C.tick(s, dt); sec += dt;
    if (s.story.i < lastStory) fail('la historia retrocedió en partida ' + g); lastStory = s.story.i;
    if (sec % 600 < dt) { // cada 10 min: validar y guardar/cargar
      const v = C.validate(s); if (v.length) fail('partida ' + g + ' inválida: ' + v.join('; '));
      const s2 = C.deserialize(C.serialize(s)); if (!s2 || C.serialize(s2) !== C.serialize(s)) fail('guardar/cargar no es idéntico en partida ' + g + (s2 ? ': ' + Object.keys(s).filter(k => JSON.stringify(s[k]) !== JSON.stringify(s2[k])).join(',') : ''));
    }
    mark(stats.p120, C.poder(s) >= 120, 'a'); mark(stats.p600, C.poder(s) >= 600, 'b');
    mark(stats.act2, C.STORY[s.story.i].act >= 2, 'c'); mark(stats.act3, C.STORY[s.story.i].act >= 3, 'd'); mark(stats.fin, C.STORY[s.story.i].id === 'ep', 'e');
  }
  stats.side += Object.values(s.side).filter(x => x.s === 2).length; stats.friends += s.friends.length;
  stats.story.push(s.story.i); stats.maxP = Math.max(stats.maxP, C.poder(s)); if (s.ending) stats.ending++;
  const v = C.validate(s); if (v.length) fail('partida ' + g + ' final inválida: ' + v.join('; '));
}
const med = a => { if (!a.length) return '—'; const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1].toFixed(1) + ' min (' + a.length + '/' + N + ')'; };
console.log('──────── SIMULACIÓN · ' + N + ' partidas × ' + MIN + ' min de juego · ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s ────────');
console.log('Mediana hasta Poder 120 (torneo):', med(stats.p120));
console.log('Mediana hasta Poder 600 (Guerrero):', med(stats.p600));
console.log('Mediana hasta Acto II:', med(stats.act2), '· Acto III:', med(stats.act3), '· Epílogo:', med(stats.fin));
console.log('Torneos jugados:', stats.tours, '· mejor puesto:', stats.minRank, '· KOs en Tierras:', stats.deaths, '· finales elegidos:', stats.ending, '· poder máx:', C.fmt(stats.maxP));
console.log('Secundarias completadas (media):', (stats.side / N).toFixed(1), 'de', C.SIDE.length, '· amigos (media):', (stats.friends / N).toFixed(1));
console.log('Misión media alcanzada:', (stats.story.reduce((a, b) => a + b, 0) / N).toFixed(1), 'de', C.STORY.length);
// equilibrio: el primer torneo debe llegar entre 3 y 25 minutos de juego
const m120 = stats.p120.slice().sort((a, b) => a - b)[stats.p120.length >> 1];
ok(stats.p120.length >= N * .95, 'menos del 95% llega a 120 de poder');
ok(m120 > 3 && m120 < 25, 'ritmo del primer torneo fuera de rango (' + m120 + ' min)');
console.log(fails ? 'SIM: ' + fails + ' FALLO(S)' : 'SIM OK · 0 errores · todas las invariantes se cumplen');
process.exit(fails ? 1 : 0);
