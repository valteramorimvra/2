# 1.2.20 (vc23) — pedido do Valter 24/10 06:53 BRT
Base: 1.2.19 vc22 (sha d578ae6a…50ed). Mesma chave, só VIBRATE, sem INTERNET.
1. IA bots: reduzir excesso de tiro de canhão — cadência equilibrada/realista (dispara com solução de tiro razoável, rajadas com pausas, mira/recarga realistas, não spam). Sem tirar realismo.
2. IA usa armamento variado conforme distância/alvo: granadas (lança-granadas), foguetes, torpedos, mísseis, canhões — escolha tática, cooldowns.
3. IA continua avançando contra os oponentes (manter item 8 da 1.2.19: distância de combate ~5 km, 0 bots parados, 0 encalhes).
4. IA lança e usa suas aeronaves (helicópteros/aviões embarcados) contra oponentes, com realismo.
5. Regras fixas: fogo amigo 0 dano; granadas/projéteis não interceptáveis, mísseis/torpedos interceptáveis; nada religioso/demoníaco; HUD sem sobreposição.
6. Medir desempenho vs 1.2.19 (menos tiros deve aliviar); não cortar realismo/gráficos.
7. Regressão completa, APK /workspace/NexoNavalStrike-1.2.20.apk vc23, cópia em attachments, manual (Novidades 1.2.20, crédito mantido), relatório.
## Log
3b. (06:54) Valter: bots devem AVANÇAR MAIS RÁPIDO contra os oponentes — aproximação mais veloz (velocidade de avanço maior, fechar distância mais cedo, menos tempo parado/orbitando), mantendo navegação realista e sem encalhes/colisões. Medir tempo até distância de combate vs 1.2.19.
3c. (06:55) Valter: tudo isso (avanço rápido, armas variadas, cadência equilibrada, aeronaves) vale contra QUALQUER oponente — o jogador E os bots do time adversário (bot x bot), não só contra o jogador. Testar combate bot x bot (distância, armas usadas, aproximação).
2b. (06:55) Valter: EQUILÍBRIO no uso de TODAS as armas dos bots — nenhuma arma em excesso (nem canhão, nem míssil, nem torpedo, nem granada, nem aeronave). Distribuição tática realista com cooldowns/munição; teste mede a proporção de uso por tipo e tiros/min por bot.
- 07:38 BRT · Linha de base: tests/ia1220.mjs (novo; derivado do ia1218, adiciona uso de armas por bot/min, por classe, aeronaves via dono do heli, tempo de cada bot até 5 km, PA=1 = cenário com porta-aviões). Base 1.2.19 (/tmp/base1219/src), 13 mapas × 3 cenários × sementes 3,21,34 = 117 partidas, T=300: canhão 66,4 disparos/bot/min; granadas+foguetes 0,73 salvas (5,9 foguetes)/bot/min, lançadas pelo MUNDO no inimigo mais próximo (mesmo sem contato); mísseis 1,18; torpedos 0,68; aeronaves decolagem 0,44, mísseis 0,34, foguetes 0,53, torpedos 0,12; t até 5 km por bot 59,3 s; dComb 4,87 km; ociosos 0; encalhes 0; fogo amigo 0; colisões 256; vitórias az 58 × vm 54.
- Implementado (src/sim/ai.js, src/naval5v5/armas.js, src/sim/world.js): n.doutrinaIA (bots e navio do jogador com a IA no comando; zera quando o usuário retoma) → (1) AUTO-FOGO por recarga desligado sob a IA; DOUTRINA DE TIRO: trava + 1,5–2 s de firmar, alcance efetivo 66–76% (+6% em ≥150 mm), rajada 4–6 tiros (cad<1,2 s) / 3–4 / 2–3 salvas na cadência real, pausa de observação = voo do projétil + 1,5–3,5 s + 3 s×d/alcance; (2) lança-granadas/foguetes só no alvo DETECTADO e travado, min×1,3…92% do alcance, alvo no setor das montagens, alterna canal granadas/FOGUETES, pausa 1,2–1,9× recarga; mundo não lança sozinho sob a IA; (4) porta-aviões lança ESQUADRILHA com contato < 25 km (helis já decolavam/atacavam); (3b) ataque a toda força até 5,2 km, busca/datum a toda força, capitania toda força até dC+1,5 km, espiral 58–90° entre dc e dl (antes órbita 90°), zigue-zague só < 6,5 km (antes 9), cobertura longe só se < 1,5 km; rumoSeguro com 6 amostras (corrigiu encalhe a toda força no baixio de Guanabara), coluna: quem vem atrás de aliado à proa modera máquina (colisões aliadas 149→65 no teste de 10 partidas).
- 07:38 BRT · ia1220 depois (117 partidas, mesmas sementes): canhão 21,3/bot/min (−68%); salvas canhão 2,05/min; granadas/foguetes 0,39 salvas (3,1 foguetes)/bot/min — só com alvo detectado; mísseis 1,37; torpedos 0,86; aeronaves 0,41 decolagens, 0,33 mísseis, 0,45 foguetes, 0,11 torpedos /bot/min; PA=1 (8 partidas): esquadrilha usada, porta-aviões 1,93 decolagens/min, 3,26 mísseis aéreos/min, canhão do PA 102→23/min. t até 5 km por bot 55,8 s (−6%); bots que nunca chegam a 5 km 151→113; dComb 4,70 km; dTiro 4,50; ociosos 0; encalhes 0; preso 1 s (base 1 s); fogo amigo 0; colisões 191 (base 256); engajam 96,3% (base 99,6%). Bot x bot: todos os navios do teste são IA (incluindo o do jogador como bot de ataque).
- LACUNA: equilíbrio de vitórias az 37 × vm 75 (base 58 × 54). Variantes isolando cada mudança (A avanço, B canhão antigo, C granadas antigas, D coluna, E amostras, F zigue/cobertura, G só armas) ficam todas em ~37–48 × 63–75; rajada proporcional à cadência (v8) piorou (31×78). Tiro com menos volume desloca o dano para mísseis/torpedos e para a composição (vermelho tem o Couraçado 305 mm de capitania). Fica a v6.
- 07:40 BRT · perf1214 base1219 rc=0 (dist index--YxErhjL)
- 07:40 BRT · perf1214 final rc=0 (dist index--YxErhjL)
- 07:41 BRT · perf1214 base1219b rc=0 (dist index--YxErhjL)
- 07:42 BRT · perf1214 finalb rc=0 (dist index--YxErhjL)
- 07:42 BRT · assin1219 a rc=0 (dist index--YxErhjL)
- 07:43 BRT · oito1219 o8 rc=0 (dist index--YxErhjL)
- 07:45 BRT · som1218 w rc=0 (dist index--YxErhjL)
- 07:48 BRT · som1218 s rc=0 (dist index--YxErhjL)
- 07:50 BRT · curva1219 cv rc=0 (dist index--YxErhjL)
- 07:52 BRT · camo1219 cm rc=0 (dist index--YxErhjL)
- 07:53 BRT · fx1219 fx rc=0 (dist index--YxErhjL)
- 07:58 BRT · sobrepor1216 sb rc=0 (dist index--YxErhjL)
- 08:04 BRT · canhoto1217 ch rc=0 (dist index--YxErhjL)
- 08:07 BRT · heli1218 he rc=0 (dist index--YxErhjL)
- 08:09 BRT · cine1218 ci rc=0 (dist index--YxErhjL)
- 08:14 BRT · mapas1219 d rc=0 (dist index--YxErhjL)
- 08:21 BRT · mapas1219 e rc=0 (dist index--YxErhjL)
- 08:26 BRT · mapas1219 f rc=0 (dist index--YxErhjL)
- 08:26 BRT · lend1215 ln rc=0 (dist index--YxErhjL)
- 08:27 BRT · linhaTiro1219 lt rc=0 (dist index--YxErhjL)
- 08:28 BRT · PAROU (sem uso). Ao retomar: corrigir desequilíbrio de vitórias por time (1.2.20: vermelho 75 x azul 37; 1.2.19: 54 x 58) — doutrina dos bots deve ser simétrica entre times; retestar ia1220 antes do APK. Seguir regressão após cine1218.
- 08:39 BRT · unit final (solo, timeout 2400 s) rc=0 (dist index--YxErhjL)
- 09:08 BRT · RETOMADO. Causa do desequilíbrio: (a) navio do jogador (azul) jogando como bot saía SEM consumíveis no teste (bots têm kit/controle/bomba) — metade da frota azul no 2v2; (b) ala/personalidade/escalonamento da IA usavam o id GLOBAL (vermelho = ids 8–15 → outra distribuição de alas e agressividade que o azul); (c) ameaças (drones/lanchas) com tempos diferentes por lado (38/6 × 44/8). Correções: ai.js idxTime() — ala, agr, prox, tMis, zigue-zague e abalroamento pelo índice DENTRO do time; defesa.js tempos iguais 41/7; ia1220 dá ao navio do jogador o mesmo kit prata dos bots (SEMCONS=1 desliga). Retestando ia1220 (117 partidas).
- 09:23 BRT · Diagnóstico: ia1220 v9 (só idxTime/consumíveis/ameaças) ainda az 38 × vm 73. Testes com os LADOS TROCADOS (azul nasce na base vermelha) e com ordem invertida mostraram que (1) a geografia de cada lado pesa por mapa e (2) a ORDEM DE PROCESSAMENTO dava vantagem a quem era processado por último (vermelho): 2v2 sem ilhas az 11 × vm 26 → invertendo só a ordem dos navios 13×24, só a ordem das IAs 15×23, as duas 19×17. Correção: world.ordemTick() inverte a ordem dos navios a cada tick (sem alocação por quadro) e o LocalBotAdapter alterna qual IA decide primeiro. 2v2 depois: sem ilhas 19×18 (trocado 16×21).
- 09:27 BRT · ia1220 v10 (117 partidas, sementes 3,21,34, T=300) com a ordem neutra: vitórias az 52 × vm 60 × empate 5 (antes 37 × 75; base 1.2.19 58 × 54). LADOS TROCADOS (mesmas partidas, azul na base vermelha): az 53 × vm 57 × 7. Somando as duas: azul 105 × vermelho 117 (47% × 53%, dentro do ruído; desvio-padrão ≈ ±7). Por cenário (normal/trocado): frota padrão 22×12 / 20×15, 4v4 14×25 / 21×17, 2v2 ilhas 16×23 / 12×25 (2v2 com ilhas ainda puxa para o vermelho nos dois sentidos — lacuna pequena, sem causa achada). Uso de armas por bot/min: canhão 20,7 (salvas 2,0), granadas/foguetes 0,39 salvas (3,2 foguetes), mísseis 1,37, torpedos 0,86, aeronaves 0,41 decolagens / 0,33 mísseis / 0,44 foguetes / 0,11 torpedos; t até 5 km 55,9 s; dComb 4,69 km; dTiro 4,49 km; engajam 96,0%; ociosos 0; encalhes 0; preso 1 s; fogo amigo 0; colisões 157 (v6 191, base 256). Manual: parágrafo 'Lados equilibrados' em Novidades 1.2.20. Build dist index-DDxgC7Gd. Regressão completa refeita (reg1220b) por causa da mudança no laço do mundo.
- 09:28 BRT · perf1214 base1219c rc=0 (dist index-DDxgC7Gd)
- 09:29 BRT · perf1214 final2 rc=0 (dist index-DDxgC7Gd)
- 09:29 BRT · assin1219 a2 rc=0 (dist index-DDxgC7Gd)
- 09:29 BRT · oito1219 o82 rc=0 (dist index-DDxgC7Gd)
- 09:32 BRT · som1218 w2 rc=0 (dist index-DDxgC7Gd)
- 09:33 BRT · ia1220 PA=1 (porta-aviões, 13 mapas, semente 3): esquadrilha 26 lançamentos, aeronaves 0,64 decolagens / 0,93 mísseis / 0,35 foguetes / 0,12 torpedos por bot/min, canhão 20,7/bot/min, mísseis 0,81, torpedos 0,75, granadas/foguetes 0,17 salvas; ociosos 0, encalhes 0, fogo amigo 0; vitórias az 2 × vm 8 × 3 (amostra pequena, frotas mistas diferentes por lado). perf1214: base 1.2.19 laço 18,38 ms × 1.2.20 18,42 ms (igual).
- 09:34 BRT · som1218 s2 rc=0 (dist index-DDxgC7Gd)
- 09:36 BRT · curva1219 cv2 rc=0 (dist index-DDxgC7Gd)
- 09:38 BRT · camo1219 cm2 rc=0 (dist index-DDxgC7Gd)
- 09:40 BRT · fx1219 fx2 rc=0 (dist index-DDxgC7Gd)
- 09:43 BRT · sobrepor1216 sb2 rc=0 (dist index-DDxgC7Gd)
- 09:49 BRT · canhoto1217 ch2 rc=0 (dist index-DDxgC7Gd)
- 09:53 BRT · heli1218 he2 rc=0 (dist index-DDxgC7Gd)
- 09:54 BRT · cine1218 ci2 rc=0 (dist index-DDxgC7Gd)
- 10:00 BRT · mapas1219 d2 rc=0 (dist index-DDxgC7Gd)
- 10:07 BRT · mapas1219 e2 rc=1 (dist index-DDxgC7Gd)
- 10:17 BRT · mapas1219 f2 rc=0 (dist index-DDxgC7Gd)
- 10:17 BRT · lend1215 ln2 rc=0 (dist index-DDxgC7Gd)
- 10:18 BRT · linhaTiro1219 lt2 rc=0 (dist index-DDxgC7Gd)
- 10:40 BRT · unit final2 (solo, timeout 2400 s) rc=0 (dist index-DDxgC7Gd)
- 20:17 BRT · RETOMADO (sem atividade nos últimos 25 min; só vite preview ociosos). Investigando mapas1219 e2 rc=1: falha única 'saofrancisco: programas novos 134→135' (e da 1ª regressão passou). Reexecutando saofrancisco isolado.
- 20:19 BRT · mapas1219 saofrancisco (isolado) rc=0, programas 147→147. Na falha o 1º instante tinha 134 (aquecimento de shaders ainda não concluído no momento da amostra, quadro a 1,7 fps no SwiftShader) → timing de teste, não bug. Reexecutando grupo e3 completo.
- 20:26 BRT · mapas1219 e3 rc=1 (dist index-DDxgC7Gd)
- 20:36 BRT · mapas1219 e3 (grupo completo) rc=1 de novo: saofrancisco 126→127 (1 programa novo, intermitente: 2 de 5 execuções; frotas sorteadas mudam o total 126–147). Tratando como possível bug real; teste de depuração tests/_dbgprog.mjs lista o programa novo.
- 20:47 BRT · Sonda tests/_sondaprog.mjs: saofrancisco 3 partidas × 90 s com a IA lutando (147/153/147 programas) → 0 programas novos em combate; depuração _dbgprog 6 execuções (isoladas e em grupo) → 0 novos. Falha 'programas novos +1' em saofrancisco não reproduz (2 de 14 execuções no total, só no grupo da regressão, sempre +1 após as destruições forçadas pelo teste). Registrada como lacuna pequena (no pior caso 1 compilação de sombreador única numa partida). Reexecutando grupo e4 para a regressão.
- 20:54 BRT · mapas1219 e4 rc=0 (dist index-DDxgC7Gd)
- 20:54 BRT · mapas1219 e4 (grupo completo) rc=0 (programas 135/141/133/147 sem novos) (dist index-DDxgC7Gd). Regressão reg1220b completa: todos rc=0 (e2/e3 intermitente, ver acima). Itens 1–7, 2b, 3b, 3c conferidos no log. Gerando APK: cap copy + gradlew assembleRelease.
- 20:55 BRT · APK construído (gradlew assembleRelease, JAVA_HOME=/workspace/jdk17) do dist index-DDxgC7Gd (JS no APK idêntico ao dist). apksigner verify --print-certs: v1+v2, cert SHA-256 d0c31791ddd24b04f792bd152d59bda85120523e6f523dabd50a246713d9a599 — IGUAL à 1.2.19 (diff vazio). package br.com.valteramorim.nexonaval, versionCode 23, versionName 1.2.20; permissões: só android.permission.VIBRATE (+ a interna DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION do androidx, igual à 1.2.19).
- 20:55 BRT · **FINAL/ENTREGUE** · /workspace/NexoNavalStrike-1.2.20.apk + cópia /home/box/agent-data/agents/c98e0fb9-cd2b-49e7-9b39-7bb4ba2b1e4b/attachments/NexoNavalStrike-1.2.20.apk · sha256 54b819177b524874af270973384e9da50b03029eacae122f8691929948bed5d9 · 14.103.057 bytes. Lacunas: 2v2 com ilhas ainda puxa para o vermelho (16×23 / 12×25 trocado); aproximação só −6% no tempo até 5 km (59,3→55,9 s; bots que nunca chegam a 5 km 151→113); 'programas novos +1' intermitente em saofrancisco no teste mapas1219 (2/14, não reproduzido); sem teste em aparelho real.
