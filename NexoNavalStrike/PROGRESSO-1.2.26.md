# PROGRESSO 1.2.26 (vc29)
- 18:26 BRT · início; base 1.2.25 copiada para /tmp/base1225 (src, public, tests, dist index-BM35-q1p.js)
- 18:31 BRT · item A: diferenças de câmera 1.2.24→1.2.25 mapeadas (só a 3/4 nova, limite de inclinação −0,30 do item 1 e a ordem do ciclo). Ordem 1.2.24 restaurada; 3/4 acrescentada no fim do ciclo.
- 18:46 C: pouso vertical integrado no referencial do navio (corrigia atraso que impedia pousos); convoo1226 PASSA (0 surgem no ar, 0 colisões, filas ok). Quedas por combustível em espera investigando. Recebidas prioridades E–H.
- 18:56 C: recolhimento — prioridade por combustível, fila em-trail (próximo entra na perna com anterior a <1,5 km), convés liberado ao sair da área de pouso, elevador não bloqueia pouso, VTOL reserva ponto só a <900 m, lançamento cede à final em qualquer PA. Quedas por pane seca 41→2 (= 1.2.25: 2). convoo1226 rc=0.
- 19:00 C pronto. B/H: src/audio/aeroAgua1226.js (8 sons sintetizados), NavalAudioManager.aero()/quedaAgua(), eventos aeroSom/cacaToque e fila de queda d'água; fx.coluna com fase de desabamento.
- 19:10–19:45 BRT · NAVIOS1226 aplicado; pouso dos gigantes (rota/espera só para gigaPA; ≤343 m mantêm a lógica 1.2.25), parque encolhe com a reserva e não ocupa catapultas/elevadores/taxiamento (51/56 vagas), desgaste/ferrugem PBR em todos os cascos (uDesg, 0 programas novos), travada da partida no navegador = canvas 2D do desgaste do convés acelerado por GPU → willReadFrequently (CPU raster).
- 19:25–19:50 BRT · NUCLEAR aplicado (rebase); gancho nuclear:{bombas:1} nos 2 gigantes; Urubu-rei = mesmo modelo 'bombardeiroNuclear'; som sem atraso 343 m/s; Wilson denso; balanço dos navios com a onda de choque; dano 'nuclear' nas estatísticas e resumo.
- 19:55 BRT · J: canos elevam (sim + visual pivô no munhão); varredura de inclinação provou: pitch −0,30 (para cima) → el 0,22–0,29 rad em todas as classes; o "≈0" anterior era o teste com pitch +0,6 (câmera olhando para baixo). Capturas canos/elevado_*.
- 20:08 BRT · K (pedido 19:52): pilotagem manual do bombardeiro — sim determinística (comandos nkPiloto/nkCtl/nkTrava/nkSolta validados na rede), voo coordenado com taxas limitadas, IA assume suave, CCIP + trava + solução balística, painel próprio no HUD, câmera de acompanhamento. tests/nkManual1226.mjs PASSA (manual: soltou 28 s, alvo destruído, rolagem máx 0,60 rad/s, IA religada pousou; IA reassume após manual: detonou). Manual Novidades 1.2.26 + crédito, versionCode 29 / 1.2.26.

## 20:28 — Item K: modo ESPERA (sem atacar) / voltar ao navio / IA desligável
- Botão pequeno **IA** no painel do bombardeiro (rótulo LIGADA / DESL. / ESPERA); IA desligada = jogador controla 100% do voo (joystick suave: zona morta 12%, curva quadrática, rolagem ≤ 0,55 rad/s, curva coordenada ≤ 0,2 rad/s, ângulo de trajetória ≤ 0,18 rad/s), trava (TRAVAR) e lançamento (LANÇAR, só com CCIP calculado pela mesma integração balística da bomba).
- Botão **ESPERA**: bombardeiro entra em órbita de espera em torno do próprio PA (raio 2,6 km, 1 500 m, 190 m/s), empurrada para fora do alcance SAM + 2,5 km de qualquer inimigo; não trava, não lança, não ataca; câmera volta ao navio. No HUD do navio o botão NUCLEAR vira **PILOTAR** para reassumir.
- Autonomia 600 s: sem combustível volta e pousa sozinho, bomba devolvida ao paiol (evento nkPousa comBomba).
- Teste node tests/nkManual1226.mjs: PASSA — manual (solta 28,4 s, detona 45 s, pouso 112 s com IA religada, rolagem máx 0,6 rad/s, alvo destruído, fogo amigo 0); IA reassume detona 49,6 s; espera: 0 ataques, distância mínima ao inimigo 4 869 m > alcance SAM 3 000 m, depois manual → IA ataque detona; combustível em espera: pousou 635 s, bombas=1; rede: comandos novos validados.
- Teste browser tests/nkPiloto1226-chrome.mjs (1ª rodada 915x412): espera/reassume/manual OK, detonação pelo caminho de botões OK (dano nuclear 8 299), 0 sobreposições de HUD. Corrigido no teste: TRAVAR alternava a trava já existente (destravava). Nova rodada nas 4 resoluções pendente.

## 20:28 — Item F: câmera próxima nos PAs gigantes
- Na perseguição 'perto' do próprio navio: fator de porte sG = clamp((L−250)/226, 0, 1); distância ×(1+0,16·sG), altura +L·0,045·sG, limite de olhar para cima −0,30 −0,14·sG (gira mais para cima nos gigantes de 476 m; navios ≤ 250 m inalterados). Verificação por captura pendente do rebuild.

## 20:28 — Itens E e I: iniciados
- E: auditoria A/B com cenas idênticas (mesma semente 21, hora dia, tempo limpo, qualidade alta, câmera fixa camTeste, HUD oculto) em 1.2.24 (:4196), 1.2.25 (:4214) e 1.2.26 (:4173), 3 vistas (navio, mar, horizonte), métricas de luminância/contraste/nitidez/saturação. Saída /workspace/capturas1226/qualidade/.
- I: as mesmas 3 vistas nos 17 mapas (arquipelago … ruinas) 1.2.24 × 1.2.26.

## 20:46 — Item E: auditoria gráfica A/B 1.2.24 × 1.2.26 (restauração)
- 51 cenas idênticas (17 mapas × 3 vistas: navio / mar / horizonte), semente 21, dia limpo, qualidade alta, HUD oculto, câmera fixa camTeste, rumo travado.
- Métricas (luminância, contraste, nitidez, saturação, nitidez metade inferior) em /workspace/capturas1226/qualidade/metricas.json.
- Resultado: 1.2.26 ≥ 1.2.24 em contraste/nitidez/saturação em 50/51 cenas. Única queda relativa: arquipelago_navio nitidez (13,9 → 11,2) — artefato de ângulo (o navio em 1.2.26 enquadra mais casco e menos água com brilho especular, que inflava a nitidez). Visualmente a água e o PBR do casco em 1.2.26 estão iguais ou melhores (menos brilho “glitter” de desenho animado).
- Antes|depois lado a lado: /workspace/capturas1226/qualidade/ab/*_antes_depois.png. Nenhuma restauração de shader necessária (nada degradado de verdade).

## 20:46 — Item I: todos os mapas + água ultra realistas
- Mesmas 51 capturas cobrem os 17 mapas vs 1.2.24. Água: Gerstner 6 ondas, gradiente de profundidade, espuma/esteira sem emissão própria. Terreno: sem estratos senoidais (1.2.25), fissuras mascaradas, segK em arenas novas.
- Visual: 1.2.26 nunca abaixo de 1.2.24; ilhas com sombreamento mais natural, água com specular menos “estrelado”. Antes|depois nas pastas qualidade/ e qualidade/ab/.

## 20:54 — Item E (celular): causa e restauração
- Diff 1.2.24×1.2.25: `aplicaQualidade`/`nivelInicial`/`pixelRatio`/`sombras`/`criaMar`/`antialias` idênticos. Queda no aparelho = `qualidade:'auto'` (fábrica) + conteúdo 1.2.25 mais pesado → FPS < 46 em 2,5 s → rebaixa e **nunca recuperava** (`!Q.rebaixou.length` bloqueava subida).
- Restauração 1.2.26: piso pixelRatio `[1.1, 1.6, 2]` (antes 0,9/1,4); sombra média 1536 (antes 1024); limiar de rebaixo 40; recuperação após 6 janelas ≥ 55 mesmo se já rebaixou.
- A/B em qualidade **media** (caminho típico do celular) em andamento: /workspace/capturas1226/qualidade/v12*_*media_*.png

## 20:54 — Item I: elevação real (não só métrica)
- Água: espuma de crista 0,12→0,38; arrebentação costa mais larga/densa; cristas na cor +28%; lóbulo especular médio ×1,8; fresnel do céu um pouco mais presente.
- Terreno: estratos de rocha no ladrilho 36 m (sem curvas de nível na malha); normalScale 0,9→1,65; bake de normal ×14; micro-relevo de pedras; praia mais larga; vegetação [900,2600,4200] / arbustos [700,1600,2400].
- Ruínas: faixa de maré/algas até 11 m, concreto mais gasto (roughness 0,96).
- Rebuild dist (index-BB11kO6g.js) no ar em :4173.

## 21:02 — Item F verificado pós-rebuild
- chapada: sG=0,89 pitch máx −0,425 camY=82 dist=602 (antes sem F: pitch −0,30 camY≈68 dist≈536)
- lençóis: sG=1,0 pitch −0,44 camY=88 dist=643
- colosso: sG=0,41 pitch −0,357 (escala menor, como pedido)
- Capturas: /workspace/capturas1226/camera/v1226b_*_perto_cima.png

## 21:02 — nuclear1226 + nkManual1226 pós-ESPERA/E/I
- nuclear1226: 9/9; nkManual1226: PASSA (espera/manual/combustível/rede).

## 21:18 — E A/B qualidade media (caminho celular) + I visual
- 1.2.24×1.2.26 em media (nivel=1): /workspace/capturas1226/qualidade/v12*_media_*.png e ab_media/.
- Visual: 1.2.26 com desgaste de casco, specular de água mais definido, sombra média 1536; nunca abaixo de 1.2.24 no caminho media.
- TRAVAR do bombardeiro: corrigido (não depende mais só de `detectado` de superfície); cue de solução 260→420 m (CEP nuclear).

## 21:18 — nkPiloto 915x412 (rodada com TRAVAR fix, pré-cue 420)
- espera/reassume/manual OK; travado=7; soltou+detonou; saiuAoPousar=1; 0 sobreposições HUD.
- Falha só solucaoOk (cue) e dano no alvo na rodada anterior — reteste em andamento com cue 420 + steering CCIP.

## E — pixelRatio mid-match (21:32 BRT)
- Diff 1.2.24×1.2.25: preset/auto/fog/antialias/BARATO/LOD idênticos; queda no celular vinha do auto (limiar 46 + sem recuperação) + conteúdo mais pesado.
- Restaurado: pisos PR [1.1,1.6,2] em aplicaQualidade, trocaNivel **e** loop de jogo (antes o loop sobrescrevia com [0.9,1.4,2]); sombra média 1536; limiar auto 40 + recover 6×≥55.
- antialias continua true; fog Exp2 inalterado; MSAA via WebGL antialias; partículas via setFator por nível.

## I — mapas/água ULTRA (21:32 BRT)
- agua: espC 0.38, espR arrebentação reforçada, fresnel/especular/crista.
- terrain: normalScale 1.65, estratos no ladrilho 36 m, micro-relevo, praia mais larga, veg denser.
- ruinas: maré/algas + roughness 0.96.

## Build final
- APK vc29 / 1.2.26 — sha256 a88c3f8b96e7ef003244dcf1d3c2babc3997468b8be2b86ac2c3f84209f03f4f
- /workspace/attachments/nexo-naval-strike-1.2.26-vc29.apk (~14.4 MB)
- perms: VIBRATE (+ DYNAMIC_RECEIVER); debug.keystore
- bundle index-BaBK0WId.js

## nkPiloto
- em curso (TELAS=915x412); CIWS/SAM/laser limpos no teste; aguardando detonou.

## Fechamento 21:38– BRT
- cue/CCIP: err<420 → nk-cue; nkPiloto 915×412 PASS (solucaoOk, soltou, detonou=1, alvoMorto, falhas=[])
- E: pisos PR [1.1,1.6,2] em aplica+troca+loop; sombra 1536; auto limiar 40 + recover
- I: espuma/arrebentação/fresnel + **refract** Snell no shader; terrain/ruinas elevados
- APK final: sha256 a67ccf873f0d5a829b69ff2f2347b921a07d5198328ef161129c9226aa7738c2 · bundle index-DvSAQUjU.js · vc29/1.2.26
- nkPiloto 4 res + unit 2400s em curso

## Conferência tamanho APK (22:06 BRT)
- **1.2.25:** 15.091.424 bytes (15,091,424)
- **1.2.26 final:** 15.134.485 bytes → `/workspace/NexoNavalStrike-1.2.26.apk`
- Delta **+43.061 bytes** (+42,1 KiB). O “~14,4 MB” era 14,43 **MiB** (÷1024²); em MB decimal ≈ 15,13 MB — **maior** que a 1.2.25, não menor.
- Árvore APK: 553 arquivos comuns; **audio/** (52 arq, 9.172.326 B), **mapas/** (17, 2.248.873 B), **retratos/** (6, 62.802 B) **byte-idênticos** 25↔26 (MD5).
- Única mudança de payload: bundle JS/CSS (`index-BM35…` → `index-CtLzN1gv.js` +119.621 B uncomp; CSS +2,8 KB). Navios novos, nuclear, sons procedurais e texturas geradas vivem no JS (sem .wav/.png extras) — createBuffer 35→36.
- zip uncomp 20.997.113 → 21.119.817 (+122.704). Nada sumiu.

## Testes fechamento (22:29 BRT)
- nkPiloto 4 res (915/780/640/412): **falhas []**, detonou=1 na 915, HUD sob=[] nas 4 (modoNk+hidden chaves).
- Unit sozinha (2400s): **76 passaram / 0 falharam**, unit_rc=0 (~22:26 BRT).
- nuclear1226: **9 ok / 0 falhas**, nuclear_rc=0.
- nkManual1226: **falhas []**, nkManual_rc=0 (espera/manual/combustível/iaReassume OK).
- APK: `/workspace/NexoNavalStrike-1.2.26.apk` · 15.134.485 B · sha256 b68a5c3cd5aff297bf6c6c431ff41179364090e85ef6f9c1db5bc06ae4dc470c · vc29 · VIBRATE only.
- Conferência vs 1.2.25: +43.061 B; audio/mapas/retratos MD5-idênticos (52/17/6); só JS/CSS cresceram.
