--!nonstrict
--[[
	PRUEBAS DE REGLAS (solo en Roblox Studio, al dar Play).
	Compara Shared.Reglas contra los casos “de oro” calculados con el núcleo JS (Golden.luau, generado por tools/gen-roblox.js).
	Resultado en la ventana Output: “PRUEBAS REGLAS: N/N OK” o la lista de diferencias.
	Fuera de Studio: luau roblox/tests/run.luau
]]
local RunService = game:GetService("RunService")
if not RunService:IsStudio() then return end

local RS = game:GetService("ReplicatedStorage")
local Reglas = require(RS:WaitForChild("Shared"):WaitForChild("Reglas"))
local G = require(script.Parent:WaitForChild("Golden"))
local okN, failN, fallas = require(script.Parent:WaitForChild("PruebasNucleo"))(Reglas, G)

if failN == 0 then print(("✅ PRUEBAS REGLAS: %d/%d OK (Luau = JS)"):format(okN, okN + failN))
else
	warn(("❌ PRUEBAS REGLAS: %d/%d fallan"):format(failN, okN + failN))
	for _, p in ipairs(fallas) do warn("   " .. p) end
end
