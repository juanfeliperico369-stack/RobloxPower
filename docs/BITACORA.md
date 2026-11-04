# BITÁCORA · Brazaletes del Poder

Formato: una entrada por sesión, la más reciente arriba. Máximo ~10 líneas: qué cambió, qué se probó, qué falta.

## 2026-11-04 · v0.1.0 · Primera versión jugable (HTML offline + PWA)
1. Cambió: se creó el juego completo en `src/` (núcleo de reglas, motor cómic 2.5D, interfaz revista) y se construye en `dist/index.html` (un solo archivo de ~260 KB).
2. Cambió: 5 zonas (Plaza, Dojo, Forja, Tierras Rotas, Coliseo) + Torneo Mundial (La Noche + duelos + Vant), 23 pasos de historia en 3 actos con 2 finales y 3 orígenes.
3. Cambió: 4 minijuegos (saco con ritmo, katas de precisión, respiración 4-4, yunque), tycoon de 6 edificios, forja de 7 elementos, tienda de gemas sin cajas aleatorias.
4. Cambió: guardado automático en localStorage, exportar/importar a archivo `.json`, ganancias sin conexión, misiones diarias.
5. Cambió: PWA (manifest, sw.js con caché `brazaletes-del-poder-v0.1.0`, íconos 192/512/maskable, apple-touch 180, compartir.png 1200×630) y flujo de APK con Capacitor en GitHub Actions.
6. Balance: el simulador detectó crecimiento descontrolado (magia lineal, equipo y elixires baratos); se corrigió y los rangos pasaron a escala de simulador (hasta 1 M).
7. Probado: `check.js` (0 identificadores sin declarar), `sim.js` 120 partidas × 8 h de juego: 0 errores, guardar/cargar idéntico, historia completa para los 3 orígenes; primer torneo ≈ 6 min.
8. Probado: `bot.js` juega 3 partidas reales (móvil vertical, horizontal, escritorio), todas las zonas, paneles, minijuegos y torneo: 0 errores, ~60 fps; abre sin conexión.
9. Probado: celular modesto simulado (CPU 4× lenta): 39–42 fps en el mundo, 27 fps en la Noche.
10. Falta: probar con niños/jóvenes reales, optimizar la Noche en gama baja, clanes/amigos, más contenido de historia, y empezar el port a Roblox (Rojo + Luau).
