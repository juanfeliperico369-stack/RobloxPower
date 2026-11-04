--!nonstrict
--[[
	REGLAS · Brazaletes del Poder (port fiel de src/core.js a Luau)
	- Mismas fórmulas, mismos números y mismo formato de partida que la versión HTML.
	- Convenciones de compatibilidad: los índices que se GUARDAN en la partida son base 0 como en JS
	  (story.i, friends[].bi, party[], dailyClaim(i), BLD[].i). Las listas de Lua siguen siendo base 1.
	- No usa nada exclusivo de Roblox salvo DateTime (con respaldo a os.time) → se puede probar fuera de Studio.
	- Verificación: ServerScriptService.Server.Pruebas compara cientos de casos contra el núcleo JS (Golden).
]]
-- En Roblox se usa script.Parent; fuera de Studio (luau CLI, pruebas) se usa la ruta relativa.
local D = if script then require(script.Parent.Datos) else require("./Datos")
local Reglas = {}
Reglas.D = D

---------------------------------------------------------------- utilidades
local M32 = 4294967296
local function u32(x) return x % M32 end
local function trunc(x) if x >= 0 then return math.floor(x) end return math.ceil(x) end
local function toU32(x) return u32(trunc(tonumber(x) or 0)) end
local function T(v) return v ~= nil and v ~= false and v ~= 0 and v ~= "" end -- “verdadero” al estilo JS
local function round(x) return math.floor(x + 0.5) end -- Math.round
local function clamp(v, a, b) if v < a then return a elseif v > b then return b end return v end
local function isNum(v) return type(v) == "number" and v == v and v ~= math.huge and v ~= -math.huge end
local function nOr1(n) if T(n) then return n end return 1 end
local function nowMs()
	if DateTime then return DateTime.now().UnixTimestampMillis end
	return os.time() * 1000
end
local function imul(a, b) -- Math.imul: 32 bits bajos del producto
	a, b = u32(a), u32(b)
	local ah, al = math.floor(a / 65536), a % 65536
	local bh, bl = math.floor(b / 65536), b % 65536
	return u32(al * bl + ((ah * bl + al * bh) % 65536) * 65536)
end
local function pick(R, a) return a[math.floor(R() * #a) + 1] end
local function deepcopy(t) if type(t) ~= "table" then return t end local o = {} for k, v in pairs(t) do o[k] = deepcopy(v) end return o end
Reglas.clamp, Reglas.round, Reglas.deepcopy, Reglas.nowMs = clamp, round, deepcopy, nowMs

function Reglas.mulberry(seed) -- generador idéntico a mulberry32 de JS
	local a = toU32(seed)
	return function()
		a = u32(a + 0x6D2B79F5)
		local t = imul(bit32.bxor(a, bit32.rshift(a, 15)), bit32.bor(1, a))
		t = bit32.bxor(u32(t + imul(bit32.bxor(t, bit32.rshift(t, 7)), bit32.bor(61, t))), t)
		return bit32.bxor(t, bit32.rshift(t, 14)) / M32
	end
end
function Reglas.gauss(R)
	local u, v = 0, 0
	while u == 0 do u = R() end
	while v == 0 do v = R() end
	return math.sqrt(-2 * math.log(u)) * math.cos(6.283185307 * v)
end
local UNITS = { { 1e12, "B" }, { 1e9, "MM" }, { 1e6, "M" }, { 1e3, "K" } }
function Reglas.fmt(n)
	n = math.floor(n)
	if n < 1e4 then return tostring(n) end
	for _, u in ipairs(UNITS) do
		if n >= u[1] then
			local x, s = n / u[1], nil
			if n >= u[1] * 100 then s = tostring(math.floor(x + 0.5)) else s = string.format("%.1f", math.floor(x * 10 + 0.5) / 10) end
			s = string.gsub(s, "%.0", "", 1)
			return s .. u[2]
		end
	end
	return tostring(n)
end
function Reglas.today(t) -- fecha UTC "AAAA-M-D" (en Roblox el día cambia a medianoche UTC)
	local z = math.floor(t / 86400000) + 719468
	local era = math.floor(z / 146097)
	local doe = z - era * 146097
	local yoe = math.floor((doe - math.floor(doe / 1460) + math.floor(doe / 36524) - math.floor(doe / 146096)) / 365)
	local y = yoe + era * 400
	local doy = doe - (365 * yoe + math.floor(yoe / 4) - math.floor(yoe / 100))
	local mp = math.floor((5 * doy + 2) / 153)
	local d = doy - math.floor((153 * mp + 2) / 5) + 1
	local m = mp < 10 and mp + 3 or mp - 9
	if m <= 2 then y = y + 1 end
	return tostring(y) .. "-" .. tostring(m) .. "-" .. tostring(d)
end

---------------------------------------------------------------- índices de datos
local BLDI, STI, SIDEI = {}, {}, {}
for i, d in ipairs(D.BLD) do BLDI[d.id] = d; d.i = i - 1 end
for i, st in ipairs(D.STORY) do STI[st.id] = i - 1 end
for _, q in ipairs(D.SIDE) do SIDEI[q.id] = q end
Reglas.BLDI, Reglas.STI, Reglas.SIDEI = BLDI, STI, SIDEI

---------------------------------------------------------------- nombres
function Reglas.botName(R, used)
	for _ = 1, 20 do
		local a = pick(R, D.NA)
		local b = pick(R, D.NB)
		local n
		if R() < .18 then n = "xX" .. a .. "Xx"
		else
			local suf = ""
			if R() < .35 then suf = tostring(math.floor(R() * 99)) end
			n = a .. b .. suf
		end
		if not used[n] then used[n] = true; return n end
	end
	local m = "Jugador" .. tostring(math.floor(R() * 99999)); used[m] = true; return m
end
local OKCP = {}
for _, c in utf8.codes("ÁÉÍÓÚÑÜáéíóúñü _-") do OKCP[c] = true end
function Reglas.cleanName(n)
	n = tostring(n or "")
	local out = {}
	local ok = pcall(function()
		for _, c in utf8.codes(n) do
			if (c >= 48 and c <= 57) or (c >= 65 and c <= 90) or (c >= 97 and c <= 122) or OKCP[c] then table.insert(out, utf8.char(c)) end
		end
	end)
	if not ok then out = {} for c in string.gmatch(n, "[%w _%-]") do table.insert(out, c) end end
	local s = table.concat(out)
	s = string.gsub(s, " +", " ")
	s = string.match(s, "^ *(.-) *$") or ""
	local cut, k = {}, 0
	for _, c in utf8.codes(s) do k = k + 1; if k > 14 then break end; table.insert(cut, utf8.char(c)) end
	s = table.concat(cut)
	local l = string.lower(s)
	for _, bad in ipairs(D.BAD) do if string.find(l, bad, 1, true) then return "" end end
	return s
end

---------------------------------------------------------------- estado
local function makeBots(seed)
	local R = Reglas.mulberry(bit32.bxor(toU32(seed), 0xabc123))
	local a, used = {}, {}
	for i = 1, 99 do
		local n = Reglas.botName(R, used)
		local r1 = R(); local r2 = R()
		local p = round(30 * math.exp(r1 * r2 * 10))
		local el = pick(R, D.ELK5)
		local h = math.floor(R() * 360)
		a[i] = { n = n, p = p, el = el, h = h }
	end
	return a
end
function Reglas.newState(o)
	o = o or {}
	local orig = D.ORIG[o.origin] and o.origin or "discipulo"
	local O = D.ORIG[orig]
	local now = T(o.now) and o.now or nowMs()
	local seed = toU32(o.seed or 0)
	if seed == 0 then seed = bit32.bxor(toU32(now), 0x5bd1e995) end
	if seed == 0 then seed = 7 end
	local el = (D.EL[o.el] and not T(D.EL[o.el].lock)) and o.el or "fuego"
	local s = {
		v = 1, ver = D.VERSION, seed = seed, created = now, last = now,
		name = (Reglas.cleanName(o.name) ~= "" and Reglas.cleanName(o.name)) or "Heroe", origin = orig,
		look = { skin = clamp(trunc(o.skin or 0), 0, #D.LOOK.skin - 1), shirt = clamp(trunc(o.shirt or 0), 0, #D.LOOK.shirt - 1), hair = clamp(trunc(o.hair or 0), 0, #D.LOOK.hair - 1) },
		stats = { fue = O.st.fue, tec = O.st.tec, esp = O.st.esp }, legado = 0, en = 100, hp = -1,
		oro = O.oro, gemas = 10, chispas = 0,
		brz = { { id = 1, el = el, t = 0 } }, eq = 1, nid = 2,
		gear = { fue = 0, tec = 0, esp = 0 }, elix = 0, tyc = {}, caja = 0, cos = { aura = 0, capa = 0 }, friends = {}, party = {}, side = {}, tips = {}, compras = {},
		zone = O.z, story = { i = 0, n = 0, seen = "" }, unlock = {}, ending = "",
		daily = { day = "", q = {} },
		cnt = { taps = 0, kills = 0, deaths = 0, oroTot = 0, play = 0, tours = 0, wins = 0, best = 0 },
		tours = {}, title = "", pend = nil,
		bots = makeBots(seed),
		cfg = { snd = 1, mus = 1, q = 1, vib = 1 },
	}
	for _, d in ipairs(D.BLD) do s.tyc[d.id] = 0 end
	return s
end
local ARR = { brz = true, bots = true, tours = true, q = true, friends = true, party = true }
local function merge(t, f)
	for k, tv in pairs(t) do
		local fv = f[k]
		if fv ~= nil then
			if ARR[k] and type(tv) == "table" then if type(fv) == "table" then t[k] = fv end -- (cnt.tours es número: no es la lista tours)
			elseif type(tv) == "table" then
				if type(fv) == "table" then if next(tv) == nil then t[k] = fv else merge(tv, fv) end end
			elseif type(tv) == "number" then if isNum(fv) then t[k] = fv end
			elseif type(tv) == type(fv) then t[k] = fv end
		end
	end
end
--- Repara/migra una partida (tabla ya decodificada de JSON). Devuelve estado válido o nil.
function Reglas.migrate(o)
	if type(o) ~= "table" or type(o.stats) ~= "table" or not T(o.name) then return nil end
	local el0 = (type(o.brz) == "table" and type(o.brz[1]) == "table" and o.brz[1].el) or "fuego"
	local d = Reglas.newState({ origin = o.origin, name = o.name, seed = o.seed, el = el0, now = o.created })
	merge(d, o)
	if type(o.pend) == "table" and isNum(o.pend.r) then d.pend = o.pend end
	for _, k in ipairs({ "tyc", "cos" }) do for q, v in pairs(d[k]) do if not isNum(v) or v < 0 then d[k][q] = 0 end end end
	local brz = {}
	for _, b in ipairs(d.brz or {}) do
		if type(b) == "table" and D.EL[b.el] and isNum(b.t) and isNum(b.id) then table.insert(brz, { id = trunc(b.id), el = b.el, t = clamp(trunc(b.t), 0, 4) }) end
	end
	if #brz == 0 then brz = { { id = 1, el = "fuego", t = 0 } } end
	d.brz = brz
	local hasEq, maxId = false, 0
	for _, b in ipairs(d.brz) do if b.id == d.eq then hasEq = true end; maxId = math.max(maxId, b.id) end
	if not hasEq then d.eq = d.brz[1].id end
	d.nid = math.max(d.nid, maxId + 1)
	if type(d.bots) ~= "table" or #d.bots ~= 99 then d.bots = makeBots(d.seed) end
	local fr = {}
	for _, f in ipairs(d.friends) do if type(f) == "table" and isNum(f.bi) and f.bi >= 0 and f.bi < 99 and #fr < 12 then table.insert(fr, f) end end
	d.friends = fr
	local pa = {}
	for _, bi in ipairs(d.party) do
		local ok = false
		for _, f in ipairs(d.friends) do if f.bi == bi then ok = true end end
		if ok and #pa < 2 then table.insert(pa, bi) end
	end
	d.party = pa
	for sid, v in pairs(d.side) do if not SIDEI[sid] or type(v) ~= "table" or not isNum(v.n) then d.side[sid] = nil end end
	d.story.i = clamp(trunc(isNum(d.story.i) and d.story.i or 0), 0, #D.STORY - 1)
	if not D.ZONES[d.zone] then d.zone = "plaza" end
	local nm = Reglas.cleanName(d.name); d.name = nm ~= "" and nm or "Heroe"; d.v = 1; d.ver = D.VERSION
	return d
end
function Reglas.validate(s)
	local e = {}
	local function walk(o, p)
		for k, v in pairs(o) do
			if type(v) == "number" and not isNum(v) then table.insert(e, "NaN/Inf en " .. p .. tostring(k))
			elseif type(v) == "table" then walk(v, p .. tostring(k) .. ".") end
		end
	end
	walk(s, "")
	for _, k in ipairs({ "oro", "gemas", "chispas", "legado", "en" }) do if s[k] < -1e-6 then table.insert(e, "negativo " .. k) end end
	for _, k in ipairs({ "fue", "tec", "esp" }) do if s.stats[k] < 0 then table.insert(e, "stat negativa " .. k) end end
	local hasEq = false
	for _, b in ipairs(s.brz) do if b.id == s.eq then hasEq = true end end
	if not hasEq then table.insert(e, "brazalete equipado inexistente") end
	if s.story.i < 0 or s.story.i >= #D.STORY then table.insert(e, "historia fuera de rango") end
	for _, bi in ipairs(s.party) do
		local ok = false
		for _, f in ipairs(s.friends) do if f.bi == bi then ok = true end end
		if not ok then table.insert(e, "grupo con no-amigo " .. tostring(bi)) end
	end
	for id in pairs(s.side) do if not SIDEI[id] then table.insert(e, "misión secundaria desconocida " .. id) end end
	return e
end

---------------------------------------------------------------- poder y combate
function Reglas.base(s) local t = s.stats; return t.fue + t.tec + t.esp end
function Reglas.eqB(s) for _, b in ipairs(s.brz) do if b.id == s.eq then return b end end return s.brz[1] end
function Reglas.mBr(s) return D.TIERS[Reglas.eqB(s).t + 1].m end
function Reglas.mLeg(s) return 1 + 0.25 * math.log10(1 + s.legado / 50) end
function Reglas.poder(s) return math.floor(Reglas.base(s) * Reglas.mBr(s) * Reglas.mLeg(s)) end
function Reglas.rankOf(p) local r = 0 for i, rk in ipairs(D.RANKS) do if p >= rk[1] then r = i - 1 end end return r end
function Reglas.enMax(s) return math.min(200, 100 + math.floor(s.stats.esp / 10)) end
function Reglas.fighter(st, m, el)
	local sq = math.sqrt(m)
	return {
		maxHp = round((100 + st.fue * 0.9 + st.esp * 0.6 + st.tec * 0.3) * sq * (el == "luz" and 1.1 or 1)),
		atk = (6 + st.fue * 0.22 + st.tec * 0.08) * m * (el == "fuego" and 1.08 or 1),
		crit = clamp(0.05 + st.tec * 0.0015 + (el == "rayo" and 0.05 or 0), 0.05, 0.5),
		cd = clamp(0.5 - st.tec * 0.0006, 0.24, 0.5),
		aura = 6 + st.esp * 0.04 + (el == "agua" and 2 or 0),
		skm = 1 + st.esp * 0.003,
		spd = 150 + math.min(60, st.tec * 0.05) + (el == "viento" and 22 or 0),
		def = el == "tierra" and 0.12 or 0, steal = el == "sombra" and 0.05 or 0, regen = el == "agua" and 0.025 or 0.012,
	}
end
function Reglas.combat(s) return Reglas.fighter(s.stats, Reglas.mBr(s) * Reglas.mLeg(s), Reglas.eqB(s).el) end
function Reglas.statsOfPower(p) local b = math.max(1, p) / 3; return { fue = b, tec = b, esp = b } end
function Reglas.foeStats(t, eP, el)
	local F = D.FOES[t]
	local f = Reglas.fighter(Reglas.statsOfPower(eP), 1, T(el) and el or "fuego")
	return { hp = math.max(10, round(f.maxHp * F.hp)), dmg = f.atk * F.dm, crit = f.crit, sp = F.sp, eP = eP, aura = f.aura, skm = f.skm }
end
function Reglas.ringPower(s, ring) local r = D.RINGS[clamp(ring, 0, 2) + 1]; return math.max(r.min, Reglas.poder(s) * r.f) end

---------------------------------------------------------------- eventos (historia, diarias, secundarias)
local function match(o, t, d)
	if not o or o.k ~= t then return false end
	if t == "train" then return o.st == d.st end
	if t == "kill" then return (not T(o.type)) or o.type == d.type end
	if t == "tourney" then return d.rank ~= nil and d.rank <= o.r end
	if t == "forge" then return d.t ~= nil and d.t >= o.t end
	if t == "talk" or t == "give" or t == "boss" then return false end
	if t == "visit" then return o.z == d.z end
	if t == "perf" then return o.st == d.st end
	if t == "find" then return o.id == d.id end
	return true
end
function Reglas.mentor(s) return D.ORIG[s.origin].m end
function Reglas.who(s, w) if w == D.M then return Reglas.mentor(s) end return w end
function Reglas.stepObj(s, st)
	st = st or D.STORY[s.story.i + 1]
	local o = st.o
	if T(o.k) then return o end
	return o[s.origin]
end
function Reglas.ev(s, t, d)
	d = d or {}
	local st = D.STORY[s.story.i + 1]
	if st then
		local o = Reglas.stepObj(s, st)
		local ok
		if t == "talk" or t == "give" or t == "boss" then ok = (o ~= nil and o.k == t and Reglas.who(s, o.who) == d.who)
		else ok = match(o, t, d) end
		if ok then
			if t == "oro" then s.story.n = s.story.n + d.n
			elseif t == "tourney" or t == "forge" then s.story.n = s.story.n + 1
			else s.story.n = s.story.n + nOr1(d.n) end
		end
	end
	for _, q in ipairs(s.daily.q) do
		if not T(q.done) and match(q, t, d) then q.p = q.p + (t == "oro" and d.n or nOr1(d.n)) end
	end
	for id, sq in pairs(s.side) do
		local so = SIDEI[id]
		if sq.s == 1 and so and match(so.o, t, d) then sq.n = sq.n + (t == "tourney" and 1 or nOr1(d.n)) end
	end
end
local ev = Reglas.ev

---------------------------------------------------------------- oro, entrenamiento
function Reglas.addOro(s, n) if not (n and n > 0) then return end s.oro = s.oro + n; s.cnt.oroTot = s.cnt.oroTot + n; ev(s, "oro", { n = n }) end
function Reglas.gearMul(lv) return 1 + 0.15 * lv end
function Reglas.gearCost(lv) return math.ceil(80 * 1.75 ^ lv) end
function Reglas.trainGain(s, act, q) local A = D.ACT[act]; return 0.05 * (1 + math.sqrt(Reglas.base(s)) / 8) * Reglas.gearMul(s.gear[A.st]) * Reglas.mLeg(s) * A.k * q end
function Reglas.train(s, act, q)
	local A = D.ACT[act]; if not A then return 0 end
	if A.en > 0 and s.en < A.en then return -1 end
	s.en = clamp(s.en - A.en, 0, Reglas.enMax(s))
	if not (q and q > 0) then return 0 end
	local g = Reglas.trainGain(s, act, q); s.stats[A.st] = s.stats[A.st] + g; s.cnt.taps = s.cnt.taps + 1
	ev(s, "train", { st = A.st, n = 1 })
	return g
end
function Reglas.buyGear(s, st) local lv = s.gear[st]; local c = Reglas.gearCost(lv); if lv >= 20 or s.oro < c then return false end s.oro = s.oro - c; s.gear[st] = lv + 1; return true end
function Reglas.elixCost(k) return math.ceil(50 * 1.13 ^ k) end
function Reglas.elixGain(s) return 1.5 + Reglas.base(s) * 0.01 end
function Reglas.buyElix(s, st)
	local c = Reglas.elixCost(s.elix)
	if s.oro < c or s.stats[st] == nil then return 0 end
	s.oro = s.oro - c; s.elix = s.elix + 1
	local g = Reglas.elixGain(s); s.stats[st] = s.stats[st] + g; return g
end
function Reglas.bCost(id, n) return math.ceil(BLDI[id].c * 1.15 ^ n) end
function Reglas.bMile(n) if n >= 100 then return 8 elseif n >= 50 then return 4 elseif n >= 25 then return 2 end return 1 end
function Reglas.magia(s) return 1 + math.sqrt(s.stats.esp) / 20 end
function Reglas.bProd(s, id) local n = s.tyc[id] or 0; return BLDI[id].b * n * Reglas.bMile(n) * Reglas.magia(s) end
function Reglas.prod(s) local t = 0 for _, d in ipairs(D.BLD) do t = t + Reglas.bProd(s, d.id) end return t end
function Reglas.bUnlocked(s, id) local i = BLDI[id].i; return i == 0 or s.tyc[D.BLD[i].id] > 0 end
function Reglas.buyB(s, id)
	if not BLDI[id] or not Reglas.bUnlocked(s, id) then return false end
	local n = s.tyc[id]; local c = Reglas.bCost(id, n)
	if s.oro < c then return false end
	s.oro = s.oro - c; s.tyc[id] = n + 1; ev(s, "build", { n = 1 }); return true
end
function Reglas.foodCost(s) return math.ceil(8 + Reglas.prod(s) * 3) end
function Reglas.eat(s) local c = Reglas.foodCost(s); if s.oro < c or s.tyc.pan < 1 then return false end s.oro = s.oro - c; s.en = math.min(Reglas.enMax(s), s.en + 40); return true end
function Reglas.tapOro(s) local o = 1 + Reglas.prod(s) * 0.03 + math.sqrt(s.stats.fue) * 0.2; Reglas.addOro(s, o); return o end
function Reglas.cajaH(s) return 2 + s.caja end
function Reglas.cajaCost(lv) return math.ceil(400 * 3 ^ lv) end
function Reglas.buyCaja(s) local c = Reglas.cajaCost(s.caja); if s.caja >= 8 or s.oro < c then return false end s.oro = s.oro - c; s.caja = s.caja + 1; return true end
function Reglas.killReward(s, t, eP, R)
	local F = D.FOES[t]; if not F or not T(F.x) then return nil end
	R = R or math.random
	local g = F.x * (1 + math.sqrt(eP) / 4) * 0.5 * Reglas.mLeg(s)
	s.stats.fue = s.stats.fue + g * .45; s.stats.tec = s.stats.tec + g * .3; s.stats.esp = s.stats.esp + g * .25
	local o = round(F.o * (1 + math.sqrt(eP) / 3)); Reglas.addOro(s, o)
	local ch = 0; if R() < F.ch then ch = T(F.chn) and F.chn or 1 end; s.chispas = s.chispas + ch
	local gem = 0; if T(F.pvp) and R() < 0.05 then gem = 1 end; s.gemas = s.gemas + gem
	s.cnt.kills = s.cnt.kills + 1; ev(s, "kill", { type = t })
	return { g = g, o = o, ch = ch, gem = gem }
end

---------------------------------------------------------------- brazaletes y tienda
function Reglas.elLocked(s, el) local L = D.EL[el] and D.EL[el].lock; return (T(L) and not T(s.unlock[L])) and true or false end
function Reglas.brzOf(s, el) for _, b in ipairs(s.brz) do if b.el == el then return b end end return nil end
function Reglas.forgeNew(s, el)
	if not D.EL[el] then return "x" end
	if Reglas.elLocked(s, el) then return "bloqueado" end
	if Reglas.brzOf(s, el) then return "tienes" end
	if s.oro < D.NEWB.o or s.chispas < D.NEWB.ch then return "falta" end
	s.oro = s.oro - D.NEWB.o; s.chispas = s.chispas - D.NEWB.ch
	local id = s.nid; s.nid = s.nid + 1; table.insert(s.brz, { id = id, el = el, t = 0 }); return "ok"
end
function Reglas.forgeUp(s, id)
	local b = nil; for _, x in ipairs(s.brz) do if x.id == id then b = x end end
	if not b then return "x" end
	if b.t >= 3 then return "max" end
	local c = D.FORGE[b.t + 1]
	if s.oro < c.o or s.chispas < c.ch then return "falta" end
	s.oro = s.oro - c.o; s.chispas = s.chispas - c.ch; b.t = b.t + 1; ev(s, "forge", { t = b.t }); return "ok"
end
function Reglas.equip(s, id)
	for _, b in ipairs(s.brz) do if b.id == id then s.eq = id; ev(s, "forge", { t = Reglas.eqB(s).t }); return true end end
	return false
end
function Reglas.shopBuy(s, id, el)
	local it = nil; for _, x in ipairs(D.SHOP) do if x.id == id then it = x end end
	if not it then return "x" end
	if s.gemas < it.g then return "falta" end
	if id == "plata" or id == "oro" then
		local t = id == "plata" and 1 or 2
		if not D.EL[el] or Reglas.elLocked(s, el) then return "bloqueado" end
		local b = Reglas.brzOf(s, el)
		if b and b.t >= t then return "tienes" end
		s.gemas = s.gemas - it.g
		if b then b.t = t else local nid = s.nid; s.nid = s.nid + 1; table.insert(s.brz, { id = nid, el = el, t = t }) end
		ev(s, "forge", { t = t }); return "ok"
	end
	if id == "caja" then if s.caja >= 8 then return "max" end s.gemas = s.gemas - it.g; s.caja = s.caja + 1; return "ok" end
	if T(s.cos[id]) then return "tienes" end
	s.gemas = s.gemas - it.g; s.cos[id] = 1; return "ok"
end

---------------------------------------------------------------- jugadores-bot y ranking
function Reglas.botsTick(s, dt) for _, b in ipairs(s.bots) do b.p = b.p + (b.p * 0.00025 / (1 + b.p / 1e6) + 0.002) * dt end end
function Reglas.board(s)
	local a = {}
	for i, b in ipairs(s.bots) do a[i] = { n = b.n, p = math.floor(b.p), el = b.el, me = 0, _i = i } end
	table.insert(a, { n = s.name, p = Reglas.poder(s), el = Reglas.eqB(s).el, me = 1, _i = #a + 1 })
	table.sort(a, function(x, y) if x.p ~= y.p then return x.p > y.p end return x._i < y._i end)
	return a
end

---------------------------------------------------------------- torneo mundial
function Reglas.lossPct(r) if r <= 1 then return 0 end return math.min(100, r) end
function Reglas.makeField(s, R)
	local P = math.max(Reglas.poder(s), D.TOUR.req)
	local f, used = {}, {}
	used[s.name] = true
	for i = 1, 99 do
		local n = Reglas.botName(R, used)
		local p = clamp(P * math.exp(Reglas.gauss(R) * 0.42), P * 0.35, P * 3)
		local el = pick(R, D.ELK5)
		local h = math.floor(R() * 360)
		f[i] = { n = n, p = p, el = el, h = h }
	end
	return f
end
function Reglas.nightOrder(f, P, R) -- devuelve índices base 0 (como JS), del primero al último en caer
	local a = {}
	for i, b in ipairs(f) do a[i] = { i = i - 1, sc = math.log(b.p / P) * 0.9 + Reglas.gauss(R) * 0.7 } end
	table.sort(a, function(x, y) if x.sc ~= y.sc then return x.sc < y.sc end return x.i < y.i end)
	local out = {}
	for k, o in ipairs(a) do out[k] = o.i end
	return out
end
function Reglas.aliveAt(t) return 99 - round((99 - (D.TOUR.cut - 1)) * clamp(t / D.TOUR.nightT, 0, 1) ^ 1.15) end
function Reglas.duelP(a, b) local x, y = a ^ 1.6, b ^ 1.6; return x / (x + y) end
local RL = { { 17, 32 }, { 9, 16 }, { 5, 8 }, { 3, 4 }, { 2, 2 } }
function Reglas.rankLoss(round_, frac) local r = RL[clamp(round_, 0, 4) + 1]; return r[2] - math.floor(clamp(frac, 0, 0.999) * (r[2] - r[1] + 1)) end
function Reglas.setPend(s, rk) s.pend = { r = clamp(round(rk), 1, 100), t = nowMs() } end
function Reglas.applyTour(s, rk)
	rk = clamp(round(rk), 1, 100)
	local pct, first, capped = Reglas.lossPct(rk), s.cnt.tours == 0, false
	if first and pct > D.TOUR.firstCap then pct = D.TOUR.firstCap; capped = true end
	local b0, p0, k = Reglas.base(s), Reglas.poder(s), 1 - pct / 100
	s.stats.fue = s.stats.fue * k; s.stats.tec = s.stats.tec * k; s.stats.esp = s.stats.esp * k
	local lost = b0 - Reglas.base(s); local lg = lost * D.TOUR.legado; s.legado = s.legado + lg
	local oro = round(150 + 3000 * ((101 - rk) / 100) ^ 2 * (1 + math.sqrt(p0) / 20))
	local gem = (rk == 1 and 50) or (rk <= 3 and 25) or (rk <= 10 and 10) or (rk <= 32 and 3) or 1
	Reglas.addOro(s, oro); s.gemas = s.gemas + gem
	s.cnt.tours = s.cnt.tours + 1; if rk == 1 then s.cnt.wins = s.cnt.wins + 1 end
	s.cnt.best = T(s.cnt.best) and math.min(s.cnt.best, rk) or rk
	if rk == 1 and not T(s.title) then s.title = "Campeón del Eclipse" end
	table.insert(s.tours, 1, { d = nowMs(), r = rk, pct = pct, lost = round(lost), p0 = p0 })
	while #s.tours > 20 do table.remove(s.tours) end
	s.pend = nil
	ev(s, "tourney", { rank = rk })
	return { rank = rk, pct = pct, capped = capped, lost = lost, lg = lg, oro = oro, gem = gem, p0 = p0, p1 = Reglas.poder(s), first = first }
end

---------------------------------------------------------------- historia
function Reglas.stepHint(s)
	local st = D.STORY[s.story.i + 1]; local h = st.h
	if type(h) == "table" then h = h[s.origin] end
	if not T(h) and st.o.k == "talk" then h = "Habla con " .. D.NPC[Reglas.who(s, st.o.who)].n end
	return T(h) and h or st.t
end
function Reglas.stepDialog(s, key)
	local st = D.STORY[s.story.i + 1]; local d = st[key or "d"]
	if not d then return nil end
	if d[1] == nil then d = d[s.origin] end
	local out = {}
	for i, l in ipairs(d) do out[i] = { Reglas.who(s, l[1]), l[2] } end
	return out
end
local function stepNeed(s)
	local o = Reglas.stepObj(s); if not o then return 1 end
	if o.k == "oro" or o.k == "train" or o.k == "kill" or o.k == "build" then return o.n end
	return 1
end
function Reglas.stepProg(s)
	local o = Reglas.stepObj(s); if not o then return { 0, 1 } end
	if o.k == "power" then return { math.min(Reglas.poder(s), o.n), o.n } end
	if o.k == "none" then return { 0, 1 } end
	return { math.min(s.story.n, stepNeed(s)), stepNeed(s) }
end
function Reglas.stepDone(s)
	local o = Reglas.stepObj(s)
	if not o or o.k == "none" or o.k == "choice" then return false end
	if o.k == "power" then return Reglas.poder(s) >= o.n end
	if o.k == "forge" then for _, b in ipairs(s.brz) do if b.t >= o.t then return true end end end
	return s.story.n >= stepNeed(s)
end
local function giveReward(s, r)
	if not r then return end
	if T(r.oro) then Reglas.addOro(s, r.oro) end
	if T(r.gemas) then s.gemas = s.gemas + r.gemas end
	if T(r.chispas) then s.chispas = s.chispas + r.chispas end
end
function Reglas.advance(s)
	local st = D.STORY[s.story.i + 1]; giveReward(s, st.r)
	if T(st.u) then s.unlock[st.u] = 1 end
	if s.story.i < #D.STORY - 1 then s.story.i = s.story.i + 1 end
	s.story.n = 0
	return D.STORY[s.story.i + 1]
end
function Reglas.choose(s, c)
	if D.STORY[s.story.i + 1].id ~= "c6" then return false end
	s.ending = c == "compartir" and "compartir" or "corona"
	if s.ending == "compartir" then
		s.legado = s.legado + Reglas.base(s) * 0.5; s.title = "Corazón de Ánima"
		for _, b in ipairs(s.bots) do b.p = b.p * 1.15 end
	else
		local b = Reglas.eqB(s); local id = s.nid; s.nid = s.nid + 1
		table.insert(s.brz, { id = id, el = b.el, t = 4 }); s.title = "Nuevo Anfitrión"
	end
	s.story.n = 1; Reglas.advance(s); return true
end

---------------------------------------------------------------- misiones secundarias
function Reglas.sideFor(s, w)
	for _, q in ipairs(D.SIDE) do
		local st = s.side[q.id]
		if q.who == w then
			if st and st.s == 1 then return { q = q, st = st } end
			if not st and s.story.i >= STI[q.req] then return { q = q, st = nil } end
		end
	end
	return nil
end
function Reglas.sideAccept(s, id) if not SIDEI[id] or s.side[id] then return false end s.side[id] = { s = 1, n = 0 }; return true end
function Reglas.sideReady(s, id) local st, q = s.side[id], SIDEI[id]; return (st ~= nil and st.s == 1 and st.n >= q.o.n) and true or false end
function Reglas.sideFinish(s, id)
	if not Reglas.sideReady(s, id) then return false end
	local q = SIDEI[id]; s.side[id].s = 2; giveReward(s, q.r)
	if T(q.title) then s.title = q.title end
	return true
end
function Reglas.giveChispas(s, id)
	local st, q = s.side[id], SIDEI[id]
	if not st or st.s ~= 1 or q.o.k ~= "giveCh" or s.chispas < q.o.n then return false end
	s.chispas = s.chispas - q.o.n; st.n = q.o.n; return true
end

---------------------------------------------------------------- amigos y grupo (bi = índice base 0 en s.bots)
local function findFriend(s, bi) for _, f in ipairs(s.friends) do if f.bi == bi then return f end end return nil end
function Reglas.addFriend(s, bi)
	if not s.bots[bi + 1] or #s.friends >= 12 or findFriend(s, bi) then return false end
	table.insert(s.friends, { bi = bi, af = 0 }); return true
end
function Reglas.friendXP(s, bi, n)
	local f = findFriend(s, bi); if not f then return 0 end
	local b4 = math.floor(f.af / 25); f.af = math.min(100, f.af + n)
	local g = (math.floor(f.af / 25) - b4) * 3
	if g > 0 then s.gemas = s.gemas + g end
	return g
end
function Reglas.setParty(s, bi, on)
	local idx = nil; for i, v in ipairs(s.party) do if v == bi and not idx then idx = i end end
	if not on then if idx then table.remove(s.party, idx) end return true end
	if idx or #s.party >= 2 or not findFriend(s, bi) then return false end
	table.insert(s.party, bi); return true
end

---------------------------------------------------------------- diarias y tiempo
function Reglas.dailyCheck(s, now)
	local d = Reglas.today(now); if s.daily.day == d then return false end
	local R = Reglas.mulberry(bit32.bxor(toU32(s.seed), toU32(#d * 7919), toU32(trunc(now / 864e5))))
	local pool = {}; for i, t in ipairs(D.DQ) do pool[i] = t end
	local q = {}
	for _ = 1, 3 do
		local t = table.remove(pool, math.floor(R() * #pool) + 1)
		local n = t.k == "oro" and math.max(500, round(Reglas.prod(s) * 600)) or t.n
		table.insert(q, { k = t.k, st = t.st, z = t.z, n = n, p = 0, done = 0, t = t.k == "oro" and ("Gana " .. Reglas.fmt(n) .. " de oro") or t.t })
	end
	local first = not T(s.daily.day); s.daily = { day = d, q = q }
	if not first then s.gemas = s.gemas + 5 end
	return not first
end
function Reglas.dailyClaim(s, i)
	local q = s.daily.q[i + 1]
	if not q or T(q.done) or q.p < q.n then return false end
	q.done = 1; s.gemas = s.gemas + 3; Reglas.addOro(s, round(100 + Reglas.prod(s) * 60)); return true
end
function Reglas.tick(s, dt)
	if not (dt and dt > 0) then return end
	dt = math.min(dt, 5)
	local p = Reglas.prod(s); if p > 0 then Reglas.addOro(s, p * dt) end
	s.en = math.min(Reglas.enMax(s), s.en + 0.6 * dt)
	Reglas.botsTick(s, dt); s.cnt.play = s.cnt.play + dt
end
function Reglas.offline(s, now)
	local el = math.max(0, (now - s.last) / 1000); s.last = now
	if el < 30 then return nil end
	local capS = Reglas.cajaH(s) * 3600
	local t = math.min(el, capS)
	local o = Reglas.prod(s) * t * 0.5
	if o > 0 then Reglas.addOro(s, o) end
	s.en = Reglas.enMax(s); Reglas.botsTick(s, math.min(el, 7200))
	return { secs = el, oro = o, capped = el > capS }
end

return Reglas
