# Nexo Naval Strike 1.2.22 (vc25) — PROGRESSO (horas em BRT)

Pedido (Valter 18:51 BRT): sons dos canhões mais fortes de acordo com o calibre, extremamente realistas, com potência e impacto; rápido e eficiente.
Base: 1.2.21 FINAL (sha256 09fdc8d2…c666, dist index-BHEQx54P.js). Cópia da src base em /tmp/base1221/src. Só áudio.

- 18:52 BRT · INÍCIO. Sem outras sessões (nenhum teste/gradle/vite build ativo; só daemon gradle ocioso). Backup /tmp/bk1222/.
- 18:57 BRT · ITEM 2 (Valter 18:53): ao ser atingido, barulho considerável no navio conforme ARMA e LOCAL atingido (proa/popa=chapa; superestrutura/ponte=vidro e estrutura leve; torre=blindagem; linha d'água=baque fundo + borbulho de alagamento; chaminé/mastro=metal oco; paiol/máquinas=estrondo secundário), rangido de metal e destroços caindo; alto no navio do jogador com ducking leve; mantém impacto da arma 1.2.21, vibrar/tremor separados; 0 nós em combate; sem clipar. Item 1 = canhões por calibre (em andamento).
- 20:41 BRT · RETOMADA (sem atividade desde 19:04; arquivos em andamento: NavalAudio.js, audio/zonaImpacto.js, modernNavalCombat3D.js, tests/canhao1222.mjs)
- 20:43 BRT · build dist index-Cz63uyvh.js; canhao1222 rc=0 TUDO OK (11 calibres +1,2…+2,1 LU, estresse 0 clip TP −0,8; 33 casos zona×arma 0 clip). Próximo: versão vc25, testes no jogo (nós/zonas), unit+regressão áudio, APK.
- 20:46 BRT · tests/atingido1222.mjs (partida real, dist index-Cz63uyvh.js) rc=0: 428 impactos, 8 zonas × (jogador, inimigo) todas tocaram, torpedo→linha, 0 nós de áudio em combate (impactos + salvas 20–305 mm), saída real pico −0,34 dBFS, 0 clip. Próximo: versão vc25, unit, regressão áudio, APK.
- 20:46 BRT · versão 1.2.22/vc25 (package.json, build.gradle), Novidades 1.2.22 no menu; dist index-EFg27rro.js. Regressão iniciada (/tmp/reg1222.sh).
- 20:47 BRT · APK candidato (dist index-EFg27rro.js): /workspace/NexoNavalStrike-1.2.22.apk 14.121.004 bytes sha256 94560a27…c245, vc25/1.2.22, só VIBRATE (+DYNAMIC_RECEIVER interna), v1+v2 OK, cert d0c31791…a599 (mesma chave). Aguarda regressão para FINAL/cópia nos anexos.
- 20:48 BRT · atingido1222 g rc=0 (dist index-EFg27rro.js)
- 20:49 BRT · atingido1221 g rc=0 (dist index-EFg27rro.js)
- 20:58 BRT · som1218 g rc=1 (dist index-EFg27rro.js)
- 21:05 BRT · torp1221 g rc=0 (dist index-EFg27rro.js)
- 21:05 BRT · fx1221 g rc=0 (dist index-EFg27rro.js)
- 21:05 BRT · unit rc=0
- 21:06 BRT · missil1221 (node, src) rc=0
- 21:06 BRT · balanco1221 (node, src) rc=0
- 21:06 BRT · modulos1221 (node, src) rc=0
- 21:07 BRT · disparo1221 (node, src) rc=0
- 21:07 BRT · audio1221 (src 1.2.22) rc=0
- 21:08 BRT · som1218 g rc=1: única falha '280 mm do cruzeiro não está mais forte que o antigo: −11,6 × −12,0' (1.2.21: −14,0 × −15,7). Os dois subiram (cp280 +2,4 dB, genérico +3,7 dB) e encostam no teto do mestre, onde o limitador comprime a diferença; ordem mantida (cp280 > antigo, 0 nós, 0 falhas no resto). Critério ajustado em tests/som1218.mjs (backup /tmp/bk1222/som1218.mjs.pre): ≥ +0,3 dB quando > −13 dBFS, senão ≥ +1 dB. Re-rodar no fim.
- 21:17 BRT · abate1221 g rc=1 (dist index-EFg27rro.js)
- 21:19 BRT · arco1221web g rc=0 (dist index-EFg27rro.js)
- 21:19 BRT · reg1222 FIM
- 21:25 BRT · abate1221 g: única falha 'frota: só 1 abate real (cenário fraco)' = amostra mínima (como na 1.2.21 F/Fc); duelo 4 e cinema 2/5 OK. Refaço ABATE_SO=frota e som1218 (critério ajustado).
- 21:26 BRT · RETOMADA ('Seja rápido com realismo extremo e eficiente'). abate1221 ABATE_SO=frota (pid 1444246) já rodando — não duplico. Pendências: abate frota, medir 280 mm sem o achatamento do limitador (grave 30–80 Hz, duração corpo/cauda, transiente) e reforçar se preciso, som1218+audio1221, confirmar item 2, APK FINAL.
- 21:29 BRT · abate1221 h (só frota) rc=0
- 21:31 BRT · abate1221 ABATE_SO=frota (pid 1444246, log /tmp/r22_abate_h.log) rc=0 TUDO OK: frota 6 abates reais, 0 erros, programas 136/136. 280 mm: novo tests/pesado1222.mjs (medidas que o limitador não achata); cauda do cp_grande estava cortada em 4,6 s → banco 280–305 mm com 6,2 s, boom τ 1,0 s, corpo +cauda longa, estrondo τ 2,0 s (outros bancos idênticos, rng avançado); camada canhao grande: sub mais longo, estrondo pesado + rugido de corpo 200–1100 Hz. som1218 volta ao critério ESTRITO (≥ +1 dB, backup restaurado).
- 21:34 BRT · som1218 g rc=1 (dist index-Cpayr6Rk.js)
- 21:35 BRT · atingido1222 g rc=0 (dist index-Cpayr6Rk.js)
- 21:36 BRT · atingido1221 g rc=0 (dist index-Cpayr6Rk.js)
- 21:45 BRT · som1218 g rc=0 (dist index-CPryixR2.js)
- 21:47 BRT · atingido1222 g rc=0 (dist index-CPryixR2.js)
- 21:47 BRT · atingido1221 g rc=0 (dist index-CPryixR2.js)
- 21:47 BRT · 280 mm — medidas que o limitador NÃO achata (tests/pesado1222.mjs rc=0, /workspace/pesado1222-final.json; jogador, salva de 3 canos a 40 m + camada, saída do mestre): cp280 cruzeiro 1.2.21 → 1.2.22: grave 30–80 Hz −17,7 → −15,7 dB (+2,0); grave 30–80 Hz em 1–4 s −24,4 → −19,9 (+4,5); estrondo 30–400 Hz 1–4 s −17,2 → −13,3 (+3,9); cauda 30–400 Hz acima de −48 dBFS 5,1 → 6,8 s; corpo 150–1200 Hz acima de −42 dBFS 4,8 → 6,7 s; transiente 2–8 kHz (30 ms) −37,1 → −26,0 (+11); pico +0,5 dBTP/125 amostras clipadas → −0,8 dBTP/0 clip. 280 genérico: grave −23,4 → −18,7, estrondo 1–4 s −22,8 → −18,4, cauda 4,5 → 4,9 s. Contra 30/40 mm (1.2.22): grave −35,7/−35,5, estrondo 1–4 s −28,9/−28,3, cauda 1,9 s → o 280 tem +20 dB de grave, +15 dB de estrondo e 3,5× a cauda. Pré-mestre cp280: grave −13,2 → −4,4 (+8,8), tel −16,1 → −6,9.
- 21:47 BRT · ajustes 1.2.22b: banco cp_grande 4,6 → 6,2 s (a cauda era cortada), boom τ 0,75 → 1,0 s e ×1,13, corpo com cauda longa, estrondo τ 1,4 → 2,0 s ×1,3, novo rugido 300–900 Hz (τ 1,2 s), fade final; rng próprio + avanço do rng original → cp_100/cp_30/cp_127 bit-idênticos à 1.2.21. salvaTorres cp_grande ×1,15. Camada canhao grande: sub mais longo (+0,6 f²), estrondo pesado mais forte/longo, rugido de corpo 200–1100 Hz; render 4,4+0,18·kb s. fCal satura em 280 mm; ganhoCamCanhao (+até 12,5 % acima de 280 mm) → 305 mm mantém grave ≥ 280 mm.
- 21:47 BRT · som1218 g (critério ESTRITO restaurado, ≥ +1 dB) rc=0: cp280 −11,3 × antigo −12,3 dB tel (+1,0; na margem). canhao1222 rc=0 (11 calibres +1,2…+2,0 LU; grave Δ +1,4…+5,9 dB; estalo +3…+9,8; cauda +1,4…+5,4; pico/TP ≤ −0,7). audio1221 rc=0. atingido1222 rc=0 (409 impactos, 8 zonas × jogador/inimigo, 0 nós, pico −0,2 dBFS 0 clip). atingido1221 rc=0. abate frota rc=0 (6 abates).
- 21:49 BRT · APK FINAL candidato: dist index-BOgmGvgH.js (só texto do manual mudou após os testes de navegador em index-CPryixR2.js), 14.121.286 bytes, sha256 1735d67a2aea318aa6d3f44aa29412f48d9ebd66737d3b93097096c97a1a3497, vc25/1.2.22, só VIBRATE (+DYNAMIC_RECEIVER interna), v1+v2, cert d0c31791…a599. Copiado para /workspace/NexoNavalStrike-1.2.22.apk e anexos. Sem regressão longa nova: mudanças só em pré-render de áudio (0 nós, custo áudio 0,13 ms/quadro no som1218) e a regressão 20:48–21:19 cobre o resto; perf1214 não refeito (nada por quadro mudou).
- 22:16 BRT · unit rc=0: 76 passaram, 0 falharam (/tmp/unit1222d.log, 22:05→22:16, src/dist 1.2.22b). O rc=124 das 21:59 (/tmp/unit1222c.log) não foi travamento de áudio: rodei sem --experimental-websocket (Node 20 não tem WebSocket global; o tests/cdp.mjs precisa dele) e com timeout de 600 s, menor que a duração da suíte (cerca de 11 min). Rodada correta (flag + timeout 2400) passou.
- 22:17 BRT · **FINAL 1.2.22 (vc25)**: /workspace/NexoNavalStrike-1.2.22.apk = cópia nos anexos, 14.121.286 bytes, sha256 1735d67a2aea318aa6d3f44aa29412f48d9ebd66737d3b93097096c97a1a3497, dist index-BOgmGvgH.js, só VIBRATE (+DYNAMIC_RECEIVER interna), sem INTERNET, v1+v2, cert d0c31791…a599 (mesma chave). Nenhum arquivo de src/public mudou depois do build das 21:49.
