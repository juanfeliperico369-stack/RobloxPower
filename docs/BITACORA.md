# BITÁCORA · Brazaletes del Poder

Formato: una entrada por sesión, la más reciente arriba. Máximo ~10 líneas: qué cambió, qué se probó, qué falta.

## 2026-11-04 · v0.3.0 · Estrategia elemental, Códice y accesibilidad
1. Roblox: el autor autorizó descargar Luau oficial (0.745). `sh tools/roblox-test.sh` corre las pruebas y `luau-analyze`. Primer resultado 2371/2388 → encontró un error real (`cnt.tours` se perdía al migrar en Luau, choque de nombres con la lista `tours`) → corregido → 2388/2388.
2. Nuevo: **afinidades elementales** (ciclo de 5 + Sombra/Luz) en todo el combate; textos “¡EFICAZ!/RESISTE”; en el torneo se ve la ventaja y se cambia de brazalete antes de cada duelo; la Forja y la creación muestran fuerte/débil.
3. Nuevo: **Códice** — 7 fragmentos del Origen escondidos (haz de luz azul) con páginas de historia que maduran el relato (la infancia de Vant, la letra pequeña del torneo…); título “Guardián del Origen”.
4. Nuevo: **accesibilidad** — texto grande, modo calma (sin destellos/sacudidas), avisos de ataque con rayas (daltonismo).
5. Port a Luau de todo lo nuevo (afin, strongVs, weakVs, fragTake, fragCount, cfg): **2451/2451 casos idénticos a JS**, análisis Luau sin errores.
6. Probado: check OK; sim 120×8 h OK con nuevas pruebas unitarias de afinidad y Códice; bot 3 partidas OK (recoge fragmentos, abre Códice); celular modesto 57–61 fps en calidad baja.
7. Falta: clanes, jefes por anillo, más historia, exportar a Roblox Studio (mapas 3D, combate, interfaz).

## 2026-11-04 · v0.2.1 · Port a Roblox + error de guardado corregido
1. Corregido (importante): al cargar una partida se perdían los desbloqueos de la historia (Sombra/Luz), el avance de las secundarias y los consejos vistos (`migrate` ignoraba mapas vacíos por defecto). Lo detectó el port a Luau.
2. Prueba de guardado ahora estricta: cargar(guardar(partida)) debe ser idéntico byte a byte en las 120 partidas simuladas → OK.
3. Nuevo: carpeta `roblox/` (Rojo): `Reglas.luau` (port fiel), `Datos.luau` y `Golden.luau` generados desde core.js, pruebas que corren en Studio, servidor con DataStore y acciones validadas, cliente mínimo.
4. Nuevo: `tools/gen-roblox.js` (918 casos de oro: generador aleatorio, fórmulas, 780 operaciones de juego en 3 partidas) y `tools/luacheck.js` (revisión estática de .luau).
5. Bloqueado por el entorno: ejecutar Luau aquí (binario `luau` y paquete `fengari` = código externo). Verificación pendiente: dar Play en Studio.
6. Probado: check OK, sim 120×8 h OK, bot 2 partidas OK, luacheck OK, Datos.luau se relee idéntico a los datos JS.
7. Falta: correr las pruebas en Studio, construir mapas/combate/interfaz en Roblox, clanes, más historia.

## 2026-11-04 · v0.2.0 · Mundo social y pulido
1. Cambió: **amigos y grupo** — chat «¿Amigos?» cerca de jugadores, pestaña Amigos, hasta 2 aliados que te siguen y pelean en Tierras Rotas; la amistad regala gemas.
2. Cambió: **7 misiones secundarias** con historias cortas y lecciones (gato de Pip, disciplina, trabajo honesto, proteger a otros, la verdad del Coliseo, ayudar a Dax, autoestima con Nima); marcadores `?`/`✓`.
3. Cambió: **minimapa** (toca para agrandar), **consejos de Pip** de tutorial contextual (una sola vez), **orbes** de recompensa, nuevas misiones diarias (katas perfectas, yunque).
4. Cambió: **duelos** rebalanceados (vida ×3, bloqueo 22%, armadura al cargar golpe, combos del rival). Antes se ganaban 8/8 en 4–8 s; ahora 15–25 s y reñidos contra rivales más fuertes.
5. Cambió: calidad baja automática en equipos modestos + gobernador de fps; la Noche dibuja menos concursantes en calidad baja.
6. Cambió: service worker “red primero” para que la versión nueva llegue sin borrar caché.
7. Probado: `check` OK; `sim` 120 partidas × 8 h: 0 errores, 7/7 secundarias, amigos y grupo válidos; nuevas pruebas unitarias de secundarias y amistad.
8. Probado: `bot` 3 partidas + amigos/grupo/minimapa: 0 errores; celular modesto (CPU 4×): 61 fps mundo, 60 fps Noche (antes 24–27).
9. Probado: experimento de duelos automatizado (`__bdp.loadDuelTest`, tiempo ×6) con 32 duelos.
10. Falta: port a Roblox con verificación (necesita permiso para ejecutar Luau), clanes, más contenido de historia, accesibilidad, pruebas con jugadores reales.

## 2026-11-04 · v0.1.0 · Primera versión jugable (HTML offline + PWA)
1. Cambió: se creó el juego completo en `src/` (núcleo de reglas, motor cómic 2.5D, interfaz revista) y se construye en `dist/index.html` (un solo archivo de ~260 KB).
2. Cambió: 5 zonas (Plaza, Dojo, Forja, Tierras Rotas, Coliseo) + Torneo Mundial (La Noche + duelos + Vant), 23 pasos de historia en 3 actos con 2 finales y 3 orígenes.
3. Cambió: 4 minijuegos (saco con ritmo, katas de precisión, respiración 4-4, yunque), tycoon de 6 edificios, forja de 7 elementos, tienda de gemas sin cajas aleatorias.
4. Cambió: guardado automático en localStorage, exportar/importar a archivo `.json`, ganancias sin conexión, misiones diarias.
5. Cambió: PWA (manifest, sw.js con caché `brazaletes-del-poder-v0.1.0`, íconos 192/512/maskable, apple-touch 180, compartir.png 1200×630) y flujo de APK con Capacitor en GitHub Actions.
6. Balance: el simulador detectó crecimiento descontrolado (magia lineal, equipo y elixires baratos); se corrigió y los rangos pasaron a escala de simulador (hasta 1 M).
7. Probado: `check.js` (0 identificadores sin declarar), `sim.js` 120 partidas × 8 h de juego: 0 errores, guardar/cargar idéntico, historia completa para los 3 orígenes; primer torneo ≈ 6 min.
8. Probado: `bot.js` juega 3 partidas reales (móvil vertical, horizontal, escritorio), todas las zonas, paneles, minijuegos y torneo: 0 errores, ~60 fps; abre sin conexión.
9. Probado: celular modesto simulado (CPU 4× lenta): 39–42 fps en el mundo, 27 fps en la Noche. Publicado en GitHub Pages y verificado con `tools/verify.js` (SW activo, abre sin conexión, 0 errores de instalabilidad). APK: falló 2 veces en íconos → resuelto con íconos pre-generados (`pwa/android`); Release `apk-v0.1.0-3` OK (4,5 MB).
10. Falta: probar con niños/jóvenes reales, optimizar la Noche en gama baja, clanes/amigos, más contenido de historia, y empezar el port a Roblox (Rojo + Luau).
