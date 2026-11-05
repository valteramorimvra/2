# PROGRESSO 1.2.27 (vc30)

## APK
- `/workspace/NexoNavalStrike-1.2.27.apk` · 15.136.295 B · sha256 `be759da7162c74837f7e237a45c70f280330b87d979ac45105e980e57315e948`
- vc30 / 1.2.27 · VIBRATE only (+ DYNAMIC_RECEIVER androidx interna) · apksigner v1+v2 OK · cert `d0c31791…a599` (mesma debug.keystore)
- dist `index-Cossoiar.js` · anexo `/workspace/attachments/nexo-naval-strike-1.2.27-vc30.apk`

## (a) Som canhão 14 novos — A/B
- Prova: `capturas1227/som_ab_espectro.txt` + `som_audit.txt`
- 14/14 mapeamento calibre OK (76→médio, 127/155→grande); 3 railgun (aparados/neblina/canastra) som próprio `canhao_trilho` + grave/camada
- Convencionais = MESMO buffer PCM dos antigos do calibre; antigos inalterados

## (b) Varredura 14 navios jogador
- `tests/navios1227-scan.mjs` → TOTAL falhas **0** (`capturas1227/navios-scan.json`)
- jalapao, ilhagrande, pantanal, serramar, abrolhos, costaverde, ilhabela, jericoacoara, aparados, itatiaia, neblina, canastra, chapada, lencois — movimento/armas/aéreo/HUD sem NaN

## (c) Novidades 1.2.27 + crédito Valter Amorim
- Manual: câmeras 1.2.24+4 novas sem zoom; som canhões; bomba atômica; PA ondas; **pilotagem nuclear no celular**

## (d) Testes
- `npm test` unit sozinha ≤2400 s: **76 passaram / 0 falharam**
- `nuclear1226.mjs`: 9/9 (MC escolta 40/40)
- `nkManual1226.mjs`: falhas []
- `camera1227-final.mjs`: OK (zoomLock, ciclo, céu, 5×3)
- `nkToque1227.mjs` (TouchEvent real, 4 resoluções): **0 falhas** — manche→manual, virar/subir, camOrbit, camCeu, iaToggle, trava, espera

## BUG celular (Valter 23:25) — CAUSA CONFIRMADA + correção
1. **PILOTAR entrava com IA ligada** e `nkCtl` só era enviado com `manual=1` → manche movia o cursor mas o avião não respondia (teste antigo injetava `hud.nkJ` / comandos, mascarando o bug).
2. **Lista de exclusão da câmera** em `#hud` tinha `.hl-joy` mas **não `.nk-joy`/`.nk-bts`** → arraste podia roubar o manche no WebView.
3. **Manche** usava `pointermove` só no elemento + `setPointerCapture` sem try/catch → falha comum em WebView Android.
4. **`nkCam` chase fixo** — sem órbita 360° por arraste.

Correção 1.2.27: auto-MANUAL no 1º desvio do manche; exclusão `.nk-joy`/`.nk-bts`; move/up no `window`; câmera NK órbita livre (sem zoom, pitch água→céu), joy numa área / arraste no resto.

## Lacunas honestas
- Prova de som A/B é headless (espectro/RMS/cauda em arquivo); não re-gravada em dispositivo físico nesta sessão.
- `nkToque1227` usa Chrome headless + `Input.dispatchTouchEvent` (emulação touch), não aparelho físico do Valter — causa/fix confirmados no caminho de código + 4 resoluções.
- LANÇAR (soltar bomba) não foi exigido até detonação no teste de toque (prova TRAVAR/IA/manche/câmera/ESPERA); ciclo completo de soltura já coberto por `nkManual1226` + `nuclear1226`.
