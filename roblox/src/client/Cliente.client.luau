--!nonstrict
--[[
	CLIENTE (mínimo) · muestra Poder/Oro/Gemas/Misión y permite probar acciones contra el servidor.
	TODO en Studio: HUD con el estilo revista-cómic, joystick móvil, minijuegos del Dojo, paneles.
	Atajos de prueba: [F] golpe al saco · [G] yunque (oro) · [B] comprar Puesto de Pan.
]]
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local UIS = game:GetService("UserInputService")
local remotos = RS:WaitForChild("Remotos")
local Accion, Estado = remotos:WaitForChild("Accion"), remotos:WaitForChild("Estado")

local gui = Instance.new("ScreenGui"); gui.Name = "HUDBrazaletes"; gui.ResetOnSpawn = false
gui.Parent = Players.LocalPlayer:WaitForChild("PlayerGui")
local caja = Instance.new("Frame"); caja.Size = UDim2.fromOffset(300, 96); caja.Position = UDim2.fromOffset(12, 12)
caja.BackgroundColor3 = Color3.fromHex("0b0b0f"); caja.BorderSizePixel = 0; caja.Parent = gui
local borde = Instance.new("UIStroke"); borde.Thickness = 3; borde.Color = Color3.fromHex("f0b429"); borde.Parent = caja
local txt = Instance.new("TextLabel"); txt.Size = UDim2.new(1, -16, 1, -12); txt.Position = UDim2.fromOffset(8, 6)
txt.BackgroundTransparency = 1; txt.TextColor3 = Color3.fromHex("f2e8d5"); txt.Font = Enum.Font.GothamBold; txt.TextSize = 15
txt.TextXAlignment = Enum.TextXAlignment.Left; txt.TextYAlignment = Enum.TextYAlignment.Top; txt.TextWrapped = true; txt.Text = "Cargando…"; txt.Parent = caja

Estado.OnClientEvent:Connect(function(r)
	txt.Text = ("⚡ %d · %s\n● %d oro · ◆ %d · ✧ %d · energía %d/%d\nMisión: %s — %s"):format(r.poder, r.rango, math.floor(r.oro), r.gemas, r.chispas, math.floor(r.en), r.enMax, r.mision, r.pista)
end)
UIS.InputBegan:Connect(function(i, gp)
	if gp then return end
	if i.KeyCode == Enum.KeyCode.F then Accion:InvokeServer("train", "saco", 1)
	elseif i.KeyCode == Enum.KeyCode.G then Accion:InvokeServer("tapOro")
	elseif i.KeyCode == Enum.KeyCode.B then Accion:InvokeServer("buyB", "pan") end
end)
