--!nonstrict
--[[
	SERVIDOR · Brazaletes del Poder
	- Carga/guarda la partida de cada jugador con DataStoreService (mismo formato JSON que la versión HTML).
	- El servidor es la autoridad: el cliente solo PIDE acciones; aquí se validan y se aplican con Shared.Reglas.
	- Ética del proyecto: nada comprado se pierde, sin cajas aleatorias pagadas, precios claros.
	TODO en Studio: mapas de las 5 zonas, combate en el servidor (hitboxes), la Noche y los duelos, interfaz.
]]
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")
local MarketplaceService = game:GetService("MarketplaceService")
local RS = game:GetService("ReplicatedStorage")
local Reglas = require(RS:WaitForChild("Shared"):WaitForChild("Reglas"))

local store = DataStoreService:GetDataStore("BrazaletesDelPoder_v1")
local estados = {} -- [Player] = estado
local ritmo = {} -- [Player] = { [accion] = {t0, n} } para limitar clics

-- Remotos
local carpeta = Instance.new("Folder"); carpeta.Name = "Remotos"; carpeta.Parent = RS
local Accion = Instance.new("RemoteFunction"); Accion.Name = "Accion"; Accion.Parent = carpeta
local Estado = Instance.new("RemoteEvent"); Estado.Name = "Estado"; Estado.Parent = carpeta

---------------------------------------------------------------- guardado
local function clave(p) return "j_" .. p.UserId end
local function cargar(p)
	for intento = 1, 4 do
		local ok, data = pcall(function() return store:GetAsync(clave(p)) end)
		if ok then
			local s = nil
			if type(data) == "string" then
				local okj, t = pcall(function() return HttpService:JSONDecode(data) end)
				if okj then s = Reglas.migrate(t) end
			end
			if not s then
				-- Partida nueva. TODO: pantalla de creación (origen, elemento, colores) antes de esto.
				s = Reglas.newState({ name = p.DisplayName, origin = "discipulo", el = "fuego", seed = p.UserId })
			end
			return s
		end
		task.wait(2 ^ intento)
	end
	return nil -- DataStore caído: no se juega sin poder guardar (evita perder progreso)
end
local function guardar(p)
	local s = estados[p]; if not s then return end
	s.last = Reglas.nowMs()
	local json = HttpService:JSONEncode(s)
	for intento = 1, 4 do
		local ok = pcall(function() store:UpdateAsync(clave(p), function() return json end) end)
		if ok then return true end
		task.wait(2 ^ intento)
	end
	warn("No se pudo guardar a " .. p.Name)
	return false
end

local function resumen(s)
	return { poder = Reglas.poder(s), oro = s.oro, gemas = s.gemas, chispas = s.chispas, en = s.en, enMax = Reglas.enMax(s),
		rango = Reglas.D.RANKS[Reglas.rankOf(Reglas.poder(s)) + 1][2], mision = Reglas.D.STORY[s.story.i + 1].t, pista = Reglas.stepHint(s),
		prog = Reglas.stepProg(s), prod = Reglas.prod(s) }
end

Players.PlayerAdded:Connect(function(p)
	local s = cargar(p)
	if not s then p:Kick("No pudimos cargar tu partida. Intenta en unos minutos (tu progreso está a salvo).") return end
	local now = Reglas.nowMs()
	Reglas.offline(s, now)
	Reglas.dailyCheck(s, now)
	if s.pend then Reglas.applyTour(s, s.pend.r) end -- abandonó un torneo: se aplica el peor puesto que tenía
	estados[p] = s; ritmo[p] = {}
	Estado:FireClient(p, resumen(s))
end)
Players.PlayerRemoving:Connect(function(p) guardar(p); estados[p] = nil; ritmo[p] = nil end)
game:BindToClose(function() for _, p in ipairs(Players:GetPlayers()) do guardar(p) end end)
task.spawn(function() while true do task.wait(60) for _, p in ipairs(Players:GetPlayers()) do guardar(p) end end end)

-- reloj del mundo: producción del tycoon, energía, jugadores-bot
task.spawn(function()
	while true do
		local dt = task.wait(1)
		for p, s in pairs(estados) do Reglas.tick(s, dt); Estado:FireClient(p, resumen(s)) end
	end
end)

---------------------------------------------------------------- acciones (validadas en el servidor)
local function limitar(p, accion, porSeg)
	local r = ritmo[p]; if not r then return false end
	local t = os.clock(); local e = r[accion]
	if not e or t - e[1] >= 1 then r[accion] = { t, 1 } return true end
	e[2] += 1
	return e[2] <= porSeg
end
local CALIDAD = { [0] = true, [0.6] = true, [1] = true, [1.25] = true } -- únicas calidades válidas de los minijuegos
local ACCIONES = {
	train = function(s, act, q) if not Reglas.D.ACT[act] or not CALIDAD[q] then return nil end return Reglas.train(s, act, q) end,
	tapOro = function(s) return Reglas.tapOro(s) end,
	buyB = function(s, id) return Reglas.buyB(s, tostring(id)) end,
	buyGear = function(s, st) return Reglas.buyGear(s, tostring(st)) end,
	buyElix = function(s, st) return Reglas.buyElix(s, tostring(st)) end,
	eat = function(s) return Reglas.eat(s) end,
	buyCaja = function(s) return Reglas.buyCaja(s) end,
	forgeNew = function(s, el) return Reglas.forgeNew(s, tostring(el)) end,
	forgeUp = function(s, id) return Reglas.forgeUp(s, tonumber(id) or -1) end,
	equip = function(s, id) return Reglas.equip(s, tonumber(id) or -1) end,
	shopBuy = function(s, id, el) return Reglas.shopBuy(s, tostring(id), tostring(el)) end,
	dailyClaim = function(s, i) return Reglas.dailyClaim(s, tonumber(i) or -1) end,
	sideAccept = function(s, id) return Reglas.sideAccept(s, tostring(id)) end,
	sideFinish = function(s, id) return Reglas.sideFinish(s, tostring(id)) end,
	giveChispas = function(s, id) return Reglas.giveChispas(s, tostring(id)) end,
	-- NO expuestas al cliente: killReward, applyTour, ev('talk'/'boss'), choose. Las llama el servidor
	-- cuando SU simulación confirma el combate, el diálogo o el resultado del torneo.
}
local LIMITE = { train = 8, tapOro = 10 }
Accion.OnServerInvoke = function(p, nombre, ...)
	local s = estados[p]; local f = ACCIONES[nombre]
	if not s or not f then return nil end
	if not limitar(p, nombre, LIMITE[nombre] or 4) then return nil end
	local ok, r = pcall(f, s, ...)
	if not ok then warn("Acción fallida " .. tostring(nombre) .. ": " .. tostring(r)) return nil end
	Estado:FireClient(p, resumen(s))
	return r
end

---------------------------------------------------------------- compras con Robux (gemas)
-- TODO: crear los Developer Products en el Creator Dashboard y poner aquí sus IDs reales.
local PRODUCTOS = { [0] = 0 } -- [productId] = gemas
MarketplaceService.ProcessReceipt = function(info)
	local p = Players:GetPlayerByUserId(info.PlayerId); local s = p and estados[p]
	if not s then return Enum.ProductPurchaseDecision.NotProcessedYet end
	if s.compras[info.PurchaseId] then return Enum.ProductPurchaseDecision.PurchaseGranted end -- idempotente
	local gemas = PRODUCTOS[info.ProductId]
	if not gemas or gemas <= 0 then return Enum.ProductPurchaseDecision.NotProcessedYet end
	s.gemas += gemas; s.compras[info.PurchaseId] = true
	if not guardar(p) then s.gemas -= gemas; s.compras[info.PurchaseId] = nil; return Enum.ProductPurchaseDecision.NotProcessedYet end
	Estado:FireClient(p, resumen(s))
	return Enum.ProductPurchaseDecision.PurchaseGranted
end
