--!nonstrict
--[[
	Núcleo de las pruebas de reglas: compara Reglas (Luau) contra los casos de oro (Golden, calculados con JS).
	Lo usan Pruebas.server.luau (en Studio) y roblox/tests/run.luau (luau en la terminal).
	Devuelve: okN, failN, lista de fallas.
]]
return function(Reglas, G)
	local okN, failN, fallas = 0, 0, {}
	local function near(a, b) return a == b or math.abs(a - b) <= 1e-9 * math.max(1, math.abs(a), math.abs(b)) end
	local function deep(a, b, path)
		if type(b) == "number" then if type(a) == "number" and near(a, b) then return true end return false, path .. " (" .. tostring(a) .. " ≠ " .. tostring(b) .. ")" end
		if type(b) ~= "table" then if a == b then return true end return false, path .. " (" .. tostring(a) .. " ≠ " .. tostring(b) .. ")" end
		if type(a) ~= "table" then return false, path .. " (no es tabla: " .. tostring(a) .. ")" end
		for k, v in pairs(b) do local ok, p = deep(a[k], v, path .. "." .. tostring(k)); if not ok then return false, p end end
		for k, v in pairs(a) do
			if b[k] == nil and not (type(v) == "table" and next(v) == nil) then return false, path .. "." .. tostring(k) .. " sobra (" .. tostring(v) .. ")" end
		end
		return true
	end
	local function check(nombre, actual, esperado)
		local ok, p = deep(actual, esperado, nombre)
		if ok then okN += 1 else failN += 1; if #fallas < 40 then table.insert(fallas, p) end end
	end
	local function snap(s)
		local o = Reglas.deepcopy(s)
		o.bots = nil; o.look = nil; o.cfg = nil; o.tips = nil
		if o.pend then o.pend.t = nil end
		for _, t in ipairs(o.tours or {}) do t.d = nil end
		local sum = 0; for _, b in ipairs(s.bots) do sum += b.p end
		o.botsP = sum
		o.bots3 = {}
		for i = 1, 3 do local b = s.bots[i]; o.bots3[i] = b.n .. "|" .. b.el .. "|" .. tostring(b.h) end
		return o
	end

	-- 1) generador aleatorio idéntico
	for _, c in ipairs(G.rng) do
		local R = Reglas.mulberry(c.seed); local v = {}
		for i = 1, #c.v do v[i] = R() end
		check("rng " .. c.seed, v, c.v)
	end
	-- 2) funciones puras
	for _, c in ipairs(G.fn) do
		local r
		if c.f == "botNames" then local R, used = Reglas.mulberry(c.a[1]), {}; r = {}; for i = 1, 12 do r[i] = Reglas.botName(R, used) end
		else r = Reglas[c.f](table.unpack(c.a)) end
		check("fn " .. c.f .. "(" .. tostring(c.a[1]) .. ")", r, c.r)
	end
	-- 3) escenarios de juego
	for _, sc in ipairs(G.sc) do
		local s = Reglas.newState({ name = sc.name or ("Prueba " .. sc.origin), origin = sc.origin, seed = sc.seed, el = sc.el, now = sc.now, skin = 2, shirt = 3, hair = 1 })
		check(sc.origin .. " inicio", snap(s), sc.init)
		for k, op in ipairs(sc.ops) do
			local f, a, r = op.f, op.a or {}, nil
			if f == "cheat" then local c = a[1]; s.oro += c.oro; s.gemas += c.gemas; s.chispas += c.chispas; s.stats.fue += c.fue
			elseif f == "killReward" then r = Reglas.killReward(s, a[1], a[2], Reglas.mulberry(a[3]))
			elseif f == "advance" then r = Reglas.advance(s).id
			elseif f == "makeField" then
				local fld = Reglas.makeField(s, Reglas.mulberry(a[1]))
				local ord = Reglas.nightOrder(fld, math.max(Reglas.poder(s), Reglas.D.TOUR.req), Reglas.mulberry(a[1] + 1))
				r = { first = { fld[1], fld[2], fld[3], fld[4] }, n = #fld, ord = {} }
				for i = 1, 12 do r.ord[i] = ord[i] end
			elseif f == "board" then
				local b = Reglas.board(s); local me = -1
				for i, z in ipairs(b) do if z.me == 1 then me = i - 1 end end
				r = { b[1].n, b[2].n, b[3].n, #b, me }
			elseif f == "migrate" then
				local s2 = Reglas.migrate(Reglas.deepcopy(s))
				local okm, pm = false, "nil"
				if s2 then okm, pm = deep(s2, s, "migrate") end
				r = okm and 1 or 0
				if not okm and #fallas < 40 then table.insert(fallas, "detalle " .. tostring(pm)) end
			else r = Reglas[f](s, table.unpack(a)) end
			local tag = sc.origin .. " op" .. k .. " " .. f
			if op.r ~= nil or r ~= nil then check(tag .. " → retorno", r, op.r) end
			check(tag .. " → poder", Reglas.poder(s), op.p)
			check(tag .. " → validar", #Reglas.validate(s), op.v)
			if op.s then check(tag .. " → estado", snap(s), op.s) end
		end
	end
	return okN, failN, fallas
end
