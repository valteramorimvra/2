# PROGRESSO 1.2.28 (vc31)

## APK
- `/workspace/NexoNavalStrike-1.2.28.apk` · 15.138.067 B · sha256 `616d44ed7ca82afa5c8325d25580aa8794dc1b93cd00edc65344be9f29b6b689`
- vc31 / 1.2.28 · VIBRATE only (+ DYNAMIC_RECEIVER androidx interna) · apksigner v1+v2 OK · cert `d0c31791…a599` (mesma debug.keystore)
- dist `index-B5i8kqDY.js` · anexo `/workspace/attachments/nexo-naval-strike-1.2.28-vc31.apk`
- unzip -t OK · aapt package br.com.valteramorim.nexonaval

## (1) Mira/tiro em todas as câmeras — CAUSA CONFIRMADA + fix
1. **Mira desligada** em popa/tresq/popaAlta/costado (1.2.27): após órbita o canhão ficava com azimute velho.
2. **Hit curto** do raio câmera→água ENTRE lente e casco invertia o bearing ~180° (“lado errado”).
- Fix: mira ligada em TODAS as cams de navio + correção hit curto (olhar horizontal além do navio).
- Testes: `mira1228.mjs` 72/72; `mira1228-touch.mjs` TouchEvent órbita 6 cams + yaw180 — **0 ladoErrado** (errLook 0–7,6°).

## (2) Câmeras externas mais perto (internas intactas)
| modo | 1.2.27 d/L | 1.2.28 d/L | nota |
|------|------------|------------|------|
| costado | 1.22 | **0.48** | ~90–98% largura em 915×412; elev ~5–10°; água no meio |
| popa | 1.00 | 0.65 | |
| tresq | 1.70 | 0.95 | |
| popaAlta | 1.15 | 0.72 | |
| perto | distL0.62+18 | distL0.48+12 fracao0.58 | |
| longe | L·2.2+120 | L·1.45+55 | |
| nkCam | 110 | **58** | bombardeiro |
| canhão/convés | — | **inalteradas** | |

A/B: `capturas1228/camera/` vs `capturas1227/camera/*costado*` + ref Valter `01M5XPGAM…jpg`. Medidas em `camera1228.json` (corsário fillApprox **0.98**).

## (3) Som canhões novos
- Railguns (aparados/neblina/canastra): `n5.tiro(canhao_grande)` = mesma cadeia PCM dos antigos 155 + trilho baixo.
- Convencionais: já MESMO_BANCO do calibre (sem mudança). Antigos idênticos.
- Prova: `capturas1228/som-ab.json` + `som_audit.txt`.

## (4) Bombardeiro
- Paiol 4; surtida 3; recarga 18 s ao pousar; thr 0–4 (telégrafo, mín 165 sem estol); mira solo (tap <350 ms); cam 58.
- `nkThr`/`nkMiraSolo` adicionados à allowlist `commands.js`.
- Teste: `bomber1228.mjs` falhas [].

## (5) Novidades 1.2.28 + “Responsável… Valter Amorim”
- Manual atualizado; crédito em Novidades e rodapé.

## Testes
- mira unit 72/72; mira touch 0 falhas; camera frame OK; bomber OK; som A/B listado.
- `npm test` unit (≤2400 s) — ver resultado abaixo / `capturas1228/unit.txt`.

## Lacunas honestas
- Torre ainda demora a convergir em arcos grandes (slew físico do calibre) — não é o bug do lado errado (mira=cam OK).
- Prova de som A/B headless (cadeia/comando), não re-gravada em aparelho físico.
- TouchEvent via Chrome headless CDP, não aparelho físico do Valter.
01:04:08 BRT

## Resultado unit (01:13 BRT)
- `npm test`: **76 passaram, 0 falharam** (~1155 s < 2400 s)

## Checklist Valter
- [x] Mira causa confirmada + fix + TouchEvent órbita
- [x] Cams externas mais perto (costado ~95%); internas OK; A/B vs ref + 1.2.27
- [x] Som railgun = cadeia grande dos antigos; convencionais/antigos intactos
- [x] Bomber multi + thr + mira solo + cam perto
- [x] Novidades 1.2.28 + crédito Valter
- [x] APK 1.2.28 vc31 sha/unzip/aapt/apksigner
01:13:27 BRT
