# Nexo Naval Strike 3D 1.2.31 (vc34) — relatório

## Patches (ordem da whitelist com-navios, 14 linhas)
item1 1d304a95… · item2 861c3a52… · item3 daa76148… · item4 e60c7b10… · item5 81e2384d… · item6 825f5a36… · item3b 783fba88… · item6b 28edeab1… · item4b e44a5aec… · navios 58ea19ad (integracao + tar b786ed77…) · manual v1/v3/v4.

## Verificações
- UNIT combo (itens + 3b/6b/4b + navios + manual): 77 passaram, 0 falharam (medidas/unit-combo-final.log). Baseline colisaoTerreno: totAv 0, totNav 0 (8 mapas).
- Item 4: 974 lançamentos / 974 oportunidades com trava válida (100%): montanha 228/228, costa 62/62, perto 300/500/1000 m 228/228 cada; impactos no terreno 8 (1.2.30) → 5; por navio nunca acima da 1.2.30.
- Som: 76 mm +7,0 dB, 127 mm +7,2 dB, 305 mm +5,5 dB; CIWS −16,52 (1.2.30: −16,59), motor −19,99 (−19,87); nuke a 2 km +5,9 dB, grave 120 Hz +4,3 dB; clip 0, pico −0,89 dBFS.
- Energia >12 kHz (127 mm): oversample 4x 11,87/11,57 dB × none 11,82/11,61 dB (≈0 dB; limite +3) → mantido none (pico −0,89 dBFS; 4x chegou a −0,16 dBFS).
- Item 5 (hudQuadro, 8×8 agrupado, laço síncrono 3000 chamadas, ordem alternada): 1.2.30 p95 0,8/0,8 ms, média 0,35/0,32; combo p95 1,1/1,0 ms, média 0,52/0,50 (+0,2 a +0,3 ms p95; +0,17 ms média) com o DOBRO de etiquetas (14 × 7).

## Limitações registradas
1. Item 1: em 16:9 e em retrato o botão dos aviões fica logo abaixo do olho (limitação de espaço).
2. Item 3: 305 mm (+5,5 dB) e 30 mm (+4 dB) ficam abaixo de +6 dB (teto do mixer/pico −0,89 dBFS; o 305 mm já estava a −8,99 dBFS).
3. Item 6: o limitador do master chega a −6,8 dB só quando a nuke e 5 canhões de 305 mm tocam juntos (1.2.30: −12,7 dB só com os 5 canhões); grave +4,3 dB (< +5,9 dB do RMS).
4. Nakhimov: +1 a +3 ms p95 em headless (SwiftShader); causa medida: custo nativo de upload de uniforms em WebGLRenderer.render (uniformMatrix4fv +0,66 ms e uniformMatrix3fv +0,22 ms), não JS de simulação (+0,2 ms); correção na 1.2.32 (evidência: navios1231/bancada/prints/_crit9/).
5. Navios novos "inspirados no Sejong, no Type 055 e no Nakhimov"; detalhamento continua na 1.2.32.
6. Item 5: em headless por quadro (≈135 amostras, SwiftShader) a média do hudQuadro sobe ≈ +0,9 ms (7→14 etiquetas) e o p95 oscila de 8,0–10,0 ms sem tendência; só o laço síncrono resolve o delta (resolução do timer 0,1 ms).

## Artefatos
- APK: /workspace/NexoNavalStrike-1.2.31.apk (cópia em .../c98e0fb9-cd2b-49e7-9b39-7bb4ba2b1e4b/attachments/). sha256 123a619fef6db49f2e0d7c1f1866e2dbb92a7a66b965bf1d26f5f8a6e8e5ac55 · 26511923 bytes · variante com-navios (primária).
- br.com.valteramorim.nexonaval · versionCode 34 · versionName 1.2.31 · permissões: VIBRATE + DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION (interna); sem INTERNET; sem keystore no APK; `unzip -t` sem erros.
- apksigner verify (v1+v2) OK, cert SHA-256 d0c31791ddd24b04f792bd152d59bda85120523e6f523dabd50a246713d9a599 (mesma chave).
- Diff 1.2.30 → 1.2.31: /workspace/NexoNavalStrike-1.2.30-para-1.2.31.diff (fontes; sem bundles de build).
- Release rodado com SEM_UNIT=1: o UNIT 77/0 e a baseline 0/0 foram feitos no combo-1231 IDÊNTICO ao src montado pelo release (`diff -r` do src vazio antes do build; mesmos 14 shas da whitelist). Após o bump, só `src/main.js` difere do combo (bloco Novidades 1.2.31 inserido pelo bump). A baseline foi rodada de novo dentro do release: totAv 0, totNav 0, 8 mapas.
- Item 5 ficou em +0,2 a +0,3 ms (no limite do +0,3 ms).
- Itens 10, 14 e 16 adiados para a 1.2.32.

## Lacunas visuais (1.2.32)
- superfícies procedurais cinza em blocos, sem tinta escorrida nem soldas reais;
- fachada do Nakhimov mais simples que a do Kirov real: faltam antenas, radomes, ESM e botes;
- Nanchang com mastro integrado e AESA simplificados e pouco equipamento no hangar e no teto;
- Sejong com mastro simplificado e tampas do K-VLS em grade regular;
- sem escadas nas faces inclinadas do Sejong e do Nanchang;
- faces das torres aproximadas;
- quina da proa só geométrica.
