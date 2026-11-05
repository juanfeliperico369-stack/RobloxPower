/* BRAZALETES DEL PODER · núcleo de reglas (sin DOM).
   Lo usan el juego (navegador) y tools/sim.js (Node). Todas las fórmulas viven aquí. */
(function (root) {
'use strict';
var VERSION = '0.5.0';
var SAVE_KEY = 'bdp.save.v1';

/* ---------- utilidades ---------- */
function mulberry(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(R) { var u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function pick(R, a) { return a[Math.floor(R() * a.length)]; }
function fmt(n) {
  n = Math.floor(n); if (n < 1e4) return String(n);
  var u = [[1e12, 'B'], [1e9, 'MM'], [1e6, 'M'], [1e3, 'K']];
  for (var i = 0; i < u.length; i++) if (n >= u[i][0]) return (n / u[i][0]).toFixed(n >= u[i][0] * 100 ? 0 : 1).replace('.0', '') + u[i][1];
  return String(n);
}
function today(t) { var d = new Date(t || Date.now()); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

/* ---------- datos del mundo ---------- */
var EL = {
  fuego:  { n: 'Fuego',  ic: '🔥', c: '#ff4d2e', sk: 'Puño Ígneo', d: 'Proyectil de fuego. Daño ×2.4', cd: 4,   cost: 30, x: 2.4 },
  agua:   { n: 'Agua',   ic: '💧', c: '#2fb8ff', sk: 'Marea Viva', d: 'Cura 30% y empuja a todos', cd: 9, cost: 40, x: 1.0 },
  rayo:   { n: 'Rayo',   ic: '⚡', c: '#ffd23a', sk: 'Destello',   d: 'Embestida que atraviesa. Daño ×1.8', cd: 3.5, cost: 25, x: 1.8 },
  tierra: { n: 'Tierra', ic: '⛰️', c: '#d08a3c', sk: 'Muralla',    d: 'Escudo −60% daño 4 s + temblor ×1.3', cd: 9, cost: 40, x: 1.3 },
  viento: { n: 'Viento', ic: '🌀', c: '#6dffd0', sk: 'Ciclón',     d: 'Torbellino en área ×1.6 que atrae', cd: 6, cost: 35, x: 1.6 },
  sombra: { n: 'Sombra', ic: '🌑', c: '#a42cff', sk: 'Eclipse',    d: 'Golpe ×2.2 que roba 50% como vida', cd: 6, cost: 35, x: 2.2, lock: 'act2' },
  luz:    { n: 'Luz',    ic: '✨', c: '#fff1a8', sk: 'Aurora',     d: 'Estallido ×2.2 en área y cura 15%', cd: 10, cost: 50, x: 2.2, lock: 'act3' }
};
var ELK5 = ['fuego', 'agua', 'rayo', 'tierra', 'viento'];
/* afinidades: cada uno es FUERTE (×1.25) contra el siguiente del ciclo y DÉBIL (×0.8) contra el anterior; Sombra y Luz se dañan ×1.25 entre sí */
var CYCLE = ['fuego', 'viento', 'tierra', 'rayo', 'agua'];
var FOE_EL = { eco: 'sombra', lobo: 'fuego', bandido: 'tierra', golem: 'tierra', sombra: 'sombra', vant: 'sombra', reyeco: 'sombra', alfa: 'fuego' };
function afin(a, d) {
  if (!a || !d || a === d) return 1;
  if ((a === 'sombra' && d === 'luz') || (a === 'luz' && d === 'sombra')) return 1.25;
  var ia = CYCLE.indexOf(a), id = CYCLE.indexOf(d); if (ia < 0 || id < 0) return 1;
  if ((ia + 1) % 5 === id) return 1.25;
  if ((id + 1) % 5 === ia) return 0.8;
  return 1;
}
function strongVs(el) { var i = CYCLE.indexOf(el); return i < 0 ? (el === 'sombra' ? 'luz' : el === 'luz' ? 'sombra' : '') : CYCLE[(i + 1) % 5]; }
function weakVs(el) { var i = CYCLE.indexOf(el); return i < 0 ? '' : CYCLE[(i + 4) % 5]; }
var TIERS = [{ n: 'Bronce', m: 1, c: '#c87f4a' }, { n: 'Plata', m: 1.4, c: '#d6dee9' }, { n: 'Oro', m: 2, c: '#ffc23a' }, { n: 'Mítico', m: 3, c: '#ff2fb3' }, { n: 'Origen', m: 4.5, c: '#ffffff' }];
var RANKS = [[0, 'Novato'], [60, 'Aprendiz'], [300, 'Luchador'], [1500, 'Guerrero'], [8000, 'Élite'], [40000, 'Maestro'], [200000, 'Campeón'], [1000000, 'Leyenda']];
var ORIG = {
  discipulo:     { n: 'Discípulo', ic: '🥋', z: 'dojo',    m: 'ren',    st: { fue: 6, tec: 5, esp: 4 }, oro: 20, d: 'Creciste en el Dojo de la Cumbre. Tu fuerza nace de la disciplina.' },
  mercader:      { n: 'Mercader',  ic: '⚒️', z: 'forja',   m: 'tobias', st: { fue: 4, tec: 5, esp: 6 }, oro: 60, d: 'Creciste entre yunques y monedas. Sabes que la magia también se trabaja.' },
  superviviente: { n: 'Superviviente', ic: '🗡️', z: 'tierras', m: 'kira', st: { fue: 6, tec: 6, esp: 3 }, oro: 10, d: 'Creciste en las Tierras Rotas. Nadie te regaló nada.' }
};
var NPC = {
  ren: { n: 'Maestra Ren', c: '#e0262f' }, tobias: { n: 'Don Tobías', c: '#f0b429' }, kira: { n: 'Kira', c: '#2dffb3' },
  pip: { n: 'Pip', c: '#39c8ff' }, heraldo: { n: 'El Heraldo', c: '#d6dee9' }, vant: { n: 'Vant, el Anfitrión', c: '#a42cff' },
  dax: { n: 'Dax', c: '#ff2fb3' }, nima: { n: 'Oráculo Nima', c: '#fff1a8' }, sol: { n: 'Capitana Sol', c: '#f0b429' }, nar: { n: 'Narración', c: '#f0b429' }
};
var ZONES = {
  plaza:   { n: 'Plaza Ágora',        k: 'Social · Paz' },
  dojo:    { n: 'Dojo de la Cumbre',  k: 'Entrenamiento' },
  forja:   { n: 'Ciudad Forja',       k: 'Tycoon · Paz' },
  tierras: { n: 'Tierras Rotas',      k: 'Farmeo · Peligro' },
  coliseo: { n: 'Coliseo del Eclipse', k: 'Torneo Mundial' }
};
/* hp/dm = multiplicadores sobre un luchador de poder eP; x = poder ganado; o = oro; ch = prob. de chispa */
var FOES = {
  eco:     { n: 'Eco',               hp: .35, dm: .45, sp: 70,  x: 1,  o: 2,  ch: .08, r: 13, rng: 34, wind: .5,  cd: 1.3 },
  lobo:    { n: 'Lobo de Ceniza',    hp: .6,  dm: .55, sp: 125, x: 1.8, o: 4, ch: .12, r: 15, rng: 36, wind: .4,  cd: 1.1 },
  bandido: { n: 'Bandido',           hp: 1,   dm: .75, sp: 95,  x: 3,  o: 9,  ch: .18, r: 14, rng: 40, wind: .45, cd: 1.2 },
  golem:   { n: 'Gólem de Obsidiana', hp: 7,  dm: 1.5, sp: 55,  x: 22, o: 80, ch: 1, chn: 6, r: 30, rng: 74, wind: .9, cd: 2.4, boss: 1, aoe: 1 },
  reyeco:  { n: 'Rey Eco',           hp: 5,  dm: 1.1, sp: 60,  x: 12, o: 40, ch: 1, chn: 3, r: 24, rng: 62, wind: .75, cd: 2, boss: 1, aoe: 1 },
  alfa:    { n: 'Alfa de Ceniza',    hp: 5.5, dm: 1.3, sp: 150, x: 16, o: 60, ch: 1, chn: 4, r: 22, rng: 230, wind: .6, cd: 1.8, boss: 1 },
  rival:   { n: 'Rival',             hp: 1.4, dm: .85, sp: 140, x: 5,  o: 15, ch: .3, r: 14, rng: 44, wind: .35, cd: .9, pvp: 1 },
  duelo:   { n: 'Duelista',          hp: 3,   dm: 1.3,  sp: 150, x: 0,  o: 0,  ch: 0, r: 14, rng: 46, wind: .3,  cd: .55, pvp: 1 },
  vant:    { n: 'Vant',              hp: 6,   dm: 1.1, sp: 150, x: 0,  o: 0,  ch: 0, r: 16, rng: 50, wind: .36, cd: .6, pvp: 1, boss: 1 },
  sombra:  { n: 'Sombra Cazadora',   hp: .5,  dm: 0,   sp: 85,  x: 0,  o: 0,  ch: 0, r: 14, rng: 26, wind: 0,   cd: 1 }
};
/* anillos de Tierras Rotas: poder del enemigo = max(min, P·f) */
var RINGS = [{ min: 15, f: .45, rec: 0 }, { min: 120, f: .8, rec: 100 }, { min: 450, f: 1.15, rec: 400 }];
var BLD = [
  { id: 'pan',   n: 'Puesto de Pan',   ic: '🥖', b: 0.5, c: 15 },
  { id: 'herr',  n: 'Herrería',        ic: '⚒️', b: 2,   c: 110 },
  { id: 'runa',  n: 'Taller de Runas', ic: '🔮', b: 8,   c: 700 },
  { id: 'merc',  n: 'Mercado',         ic: '🏪', b: 30,  c: 4200 },
  { id: 'banco', n: 'Banco Arcano',    ic: '🏦', b: 110, c: 26000 },
  { id: 'acad',  n: 'Academia',        ic: '🎓', b: 420, c: 160000 }
];
var BLDI = {}; BLD.forEach(function (d, i) { BLDI[d.id] = d; d.i = i; });
var ACT = { saco: { st: 'fue', k: 1, en: 0.8 }, kata: { st: 'tec', k: 4.5, en: 2 }, medita: { st: 'esp', k: 28, en: -12 } };
var GEAR = { fue: 'Saco de Arena Pesado', tec: 'Postes de Kata Rúnicos', esp: 'Cascada Serena' };
var SHOP = [
  { id: 'plata', n: 'Brazalete de Plata', g: 150, d: 'Poder ×1.4 permanente del elemento que elijas. Nunca se pierde en el torneo.' },
  { id: 'oro',   n: 'Brazalete de Oro',   g: 400, d: 'Poder ×2 permanente. Nunca se pierde en el torneo.' },
  { id: 'aura',  n: 'Aura de Tinta',      g: 40,  d: 'Cosmético: trazos de cómic al moverte.' },
  { id: 'capa',  n: 'Capa del Eclipse',   g: 60,  d: 'Cosmético: capa ondeante.' },
  { id: 'caja',  n: 'Caja fuerte +1 h',   g: 30,  d: 'Tu negocio guarda 1 hora más de ganancias mientras no juegas.' }
];
var TOUR = { req: 120, nightT: 75, cut: 32, firstCap: 25, legado: 0.25, duelHp: 3 };
var LOOK = {
  skin: ['#f5d0a9', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#a0e0ff'],
  shirt: ['#e0262f', '#f0b429', '#0f5c66', '#39c8ff', '#a42cff', '#2dffb3', '#f2e8d5', '#1b1b22'],
  hair: ['#1b1b22', '#5a3825', '#f0b429', '#e0262f', '#f2e8d5', '#a42cff']
};
var CHAT = ['¡Hola! 👋', '¿Vamos al torneo?', 'GG', '¿Me enseñas a forjar?', '¡Al Dojo!', 'Cuidado con los Ecos', 'Gracias 💛', '¡Qué combo!', '¿Amigos?', 'Tú puedes 💪'];
var BOTCHAT = {
  plaza: ['¿alguien al torneo?', 'hola :D', 'mi brazalete es de plata!!', 'Pip sabe todo xd', 'quién vende pan', 'gg ayer en el coliseo', 'busco amigos 👋'],
  dojo: ['respira... 🧘', '100 golpes más', 'la maestra Ren da miedo jaja', 'combo x20!!', 'mis katas mejoran'],
  forja: ['ya tengo banco 🏦', 'compren pan 🥖', 'el yunque da oro si lo golpeas', 'subí la herrería a 25'],
  tierras: ['cuidado lobos', 'ayuda en el anillo 2', 'el gólem me tumbó 😭', 'farmeando chispas', 'alguien pvp?'],
  coliseo: ['me da miedo la Noche', 'quedé puesto 12!', 'no mires a las sombras... o sí?', 'el Anfitrión es raro']
};
var REPLY = ['¡hola!', 'jaja sí', 'vamos!!', 'gracias :)', 'gg', 'de una', 'tú también 💪', 'amigos ✋'];

/* ---------- nombres de jugadores-bot ---------- */
var NA = ['Neo', 'Kai', 'Luna', 'Dragon', 'Sofi', 'Mati', 'Zero', 'Nova', 'Pixel', 'Rex', 'Mia', 'Leo', 'Vale', 'Juli', 'Thiago', 'Emi', 'Lucas', 'Sami', 'Ghost', 'Blaze', 'Storm', 'Frost', 'Ninja', 'Crystal', 'Moon', 'Star', 'Turbo', 'Mega', 'Cami', 'Nico', 'Isa', 'Bruno', 'Ari', 'Dani', 'Ozzy', 'Kira', 'Yuki', 'Toto', 'Pau', 'Gabo'];
var NB = ['', 'Pro', 'YT', '_x', 'XD', 'Gamer', '777', '_RBX', 'Kun', 'Chan', 'Master', '99', 'Crack', 'Real', 'Sama', '2014', '_Oficial', 'Dark', 'Kid', 'Max'];
function botName(R, used) {
  for (var k = 0; k < 20; k++) {
    var a = pick(R, NA), b = pick(R, NB), n = R() < .18 ? 'xX' + a + 'Xx' : a + b + (R() < .35 ? Math.floor(R() * 99) : '');
    if (!used[n]) { used[n] = 1; return n; }
  }
  var m = 'Jugador' + Math.floor(R() * 99999); used[m] = 1; return m;
}
var BAD = ['puta', 'mierda', 'idiota', 'estupid', 'fuck', 'shit', 'pendej', 'marica', 'culo', 'verga', 'nazi', 'sex'];
function cleanName(n) {
  n = String(n || '').replace(/[^A-Za-z0-9ÁÉÍÓÚÑÜáéíóúñü _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14);
  var l = n.toLowerCase(); for (var i = 0; i < BAD.length; i++) if (l.indexOf(BAD[i]) >= 0) return '';
  return n;
}

/* ---------- historia (3 actos) ---------- */
var M = '@m'; // marcador: el mentor según el origen
var STORY = [
  { id: 'p0', act: 1, t: 'Despertar', o: { k: 'talk', who: M }, r: { oro: 20 },
    d: {
      discipulo: [['ren', 'Llegas tarde, pero llegas. Eso ya dice algo de ti.'], ['ren', 'Ese brazalete en tu muñeca no es un adorno. Responde a lo que entrenas, no a lo que deseas.'], ['ren', 'Golpea el saco treinta veces. Con ritmo, no con rabia.']],
      mercader: [['tobias', '¡Por fin llegas! Aquí no importa de dónde vienes: importa lo que construyes.'], ['tobias', 'En Ánima el poder es magia. Y la magia bien usada se vuelve pan, herramientas y oro.'], ['tobias', 'Construye tu primer Puesto de Pan en la mesa del Tycoon. Un negocio pequeño alimenta sueños grandes.']],
      superviviente: [['kira', 'Shh. Agáchate. En las Tierras Rotas el ruido atrae Ecos.'], ['kira', 'Tu brazalete brilla poco. Eso cambia peleando… y sobreviviendo.'], ['kira', 'Derrota tres Ecos. Si te tumban, te levantas. Así se aprende aquí.']]
    } },
  { id: 'p1', act: 1, t: 'Primer paso', r: { oro: 40, gemas: 5 },
    o: { discipulo: { k: 'train', st: 'fue', n: 30 }, mercader: { k: 'build', n: 1 }, superviviente: { k: 'kill', type: 'eco', n: 3 } },
    h: { discipulo: 'Golpea el saco 30 veces (Dojo)', mercader: 'Compra 1 edificio en la mesa del Tycoon (Forja)', superviviente: 'Derrota 3 Ecos (Tierras Rotas)' } },
  { id: 'p2', act: 1, t: 'La Plaza Ágora', o: { k: 'talk', who: 'pip' }, r: { gemas: 5 }, h: 'Ve a la Plaza Ágora y habla con Pip',
    i: [['nar', 'Todos los caminos de Ánima se cruzan en la Plaza Ágora. Busca el portal.']],
    d: [['pip', '¡Hola! Soy Pip, guía de la Plaza. Bueno, no oficial… pero conozco todo.'], ['pip', 'Hay tres sendas para crecer: el Dojo entrena tu cuerpo, la Ciudad Forja convierte magia en oro, y en las Tierras Rotas… se pelea.'], ['pip', 'Al norte está el Coliseo del Eclipse. Todos sueñan con su torneo. Yo prefiero mirarlo de lejos.'], ['pip', 'Toma, mi amuleto de la suerte: en tu primer torneo no perderás más del 25% de tu poder. ¡No le digas a nadie!']] },
  { id: 'a1', act: 1, t: 'Tres sendas', o: { k: 'power', n: 60 }, r: { oro: 80 }, h: 'Alcanza 60 de Poder (rango Aprendiz)',
    i: [['pip', 'Entrena, pelea o invierte. Cualquier senda sirve. Lo importante es no rendirse.']] },
  { id: 'a2', act: 1, t: 'Respira', o: { k: 'train', st: 'esp', n: 3 }, r: { gemas: 5 }, h: 'Completa 3 respiraciones en la Cascada (Dojo)',
    i: [['ren', 'El poder sin calma se desborda. Ven a la cascada y respira conmigo.'], ['ren', 'Inhala cuatro segundos. Exhala cuatro. Esto también sirve fuera del juego.']] },
  { id: 'a3', act: 1, t: 'Oro con propósito', o: { k: 'oro', n: 300 }, r: { gemas: 5 }, h: 'Gana 300 de oro',
    i: [['tobias', 'Tu Espíritu hace que tus negocios produzcan más. Magia tangible, ¿ves? Gana 300 de oro.']] },
  { id: 'a4', act: 1, t: 'Ecos en el polvo', o: { k: 'kill', n: 10 }, r: { oro: 100, gemas: 5 }, h: 'Derrota 10 enemigos en las Tierras Rotas',
    i: [['kira', 'Los Ecos son restos de poder sin dueño. Limpia diez y vuelve con vida.']] },
  { id: 'a5', act: 1, t: 'La invitación', o: { k: 'talk', who: 'heraldo' }, r: { gemas: 10 }, h: 'Visita el Coliseo y habla con el Heraldo',
    d: [['heraldo', '¡Bienvenida, bienvenido, al Coliseo del Eclipse!'], ['vant', 'Cien entran. Uno gana. Todos aprenden lo que valen.'], ['vant', 'No temas perder. El poder que pierdas… encontrará un buen hogar.'], ['heraldo', 'Para inscribirte necesitas 120 de Poder. ¡Y valor!']] },
  { id: 'a6', act: 1, t: 'Listo para el Eclipse', o: { k: 'power', n: 120 }, r: { oro: 150 }, h: 'Alcanza 120 de Poder' },
  { id: 'a7', act: 1, t: 'El Torneo Mundial', o: { k: 'tourney', r: 100 }, r: { gemas: 15 }, h: 'Participa en el Torneo Mundial (Coliseo)',
    i: [['heraldo', 'Las inscripciones están abiertas. La primera prueba es la Noche: sobrevive a las sombras.']],
    e: [['vant', 'Interesante. Volverás. Todos vuelven.'], ['nar', 'FIN DEL ACTO I · LA CHISPA']] },
  { id: 'b1', act: 2, t: 'Un rival roto', o: { k: 'talk', who: 'dax' }, r: { gemas: 5 }, h: 'Busca a Dax en las Tierras Rotas',
    i: [['nar', 'ACTO II · LA SOMBRA DEL TORNEO'], ['kira', 'Hay alguien nuevo cerca del portal de las Tierras. Dicen que fue del Top 10.']],
    d: [['dax', '¿Qué miras? Hace un mes yo estaba en el Top 10.'], ['dax', 'Quedé en el puesto 97. Perdí casi todo. Dicen que el poder perdido se esfuma.'], ['dax', 'Mentira. Lo vi: un hilo de luz salió de mí y voló hacia el palco del Anfitrión.']] },
  { id: 'b2', act: 2, t: 'El gólem que no duerme', o: { k: 'kill', type: 'golem', n: 1 }, r: { chispas: 10, gemas: 10 }, h: 'Derrota al Gólem de Obsidiana (anillo 3)',
    i: [['kira', 'Si Dax tiene razón, el Gólem del fondo guarda restos de ese poder. Ve con cuidado: recomiendo 400 de Poder.']] },
  { id: 'b3', act: 2, t: 'Un fragmento', o: { k: 'talk', who: M }, r: { oro: 500 }, h: 'Lleva el fragmento a tu mentor',
    d: [[M, 'Esto es un fragmento del Brazalete del Origen. Hace siglos repartió el poder entre todos.'], [M, 'Si alguien juntara los fragmentos con el poder de cien derrotas en cada torneo…'], [M, 'Entrena. Pero no para ser cruel. Entrena para que nadie tenga que perderlo todo.']] },
  { id: 'b4', act: 2, t: 'Forja tu voluntad', o: { k: 'forge', t: 1 }, r: { gemas: 10 }, h: 'Consigue un brazalete de Plata o mejor (Forja)',
    i: [['tobias', 'Un brazalete de Plata multiplica tu poder y nunca se pierde. Forjarlo cuesta oro y chispas.']] },
  { id: 'b5', act: 2, t: 'Guerrero', o: { k: 'power', n: 1500 }, r: { oro: 2000 }, h: 'Alcanza 1.500 de Poder (rango Guerrero)' },
  { id: 'b6', act: 2, t: 'Sobrevivir a la Noche', o: { k: 'tourney', r: 32 }, r: { gemas: 20 }, u: 'act2', h: 'Queda entre los 32 mejores del torneo',
    e: [['vant', 'Sobreviviste a mis sombras. ¿Sabes de dónde salen? De ustedes.'], ['nar', 'Desbloqueado: elemento SOMBRA en la Forja.'], ['nar', 'FIN DEL ACTO II']] },
  { id: 'c1', act: 3, t: 'La oráculo', o: { k: 'talk', who: 'nima' }, r: { gemas: 10 }, h: 'Habla con el Oráculo Nima (Plaza)',
    i: [['nar', 'ACTO III · EL BRAZALETE DEL ORIGEN']],
    d: [['nima', 'Te contaré de Vant. Nació sin brazalete, en un mundo donde el poder lo era todo.'], ['nima', 'Se rieron de él. Juró que nunca más sería “el que no vale nada”.'], ['nima', 'Creó el torneo. Hoy vale más que nadie… y sigue sintiéndose vacío.'], ['nima', 'El poder no define tu valor. Él nunca lo aprendió. ¿Lo aprenderás tú?']] },
  { id: 'c2', act: 3, t: 'Una mano', o: { k: 'give', who: 'dax', oro: 500 }, r: { gemas: 15 }, h: 'Ayuda a Dax con 500 de oro (Tierras Rotas)',
    d: [['dax', '¿Por qué me ayudas? Nadie ayuda en Ánima…'], ['dax', 'Gracias. Voy a reconstruir mi taller. Esta vez para enseñar, no para presumir.']] },
  { id: 'c3', act: 3, t: 'Élite', o: { k: 'power', n: 8000 }, r: { oro: 20000 }, h: 'Alcanza 8.000 de Poder (rango Élite)' },
  { id: 'c4', act: 3, t: 'Los diez mejores', o: { k: 'tourney', r: 10 }, r: { gemas: 25 }, u: 'act3', h: 'Queda en el Top 10 del torneo',
    e: [['nar', 'Desbloqueado: elemento LUZ en la Forja.'], ['vant', 'Diez. Ya casi. Cuando ganes, subirás a mi palco. Solo.']] },
  { id: 'c5', act: 3, t: 'El campeón del Eclipse', o: { k: 'boss', who: 'vant' }, r: { gemas: 50 }, h: 'Gana el torneo y vence a Vant',
    e: [['vant', '¿Cómo…? Tenía el poder de miles…'], ['vant', 'Tómalo. Toma el Brazalete del Origen. Ahora tú decides quién vale.']] },
  { id: 'c6', act: 3, t: 'La decisión', o: { k: 'choice' }, r: { gemas: 30 }, h: 'Decide qué hacer con el Brazalete del Origen' },
  { id: 'ep', act: 4, t: 'Epílogo: Ánima libre', o: { k: 'none' }, r: {}, h: 'Juego libre: sigue mejorando, el torneo continúa' }
];
var STI = {}; STORY.forEach(function (s, i) { STI[s.id] = i; });

/* ---------- estado ---------- */
function makeBots(seed) {
  var R = mulberry((seed ^ 0xabc123) >>> 0), a = [], used = {};
  for (var i = 0; i < 99; i++) a.push({ n: botName(R, used), p: Math.round(30 * Math.exp(R() * R() * 10)), el: pick(R, ELK5), h: Math.floor(R() * 360) });
  return a;
}
function newState(o) {
  o = o || {};
  var orig = ORIG[o.origin] ? o.origin : 'discipulo', O = ORIG[orig], now = o.now || Date.now();
  var seed = (o.seed >>> 0) || ((now ^ 0x5bd1e995) >>> 0) || 7;
  var el = EL[o.el] && !EL[o.el].lock ? o.el : 'fuego';
  var s = {
    v: 1, ver: VERSION, seed: seed, created: now, last: now,
    name: cleanName(o.name) || 'Heroe', origin: orig,
    look: { skin: clamp(o.skin | 0, 0, LOOK.skin.length - 1), shirt: clamp(o.shirt | 0, 0, LOOK.shirt.length - 1), hair: clamp(o.hair | 0, 0, LOOK.hair.length - 1) },
    stats: { fue: O.st.fue, tec: O.st.tec, esp: O.st.esp }, legado: 0, en: 100, hp: -1,
    oro: O.oro, gemas: 10, chispas: 0,
    brz: [{ id: 1, el: el, t: 0 }], eq: 1, nid: 2,
    gear: { fue: 0, tec: 0, esp: 0 }, elix: 0, tyc: {}, caja: 0, cos: { aura: 0, capa: 0 }, friends: [], party: [], side: {}, tips: {}, compras: {}, frag: {}, clan: { id: '', since: 0, week: 0, pts: 0, last: {} }, evt: '', ach: {},
    zone: O.z, story: { i: 0, n: 0, seen: '' }, unlock: {}, ending: '',
    daily: { day: '', q: [] },
    cnt: { taps: 0, kills: 0, deaths: 0, oroTot: 0, play: 0, tours: 0, wins: 0, best: 0 },
    tours: [], title: '', pend: null,
    bots: makeBots(seed),
    cfg: { snd: 1, mus: 1, q: 1, vib: 1, big: 0, calm: 0 }
  };
  BLD.forEach(function (d) { s.tyc[d.id] = 0; });
  return s;
}
function isNum(v) { return typeof v === 'number' && isFinite(v); }
/* Repara/migra un objeto cargado (de localStorage o de un archivo exportado). Devuelve estado válido o null. */
function migrate(o) {
  if (!o || typeof o !== 'object' || !o.stats || !o.name) return null;
  var d = newState({ origin: o.origin, name: o.name, seed: o.seed, el: (o.brz && o.brz[0] && o.brz[0].el) || 'fuego', now: o.created });
  (function merge(t, f) {
    for (var k in t) {
      if (!(k in f)) continue;
      var tv = t[k], fv = f[k];
      if (Array.isArray(tv)) { if (Array.isArray(fv)) t[k] = fv; }
      else if (tv && typeof tv === 'object') { if (fv && typeof fv === 'object' && !Array.isArray(fv)) { if (Object.keys(tv).length === 0) t[k] = fv; else merge(tv, fv); } } /* mapas vacíos por defecto (side, tips, unlock): se copian enteros */
      else if (typeof tv === 'number') { if (isNum(fv)) t[k] = fv; }
      else if (typeof tv === typeof fv) t[k] = fv;
      else if (tv === null && fv && typeof fv === 'object') t[k] = fv;
    }
  })(d, o);
  ['tyc', 'cos'].forEach(function (k) { for (var q in d[k]) if (!isNum(d[k][q]) || d[k][q] < 0) d[k][q] = 0; });
  d.brz = (d.brz || []).filter(function (b) { return b && EL[b.el] && isNum(b.t) && isNum(b.id); }).map(function (b) { return { id: b.id | 0, el: b.el, t: clamp(b.t | 0, 0, 4) }; });
  if (!d.brz.length) d.brz = [{ id: 1, el: 'fuego', t: 0 }];
  if (!d.brz.some(function (b) { return b.id === d.eq; })) d.eq = d.brz[0].id;
  d.nid = Math.max(d.nid, d.brz.reduce(function (m, b) { return Math.max(m, b.id); }, 0) + 1);
  if (!Array.isArray(d.bots) || d.bots.length !== 99) d.bots = makeBots(d.seed);
  d.friends = d.friends.filter(function (f) { return f && isNum(f.bi) && f.bi >= 0 && f.bi < 99; }).slice(0, 12);
  d.party = d.party.filter(function (bi) { return d.friends.some(function (f) { return f.bi === bi; }); }).slice(0, 2);
  for (var sid in d.side) if (!SIDEI[sid] || !d.side[sid] || !isNum(d.side[sid].n)) delete d.side[sid];
  for (var fid in d.frag) if (!FRAGI[fid]) delete d.frag[fid];
  if (d.clan.id && !CLANI[d.clan.id]) d.clan.id = '';
  if (d.evt && !EVENTI[d.evt]) d.evt = '';
  for (var aid in d.ach) if (!ACHI[aid]) delete d.ach[aid];
  d.story.i = clamp(d.story.i | 0, 0, STORY.length - 1);
  if (!ZONES[d.zone]) d.zone = 'plaza';
  d.name = cleanName(d.name) || 'Heroe'; d.v = 1; d.ver = VERSION;
  return d;
}
function validate(s) {
  var e = [];
  (function walk(o, p) {
    for (var k in o) {
      var v = o[k];
      if (typeof v === 'number' && (!isFinite(v))) e.push('NaN/Inf en ' + p + k);
      else if (v && typeof v === 'object') walk(v, p + k + '.');
    }
  })(s, '');
  ['oro', 'gemas', 'chispas', 'legado', 'en'].forEach(function (k) { if (s[k] < -1e-6) e.push('negativo ' + k); });
  ['fue', 'tec', 'esp'].forEach(function (k) { if (s.stats[k] < 0) e.push('stat negativa ' + k); });
  if (!s.brz.some(function (b) { return b.id === s.eq; })) e.push('brazalete equipado inexistente');
  if (s.story.i < 0 || s.story.i >= STORY.length) e.push('historia fuera de rango');
  s.party.forEach(function (bi) { if (!s.friends.some(function (f) { return f.bi === bi; })) e.push('grupo con no-amigo ' + bi); });
  for (var id in s.side) if (!SIDEI[id]) e.push('misión secundaria desconocida ' + id);
  return e;
}
function serialize(s) { return JSON.stringify(s); }
function deserialize(txt) { try { return migrate(JSON.parse(txt)); } catch (e) { return null; } }

/* ---------- poder y combate ---------- */
function base(s) { var t = s.stats; return t.fue + t.tec + t.esp; }
function eqB(s) { for (var i = 0; i < s.brz.length; i++) if (s.brz[i].id === s.eq) return s.brz[i]; return s.brz[0]; }
function mBr(s) { return TIERS[eqB(s).t].m; }
function mLeg(s) { return 1 + 0.25 * Math.log10(1 + s.legado / 50); }
function poder(s) { return Math.floor(base(s) * mBr(s) * mLeg(s)); }
function rankOf(p) { var r = 0; for (var i = 0; i < RANKS.length; i++) if (p >= RANKS[i][0]) r = i; return r; }
function enMax(s) { return Math.min(200, 100 + Math.floor(s.stats.esp / 10)); }
function fighter(st, m, el) {
  var sq = Math.sqrt(m);
  return {
    maxHp: Math.round((100 + st.fue * 0.9 + st.esp * 0.6 + st.tec * 0.3) * sq * (el === 'luz' ? 1.1 : 1)),
    atk: (6 + st.fue * 0.22 + st.tec * 0.08) * m * (el === 'fuego' ? 1.08 : 1),
    crit: clamp(0.05 + st.tec * 0.0015 + (el === 'rayo' ? 0.05 : 0), 0.05, 0.5),
    cd: clamp(0.5 - st.tec * 0.0006, 0.24, 0.5),
    aura: 6 + st.esp * 0.04 + (el === 'agua' ? 2 : 0),
    skm: 1 + st.esp * 0.003,
    spd: 150 + Math.min(60, st.tec * 0.05) + (el === 'viento' ? 22 : 0),
    def: el === 'tierra' ? 0.12 : 0, steal: el === 'sombra' ? 0.05 : 0, regen: el === 'agua' ? 0.025 : 0.012
  };
}
function combat(s) { return fighter(s.stats, mBr(s) * mLeg(s), eqB(s).el); }
function statsOfPower(p) { var b = Math.max(1, p) / 3; return { fue: b, tec: b, esp: b }; }
function foeStats(type, eP, el) {
  var F = FOES[type], f = fighter(statsOfPower(eP), 1, el || 'fuego');
  return { hp: Math.max(10, Math.round(f.maxHp * F.hp)), dmg: f.atk * F.dm, crit: f.crit, sp: F.sp, eP: eP, aura: f.aura, skm: f.skm };
}
function ringPower(s, ring) { var r = RINGS[clamp(ring, 0, 2)]; return Math.max(r.min, poder(s) * r.f); }

/* ---------- oro, entrenamiento, eventos ---------- */
function addOro(s, n) { if (!(n > 0)) return; s.oro += n; s.cnt.oroTot += n; ev(s, 'oro', { n: n }); }
function gearMul(lv) { return 1 + 0.15 * lv; }
function gearCost(lv) { return Math.ceil(80 * Math.pow(1.75, lv)); }
function trainGain(s, act, q) { var A = ACT[act]; return 0.05 * (1 + Math.sqrt(base(s)) / 8) * gearMul(s.gear[A.st]) * mLeg(s) * A.k * q * clanMul(s, A.st) * evMul(s, 'train'); }
function train(s, act, q) {
  var A = ACT[act]; if (!A) return 0;
  if (A.en > 0 && s.en < A.en) return -1;
  s.en = clamp(s.en - A.en, 0, enMax(s));
  if (!(q > 0)) return 0;
  var g = trainGain(s, act, q); s.stats[A.st] += g; s.cnt.taps++;
  ev(s, 'train', { st: A.st, n: 1 });
  return g;
}
function buyGear(s, st) { var lv = s.gear[st], c = gearCost(lv); if (lv >= 20 || s.oro < c) return false; s.oro -= c; s.gear[st] = lv + 1; return true; }
function elixCost(k) { return Math.ceil(50 * Math.pow(1.13, k)); }
function elixGain(s) { return 1.5 + base(s) * 0.01; }
function buyElix(s, st) { var c = elixCost(s.elix); if (s.oro < c || !(st in s.stats)) return 0; s.oro -= c; s.elix++; var g = elixGain(s); s.stats[st] += g; return g; }
function foodCost(s) { return Math.ceil(8 + prod(s) * 3); }
function eat(s) { var c = foodCost(s); if (s.oro < c || s.tyc.pan < 1) return false; s.oro -= c; s.en = Math.min(enMax(s), s.en + 40); return true; }

function killReward(s, type, eP, R) {
  var F = FOES[type]; if (!F || !F.x) return null; R = R || Math.random;
  var g = F.x * (1 + Math.sqrt(eP) / 4) * 0.5 * mLeg(s) * evMul(s, 'kill');
  s.stats.fue += g * .45; s.stats.tec += g * .3; s.stats.esp += g * .25;
  var o = Math.round(F.o * (1 + Math.sqrt(eP) / 3)); addOro(s, o);
  var ch = R() < F.ch ? (F.chn || 1) * evMul(s, 'ch') : 0; s.chispas += ch;
  var gem = F.pvp && R() < 0.05 ? 1 : 0; s.gemas += gem;
  s.cnt.kills++; ev(s, 'kill', { type: type });
  return { g: g, o: o, ch: ch, gem: gem };
}

/* tycoon */
function bCost(id, n) { return Math.ceil(BLDI[id].c * Math.pow(1.15, n)); }
function bMile(n) { return n >= 100 ? 8 : n >= 50 ? 4 : n >= 25 ? 2 : 1; }
function magia(s) { return 1 + Math.sqrt(s.stats.esp) / 20; }
function bProd(s, id) { var n = s.tyc[id] || 0; return BLDI[id].b * n * bMile(n) * magia(s) * (s.clan.id === 'marea' ? 1.05 : 1) * evMul(s, 'oro'); }
function prod(s) { var t = 0; for (var i = 0; i < BLD.length; i++) t += bProd(s, BLD[i].id); return t; }
function bUnlocked(s, id) { var i = BLDI[id].i; return i === 0 || s.tyc[BLD[i - 1].id] > 0; }
function buyB(s, id) { if (!BLDI[id] || !bUnlocked(s, id)) return false; var n = s.tyc[id], c = bCost(id, n); if (s.oro < c) return false; s.oro -= c; s.tyc[id] = n + 1; ev(s, 'build', { n: 1 }); return true; }
function tapOro(s) { var o = 1 + prod(s) * 0.03 + Math.sqrt(s.stats.fue) * 0.2; addOro(s, o); return o; }
function cajaH(s) { return 2 + s.caja; }
function cajaCost(lv) { return Math.ceil(400 * Math.pow(3, lv)); }
function buyCaja(s) { var c = cajaCost(s.caja); if (s.caja >= 8 || s.oro < c) return false; s.oro -= c; s.caja++; return true; }

/* ---------- brazaletes ---------- */
var FORGE = [null, { o: 2500, ch: 20 }, { o: 25000, ch: 80 }, { o: 250000, ch: 300 }];
var NEWB = { o: 800, ch: 10 };
function elLocked(s, el) { var L = EL[el] && EL[el].lock; return !!(L && !s.unlock[L]); }
function brzOf(s, el) { for (var i = 0; i < s.brz.length; i++) if (s.brz[i].el === el) return s.brz[i]; return null; }
function forgeNew(s, el) {
  if (!EL[el]) return 'x'; if (elLocked(s, el)) return 'bloqueado'; if (brzOf(s, el)) return 'tienes';
  if (s.oro < NEWB.o || s.chispas < NEWB.ch) return 'falta';
  s.oro -= NEWB.o; s.chispas -= NEWB.ch; s.brz.push({ id: s.nid++, el: el, t: 0 }); return 'ok';
}
function forgeUp(s, id) {
  var b = null; s.brz.forEach(function (x) { if (x.id === id) b = x; }); if (!b) return 'x';
  if (b.t >= 3) return 'max'; var c = FORGE[b.t + 1];
  if (s.oro < c.o || s.chispas < c.ch) return 'falta';
  s.oro -= c.o; s.chispas -= c.ch; b.t++; ev(s, 'forge', { t: b.t }); return 'ok';
}
function equip(s, id) { if (s.brz.some(function (b) { return b.id === id; })) { s.eq = id; ev(s, 'forge', { t: eqB(s).t }); return true; } return false; }
function shopBuy(s, id, el) {
  var it = null; SHOP.forEach(function (x) { if (x.id === id) it = x; }); if (!it) return 'x';
  if (s.gemas < it.g) return 'falta';
  if (id === 'plata' || id === 'oro') {
    var t = id === 'plata' ? 1 : 2; if (!EL[el] || elLocked(s, el)) return 'bloqueado';
    var b = brzOf(s, el); if (b && b.t >= t) return 'tienes';
    s.gemas -= it.g; if (b) b.t = t; else s.brz.push({ id: s.nid++, el: el, t: t });
    ev(s, 'forge', { t: t }); return 'ok';
  }
  if (id === 'caja') { if (s.caja >= 8) return 'max'; s.gemas -= it.g; s.caja++; return 'ok'; }
  if (s.cos[id]) return 'tienes'; s.gemas -= it.g; s.cos[id] = 1; return 'ok';
}

/* ---------- jugadores-bot del mundo (ranking) ---------- */
function botsTick(s, dt) {
  for (var i = 0; i < s.bots.length; i++) { var b = s.bots[i]; b.p += (b.p * 0.00025 / (1 + b.p / 1e6) + 0.002) * dt; }
}
function board(s) {
  var a = s.bots.map(function (b) { return { n: b.n, p: Math.floor(b.p), el: b.el, me: 0 }; });
  a.push({ n: s.name, p: poder(s), el: eqB(s).el, me: 1 });
  a.sort(function (x, y) { return y.p - x.p; });
  return a;
}

/* ---------- torneo mundial ---------- */
function lossPct(r) { return r <= 1 ? 0 : Math.min(100, r); }
function makeField(s, R) {
  var P = Math.max(poder(s), TOUR.req), f = [], used = {}; used[s.name] = 1;
  for (var i = 0; i < 99; i++) f.push({ n: botName(R, used), p: clamp(P * Math.exp(gauss(R) * 0.42), P * 0.35, P * 3), el: pick(R, ELK5), h: Math.floor(R() * 360) });
  return f;
}
function nightOrder(f, P, R) {
  return f.map(function (b, i) { return { i: i, sc: Math.log(b.p / P) * 0.9 + gauss(R) * 0.7 }; }).sort(function (a, b) { return a.sc - b.sc; }).map(function (o) { return o.i; });
}
function aliveAt(t) { return 99 - Math.round((99 - (TOUR.cut - 1)) * Math.pow(clamp(t / TOUR.nightT, 0, 1), 1.15)); }
function duelP(a, b) { var x = Math.pow(a, 1.6), y = Math.pow(b, 1.6); return x / (x + y); }
function rankLoss(round, frac) { var R = [[17, 32], [9, 16], [5, 8], [3, 4], [2, 2]][clamp(round, 0, 4)]; return R[1] - Math.floor(clamp(frac, 0, 0.999) * (R[1] - R[0] + 1)); }
function setPend(s, rk) { s.pend = { r: clamp(Math.round(rk), 1, 100), t: Date.now() }; }
function applyTour(s, rk) {
  rk = clamp(Math.round(rk), 1, 100);
  var pct = lossPct(rk), first = s.cnt.tours === 0, capped = false;
  if (first && pct > TOUR.firstCap) { pct = TOUR.firstCap; capped = true; }
  var b0 = base(s), p0 = poder(s), k = 1 - pct / 100;
  s.stats.fue *= k; s.stats.tec *= k; s.stats.esp *= k;
  var lost = b0 - base(s), lg = lost * TOUR.legado; s.legado += lg;
  var oro = Math.round(150 + 3000 * Math.pow((101 - rk) / 100, 2) * (1 + Math.sqrt(p0) / 20));
  var gem = rk === 1 ? 50 : rk <= 3 ? 25 : rk <= 10 ? 10 : rk <= 32 ? 3 : 1;
  addOro(s, oro); s.gemas += gem;
  s.cnt.tours++; if (rk === 1) s.cnt.wins++; s.cnt.best = s.cnt.best ? Math.min(s.cnt.best, rk) : rk;
  if (rk === 1 && !s.title) s.title = 'Campeón del Eclipse';
  s.tours.unshift({ d: Date.now(), r: rk, pct: pct, lost: Math.round(lost), p0: p0 }); if (s.tours.length > 20) s.tours.length = 20;
  s.pend = null;
  ev(s, 'tourney', { rank: rk });
  return { rank: rk, pct: pct, capped: capped, lost: lost, lg: lg, oro: oro, gem: gem, p0: p0, p1: poder(s), first: first };
}

/* ---------- historia y misiones ---------- */
function mentor(s) { return ORIG[s.origin].m; }
function stepObj(s, st) { st = st || STORY[s.story.i]; var o = st.o; return o.k ? o : o[s.origin]; }
function who(s, w) { return w === M ? mentor(s) : w; }
function stepHint(s) { var st = STORY[s.story.i], h = st.h; if (h && typeof h === 'object') h = h[s.origin]; if (!h && st.o.k === 'talk') h = 'Habla con ' + NPC[who(s, st.o.who)].n; return h || st.t; }
function stepDialog(s, key) {
  var st = STORY[s.story.i], d = st[key || 'd']; if (!d) return null;
  if (!Array.isArray(d)) d = d[s.origin];
  return d.map(function (l) { return [who(s, l[0]), l[1]]; });
}
function match(o, type, d) {
  if (!o || o.k !== type) return false;
  if (type === 'train') return o.st === d.st;
  if (type === 'kill') return !o.type || o.type === d.type;
  if (type === 'tourney') return d.rank <= o.r;
  if (type === 'forge') return d.t >= o.t;
  if (type === 'talk' || type === 'give' || type === 'boss') return false; // se resuelve en ev() (depende del mentor)
  if (type === 'visit') return o.z === d.z;
  if (type === 'perf') return o.st === d.st;
  if (type === 'find') return o.id === d.id;
  return true;
}
function ev(s, type, d) {
  d = d || {};
  var st = STORY[s.story.i];
  if (st) {
    var o = stepObj(s, st);
    var ok = (type === 'talk' || type === 'give' || type === 'boss') ? !!(o && o.k === type && who(s, o.who) === d.who) : match(o, type, d);
    if (ok) s.story.n += type === 'oro' ? d.n : (type === 'tourney' || type === 'forge' ? 1 : (d.n || 1));
  }
  var q = s.daily.q;
  for (var i = 0; i < q.length; i++) if (!q[i].done && match(q[i], type, d)) q[i].p += type === 'oro' ? d.n : (d.n || 1);
  for (var id in s.side) { var sq = s.side[id], so = SIDEI[id]; if (sq.s === 1 && so && match(so.o, type, d)) sq.n += type === 'tourney' ? 1 : (d.n || 1); }
  if (s.clan.id) { var cp = type === 'tourney' ? Math.max(1, (101 - d.rank) / 5) : (CLANPTS[type] || 0) * (d.n || 1); s.clan.pts += cp * evMul(s, 'clan'); }
}
function stepNeed(s) { var o = stepObj(s); if (!o) return 1; return o.k === 'oro' || o.k === 'train' || o.k === 'kill' || o.k === 'build' ? o.n : 1; }
function stepProg(s) {
  var o = stepObj(s); if (!o) return [0, 1];
  if (o.k === 'power') return [Math.min(poder(s), o.n), o.n];
  if (o.k === 'none') return [0, 1];
  return [Math.min(s.story.n, stepNeed(s)), stepNeed(s)];
}
function stepDone(s) {
  var st = STORY[s.story.i], o = stepObj(s); if (!o || o.k === 'none' || o.k === 'choice') return false;
  if (o.k === 'power') return poder(s) >= o.n;
  if (o.k === 'forge' && s.brz.some(function (b) { return b.t >= o.t; })) return true;
  return s.story.n >= stepNeed(s);
}
function giveReward(s, r) { if (!r) return; if (r.oro) addOro(s, r.oro); if (r.gemas) s.gemas += r.gemas; if (r.chispas) s.chispas += r.chispas; }
function advance(s) {
  var st = STORY[s.story.i]; giveReward(s, st.r); if (st.u) s.unlock[st.u] = 1;
  if (s.story.i < STORY.length - 1) s.story.i++;
  s.story.n = 0; return STORY[s.story.i];
}
function choose(s, c) {
  if (STORY[s.story.i].id !== 'c6') return false;
  s.ending = c === 'compartir' ? 'compartir' : 'corona';
  if (s.ending === 'compartir') { s.legado += base(s) * 0.5; s.title = 'Corazón de Ánima'; s.bots.forEach(function (b) { b.p *= 1.15; }); }
  else { var b = eqB(s); s.brz.push({ id: s.nid++, el: b.el, t: 4 }); s.title = 'Nuevo Anfitrión'; }
  s.story.n = 1; advance(s); return true;
}
/* ---------- misiones secundarias (pequeñas historias de los NPC) ---------- */
var SIDE = [
  { id: 'gato', who: 'pip', t: 'El gato de Pip', req: 'a1', o: { k: 'find', id: 'gato', n: 1 }, r: { gemas: 10 }, h: 'Busca a Bigotes en la Plaza (escucha los maullidos)',
    d: [['pip', '¿Has visto a Bigotes? Es mi gato. Se escapó cuando sonaron las trompetas del Coliseo…'], ['pip', 'Le dan miedo los ruidos fuertes. Igual que a mí, la verdad.']],
    e: [['pip', '¡BIGOTES! Gracias, gracias…'], ['pip', '¿Sabes? A veces pienso que sin poder no sirvo para nada.'], ['pip', 'Pero tú volviste con él. Eso no lo hace un brazalete. Lo hace una buena persona.']] },
  { id: 'disciplina', who: 'ren', t: 'Disciplina', req: 'a2', o: { k: 'perf', st: 'tec', n: 10 }, r: { oro: 300, gemas: 5 }, h: 'Logra 10 katas PERFECTAS (Dojo)',
    d: [['ren', 'La fuerza se gana en un día. La técnica, en mil. Haz diez katas perfectas.'], ['ren', 'Si fallas, respira y vuelve a empezar. Nadie te apura.']],
    e: [['ren', 'Bien. ¿Notas que la paciencia también es un poder?']] },
  { id: 'pedido', who: 'tobias', t: 'Pedido urgente', req: 'a3', o: { k: 'anvil', n: 40 }, r: { oro: 500, gemas: 5 }, h: 'Golpea el yunque 40 veces (Forja)',
    d: [['tobias', '¡Un pedido de herraduras para la Plaza y mi ayudante se fue al torneo!'], ['tobias', 'Cuarenta martillazos. Trabajo honesto, paga honesta.']],
    e: [['tobias', '¡Perfecto! El oro que se gana trabajando pesa distinto en el bolsillo.']] },
  { id: 'patrulla', who: 'kira', t: 'Patrulla del anillo 2', req: 'a4', o: { k: 'kill', type: 'lobo', n: 8 }, r: { chispas: 8, gemas: 5 }, h: 'Derrota 8 Lobos de Ceniza (Tierras Rotas)',
    d: [['kira', 'Los lobos se están acercando a la Plaza. Si llegan, los niños no podrán jugar afuera.'], ['kira', 'Ocho lobos. Ve con amigos si puedes: en grupo es más fácil.']],
    e: [['kira', 'Buen trabajo. Proteger a otros: para eso sirve la fuerza.']] },
  { id: 'leyendas', who: 'heraldo', t: 'Leyendas del Coliseo', req: 'b1', o: { k: 'tourney', r: 50, n: 1 }, r: { gemas: 10 }, h: 'Queda en el Top 50 de un torneo',
    d: [['heraldo', 'Psst… ¿Sabías que ningún campeón antiguo volvió a pelear? Ni uno.'], ['heraldo', 'Dicen que suben al palco del Anfitrión… y bajan distintos. Queda entre los 50 mejores y te cuento más.']],
    e: [['heraldo', 'Te lo cuento: bajan sin brillo en los ojos. Como si les faltara algo.'], ['heraldo', 'Yo solo anuncio los combates. Pero no me gusta lo que veo.']] },
  { id: 'herramientas', who: 'dax', t: 'Herramientas para Dax', req: 'c3', o: { k: 'giveCh', n: 15 }, r: { gemas: 15 }, h: 'Lleva 15 chispas a Dax (Tierras Rotas)',
    d: [['dax', 'El taller ya tiene techo. Me faltan chispas para la fragua de los aprendices.'], ['dax', 'Quince chispas. Sé que cuestan… por eso te lo pido con respeto.']],
    e: [['dax', 'Mira: tres chicos aprendiendo a forjar. Hace un mes yo solo pensaba en mí.']] },
  { id: 'espejo', who: 'nima', t: 'El espejo del agua', req: 'c1', o: { k: 'perf', st: 'esp', n: 5 }, r: { gemas: 15 }, title: 'Alma Serena', h: 'Logra 5 respiraciones PERFECTAS (Dojo)',
    d: [['nima', 'Mira tu reflejo en la cascada del Dojo. ¿Qué ves? ¿Un número? ¿O a alguien?'], ['nima', 'Respira cinco veces, perfecto. Luego vuelve.']],
    e: [['nima', 'El agua no refleja tu poder. Refleja tu calma.'], ['nima', 'Te doy un nombre: Alma Serena. Úsalo cuando lo necesites.']] },
  { id: 'alfa', who: 'kira', t: 'El Alfa de Ceniza', req: 'b1', o: { k: 'kill', type: 'alfa', n: 1 }, r: { chispas: 10, gemas: 10 }, h: 'Derrota al Alfa de Ceniza (anillo 2)',
    d: [['kira', 'Hay un lobo enorme guiando a la manada. Le dicen el Alfa de Ceniza.'], ['kira', 'Cuando baje la cabeza, va a embestir en línea recta. No te quedes delante: esquiva hacia un lado.']],
    e: [['kira', 'Lo lograste. Sin él, la manada se dispersa y deja de atacar a la gente.'], ['kira', 'A veces el valor no es pelear más fuerte. Es leer al otro y moverse a tiempo.']] }
];
var SIDEI = {}; SIDE.forEach(function (q) { SIDEI[q.id] = q; });
function sideFor(s, w) {
  for (var i = 0; i < SIDE.length; i++) { var q = SIDE[i], st = s.side[q.id]; if (q.who !== w) continue; if (st && st.s === 1) return { q: q, st: st }; if (!st && s.story.i >= STI[q.req]) return { q: q, st: null }; }
  return null;
}
function sideAccept(s, id) { if (!SIDEI[id] || s.side[id]) return false; s.side[id] = { s: 1, n: 0 }; return true; }
function sideReady(s, id) { var st = s.side[id], q = SIDEI[id]; return !!(st && st.s === 1 && st.n >= q.o.n); }
function sideFinish(s, id) { if (!sideReady(s, id)) return false; var q = SIDEI[id]; s.side[id].s = 2; giveReward(s, q.r); if (q.title) s.title = q.title; return true; }
function giveChispas(s, id) { var st = s.side[id], q = SIDEI[id]; if (!st || st.s !== 1 || q.o.k !== 'giveCh' || s.chispas < q.o.n) return false; s.chispas -= q.o.n; st.n = q.o.n; return true; }

/* ---------- fragmentos del Brazalete del Origen (exploración + Códice de historia) ---------- */
var FRAG = [
  { id: 'f1', z: 'plaza', x: 2, y: 26, t: 'El reparto', p: ['Hace mil años, el Brazalete del Origen se rompió en mil luces.', 'Cada recién nacido de Ánima recibió una. Nadie recibió más que nadie.', 'Por eso los brazaletes responden a lo que haces, no a quién eres.'] },
  { id: 'f2', z: 'dojo', x: 28, y: 4, t: 'La primera competencia', p: ['Los primeros torneos eran fiestas en la cumbre.', 'Se peleaba por honor y, al final, ganadores y perdedores comían juntos.', 'Nadie perdía nada. Solo se aprendía.'] },
  { id: 'f3', z: 'forja', x: 31, y: 24, t: 'El oro y la magia', p: ['Un día alguien descubrió que la magia podía volverse pan, herramientas y oro.', 'Fue un gran invento. Hubo comida para todos.', 'Pero algunos empezaron a guardar más de lo que necesitaban.'] },
  { id: 'f4', z: 'tierras', x: 9, y: 33, t: 'Los Ecos', p: ['Cuando alguien abandona su poder por miedo o tristeza, queda un Eco.', 'Los Ecos no son malos: están perdidos. Buscan a quien eran.', 'Derrotarlos los libera. Por eso brillan al desaparecer.'] },
  { id: 'f5', z: 'tierras', x: 24, y: 3, t: 'El niño sin luz', p: ['Una noche nació un bebé sin brazalete. Se llamaba Vant.', 'Las otras familias apartaban a sus hijos de él, como si fuera contagioso.', 'Vant aprendió a sonreír sin que la sonrisa le llegara a los ojos.'] },
  { id: 'f6', z: 'tierras', x: 42, y: 32, t: 'La regla del cien', p: ['Ya adulto, Vant ofreció al Consejo un torneo grandioso: cien entran, uno gana.', 'Todos aplaudieron. Nadie leyó la letra pequeña:', '“El poder perdido será custodiado por el Anfitrión”.'] },
  { id: 'f7', z: 'coliseo', x: 27, y: 21, t: 'Lo que no se cuenta', p: ['En el palco, Vant guarda frascos de luz con nombres escritos a mano.', 'Cada frasco es un pedazo de alguien que confió en él.', 'A veces, de noche, les habla. Les pide perdón. Y vuelve a empezar.'] }
];
var FRAGI = {}; FRAG.forEach(function (f) { FRAGI[f.id] = f; });

/* ---------- clanes: meta semanal cooperativa (todos reciben premio; nada se pierde) ---------- */
var CLANS = [
  { id: 'llama', n: 'Clan Llama Roja', ic: '🔥', c: '#e0262f', st: 'fue', d: 'Fuerza y coraje. +5% al entrenar Fuerza.' },
  { id: 'viento', n: 'Clan Viento Verde', ic: '🍃', c: '#2dffb3', st: 'tec', d: 'Técnica y exploración. +5% al entrenar Técnica.' },
  { id: 'marea', n: 'Clan Marea Azul', ic: '🌊', c: '#39c8ff', st: 'esp', d: 'Espíritu y comercio. +5% al entrenar Espíritu y +5% de oro del negocio.' }
];
var CLANI = {}; CLANS.forEach(function (c, i) { CLANI[c.id] = c; c.i = i; });
var CLANPTS = { kill: 1, train: .2, perf: .5, anvil: .05, build: 1, frag: 10, find: 5 };
function weekKey(now) { return Math.floor((now / 864e5 + 3) / 7); } /* semanas de lunes a domingo (UTC) */
function clanMul(s, st) { var c = CLANI[s.clan.id]; return c && c.st === st ? 1.05 : 1; }
function clanBase(s, key) { var R = mulberry((s.seed ^ (key * 7919)) >>> 0); return CLANS.map(function () { return 2500 + Math.floor(R() * 2500); }); }
function clanStand(s, now) {
  var key = weekKey(now), frac = clamp((now / 864e5 + 3) / 7 - key, 0, 1), t = clanBase(s, key).map(function (x) { return Math.round(x * frac); });
  var c = CLANI[s.clan.id]; if (c && s.clan.week === key) t[c.i] += Math.round(s.clan.pts);
  return t;
}
function clanJoin(s, id, now) {
  if (!CLANI[id] || s.clan.id === id) return false;
  if (s.clan.id && now - s.clan.since < 864e5) return 'espera';
  s.clan.id = id; s.clan.since = now; s.clan.pts = 0; s.clan.week = weekKey(now); return true;
}
/* ---------- eventos semanales rotativos (sin presión: se repiten cada 4 semanas y solo dan multiplicadores) ---------- */
var EVENTS = [
  { id: 'dojo', n: 'Semana del Dojo', ic: '🥋', d: 'Entrenar rinde +25%.', train: 1.25 },
  { id: 'feria', n: 'Feria de la Forja', ic: '⚒️', d: 'Tu negocio produce +25% de oro.', oro: 1.25 },
  { id: 'ecos', n: 'Luna de los Ecos', ic: '🌕', d: 'Derrotar enemigos da +25% de poder y chispas dobles.', kill: 1.25, ch: 2 },
  { id: 'amistad', n: 'Semana de la Amistad', ic: '🤝', d: 'La amistad crece el doble y los puntos de clan valen doble.', friend: 2, clan: 2 }
];
var EVENTI = {}; EVENTS.forEach(function (e) { EVENTI[e.id] = e; });
function eventOf(now) { return EVENTS[weekKey(now) % EVENTS.length]; }
function eventSync(s, now) { var e = eventOf(now); s.evt = e.id; return e.id; }
function evMul(s, k) { var e = EVENTI[s.evt]; return e && e[k] ? e[k] : 1; }

/* ---------- logros (cada uno da gemas una sola vez) ---------- */
var ACH = [
  { id: 'golpes', t: 'Puño de hierro', d: 'Entrena 500 veces', v: 'taps', n: 500, g: 5 },
  { id: 'caza', t: 'Cazador de Ecos', d: 'Derrota 100 enemigos', v: 'kills', n: 100, g: 5 },
  { id: 'mil', t: 'Mil batallas', d: 'Derrota 1.000 enemigos', v: 'kills', n: 1000, g: 15 },
  { id: 'noche', t: 'Primera Noche', d: 'Juega tu primer torneo', v: 'tours', n: 1, g: 5 },
  { id: 'veterano', t: 'Veterano del Eclipse', d: 'Juega 10 torneos', v: 'tours', n: 10, g: 10 },
  { id: 'campeon', t: 'Campeón', d: 'Gana un torneo', v: 'wins', n: 1, g: 20 },
  { id: 'millon', t: 'Primer millón', d: 'Gana 1 M de oro en total', v: 'oroTot', n: 1e6, g: 15 },
  { id: 'amigos', t: 'Buena compañía', d: 'Ten 5 amigos', v: 'friends', n: 5, g: 5 },
  { id: 'arqueo', t: 'Arqueología', d: 'Encuentra 3 fragmentos', v: 'frag', n: 3, g: 5 },
  { id: 'guardian', t: 'Guardián', d: 'Completa el Códice', v: 'frag', n: 7, g: 15 },
  { id: 'bondad', t: 'Buena persona', d: 'Completa 4 misiones secundarias', v: 'side', n: 4, g: 10 },
  { id: 'colec', t: 'Coleccionista', d: 'Ten 4 brazaletes', v: 'brz', n: 4, g: 10 },
  { id: 'guerrero', t: 'Guerrero', d: 'Alcanza 1.500 de Poder', v: 'poder', n: 1500, g: 10 },
  { id: 'leyenda', t: 'Leyenda viva', d: 'Alcanza 1 M de Poder', v: 'poder', n: 1e6, g: 30 },
  { id: 'clan', t: 'Espíritu de equipo', d: 'Aporta 200 puntos a tu clan en una semana', v: 'clan', n: 200, g: 10 },
  { id: 'final', t: 'Fin del viaje', d: 'Elige un final', v: 'ending', n: 1, g: 20 }
];
var ACHI = {}; ACH.forEach(function (a) { ACHI[a.id] = a; });
function achVal(s, a) {
  var v = a.v;
  if (v === 'friends') return s.friends.length;
  if (v === 'frag') return fragCount(s);
  if (v === 'side') { var n = 0; for (var k in s.side) if (s.side[k].s === 2) n++; return n; }
  if (v === 'brz') return s.brz.length;
  if (v === 'poder') return poder(s);
  if (v === 'clan') return s.clan.pts;
  if (v === 'ending') return s.ending ? 1 : 0;
  return s.cnt[v] || 0;
}
function achCheck(s) {
  var got = [];
  for (var i = 0; i < ACH.length; i++) { var a = ACH[i]; if (!s.ach[a.id] && achVal(s, a) >= a.n) { s.ach[a.id] = 1; s.gemas += a.g; got.push(a.id); } }
  return got;
}

function clanWeek(s, now) {
  var key = weekKey(now); if (s.clan.week === key) return null;
  var res = null, c = CLANI[s.clan.id];
  if (c && s.clan.week && s.clan.pts > 0) {
    var b = clanBase(s, s.clan.week); b[c.i] += Math.round(s.clan.pts);
    var place = b.filter(function (x) { return x > b[c.i]; }).length, p = s.clan.pts;
    var gems = [30, 20, 15][place] + (p >= 500 ? 15 : p >= 200 ? 10 : p >= 50 ? 5 : 0);
    s.gemas += gems; res = { w: s.clan.week, place: place + 1, gems: gems, pts: Math.round(p) }; s.clan.last = res;
  }
  s.clan.week = key; s.clan.pts = 0; return res;
}
function fragCount(s) { var n = 0; for (var k in s.frag) if (FRAGI[k]) n++; return n; }
function fragTake(s, id) {
  if (!FRAGI[id] || s.frag[id]) return false;
  s.frag[id] = 1; s.legado += 10; s.gemas += 5; ev(s, 'frag', { id: id });
  if (fragCount(s) === FRAG.length) { s.legado += 200; s.title = 'Guardián del Origen'; return 'all'; }
  return true;
}

/* ---------- amigos y grupo ---------- */
function addFriend(s, bi) { if (!s.bots[bi] || s.friends.length >= 12 || s.friends.some(function (f) { return f.bi === bi; })) return false; s.friends.push({ bi: bi, af: 0 }); return true; }
function friendXP(s, bi, n) {
  var f = null; s.friends.forEach(function (x) { if (x.bi === bi) f = x; }); if (!f) return 0;
  var b4 = Math.floor(f.af / 25); f.af = Math.min(100, f.af + n * evMul(s, 'friend')); var g = (Math.floor(f.af / 25) - b4) * 3; if (g > 0) s.gemas += g; return g;
}
function setParty(s, bi, on) {
  var i = s.party.indexOf(bi);
  if (!on) { if (i >= 0) s.party.splice(i, 1); return true; }
  if (i >= 0 || s.party.length >= 2 || !s.friends.some(function (f) { return f.bi === bi; })) return false;
  s.party.push(bi); return true;
}

var DQ = [
  { k: 'perf', st: 'tec', n: 5, t: 'Logra 5 katas perfectas' }, { k: 'anvil', n: 30, t: 'Golpea el yunque 30 veces' },
  { k: 'train', st: 'fue', n: 80, t: 'Golpea el saco 80 veces' }, { k: 'train', st: 'tec', n: 15, t: 'Logra 15 katas' },
  { k: 'train', st: 'esp', n: 5, t: 'Completa 5 respiraciones' }, { k: 'kill', n: 15, t: 'Derrota 15 enemigos' },
  { k: 'oro', n: 0, t: 'Gana oro' }, { k: 'visit', z: 'coliseo', n: 1, t: 'Visita el Coliseo' }, { k: 'build', n: 3, t: 'Mejora 3 edificios' }
];
function dailyCheck(s, now) {
  var d = today(now); if (s.daily.day === d) return false;
  var R = mulberry((s.seed ^ d.length * 7919 ^ (now / 864e5 | 0)) >>> 0), pool = DQ.slice(), q = [];
  for (var i = 0; i < 3; i++) {
    var t = pool.splice(Math.floor(R() * pool.length), 1)[0], n = t.k === 'oro' ? Math.max(500, Math.round(prod(s) * 600)) : t.n;
    q.push({ k: t.k, st: t.st, z: t.z, n: n, p: 0, done: 0, t: t.k === 'oro' ? 'Gana ' + fmt(n) + ' de oro' : t.t });
  }
  var first = !s.daily.day; s.daily = { day: d, q: q }; if (!first) s.gemas += 5;
  return !first;
}
function dailyClaim(s, i) { var q = s.daily.q[i]; if (!q || q.done || q.p < q.n) return false; q.done = 1; s.gemas += 3; addOro(s, Math.round(100 + prod(s) * 60)); return true; }

/* ---------- tiempo ---------- */
function tick(s, dt) {
  if (!(dt > 0)) return; dt = Math.min(dt, 5);
  var p = prod(s); if (p > 0) addOro(s, p * dt);
  s.en = Math.min(enMax(s), s.en + 0.6 * dt);
  botsTick(s, dt); s.cnt.play += dt;
}
function offline(s, now) {
  var el = Math.max(0, (now - s.last) / 1000); s.last = now;
  if (el < 30) return null;
  var capS = cajaH(s) * 3600, t = Math.min(el, capS), o = prod(s) * t * 0.5;
  if (o > 0) addOro(s, o);
  s.en = enMax(s); botsTick(s, Math.min(el, 7200));
  return { secs: el, oro: o, capped: el > capS };
}

var API = {
  VERSION: VERSION, SAVE_KEY: SAVE_KEY, EL: EL, ELK5: ELK5, TIERS: TIERS, RANKS: RANKS, ORIG: ORIG, NPC: NPC, ZONES: ZONES, FOES: FOES, RINGS: RINGS,
  BLD: BLD, BLDI: BLDI, ACT: ACT, GEAR: GEAR, SHOP: SHOP, TOUR: TOUR, LOOK: LOOK, CHAT: CHAT, BOTCHAT: BOTCHAT, REPLY: REPLY, STORY: STORY, STI: STI, FORGE: FORGE, NEWB: NEWB,
  mulberry: mulberry, gauss: gauss, clamp: clamp, pick: pick, fmt: fmt, today: today, botName: botName, cleanName: cleanName,
  newState: newState, migrate: migrate, validate: validate, serialize: serialize, deserialize: deserialize,
  base: base, eqB: eqB, mBr: mBr, mLeg: mLeg, poder: poder, rankOf: rankOf, enMax: enMax, fighter: fighter, combat: combat, statsOfPower: statsOfPower, foeStats: foeStats, ringPower: ringPower, killReward: killReward,
  addOro: addOro, gearMul: gearMul, gearCost: gearCost, trainGain: trainGain, train: train, buyGear: buyGear, elixCost: elixCost, elixGain: elixGain, buyElix: buyElix, foodCost: foodCost, eat: eat,
  bCost: bCost, bMile: bMile, magia: magia, bProd: bProd, prod: prod, bUnlocked: bUnlocked, buyB: buyB, tapOro: tapOro, cajaH: cajaH, cajaCost: cajaCost, buyCaja: buyCaja,
  elLocked: elLocked, brzOf: brzOf, forgeNew: forgeNew, forgeUp: forgeUp, equip: equip, shopBuy: shopBuy,
  botsTick: botsTick, board: board,
  lossPct: lossPct, makeField: makeField, nightOrder: nightOrder, aliveAt: aliveAt, duelP: duelP, rankLoss: rankLoss, setPend: setPend, applyTour: applyTour,
  mentor: mentor, stepObj: stepObj, stepHint: stepHint, stepDialog: stepDialog, ev: ev, stepProg: stepProg, stepDone: stepDone, advance: advance, choose: choose, who: who,
  dailyCheck: dailyCheck, dailyClaim: dailyClaim, tick: tick, offline: offline,
  SIDE: SIDE, SIDEI: SIDEI, sideFor: sideFor, sideAccept: sideAccept, sideReady: sideReady, sideFinish: sideFinish, giveChispas: giveChispas,
  addFriend: addFriend, friendXP: friendXP, setParty: setParty,
  NA: NA, NB: NB, BAD: BAD, DQ: DQ, M: M, SHOPL: SHOP,
  CYCLE: CYCLE, FOE_EL: FOE_EL, afin: afin, strongVs: strongVs, weakVs: weakVs, FRAG: FRAG, FRAGI: FRAGI, fragCount: fragCount, fragTake: fragTake,
  CLANS: CLANS, CLANI: CLANI, CLANPTS: CLANPTS, weekKey: weekKey, clanMul: clanMul, clanBase: clanBase, clanStand: clanStand, clanJoin: clanJoin, clanWeek: clanWeek,
  EVENTS: EVENTS, EVENTI: EVENTI, eventOf: eventOf, eventSync: eventSync, evMul: evMul, ACH: ACH, ACHI: ACHI, achVal: achVal, achCheck: achCheck
};
root.BDP = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
