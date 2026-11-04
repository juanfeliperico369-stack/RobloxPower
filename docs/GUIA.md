# GUÍA DEL PROYECTO · BRAZALETES DEL PODER

> Documento de traspaso. Si eres otra IA o un nuevo programador, **lee esto primero**: aquí está todo el contexto para continuar sin preguntar.
> Mantén este archivo al día junto con `docs/BITACORA.md` en cada cambio.

## 1. Qué es
- **Juego:** *Roblox Game · El Brazalete del Poder* (título en pantalla: **Brazaletes del Poder**).
- **Plataforma objetivo:** Roblox (3D, tercera persona/cenital). **Este repo contiene la versión alterna HTML** (offline, un solo archivo) para auditar diseño, economía, matemáticas e historia antes y durante el port a Roblox.
- **Público:** 7 a 25 años. La historia **madura** con el jugador: Acto I (aventura y amistad) → Acto II (la verdad del torneo, grises morales) → Acto III (decisiones, sacrificio, “el poder no define tu valor”).
- **Géneros:** acción, artes marciales, superpoderes, aventura, fantasía, terror leve, supervivencia, anime/cómic, roleplay social, tycoon, simulación, clicker. Sensación de MMORPG (jugadores-bot con nombre, chat, ranking).
- **Idioma:** español.
- **Dueño del proyecto:** juanfeliperico369-stack. Repo: `juanfeliperico369-stack/RobloxPower`. Rama de trabajo: `ccr-c09a962e-axs1lp`. Publicación: rama `gh-pages` → https://juanfeliperico369-stack.github.io/RobloxPower/

## 2. Misión (no negociable)
El autor no quiere lucrar con el descuido de los niños. Reglas de diseño que se derivan:
1. Nada de cajas aleatorias pagadas ni temporizadores de presión (FOMO). Precios claros.
2. **Lo comprado nunca se pierde** (brazaletes, cosméticos). El torneo solo quita *poder entrenado*.
3. Todo lo que se compra con gemas (≈ Robux) también se puede ganar jugando.
4. Terror **leve**: atmósfera, sombras, latidos, susurros. Sin sangre ni gore (apto para etiquetas de madurez *Minimal/Mild* de Roblox; revisar el cuestionario de Roblox antes de publicar).
5. Mensajes positivos integrados: respiración 4-4 en meditación, ayudar a Dax, final “compartir”. Chat solo con frases seguras.

## 3. Estética (evolución de los adjuntos del autor)
- Base: revista **EMSAY / “Evolución Musical”** (portadas con bloques rojo/mostaza/teal/negro, titulares condensados enormes, kicker en serif itálica, letras espaciadas, tiras de película, sello “Parental Advisory” → aquí “Para 7 a 25 años”).
- Mezcla con **Doc Element** (HTML previo del autor): negro total + neón (azul `#39c8ff`, morado `#a42cff`, magenta `#ff2fb3`).
- Evolución propia: **cómic/anime crudo**: contornos de tinta 2 px, sombreado plano (cel), tramas de puntos (halftone), estallidos de estrella, onomatopeyas (¡PAM! ¡ZAS! ¡POW!), sacudidas y “hit-stop”.
- Paleta (`src/style.css :root`): ink `#0b0b0f`, papel `#f2e8d5`, rojo `#e0262f`, mostaza `#f0b429`, teal `#0f5c66`, neón azul/morado/magenta, verde `#2dffb3`.
- Tipografías embebidas (las mismas del HTML del autor): **Titulos** = TeX Gyre Heros Condensed Bold (licencia GUST, libre) y **Cuerpo** = Inter (OFL). Archivos en `src/fonts/`.
- Personajes: avatares de bloques (estilo genérico tipo Roblox, no copia de ninguna marca), brazalete brillante en la muñeca con el color del elemento.

## 4. Mundo e historia
**Mundo:** Ánima. Cada persona nace con un brazalete que responde a lo que *haces*, no a lo que deseas.
**Villano central:** **Vant, el Anfitrión.** Nació sin brazalete, fue humillado, creó el Torneo Mundial. **El poder que pierden los jugadores no desaparece: lo absorbe él** (75%; el 25% vuelve al jugador como *Legado*). Así la regla de pérdida del torneo ES la trama.
**Objeto:** el Brazalete del Origen (repartió el poder entre todos hace siglos; fragmentos ocultos).
**Personajes:** Maestra Ren (Dojo), Don Tobías (Forja), Kira (Tierras Rotas), Pip (guía de la Plaza, niño alegre), El Heraldo (Coliseo), Dax (ex Top 10 que lo perdió todo), Oráculo Nima (lore, Acto III), Vant.
**Orígenes (eligen zona de inicio y mentor):** Discípulo → Dojo/Ren · Mercader → Forja/Tobías · Superviviente → Tierras Rotas/Kira.
**Pasos de historia:** 23 pasos en `src/core.js → STORY` (Prólogo + Acto I “La Chispa”, Acto II “La Sombra del Torneo”, Acto III “El Brazalete del Origen”, Epílogo). Tipos de objetivo: `talk, train, kill, build, oro, power, forge, tourney, give, boss, choice, none`. Diálogos: `i` (al empezar el paso), `d` (al hablar con el NPC objetivo), `e` (al completar). `@m` = mentor según origen.
**Finales:** *Compartir* (romper el brazalete, gran Legado, título “Corazón de Ánima”) o *Corona* (brazalete Origen ×4.5, título “Nuevo Anfitrión”).

## 5. Zonas (mapas en `src/game.js → build*`)
| Zona | Rol | Contenido |
|---|---|---|
| Plaza Ágora | Hub social, paz | Pip, Nima (Acto III), Tablón (misiones diarias), Ranking, Tienda, 4 portales, jugadores-bot charlando |
| Dojo de la Cumbre | Entrenamiento clicker | Sacos (FUE), postes de katas (TEC), cascada para meditar (ESP), Maestra Ren (equipo) |
| Ciudad Forja | Tycoon, paz | 6 parcelas de edificios que crecen, mesa del Tycoon, yunque (clicker de oro), Alquimia (elixires), Panadería (energía), Forja de brazaletes (Tobías) |
| Tierras Rotas | Farmeo PvE/PvP | 3 anillos de dificultad (Ecos, lobos, bandidos, rivales con nombre), Gólem de Obsidiana (jefe, reaparece 60 s), Kira, Dax |
| Coliseo del Eclipse | Torneo Mundial | Heraldo (inscripción), estatua de Vant |
| La Noche (arena) | Torneo fase 1 | Oscuridad, linterna, llamas, Sombras Cazadoras |
| Arena de duelo | Torneo fase 2 | Duelos 1 vs 1 contra rivales/Vant |

## 6. Reglas y fórmulas (fuente única: `src/core.js`)
- **Poder** `P = floor((FUE+TEC+ESP) × mBrazalete × mLegado)`; `mLegado = 1 + 0.25·log10(1 + legado/50)`; tiers de brazalete ×1 / 1.4 / 2 / 3 / 4.5 (Bronce/Plata/Oro/Mítico/Origen).
- **Rangos:** Novato 0 · Aprendiz 60 · Luchador 300 · Guerrero 1.500 · Élite 8.000 · Maestro 40.000 · Campeón 200.000 · Leyenda 1.000.000.
- **Combate (`fighter`)**: vida `(100 + 0.9F + 0.6E + 0.3T)·√m`; daño `(6 + 0.22F + 0.08T)·m`; crítico `5% + 0.15%·T` (máx 50%); enfriamiento golpe `0.5 − 0.0006T` (mín 0.24 s); aura/s `6 + 0.04E`; multiplicador de poder especial `1 + 0.003E`. Combo de 3 golpes ×1 / ×1.1 / ×1.7. Esquiva = invulnerable 0.22 s.
- **Enemigos:** poder del enemigo `eP = max(mín_anillo, P·f)` con anillos `(15, .45) (120, .8) (450, 1.15)`; stats = luchador de poder eP × multiplicadores del tipo (`FOES`).
- **Recompensa por derrota:** `ganancia = x_tipo · (1 + √eP/4) · 0.5 · mLegado` repartida 45% FUE, 30% TEC, 25% ESP; oro `o·(1+√eP/3)`; chispas por probabilidad.
- **Entrenamiento:** `0.05 · (1 + √base/8) · equipo · mLegado · k · calidad`. Saco k=1 (ritmo 2.5–6.5 golpes/s = ×1.25; >8/s = ×0.6), Katas k=4.5 (perfecto ×1.25 con racha hasta ×1.6), Meditación k=28 (inhala 4 s/exhala 4 s) y **devuelve 12 de energía**. Energía máx `100 + ESP/10` (tope 200), regenera 0.6/s; saco cuesta 0.8, kata 2.
- **Equipo del Dojo:** ×(1 + 0.15·nivel), costo `80·1.75^nivel` (máx 20).
- **Tycoon:** 6 edificios (pan 0.5/s … academia 420/s), costo `c0·1.15^n`, hitos ×2 en 25/50/100, **magia tangible** `1 + √ESP/20` multiplica la producción. Yunque: `1 + 3% prod + 0.2·√FUE` por golpe. Ganancias sin conexión al 50% hasta `2 + caja` horas.
- **Elixires (oro → poder):** costo `50·1.13^k`, ganancia `1.5 + 1% base`.
- **Forja:** nuevo elemento 800 oro + 10 chispas; mejoras a Plata/Oro/Mítico 2.5K+20 / 25K+80 / 250K+300. Sombra se desbloquea al final del Acto II, Luz en el Acto III.
- **Torneo Mundial (100 jugadores):**
  - Requisito: 120 de Poder. Rivales generados alrededor de tu poder (log-normal σ=0.42).
  - Fase 1 “La Noche” (75 s): quedan `99 − round(68·(t/75)^1.15)` bots; tu luz congela a las sombras; contacto = −21% vida; llamas recargan la linterna.
  - Fase 2: cuadro de 32 (16avos → final). Entre duelos: Concentración (+12% daño), Guardia (+15% vida) o Respiración (+30% aura).
  - Puestos al perder: 16avos 17–32, octavos 9–16, cuartos 5–8, semis 3–4, final 2 (según el daño que le hiciste al rival).
  - **Pérdida = puesto % del poder entrenado** (puesto 1 = 0%, 2 = 2%, 50 = 50%, 100 = 100%). **Primer torneo: tope 25%** (amuleto de Pip).
  - **Legado:** 25% de lo perdido vuelve como multiplicador permanente. Abandonar a mitad = se aplica el peor puesto actual.
  - Premios: oro `150 + 3000·((101−puesto)/100)²·(1+√P/20)`, gemas 50/25/10/3/1.
- **Gemas (simulan Robux):** se ganan con misiones, tablón diario (+3 c/u, +5 por volver cada día) y torneos. Tienda: Plata 150, Oro 400, cosméticos 40–60, caja fuerte 30.
- **Jugadores-bot:** 99 nombres estilo Roblox persistentes en la partida; crecen con el tiempo; forman el ranking. En el mundo caminan, entrenan, pelean y responden al chat rápido.

## 7. Arquitectura del código
```
src/core.js     Reglas puras (sin DOM): datos, fórmulas, estado, guardado, historia, torneo. Se usa en Node y en el navegador (window.BDP).
src/game.js     Motor: mapas por zona, suelo pre-renderizado, dibujo cómic, entidades, IA, combate, la Noche, duelos.
src/ui.js       Interfaz: portada, creación, HUD, diálogos, paneles, minijuegos, guardado/exportar, entrada táctil/teclado, bucle.
src/style.css   Estilo revista-cómic (placeholders {{FONT_*}} se rellenan al construir).
src/shell.html  Esqueleto HTML con metadatos PWA/Open Graph.
pwa/            manifest, sw.js (caché "brazaletes-del-poder-v{versión}"), íconos y compartir.png.
tools/build.js  Une todo en dist/index.html (≈270 KB, un solo archivo, sin internet).
tools/check.js  Verificador estático (acorn): sintaxis + identificadores sin declarar.
tools/sim.js    Pruebas unitarias + 120 partidas simuladas con invariantes y métricas de balance.
tools/bot.js    Bot QA en Chromium: juega el HTML real (todas las zonas, paneles, minijuegos, torneo, guardar/cargar, exportar, modo sin conexión).
tools/assets.js Genera íconos y compartir.png con el propio motor de dibujo.
tools/verify.js Verifica el sitio publicado (carga, service worker, sin conexión, instalabilidad en Chrome, metas y archivos PWA).
.github/workflows/apk.yml  Construye el APK (Capacitor) en GitHub Actions y lo publica como Release.
```
- game.js y ui.js se concatenan dentro de un mismo IIFE (comparten variables). `window.__bdp` expone ganchos de prueba para el bot.
- Guardado: `localStorage['bdp.save.v1']` cada 10 s, al ocultar la app y al salir. `migrate()` repara/actualiza partidas viejas o importadas.
- Rendimiento: suelo pre-renderizado por zona, dibujo solo de lo visible, DPR máx 2 (1 en calidad baja), oscuridad a media resolución.

## 8. Cómo trabajar
```
npm install                # solo herramientas (acorn); Playwright ya viene en el entorno
node tools/build.js        # construir dist/
node tools/check.js        # verificación estática
node tools/sim.js 120 480  # 120 partidas × 8 h de juego simulado
node tools/bot.js 3        # 3 partidas reales en Chromium + prueba sin conexión
node tools/assets.js       # (si cambia el arte) regenerar íconos → luego build otra vez
```
**Publicar:** copiar `dist/` a la rama `gh-pages` (incluye `.nojekyll`) y subir. Subir `VERSION` en `src/core.js` en cada publicación (cambia el nombre de la caché del service worker).

## 9. Port a Roblox (plan)
- Herramientas: Roblox Studio + **Rojo** (sincroniza archivos `.luau` del repo con Studio). Opcional: el conector MCP oficial de Roblox Studio para que una IA opere Studio desde el PC del autor.
- Mapeo: `core.js` → ModuleScript `Rules` (mismas fórmulas en Luau, servidor autoritativo); guardado → DataStoreService (con reintentos y bloqueo de sesión); gemas → Robux vía MarketplaceService (Developer Products para consumibles, Game Passes para brazaletes permanentes); torneo → servidor dedicado por evento (TeleportService a un lugar “Coliseo”), 100 jugadores reales o rellenados con NPC; chat → TextChatService (filtro obligatorio de Roblox).
- Zonas → Places o regiones del mismo Place con StreamingEnabled. La Noche → iluminación `Lighting` + linterna `SpotLight` + IA de sombras que se congela con raycast de visión.

## 10. Pendiente / ideas
- Clanes/amigos persistentes, intercambio, eventos de temporada sin FOMO, más fragmentos del Brazalete del Origen (expansión de historia), jefes por anillo, más minijuegos (cocina en la panadería, carreras en la plaza), accesibilidad (modo daltónico, texto grande), traducción.
- Revisar con jugadores reales el ritmo (el simulador es más eficiente que una persona: multiplicar sus tiempos ×2–3).
