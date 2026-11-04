--!nonstrict
-- Pruebas de reglas fuera de Studio con el ejecutable oficial de Luau:  luau roblox/tests/run.luau
local Reglas = require("../src/shared/Reglas")
local G = require("../src/server/Golden")
local okN, failN, fallas = require("../src/server/PruebasNucleo")(Reglas, G)
if failN == 0 then
	print(("✅ PRUEBAS REGLAS: %d/%d OK (Luau = JS)"):format(okN, okN + failN))
else
	print(("❌ PRUEBAS REGLAS: %d/%d fallan"):format(failN, okN + failN))
	for _, p in ipairs(fallas) do print("   " .. p) end
	error("pruebas fallidas")
end
