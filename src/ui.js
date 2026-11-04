/* BRAZALETES DEL PODER · interfaz: portada, creación, HUD, diálogos, paneles, minijuegos, guardado, entrada. */
var DLG = { q: null, i: 0, cb: null, full: '', shown: 0, tm: 0 }, PANEL = null, SC = { busy: 0 }, lastRank = -1, installEv = null;

/* ---------- avisos ---------- */
function toast(m, c) { var d = document.createElement('div'); d.className = c || ''; d.textContent = m; var t = $('toast'); t.appendChild(d); while (t.children.length > 3) t.removeChild(t.firstChild); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 2800); }
function banner(big, small) { $('banner').innerHTML = '<div class="mega">' + big + '</div>' + (small ? '<span class="kick">' + small + '</span>' : ''); }
function whisper(t) { $('banner').innerHTML = '<span class="kick" style="color:#c77dff;font-size:24px">' + t + '</span>'; }
function feed(h) { var f = $('feed'), d = document.createElement('div'); d.innerHTML = h; f.appendChild(d); while (f.children.length > 5) f.removeChild(f.firstChild); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 7000); }
function tbar(h) { $('tbar').innerHTML = h; }
function flashScreen() { if (S && S.cfg.calm) return; var f = $('fade'); f.style.background = '#5a0010'; f.classList.add('on'); setTimeout(function () { f.classList.remove('on'); setTimeout(function () { f.style.background = '#000'; }, 300); }, 90); }
var tipQ = [], tipT = 0;
function tip(id, text, now) { if (!S || S.tips[id]) return; S.tips[id] = 1; if (now) { tipQ.unshift(text); nextTip(); return; } tipQ.push(text); if (!tipT) nextTip(); }
function nextTip() {
  var c = $('coach'); clearTimeout(tipT); tipT = 0;
  if (!tipQ.length) { c.hidden = true; return; }
  c.innerHTML = '<b>PIP TE DICE:</b>' + esc(tipQ.shift()); c.hidden = false; tipT = setTimeout(nextTip, 6500);
}
$('coach').addEventListener('click', nextTip);
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* ---------- HUD ---------- */
function zoneTitle() {
  var z = C.ZONES[MAP.id];
  if (z) { $('zK').textContent = z.k; $('zN').textContent = z.n; }
  else if (mode === 'night') { $('zK').textContent = 'TORNEO · FASE 1'; $('zN').textContent = 'La Noche'; }
  else { $('zK').textContent = 'TORNEO · DUELO'; $('zN').textContent = TR && TR.boss ? 'Palco de Vant' : 'Arena'; }
}
function hudFull() { lastRank = lastRank < 0 ? C.rankOf(C.poder(S)) : lastRank; hud(); questBox(); }
function hud() {
  if (!S) return;
  var p = C.poder(S); $('cP').textContent = C.fmt(p); $('cO').textContent = C.fmt(S.oro); $('cG').textContent = C.fmt(S.gemas); $('cC').textContent = C.fmt(S.chispas);
  if (P) { $('bHp').style.width = Math.max(0, P.hp / P.cs.maxHp * 100) + '%'; $('bAu').style.width = P.aura + '%'; }
  $('bEn').style.width = (S.en / C.enMax(S) * 100) + '%';
  var E = C.EL[C.eqB(S).el]; $('skI').textContent = E.ic;
  if (P) { $('skCd').style.height = Math.max(0, P.skCd / E.cd * 100) + '%'; $('bSk').classList.toggle('no', P.aura < E.cost); }
  var b = $('bAct'); if (curInter && !paused) { b.hidden = false; if (b.textContent !== curInter.label) b.textContent = curInter.label; } else b.hidden = true;
  var r = C.rankOf(p); if (lastRank >= 0 && r > lastRank) { banner('¡' + C.RANKS[r][1].toUpperCase() + '!', 'Nuevo rango alcanzado'); sfx('up'); vib([30, 30, 60]); }
  lastRank = r; questBox();
  if (P && P.aura >= E.cost && mode === 'world') tip('poder', 'Tu AURA está lista: toca el botón morado de PODER (' + E.sk + ').');
  if (time - (hud.mt || 0) > .2) { hud.mt = time; drawMini(); }
}
function questBox() {
  var st = C.STORY[S.story.i], pr = C.stepProg(S);
  $('qA').textContent = (st.act <= 3 ? 'ACTO ' + ['I', 'II', 'III'][st.act - 1] : 'EPÍLOGO') + ' · MISIÓN ' + (S.story.i + 1);
  $('qT').textContent = st.t; $('qH').textContent = C.stepHint(S) + (pr[1] > 1 ? '  ·  ' + C.fmt(pr[0]) + '/' + C.fmt(pr[1]) : '');
  $('qP').style.width = Math.min(100, pr[0] / pr[1] * 100) + '%';
}

/* ---------- diálogos cómic ---------- */
function dialog(lines, cb) {
  if (!lines || !lines.length) { if (cb) cb(); return; }
  if (DLG.q) { var prev = DLG.cb; DLG.q = DLG.q.concat(lines); DLG.cb = function () { if (prev) prev(); if (cb) cb(); }; return; }
  DLG.q = lines; DLG.i = 0; DLG.cb = cb; paused++; $('dlg').hidden = false; showLine();
}
function portrait(cnv, who) {
  var g = cnv.getContext('2d'), L = who === 'yo' ? playerLook() : NPCL[who] || NPCL.nar;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = C.NPC[who] ? shade(C.NPC[who].c, .45) : '#0f5c66'; g.fillRect(0, 0, cnv.width, cnv.height);
  g.fillStyle = 'rgba(0,0,0,.25)'; for (var y = 0; y < cnv.height; y += 8) for (var x = (y / 8 & 1) * 4; x < cnv.width; x += 8) g.fillRect(x, y, 2, 2);
  g.save(); g.translate(cnv.width / 2, cnv.height + 30); g.scale(3.2, 3.2); drawAvatar(g, 0, 0, L, { dir: 0, el: C.NPC[who] ? C.NPC[who].c : '#fff', mad: who === 'vant' }); g.restore();
}
function showLine() {
  var l = DLG.q[DLG.i], who = l[0], N = C.NPC[who] || { n: who === 'yo' ? S.name : '', c: '#fff' }, cls = who === 'nar' ? 'nar' : who === 'vant' ? 'vil' : '';
  $('dlg').innerHTML = '<div class="panel ' + cls + '">' + (who === 'nar' ? '' : '<canvas width="168" height="200"></canvas>') + '<div style="flex:1;min-width:0"><div class="who" style="color:' + (who === 'nar' ? '#f0b429' : who === 'vant' ? '#c77dff' : '#8a1219') + '">' + esc(N.n || '') + '</div><div class="say"></div></div><div class="nx">▸ TOCA</div></div>';
  var c = $('dlg').querySelector('canvas'); if (c) portrait(c, who);
  DLG.full = l[1].replace(/\{n\}/g, S ? S.name : ''); DLG.shown = 0; clearInterval(DLG.tm);
  var say = $('dlg').querySelector('.say');
  DLG.tm = setInterval(function () { DLG.shown += 2; say.textContent = DLG.full.slice(0, DLG.shown); if (DLG.shown >= DLG.full.length) clearInterval(DLG.tm); }, 22);
  if (who !== 'nar') tone(who === 'vant' ? 160 : 520, .05, 'square', .04);
}
function dlgNext() {
  if (!DLG.q) return;
  if (DLG.shown < DLG.full.length) { DLG.shown = DLG.full.length; clearInterval(DLG.tm); $('dlg').querySelector('.say').textContent = DLG.full; return; }
  DLG.i++; if (DLG.i < DLG.q.length) { showLine(); return; }
  clearInterval(DLG.tm); $('dlg').hidden = true; paused = Math.max(0, paused - 1); var cb = DLG.cb; DLG.q = null; DLG.cb = null; if (cb) cb();
}
$('dlg').addEventListener('pointerdown', function (e) { e.preventDefault(); dlgNext(); });

/* ---------- historia ---------- */
var FLAV = {
  ren: [['ren', 'La técnica vence a la fuerza bruta. Golpea con ritmo: ni muy lento, ni a lo loco.'], ['ren', 'Si te cansas, medita. Tu energía vuelve con cada respiración.'], ['ren', 'Mejorar el equipo del Dojo multiplica todo tu entrenamiento.']],
  tobias: [['tobias', 'Un brazalete mejor nunca se pierde, ni en el torneo. Es lo único que te llevas siempre.'], ['tobias', 'El Espíritu es magia tangible: cuanto más alto, más produce tu negocio.'], ['tobias', 'Las chispas salen de las Tierras Rotas. Sin chispas no hay forja.']],
  kira: [['kira', 'Anillo 1: Ecos y lobos. Anillo 2: bandidos. Anillo 3: rivales y el Gólem. Elige según tu poder.'], ['kira', 'Si ves un círculo rojo en el suelo, sal de ahí. Usa la esquiva: te hace invulnerable un instante.'], ['kira', 'Los rivales son jugadores. Pelean bien y esquivan. Respétalos.']],
  pip: [['pip', '¡Hola, {n}! ¿Sabías que el tablón tiene misiones nuevas cada día?'], ['pip', 'El ranking muestra a todos los jugadores de Ánima. ¡Algún día estarás arriba!'], ['pip', 'Si pierdes en el torneo, una parte de tu poder vuelve como Legado. Nada se pierde del todo.']],
  heraldo: [['heraldo', '¡El Torneo Mundial te espera! Cien entran, uno gana.']],
  dax: [['dax', 'Estoy entrenando desde cero. Es raro… pero se siente honesto.'], ['dax', 'Si quedas mal en el torneo, no te rindas. Yo casi lo hago.']],
  nima: [['nima', 'El valor de una persona no cabe en un número, {n}.'], ['nima', 'Ayudar a otros también te hace fuerte. Solo que no sale en el ranking.']]
};
function talkTo(key) {
  var o = C.stepObj(S);
  if (o && o.k === 'talk' && C.who(S, o.who) === key) { dialog(C.stepDialog(S, 'd') || [[key, '…']], function () { C.ev(S, 'talk', { who: key }); storyCheck(); }); return; }
  if (o && o.k === 'give' && C.who(S, o.who) === key) {
    if (S.oro >= o.oro) { dialog(C.stepDialog(S, 'd'), function () { S.oro -= o.oro; C.ev(S, 'give', { who: key }); toast('Diste ' + o.oro + ' de oro a Dax 💛', 'ok'); storyCheck(); }); }
    else dialog([[key, 'Necesito ' + o.oro + ' de oro para reconstruir mi taller… Si algún día puedes, te lo agradecería.']]);
    return;
  }
  if (o && o.k === 'choice' && key === 'nima') { showChoice(); return; }
  var sq = C.sideFor(S, key);
  if (sq && sq.st && sq.q.o.k === 'giveCh' && C.giveChispas(S, sq.q.id)) toast('Entregaste ' + sq.q.o.n + ' chispas ✧', 'ok');
  if (sq && sq.st && C.sideReady(S, sq.q.id)) { var q0 = sq.q; dialog(q0.e, function () { C.sideFinish(S, q0.id); sfx('win'); banner('¡SECUNDARIA COMPLETA!', q0.t); toast(rewardText(q0.r) + (q0.title ? ' · título: ' + q0.title : ''), 'gold'); refreshCombat(); save(); hudFull(); }); return; }
  if (sq && !sq.st) { var q1 = sq.q; dialog(q1.d, function () { C.sideAccept(S, q1.id); sfx('up'); toast('Nueva misión secundaria: ' + q1.t, 'ok'); save(); }); return; }
  if (sq && sq.st) { dialog([[key, '(' + sq.q.t + ') ' + sq.q.h + ' · ' + Math.min(sq.st.n, sq.q.o.n) + '/' + sq.q.o.n]]); return; }
  var f = FLAV[key] || [[key, '…']], l = f[(S.cnt.taps + S.cnt.kills + (time | 0)) % f.length];
  dialog([l], function () { if (key === 'ren') openPanel('gear'); else if (key === 'tobias') openPanel('forge'); else if (key === 'heraldo') openPanel('tour'); });
}
function rewardText(r) { var a = []; if (r.oro) a.push('+' + C.fmt(r.oro) + ' oro'); if (r.gemas) a.push('+' + r.gemas + ' gemas'); if (r.chispas) a.push('+' + r.chispas + ' chispas'); return a.length ? 'Recompensa: ' + a.join(' · ') : 'Misión completada'; }
function storyCheck(force) {
  if (!S || SC.busy || DLG.q || (mode !== 'world' && !force) || paused) return;
  for (var sid in S.side) { var sx = S.side[sid]; if (sx.s === 1 && !sx.nt && C.sideReady(S, sid)) { sx.nt = 1; toast('Secundaria lista: vuelve con ' + C.NPC[C.SIDEI[sid].who].n + ' ✓', 'gold'); sfx('up'); } }
  var st = C.STORY[S.story.i];
  if (S.story.seen !== st.id) { S.story.seen = st.id; var i = C.stepDialog(S, 'i'); if (i) { SC.busy = 1; dialog(i, function () { SC.busy = 0; questBox(); }); return; } }
  if (C.stepDone(S)) {
    SC.busy = 1; var e = C.stepDialog(S, 'e');
    var fin = function () { var r = st.r; C.advance(S); sfx('up'); banner('¡MISIÓN COMPLETA!', st.t); toast(rewardText(r || {}), 'gold'); refreshCombat(); save(); hudFull(); SC.busy = 0; if (C.STORY[S.story.i].id === 'c6') setTimeout(showChoice, 1600); };
    if (e) dialog(e, fin); else fin();
  }
}
function showChoice() {
  openPanel('choice');
}
var ENDS = {
  compartir: [['nima', 'Rompiste el Brazalete del Origen. Su luz volvió a cada persona de Ánima.'], ['dax', 'El torneo sigue… pero ahora el poder perdido regresa a la gente.'], ['vant', '…Gracias. Por primera vez en años no me siento vacío.'], ['nar', 'FIN · CORAZÓN DE ÁNIMA. El mundo sigue. Tú también.']],
  corona: [['nima', 'Te quedaste con el Brazalete del Origen. Tu poder es inmenso.'], ['vant', 'Ahora lo entiendes. Aquí arriba se está muy solo.'], ['nar', 'FIN · EL NUEVO ANFITRIÓN. Tu historia sigue: la grandeza también se mide en lo que compartes.']]
};

/* ---------- paneles ---------- */
function openPanel(n, a) { if ($('ov').hidden) paused++; $('ov').hidden = false; PANEL = { n: n, a: a, tab: (PANEL && PANEL.n === n && PANEL.tab) || a || '' }; renderPanel(); }
function closePanel() { if (!$('ov').hidden) { $('ov').hidden = true; paused = Math.max(0, paused - 1); } var p = PANEL; PANEL = null; if (S) hudFull(); return p; }
function renderPanel() {
  if (!PANEL) return; var sh = $('ov').querySelector('.sheet'), sc = sh ? sh.scrollTop : 0, fn = PANELS[PANEL.n];
  var h = fn(PANEL.a), pap = ['res', 'cine', 'choice', 'page'].indexOf(PANEL.n) >= 0, nox = ['strat', 'res', 'cine', 'choice', 'page'].indexOf(PANEL.n) >= 0;
  $('ov').innerHTML = '<div class="sheet' + (pap ? ' pap' : '') + '">' + (nox ? '' : '<button class="x" data-a="close" aria-label="Cerrar">✕</button>') + h + '</div>';
  var s2 = $('ov').querySelector('.sheet'); s2.scrollTop = sc; afford();
  var pc = $('ov').querySelector('canvas[data-av]'); if (pc) { var g = pc.getContext('2d'); g.save(); g.translate(pc.width / 2, pc.height - 12); g.scale(2.4, 2.4); drawAvatar(g, 0, 0, playerLook(), { dir: 0, el: brzColor(), aura: S.cos.aura ? brzColor() : 0 }); g.restore(); }
}
function afford() { var bs = $('ov').querySelectorAll('[data-cost]'); for (var i = 0; i < bs.length; i++) { var c = +bs[i].dataset.cost, k = bs[i].dataset.cur || 'oro'; bs[i].disabled = (S[k] < c) || bs[i].dataset.lock === '1'; } var ls = $('ov').querySelectorAll('[data-live]'); for (i = 0; i < ls.length; i++) ls[i].textContent = C.fmt(S[ls[i].dataset.live]); }
function head(k, t, sub) { return '<div class="band"><span class="spaced">' + k + '</span><span class="spaced">' + C.fmt(S.oro) + ' ●</span></div><h2 class="mega">' + t + '</h2>' + (sub ? '<p class="kick">' + sub + '</p>' : ''); }
function afTxt(el) { var s1 = C.strongVs(el), w1 = C.weakVs(el); return (s1 ? '<br><span class="ok">Fuerte vs ' + C.EL[s1].ic + ' ' + C.EL[s1].n + '</span>' : '') + (w1 ? ' · <span class="bad">débil vs ' + C.EL[w1].ic + ' ' + C.EL[w1].n + '</span>' : ''); }
function item(ic, nm, ds, btn) { return '<div class="it"><div class="ic">' + ic + '</div><div class="tx"><div class="nm">' + nm + '</div><div class="ds">' + ds + '</div></div>' + (btn || '') + '</div>'; }
function bt(a, v, label, cost, cur, cls, lock) { return '<button class="btn sm ' + (cls || '') + '" data-a="' + a + '" data-v="' + (v || '') + '"' + (cost !== undefined ? ' data-cost="' + cost + '" data-cur="' + (cur || 'oro') + '"' : '') + (lock ? ' data-lock="1"' : '') + '>' + label + '</button>'; }
var PANELS = {
  tycoon: function () {
    var h = head('CIUDAD FORJA · TU NEGOCIO', 'Tycoon', 'Tu Espíritu se vuelve magia tangible: producción ×' + C.magia(S).toFixed(2));
    h += '<p class="m">Oro: <b class="gold" data-live="oro"></b> · Producción: <b class="w">' + C.fmt(C.prod(S)) + '/s</b> · Hitos ×2 en nivel 25, 50 y 100.</p><div class="list">';
    C.BLD.forEach(function (d) {
      var n = S.tyc[d.id], c = C.bCost(d.id, n), un = C.bUnlocked(S, d.id);
      h += item(d.ic, d.n + ' · NV ' + n, un ? 'Produce ' + C.fmt(C.bProd(S, d.id)) + '/s · siguiente nivel +' + (d.b * C.bMile(n + 1) * C.magia(S)).toFixed(1) + '/s' : '🔒 Compra primero el edificio anterior', bt('buyB', d.id, C.fmt(c) + ' ●', c, 'oro', '', !un));
    });
    if (S.caja < 8) h += item('🧰', 'Caja fuerte · ' + C.cajaH(S) + ' h', 'Ganancias guardadas mientras no juegas (al 50%).', bt('caja', '', C.fmt(C.cajaCost(S.caja)) + ' ●', C.cajaCost(S.caja)));
    return h + '</div>';
  },
  gear: function () {
    var h = head('DOJO · MAESTRA REN', 'Equipo', 'Multiplica todo lo que entrenas.') + '<div class="list">';
    ['fue', 'tec', 'esp'].forEach(function (k) { var lv = S.gear[k], c = C.gearCost(lv); h += item({ fue: '🥊', tec: '🥋', esp: '🧘' }[k], C.GEAR[k] + ' · NV ' + lv, 'Entrenamiento de ' + k.toUpperCase() + ' ×' + C.gearMul(lv).toFixed(1) + (lv < 20 ? ' → ×' + C.gearMul(lv + 1).toFixed(1) : ' (máximo)'), lv < 20 ? bt('gear', k, C.fmt(c) + ' ●', c) : ''); });
    return h + '</div>';
  },
  alq: function () {
    var c = C.elixCost(S.elix), g = C.elixGain(S);
    var h = head('ALQUIMIA', 'Elixires', 'Oro → poder. Cada elixir cuesta un 10% más.');
    h += '<p class="m">Siguiente elixir: <b class="gold">' + C.fmt(c) + ' ●</b> · da <b class="ok">+' + g.toFixed(1) + '</b> a la estadística que elijas.</p><div class="row">' + bt('elix', 'fue', '+ FUERZA', c, 'oro', 'red') + bt('elix', 'tec', '+ TÉCNICA', c, 'oro', 'tea') + bt('elix', 'esp', '+ ESPÍRITU', c, 'oro', '') + '</div>';
    return h;
  },
  pan: function () {
    var c = C.foodCost(S), ok = S.tyc.pan > 0;
    return head('PANADERÍA', 'Comer', 'Recupera 40 de energía para entrenar.') + (ok ? '<p class="m">Energía: <b class="w">' + Math.floor(S.en) + '/' + C.enMax(S) + '</b></p>' + bt('eat', '', 'Comer pan · ' + C.fmt(c) + ' ●', c) : '<p class="bad">Primero compra un Puesto de Pan en la mesa del Tycoon.</p>');
  },
  forge: function () {
    var h = head('FORJA DE DON TOBÍAS', 'Brazaletes', 'Los brazaletes multiplican tu Poder y NUNCA se pierden en el torneo.');
    h += '<p class="m">Chispas: <b class="ok">' + S.chispas + ' ✧</b> · Oro: <b class="gold" data-live="oro"></b></p><div class="list">';
    S.brz.forEach(function (b) {
      var E = C.EL[b.el], Tr = C.TIERS[b.t], nx = C.FORGE[b.t + 1], on = b.id === S.eq;
      h += '<div class="it' + (on ? ' on' : '') + '"><div class="ic">' + E.ic + '</div><div class="tx"><div class="nm" style="color:' + Tr.c + '">' + E.n + ' · ' + Tr.n + ' ×' + Tr.m + '</div><div class="ds">' + E.sk + ': ' + E.d + afTxt(b.el) + '</div></div><div style="display:grid;gap:4px">' + (on ? '<span class="tag gold">Equipado</span>' : bt('equip', b.id, 'Equipar')) + (b.t < 3 ? bt('up', b.id, '↑ ' + C.fmt(nx.o) + '● ' + nx.ch + '✧', nx.o, 'oro', 'red', S.chispas < nx.ch) : '') + '</div></div>';
    });
    h += '</div><div class="spaced gold" style="margin:14px 0 6px">Forjar nuevo elemento · ' + C.NEWB.o + ' ● + ' + C.NEWB.ch + ' ✧</div><div class="row">';
    Object.keys(C.EL).forEach(function (k) { if (C.brzOf(S, k)) return; var lk = C.elLocked(S, k); h += bt('newb', k, C.EL[k].ic + ' ' + C.EL[k].n + (lk ? ' 🔒' : ''), C.NEWB.o, 'oro', 'pap', lk || S.chispas < C.NEWB.ch); });
    return h + '</div>';
  },
  shop: function () {
    var h = '<div class="band"><span class="spaced">TIENDA · SIMULACIÓN</span><span class="spaced">' + S.gemas + ' ◆</span></div><h2 class="mega">Gemas</h2><p class="kick">En Roblox serían Robux. Aquí las gemas se ganan jugando: misiones, torneo y tablón diario.</p><div class="list">';
    C.SHOP.forEach(function (it) {
      if (it.id === 'plata' || it.id === 'oro') {
        var row = '<div class="row" style="margin-top:6px">'; C.ELK5.concat(['sombra', 'luz']).forEach(function (k) { var b = C.brzOf(S, k), t = it.id === 'plata' ? 1 : 2; if (b && b.t >= t) return; row += bt('shop', it.id + ':' + k, C.EL[k].ic, it.g, 'gemas', 'pap', C.elLocked(S, k)); }); row += '</div>';
        h += '<div class="it"><div class="ic">' + (it.id === 'plata' ? '🥈' : '🥇') + '</div><div class="tx"><div class="nm">' + it.n + ' · ' + it.g + ' ◆</div><div class="ds">' + it.d + '</div>' + row + '</div></div>';
      } else h += item(it.id === 'aura' ? '🖋️' : it.id === 'capa' ? '🦇' : '🧰', it.n, it.d, S.cos[it.id] ? '<span class="tag ok">Tuyo</span>' : bt('shop', it.id, it.g + ' ◆', it.g, 'gemas'));
    });
    return h + '</div><p class="m">Promesa: sin cajas aleatorias pagadas, sin temporizadores de presión. Todo lo que se compra se puede ganar jugando.</p>';
  },
  board: function () {
    var h = head('TABLÓN DE LA PLAZA', 'Misiones diarias', 'Se renuevan cada día. Cada misión: +3 ◆ y oro.') + '<div class="list">';
    S.daily.q.forEach(function (q, i) { var pr = Math.min(q.p, q.n); h += item(q.done ? '✅' : '📜', q.t, C.fmt(pr) + ' / ' + C.fmt(q.n), q.done ? '<span class="tag ok">Hecha</span>' : bt('claim', i, 'Cobrar', q.n, 'none', '', q.p < q.n)); });
    return h + '</div><p class="m">Volver cada día te regala +5 ◆. Sin castigos si no vienes.</p>';
  },
  rank: function () {
    var b = C.board(S), me = 0; b.forEach(function (x, i) { if (x.me) me = i; });
    var h = head('RANKING MUNDIAL', 'Top de Ánima', 'Tu puesto: #' + (me + 1) + ' de 100') + '<table class="tb">';
    b.forEach(function (x, i) { if (i < 30 || Math.abs(i - me) < 3) h += '<tr class="' + (x.me ? 'me' : '') + '"><td>#' + (i + 1) + '</td><td>' + C.EL[x.el].ic + ' ' + esc(x.n) + '</td><td style="text-align:right">' + C.fmt(x.p) + ' ⚡</td></tr>'; });
    return h + '</table>';
  },
  tour: function () {
    var p = C.poder(S), ok = p >= C.TOUR.req, first = S.cnt.tours === 0;
    var h = '<div class="band"><span class="spaced">COLISEO DEL ECLIPSE</span><span class="spaced">100 JUGADORES</span></div><h2 class="mega">Torneo Mundial</h2><p class="kick">Cien entran. Uno gana. Todos aprenden lo que valen.</p>';
    h += '<div class="film">FASE 1 · LA NOCHE: sobrevive 75 s. Tu luz congela a las sombras. Recoge llamas.<br>FASE 2 · DUELOS: top 32 → final. Entre duelos eliges una estrategia.<br>REGLA: pierdes el % de tu poder igual a tu puesto. Puesto 50 = −50%. Puesto 2 = −2%. Campeón = 0%.</div>';
    h += '<p>El <b class="gold">25%</b> de lo que pierdas vuelve a ti como <b class="ok">Legado</b> (multiplicador permanente). Tus brazaletes, equipo y negocio <b>nunca</b> se pierden.' + (first ? ' <b class="ok">Primer torneo: el amuleto de Pip limita la pérdida al 25%.</b>' : '') + '</p>';
    h += '<p class="m">Tu poder: <b class="w">' + C.fmt(p) + '</b> · Requisito: ' + C.TOUR.req + ' · Mejor puesto: ' + (S.cnt.best ? '#' + S.cnt.best : '—') + '</p>';
    return h + '<div class="row">' + (ok ? '<button class="btn red" data-a="tourGo">Inscribirme</button>' : '<span class="bad">Te faltan ' + (C.TOUR.req - p) + ' de Poder.</span>') + '<button class="btn pap" data-a="close">Ahora no</button></div>';
  },
  strat: function (a) {
    var b = a.b, h = '<div class="band"><span class="spaced">TORNEO · ' + a.name + '</span><span class="spaced">PAUSA ESTRATÉGICA</span></div>';
    h += '<h2 class="mega">VS ' + esc(b.n) + '</h2><p class="kick">' + C.EL[b.el].ic + ' ' + C.EL[b.el].n + ' · Poder ' + C.fmt(b.p) + ' · Tú: ' + C.fmt(C.poder(S)) + '</p>';
    var me = C.eqB(S).el, af = C.afin(me, b.el), ad = C.afin(b.el, me);
    h += '<div class="film">TU ' + C.EL[me].n + ' VS SU ' + C.EL[b.el].n + ': ' + (af > 1 ? 'TÚ HACES ×1.25 ✔' : af < 1 ? 'TÚ HACES ×0.8 ✖' : 'DAÑO NORMAL') + ' · ' + (ad > 1 ? 'ÉL TE HACE ×1.25 ✖' : ad < 1 ? 'ÉL TE HACE ×0.8 ✔' : 'ÉL: NORMAL') + '</div>';
    if (S.brz.length > 1) { h += '<p class="m" style="margin-bottom:4px">Cambia de brazalete según su elemento:</p><div class="row">'; S.brz.forEach(function (x) { var a2 = C.afin(x.el, b.el); h += '<button class="btn sm ' + (x.id === S.eq ? '' : 'pap') + '" data-a="stratEq" data-v="' + x.id + '">' + C.EL[x.el].ic + ' ' + C.TIERS[x.t].n + (a2 > 1 ? ' ✔' : a2 < 1 ? ' ✖' : '') + '</button>'; }); h += '</div>'; }
    h += '<p class="m">Elige una ventaja. Se acumulan durante todo el torneo.</p><div class="list">';
    h += item('🎯', 'Concentración', 'Daño +12% (llevas ×' + TR.buf.atk.toFixed(2) + ')', bt('strat', 'atk', 'Elegir', undefined, '', 'red'));
    h += item('🛡️', 'Guardia', 'Vida máxima +15% (llevas ×' + TR.buf.hp.toFixed(2) + ')', bt('strat', 'hp', 'Elegir', undefined, '', 'tea'));
    h += item('🌀', 'Respiración', 'Aura +30% y empiezas con 60 (llevas ×' + TR.buf.au.toFixed(2) + ')', bt('strat', 'au', 'Elegir'));
    return h + '</div>';
  },
  res: function (r) {
    var h = '<div class="band"><span class="spaced">TORNEO MUNDIAL · RESULTADO</span><span class="spaced">PAG ' + S.cnt.tours + '</span></div>';
    h += '<div class="spaced" style="color:#8a1219">Tu puesto</div><div class="res-big">#' + r.rank + '</div>';
    h += r.rank === 1 ? '<p class="loss" style="color:#0f5c66">¡Campeón! No pierdes nada.</p>' : '<p class="loss">−' + r.pct + '% de tu poder' + (r.capped ? ' <small style="font-size:.45em">(amuleto de Pip)</small>' : '') + '</p>';
    h += '<div class="kv"><b>Poder antes</b><span>' + C.fmt(r.p0) + '</span><b>Poder ahora</b><span>' + C.fmt(r.p1) + '</span><b>Legado ganado</b><span>+' + r.lg.toFixed(1) + ' (×' + C.mLeg(S).toFixed(3) + ' permanente)</span><b>Premio</b><span>+' + C.fmt(r.oro) + ' ● · +' + r.gem + ' ◆</span></div>';
    var q = r.rank === 1 ? 'Ganaste sin quitarle nada a nadie… ¿o no? Mira quién aplaude en el palco.' : r.rank <= 10 ? 'Tan cerca. El poder vuelve; la experiencia se queda.' : r.rank <= 32 ? 'Sobreviviste a la Noche. Eso ya es mucho.' : 'Caer es parte del camino. Lo que perdiste lo puedes recuperar; lo que aprendiste, no se pierde.';
    return h + '<p class="kick" style="color:#8a1219">“' + q + '”</p><button class="btn red" data-a="resOk">Continuar</button>';
  },
  cine: function (a) { return '<div class="band"><span class="spaced">BRAZALETES DEL PODER</span><span class="spaced">EDICIÓN ESPECIAL</span></div><h2 class="mega" style="font-size:clamp(40px,12vw,72px)">' + a.t + '</h2><p class="kick" style="color:#8a1219">' + a.s + '</p><button class="btn red" data-a="cineOk">¡Comenzar!</button>'; },
  choice: function () {
    return '<div class="band"><span class="spaced">ACTO III · LA DECISIÓN</span><span class="spaced">FINAL</span></div><h2 class="mega">El Brazalete del Origen</h2><p>Tienes en tus manos el poder de miles. Nima te mira en silencio.</p><div class="list">' +
      '<button class="it" data-a="choose" data-v="compartir" style="background:#0f5c66;color:#fff"><div class="ic">💛</div><div class="tx"><div class="nm">Romperlo y devolver el poder</div><div class="ds" style="color:#e3d3b0">Ánima entera se fortalece. Tú ganas un gran Legado.</div></div></button>' +
      '<button class="it" data-a="choose" data-v="corona" style="background:#12061f;color:#fff"><div class="ic">👑</div><div class="tx"><div class="nm">Quedártelo</div><div class="ds" style="color:#c77dff">Brazalete de Origen ×4.5 para ti. Te conviertes en el nuevo Anfitrión.</div></div></button></div>';
  },
  page: function (a) {
    var f = a.f, n = C.fragCount(S);
    return '<div class="band"><span class="spaced">CÓDICE DEL ORIGEN</span><span class="spaced">FRAGMENTO ' + n + ' / ' + C.FRAG.length + '</span></div><h2 class="mega">' + f.t + '</h2>' + f.p.map(function (x) { return '<p style="font-size:16px">' + x + '</p>'; }).join('') +
      '<p class="kick" style="color:#8a1219">+10 Legado · +5 ◆' + (a.all ? ' · ¡Códice completo! +200 Legado y título “Guardián del Origen”' : '') + '</p><button class="btn red" data-a="pageOk">Guardar en el Códice</button>';
  },
  chat: function () { var h = '<h2 class="mega">Chat rápido</h2><p class="m">Frases seguras para saludar y hacer amigos.</p><div class="row">'; C.CHAT.forEach(function (t, i) { h += bt('say', i, esc(t), undefined, '', 'pap'); }); return h + '</div>'; },
  menu: function () {
    var tabs = [['perfil', 'Perfil'], ['mis', 'Misiones'], ['amigos', 'Amigos'], ['codice', 'Códice'], ['brz', 'Brazaletes'], ['rank', 'Ranking'], ['shop', 'Tienda'], ['cfg', 'Ajustes'], ['guia', 'Guía']], t = PANEL.tab || 'perfil';
    var h = '<div class="tabs">' + tabs.map(function (x) { return '<button class="' + (x[0] === t ? 'on' : '') + '" data-a="tab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
    if (t === 'rank') return h + PANELS.rank(); if (t === 'shop') return h + PANELS.shop(); if (t === 'brz') return h + PANELS.forge().replace(/data-a="(up|newb)"[^>]*>/g, 'disabled>');
    if (t === 'perfil') {
      var cs = C.combat(S), p = C.poder(S), r = C.rankOf(p);
      h += '<div class="row" style="align-items:flex-start"><canvas data-av width="150" height="170" style="width:110px;height:125px;border:3px solid #f2e8d5;background:#0f5c66"></canvas><div style="flex:1;min-width:160px"><h2 class="mega" style="margin:0">' + esc(S.name) + '</h2><p class="kick" style="margin:2px 0">' + C.ORIG[S.origin].ic + ' ' + C.ORIG[S.origin].n + (S.title ? ' · ' + esc(S.title) : '') + '</p><span class="tag gold">' + C.RANKS[r][1] + '</span> <span class="m">' + (r < C.RANKS.length - 1 ? 'siguiente: ' + C.fmt(C.RANKS[r + 1][0]) : 'rango máximo') + '</span></div></div>';
      h += '<div class="film">PODER ' + C.fmt(p) + ' = BASE ' + C.fmt(C.base(S)) + ' × BRAZALETE ' + C.mBr(S) + ' × LEGADO ' + C.mLeg(S).toFixed(3) + '</div>';
      h += '<div class="kv" style="margin-top:8px"><b>Fuerza</b><span>' + S.stats.fue.toFixed(1) + '</span><b>Técnica</b><span>' + S.stats.tec.toFixed(1) + '</span><b>Espíritu</b><span>' + S.stats.esp.toFixed(1) + '</span><b>Vida</b><span>' + cs.maxHp + '</span><b>Daño</b><span>' + cs.atk.toFixed(1) + ' · crítico ' + Math.round(cs.crit * 100) + '%</span><b>Legado</b><span>' + S.legado.toFixed(1) + '</span><b>Enemigos</b><span>' + S.cnt.kills + '</span><b>Torneos</b><span>' + S.cnt.tours + ' · ganados ' + S.cnt.wins + ' · mejor ' + (S.cnt.best ? '#' + S.cnt.best : '—') + '</span><b>Tiempo</b><span>' + Math.floor(S.cnt.play / 60) + ' min</span></div>';
      if (S.tours.length) { h += '<div class="spaced gold" style="margin:12px 0 4px">Historial</div><table class="tb">'; S.tours.slice(0, 6).forEach(function (x) { h += '<tr><td>#' + x.r + '</td><td>−' + x.pct + '%</td><td>' + C.fmt(x.p0) + ' ⚡</td></tr>'; }); h += '</table>'; }
      return h;
    }
    if (t === 'mis') {
      var st = C.STORY[S.story.i], pr = C.stepProg(S);
      h += '<div class="spaced gold">Historia · Acto ' + Math.min(3, st.act) + '</div><h2 class="mega" style="font-size:36px">' + st.t + '</h2><p>' + C.stepHint(S) + (pr[1] > 1 ? ' · ' + C.fmt(pr[0]) + '/' + C.fmt(pr[1]) : '') + '</p>';
      h += '<div class="spaced gold" style="margin:12px 0 6px">Secundarias</div><div class="list">';
      C.SIDE.forEach(function (q) { var x = S.side[q.id]; if (!x && S.story.i < C.STI[q.req]) return; h += item(x && x.s === 2 ? '✅' : x ? '📜' : '❔', q.t + ' · ' + C.NPC[q.who].n, x && x.s === 2 ? 'Completada' : x ? q.h + ' · ' + Math.min(x.n, q.o.n) + '/' + q.o.n + (C.sideReady(S, q.id) ? ' · ¡vuelve con ' + C.NPC[q.who].n + '!' : '') : 'Habla con ' + C.NPC[q.who].n + ' (' + C.ZONES[NPCZ[q.who]].n + ')'); });
      h += '</div><div class="spaced gold" style="margin:12px 0 6px">Historia completada</div><div class="list">' + C.STORY.slice(0, S.story.i).map(function (x) { return '<div class="m">✔ ' + x.t + '</div>'; }).join('') + '</div>';
      return h + '<div style="margin-top:12px">' + PANELS.board().replace(/<div class="band">.*?<\/div>/, '') + '</div>';
    }
    if (t === 'amigos') {
      h += '<h2 class="mega">Amigos</h2><p class="m">Cerca de otros jugadores, abre 💬 y di «¿Amigos?». Hasta 2 amigos pueden ir en tu grupo: te siguen y pelean contigo en las Tierras Rotas. Cada 25 de amistad te regalan 3 ◆.</p><div class="list">';
      if (!S.friends.length) h += '<p class="kick">Aún no tienes amigos. ¡Ve a la Plaza y saluda!</p>';
      S.friends.forEach(function (f) { var b = S.bots[f.bi], inP = S.party.indexOf(f.bi) >= 0; h += item(C.EL[b.el].ic, esc(b.n) + (inP ? ' · en tu grupo' : ''), '⚡ ' + C.fmt(b.p) + ' · amistad ' + Math.floor(f.af) + '/100 ' + '❤'.repeat(Math.floor(f.af / 25)), bt('party', f.bi, inP ? 'Sacar' : 'Invitar', undefined, '', inP ? 'pap' : 'tea', !inP && S.party.length >= 2)); });
      return h + '</div>';
    }
    if (t === 'codice') {
      h += '<h2 class="mega">Códice</h2><p class="m">Fragmentos del Brazalete del Origen: ' + C.fragCount(S) + ' / ' + C.FRAG.length + '. Busca haces de luz azul en las zonas.</p><div class="list">';
      C.FRAG.forEach(function (f, i) { var ok = S.frag[f.id]; h += ok ? '<div class="film"><b style="color:#f0b429">' + (i + 1) + '. ' + f.t + '</b><br>' + f.p.join(' ') + '</div>' : item('❔', (i + 1) + '. ???', 'Aún no encontrado · en algún lugar de ' + C.ZONES[f.z].n); });
      return h + '</div>';
    }
    if (t === 'cfg') {
      var on = function (k) { return S.cfg[k] ? 'Sí' : 'No'; };
      h += '<h2 class="mega">Ajustes</h2><div class="list">' + item('🔊', 'Sonido', 'Efectos sintetizados', bt('cfg', 'snd', on('snd'))) + item('🎵', 'Música', 'Melodías por zona', bt('cfg', 'mus', on('mus'))) + item('📱', 'Calidad alta', 'Desactívala en celulares modestos', bt('cfg', 'q', on('q'))) + item('📳', 'Vibración', 'En golpes y daño', bt('cfg', 'vib', on('vib'))) + item('🔠', 'Texto grande', 'Diálogos, misiones y avisos más grandes', bt('cfg', 'big', on('big'))) + item('🕊️', 'Modo calma', 'Sin destellos ni sacudidas de pantalla (fotosensibilidad)', bt('cfg', 'calm', on('calm'))) + '</div>';
      h += '<div class="spaced gold" style="margin:14px 0 6px">Tu partida</div><div class="row">' + bt('exp', '', '⬇ Exportar partida', undefined, '', 'tea') + bt('imp', '', '⬆ Importar', undefined, '', 'pap') + bt('reset', '', 'Borrar partida', undefined, '', 'red') + '</div><p class="m">Se guarda sola en este dispositivo. Exporta un archivo para respaldarla o pasarla a otro teléfono.</p><p class="pag">Versión ' + C.VERSION + '</p>';
      return h;
    }
    return h + '<h2 class="mega">Cómo jugar</h2><div class="film">MOVER: joystick (izquierda) o WASD · GOLPE: ⚔ o J/espacio · PODER: K · ESQUIVA: » o L/shift · INTERACTUAR: botón amarillo o E · MENÚ: M</div>' +
      '<p><b class="gold">Poder</b> = (Fuerza + Técnica + Espíritu) × brazalete × legado.</p><p><b class="gold">Dojo</b>: entrena con ritmo (saco), precisión (katas) y calma (respiración 4-4).</p><p><b class="gold">Forja</b>: tu negocio produce oro. El Espíritu multiplica la producción. El oro compra elixires, equipo y brazaletes.</p><p><b class="gold">Tierras Rotas</b>: 3 anillos de dificultad. Derrotar enemigos da poder, oro y chispas. Esquiva los círculos rojos.</p><p><b class="gold">Elementos</b>: 🔥 Fuego > 🌀 Viento > ⛰️ Tierra > ⚡ Rayo > 💧 Agua > 🔥 Fuego (×1.25 de daño al que vences, ×0.8 al que te vence). 🌑 Sombra y ✨ Luz se dañan ×1.25 entre sí. Antes de cada duelo puedes cambiar de brazalete.</p><p><b class="gold">Códice</b>: 7 fragmentos del Origen escondidos (haces de luz azul). Cada uno cuenta parte de la historia de Ánima.</p><p><b class="gold">Torneo</b>: pierdes el % de poder igual a tu puesto. El 25% vuelve como Legado. Brazaletes, equipo y negocio nunca se pierden.</p><p class="kick">Juega con calma, toma descansos y trata bien a los demás. El poder no define tu valor.</p>';
  }
};
var ACTS = {
  close: function () { closePanel(); },
  tab: function (v) { PANEL.tab = v; renderPanel(); },
  buyB: function (v) { if (C.buyB(S, v)) { sfx('coin'); refreshForja(); burstUI(); } renderPanel(); },
  caja: function () { C.buyCaja(S); renderPanel(); },
  gear: function (v) { if (C.buyGear(S, v)) sfx('up'); renderPanel(); },
  elix: function (v) { var g = C.buyElix(S, v); if (g) { sfx('up'); toast('+' + g.toFixed(1) + ' ' + v.toUpperCase(), 'ok'); refreshCombat(); } renderPanel(); },
  eat: function () { if (C.eat(S)) { sfx('coin'); toast('+40 energía 🥖', 'ok'); } renderPanel(); },
  equip: function (v) { C.equip(S, +v); refreshCombat(); sfx('up'); renderPanel(); },
  up: function (v) { var r = C.forgeUp(S, +v); toast(r === 'ok' ? '¡Brazalete mejorado!' : r === 'falta' ? 'Te faltan recursos' : 'Ya está al máximo', r === 'ok' ? 'gold' : 'bad'); if (r === 'ok') { sfx('win'); refreshCombat(); } renderPanel(); },
  newb: function (v) { var r = C.forgeNew(S, v); toast(r === 'ok' ? '¡Nuevo brazalete de ' + C.EL[v].n + '!' : r === 'bloqueado' ? 'Se desbloquea con la historia' : 'Te faltan recursos', r === 'ok' ? 'gold' : 'bad'); if (r === 'ok') sfx('win'); renderPanel(); },
  shop: function (v) { var p = v.split(':'), r = C.shopBuy(S, p[0], p[1]); toast(r === 'ok' ? '¡Comprado!' : r === 'falta' ? 'Gemas insuficientes' : r === 'tienes' ? 'Ya lo tienes' : 'No disponible', r === 'ok' ? 'gold' : 'bad'); if (r === 'ok') { sfx('win'); refreshCombat(); save(); } renderPanel(); },
  claim: function (v) { if (C.dailyClaim(S, +v)) { sfx('win'); toast('+3 ◆ y oro', 'gold'); } renderPanel(); },
  tourGo: function () { closePanel(); tourStart(); },
  strat: function (v) { if (v === 'atk') TR.buf.atk *= 1.12; else if (v === 'hp') TR.buf.hp *= 1.15; else TR.buf.au *= 1.3; var cb = PANEL.a.cb; closePanel(); cb(); },
  resOk: function () { var cb = PANEL.a.cb; closePanel(); cb(); },
  cineOk: function () { var cb = PANEL.a.cb; closePanel(); cb(); },
  stratEq: function (v) { C.equip(S, +v); refreshCombat(); sfx('up'); renderPanel(); },
  pageOk: function () { var all = PANEL.a.all; closePanel(); if (all) { banner('¡GUARDIÁN DEL ORIGEN!', 'Completaste el Códice'); sfx('win'); } hudFull(); },
  choose: function (v) { closePanel(); C.choose(S, v); refreshCombat(); save(); sfx('win'); dialog(ENDS[S.ending], function () { banner('FIN', S.title); hudFull(); }); },
  say: function (v) { closePanel(); quickChat(C.CHAT[+v]); },
  party: function (v) { var bi = +v, on = S.party.indexOf(bi) < 0; if (C.setParty(S, bi, on)) { toast(on ? S.bots[bi].n + ' se une a tu grupo 🤝' : S.bots[bi].n + ' salió del grupo', 'ok'); if (mode === 'world') { ents = ents.filter(function (e) { return e.k !== 'ally'; }); spawnParty(); } save(); } renderPanel(); },
  cfg: function (v) { S.cfg[v] = S.cfg[v] ? 0 : 1; applyA11y(); if (v === 'q') { MAPS = {}; resize(); document.body.classList.toggle('low', !S.cfg.q); if (mode === 'world') { var z = MAP.id; MAP = null; loadZone(z); } } save(); renderPanel(); },
  exp: function () { exportSave(); },
  imp: function () { $('fileIn').click(); },
  reset: function () { if (confirm('¿Borrar tu partida? Exporta antes si quieres conservarla.') && confirm('¿Seguro? No se puede deshacer.')) { try { localStorage.removeItem(C.SAVE_KEY); } catch (e) { } location.reload(); } }
};
function burstUI() { parts(P.x, P.y - 30, '#f0b429', 6); }
$('ov').addEventListener('click', function (e) {
  var b = e.target.closest('[data-a]');
  if (!b) { if (e.target === $('ov') && PANEL && ['strat', 'res', 'cine', 'choice'].indexOf(PANEL.n) < 0) closePanel(); return; }
  if (b.disabled) return; sfx('ui'); var f = ACTS[b.dataset.a]; if (f) f(b.dataset.v, b);
});
function showStrategy(name, b, cb) { openPanel('strat', { name: name, b: b, cb: cb }); }
function showResults(res, cb) { res.cb = cb; sfx(res.rank <= 10 ? 'win' : 'ko'); openPanel('res', res); PANEL.a.cb = cb; }
function cinematic(t, s, cb) { openPanel('cine', { t: t, s: s, cb: cb }); }

/* ---------- guardado ---------- */
function save() { if (!S) return; S.last = Date.now(); if (P && mode === 'world') S.hp = P.hp; try { localStorage.setItem(C.SAVE_KEY, C.serialize(S)); } catch (e) { } }
function exportSave() {
  save(); var d = new Date(), name = 'brazaletes-' + S.name.replace(/\W+/g, '') + '-' + d.getFullYear() + (d.getMonth() + 1) + d.getDate() + '.json';
  var blob = new Blob([C.serialize(S)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast('Partida exportada: ' + name, 'ok');
}
$('fileIn').addEventListener('change', function () {
  var f = this.files && this.files[0]; if (!f) return; var rd = new FileReader();
  rd.onload = function () { var st = C.deserialize(String(rd.result)); if (!st) { toast('Archivo no válido', 'bad'); return; } if (S && !confirm('¿Reemplazar la partida actual por la de ' + st.name + '?')) return; S = st; save(); location.reload(); };
  rd.readAsText(f); this.value = '';
});
document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

/* ---------- minijuegos ---------- */
var MG = { on: 0 }, mg = $('mgc').getContext('2d'), MW = 1, MH = 1;
var MGT = { saco: ['Saco de Fuerza', 'Golpea con RITMO (3–6 golpes/s). Spamear sin técnica rinde menos.', '¡Golpe!'], kata: ['Katas de Técnica', 'Toca cuando el anillo coincida con el círculo. Rachas = más difícil y más premio.', '¡Ahora!'], medita: ['Cascada Serena', 'MANTÉN para inhalar 4 s · SUELTA para exhalar 4 s. Recupera energía.', 'Mantén'], yunque: ['Yunque', 'Golpea el yunque para forjar monedas.', '¡Martillo!'] };
function mgStart(kind) {
  MG = { on: 1, kind: kind, t: 0, taps: [], sw: 0, sv: 0, ring: 160, streak: 0, ph: 'idle', inS: 0, outS: 0, din: 0, last: '', lastT: 0, gain: 0, n: 0 };
  paused++; $('mg').hidden = false; $('mgT').textContent = MGT[kind][0]; $('mgH').textContent = MGT[kind][1]; $('mgB').textContent = MGT[kind][2];
  mgResize(); mgStat();
}
function mgEnd() { if (!MG.on) return; MG.on = 0; $('mg').hidden = true; paused = Math.max(0, paused - 1); refreshCombat(); save(); hudFull(); if (MG.n) toast('Sesión: +' + MG.gain.toFixed(1) + (MG.kind === 'yunque' ? ' oro' : ' ' + { saco: 'FUE', kata: 'TEC', medita: 'ESP' }[MG.kind]), 'ok'); }
function mgResize() { var c = $('mgc'), r = c.getBoundingClientRect(); MW = Math.max(1, r.width); MH = Math.max(1, r.height); c.width = MW * DPR; c.height = MH * DPR; }
function mgStat() { $('mgS').textContent = MG.kind === 'yunque' ? C.fmt(S.oro) + ' ●' : '⚡ ' + Math.floor(S.en) + '/' + C.enMax(S); }
function mgFloat(t, c) { MG.fl = (MG.fl || []).concat([{ t: t, c: c, y: 0, life: 1 }]).slice(-6); }
function mgAct(type) {
  if (!MG.on) return; var now = performance.now() / 1000, k = MG.kind;
  if (k === 'saco' && type === 'down') {
    MG.taps.push(now); MG.taps = MG.taps.filter(function (t) { return now - t < 1.2; });
    var cad = MG.taps.length / 1.2, q = cad > 8 ? .6 : cad >= 2.5 && cad <= 6.5 ? 1.25 : 1;
    var g = C.train(S, 'saco', q); if (g < 0) { mgFloat('SIN ENERGÍA · medita o come pan', '#e0262f'); tip('energia', 'Sin energía. Medita en la cascada (te devuelve energía) o come pan en la Forja.'); return; }
    MG.sv += 5 * (Math.random() < .5 ? 1 : -1); MG.gain += g; MG.n++; MG.last = q > 1 ? 'RITMO PERFECTO ×1.25' : q < 1 ? 'SIN TÉCNICA ×0.6' : 'BIEN'; MG.lastT = .6;
    mgFloat('+' + g.toFixed(2) + ' FUE', q > 1 ? '#f0b429' : '#fff'); sfx(q > 1 ? 'crit' : 'hit'); vib(8);
    if (MG.n % 25 === 0) { mgFloat('¡COMBO ×' + MG.n + '!', '#ff2fb3'); sfx('up'); }
  } else if (k === 'kata' && type === 'down') {
    var d = Math.abs(MG.ring - 55), q2 = d <= 7 ? 1.25 * Math.min(1.6, 1 + MG.streak * .06) : d <= 18 ? .6 : 0;
    var g2 = C.train(S, 'kata', q2); if (g2 < 0) { mgFloat('SIN ENERGÍA', '#e0262f'); return; }
    if (q2 > 1) C.ev(S, 'perf', { st: 'tec' });
    if (q2 > 0) { MG.streak = q2 > 1 ? MG.streak + 1 : 0; MG.gain += g2; MG.n++; mgFloat((q2 > 1 ? '¡PERFECTO! ' : 'BIEN ') + '+' + g2.toFixed(2) + ' TEC', q2 > 1 ? '#f0b429' : '#fff'); sfx(q2 > 1 ? 'crit' : 'hit'); }
    else { MG.streak = 0; mgFloat('FALLO', '#e0262f'); sfx('hurt'); }
    MG.ring = 160;
  } else if (k === 'medita') {
    if (type === 'down') {
      if (MG.ph === 'out') {
        var dout = now - MG.outS, qa = function (x) { return Math.abs(x - 4) < .6 ? 1.25 : Math.abs(x - 4) < 1.4 ? .8 : .3; }, q3 = qa(MG.din) * qa(dout) / 1.25;
        var g3 = C.train(S, 'medita', q3); MG.gain += g3; MG.n++; if (q3 > 1.1) C.ev(S, 'perf', { st: 'esp' });
        mgFloat((q3 > 1.1 ? 'RESPIRACIÓN PERFECTA ' : 'RESPIRACIÓN ') + '+' + g3.toFixed(2) + ' ESP · +12 ⚡', q3 > 1.1 ? '#2dffb3' : '#fff'); sfx('up');
      }
      MG.ph = 'in'; MG.inS = now;
    } else if (type === 'up' && MG.ph === 'in') { MG.din = now - MG.inS; MG.ph = 'out'; MG.outS = now; }
  } else if (k === 'yunque' && type === 'down') {
    var o = C.tapOro(S); MG.gain += o; MG.n++; C.ev(S, 'anvil', {}); MG.sv = 1; mgFloat('+' + C.fmt(o) + ' ●', '#f0b429'); sfx('coin'); vib(6);
  }
  mgStat();
}
function mgUpdate(dt) {
  MG.t += dt; MG.lastT -= dt;
  MG.sv += -MG.sw * 30 * dt; MG.sv *= .96; MG.sw += MG.sv * dt * 4; MG.sw = C.clamp(MG.sw, -1, 1);
  if (MG.kind === 'kata') { MG.ring -= 95 * Math.min(1.8, 1 + MG.streak * .06) * dt; if (MG.ring < 30) { MG.streak = 0; C.train(S, 'kata', 0); mgFloat('TARDE', '#e0262f'); MG.ring = 160; mgStat(); } }
  if (MG.kind === 'yunque') MG.sv = Math.max(0, MG.sv - dt * 6);
  (MG.fl || []).forEach(function (f) { f.y += dt * 60; f.life -= dt * .9; }); MG.fl = (MG.fl || []).filter(function (f) { return f.life > 0; });
  if ((MG.t * 4 | 0) !== ((MG.t - dt) * 4 | 0)) mgStat();
}
function mgDraw() {
  var g = mg, cx = MW / 2, cy = MH / 2, s = Math.min(MW, MH) / 320;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  var bgc = { saco: '#8a1219', kata: '#0f5c66', medita: '#08343b', yunque: '#33333d' }[MG.kind];
  g.fillStyle = bgc; g.fillRect(0, 0, MW, MH);
  g.fillStyle = 'rgba(0,0,0,.22)'; for (var y = 0; y < MH; y += 9) for (var x = (y / 9 & 1) * 4.5; x < MW; x += 9) g.fillRect(x, y, 2, 2);
  g.lineWidth = 3; g.strokeStyle = INK;
  if (MG.kind === 'saco') {
    g.save(); g.translate(cx + 30 * s, cy - 120 * s); g.rotate(MG.sw * .35); g.scale(s, s); g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 30); g.stroke(); rr(g, -32, 30, 64, 150, '#e0262f'); rr(g, -32, 80, 64, 14, PAP); g.restore();
    g.save(); g.translate(cx - 70 * s, cy + 90 * s); g.scale(2.6 * s, 2.6 * s); drawAvatar(g, 0, 0, playerLook(), { dir: 3, atk: MG.lastT > .45 ? 1 : 0, el: brzColor() }); g.restore();
    if (MG.lastT > .4) { g.lineWidth = 2; star(g, cx + 10 * s, cy - 20 * s, 34 * s, 14 * s, 10, '#f0b429'); ctext(g, ['¡PAM!', '¡POW!', '¡BAM!'][MG.n % 3], cx + 10 * s, cy - 20 * s, 26 * s, '#fff', -.15); }
    var cad = MG.taps.filter(function (t) { return performance.now() / 1000 - t < 1.2; }).length / 1.2;
    g.fillStyle = INK; g.fillRect(20, MH - 46, MW - 40, 18); var zx = 20 + (MW - 40) * 2.5 / 10, zw = (MW - 40) * 4 / 10; g.fillStyle = '#2dffb3'; g.fillRect(zx, MH - 44, zw, 14);
    g.fillStyle = '#f0b429'; g.fillRect(20 + (MW - 40) * Math.min(1, cad / 10) - 3, MH - 50, 6, 26); g.font = '700 11px Cuerpo, sans-serif'; g.fillStyle = PAP; g.textAlign = 'left'; g.fillText('RITMO ' + cad.toFixed(1) + ' golpes/s', 22, MH - 54);
    if (MG.lastT > 0) ctext(g, MG.last, cx, 40, 20, MG.last.indexOf('PERF') >= 0 ? '#2dffb3' : '#fff');
  } else if (MG.kind === 'kata') {
    g.save(); g.translate(cx, cy); g.lineWidth = 6; g.strokeStyle = PAP; g.beginPath(); g.arc(0, 0, 55 * s, 0, TAU); g.stroke();
    g.lineWidth = 3; g.strokeStyle = INK; g.beginPath(); g.arc(0, 0, 55 * s, 0, TAU); g.stroke();
    var near = Math.abs(MG.ring - 55) <= 7; g.lineWidth = 6; g.strokeStyle = near ? '#2dffb3' : '#f0b429'; g.beginPath(); g.arc(0, 0, Math.max(1, MG.ring * s), 0, TAU); g.stroke(); g.restore();
    g.save(); g.translate(cx, cy + 34 * s); g.scale(1.6 * s, 1.6 * s); drawAvatar(g, 0, 0, playerLook(), { dir: 0, atk: MG.streak % 2, el: brzColor() }); g.restore();
    ctext(g, 'RACHA ×' + MG.streak, cx, 40, 22, '#f0b429');
  } else if (MG.kind === 'medita') {
    var now = performance.now() / 1000, el = MG.ph === 'in' ? now - MG.inS : MG.ph === 'out' ? now - MG.outS : 0;
    var r = MG.ph === 'in' ? 40 + Math.min(el, 6) * 22 : MG.ph === 'out' ? Math.max(40, 40 + Math.min(MG.din, 6) * 22 - el * 22) : 40;
    g.fillStyle = 'rgba(57,200,255,.18)'; g.beginPath(); g.arc(cx, cy, 128 * s, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(242,232,213,.35)'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, 128 * s, 0, TAU); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#39c8ff'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r * s, 0, TAU); g.fill(); g.stroke();
    g.save(); g.translate(cx, cy + 40 * s); g.scale(1.5 * s, 1.5 * s); drawAvatar(g, 0, 0, playerLook(), { dir: 0, el: brzColor() }); g.restore();
    var lbl = MG.ph === 'in' ? 'INHALA · ' + el.toFixed(1) + 's' : MG.ph === 'out' ? 'EXHALA · ' + el.toFixed(1) + 's' : 'MANTÉN PARA INHALAR';
    ctext(g, lbl, cx, 44, 26, MG.ph === 'in' ? '#2dffb3' : '#f2e8d5');
    g.font = 'italic 14px Georgia, serif'; g.fillStyle = PAP; g.textAlign = 'center'; g.fillText('Respirar despacio también te calma fuera del juego.', cx, MH - 20);
  } else if (MG.kind === 'yunque') {
    g.save(); g.translate(cx, cy + 40 * s); g.scale(s * 2, s * 2); rr(g, -20, -30, 40, 30, '#3a3a46'); rr(g, -46, -52, 92, 22, '#55555f'); g.fillStyle = '#ff7a2e'; g.fillRect(-14, -58, 28, 6); g.strokeRect(-14, -58, 28, 6);
    g.save(); g.translate(30, -60 - (1 - MG.sv) * 30); g.rotate(-.6 + MG.sv * .6); rr(g, -4, -50, 8, 50, '#5a3825'); rr(g, -16, -60, 32, 14, '#1b1b22'); g.restore(); g.restore();
    if (MG.sv > .6) for (var i = 0; i < 8; i++) { g.fillStyle = '#f0b429'; g.fillRect(cx + Math.cos(i) * 60 * s * (1.6 - MG.sv), cy - 30 * s + Math.sin(i * 2) * 30 * s, 5, 5); }
    ctext(g, C.fmt(C.prod(S)) + ' ●/s', cx, 44, 22, '#f0b429');
  }
  (MG.fl || []).forEach(function (f, i) { g.globalAlpha = Math.max(0, f.life); ctext(g, f.t, cx, cy - 150 * s - f.y - i * 4, 20, f.c); g.globalAlpha = 1; });
}
function mgDown(e) { e.preventDefault(); au(); mgAct('down'); }
$('mgB').addEventListener('pointerdown', mgDown); $('mgc').addEventListener('pointerdown', mgDown);
['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { $('mgB').addEventListener(n, function () { mgAct('up'); }); $('mgc').addEventListener(n, function () { mgAct('up'); }); });
$('mgX').addEventListener('click', mgEnd);

/* ---------- entrada ---------- */
function resize() {
  W = innerWidth; H = innerHeight; DPR = Math.min(window.devicePixelRatio || 1, S && !S.cfg.q ? 1 : 2);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  Z = W > H * 1.25 ? C.clamp(H / (9 * T), .7, 1.6) : C.clamp(Math.min(W, H) / (9.5 * T), .7, 1.5);
  if (MG.on) mgResize();
}
window.addEventListener('resize', resize);
var KMAP = { ' ': 'atk', j: 'atk', k: 'sk', l: 'dash', shift: 'dash' };
window.addEventListener('keydown', function (e) {
  var k = e.key.toLowerCase(); if (e.target && e.target.tagName === 'INPUT') return;
  if (MG.on) { if ((k === ' ' || k === 'j' || k === 'enter') && !e.repeat) { mgAct('down'); e.preventDefault(); } if (k === 'escape') mgEnd(); return; }
  if (DLG.q) { if (k === ' ' || k === 'enter' || k === 'e') { dlgNext(); e.preventDefault(); } return; }
  if (!$('ov').hidden) { if (k === 'escape' && PANEL && ['strat', 'res', 'cine', 'choice'].indexOf(PANEL.n) < 0) closePanel(); return; }
  if (mode === 'off') return;
  keys[k] = 1; if (k === ' ' || k.indexOf('arrow') === 0) e.preventDefault();
  if (e.repeat) return; au();
  var a = KMAP[k]; if (a) { inp[a] = 1; if (a === 'atk') inp.hold = 1; }
  if (k === 'e' || k === 'enter') interact();
  if (k === 'm' || k === 'escape') openPanel('menu');
});
window.addEventListener('keyup', function (e) { var k = e.key.toLowerCase(); keys[k] = 0; if (k === ' ' || k === 'j') inp.hold = 0; if (MG.on && (k === ' ' || k === 'j' || k === 'enter')) mgAct('up'); });
window.addEventListener('blur', function () { keys = {}; inp.hold = 0; joy.id = -1; $('joy').style.display = 'none'; });
cv.addEventListener('pointerdown', function (e) {
  au(); if (mode === 'off' || paused || !P) return;
  if (e.pointerType !== 'mouse' && e.clientX < W * .5) { if (joy.id < 0) { joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.x = joy.y = 0; var j = $('joy'); j.style.display = 'block'; j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; j.firstChild.style.transform = ''; try { cv.setPointerCapture(e.pointerId); } catch (er) { } } return; }
  if (e.pointerType === 'mouse') { face(P, (e.clientX - W / 2) / Z + cam.x, (e.clientY - H / 2) / Z + cam.y + 20); if (e.button === 2) inp.sk = 1; else inp.atk = 1; return; }
  inp.atk = 1;
});
cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
cv.addEventListener('pointermove', function (e) {
  if (e.pointerId !== joy.id) return; var dx = e.clientX - joy.ox, dy = e.clientY - joy.oy, l = Math.hypot(dx, dy), m = 50;
  if (l > m) { dx = dx / l * m; dy = dy / l * m; } joy.x = dx / m; joy.y = dy / m; $('joy').firstChild.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
});
function joyEnd(e) { if (e.pointerId === joy.id) { joy.id = -1; joy.x = joy.y = 0; $('joy').style.display = 'none'; } }
cv.addEventListener('pointerup', joyEnd); cv.addEventListener('pointercancel', joyEnd);
function hold(id, on, off) { var b = $(id); b.addEventListener('pointerdown', function (e) { e.preventDefault(); au(); if (!paused) on(); }); if (off) ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { b.addEventListener(n, off); }); }
hold('bAtk', function () { inp.atk = 1; inp.hold = 1; }, function () { inp.hold = 0; });
hold('bSk', function () { inp.sk = 1; }); hold('bDash', function () { inp.dash = 1; });
$('bAct').addEventListener('click', function () { au(); interact(); });
$('bMenu').addEventListener('click', function () { au(); sfx('ui'); openPanel('menu'); });
$('bChat').addEventListener('click', function () { au(); sfx('ui'); if (mode === 'world') openPanel('chat'); });
$('mini').addEventListener('click', function () { var c = this, big = !c.classList.contains('big'); c.classList.toggle('big', big); c.width = big ? 330 : 132; c.height = big ? 260 : 104; drawMini(); });
$('quest').addEventListener('click', function () { au(); sfx('ui'); PANEL = null; openPanel('menu', 'mis'); });

/* ---------- portada y creación ---------- */
var CR = null, coverAnim = 0;
function coverHTML(st) {
  return '<div class="cband"><div>Edición Nº 1 · Ánima</div><div>Funciona sin internet</div></div><div class="cbody">' +
    '<div class="srf">RPG de acción · Cómic & anime · Tycoon · Torneo de supervivencia</div>' +
    '<h1 class="mega t1">Brazaletes</h1><canvas id="coverCv" width="560" height="560"></canvas><div class="mega t2">del Poder</div>' +
    '<p class="kick" style="font-size:19px;color:#ff2fb3;margin:6px 0">¿Cuánto vale tu poder?</p>' +
    '<div class="ctag">Entrena. Forja.<br>Sobrevive a la Noche.</div><div class="cbtns">' +
    (st ? '<button class="btn red" id="cvCont">Continuar · ' + esc(st.name) + ' · ⚡' + C.fmt(C.poder(st)) + '</button>' : '') +
    '<button class="btn" id="cvNew">' + (st ? 'Nueva partida' : '¡Jugar!') + '</button><button class="btn pap" id="cvImp">Importar partida</button>' +
    '<button class="btn blk" id="cvInst" hidden>Instalar app</button></div></div>' +
    '<div class="cfoot"><div class="mega">Revista de aventuras de Ánima</div><div class="adv">Para<b>7 a 25</b>años</div></div>';
}
function showCover(st) {
  mode = 'off'; var c = $('cover'); c.hidden = false; c.innerHTML = coverHTML(st); coverAnim = 1;
  if (st) $('cvCont').onclick = function () { au(); sfx('ui'); startGame(st, false); };
  $('cvNew').onclick = function () { au(); sfx('ui'); if (st && !confirm('Empezar una nueva partida borrará la actual en este dispositivo (puedes exportarla antes desde Ajustes). ¿Continuar?')) return; showCreate(); };
  $('cvImp').onclick = function () { au(); $('fileIn').click(); };
  var bi = $('cvInst'); if (installEv) bi.hidden = false; bi.onclick = function () { if (installEv) { installEv.prompt(); installEv = null; bi.hidden = true; } };
}
function drawCover() {
  var c = $('coverCv'); if (!c) { coverAnim = 0; return; } var g = c.getContext('2d'), L = CR ? lookOf(CR) : { skin: '#e0ac69', shirt: '#e0262f', pants: '#1b1b22', hair: '#1b1b22' }, el = CR ? C.EL[CR.el].c : '#39c8ff';
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
  g.save(); g.translate(c.width / 2, c.height / 2); g.rotate(time * .2); g.lineWidth = 3; g.strokeStyle = INK; star(g, 0, 0, 250, 150, 14, '#e0262f'); g.restore();
  g.save(); g.translate(c.width / 2, c.height / 2); g.rotate(-time * .3); star(g, 0, 0, 170, 120, 10, '#f0b429'); g.restore();
  g.save(); g.translate(c.width / 2, c.height - 60); g.scale(6.2, 6.2); drawAvatar(g, 0, 0, L, { dir: 0, atk: Math.sin(time * 2) > .3 ? 1 : 0, el: el, aura: el }); g.restore();
}
function lookOf(o) { return { skin: C.LOOK.skin[o.skin], shirt: C.LOOK.shirt[o.shirt], pants: o.shirt === 7 ? '#33333d' : '#1b1b22', hair: C.LOOK.hair[o.hair] }; }
function showCreate() {
  CR = CR || { name: '', origin: 'discipulo', el: 'fuego', skin: 1, shirt: 0, hair: 0 };
  var c = $('cover'), sw = function (k, arr) { return '<div class="sw">' + arr.map(function (col, i) { return '<button style="background:' + col + '" class="' + (CR[k] === i ? 'on' : '') + '" data-k="' + k + '" data-i="' + i + '" aria-label="color"></button>'; }).join('') + '</div>'; };
  var h = '<div class="cband"><div>Crea tu personaje</div><div>Pág. 2</div></div><div class="cbody" style="text-align:left;align-items:stretch;max-width:640px">';
  h += '<canvas id="coverCv" width="560" height="560" style="width:min(48vw,200px);height:min(48vw,200px);margin:0 auto"></canvas>';
  h += '<div class="spaced gold">Tu nombre</div><input class="inp" id="crName" maxlength="14" placeholder="Ej: Nova" value="' + esc(CR.name) + '" autocomplete="off">';
  h += '<div class="spaced gold" style="margin-top:14px">¿Dónde empieza tu historia?</div><div class="opts">' + Object.keys(C.ORIG).map(function (k) { var o = C.ORIG[k]; return '<button class="card' + (CR.origin === k ? ' on' : '') + '" data-o="' + k + '"><div class="nm">' + o.ic + ' ' + o.n + '</div><div class="ds">' + o.d + '</div><div class="ds gold">Empiezas en: ' + C.ZONES[o.z].n + '</div></button>'; }).join('') + '</div>';
  h += '<div class="spaced gold" style="margin-top:14px">Tu primer brazalete</div><div class="opts">' + C.ELK5.map(function (k) { var e = C.EL[k]; return '<button class="card' + (CR.el === k ? ' on' : '') + '" data-e="' + k + '"><div class="nm" style="color:' + e.c + '">' + e.ic + ' ' + e.n + '</div><div class="ds">' + e.sk + ': ' + e.d + afTxt(k) + '</div></button>'; }).join('') + '</div>';
  h += '<div class="spaced gold" style="margin-top:14px">Piel</div>' + sw('skin', C.LOOK.skin) + '<div class="spaced gold" style="margin-top:10px">Ropa</div>' + sw('shirt', C.LOOK.shirt) + '<div class="spaced gold" style="margin-top:10px">Cabello</div>' + sw('hair', C.LOOK.hair);
  h += '<div class="cbtns" style="margin:18px auto"><button class="btn red" id="crGo">¡Comenzar la historia!</button><button class="btn pap" id="crBack">Volver</button></div></div>';
  c.innerHTML = h; coverAnim = 1;
  $('crName').addEventListener('input', function () { CR.name = this.value; });
  c.onclick = function (e) {
    var b = e.target.closest('button'); if (!b) return; sfx('ui');
    if (b.dataset.o) CR.origin = b.dataset.o; else if (b.dataset.e) CR.el = b.dataset.e; else if (b.dataset.k) CR[b.dataset.k] = +b.dataset.i;
    else if (b.id === 'crGo') { var n = C.cleanName(CR.name); if (!n) { toast('Escribe un nombre (sin groserías)', 'bad'); return; } CR.name = n; c.onclick = null; var st = C.newState({ name: n, origin: CR.origin, el: CR.el, skin: CR.skin, shirt: CR.shirt, hair: CR.hair }); startGame(st, true); return; }
    else if (b.id === 'crBack') { c.onclick = null; boot2(); return; }
    else return;
    var sc = c.scrollTop; showCreate(); c.scrollTop = sc;
  };
}
function applyA11y() { document.body.classList.toggle('big', !!S.cfg.big); document.body.classList.toggle('calm', !!S.cfg.calm); }
function showPage(f, all) { openPanel('page', { f: f, all: all }); }
function startGame(st, isNew) {
  S = st; if (isNew && ((navigator.deviceMemory || 8) <= 3 || (navigator.hardwareConcurrency || 8) <= 4)) S.cfg.q = 0;
  au(); resize(); document.body.classList.toggle('low', !S.cfg.q); applyA11y(); $('cover').hidden = true; coverAnim = 0; MAPS = {}; P = null; MAP = null;
  var off = isNew ? null : C.offline(S, Date.now()); S.last = Date.now();
  var gift = C.dailyCheck(S, Date.now());
  $('hud').hidden = false; $('ctl').hidden = false;
  if (!matchMedia('(pointer:coarse)').matches) document.body.classList.add('nomob');
  loadZone(S.zone); save();
  if (S.pend) { var r = C.applyTour(S, S.pend.r); refreshCombat(); save(); toast('Abandonaste el torneo: puesto #' + r.rank + ' (−' + r.pct + '% de poder)', 'bad'); }
  if (off && off.oro > 1) toast('Mientras no estabas tu negocio ganó ' + C.fmt(off.oro) + ' de oro' + (off.capped ? ' (caja llena)' : ''), 'gold');
  if (gift) toast('¡Regalo diario! +5 ◆ · Nuevas misiones en el tablón', 'gold');
  if (isNew) setTimeout(function () { tip('mover', 'Muévete con el joystick (lado izquierdo de la pantalla) o con WASD.'); tip('flecha', 'Sigue la flecha amarilla y el «!» : te llevan a tu misión.'); }, 9000);
  if (isNew) dialog([['nar', 'En Ánima cada persona nace con un brazalete. No responde a lo que deseas: responde a lo que haces.'], ['nar', 'Cada temporada, el Anfitrión organiza el Torneo Mundial. Cien entran. Uno gana. Los demás pierden poder según su puesto.'], ['nar', 'Hoy empieza tu historia, ' + S.name + '. ' + C.ORIG[S.origin].d]], function () { storyCheck(); });
  else setTimeout(storyCheck, 600);
}
function boot2() { var raw = null; try { raw = localStorage.getItem(C.SAVE_KEY); } catch (e) { } var st = raw ? C.deserialize(raw) : null; showCover(st); }

/* ---------- bucle principal ---------- */
var TSCALE = 1, hudT = 0, scT = 0, saveT = 0, fpsE = 60, slowT = 0;
function governor(dt) { // baja la calidad sola si el equipo no alcanza ~40 fps sostenidos
  if (!S || !S.cfg.q || mode === 'off' || paused || dt <= 0) { slowT = 0; return; }
  fpsE += (1 / dt - fpsE) * .05; slowT = fpsE < 38 ? slowT + dt : 0;
  if (slowT > 6) { slowT = 0; fpsE = 60; ACTS.cfg('q'); toast('Calidad ajustada para tu dispositivo (puedes cambiarla en Ajustes)', 'gold'); }
}
function frame(ts) {
  requestAnimationFrame(frame);
  var dt = Math.min(.05, Math.max(0, (ts - lastTs) / 1000) || 0); lastTs = ts; time += dt;
  try {
    if (S && mode !== 'off') { C.tick(S, dt); saveT += dt; if (saveT > 10) { saveT = 0; save(); } }
    if (mode !== 'off' && mode !== 'pause' && !paused && P) { var g = dt; if (hitstop > 0) { hitstop -= dt; g = dt * .15; } for (var ts = 0; ts < TSCALE && mode !== 'pause' && !paused; ts++) update(g); scT += dt; if (scT > .5) { scT = 0; storyCheck(); } }
    if (MG.on) { mgUpdate(dt); mgDraw(); }
    if (mode !== 'off') render(); else if (coverAnim) drawCover();
    hudT += dt; if (hudT > .1 && S && mode !== 'off') { hudT = 0; hud(); if (PANEL && !$('ov').hidden) afford(); }
    if (mode !== 'off') musicTick();
    governor(dt);
  } catch (e) { errors.push(e.message + ' @ ' + String(e.stack || '').split('\n')[1]); if (errors.length > 60) errors.shift(); }
}
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEv = e; var b = $('cvInst'); if (b) b.hidden = false; });
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function () { });
window.__bdp = {
  C: C, errors: errors, get S() { return S; }, get mode() { return mode; }, get P() { return P; }, get MAP() { return MAP; }, get TR() { return TR; }, get paused() { return paused; },
  ents: function () { return ents; }, go: loadZone, tourStart: tourStart, mg: mgStart, mgAct: mgAct, mgEnd: mgEnd, panel: openPanel, close: closePanel, act: function (a, v) { ACTS[a](v); },
  loadDuelTest: function (pw) { TR = { buf: { atk: 1, hp: 1, au: 1 }, br: [] }; loadDuel({ type: 'duelo', eP: pw, name: 'Prueba', el: 'rayo', look: botLook(120) }); TR.cd = 0; TR.opp.frozen = 0; TR.duelTest = 1; },
  set ts(v) { TSCALE = Math.max(1, Math.min(8, v | 0)); }, chat: function (t) { quickChat(t); }, dlgNext: dlgNext, get dlg() { return !!DLG.q; }, interact: interact, storyCheck: storyCheck, start: startGame, inp: inp, keys: keys, save: save,
  draw: { avatar: drawAvatar, star: star, ctext: ctext, NPCL: NPCL },
  nightSkip: function () { if (mode === 'night') TR.t = C.TOUR.nightT - .1; }, killOpp: function () { if (mode === 'duel' && TR.opp) { TR.opp.hp = 0; TR.cd = 0; } }, hurtMe: function () { if (P) { P.iT = 0; hurtP(1e9); } }
};
resize(); boot2(); requestAnimationFrame(frame);
