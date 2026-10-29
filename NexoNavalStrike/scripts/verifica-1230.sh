#!/usr/bin/env bash
# Cópia parametrizada de /workspace/fiscal/verif1229/verifica.sh (lógica dos checks inalterada).
# Uso: verifica-1230.sh <apk> <versionName> <versionCode> [dir-base-assets] [dir-saida]
# Só escreve no dir de saída.
set -u
APK="${1:-/workspace/NexoNavalStrike-1.2.30.apk}"; VER_ESP="${2:-1.2.30}"; VC_ESP="${3:-33}"
D="${5:-/workspace/release-1230/verifica}"; BASE="${4:-/workspace/release-1230/base-assets-1.2.29}"; mkdir -p "$D"
AAPT=/workspace/android-sdk/build-tools/35.0.0/aapt2
CERT_OK="D0:C3:17:91:DD:D2:4B:04:F7:92:BD:15:2D:59:BD:A8:51:20:52:3E:6F:52:3D:AB:D5:0A:24:67:13:D9:A5:99"
H=$(date +%Y%m%d-%H%M%S); OUT="$D/CHECK-$H.md"; W="$D/work-$H"; mkdir -p "$W"
NF=0; FC="$W/fails"; : >"$FC"; r(){ echo "$1" >>"$OUT"; }; st(){ if [ "$1" = 0 ]; then echo PASS; else echo x >>"$FC"; echo FAIL; fi; }
echo "# CHECK $APK ($H)" >"$OUT"
[ -f "$APK" ] || { r "FAIL: APK não encontrado"; exit 1; }
# 1
SZ=$(stat -c %s "$APK"); SHA=$(sha256sum "$APK"|cut -d' ' -f1)
r "## 1 Tamanho/sha: $( [ "$SZ" -gt 0 ]; st $?) — $SZ B, sha256 $SHA"
# 2
B=$("$AAPT" dump badging "$APK" 2>/dev/null)
PK=$(sed -n "s/^package: name='\([^']*\)'.*/\1/p" <<<"$B"); VC=$(sed -n "s/.*versionCode='\([0-9]*\)'.*/\1/p" <<<"$B"|head -1); VN=$(sed -n "s/.*versionName='\([^']*\)'.*/\1/p" <<<"$B"|head -1)
[ "$PK" = br.com.valteramorim.nexonaval ] && [ "${VC:-0}" = "$VC_ESP" ] && [ "$VN" = "$VER_ESP" ]; r "## 2 Pacote/versão: $(st $?) — $PK vc=$VC vn=$VN"
# 3
FP=$(unzip -p "$APK" 'META-INF/*.RSA' | openssl pkcs7 -inform DER -print_certs 2>/dev/null | openssl x509 -noout -fingerprint -sha256 2>/dev/null | cut -d= -f2)
[ "$FP" = "$CERT_OK" ]; r "## 3 Cert: $(st $?) — $FP"
# 4
PERMS=$(sed -n "s/^uses-permission: name='\([^']*\)'.*/\1/p" <<<"$B" | sort -u)
BAD=$(grep -vE '^android\.permission\.VIBRATE$|DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION$' <<<"$PERMS")
[ -z "$BAD" ] && grep -q VIBRATE <<<"$PERMS"; r "## 4 Permissões: $(st $?) — $(echo $PERMS)${BAD:+ | extras: $(echo $BAD)}"
# 5
unzip -qo "$APK" 'assets/*' -d "$W/novo"
( cd "$BASE" && find assets -type f -exec md5sum {} + | sort -k2 ) >"$W/b.md5"
( cd "$W/novo" && find assets -type f -exec md5sum {} + | sort -k2 ) >"$W/n.md5"
REM=$(join -1 2 -2 2 -v1 <(sort -k2 "$W/b.md5") <(sort -k2 "$W/n.md5") | awk '{print $1}')
ADD=$(join -1 2 -2 2 -v2 <(sort -k2 "$W/b.md5") <(sort -k2 "$W/n.md5") | awk '{print $1}')
ALT=$(join -1 2 -2 2 <(sort -k2 "$W/b.md5") <(sort -k2 "$W/n.md5") | awk '$2!=$3{print $1}')
REMR=$(grep -vE 'assets/index-[^/]*\.(js|css)$' <<<"$REM" | sed '/^$/d')
[ -z "$REMR" ]; r "## 5 Assets: $(st $?) — removidos $(grep -c . <<<"$REM"), adicionados $(grep -c . <<<"$ADD"), alterados $(grep -c . <<<"$ALT")"
r "Removidos (exceto bundle = FAIL):"; r '```'; r "$REM"; r '```'; r "Adicionados:"; r '```'; r "$ADD"; r '```'; r "Alterados:"; r '```'; r "$ALT"; r '```'
# 6
JN=$(ls "$W"/novo/assets/public/assets/index-*.js | head -1); JB=$(ls "$BASE"/assets/public/assets/index-*.js | head -1)
O6=$(python3 - "$JB" "$JN" <<'PY'
import re,sys
def kv(p):
    s=open(p,encoding='utf-8',errors='ignore').read()
    m=re.search(r'ajustes:\{([^{}]*)\}',s); d={}
    if m:
        for part in re.split(r',(?=[A-Za-z_$][\w$]*:)',m.group(1)):
            k,_,v=part.partition(':'); d[k.strip()]=v.strip()
    ks=set(re.findall(r'data-k="([A-Za-z_]\w*)"',s))
    return d,ks
(bd,bk),(nd,nk)=kv(sys.argv[1]),kv(sys.argv[2])
rem=sorted(set(bd)-set(nd)); remk=sorted(bk-nk); add=sorted(set(nd)-set(bd)); addk=sorted(nk-bk)
mud=[f"{k}: {bd[k]} -> {nd[k]}" for k in bd if k in nd and bd[k]!=nd[k]]
print("STATUS", 1 if (rem or remk or mud or not nd) else 0)
print("ajustes removidas:",rem); print("data-k removidas:",remk); print("padrões mudados:",mud)
print("ajustes adicionadas:",add); print("data-k adicionadas:",addk); print(f"total ajustes base {len(bd)} novo {len(nd)}")
PY
)
S6=$(sed -n 's/^STATUS //p' <<<"$O6"); r "## 6 Opções: $(st "${S6:-1}")"; r '```'; r "$(grep -v ^STATUS <<<"$O6")"; r '```'
# 7
LIST=$( (grep -E '\.ogg$' <<<"$ADD"; grep -E '\.ogg$' <<<"$ALT") | sed '/^$/d'); F7=0; L7=""
while read -r f; do [ -z "$f" ] && continue
  mv=$(ffmpeg -hide_banner -nostats -i "$W/novo/$f" -af volumedetect -f null - 2>&1 | sed -n 's/.*max_volume: \(-\?[0-9.]*\) dB.*/\1/p')
  if awk -v v="${mv:-99}" 'BEGIN{exit !(v>-1)}'; then F7=1; L7+="$f $mv dB"$'\n'; fi
done <<<"$LIST"
r "## 7 Picos OGG ($(grep -c . <<<"$LIST") arquivos): $(st $F7)"; [ -n "$L7" ] && { r '```'; r "$L7"; r '```'; }
# 8 (só strings visíveis: dentro de aspas/template e com palavra isolada)
P='sangue|dem[oô]nio|diabo|inferno|caveira|\bdeus\b|\bsanto\b|\banjo\b|senhor dos mares|ilusionista|olho do c[eé]u'
O8=$(grep -oiP "[\"'\`>][^\"'\`<>]{0,60}($P)[^\"'\`<>]{0,60}[\"'\`<]" "$JN" | grep -viE "Esp[ií]rito Santo|^>[^\"]*[a-z_]+:\{nome:\"$" | sort -u | head -50)
[ -z "$O8" ]; r "## 8 Palavras proibidas: $(st $?)"; [ -n "$O8" ] && { r '```'; r "$O8"; r '```'; }
# 9 (só reporta)
r "## 9 nkCam (informativo)"; r '```'
grep -oP 'nkCam\([A-Za-z]\)\{.{0,600}' "$JN" | head -1 >"$W/nk.txt"
r "$(cat "$W/nk.txt")"; r "--- interp (acc/DT/alpha/Math.min(1,X*k)):"; r "$(grep -oP '(acc|DT|alpha|Math\.min\(1,[A-Za-z]\*[0-9.]+\))' "$W/nk.txt" | sort | uniq -c | tr '\n' ' ')"
r "--- 40 em nkCam: $(grep -oP '.{0,40}\b40\b.{0,40}' "$W/nk.txt" | head -3 | tr '\n' ' ')"; r '```'
NF=$(wc -l <"$FC"); r ""; r "**Resumo: $NF FAIL**"
echo "$OUT ($NF FAIL)"
