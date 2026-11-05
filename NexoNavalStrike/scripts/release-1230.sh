#!/usr/bin/env bash
# Release 1.2.30 (vc33) — Nexo Naval Strike 3D. IDEMPOTENTE: pode rodar de novo; patches já aplicados são pulados.
# Uso:
#   release-1230.sh patches     # só integra os .diff novos (dry-run antes de cada um), registra e para (sem build)
#   release-1230.sh completo    # patches -> bump -> build -> cap sync -> gradle -> APK + checagens -> verifica -> diff -> relatório -> UNIT
#   release-1230.sh ensaio      # ensaio a seco numa cópia temporária, versão de teste, sem tocar em /workspace/NexoNavalStrike-*.apk
# Variáveis: SEM_UNIT=1 (pula a UNIT), PERMITE_INCOMPLETO=1 (build mesmo faltando item), NPM_CI=1 (ensaio: reinstala node_modules)
set -uo pipefail
MODO="${1:-completo}"; [ "$MODO" = pre01 ] && export PRE01=1
R=/workspace/release-1230; mkdir -p "$R"
SRCTREE=/workspace/nexo-naval-strike; BASE=/workspace/nexo-naval-strike-base-1.2.29
S="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export JAVA_HOME=/workspace/jdk17 ANDROID_HOME=/workspace/android-sdk ANDROID_SDK_ROOT=/workspace/android-sdk
export PATH=/workspace/jdk17/bin:$PATH
BT=/workspace/android-sdk/build-tools/35.0.0
CERT256=d0c31791ddd24b04f792bd152d59bda85120523e6f523dabd50a246713d9a599
if [ "$MODO" = ensaio ]; then
  VER=1.2.30-ensaio; VC=99; T="$R/ensaio/tree"; OUT="$R/ensaio/out"; PATCHES_ON=0
else
  VER=1.2.30; VC=33; T="$SRCTREE"; OUT=/workspace; PATCHES_ON=1
fi
mkdir -p "$OUT"
SUF=""; [ "$MODO" = pre01 ] && SUF="-pre01"  # pre01: tudo menos o item 1 (APK /workspace/NexoNavalStrike-1.2.30-pre01.apk); o final (com o FINAL-01) sai como NexoNavalStrike-1.2.30.apk
APK="$OUT/NexoNavalStrike-$VER$SUF.apk"
DIFFOUT="$OUT/NexoNavalStrike-1.2.29-para-1.2.30.diff"; REL="$OUT/NexoNavalStrike-1.2.30-relatorio.md"
LOG="$R/release-$MODO-$(date +%H%M%S).log"; TIMES="$R/tempos-$MODO.tsv"; : > "$TIMES"
APLIC="$R/aplicados.tsv"; touch "$APLIC"
exec > >(tee -a "$LOG") 2>&1
echo "== release-1230 [$MODO] $(date '+%F %T %Z') ver=$VER vc=$VC arvore=$T"
FALHA=0
fase() { FASE_N="$1"; FASE_T0=$(date +%s); echo "--- FASE $1 ($(date +%T))"; }
fim() { local d=$(( $(date +%s) - FASE_T0 )); printf '%s\t%s\n' "$FASE_N" "$d" >> "$TIMES"; echo "--- fim $FASE_N: ${d}s"; }
morre() { echo "ERRO: $*"; printf 'ERRO\t%s\n' "$*" >> "$TIMES"; exit 1; }

# ---------------- ensaio: cópia temporária ----------------
if [ "$MODO" = ensaio ]; then
  fase "ensaio-copia-arvore"; rm -rf "$R/ensaio"; mkdir -p "$R/ensaio/tree" "$OUT"
  tar -C "$SRCTREE" --exclude=./dist --exclude=./capturas1227 --exclude=./capturas1228 --exclude=./capturas1229 -cf - . | tar -C "$T" -xf - || morre copia
  # versão de teste usa o mesmo texto de Novidades (exercita a inserção)
  cp "$T/scripts/novidades-1.2.30.html" "$T/scripts/novidades-$VER.html"; fim
  if [ "${NPM_CI:-0}" = 1 ]; then fase "ensaio-npm-ci"; (cd "$T" && rm -rf node_modules && npm ci --prefer-offline --no-audit --no-fund) || morre npm-ci; fim; fi
fi

# ---------------- fase 1: integrar patches ----------------
APROVADOS="$S/aprovados-1230.txt"
# LISTA BRANCA (regra do Fiscal): só entra o que está em scripts/aprovados-1230.txt (caminho TAB sha256 TAB item), na ordem das linhas. Nada de glob.
descobre() { local f sha it
  while IFS=$'\t' read -r f sha it; do
    case "$f" in ''|'#'*) continue;; esac
    if [ "$sha" = PENDENTE ]; then [ -f "$f" ] && { echo "ERRO-LISTA: $f existe mas a lista está PENDENTE (sem sha aprovado)" >&2; return 9; }; echo "lista: $(basename "$f") PENDENTE (arquivo ainda não existe) — pulado" >&2; continue; fi
    [ -z "$it" ] && it=$(item_de "$f")
    printf '%s\t%s\n' "$it" "$f"
  done < "$APROVADOS"; return 0; }
verifica_aprovados() { # ANTES de aplicar qualquer coisa: todo arquivo da lista existe e tem o sha256 aprovado; arquivos do Fiscal fora da lista são só avisados
  local f sha it real bad=0 n=0
  [ -f "$APROVADOS" ] || { echo "ERRO: $APROVADOS ausente"; return 9; }
  while IFS=$'\t' read -r f sha it; do
    case "$f" in ''|'#'*) continue;; esac; n=$((n+1))
    if [ "$sha" = PENDENTE ]; then if [ -f "$f" ]; then echo "!!! LISTA: $(basename "$f") existe (sha256 $(sha256sum "$f" | cut -c1-64)) mas a lista está PENDENTE — precisa de aprovação com sha"; bad=1; else echo "lista: $(basename "$f") PENDENTE (sem arquivo)"; fi; continue; fi
    [ -f "$f" ] || { echo "!!! LISTA: arquivo ausente: $f"; bad=1; continue; }
    real=$(sha256sum "$f" | cut -d' ' -f1); [ "$real" = "$sha" ] && echo "aprovado ok: $(basename "$f") ${sha:0:16}" || { echo "!!! LISTA: sha NÃO BATE em $(basename "$f"): aprovado ${sha:0:16}… atual ${real:0:16}… ($f)"; bad=1; }
  done < "$APROVADOS"
  for f in /workspace/fiscal/nukefumaca/patches/FINAL-*.diff /workspace/fiscal/convoo/FINAL-*.diff /workspace/fiscal/crit9fix/patches/*.diff; do [ -f "$f" ] || continue; grep -q "^$f"$'\t' "$APROVADOS" || echo "fora da lista (ignorado): $f"; done
  [ $bad = 0 ] || return 9; echo "lista branca: $n linhas conferidas"; return 0; }
item_de() { # item = mapa explícito (scripts/item-map-1230.txt: "<basename> <item>") ou dígitos depois de FINAL-
  local b; b=$(basename "$1"); local m; m=$(awk -v b="$b" '$1==b{print $2}' "$S/item-map-1230.txt" 2>/dev/null | head -1)
  if [ -n "$m" ]; then echo "$m"; return; fi
  echo "$b" | sed -nE 's/^FINAL-0*([0-9]+)[a-z]?[-_.].*/\1/p; t; s/.*/?/p' | head -1
}
pl() { local x; x=$(grep -m1 '^+++ ' "$1" | awk '{print $2}'); case "$x" in a/*|b/*) echo 1;; *) echo 0;; esac; }  # nível -p: 1 para "+++ b/src/..." (padrão), 0 para "+++ src/..." (FINAL-01 do Fiscal)
sanidade() { # rejeita patch que toca caminho perigoso
  grep -E '^(\+\+\+|---) ' "$1" | awk '{print $2}' | grep -v '^/dev/null$' | grep -E '(^/|\.\./|node_modules|keystore|\.jks|\.p12|AndroidManifest)' && return 1; return 0; }
efetivos() { awk -F'\t' 'NR==FNR{ if($4=="revertido") r[$1]=1; next } !r[$1] && $4!="revertido"' "$APLIC" "$APLIC"; }
restaura_soltas() { # edições soltas na árvore real (fora do fluxo de patches): compara com base + patches registrados; restaura os arquivos da lista (scripts/soltas-restaurar-1230.txt)
  local E="$R/esperada" f s ok=1 lista="$S/soltas-restaurar-1230.txt"; [ -f "$lista" ] || return 0
  chmod -R u+w "$E" 2>/dev/null; rm -rf "$E"; mkdir -p "$E"
  tar -C "$BASE" --exclude=./node_modules --exclude=./dist --exclude=./android --exclude='./capturas*' -cf - . | tar -C "$E" -xf - && chmod -R u+w "$E" || return 8
  for s in $(efetivos | cut -f1); do f=$(ls "$R/aplicados/$s-"* 2>/dev/null | head -1); [ -f "$f" ] || continue; patch -p$(pl "$f") -F0 -f -s --no-backup-if-mismatch -d "$E" < "$f" >/dev/null 2>&1 || { echo "esperada: $(basename "$f") não aplicou na base (abortando restauração)"; return 8; }; done
  for f in $(grep -v '^#' "$lista"); do
    if ! cmp -s "$E/$f" "$T/$f"; then mkdir -p "$R/soltas-backup"; cp "$T/$f" "$R/soltas-backup/$(echo "$f" | tr / _).$(date +%H%M%S)"; diff -u "$E/$f" "$T/$f" > "$R/soltas-backup/$(echo "$f" | tr / _).diff"; cp "$E/$f" "$T/$f"; echo "RESTAURADO $f (edição solta removida; backup em $R/soltas-backup)"
      for s in $(efetivos | cut -f1); do pf=$(ls "$R/aplicados/$s-"* 2>/dev/null | head -1); grep -q "^+++ [ab]/$f" "$pf" 2>/dev/null && { patch -p$(pl "$pf") -F0 -R --dry-run -s -f -d "$T" < "$pf" >/dev/null 2>&1 || { echo "  patch -R --dry-run NÃO confere para $(basename "$pf") em $f"; ok=0; }; }; done
    fi
  done
  if grep -q "<h3>Novidades $VER</h3>" "$T/src/main.js"; then  # árvore já bumpada: a esperada também (texto pre01 ou final, conforme o que está na árvore)
    NV="$S/novidades-$VER.html"; grep -qxF "$(cat "$S/novidades-$VER-pre01.html")" "$T/src/main.js" && NV="$S/novidades-$VER-pre01.html"
    mkdir -p "$E/android/app"; cp "$BASE/android/app/build.gradle" "$E/android/app/build.gradle"; chmod u+w "$E/android/app/build.gradle"
    (cd "$E" && NOV_ARQ="$NV" "$S/bump-versao.sh" "$VER" "$VC" "$E" >/dev/null 2>&1); fi
  local D; D=$(diff -rq "$E" "$T" --exclude=node_modules --exclude=dist --exclude=android --exclude='capturas*' --exclude=scripts --exclude='*.orig' --exclude='*.rej' | sed 's/^/  fora da base+patches: /')
  if [ -n "$D" ]; then echo "$D" | head -20; echo "ERRO: a árvore real tem diferenças que não vêm da base 1.2.29 + patches registrados (nada a restaurar automaticamente)"; return 8; fi
  echo "árvore real == base 1.2.29 + patches registrados (conferido arquivo a arquivo)"
  [ "$ok" = 1 ] || return 8; return 0; }
integra() {
  local item f sha n=0 b old
  while IFS=$'\t' read -r item f; do
    [ -z "$f" ] && continue; n=$((n+1)); sha=$(sha256sum "$f" | cut -c1-16)
    if efetivos | grep -q "^$sha"; then echo "patch já registrado: $(basename "$f") ($sha)"; continue; fi
    b=$(basename "$f")
    old=$(efetivos | awk -F'\t' -v b="$b" '{n=split($3,a,"/"); if(a[n]==b && $1!="'"$sha"'"){print $1; exit}}')
    if [ -n "$old" ]; then # versão nova do mesmo patch: reverte a antiga (cópia guardada) antes
      oldf=$(ls "$R/aplicados/$old-"* 2>/dev/null | head -1); [ -f "$oldf" ] || { echo "versão antiga de $b sem cópia guardada"; return 6; }
      echo ">> $b mudou ($old -> $sha): revertendo a versão antiga"
      patch -p$(pl "$oldf") -F0 -R --dry-run -f -d "$T" < "$oldf" > "$R/dry.out" 2>&1 || { echo "!!! REVERSÃO do antigo falhou (dry-run):"; grep -nE "FAILED|failed|Hunk" "$R/dry.out" | head; return 7; }
      patch -p$(pl "$oldf") -F0 -R -f --no-backup-if-mismatch -d "$T" < "$oldf" > "$R/apply.out" 2>&1 || { echo "!!! reversão falhou"; return 7; }
      printf '%s\t%s\t%s\t%s\t%s\n' "$old" "$item" "$oldf" "revertido" "$(date +%T)" >> "$APLIC"
    fi
    if ! sanidade "$f"; then echo "PATCH REPROVADO (caminho perigoso, acima): $f"; return 2; fi
    if patch -p$(pl "$f") -F0 -R --dry-run -s -f -d "$T" < "$f" >/dev/null 2>&1; then
      echo "já aplicado (reverso confere): $(basename "$f")"; printf '%s\t%s\t%s\t%s\t%s\n' "$sha" "$item" "$f" "ja-aplicado" "$(date +%T)" >> "$APLIC"; continue; fi
    echo ">> dry-run: $f"
    if ! patch -p$(pl "$f") -F0 --dry-run -f --no-backup-if-mismatch -d "$T" < "$f" > "$R/dry.out" 2>&1; then
      echo "!!! DRY-RUN FALHOU em $f (item $item) — hunks:"; grep -nE "FAILED|failed|can't find|Reversed|Hunk" "$R/dry.out" | head -30; echo "(saída completa: $R/dry.out)"; return 3; fi
    patch -p$(pl "$f") -F0 -f --no-backup-if-mismatch -d "$T" < "$f" > "$R/apply.out" 2>&1 || { echo "!!! APPLY falhou após dry-run OK: $f"; cat "$R/apply.out"; return 4; }
    mkdir -p "$R/aplicados"; cp "$f" "$R/aplicados/$sha-$b"
    printf '%s\t%s\t%s\t%s\t%s\n' "$sha" "$item" "$f" "aplicado" "$(date +%T)" >> "$APLIC"
    echo "aplicado: $(basename "$f") (item $item)"
  done < <(descobre)
  [ "$n" = 0 ] && echo "nenhum patch encontrado ainda"; return 0
}
completo_itens() { # cobertura exigida: 2..9, 11, 12, 13, 13b, 15, 15b e crit9 (+1, salvo no modo pre01). Itens 10, 14 e 16 estão FORA da 1.2.30 (decisão do Fiscal).
  local falt="" i req="2 3 4 5 6 7 8 9 11 12 13 13b 15 15b crit9"; [ "$MODO" = pre01 ] || req="1 $req"
  for i in $req; do efetivos | awk -F'\t' -v i="$i" '("," $2 ",") ~ ("," i ","){f=1} END{exit !f}' || falt="$falt $i"; done
  if [ -n "$falt" ]; then echo "ITENS SEM PATCH REGISTRADO:$falt"; return 1; fi; echo "cobertura: itens [$req] presentes (modo $MODO)"; return 0; }
if [ "$PATCHES_ON" = 1 ]; then
  fase "1-patches"; verifica_aprovados; RC=$?; [ $RC = 0 ] && { restaura_soltas; RC=$?; }; [ $RC = 0 ] && { integra; RC=$?; }; fim
  [ $RC != 0 ] && { echo "PARADO na fase de patches (rc=$RC)."; exit $RC; }
  completo_itens; CI=$?
  if [ "$MODO" = patches ]; then echo "modo patches: fim."; exit 0; fi
  if [ $CI != 0 ] && [ "${PERMITE_INCOMPLETO:-0}" != 1 ]; then echo "PARADO: conjunto incompleto (use PERMITE_INCOMPLETO=1 só com autorização)."; exit 5; fi
fi

# ---------------- fase 2: bump ----------------
fase "2-bump-versao"; [ "$MODO" = pre01 ] && export NOV_ARQ="$S/novidades-1.2.30-pre01.html"; "$S/bump-versao.sh" "$VER" "$VC" "$T" || morre bump; fim

# ---------------- fase 3: build web ----------------
fase "3-npm-run-build"; (cd "$T" && npm run build) > "$R/build-$MODO.log" 2>&1 || { tail -30 "$R/build-$MODO.log"; morre "npm run build"; }
ls "$T"/dist/assets | grep -E '^index-.*\.js$'; fim
# ---------------- fase 4: cap sync ----------------
fase "4-cap-sync"; (cd "$T" && npx cap sync android) > "$R/capsync-$MODO.log" 2>&1 || { tail -30 "$R/capsync-$MODO.log"; morre "cap sync"; }; fim
# ---------------- fase 5: gradle ----------------
fase "5-gradle-assembleRelease"; (cd "$T/android" && ./gradlew assembleRelease) > "$R/gradle-$MODO.log" 2>&1 || { tail -40 "$R/gradle-$MODO.log"; morre gradle; }
tail -3 "$R/gradle-$MODO.log"; fim
# ---------------- fase 6: APK + checagens ----------------
fase "6-apk-checagens"
cp "$T/android/app/build/outputs/apk/release/app-release.apk" "$APK" || morre "copia APK"
CHK="$R/checagens-$MODO.txt"; : > "$CHK"; c() { echo "$*" | tee -a "$CHK"; }
SHA=$(sha256sum "$APK" | cut -d' ' -f1); SZ=$(stat -c %s "$APK"); c "sha256 $SHA"; c "tamanho $SZ"
[ "$SHA" = "$(sha256sum "$T/android/app/build/outputs/apk/release/app-release.apk" | cut -d' ' -f1)" ] && c "copia: sha confere" || { c "copia: SHA DIVERGE"; FALHA=1; }
if unzip -tq "$APK" > "$R/unzip-$MODO.txt" 2>&1; then c "unzip -t: $(tail -1 "$R/unzip-$MODO.txt")"; else c "unzip -t: FALHOU"; FALHA=1; fi
B=$("$BT/aapt" dump badging "$APK" 2>/dev/null); VCA=$(sed -n "s/.*versionCode='\([0-9]*\)'.*/\1/p" <<<"$B"|head -1); VNA=$(sed -n "s/.*versionName='\([^']*\)'.*/\1/p" <<<"$B"|head -1)
c "aapt: pacote $(sed -n "s/^package: name='\([^']*\)'.*/\1/p" <<<"$B") vc=$VCA vn=$VNA"; { [ "$VCA" = "$VC" ] && [ "$VNA" = "$VER" ]; } || { c "VERSÃO DIVERGE (esperado $VER/$VC)"; FALHA=1; }
PERMS=$(sed -n "s/^uses-permission: name='\([^']*\)'.*/\1/p" <<<"$B" | sort -u); c "permissões: $(echo $PERMS)"
BAD=$(grep -vE '^android\.permission\.VIBRATE$|DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION$' <<<"$PERMS"); { [ -z "$BAD" ] && grep -q VIBRATE <<<"$PERMS"; } || { c "PERMISSÕES EXTRAS: $BAD"; FALHA=1; }
"$BT/apksigner" verify --verbose --print-certs "$APK" > "$R/apksigner-$MODO.txt" 2>&1; AS=$?; c "apksigner rc=$AS: $(grep -E 'Verifies|v1 scheme|v2 scheme|v3 scheme' "$R/apksigner-$MODO.txt" | tr '\n' ' ')"
C256=$(sed -n 's/.*certificate SHA-256 digest: //p' "$R/apksigner-$MODO.txt" | head -1); c "cert SHA-256 $C256"
{ [ $AS = 0 ] && [ "$C256" = "$CERT256" ]; } || { c "ASSINATURA/CERT NÃO CONFERE"; FALHA=1; }
KS=$(unzip -l "$APK" | grep -iE 'keystore|\.jks|\.p12|\.pfx|\.pem|debug\.key' || true); [ -z "$KS" ] && c "keystore no APK: nenhum" || { c "KEYSTORE NO APK: $KS"; FALHA=1; }
fim
# ---------------- fase 7: verifica ----------------
fase "7-verifica"
VOUT=$("$S/verifica-1230.sh" "$APK" "$VER" "$VC" /workspace/release-1230/base-assets-1.2.29 "$R/verifica-$MODO" 2>&1); echo "$VOUT" | tail -3
VF=$(echo "$VOUT" | grep -oE '\([0-9]+ FAIL\)' | tail -1); c "verifica.sh: $VF  $(echo "$VOUT" | tail -1)"; [ "$VF" = "(0 FAIL)" ] || FALHA=1
fim
# ---------------- fase 7b: regras preservadas (identificação por radar) e colisão ----------------
fase "7b-radar-e-colisao"
RB="$R/base-run"
if [ -d "$RB/src" ]; then
  # (a) fonte: item 11 muda SÓ as linhas anon0/info do rótulo 3D (+1 import); deteccao.js e PARAM.deteccao continuam idênticos
  ML(){ grep -E "const anon0 =|const info = !inim" "$1/src/modernNavalCombat3D.js" | sed -E 's#/\*[^*]*\*/##g; s/ \|\| \(n\.radarAtivo && c\.q >= 2 && Math\.hypot\(c\.x - n\.x, c\.z - n\.z\) < alcRadarAlvo\(n, q\)\)//; s/ +/ /g; s/ ;/;/g' | md5sum | cut -c1-12; }
  [ "$(ML "$RB")" = "$(ML "$T")" ] && c "rótulo 3D: linhas anon0/info só diferem pela regra do item 11 (radar do jogador ligado + q>=2 dentro do alcance de radar do alvo); regra de 7 km/trava intacta" || { c "rótulo 3D: linhas anon0/info mudaram ALÉM do item 11 — PARAR e reportar o hunk"; FALHA=1; }
  grep -q "alcRadarAlvo(n, q)" "$T/src/modernNavalCombat3D.js" && c "item 11 presente no rótulo 3D" || { c "item 11 AUSENTE no rótulo 3D"; FALHA=1; }
  [ "$(md5sum < "$RB/src/sim/deteccao.js")" = "$(md5sum < "$T/src/sim/deteccao.js")" ] && c "deteccao.js: igual" || { c "deteccao.js MUDOU"; FALHA=1; }
  [ "$(sed -n '/^  deteccao:/,/},/p' "$RB/src/armasParametros.js" | md5sum)" = "$(sed -n '/^  deteccao:/,/},/p' "$T/src/armasParametros.js" | md5sum)" ] && c "PARAM.deteccao: igual" || { c "PARAM.deteccao MUDOU"; FALHA=1; }
  # (b) teste do item 11 (expressões REAIS do rótulo x contatos da sim, 3 mapas + furtivo): radar ON sem trava identifica o que o radar detecta; radar OFF = 1.2.29; furtivo/fora de alcance continua anônimo
  cp "$S/radar-teste-1230.mjs" "$T/_radar.mjs"
  (cd "$T" && BASE_ROOT="$RB" node _radar.mjs > "$R/radar-novo-$MODO.json" 2>&1); RRC=$?; rm -f "$T/_radar.mjs"
  [ "$RRC" = 0 ] && c "item 11 (radar ON sem trava identifica; radar OFF = 1.2.29; furtivo respeitado): $(cut -c1-300 "$R/radar-novo-$MODO.json")" || { c "item 11: TESTE FALHOU (ver $R/radar-novo-$MODO.json)"; FALHA=1; }
  # (c) colisão (penetração): teste existente, 8 mapas × 300 s
  (cd "$T" && node tests/colisaoTerreno-baseline.mjs > "$R/colisao-$MODO.out" 2>&1); CT=$(tail -1 "$R/colisao-$MODO.out"); c "colisão terreno (tests/colisaoTerreno-baseline.mjs): $CT"
  echo "$CT" | grep -q '"totAv":0,"totNav":0' || { c "COLISÃO: penetração ≠ 0/0"; FALHA=1; }
  # msPerTick contra a 1.2.29 (mesmo teste, em sequência, mesma máquina; anotar a carga)
  c "carga da máquina antes do teste da base: $(uptime | sed 's/.*load average: //') (nproc $(nproc))"
  (cd "$RB" && node tests/colisaoTerreno-baseline.mjs > "$R/colisao-base-$MODO.out" 2>&1)
  MS(){ grep -oE '"msPerTick":[0-9.]+' "$1" | cut -d: -f2 | awk '{s+=$1;n++} END{if(n)printf "%.4f",s/n}'; }
  c "msPerTick médio (8 mapas): árvore $(MS "$R/colisao-$MODO.out") x base 1.2.29 $(MS "$R/colisao-base-$MODO.out") ms/tick; carga depois: $(uptime | sed 's/.*load average: //')"
else c "AVISO: $RB ausente — checagens 7b puladas"; FALHA=1; fi
fim
# ---------------- fase 7d: item 12 (7 s da nuke no fim da partida, arrancamento parcial do convés) ----------------
fase "7d-item12"
if efetivos | awk -F'\t' '("," $2 ",") ~ /,12,/{f=1} END{exit !f}'; then
  (cd "$T" && SRC="$T/src" node /workspace/release-1230/item12/nuke7s-teste.mjs) > "$R/item12-nuke7s-$MODO.txt" 2>&1; I12A=$?
  (cd "$T" && SRC="$T/src" node /workspace/release-1230/item12/convoo-teste.mjs) > "$R/item12-convoo-$MODO.txt" 2>&1; I12B=$?
  [ "$I12A" = 0 ] && c "item 12 nuke7s-teste.mjs: OK ($(tail -n1 "$R/item12-nuke7s-$MODO.txt"))" || { c "item 12 nuke7s-teste.mjs: FALHOU (ver $R/item12-nuke7s-$MODO.txt)"; FALHA=1; }
  [ "$I12B" = 0 ] && c "item 12 convoo-teste.mjs: OK ($(tail -n1 "$R/item12-convoo-$MODO.txt"))" || { c "item 12 convoo-teste.mjs: FALHOU (ver $R/item12-convoo-$MODO.txt)"; FALHA=1; }
else c "item 12: patch ainda não registrado — testes pulados"; FALHA=1; fi
fim
# ---------------- fase 8: diff ----------------
fase "8-diff-base"
python3 "$S/gera-diff-1230.py" "$BASE" "$T" "$DIFFOUT"; fim
# ---------------- fase 9: relatório ----------------
fase "9-relatorio"; python3 "$S/relatorio-1230.py" "$REL" "$VER" "$VC" "$APK" "$CHK" "$TIMES" "$APLIC" "$DIFFOUT" "$R"; fim
echo "APK:  $APK"; echo "sha:  $SHA"; echo "diff: $DIFFOUT"; echo "rel:  $REL"

# ---------------- fase 10: UNIT (lock) ----------------
if [ "$MODO" = ensaio ] || [ "${SEM_UNIT:-0}" = 1 ]; then echo "UNIT pulada ($MODO / SEM_UNIT)."; UNITRES="não executada"
else
  fase "10-unit"; LOCK=/tmp/chrome-medicao.lock; MEU="Architect $$ $(date +%H:%M:%S)"
  while true; do
    if ! pgrep -f "tests/unit.mjs|user-data-dir=/tmp/nns" >/dev/null && mkdir "$LOCK" 2>/dev/null; then echo "$MEU" > "$LOCK/dono"; break; fi; sleep 3; done
  trap 'grep -q "^Architect $$" "$LOCK/dono" 2>/dev/null && rm -rf "$LOCK"' EXIT
  echo "lock obtido $(date +%T)"; (cd "$T" && timeout 2400 node tests/unit.mjs) > "$R/unit-$VER.log" 2>&1; URC=$?
  grep -q "^Architect $$" "$LOCK/dono" 2>/dev/null && rm -rf "$LOCK"; echo "lock liberado $(date +%T)"
  UNITRES="rc=$URC: $(grep -E '[0-9]+ passaram, [0-9]+ falharam' "$R/unit-$VER.log" | tail -1)"; [ "$URC" = 0 ] || FALHA=1
  fim; echo "UNIT $UNITRES"; echo "UNIT	$UNITRES" >> "$TIMES"
  python3 "$S/relatorio-1230.py" "$REL" "$VER" "$VC" "$APK" "$CHK" "$TIMES" "$APLIC" "$DIFFOUT" "$R" "$UNITRES"
fi
[ $FALHA = 0 ] && echo "RESULTADO: VERDE" || echo "RESULTADO: VERMELHO (ver checagens: $CHK)"
exit $FALHA
