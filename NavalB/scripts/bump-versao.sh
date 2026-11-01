#!/usr/bin/env bash
# Bump de versão (idempotente). Uso: bump-versao.sh <versionName> <versionCode> [arvore]
# Altera: package.json (version), android/app/build.gradle (versionCode/versionName) e insere a seção
# "Novidades <versão>" em src/main.js (texto em scripts/novidades-<versão>.html, UMA linha), acima da seção anterior.
set -euo pipefail
VER="${1:?versionName}"; VC="${2:?versionCode}"; T="${3:-/workspace/nexo-naval-strike}"
cd "$T"
sed -i -E "s/^(  \"version\": )\"[^\"]*\"/\1\"$VER\"/" package.json
sed -i -E "s/^(\s*versionCode )[0-9]+/\1$VC/; s/^(\s*versionName )\"[^\"]*\"/\1\"$VER\"/" android/app/build.gradle
NOV="${NOV_ARQ:-scripts/novidades-$VER.html}"
if [ -f "$NOV" ]; then
  python3 - "$NOV" "$VER" <<'PY'
import sys,re
nov=open(sys.argv[1],encoding='utf-8').read().strip()
assert '\n' not in nov, 'novidades deve ser UMA linha'
p='src/main.js'; s=open(p,encoding='utf-8').read()
s=re.sub(r'^<section><h3>Novidades '+re.escape(sys.argv[2])+r'</h3>.*\n','',s,flags=re.M)  # idempotente: troca a seção desta versão se já existir
m=re.search(r'^<section><h3>Novidades \d+\.\d+\.\d+</h3>',s,re.M)
assert m, 'âncora da seção Novidades não encontrada'
s=s[:m.start()]+nov+'\n'+s[m.start():]
open(p,'w',encoding='utf-8').write(s)
PY
  echo "bump: Novidades $VER inserida/atualizada ($NOV)"
else echo "bump: AVISO: $NOV não existe — Novidades NÃO inserida"; fi
grep -n '"version"' package.json | head -1; grep -nE 'versionCode|versionName' android/app/build.gradle
