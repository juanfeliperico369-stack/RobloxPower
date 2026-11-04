#!/bin/sh
# Pruebas de la versión Roblox con el Luau oficial (luau-lang/luau 0.745, autorizado por el autor del proyecto).
# 1) regenera Datos.luau y Golden.luau desde src/core.js  2) ejecuta las pruebas  3) analiza tipos/lint.
# Uso: sh tools/roblox-test.sh
set -e
cd "$(dirname "$0")/.."
BIN=${LUAU_BIN:-.cache/luau}
if [ ! -x "$BIN/luau" ]; then
  mkdir -p "$BIN"
  curl -sSL -o "$BIN/luau.zip" https://github.com/luau-lang/luau/releases/download/0.745/luau-ubuntu.zip
  python3 -c "import zipfile,sys;zipfile.ZipFile(sys.argv[1]+'/luau.zip').extractall(sys.argv[1])" "$BIN"
  chmod +x "$BIN/luau" "$BIN/luau-analyze"
fi
TZ=UTC node tools/gen-roblox.js
node tools/luacheck.js
"$BIN/luau" roblox/tests/run.luau
"$BIN/luau-analyze" roblox/src/shared/*.luau roblox/src/server/*.luau roblox/src/client/*.luau roblox/tests/run.luau
echo "ANÁLISIS LUAU OK"
