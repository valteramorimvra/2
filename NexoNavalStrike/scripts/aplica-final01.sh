#!/usr/bin/env bash
# UM PASSO: aplica o FINAL-01 aprovado (sha256 informado), refaz patches+build+APK+checagens e gera o APK FINAL.
# Uso: aplica-final01.sh <sha256-completo-aprovado> [caminho-do-diff]    (SEM_UNIT=0 para rodar a UNIT no fim; padrão: pula)
# Saída: /workspace/NexoNavalStrike-1.2.30.apk (+ relatório e diff). O APK pré-01 fica em /workspace/NexoNavalStrike-1.2.30-pre01.apk.
set -euo pipefail
SHA="${1:?sha256 completo aprovado do FINAL-01}"; F="${2:-/workspace/fiscal/nukefumaca/patches/FINAL-01-cogumelo.diff}"
S=/workspace/nexo-naval-strike/scripts; L="$S/aprovados-1230.txt"
[ -f "$F" ] || { echo "ERRO: $F não existe"; exit 2; }
[ "${#SHA}" = 64 ] || { echo "ERRO: informe o sha256 completo (64 hex)"; exit 2; }
[ "$(sha256sum "$F" | cut -d' ' -f1)" = "$SHA" ] || { echo "ERRO: sha256 do arquivo ($(sha256sum "$F" | cut -d' ' -f1)) difere do aprovado ($SHA) — NADA aplicado"; exit 9; }
if grep -qF "$F" "$L"; then echo "FINAL-01 já está na lista branca"; else
  cp "$L" "/workspace/release-1230/aprovados-1230.antes-final01-$(date +%H%M%S)"
  awk -v ln="$(printf '%s\t%s\t%s' "$F" "$SHA" 1)" '{print} /04-aeronave-luzes\.diff/{print ln}' "$L" > "$L.novo" && grep -qF "$F" "$L.novo" || { rm -f "$L.novo"; echo "ERRO: âncora 04-aeronave-luzes não achada na lista"; exit 3; }
  mv "$L.novo" "$L"; echo "lista branca: FINAL-01 adicionado ($SHA)"; fi
pl() { local x; x=$(grep -m1 '^+++ ' "$1" | awk '{print $2}'); case "$x" in a/*|b/*) echo 1;; *) echo 0;; esac; }
# pré-teste em cópia (dry-run sem fuzz) antes de tocar a árvore real
P=/workspace/release-1230/preflight01; rm -rf "$P"; mkdir -p "$P"
(cd /workspace/nexo-naval-strike && tar --exclude=./node_modules --exclude=./dist --exclude=./android --exclude='./capturas*' -cf - .) | tar -C "$P" -xf -
(cd "$P" && patch -p$(pl "$F") -F0 --dry-run --no-backup-if-mismatch < "$F") || { echo "ERRO: dry-run (sem fuzz) do FINAL-01 falhou na árvore atual — PARAR e reportar o hunk"; exit 4; }
cp "$S/release-1230.sh" /workspace/release-1230/release-1230.run.sh; sed -i 's#^S="$(cd.*#S=/workspace/nexo-naval-strike/scripts#' /workspace/release-1230/release-1230.run.sh
cd /workspace; SEM_UNIT="${SEM_UNIT:-1}" exec bash /workspace/release-1230/release-1230.run.sh completo
