# Brazaletes del Poder · versión Roblox (Rojo + Luau)

Aquí vive el juego para **Roblox**. Las reglas (fórmulas, economía, historia, torneo) son un port **fiel** de `src/core.js` de la versión HTML: mismos números y el mismo formato de partida.

```
roblox/
  default.project.json            proyecto Rojo
  src/shared/Datos.luau           datos del juego (GENERADO desde core.js: historia, enemigos, edificios…)
  src/shared/Reglas.luau          reglas en Luau (escrito a mano, función por función)
  src/server/Servidor.server.luau DataStore, acciones validadas en el servidor, compras con Robux
  src/server/Pruebas.server.luau  pruebas que corren en Studio al dar Play
  src/server/Golden.luau          918 casos “de oro” calculados con el núcleo JS (GENERADO)
  src/client/Cliente.client.luau  HUD mínimo de prueba
```

## Conectar con Roblox Studio (en tu PC)
1. Instala **Roblox Studio**.
2. Instala **Rojo**: descarga `rojo` desde https://rojo.space (o con Aftman/Rokit) y el **plugin de Rojo** en Studio (Plugins → Manage Plugins, o desde la página de Rojo).
3. Clona este repositorio y en una terminal: `cd roblox` → `rojo serve`.
4. En Studio abre un lugar vacío (Baseplate) → pestaña **Plugins → Rojo → Connect**.
5. Dale **Play**. En la ventana *Output* debe aparecer: `✅ PRUEBAS REGLAS: N/N OK (Luau = JS)`. Si sale ❌, copia las líneas y pásamelas.
6. En Play prueba el HUD: **F** golpea el saco, **G** golpea el yunque, **B** compra el Puesto de Pan.
7. Para guardar partidas en Studio activa *Game Settings → Security → Enable Studio Access to API Services*.

## Regenerar y probar después de cambiar la versión HTML
```
sh tools/roblox-test.sh   # regenera Datos/Golden, corre las pruebas con Luau oficial y luau-analyze
```
Estado actual: **2388/2388 casos idénticos a la versión HTML**, análisis de Luau sin errores.
Si cambias una fórmula en `core.js`, cámbiala igual en `Reglas.luau`: las pruebas de Studio te dirán si quedó distinta.

## Qué ya está y qué falta
- ✅ Reglas completas, guardado con DataStore (reintentos, guardado cada 60 s y al salir), acciones con límite de clics, compras idempotentes.
- ⏳ En Studio: mapas 3D de las 5 zonas, combate con hitboxes en el servidor, la Noche (iluminación + sombras que se congelan con la luz), duelos, interfaz estilo revista, minijuegos, chat con TextChatService.
- Regla de oro: el cliente solo **pide**; el servidor decide (killReward, applyTour y la historia nunca los llama el cliente).
