# PROGRESSO 1.2.25 (vc28) — base 1.2.24 (dist index-CSTU3dHr.js, APK sha 1f3f5b74…)
- 14:2x BRT: base congelada em /tmp/base1224 (src, dist, tests, package.json, build.gradle); servidor python :4196 servindo /tmp/base1224/dist.
- 14:31 BRT item 8: causa confirmada (paisagem: lista encaixada em 93 px entre botões, 4/16 visíveis, rolagem interna; retrato: placar fora da tela x323–624 em 412 px, toque não alcança). Correção: hud1225.css + _encaixaLista nova (área inteira abaixo do placar, densidade adaptativa, controles ocultos enquanto aberta); placar/fita reposicionados no retrato.
- 14:32 BRT item 8 OK no build novo: paisagem 16/16 linhas sem rolar (caixa 712×266), retrato 16/16 (388×518), duelo 4/4; 0 cortes, 0 botões sobre a lista (capturas1225/lista_1.2.25_*.png)
- 14:33 BRT: pedido ampliado (pai) — item 10: 4 mapas novos (arquipélagos/canais/falésias; 1 com ruínas submersas no horizonte, nublado/entardecer; times em cantos opostos do grid 7×7; minimapa A-G/1-7); item 11: câmera 3/4 lateral-elevada no ciclo do botão de câmera.
- 14:38 BRT itens 3/4/5/6 implementados (aereo.js: decolaPista/aproxima/pousoPista/iaTatica; drone automático; botão HELI = LIBERAR; DRONE removido). tests/aereo1225.mjs: OK

## 14:42 BRT — PARALELIZAÇÃO (orientação do agente-pai)
- Eu = INTEGRADOR: itens 1–9 e 11. Item 10 (mapas) e 13 (spawn nos cantos) → trabalhador MAPAS (/workspace/nexo-naval-strike-mod/mapas/); itens 12 e 14 (navios novos) → trabalhador NAVIOS (/workspace/nexo-naval-strike-mod/navios/). Integro quando o pai avisar.
- Arquivos que EU toquei até agora (para evitar conflito): src/ui/hud.js, src/ui/hud1225.css (novo), src/modernNavalCombat3D.js, src/naval5v5/aereo.js, src/NavalAudio.js, src/NavalAudioManager.js, src/render/aereo3d.js, src/render/fx.js, tests/placar1225.mjs, tests/aereo1225.mjs, tests/passagem1225.mjs. NÃO toquei definições de classes de navios nem maps/spawns.
- Item 7 (passagem): 1ª rodada — tudo OK salvo "Ambiente 0 %" (falso negativo do teste: o analisador ainda guardava 43 ms anteriores ao slider). Teste corrigido, rodando de novo.
- Item 2: colunaTorpedoFases() em fx.js (domo de spray, jatos do núcleo, chuva d'água 2,4 s, espuma + 2º anel 3,6 s) no MESMO pool 'agua' → 0 draw calls novos, 0 nós de áudio. Falta A/B de custo de quadro.
- 14:55 BRT item 7 OK: rl:jato no Ambiente (bus 0), slider Ambiente 0 % → 0, 0 nós criados, pico 0,37 sem clip, Doppler 1,6 aproximando / 0,632 afastando (taxa limitada a 0,6–1,6), lowpass 8,5 kHz longe → 16 kHz perto; no jogo 32 chamadas tipo 'jato' (d mín 225 m). /workspace/passagem1225.json
- 15:05 BRT item 2 A/B (tests/torp1225.mjs, headless SwiftShader ~3 qps, 3 colunas em 6 s): tempo de R.render controle→colunas: 1.2.24 4,51→4,84 ms (+0,33) · 1.2.25 4,67→4,94 ms (+0,27); draw calls máx 194→195 (base) e 203→208 (nova; variação da cena, o pool 'agua' é 1 draw call já existente); programas WebGL sem aumento (1.2.25 = 106); 0 nós de áudio; partículas por coluna 1.2.25 ≈ 101 a mais (stTorp 4 colunas / 404). Fotos: capturas1225/torpedo_*.png e torpedo_fases.png.
- Item 1 implementado: world.js (mira.elD, dhM() p/ ponto ACIMA da boca, sol.direto → saída pelo eixo REAL do cano via mundoInc, sem viés/elC), modernNavalCombat3D.js (pitch até −0,30 fora do binóculo; câmera PERTO não afunda; envia elD quando a mira está acima do horizonte).
- 15:25 BRT item 1 OK. Node (tests/elev1225.mjs): mira acima do horizonte → canos a 20,05° (pedida 20,05°), erro saída×cano 0° (corveta/destróier/cruzador); PONTE ALTA (ponto acima da boca, capitânia a 700/900/1400 m): 1.2.25 134/136 no módulo 'ponte' × 1.2.24 22/136 (base caía no casco). Navegador (tests/elev1225b.mjs): canos do MODELO 3D 15,7° e granada pelo eixo do cano do modelo, erro máx 0,029° (7 tiros). Falha encontrada e corrigida: o validador de comandos (src/net/commands.js) descartava o campo novo elD. Fotos capturas1225/elevacao_*.png.
- Item 9 implementado: src/sim/esquadra.js (novo: ESQUADRA8 com funções apoio/asw/aa/linha + capitania-linha; porta-aviões no lugar da capitania; pares de poder mais próximo), match.js (montagem 'mista' usa esquadras(); coloca() grava nv.funcao — 1 linha no código de spawn, ATENÇÃO na integração com o trabalhador MAPAS), ai.js (escolta AA entre a ameaça e o navio de alto valor até 6,5 km; ASW com torpedo a 5,2 km). Teste tests/equilibrio1225.mjs rodando (60 partidas nova, 60 base, 20 com porta-aviões).

## Item 9 — equilíbrio (medições, 26/10 ~15:00 BRT — horário corrigido)
- Base 1.2.24 (60 partidas bot×bot, atois, frota): vermelho 40 × azul 20; dP médio 7,4%, máx 20,8%.
- Nova 1ª versão (60): vermelho 50 × azul 10; dP médio 3,6%, máx 8,7%; mas poder vermelho > azul em 45/60 (o espelho excluía a MESMA classe → em vagas de pool pequeno o vermelho pegava classe mais forte, ex. kestrel 2,84 × sokol 4,92).
- PA (20): vermelho 18 × azul 2; dP médio 3,2%.
- Correção: o espelho pode usar a mesma classe (esquadra.js `par`). Teste de espelho TROCA=1 (globalThis.__nnsTrocaEsq, só teste) troca as classes entre os lados para separar composição × assimetria estrutural (posições/mapa/jogador sob IA). Rodando: /tmp/eq2_{novo,troca}_*.jsonl.
## Item 11 — 1ª rodada tresq: fração 0,61 (paisagem padrão), 0,41/0,66 em órbita → FALHOU. Causa: cálculo geométrico ignora perspectiva oblíqua. Correção: malha fechada camAjT pela fração projetada real (alvo 0,8/zoom). Re-teste rodando.
## Item 9 — resultado (26/10 ~15:15 BRT — rótulo antigo "15:45" estava errado)
- Após correção do espelho (30 partidas, atois): dP médio 0,3%, máx 1,6% (base 7,4% / 20,8%). Vitórias ainda 23×7 vermelho, MAS o teste TROCA=1 (classes trocadas entre os lados) dá o MESMO 23×7 → a vantagem não vem da composição.
- BOT=1 (navio do jogador vira bot comum do seu papel; sem a doutrina 'jogador sob IA' que recua a <3,5 km para preservar o navio): atois 15×15 (equilíbrio perfeito), dP 0,3%. Causa do desvio nos testes: a doutrina do navio do jogador sob IA (artefato do teste bot×bot; em jogo real o humano comanda).
- arquipelago BOT=1: vermelho 20×10 → assimetria de POSIÇÕES do mapa (spawns). Pertence ao item 13 (MAPAS: cantos opostos) — re-medir depois da integração.
- Arquivos: src/sim/esquadra.js (par: permite mesma classe; op.troca só teste), src/sim/match.js (troca: globalThis.__nnsTrocaEsq, só teste), tests/equilibrio1225.mjs (TROCA, BOT).
## Item 11 — 2ª/3ª rodada: malha fechada camAjT + teto de FOV horizontal (hfovMax 80°) também na 3/4 (paisagem). Diagnóstico: converge em ~1,5 s de jogo (fração 0,80 no través); o teste esperava 5 s reais ≈ 1,5 s de jogo no headless (3 fps) → teste agora espera 3 s de TEMPO DE JOGO. Re-teste rodando.
## 26/10 ~15:20–15:30 BRT (rótulo antigo "16:00" errado) — MAPAS integrado (itens 10/13)
- Copiados: src/sim/mapasNovos.js, src/sim/spawnCantos.js, src/render/ruinas.js, public/mapas/{ruinas,dalmacia,lofoten,halong}.png, tests/spawn1225.mjs, tests/mapas1225.mjs, tools/minimapa.mjs.
- patches aplicados: maps.js e terrain.js limpos; match.js com 1 hunk em conflito (minha linha funcao do item 9) → aplicado à mão (cópia do plano com vagas, P._uso, pegaVaga em coloca, rumoN).
- spawn1225 na build integrada: OK 17/17 mapas, 0/38 em terra por mapa (números idênticos às notas do MAPAS).
- Dalmácia "curvas de nível" de perto: causa = textura de detalhe do terreno (estratos senoidais + fissuras como isolinha de ruído, projetadas de cima). Corrigido em terrain.js (_geraDetalhe: sem estratos, fissuras fragmentadas por máscara). Capturas dalmacia_perto{,2}_{antes,depois}.png. Afeta o detalhe de todos os mapas (mais limpo); custo 0.
- Item 11: 3/4 em paisagem estava a 88 m (encostada, grande-angular). Agora teleobjetiva (FOV horiz ≤50°) → 155–174 m; e a AUTO-MIRA não gira mais a órbita na 3/4 (era o que puxava o yaw para ~50° nos testes). tresq OK antes desta última mudança (fração 0,77–0,79, elev 17–24°); re-teste rodando.
- Item 9 com os cantos novos (BOT=1): atois 16×14 ✓; ruinas 8×12 (20 partidas) ✓ dentro do ruído; ARQUIPÉLAGO 26×4 azul ✗ → assimetria de posição do canto (C5×E2). Teste de espelho LADO=1 (troca os cantos; hook só de teste globalThis.__nnsTrocaLado) rodando.
## 26/10 ~15:40–15:47 BRT (rótulo antigo "16:35" errado)
- mapas1225 (build integrada, :4173): 8 mapas, 0 programas novos, 0 erros JS; ruínas 46 estruturas/40.160 tri; dc médio 232–301 (headless). Dados: /workspace/capturas1225/mapas/medicoes-drawcalls.json.
- Arquipélago: LADO=1 (cantos trocados) → 2×28: confirmado, o canto C5 vence, não a composição. Tentativa genérica (cobertura por lado no planejador) mudava os planos de 11 mapas e encurtava distâncias → REVERTIDA. Solução: `dirCantos` por mapa (maps.js arquipélago + filtro em spawnCantos.js). Medido (16 partidas cada): d1 B5×F3 6×10, d3 C6×E2 2×14, d13 C3×E6 10×6, d14 D2×F5 10×22 (32), d15 B3×F5 9×7 → escolhido d15 (7.272 m entre bases); confirmação com mais 32 partidas rodando.
- Item 1 (correção): mira acima do horizonte (elD) não troca mais para o ramo ALTO (world.js pontaria: eDir) — no tresq os canos iam a 57,3° (ramo alto por ilha) em vez da elevação escolhida.
- Item 11: camAuto (recentragem após 4 s) não age na 3/4.
## 26/10 ~15:50–15:55 BRT (rótulo antigo "17:00" errado)
- Arquipélago d15 (B3×F5) confirmado: 48 partidas → azul 25 × vermelho 23 ✓.
- tresq1225 OK (paisagem e retrato): fração 0,80 em padrão/través/órbita (rel 60°/90°/138°), elevação 17–24°, zoom 0,53, canos 15,7° mantidos na 3/4. Distância paisagem 129–193 m (teleobjetiva).
- Manual: Novidades 1.2.25 + itens 10/13 e relevo.
- Levantamento 12 partidas/mapa (BOT=1, cantos novos): equilibrados (≤8×4): cordilheira 7×5, estreito 7×5, florianópolis 8×4, gibraltar 6×6, halong 7×5, noronha 5×7, salvador 8×4, santos 9×3(lim.). DESEQUILIBRADOS: fiordes 0×12, vulcânico 12×0, guanabara 0×11, são francisco 11×1, dalmácia 2×10, lofoten 10×2 → busca de eixo (tests/dircantos1225.mjs, 12 partidas por eixo) rodando.
- Módulo NAVIOS: NOTAS presentes; aguardando aviso do pai para integrar.
## 16:08 BRT — retomada após interrupção: busca de eixo dos cantos (dircantos1225) em andamento; NAVIOS unit 75/76 (falha esperada sem teste-unit-1225.patch).
## 16:09 BRT — NAVIOS (itens 12/14) INTEGRADO: integracao-1225-completo.patch aplicou limpo (10 arquivos, inclusive aereo3d.js sem conflito com o item 3) + teste-unit-1225.patch; vite build OK; fumaça Node: 6 classes como jogador em Dalmácia/frota, 16 navios, sem erro (poder azul×vermelho: abrolhos 45,5×40,6, costaverde 46,0×40,6 — PA premium lendário do jogador não tem espelho; linha 36,6×36,4 … 40,7×40,6). Novas classes de linha entram em POOL_PAPEL automaticamente (pf). Manual: parágrafos itens 12/14. Unit integrado rodando (/tmp/unit1225int.log).
- 16:10 BRT · canhao1223 vs base1224 (src+public/audio) rc=0 → /workspace/canhao1225.json
- 16:12 BRT · unit integrado INTERROMPIDO por mim (ainda faltava decidir dirCantos/sorteio de lado; o unit testa todos os mapas → será rodado uma vez só no código final).
## 16:13 BRT — Item 9: eixo de cantos por mapa (dircantos1225, 12 partidas bot×bot por eixo, d e d+8 espelhados)
- fiordes (padrão d2 0×12): d1/5/6/7 inválidos (<6,5 km ou sem vaga), d3 3×9 → **d3 + sorteio de lado**.
- vulcanico (padrão d6 11×1/12×0): d1 7×5, d2 10×2, d3 8×4, d5 5×7, d7 12×0 → **d1** (8,5 km).
- guanabara (só d7 válido: 2×9+1 empate) → **sorteio de lado** (eixo único).
- saofrancisco (padrão d2 11×1): d3 8×4, demais inválidos → **d3**.
- dalmacia (padrão d6 4×8): d1 0×12, d3 3×9, d7 inválido → **mantém d6 + sorteio de lado**.
- lofoten: medição em andamento.
- Sorteio de lado (novo, match.js): nos mapas com `ladoSorteio`, a semente decide (sem consumir o rng) qual time fica com cada canto → vantagem do canto vira 50/50 no conjunto de partidas. Validação N=24 rodando (/tmp/val_*.jsonl).
- 16:14 BRT · lofoten (padrão d6 11×1): d1 7×5 (7,3 km), d5 7×5 (8,0 km), d2/d3 inválidos → **d1**. d7 não medido (cancelado: já há eixo equilibrado).
- 16:15 BRT · dist final reconstruída (index-DTNvzht-.js: NAVIOS + eixos/sorteio de cantos); spawn1225 OK 17/17 no código final (/tmp/spawn1225b.log); regressão completa iniciada em 3 trilhas (/tmp/reg1225*.log).
- 16:15 BRT · A/B src/public × /tmp/base1224: só arquivos dos itens mudaram — áudio (NavalAudio/Manager: só passagem de aeronave, item 7), fx.js (item 2), commands.js (item 1), ai.js (item 9 ASW/escolta), aereo.js (3–6), hud.js+hud1225.css (4/6/8), modernNavalCombat3D (1/11), world.js (1), match/esquadra/spawnCantos/maps/mapasNovos (9/10/13), terrain.js+ruinas.js (10/13), classes/layout/nomes/shipModels/silhuetas/aereo3d/navalTechTreeEconomy + 3 novos (12/14), main.js (manual), 4 PNG de minimapa; package 1.2.25, versionCode 28. match.js.orig (sobra do patch) removido de src/.
- 16:15 BRT · validação sorteio fiordes d3 N=24: {"mapa":"fiordes","d":3,"cantos":{"azul":"D6","vermelho":"E2"},"entre":7272,"nav":[3847,3823],"v":{"azul":11,"vermelho":13,"null":0}}
- 16:16 BRT · validação sorteio dalmacia d6 N=24: {"mapa":"dalmacia","d":6,"cantos":{"azul":"E5","vermelho":"C2"},"entre":7272,"nav":[3754,3670],"v":{"azul":11,"vermelho":13,"null":0}}
- 16:16 BRT · placar1225 a rc=0 (dist index-DTNvzht-.js) → /tmp/r25_placar1225_a.log
- 16:16 BRT · aereo1225 a rc=0 (dist index-DTNvzht-.js) → /tmp/r25_aereo1225_a.log
- 16:17 BRT · audio1223 w rc=0 (dist index-DTNvzht-.js) → /tmp/r25_audio1223_w.log
- 16:20 BRT · audio1223 p rc=0 (dist index-DTNvzht-.js) → /tmp/r25_audio1223_p.log
- 16:21 BRT · tresq1225 a rc=0 (dist index-DTNvzht-.js) → /tmp/r25_tresq1225_a.log
- 16:22 BRT · atingido1222 a rc=0 (dist index-DTNvzht-.js) → /tmp/r25_atingido1222_a.log
- 16:24 BRT · espectro1224 w rc=0 (dist index-DTNvzht-.js) → /tmp/r25_espectro1224_w.log
- 16:24 BRT · aereo1225 nos super PA (abrolhos,costaverde): FALHOU: abrolhos: nenhum caça voltou, pousou e decolou de novo | costaverde: nenhum caça voltou, pousou e decolou de novo rc=1 
- 16:26 BRT · aviso do pai: NAVIOS pronto (já integrado às 16:09). Encerrei o unit residual do rascunho /tmp/nav1225 (pid 1722502, iniciado ~16:2x) para não haver 2 suítes simultâneas; fica só o unit do código final (reg1225, iniciado 16:13).
- 16:26 BRT · validação sorteio guanabara d7 N=24: {"mapa":"guanabara","d":7,"cantos":{"azul":"F5","vermelho":"B4"},"entre":8484,"nav":[4999,4523],"v":{"azul":12,"vermelho":10,"null":2}}
- 16:26 BRT · hud1225 a rc=1 (dist index-DTNvzht-.js) → /tmp/r25_hud1225_a.log
- 16:26 BRT · espectro1224 p rc=0 (dist index-DTNvzht-.js) → /tmp/r25_espectro1224_p.log
- 16:31 BRT · sobrepor1216 a rc=0 (dist index-DTNvzht-.js) → /tmp/r25_sobrepor1216_a.log
- 16:32 BRT · elev1225b a rc=0 (dist index-DTNvzht-.js) → /tmp/r25_elev1225b_a.log
- 16:33 BRT · unit (código final) rc=1: 75 passaram, 1 falharam
- 16:33 BRT · elev1225 (node) rc=0
- 16:34 BRT · torp1225 a rc=0 (dist index-DTNvzht-.js) → /tmp/r25_torp1225_a.log
- 16:36 BRT · passagem1225 a rc=0 (dist index-DTNvzht-.js) → /tmp/r25_passagem1225_a.log
- 16:36 BRT · regressão 1.2.25 (reg1225.sh) TERMINOU
## 16:46 BRT — achados da regressão e correções
- **Recolhimento de aviões (item 5, aereo.js)**: aereo1225 nos super PA falhou (0 caças redecolaram). Causa medida (sem inimigo): o avião voava ao portão 2,4 km à ré sem regra de alinhamento — chegando pela proa orbitava o portão sem nunca alinhar e caía por falta de combustível (12/20 aviões no Abrolhos, 13/17 no Atlântico, 6/6 no Horizonte em 600 s); também caía por combustível já enganchado no convés. Correção: ponto de espera 3,8 km à ré → perna final perseguindo a linha de centro estendida (1,8 km à frente, velocidade de pouso n.v+80) → captura alinhada; bingo pelo caminho real de recolhimento + 20 s; no convés (POUSO) não cai por combustível. Resultado sem inimigo: 0 quedas nos 4 PA (antes 6/6, 13/17, 12/20, 13/16). aereo1225 (com inimigo, 4 PA): OK — redecolaram horizonte 6 (antes 2), atlântico 9 (antes 1), abrolhos 10, costaverde 5; pousos 16/22/23/23.
- **unit (código de 16:13, antes destas correções): 75/1** — falha "Partidas completas… guanabara": 0 afundamentos em 600 s. Causa: os cantos da Guanabara só existem com fundo de 7 m (PROF rasa) e ficam FORA do campo de navegação da IA (grade exige < −10 m) → as duas frotas ficam paradas a ~4 km do centro a partida toda (medido, seed 86). Correção: guanabara `semCantos` → mantém a largada da 1.2.24 (2 afundamentos na mesma partida). spawn1225 passa a tratar `semCantos` como exceção documentada (exige só 0 em terra): OK 17 mapas (guanabara ≈).
- Validação do sorteio de lado (N=24): fiordes 11×13 (antes 3×9 / 0×12), dalmácia 11×13 (antes 4×8 / 2×10); guanabara 12×10+2 (medido antes do semCantos; agora usa a largada antiga).
- hud1225: paisagem OK (pantanal, abrolhos: 0 sobreposições, sem DRONE, LIBERAR); RETRATO com sobreposições de botões (ver próxima entrada).
## 16:50 BRT — HUD retrato: comparação com a base 1.2.24
- Base 1.2.24 (dist :4196, retrato 412×915, destróier, arquipélago): **10 sobreposições** (placar×botão fantasma, fogo×abastece, vls×reparoHeli, granada×avarias, granada×bomba, granada×torpModo, drone×automira, drone×auto, heli×miralivre, heli×torpModo), placar fora da tela, botão DRONE visível.
- 1.2.25 retrato: **4** (fogo×abastece, vls×reparoHeli, heli×miralivre, heli×torpModo), todas pré-existentes; placar dentro da tela, sem DRONE. Paisagem: 0.
- O APK trava em `sensorLandscape` → retrato não ocorre no aparelho. Não reorganizo o leque de botões em retrato (seria retrabalho fora dos itens); fica como lacuna declarada. hud1225 passa a exigir 0 sobreposição só em paisagem e reportar as de retrato.
- 16:50 BRT · dist reconstruído com código final (aereo.js recolhimento + guanabara semCantos)
- 16:50 BRT · regressão completa final iniciada (unit 1×, lanes áudio e UI) dist index-BM35-q1p.js
- 16:52 BRT · placar1225 a rc=0 (dist index-BM35-q1p.js) → /tmp/r25_placar1225_a.log
- 16:52 BRT · aereo1225 a rc=0 (dist index-BM35-q1p.js) → /tmp/r25_aereo1225_a.log
- 16:53 BRT · audio1223 w rc=0 (dist index-BM35-q1p.js) → /tmp/r25_audio1223_w.log
- 17:05 BRT · audio1223 p rc=0 (dist index-BM35-q1p.js) → /tmp/r25_audio1223_p.log
- 17:05 BRT · tresq1225 a rc=0 (dist index-BM35-q1p.js) → /tmp/r25_tresq1225_a.log
- 17:07 BRT · atingido1222 a rc=0 (dist index-BM35-q1p.js) → /tmp/r25_atingido1222_a.log
- 17:09 BRT · espectro1224 w rc=0 (dist index-BM35-q1p.js) → /tmp/r25_espectro1224_w.log
- 17:10 BRT · hud1225 a rc=0 (dist index-BM35-q1p.js) → /tmp/r25_hud1225_a.log
- 17:11 BRT · espectro1224 p rc=1 (dist index-BM35-q1p.js) → /tmp/r25_espectro1224_p.log
- 17:17 BRT · espectro1224 pool rc=1: 16 nós (4×[fonte+filtro+ganho+pan]) criados nas janelas dos golpes — diagnóstico com sonda (tests/_espprobe.mjs, OUT=/tmp)
- 17:20 BRT · sobrepor1216 a rc=0 (dist index-BM35-q1p.js) → /tmp/r25_sobrepor1216_a.log
- 17:21 BRT · elev1225b a rc=0 (dist index-BM35-q1p.js) → /tmp/r25_elev1225b_a.log
- 17:23 BRT · torp1225 a rc=0 (dist index-BM35-q1p.js) → /tmp/r25_torp1225_a.log
- 17:23 BRT · unit (código final) rc=0: 76 passaram, 0 falharam
- 17:23 BRT · elev1225 (node) rc=0
- 17:24 BRT · **causa do espectro pool rc=1**: não é som de golpe. Sonda por janela: laços ativos h0r/h0t (rotor do helicóptero no convés, já na 1.2.24) e, a partir do 4º golpe, **u0 = rotor do drone do jogador**, que desde o item 4 (botão DRONE removido) decola automaticamente (aereo.js: jogador, sim.t>10, relança após a recarga). No modo pool (sem worklet) cada (re)entrada do drone no raio de 2,5 km cria um laço = fonte+filtro+ganho+pan (4 nós); 16 nós = 4 (re)entradas caindo dentro das janelas — intermitente (2 sondas seguintes: 0 nós). Worklet: 0 nós (mixer). Correção no TESTE (isolamento, como já se faz com motor/navegação): rotor de aeronaves silenciado durante a medição. Som do canhão/golpes intocado.
- 17:25 BRT · passagem1225 a rc=0 (dist index-BM35-q1p.js) → /tmp/r25_passagem1225_a.log
- 17:25 BRT · regressão 1.2.25 (reg1225.sh) TERMINOU
- 17:27 BRT · espectro1224 p (reexecução, teste isolado) rc=1 → /tmp/r25_espectro1224_p2.log
- 17:34 BRT · causa real do espectro pool (sondas 5–6): o 'duelo' tem aliado a 1,6 km e armas inimigas já em voo (torpedo a 3,7 km, granadas com assobio tonal) que o teste não isolava; no pool (sem worklet) laços/camadas criam nós ao vivo → falha intermitente (0, 4, 16, 63 nós conforme a sorte). Teste corrigido: aliado e armas em voo afastados 40 km + rotor isolado. Código do jogo e som do canhão intocados.
- 17:36 BRT · espectro1224 pool (teste isolado) rc=0 → /tmp/r25_espectro1224_pool3.log
- 17:38 BRT · espectro1224 worklet (teste isolado) rc=0 → /tmp/r25_espectro1224_worklet3.log
- 17:39 BRT · canhao1223 vs base1224 (código final) rc=0 → /tmp/r25_canhao2.log
- 17:39 BRT · regressão final concluída; gerando APK vc28 (dist index-BM35-q1p.js)
- 17:39 BRT · **APK único vc28 gerado**: /workspace/NexoNavalStrike-1.2.25.apk · sha256 85bd8806aeb87070be86a2cfad7fe362f0417900879cc3dba5fa0a41f76ca232 · 15.091.424 B · aapt vc28/1.2.25, só VIBRATE (+ permissão interna androidx de receptor, igual à 1.2.24) · apksigner v1+v2 OK, cert d0c31791…a599 · dist index-BM35-q1p.js · copiado para attachments.
