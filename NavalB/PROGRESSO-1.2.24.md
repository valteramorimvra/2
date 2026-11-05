# PROGRESSO 1.2.24 (vc27)
- 06:34 BRT · início; base 1.2.23 salva em /tmp/base1223 (src, audio, dist RI0YASIM).
- item 2 TORPEDO feito (src/sim/world.js): causa confirmada = espoleta de proximidade (proxSegmento, PARAM.trava.proxTorp 12 m da CAIXA retangular) + evento na posição do torpedo. Agora contato no casco afinado (contatoTorpedo) + bissecção; evento no costado. tests/torpedo1224.mjs: 98/100 impactos, |d| média 0,010 m máx 0,025 m (base 1.2.23: média 9,03 m, máx 15,53 m; mesmas 2 falhas >200 m na base). unit filtro torpedo/dano: 6/0.
- itens 5/6 código (autoMiraPasso: só alvo visível na tela, nunca dispara; travaSegue) + save (arcoPrev false, migra1224, travaSegue true) + Ajustes (main.js). Falta testar.

## Item 1 (código) — 26/10 BRT
- somJogador.js: ij:canhao/ij:missil/ij:granada reescritos SÓ com ruído moldado (choque Friedlander, grave = ruído passa-baixa, grãos de estilhaço Poisson, rasgo de chapa Poisson Q 0,8, destroços, cauda difusa por seguidor de envelope — sem modo()/senoide/pente). + 8 camadas de local zj:<zona> sem tom (mixer e pool via NOMES_JOGADOR).
- NavalAudio.atingidoLocal: jogador + arma ≠ torpedo → ij + zj (sem cam:impZ / cam:impRang). Torpedo e outros navios iguais à 1.2.23.
- combat3D: no navio do jogador sem impactoArma (anel metálico tonal) e sem 'rangido_metal' do míssil; somLocal soa mesmo com dano 0 no jogador.
- Buffers brutos (Node, FFT 16384): novo proeminência ≤ 9,7 dB e 0 parciais sustentados; 1.2.23: até 26,4 dB, 59/5/132 parciais (ij:canhao/missil/granada).
- espectro1224: corrigido (silêncio −Inf virava 0 dB; motor e voz de rádio 'atingidos' isolados).
## Item 4 — src/ui/hud1224.css: 4 cantos finos, vermelho / verde (alinhado), sem anel/traço/animação.
## Versão 1.2.24 / vc27; manual "Novidades 1.2.24" com crédito. dist reconstruído (index-Dr9s1wH4.js). 1.2.23 servida em :4195 (/tmp/base1223/dist) para A/B.
## tests/mira1224.mjs escrito (itens 3/5/6) — rodando.

## 07:24 BRT — retomada após interrupção (causa desconhecida; os testes em segundo plano terminaram normalmente às 07:23)
- Pool: alarme de bordo (bipes) pré-renderizado também no pool; míssil no jogador sem 'explosao' genérica (baque senoidal). dist index-xMe9v4zi.js.
- espectro1224 1.2.24: worklet OK (prom máx 8,9 dB, 0 parciais, pico máx −0,73 dBFS, 0 nós); pool OK (prom máx 9,0 dB, 0 parciais, pico máx −1,05 dBFS, 0 nós).
- mira1224: 15/16 — critério da TRAVA SEGUE corrigido para comparar com o ponto de AVANÇO (não com o casco); rodando de novo. unit rodando.
- 07:5x: audio1223 worklet clipou (+0,44 dBFS, base −0,46) → zj: ganho min(0,75, at·0,45); rebuild
- zj: faltava no roteamento de barramento (imp) e na categoria de vozes (expl) do mixer → corrigido; ganho zj voltou ao original
- 07:40–08:10 BRT: mira1224 16/16 ✔; ajustes1224 OK (0 sobreposição/corte/fora, paisagem+retrato); miracap1224 (verde alinhado / vermelho fora) ✔; unit 76/0 ✔; canhao1223 (base 1.2.23) ok:true ✔; A/B: só 10 arquivos de src mudaram, assets de dist idênticos; espectro 1.2.23 worklet/pool FALHA (prom 11,7–26,3 dB, 5–80 parciais, pool 304 nós) = teste discrimina.
- audio1223 worklet: clip na rajada de RBU no próprio casco (+0,03…+0,45 dBFS; base −0,24/−0,46). Causa: degraus amostra-a-amostra (>1,0) nas camadas novas → overshoot do teto (WaveShaper 4×). Correções: ij:granada −2 dB (energia 50 ms igualada à 1.2.23), zj ≤1 por 90 ms, passa-baixa 11 kHz (2ª ordem) nas ij/zj novas. audio1223 pool OK.
- 08:14 BRT: retomada após 2ª interrupção (causa desconhecida; o comando de build das 08:1x não chegou a iniciar — "Command failed to spawn: Aborted"). Build com passa-baixa + retestes.
- 08:2x dist index-CMcdYcmE.js: audio1223 worklet 2×TUDO OK (pico −0,53/−0,44 dBFS, 0 clip, 0 nós); espectro worklet OK (prom ≤9,1 dB, 0 parciais, pico ≤−0,86, 0 nós). Rodando: pool (espectro/audio1223), atingido1222, canhao1223, unit.
- pool: espectro OK (prom ≤8,9, 0 parciais, pico ≤−1,27, 0 nós); audio1223 pool TUDO OK (−0,40 dBFS); atingido1222 TUDO OK (−0,25 dBFS). APK em seguida.
- 08:3x: retrato do Ajustes mostrou texto de 3 linhas encostando/vazando a borda da caixa (o teste não media vazamento span→caixa). Teste reforçado (vazaCaixa) + CSS .aj-chave flex-shrink:0. Rodando antes/depois.
- 08:4x: Ajustes corrigido (.aj-grade grid-auto-rows:max-content) — ajustes1224 OK paisagem+retrato com vazaCaixa=[]; unit 76/0 (08:2x). dist index-CSTU3dHr.js. Gerando APK.
- 08:35 BRT: APK final NexoNavalStrike-1.2.24.apk sha256 1f3f5b74…ae2bc, 14 130 339 B, vc27/1.2.24, só VIBRATE, cert d0c31791…a599, v2 ok, copiado p/ attachments. FIM.
