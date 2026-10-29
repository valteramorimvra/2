# 1.2.21 (vc24) — pedido do Valter 24/10 21:25 BRT
Base: 1.2.20 vc23 (sha 54b81917…d5d9). Mesma chave, só VIBRATE, sem INTERNET, sem CDN, assets CC0/PD/CC-BY ou sintetizados.
1. Som de canhões: alguns precisam de mais realismo e um pouco mais de potência (manter assinatura por navio/calibre; não piorar os que estão bons).
2. Fumaça preta ao ser atingido (ex.: granadas) está forte demais — equilibrar (densidade/opacidade/duração proporcional ao dano/arma), realista.
3. Antiaéreas: menos brilho, traçantes mais finos (hoje parecem raios amarelos) — tracer realista, fino, curto.
4. Navegação: som de motor para navios a combustão (diesel/turbina a gás conforme classe), volume pela velocidade; reduzir o chiado (hiss de água/vento) ao navegar forte.
5. Chiado de aproximação de granadas, mísseis e foguetes no ar: diminuir/equilibrar (mais sutil, realista, com distância/doppler).
6. Projéteis de canhão e granadas mais realistas (forma, tracer, motion blur, escala por calibre), inclusive no cinema.
7. Torpedos: coluna d'água alta no impacto no alvo — verificar que aparece SEMPRE (testar todos os modos e cinema).
8. Som característico realista NO IMPACTO para cada arma: míssil, granada, torpedo, foguete, canhão (por calibre), etc.
9. Regras: 0 programas WebGL novos/partida, 0 nós de áudio em combate, sem cortar realismo, HUD sem sobreposição, fogo amigo 0, não tocar no projeto B.
10. Regressão completa, desempenho ≥ 1.2.20, APK /workspace/NexoNavalStrike-1.2.21.apk vc24 + cópia em attachments, manual (Novidades 1.2.21, crédito mantido), relatório.
## Log
- 21:26 BRT · INÍCIO 1.2.21: sem outra sessão (só PROGRESSO-1.2.21.md modificado pelo escopo, nenhum teste rodando). Base copiada: src → /tmp/base1220/src, assets do APK 1.2.20 → /tmp/apk1220 (perf A/B).
8b. (21:26) Valter: som de LANÇAMENTO mais realista para lança-granadas (baque/estalo do tubo), foguetes (ignição + rugido do motor-foguete saindo do trilho) e torpedos (disparo por ar comprimido/impulso do tubo + entrada na água). Teste de nível/forma antes e depois.
- 21:27 BRT · Valter reforça: realismo ao extremo e extrema qualidade gráfica em todos os itens; não cortar nada.
- 21:28 BRT · Correção: a base congelada ficou em /tmp/base1220 (arquivos direto, sem subpasta src), com package.json {"type":"module"} e link para node_modules.
- 21:30 BRT · Novo tests/audio1221.mjs (render offline determinístico com Math.random semeado; mede motor/chiado por classe e velocidade, impacto, canhão por calibre, chegada e lançamento). Base 1.2.20 em /tmp/audio1221-base.json.
- 21:33–21:38 BRT · NavalAudio.js: soco da boca do canhão; camadas pré-renderizadas impCal (5 faixas de calibre), impFog, impMis, impTorp, lancGr, lancFog e lancTorp, todas tocadas pelo mixer (0 nós em combate); receitaImpacto/impactoArma e receitaLancamento/lancamentoArma; curvas chegadaGranada, chegadaFoguete, vooMissil e ganhoPassagem; motor mais alto e chiado mais baixo; laço do míssil com mais rugido e menos chiado. bancoSom: nav:proa menos agudo, gr:assobio mais tonal e grave. NavalAudioManager: o voo do míssil passa por um passa-baixa conforme a distância. combate3D: chamadas novas de impacto, lançamento e chegada.
- 21:39 BRT · Ajuste fino: soco do canhão e rugido do foguete mais fortes; banco de motor +; lancGr 1.0.
- 21:40 BRT · Item 2/3/6/7 em fx.js, avarias.js, armasParametros.js e combate3D: Efeitos.kFumaca (fumaça ∝ arma e dano), explosao(fum), impactoCanhao(kd), fumacaPretaFx e secundariaMissil ∝ k, foco com duração e intensidade ∝ kd (intFoco), opacidade do incêndio 0,36+0,24·int; traçantes AA finos, curtos, laranja-avermelhados, brilho ×1,3 (era ×2,2), piso 0,0018 rad; traçante de granada com Efeitos.dimTracante (diâmetro ∝ calibre, piso 1,5 px, comprimento = v/60), cor #ff7a2a ×1,55; pool próprio this.agua para a coluna do torpedo, mesmo shader e sem degradação.
- 21:41 BRT · Novo tests/fx1221.mjs (node, Efeitos real sem WebGL). Antes → depois:
  - fumaça escura, Σα·vida: granada 127 mm 96,8→40,2, 76 mm 58,2→16,6, foguete 97,9→37,2, LG 96,1→40,5, 280 mm 156,5→127,5, míssil 376→370 (mantido);
  - vida máxima da fumaça: 7,5→4,1–5,3 s nos golpes leves;
  - foco de incêndio, granada forte: 70→36 s, α máx 0,54→0,40;
  - traçante AA: largura 1,03→0,71 px (0,40→0,28 m a 150 m), comprimento 18→11 m, brilho 2,2→1,3, G/R 0,78→0,50;
  - traçante de granada 127 mm: diâmetro a 60 m 3,3→1,6 px, comprimento a 1200 m 26→24 m e a 300 m 26→13,7 m (borrão v/60), brilho 2,1→1,55;
  - coluna do torpedo sob carga: visível ≥60% em 0/20→20/20 (nível 0), 0/20→20/20 (nível 1), 9/20→20/20 (nível 2); fração viva aos 2 s 0,30/0,49/0,60→0,92.
- 21:42 BRT · Áudio (audio1221), antes → depois:
  - motor médio − chiado a toda força: diesel +1,8→+5,5 dB, codog −3,5→+6,6, cogag −5,4→+5,6, vapor −10,5→0,0;
  - chiado a toda força −6 a −7 dB; total ±0,5 dB;
  - soco do canhão (150–500 Hz) +2,2 a +4,2 dB por calibre, RMS de 300 ms igual;
  - impacto: impactoDistMin 0→0,171 (todas as armas e calibres distintos; antes foguete = canhão 30 = canhão 76);
  - chegada da granada: rate 1,6 fixo → 1,26–1,35; volume a 300 m 0,83→0,48;
  - assobio: centróide 2408→2013 Hz;
  - laço do míssil: centróide 2866→1765 Hz; volume do míssil −27%;
  - foguete: rate 1,8→1,32;
  - lançamento: foguete rms −27,2→−23,3 e médio −33,4→−24,6 (rugido); torpedo ataque 0→3,7 dB e decaimento 4→0,7 s (impulso + entrada); granada pico 6,6→8,0.
- 21:43 BRT · Versão: vc24 / 1.2.21 em build.gradle, package.json e NavalAudio diag; manual "Novidades 1.2.21" com o crédito mantido.
- 21:45 BRT · dist index-C3jhzSmN (vite build, sem teste de navegador rodando).
- 21:46–21:53 BRT · Novo tests/torp1221.mjs, rc=0 (dist index-C3jhzSmN):
  - modos frota, duelo, reto e treino × câmeras perto, longe, convés, torpedo e cinema × fator 1 e 0,5, com o pool de fumaça cheio (degradação 0,65/0,33): 40/40 eventos torpImpacto geraram 40/40 colunas, com 251 partículas vivas a 1,8 s em todos;
  - torpedos REAIS da IA na frota a 2,2 km por 90 s: 10 impactos → 10 colunas (100%);
  - programas WebGL antes = depois em todos os modos (139/114/127/108); 0 erros JS.
  - Lacuna: a câmera "torpedo" exige torpedo próprio em voo e caiu para "perto"; a emissão não depende da câmera.
- 21:54 BRT · fx1219 no dist novo: TUDO OK (programas iguais, 0 erros). Fotos em nexo-naval-shots/1221/fx1219: o diretório de saída do teste mudou para não sobrescrever as fotos da 1.2.19. A coluna do torpedo continua igual à 1.2.20, e as granadas aparecem com corpo e traçante fino laranja.
- 21:55 BRT · perf1214 base1220 rc=0 (dist index-C3jhzSmN.js)
- 21:56 BRT · perf1214 final rc=0 (dist index-C3jhzSmN.js)
- 21:57 BRT · perf1214 base1220b rc=0 (dist index-C3jhzSmN.js)
- 21:58 BRT · perf1214 finalb rc=0 (dist index-C3jhzSmN.js)
- 21:58 BRT · servidor 1.2.20 :4181 encerrado
- 21:58 BRT · assin1219 a rc=1 (dist index-C3jhzSmN.js)
- 21:58 BRT · oito1219 o8 rc=0 (dist index-C3jhzSmN.js)
- 22:01 BRT · som1218 w rc=0 (dist index-C3jhzSmN.js)
- 22:12 BRT · PAROU (sem uso). Ao retomar: investigar assin1219 a rc=1 (21:58; pode ser efeito esperado do item 1 — ajustar teste ou som), continuar regressão após som1218 w, gerar APK vc24.
- 22:13 BRT · som1218 s rc=0 (dist index-C3jhzSmN.js)
- 22:13 BRT · RETOMADA: nenhuma outra sessão. Os únicos processos de teste são da minha regressão /tmp/reg1221.sh (som1218 s em curso), e o único arquivo modificado nos últimos 5 min é este PROGRESSO.
- 22:16 BRT · assin1219 a rc=1 (21:58) investigado. Não é bug: a falha vinha da guarda de texto idêntico do bloco toca…salva, que também contém passagem() e atualizaMotor(), alteradas DE PROPÓSITO nos itens 4 e 5. O caminho do canhão (toca, _fonte, _ruido, _osc, síntese, salvaTorres) segue idêntico. Teste ajustado: passagem e atualizaMotor ficam fora da comparação bit a bit, mais uma checagem nova de que levam a marca da 1.2.21. Medidas acústicas dos cruzeiros iguais às de antes (cp_grande −12,5 dB, cp_100 −12,0, cp_30 −17,3, cp_127 −18,7). assin1219 a2 rc=0 (26 OK, dist index-C3jhzSmN.js).
- 22:15 BRT · curva1219 cv rc=0 (dist index-C3jhzSmN.js)
- 22:20 BRT · camo1219 cm rc=0 (dist index-C3jhzSmN.js)
11. (22:21) BUG Valter — disparo do canhão do jogador:
 a) Ao apertar atirar, às vezes NÃO dispara (ex.: tiro anterior ainda não chegou / mira automática não travou). Deve disparar IMEDIATAMENTE ao toque, independente de travar mira/procurar alvo (atira na direção atual da mira; travamento só refina). Respeitar só recarga real da torre.
 b) Depois de apertar o tiro, ao acertar o alvo o canhão FICA ATIRANDO SOZINHO. Corrigir: toque = 1 disparo (por torre, como 1.2.14: tap 1 torre, segurar todas); disparo contínuo só com botão segurado ou auto-fogo explicitamente ligado pelo jogador.
 c) Recarga: algumas armas recarregam rápido demais — equilibrar tempos realistas por calibre/tipo (canhão pesado > médio > leve; lança-granadas, foguetes, torpedos, mísseis com tempos de recarga realistas); valer para jogador e bots igual. Tabela antes/depois no relatório.
 Teste novo disparo1221: toque sem trava → dispara em ≤1 frame após recarga; após acerto, 0 disparos extras sem input; tempos de recarga por classe dentro da tabela.
- 22:21 BRT · fx1219 fx rc=0 (dist index-C3jhzSmN.js)
12. (22:24) Valter: RETIRAR o triângulo vermelho que sinaliza granadas chegando (indicador de ameaça de granada/projétil de canhão). Remover só esse marcador de granadas; manter os demais avisos que ele não pediu para tirar (mísseis/torpedos). Teste: 0 triângulos de granada no HUD com granadas em voo; sobrepor1216 ok.
- 22:25 BRT · sobrepor1216 sb rc=0 (dist index-C3jhzSmN.js)
13. (22:26) Valter: ao o NAVIO DO JOGADOR ser atingido por míssil, granada, canhão ou foguete (e torpedo), tocar o som característico do impacto DAQUELA arma inimiga no casco (metal, por calibre/tipo; em primeira pessoa, mais forte/próximo que impactos distantes). Opções nos ajustes: "Vibrar ao ser atingido" (usar VIBRATE, intensidade ∝ arma) e "Tremor da tela ao ser atingido" (shake de câmera ∝ arma, curto, realista), ambas liga/desliga e salvas. 0 nós de áudio em combate; HUD sem sobreposição. Teste: impacto por arma → som certo + vibração/tremor conforme opção.
- 22:31 BRT · canhoto1217 ch rc=0 (dist index-C3jhzSmN.js)
- 22:33 BRT · item 11 implementado: (a) toque = 1 torre, pendência limitada a recarga + giro real + 0,3 s e disparo com o cano a < 0,06 rad (antes 0,02 rad e pendência fixa de 12 s → tiro atrasado/"sozinho"); (b) segurar do jogador envia {canhao, seg} a cada 0,35 s só com o botão realmente apertado e 'canhaoSolta' ao soltar; HUD solta também em pointercancel/blur e só pelo mesmo dedo; (c) recarga mínima por calibre PARAM.recarga (sim, igual p/ bots), torpedo 2,5→4 s entre tubos, VLS 1,2→2 s, lança-foguetes ≥15 s.
- 22:33 BRT · disparo1221 (node, sim): novo 189 ok / 0 falhas (atraso máx do toque 0 quadro, 0 tiros extras após acerto, 0 tiros após soltar); BASE 1.2.20 no mesmo roteiro: 52 falhas (toque com mira em movimento saiu 3 quadros depois em 14 classes pesadas, 94 tiros depois de soltar em 38 classes). Tabela antes→depois em /tmp/disparo1221-{base,novo}.json.
- 22:33 BRT · item 12: grIndicador sempre oculto (triângulo de granada removido; alerta de míssil e torpedo mantidos). Item 13: NavalCombat3D.atingido(tipo, cal) → vibração e tremor por arma (ajustes vibrar / tremorAtingido, salvos, padrão ligados) + impactoArma no casco (d ≤ 30 m, ×1,15) quando o alvo é o jogador. Teste tests/atingido1221.mjs (navegador) aguardando novo dist. Manual: Novidades 1.2.21 com itens 11–13.
14. (22:34) Valter via Grok Bot — balística e física do canhão (jogador e bots):
 a) Elevação bem maior (tiro em arco/morteiro além do tiro tenso), limites mecânicos por classe/calibre.
 b) Física da torre/cano: rotação com inércia, aceleração/desaceleração angular, limites mecânicos, recuo no disparo e retorno amortecido (mola-amortecedor).
 c) Projétil sai exatamente da boca do cano, no eixo do cano, v0 decomposta por elevação/azimute + velocidade do navio + balanço do mar.
 d) Balística: g 9,81, arrasto quadrático ½ρCdAv², passo fixo (RK4 ou semi-implícito) independente de FPS; projétil gira e acompanha a tangente; vento opcional.
 e) Mira mostra trajetória prevista (arco pontilhado) e ponto de impacto pela MESMA física (sem sobrepor HUD; símbolos pequenos).
 f) Gráficos: clarão de boca, fumaça, rastro, onda de choque, splash com espuma, explosão com partículas — sem perder desempenho.
 Manter: toque dispara imediato (item 11), shells não interceptáveis, fogo amigo 0, IA usa a mesma balística (rever equilíbrio ia1220). Testes: balist1221 (alcance vs. elevação bate com integração de referência, independência de FPS 30/60/120 < 1%, saída na boca ±0,05 m, previsão = impacto real ±1%).
 NÃO tocar no Armor Strike (nexoarmor) — regra fixa.
- 22:35 BRT · heli1218 he rc=0 (dist index-C3jhzSmN.js)
- 22:37 BRT · cine1218 ci rc=0 (dist index-C3jhzSmN.js)
- 22:43 BRT · mapas1219 d rc=0 (dist index-C3jhzSmN.js)
15. (22:47) BUG Valter: navio e fumaça balançando de forma errada ao navegar — "fica subindo e descendo" (heave/bob exagerado ou periódico artificial). Corrigir:
 a) Movimento do casco realista: heave/pitch/roll derivados do mar real (amostrar a superfície das ondas em vários pontos do casco: proa, popa, bordos), com massa/inércia e amortecimento por tamanho da classe (navio grande quase não sobe/desce em mar calmo), sem oscilação senoidal fixa; amplitude proporcional ao estado do mar e velocidade.
 b) Fumaça (chaminé, incêndio, disparos) emitida no ponto do mundo e depois SOLTA do casco: partículas não herdam o heave do navio após emitidas; sobem por empuxo e derivam com vento/velocidade relativa, sem "pular" junto.
 c) Câmeras (perto, convés, cinema) não amplificam o bob; camera smoothing.
 Teste balanco1221: amplitude de heave por classe em mar calmo/médio (antes/depois), espectro sem pico artificial, fumaça sem correlação com heave do casco após emissão; fotos/vídeo de quadros.
- 22:49 BRT · mapas1219 e rc=0 (dist index-C3jhzSmN.js)
- 22:54 BRT · mapas1219 f rc=0 (dist index-C3jhzSmN.js)
- 22:54 BRT · lend1215 ln rc=0 (dist index-C3jhzSmN.js)
16. (22:54) BUG Valter: durante a partida, ao tocar na zona central para ver os jogadores (placar/lista de jogadores), os nomes aparecem ABREVIADOS. Mostrar nomes completos (navio + jogador/bot, ex.: "VALTER AMORIM", "Alm. Leidevaldo"): coluna mais larga, quebra em 2 linhas ou fonte levemente menor quando preciso, sem reticências; sem sobrepor botões; vale para destro e canhoto e para 8×8. Teste: placar1221 — 0 nomes truncados (texto renderizado == texto completo) em 8×8 nas resoluções de teste; sobrepor1216 ok.
16b. (22:55) Valter: com o painel de jogadores aberto, QUALQUER toque na tela ou em qualquer botão deve FECHAR o painel e voltar à tela de batalha (o toque num botão fecha o painel; não deve ficar preso). Teste placar1221: toque fora/dentro do painel e em cada botão do HUD → painel fechado em ≤1 quadro, HUD de batalha visível.
- 22:57 BRT · linhaTiro1219 lt rc=0 (dist index-C3jhzSmN.js)
- 22:58 BRT · item 14 (código sim): torre converge no ponto de PONTARIA compensado (S.qx/qz); direção de tiro compensa a velocidade vertical da boca (arfagem/balanço); TIRO EM ARCO com CARGA REDUZIDA: elevação ~57° (ou o limite da torre) e V0 de boca resolvida pela mesma integração da sim (Illinois, partida a quente: 0,33 ms a cada 6 passos e só quando o arco baixo está bloqueado); dispersão em alcance do arco pela carga (alcance ∝ V²). Tabela principal volta a 0–45° (sessão 5v5 +130–270 ms vs 1.2.20, só no carregamento).
- 22:58 BRT · balist1221 rc=0: 117 ok / 0 falhas — RK4 de referência × sim máx 0,19%; FPS 30/60/120 máx 0,0002%; boca 0 m; previsão × impacto 0,017%; pontaria com o navio andando 0,37%; ramo alto: corsário 57,3° carga 0,062 (204 m/s, 34,7 s, ápice 1.482 m), destróier 57,3° 0,071, cruzador 57,3° 0,089, tridente 57,3° 0,097, trovão 44,4° (limite 45°) 0,103. disparo1221 rc=0 189/0 após item 14.
- 22:58 BRT · item 15 (sim): flutuacaoCasco = cada trem de onda (fase Gerstner do shader) integrado sobre o plano de flutuação 0,92L×0,85B + efeito Smith (e^(−k·calado/2)); dinamicaCasco por classe (T arfagem = 2π√(calado·0,67·2/g): 4,5 s corsário … 8,9 s encouraçado; balanço 0,78B/√(0,075B): 9,5–20 s; ζ 0,35/0,40/0,09 + aletas como amortecimento); removida a senoide fixa de caimento (sim.mundoInc e grupo 3D). Render: local() = mundoInc (fumaça/borrifo nascem na chaminé real), fumaça de chaminé solta no mundo com 0,35·v do navio + empuxo e arrasto até o vento; câmera perto/longe segue arfagem filtrada (τ 3,5 s); removido o tremor senoidal de 13,7 rad/s da câmera.
- 22:58 BRT · balanco1221 (parte A, node) rc=0 26/0. Antes→depois arfagem pp: bf2 corsário 0,092→0,004 m, destróier 0,105→0,002, cruzador 0,066→0,001, encouraçado 392 m 0,103→0,000; bf5 corsário 1,68→2,19 (ressonância real de navio pequeno), destróier 0,72→0,75, cruzador 0,81→0,27, encouraçado 0,76→0,018. Mar liso a toda: caimento 0,31°→0,000° pp. Pico do caturro contra/a favor do mar 0,255/0,085 Hz (encontro, não fixo).
17. (23:00) BUG Valter: alguns mísseis inimigos atingem a ÁGUA e não o navio, mesmo sem serem abatidos (SAM/CIWS) nem desviados (despistadores/manobra). Míssil não interceptado nem iludido deve ATINGIR o navio: guiagem terminal até o casco (proa navegação + mira no ponto do casco, considerar altura do alvo, sea-skimming com pop-up/ataque final acima da linha d'água, previsão do movimento do alvo e do heave), espoleta de proximidade/impacto com o casco. Erro só por abate, chaff/flare/despiste ou manobra realista documentada. Vale jogador e bots. Teste missil1221: N mísseis sem defesa contra alvos parados e manobrando → 100% acertos no casco; com defesa → acertos + abatidos + iludidos = total, 0 "na água sem motivo".
18. (23:01) Valter: MÍSSIL ABATIDO (SAM/CIWS/AA) deve EXPLODIR NO AR de forma realista e com alta qualidade gráfica: clarão + bola de fogo (ogiva detonada ou motor/combustível), estilhaços incandescentes, nuvem de fumaça escura/cinza que deriva com o vento, destroços em queda balística caindo na água com pequenos splashes; som da explosão aérea com atraso e atenuação pela distância (estrondo seco perto, ribombo longe). Pool, 0 programas WebGL novos, 0 nós de áudio em combate. Vale jogador e bots, todos os modos e cinema. Teste abate1221: 100% dos abates geram explosão aérea + destroços + som; programas iguais; 0 erros.
19. (23:14) Valter pergunta: os MÓDULOS comprados (radar_aesa, vls_extra, turbinas, leme_hidraulico, controle_avarias, carregador) + propulsão, munição, míssil tandem, pintura, comandante estão aplicados NA PROPORÇÃO CERTA no navio e na batalha? Arquiteto conferiu modsDe (multiplica efeitos) e viu uso direto de vlsMais, trava e avarias no sim; radar/vmax/acel/giro/cad NÃO foram localizados por grep direto — AUDITAR caminho completo até o sim. ATENÇÃO: item 11c criou pisos de recarga (Math.max(A.cad, recargaMinCal) / PARAM.recarga) — garantir que o módulo "carregador" (−8%) continue valendo DEPOIS do piso (piso realista × m.cad), senão o jogador paga e não ganha. Teste modulos1221: para cada módulo/opção, medir em batalha simulada o atributo com e sem (alcance radar, tempo de trava, células VLS, vmax, aceleração 0→vmax, taxa de giro, duração de incêndio/alagamento, intervalo de recarga, dano HE/SAP/AP, pkCiws tandem, rcs da pintura) e conferir razão = descrição ±2%; o estaleiro/ficha mostra os mesmos números; bots com módulos usam a mesma regra. Corrigir onde não bater.
- 23:15 BRT · unit final (solo, timeout 2400 s) rc=0 (dist index-C3jhzSmN.js)
19b. (23:20) Valter: "vi alguma coisa calculando a quantidade de mísseis de forma errada". Arquiteto achou: (1) batalha usa n.vls = C.vls + vlsMais (ok), mas a ficha/estaleiro (main.js:54 e :57) mostra só C.vls, sem as +4 do módulo, e a barra 'Mísseis' também ignora; corrigir para mostrar o total real; (2) células extras reutilizam células já disparadas (vlsUsadas tem tamanho C.vls; fill(0)), então o míssil sai de uma tampa já aberta; criar posições reais para as células extras no layout; (3) o lote tandem tem 8 mísseis (LOTE_CAP), mas m.missil='tandem' vale para TODOS os mísseis da partida; aplicar tandem só aos 8 primeiros e depois usar o padrão, e mostrar a contagem no HUD/ficha; (4) conferir o contador de mísseis do HUD do jogador = n.vls real após recarga/consumo e com a avaria do VLS. Tudo no teste modulos1221/misseis1221.
- 23:20 BRT · item 17 FEITO (sim): causa medida = mar grosso. Pontaria antiga ty = arfagem + 0,7·F (corveta em bf6: 1,3 m) e mergulho PN sem piso: a crista (±3–4 m) engolia o míssil a 30–500 m do casco. Correção em passoMisseis: ponto de pontaria no costado acima das cristas (min(topo da superestrutura, max(0,7F, 1,1·ΣA + 1,6))) + arfagem prevista (arfV × tempo até o impacto, ≤ 0,8 s); rádio-altímetro no cruzeiro (≥ 1,15·ΣA + 2,2 m) e piso no terminal (cristas a 0,12/0,25/0,4 s à frente + 1 m), limitado pelos 30 g. Eventos missilAgua/missilIsca agora levam idx e dono. Teste missil1221 (300 cenários: 5 lançadores × 3 alvos × 3 distâncias × parado/reto/zigue-zague × bf2/bf6, jogador e bot, com e sem defesa): 876 ok / 0. Antes (1.2.20): sem defesa 1094/1104 no casco (10 na água sem motivo); depois 1102/1102 (0). Com defesa: 81 acertos + 15 abatidos/iludidos = 96, 0 na água.
19c. (23:19) Valter: "inclusive os cálculos de comandantes, camuflagens, munição ouro, prata etc. tem que tá certo". Ampliar o modulos1221 para TODA a economia que afeta a batalha:
- comandantes (aplicaComandante, cada especialidade e nível);
- pinturas e camuflagens (furtividade/rcs, hp, bônus lendário +50% com atributos 'menor é melhor' divididos, camos nacionais animadas);
- munição HE/SAP/AP (dano, incêndio, perfuração; lote de 80 tiros = 80 tiros e depois volta ao HE);
- míssil tandem (dano 1,25, pkCiws 0,85, lote de 8);
- iscas ouro, reparo prata/ouro e consumíveis (usos, recarga, cura);
- propulsão revisada/alto desempenho;
- custos e reembolso proporcional em prata e ouro (saldo nunca negativo, moeda certa);
- manutenção.
Para cada um: efeito medido no sim = descrição ±2%, a ficha do estaleiro mostra o mesmo valor, bots usam a mesma regra, e o empilhamento (módulo × propulsão × pintura × comandante) multiplica sem dupla contagem. Corrigir o que não bater e reportar a tabela.
20. (23:48) Valter: navio ao longe, quando visualizado (inclui a mira/zoom/binóculo), fica com BAIXA RESOLUÇÃO. Revisar LOD de navios: com zoom/FOV reduzido, escolher LOD pelo tamanho em PIXELS na tela (não pela distância bruta); subir a distância de troca e suavizar a transição (sem estalo); conferir mipmaps, anisotropia máxima suportada e resolução das texturas/camos no LOD distante; conferir pixelRatio/escala de render dinâmica que possa estar reduzindo a resolução. Sem novos programas WebGL por partida e frame ≤ 1.2.20. Teste lod1221: navio a 2/5/10 km com e sem zoom, comparar capturas antes e depois.
20b. (23:49) Valter: as ARMAS (torres de canhão, lançadores, CIWS, mastros), vistas ao longe, viram PONTOS. No LOD distante manter a silhueta real das armas (torre + cano, lançadores, CIWS) com geometria simplificada mas reconhecível, escolhida pelo tamanho em pixels (inclusive com zoom); canos finos com espessura mínima na tela para não sumir nem virar ponto (sem serrilhado, MSAA/alpha-to-coverage se suportado). Incluir no teste lod1221 (capturas 2/5/10 km com e sem zoom, antes × depois). Sem novos programas WebGL por partida e frame ≤ 1.2.20.
- 23:51 BRT · RETOMADA: nenhuma outra sessão (só servidores :4173/:4174 e meu daemon gradle 851130; único arquivo recente = este PROGRESSO com os itens 20/20b).
- 23:51 BRT · Itens 19/19b/19c (código, feito entre 23:21 e 23:49): layoutDe(C, mais) com células VLS extras em fileira real; modelo 3D com a fileira extra; vlsUsadas do tamanho real; lote tandem 8 e depois padrão; lote SAP/AP 80 tiros e depois HE; reembolso/devolver contam só o lote (loteTiros/tandemLanc); vls_extra não dá mísseis a navio sem VLS; heliMun só do cmte Aviação (pintura lendária dava +25%); consumíveis só pelo cmte Avarias (consCura/consRec), não mais pelo módulo/pintura sem descrição; ficha/estaleiro mostra células base+extras, vmax/giro/vida com módulos e recarga max(piso 11c)·cad. Pintura nos bots (match.js).
- 23:52 BRT · tests/modulos1221.mjs: depois 400 ok / 0 falhas; BASE 1.2.20: 210 ok / 50 falhas (células extras repetidas, tandem eterno, bots 0/297 sem pintura, cmte Navegação aceleração 1,05 vs 1,12, cmte ASW torpedo 1,15 vs 1,25, consumíveis com bônus não descritos ±13–54%, reembolso SAP/AP/tandem 50–92% abaixo do proporcional, visualizar sem módulos). Correção do harness: navio no centro e alvo em marcação de água aberta (antes 'oculto' pelo relevo).
- 00:15 BRT · abate1221 a rc=1 (dist index-9Q3HUhJr.js)
- 00:19 BRT · lod1221 a rc=1 (dist index-9Q3HUhJr.js)
- 00:22 BRT · abate1221 b rc=1 (dist index-9Q3HUhJr.js)
- 00:31 BRT · abate1221 c rc=1 (dist index-B9WT199R.js)
- 00:33 BRT · lod1221 b rc=1 (dist index-B9WT199R.js)
- 00:48 BRT · placar1221 a rc=1 (dist index-B9WT199R.js)
- 00:55 BRT · balanco1221web a rc=1 (dist index-B9WT199R.js)
- 00:56 BRT · atingido1221 a rc=1 (dist index-B9WT199R.js)
- 01:25 BRT · RETOMADA (nova sessão): nenhuma outra sessão ativa (0 arquivos fora de node_modules modificados em 25 min; só vite preview :4173/:4174 e daemon Gradle ocioso 851130). Análise dos rc=1 das 00:15–00:56: atingido1221 = harness (esperava 120 ms, mas no Chrome headless o evento é processado 1 quadro depois → resultados defasados de 1 caso; e o teste setava eu.alertaMissil, que a sim zera a cada passo). Correção no jogo: impacto NO NOSSO casco sempre toca (fora do limite de 4 vozes/quadro); contador _nAtingido para o teste esperar o evento.
- 01:26 BRT · atingido1221 b rc=0 TUDO OK (dist index-4IVFh0Ek.js): vib canhão 76/127/305 = 48/61/107 ms, rbu 55, foguete 80, míssil 240, torpedo 380; tremor 0,26→1,1; desligado = 0 vib/0 tremor e som no casco mantido; alerta de míssil visível, triângulo de granada oculto; programas 110=110.
- 05:19 BRT · RETOMADA: nenhuma outra sessão (último arquivo do projeto 01:51 = tests/balanco1221web.mjs; nenhum teste/navegador rodando; só vite preview :4173/:4174, http.server 1.2.20 :4181 meu e daemon Gradle 851130). dist atual index-BUxM64a9.js (01:30).
- 05:32 BRT · placar1221 b rc=124 (dist index-BUxM64a9.js)
- 05:34 BRT · lod1221 c rc=1 (dist index-BUxM64a9.js)
- 05:37 BRT · balanco1221web b rc=1 (dist index-BUxM64a9.js)
- 05:48 BRT · abate1221 d rc=1 (dist index-BUxM64a9.js)
- 05:55 BRT · Análise 05:19–05:55: abate1221 d rc=1 só no critério de ≥3 abates no duelo (1 inimigo → 2 abates; frota 4, frota-cinema 4; cada abate real = 1 explosão no ar + 2 sons + 7 destroços, respingos = destroços, programas iguais, 0 erros) → critério por modo ≥ 2 e total ≥ 6 (deu 10). lod1221 c: armas 5/5 visíveis em todas as distâncias (antes 0/5 a 5 e 10 km sem zoom), det com zoom, mas PROGRAMAS 110 vs 108 da 1.2.20 → o arco previsto (14e) usava PointsMaterial (programa novo). Correção: arco usa o MESMO shader das partículas (VS_PT/FS_PT exportados de fx.js), 29 pontos num só Points, tamanho fixo em px recalculado por ponto sem alocação. placar1221 b rc=124 (passou de 770 s: 10 tamanhos × ~30 toques) → teste dividido por mão (CAN=0/1) com progresso. balanco1221web b: correlação bruta vy×arfagem é espúria (duas curvas suaves em 1,5–3 s) → critério trocado por integridade física (nenhuma mexida externa na fumaça entre passos e passo = vel·dt) e ganho da câmera por regressão (≤ 1,25).
- 05:58 BRT · arco1221web a rc=1 (dist index-9nLZGsPK.js)
- 05:59 BRT · RETOMADA: nenhuma outra sessão. O Chrome :9778 (pid 984855) NÃO é órfão: é filho do placar1221 c0 em curso (node 984844, da minha fila /tmp/regC.sh) → mantido. Arquivos recentes só meus (tests/arco1221web.mjs, abate1221.mjs, dist das 05:55). arco1221web a rc=1: 'arco visível sem alvo' e 'impacto a 1189 m do alvo' → analisando.
- 06:00 BRT · Sons 1/4/5/8/8b re-verificados: audio1221 no src atual = idêntico (355/355 medidas) ao 'depois' validado às 21:42 (motor×chiado, soco do canhão +2,2 a +4,2 dB, impactos distintos 0,171, chegada/assobio/míssil mais sutis, lançamentos granada/foguete/torpedo). arco1221web corrigido (sem alvo = força alvoId −1; navio parado com alvo pelo través; erro medido contra o ponto de mira da sim). Programas no arco1221web a: 108 = 108 da 1.2.20 (antes da correção eram 110).
- 06:00 BRT · Manual 'Novidades 1.2.21' (crédito mantido) ampliado com: arco na mira, balística real e tiro em arco, casco/fumaça/câmeras no mar real, placar com nomes completos e fechamento por qualquer toque, míssil no casco, míssil abatido explode no ar, economia = batalha (módulos/pinturas/comandantes/VLS/lotes/reembolso), navio distante nítido. Nova chave em Ajustes 'Arco do tiro previsto na mira' (arcoPrev, padrão ligado) — o manual citava a opção e ela não existia na tela.
- 06:04 BRT · placar1221 c0 rc=0 (dist index-9nLZGsPK.js)
- 06:13 BRT · placar1221 c1 rc=0 (dist index-9nLZGsPK.js)
- 06:16 BRT · balanco1221web c rc=1 (dist index-9nLZGsPK.js)
- 06:18 BRT · lod1221 d rc=1 (dist index-9nLZGsPK.js)
- 06:27 BRT · abate1221 e rc=0 (dist index-9nLZGsPK.js)
- 06:40 BRT · RETOMADA: nada rodando, nenhum arquivo novo em 10 min. Análise: placar1221 c0/c1 TUDO OK (16/16b: 32 textos sem truncar, ≤2 linhas, nada coberto, 5 tamanhos × 2 mãos; 17–27 toques/tamanho fecharam 100%). abate1221 e TUDO OK. balanco1221web c: fumaça íntegra (0 mexidas externas, 0 passos fora da física em 1.062 passos), falhas só de harness: cinema com 2 partículas (filtro exigia 24 quadros — a 3 fps = 8 s) → ≥ 6 quadros e ≥ 1,5 s; perto do destróier 'ganho −11' com arfagem de 0,055 m (regressão mal condicionada; câmera 0,53 m = deriva do enquadramento) → séries sem tendência linear e falha só se o ganho > 1,25 E a amplitude sem deriva > max(0,2, 1,25·casco+0,05). lod1221 d: único ponto 10 km com zoom, silhueta 84→64 px; recorte ampliado lado a lado = mesmo navio, depois com canos/armas mais legíveis; contagem < 200 px dominada por névoa/onda → vira aviso informativo. Manual + chave arcoPrev → dist index-DM5Z7_Yn.js. Iniciada regressão completa /tmp/regF.sh.
- 06:42 BRT · arco1221web b rc=1 (dist index-DM5Z7_Yn.js)
- 06:46 BRT · balanco1221web d rc=1 (dist index-DM5Z7_Yn.js)
- 06:48 BRT · lod1221 e rc=1 (dist index-DM5Z7_Yn.js)
- 06:49 BRT · perf1214 base1220f rc=0 (dist index-DM5Z7_Yn.js)
- 06:50 BRT · perf1214 finalf rc=0 (dist index-DM5Z7_Yn.js)
- 06:53 BRT · perf1214 base1220g rc=0 (dist index-DM5Z7_Yn.js)
- 06:54 BRT · perf1214 finalg rc=0 (dist index-DM5Z7_Yn.js)
- 06:54 BRT · assin1219 f rc=0 (dist index-DM5Z7_Yn.js)
- 06:55 BRT · oito1219 f8 rc=0 (dist index-DM5Z7_Yn.js)
- 06:58 BRT · som1218 wf rc=1 (dist index-DM5Z7_Yn.js)
- 07:01 BRT · som1218 sf rc=1 (dist index-DM5Z7_Yn.js)
- 07:02 BRT · atingido1221 f rc=0 (dist index-DM5Z7_Yn.js)
- 07:06 BRT · ia1220 (src 1.2.21, sementes 3,21,34, T=300) rc=0
- 07:06 BRT · ia1220 (BASE 1.2.20, sementes 3,21,34, T=300) rc=0
- 07:09 BRT · torp1221 f rc=0 (dist index-DM5Z7_Yn.js)
- 07:11 BRT · ficha1217 f rc=0 (dist index-DM5Z7_Yn.js)
- 07:12 BRT · curva1219 f rc=0 (dist index-DM5Z7_Yn.js)
- 07:15 BRT · camo1219 f rc=0 (dist index-DM5Z7_Yn.js)
- 07:16 BRT · fx1219 f rc=0 (dist index-DM5Z7_Yn.js)
- 07:19 BRT · RETOMADA (parou ~07:18 por falta de uso). /tmp/regF.sh (pid 1004391) AINDA RODA (em sobrepor1216 f) → deixado terminar; nenhuma outra sessão: único arquivo alterado desde 07:0x é src/modernNavalCombat3D.js (edição minha, ainda sem build). Falhas abertas a decidir: arco1221web b, balanco1221web d, lod1221 e, som1218 wf/sf.
- 07:19 BRT · perf1214 (diagnóstico, antes da RETOMADA): o programa tardio é a variante de PROFUNDIDADE da sombra "mapa sem alphaTest, não instanciada" (malha 'base' do casco, ex.: navio 1 tridente). Causa: o three 0.169 usa 1 MeshDepthMaterial compartilhado e só troca de programa quando alphaTest cruza 0 → depende da ordem dos objetos; na 1.2.21 a ordem mudou e a variante não nascia no aquecimento. Correção em preaquece: 4 cubos 0,1 m sob a água no fim da cena com materiais JÁ existentes (mapa+αT → mapa → mapa+αT → sem mapa), removidos após o 1º render. Sem corte de gráfico.
- 07:24 BRT · Análise dos logs das falhas abertas (todas rodaram com a versão ANTIGA do teste; os testes foram corrigidos depois, 06:54–07:04):
  - arco1221web b (06:42): "arco não apareceu com alvo travado" com alvo=−1 → o harness nunca travou o alvo (o arco só aparece com alvo travado, como pedido no item 14e). HARNESS → teste agora usa o comando real `travar` a cada 250 ms com a mira no alvo; critério de erro ≤150 m mantido.
  - balanco1221web d (06:46): (1) cinema: câmera lenta → só 1 partícula de chaminé seguida no tempo da janela (HARNESS: conta passos ≥15); (2) destroier/perto "ganho −21,6": casco arfa 0,04 m pp, a câmera 0,31 m pp (piso de crista da 15c, independente do casco) → razão mal-condicionada. HARNESS → séries sem tendência, ganho β só reprova junto com amplitude > tolerância angular. Não afrouxa: amplificação real de arfagem (β>1,25 e amplitude visível) continua reprovando.
  - lod1221 e (06:48): contagem de bordas da silhueta oscila entre rodadas (as falhas trocavam de ponto); recorte visual a 10 km mostra o mesmo navio, canos mais legíveis. HARNESS → métrica por diferença com o navio oculto (px do navio ≥ 0,9× antes); bordas ficam como AVISO.
  - som1218 wf/sf (06:58/07:01): única falha "indicador de granada quase nunca apareceu: 0". O item 12 da 1.2.21 OCULTA esse triângulo por pedido → comportamento novo esperado; critério invertido (07:04). Áudio: 0 nós em combate, 29/29 arquivos, 67/67 pré-render, motor 5/5. Base 1.2.20 será rodada para comparar (VZ_URL=:4181).
- 07:24 BRT · /tmp/regG.sh: arco c, balanco e, lod f, som wg/sg, som base1220w/s (1ª tentativa abortada às 07:23 por URL errada da base no script; reiniciada).
- 07:21 BRT · sobrepor1216 f rc=0 (dist index-DM5Z7_Yn.js)
- 07:22 BRT · arco1221web c rc=1 (dist index-DM5Z7_Yn.js)
- 07:23 BRT · balanco1221web e rc=1 (dist index-DM5Z7_Yn.js)
- 07:26 BRT · lod1221 f rc=1 (dist index-DM5Z7_Yn.js)
- 07:28 BRT · ia1220 (BASE 1.2.20 SRC=/tmp/base1220, sementes 3,21,34, T=300) rc=0 (refeito: a rodada das 07:06 usou SRC=/tmp/base1220/src inexistente)
- 07:29 BRT · canhoto1217 f rc=0 (dist index-DM5Z7_Yn.js)
- 07:29 BRT · som1218 wg rc=0 (dist index-DM5Z7_Yn.js)
- 07:32 BRT · som1218 sg rc=0 (dist index-DM5Z7_Yn.js)
- 07:34 BRT · heli1218 f rc=0 (dist index-DM5Z7_Yn.js)
- 07:34 BRT · balist1221 g rc=0 (src, após correção do arco no casco)
- 07:35 BRT · regG: som1218 wg rc=0 e sg rc=0 (critério corrigido; worklet e ScriptProcessor, 0 nós em combate). arco1221web c rc=1, balanco1221web e rc=1, lod1221 f rc=1 → analisados:
  - balanco e: ReferenceError 'dcm' antes da inicialização (linha da tolerância vinha depois do uso) → BUG DO TESTE, linha movida; cinema passa a depender só de passos ≥15 (cm nulo no cinema não reprova).
  - lod f: "2km-sem-zoom: cano com 0,87 px" → BUG REAL DO JOGO: a 2 km sem zoom (navio ~67 px, tela 412 px) o cano de 76 mm precisava de 16× e o teto era 14× → teto 20× (o kB já limita ao mínimo de ~1 px físico; comprimento real mantido). Métrica de silhueta por diferença: 22→22 e 164→161 px (OK).
  - arco c: (1) "impacto a 908 m": BUG REAL DO JOGO — a previsão (sim.prevTiro) não parava no casco; na trajetória tensa o ponto de queda ia ~900 m ALÉM do navio que o tiro real acerta. Correção em world.js: mesma acertaNavio + subamostragem ≤4 m de passoGranadas (objeto reaproveitado, sem alocação). Verificado em /tmp/distchk (:4183): impacto 4984,−260 no navio 1 (alvo 4993,−261) → erro ~9 m. (2) "arco visível sem alvo": HARNESS — a auto-mira do jogo retravava o alvo entre as amostras; teste agora desliga a auto-mira, aponta a mira ao lado oposto e destrava pelo comando real.
  - perf: correção das variantes de profundidade refeita (o three reavalia o programa do MeshDepthMaterial compartilhado só na troca instanciado↔não instanciado): sequência inst(mapa)→base(mapa)→inst(mapa)→sem mapa. Verificado em /tmp/distchk: programas_novos 0 (2 rodadas) e lista de programas IDÊNTICA à 1.2.20 (119 = 119; a 1ª versão dava 120 por criar a variante instanciada sem mapa → removida).
- 07:35 BRT · disparo1221 g rc=0 (src, após correção do arco/acertaNavio)
- 07:35 BRT · som1218 base1220w rc=1 (dist index-DM5Z7_Yn.js)
- 07:36 BRT · disparo1214 g rc=0 (src, após correção do arco/acertaNavio)
- 07:36 BRT · balanco1221 g rc=0 (src, após correção do arco/acertaNavio)
- 07:36 BRT · cine1218 f rc=0 (dist index-DM5Z7_Yn.js)
- 07:36 BRT · missil1221 g rc=0 (src, após correção do arco/acertaNavio)
- 07:36 BRT · som1218 comparação com a BASE 1.2.20 (VZ_URL=:4181): base1220w rc=1 SÓ no critério novo do item 12 (lá o triângulo de granada aparece 156 vezes — comportamento antigo), base1220s rc=0. Áudio igual nas duas: 29/29 arquivos, banco 9/9, motor 5/5, 0 nós por disparo; a 1.2.21 pré-renderiza 67 sons (base 56: sons novos dos itens 1/4/5/8/8b). Conclusão: a falha wf/sf das 06:58/07:01 era critério do teste (item 12), NÃO ambiente nem regressão; wg/sg rc=0.
- 07:38 BRT · som1218 base1220s rc=1 (dist index-DM5Z7_Yn.js)
- 07:42 BRT · mapas1219 fd rc=0 (dist index-DM5Z7_Yn.js)
- 07:48 BRT · mapas1219 fe rc=0 (dist index-DM5Z7_Yn.js)
- 07:53 BRT · mapas1219 ff rc=0 (dist index-DM5Z7_Yn.js)
- 07:53 BRT · lend1215 f rc=0 (dist index-DM5Z7_Yn.js)
- 07:56 BRT · linhaTiro1219 f rc=0 (dist index-DM5Z7_Yn.js)
- 07:57 BRT · regF terminou os testes de navegador (todos rc=0 de sobrepor a linhaTiro; unit em curso, só Node). dist reconstruído com as correções (depth-aquecimento, teto do cano 20×, arco para no casco): index-BM0bKaRl.js
- 07:58 BRT · CORREÇÃO da nota das 07:36: som1218 base1220s terminou às 07:38 com rc=1 (não 0), pelo MESMO motivo da base1220w: triângulo de granada aparece 157 vezes na 1.2.20 (item 12 o retirou). Áudio da base igual (29/29, motor 5/5, 0 nós por disparo). Conclusão mantida: critério, não ambiente nem regressão.
- 07:59 BRT · arco1221web d rc=1 (dist index-BM0bKaRl.js)
- 08:02 BRT · balanco1221web f rc=0 (dist index-BM0bKaRl.js)
- 08:04 BRT · lod1221 g rc=1 (dist index-BM0bKaRl.js)
- 08:11 BRT · RETOMADA (parou ~08:07 por falta de uso). regF.sh (pid 1004391) ainda roda o unit (só Node) → deixado terminar, sem duplicar. Pendentes: arco1221web d (07:59) e lod1221 g (08:04) no dist index-BM0bKaRl.js.
- 08:13 BRT · Análise arco1221web d e lod1221 g:
  - arco d: impacto agora a 8 m do ponto de mira (antes 908 m) e "sem alvo" oculto ✓. (1) "não sumiu ao destravar": HARNESS — após destravar, a auto-mira do jogo (mira ainda sobre o navio) retravou o alvo (alvo=1, arco correto para alvo travado); o teste agora destrava sem auto-mira e com a mira desviada, igual ao "sem alvo". (2) "programas 109 > 108": BUG REAL meu — os cubos de aquecimento criavam no duelo a variante de sombra 'mapa sem alphaTest' que a 1.2.20 não usa ali. Correção definitiva (substitui os cubos): onBeforeShadow em todas as malhas tira o mapa do MeshDepthMaterial quando não há alphaTest (o mapa só serve ao descarte por alfa → sombra idêntica, 0 alocação). Verificado em /tmp/distchk: duelo 12=12 programas de sombra; frota 118 < 119 da 1.2.20; nenhuma variante dependente da ordem.
  - lod g: "pixels do navio" 111→93, 1065→850, 30→20, mas a MESMA build 1.2.20 deu 822 (f) e 1065 (g) na mesma pose → ruído de ±25% por amostra (arfagem/balanço do alvo e a crista da onda cobrindo o casco a 5–10 km com a câmera a 16 m). HARNESS → 3 amostras por pose (0,7 s entre elas) e MEDIANA; limite 0,9× mantido (não afrouxado).
- 08:13 BRT · dist reconstruído: index-CXEWrGFZ.js (onBeforeShadow; sem cubos de aquecimento).
- 08:14 BRT · arco1221web e rc=0 (dist index-CXEWrGFZ.js)
- 08:15 BRT · unit (solo) rc=1 (dist index-DM5Z7_Yn.js)
- 08:18 BRT · lod1221 h rc=0 (dist index-CXEWrGFZ.js)
- 08:19 BRT · perf1214 base1220h rc=0 (dist index-CXEWrGFZ.js)
- 08:20 BRT · perf1214 finalh rc=0 (dist index-CXEWrGFZ.js)
- 08:21 BRT · perf1214 base1220i rc=0 (dist index-CXEWrGFZ.js)
- 08:22 BRT · perf1214 finali rc=0 (dist index-CXEWrGFZ.js)
- 08:23 BRT · regI concluído: arco1221web e rc=0 TUDO OK; lod1221 h rc=0 TUDO OK; perf1214 (alternado base/final, mesma máquina): base1220h laço med 18,5 ms · 341 draw calls · 119 programas; finalh 27,4 ms · 376 dc · 118 programas; base1220i 19,7 ms · 343 dc · 119; finali 28,0 ms · 378 dc · 118. programas_novos 0 e tardios [] nos 4 (o programa tardio de sombra sumiu com MAPA_SOMBRA). heap/quadro final 8.521–8.880 KB vs base 3.032–3.487 KB (CORRIGIDO: antes lido truncado como 85–88 KB). rAF med 682–700 vs 662–686 ms (headless SwiftShader).
- 08:23 BRT · unit (solo, regF) rc=1: 75/1 — única falha "DANO REAL ouro média 26,8% fora de 30–40%". Decisão: CRITÉRIO OBSOLETO, não bug. O item 19/19c corrigiu a ogiva tandem para +25% EXATOS sobre o míssil do navio (como a loja descreve; a 1.2.20 trocava pela fração fixa 0,35 = +50–70%). Medido: padrão 21,4%, ouro 26,8% → razão 1,250. tests/unit.mjs atualizado (backup /tmp/unit.pre_ouro.mjs): faixa ouro = padrão×1,25 e razão 1,25±0,04 → filtrado rc=0. Unit completo re-rodado em segundo plano (só Node) porque o regF começou antes do ajuste de world.js (arco).
- 08:33 BRT · RETOMADA 08:28 (pedido: atacar o laço 27,4–28,0 ms vs 18,5–19,7 ms e draw calls 342→377 antes de entregar, sem cortar realismo/gráfico/som). unit g (só Node, iniciado 08:24) segue rodando → não duplicado.
- 08:33 BRT · Perfil da SIM (node --cpu-prof, /tmp/simbench.mjs, frota padrão sementes 3/8, 120 s): 1.2.21 1,15–1,84 ms/passo e 113–148 KB/passo vs 1.2.20 0,70–0,82 ms e 66–74 KB. Causa nº 1: item 14a (tiro em ARCO com carga reduzida) — cargaArco→trajetoria = 8,4 s de 24,5 s (34%) — roda em 5 de 6 passos para todo navio em arco, cada trajetória integra ~2–3 mil passos de 1/60 s. Correção sem mudar a física (mesma integração, mesma tolerância 2e-4·d): recusa por faixa em cache, partida a quente preditiva V·√(d/x), reuso quando alvo/boca não andaram além da tolerância. Bancada: 0,20 → 0,046 ms/chamada; 3.000 chamadas: 0 divergências de solução, erro máx 1,8e-4·d (< 2e-4). Sim: 1,05/0,85 ms/passo. Backup /tmp/balistica.pre_perf.js.
- 08:36 BRT · unit g rc=124 (dist index-CXEWrGFZ.js)
- 08:41 BRT · Perfil do QUADRO no navegador (mesma cena do perf1214, tests/_perfdiag.tmp.mjs, por função/quadro): base 1.2.20 laço 20,3 ms = sim 5,0 + render 7,0 + HUD 4,0 + navios 1,7; 1.2.21 com a correção do arco: laço 18,2 ms = sim 5,2 + render 6,2 + HUD 3,1 + navios 1,3 + _arcoPrev 0,17. → o excesso de ~9 ms vinha da SIM (item 14a cargaArco), não do render.
- 08:41 BRT · Draw calls (+39, item 20b: armas visíveis até 10 px): na faixa 10–26 px cada navio desenhava 21–44 malhas de armas. Correção: PROXY fundido por material (shipModels.js funde → grupo 'armasLOD', mesmas malhas/materiais/pintura/sombra, pose de repouso; giro de 3 m = 0,2–0,5 px nessa faixa); > 26 px peças articuladas, < 10 px nada (igual 1.2.20). Caixas proxy × originais iguais a ±0,2 m. Cena: 357 → 317 draw calls (base 342), programas 118 (base 119). Backups /tmp/shipModels.pre_proxy.js, /tmp/m3d.pre_proxy.js. dist reconstruído: index-eVsip1te.js.
- 08:42 BRT · perf1214 base1220j rc=0 (dist index-eVsip1te.js)
- 08:43 BRT · perf1214 finalj rc=0 (dist index-eVsip1te.js)
- 08:43 BRT · perf1214 base1220k rc=0 (dist index-eVsip1te.js)
- 08:44 BRT · perf1214 finalk rc=0 (dist index-eVsip1te.js)
- 08:48 BRT · lod1221 i rc=1 (dist index-eVsip1te.js)
- 08:49 BRT · arco1221web f rc=0 (dist index-eVsip1te.js)
- 08:58 BRT · abate1221 c rc=0 (dist index-eVsip1te.js)
- 08:58 BRT · balist1221 c rc=0 (dist index-eVsip1te.js)
- 08:58 BRT · disparo1221 c rc=0 (dist index-eVsip1te.js)
- 09:02 BRT · RETOMADA 09:03 (parou ~09:01). regJ.sh (pid 1100306) ainda roda o unit h (só Node, timeout 2400 s — o rc=124 do unit g foi o timeout de 770 s do R4.sh, não falha do jogo) → não duplicado.
- 09:02 BRT · lod1221 i rc=1 (08:48): falhas só "armas visíveis 0/5" a 5 e 10 km sem zoom. HARNESS — o teste conta .visible das montagens articuladas; nessa faixa as MESMAS malhas são desenhadas pelo proxy 'armasLOD' (silhueta por diferença igual: 44→45 px, 177→184). tests/lod1221.mjs conta o proxy (backup /tmp/lod.pre_proxy.mjs).
- 09:02 BRT · Categoria de draw calls no perf (tests/_dccat.tmp.mjs, 15 s): base 407 (341 sem sombra) × novo 401 (335). Diferença real restante: det +17 (LOD por pixel mantém detalhes de navios GRANDES mais longe — correto, < 0,15 px só abaixo de 26 px). Compensado sem perda: (1) halos aditivos das luzes de navegação com opacidade 0 de dia viram material invisível (cidade.js; −28 chamadas, imagem idêntica; à noite iguais); (2) proxy de armas até ~60 px de navio (montagem de 3 m ≤ 1,3 px). Backup /tmp/cidade.pre_halo.js.
- 09:02 BRT · abate1221 c, balist1221 c (117/0), disparo1221 c (189/0) e arco1221web f: rc=0.
- 09:02 BRT · dist reconstruído: index-EluHQdJ2.js (proxy até 60 px + halos invisíveis de dia + cargaArco rápido). unit h segue (Node).
- 09:06 BRT · lod1221 j rc=1 (dist index-EluHQdJ2.js)
- 09:07 BRT · perf1214 base1220l rc=0 (dist index-EluHQdJ2.js)
- 09:08 BRT · perf1214 finall rc=0 (dist index-EluHQdJ2.js)
- 09:09 BRT · perf1214 base1220m rc=0 (dist index-EluHQdJ2.js)
- 09:10 BRT · perf1214 finalm rc=0 (dist index-EluHQdJ2.js)
- 09:12 BRT · unit h rc=0 (dist index-eVsip1te.js)
- 09:21 BRT · abate1221 d rc=1 (dist index-EluHQdJ2.js)
- 09:23 BRT · luz1217 c rc=0 (dist index-EluHQdJ2.js)
- 09:28 BRT · regK: lod1221 j rc=1 só "2 km sem zoom pixels 123→94" — amostras base [91,123,142] × nova [92,94,130] na MESMA pose: sobreposição total = ruído de onda/arfagem. HARNESS corrigido com critério físico: compara a MAIOR amostra (a crista e a arfagem só escondem casco): 142→130 = 0,92 ≥ 0,9 (backup /tmp/lod.pre_max.mjs). perf l/m (com unit h rodando junto): draw calls 337 × 341–342 base ✓, programas 117 × 119 ✓, programas_novos 0, tardios []; laço 26,3/23,5 × 21,9/21,3 ms — medição contaminada pelo unit (CPU) → A/B limpo refeito abaixo. abate1221 d rc=1 "frota: só 1 abate real (cenário fraco)" e luz1217 c "vitrine dragao __timeout" — ambos rodaram junto com meu diagnóstico de heap no navegador (09:13–09:16) → refeitos sozinhos. unit h rc=0 (todos os testes, timeout 2400 s).
- 09:28 BRT · Heap por quadro (HeapProfiler por amostragem, 12 s): ~70% em AMBAS as builds é síntese de áudio em segundo plano no início da partida (_ruidoLaco/_geraPesado/impacto/assobio: buffers gerados uma vez, não por quadro); a 1.2.21 tem mais sons pré-renderizados (67 × 56). Alocação por passo no tiro em arco zerada: trajetoria() com objeto reutilizado e chave numérica no cargaArco (mesmos resultados: 0 divergências, 0,037 ms/chamada × 0,213 antes).
- 09:28 BRT · dist reconstruído: index-BuzkhoCl.js.
- 09:28 BRT · balist1221 d rc=0 (dist index-BuzkhoCl.js)
- 09:32 BRT · lod1221 k rc=1 (dist index-BuzkhoCl.js)
- 09:42 BRT · lod1221 k rc=1 só "10km-sem-zoom pixels 61→52 [50,56,61]→[46,47,52]"; demais critérios (cano ≥1 px, armas, det, zoom) OK. Histórico desta pose (navio por diferença, ~50 px): base 22, 30, 28, 44, 28, 56, 61 entre rodadas — ruído maior que a diferença. Critério do harness: perda só se a maior amostra nova < 0,9× a maior da base E abaixo da MENOR da base (sem sobreposição). Reavaliado sobre /workspace/lod1221.json da rodada k: 6/6 poses ok (backup /tmp/lod.pre_overlap.mjs). Rodada l confirmará.
- 09:42 BRT · abate1221 e rc=1 (dist index-BuzkhoCl.js)
- 09:43 BRT · luz1217 d rc=0 (dist index-BuzkhoCl.js)
- 09:44 BRT · perf1214 base1220n rc=0 (dist index-BuzkhoCl.js)
- 09:45 BRT · perf1214 finaln rc=0 (dist index-BuzkhoCl.js)
- 09:46 BRT · perf1214 base1220o rc=0 (dist index-BuzkhoCl.js)
- 09:46 BRT · RETOMADA 09:47: regL (pid 1130354) e regM encadeado seguem, sem duplicar. Pedido: lod1221 — achar a causa da variação 22–61 px a 10 km (não só afrouxar o critério), tornar determinístico; abate1221 e — corrigir com explicação; rodar o afetado + desempenho; APK + relatório.
- 09:47 BRT · perf1214 finalo rc=0 (dist index-BuzkhoCl.js)
- 09:47 BRT · perf1214 base1220p rc=0 (dist index-BuzkhoCl.js)
- 09:48 BRT · perf1214 finalp rc=0 (dist index-BuzkhoCl.js)
- 09:49 BRT · CAUSA da variação lod1221 (10 km sem zoom 22–61 px): (1) o governador de qualidade automática baixava o pixelRatio 1→0,9 no meio da rodada conforme a carga da máquina (lod1221.json k: pose 2 km com pr 1, demais 0,9); (2) o mar/arfagem seguiam o relógio da sim — cada rodada fotografava outra fase da onda (crista entre a câmera a 16 m e o casco a 10 km); (3) a foto "sem navio" era tirada 250 ms depois, com onda/fumaça já mexidas → a diferença incluía pixels de mar. No jogo o LOD não oscila: pxL 12,1 a 10 km, longe das trocas 9,5/11 e 56/62 (histerese). Harness DETERMINÍSTICO: qualidade fixa durante o teste, tempo do mar/navio congelado em 3 fases fixas (T0, +0,7, +1,4 s) iguais nas 2 builds, quadro pausado e renderizado à mão para foto, máscara e REPETIÇÃO (repetibilidade = px que mudam ao renderizar o mesmo estado; exige ≤3). Critério: soma das 3 fases nova ≥ 0,9× base (sem cláusula de sobreposição; backup /tmp/lod.pre_det.mjs). Nitidez do jogo intocada (só o teste mudou).
- 09:49 BRT · abate1221 e rc=1 "frota: som 6 < 2×5; borrifos 40/42" — HARNESS: na frota a IA continuava lançando (80 mísseis) e abatendo durante a espera, que terminava por tempo (60 s de parede ≈ 20 s de sim a 3 fps) com abates recentes ainda com som na fila (atraso d/343, dMax 3,5 km) e destroços no ar. Corrigido: fim das salvas (lancaMissil bloqueado no teste), espera até 0 mísseis em voo + 0 destroços + 0 sons na fila (≤180 s), falha explícita se não assentar. JOGO: destroço com mais de 25 s no ar sumia sem borrifo → salvaguarda passou a 90 s (cai sempre até a água/terra; fx.js, backup /tmp/fx.pre_det90.js).
- 09:50 BRT · A/B LIMPO perf1214 (sozinho, 3 pares alternados, dist index-BuzkhoCl.js × 1.2.20 :4181): laço mediano base 19,09/18,44/20,53 (média 19,35 ms) × 1.2.21 19,32/20,09/20,39 (média 19,93 ms, +0,6 ms = +3%, dentro da faixa da base 18,4–20,5); p95 38,0/26,8/33,7 × 29,7/32,5/35,1; draw calls 344/343/349 × 341/340/341 (−3 a −8); programas 119 × 117, programas_novos 0, tardios []; triângulos 505 k × 516 k (+2%, armas com silhueta). Heap/quadro 3,2–3,9 × 5,4–6,1 MB: síntese única de buffers de áudio no início da partida (mais sons pré-renderizados na 1.2.21), não alocação por quadro do laço. Os 27,4–28,0 ms das rodadas anteriores eram cargaArco (item 14a, já otimizado) + carga de testes simultâneos.
- 09:52 BRT · lod1221 l rc=0 (dist index-BuzkhoCl.js)
- 09:57 BRT · lod1221 l rc=0 (determinístico): repetibilidade 0 px em todas as 36 fotos; 10 km sem zoom base [14,14,15] × nova [14,14,14] (antes 22–61 era mar/fumaça mexendo entre foto e máscara + pixelRatio variável); 10 km zoom 493→465 (0,94), 5 km zoom 2299→2444, 2 km zoom 13562→14335; pr 1 fixo. dist reconstruído (fx destroço 90 s): index-Dlx3XwcE.js.
- 10:00 BRT · lod1221 m rc=0 (dist index-Dlx3XwcE.js)
- 10:13 BRT · abate1221 f rc=124 (dist index-Dlx3XwcE.js)
- 10:21 BRT · lod1221 m rc=0 — determinismo entre rodadas l×m: soma das 3 fases base 10 km sem zoom 43=43, 10 km zoom 493/496, 5 km 231/229 e 2299/2296, 2 km 346/347 e 13562/13538 (≤0,9%); nova ≤4,7% (resíduo: arfagem/balanço do item 15 é dinâmica com memória integrada na sim, não só função do tempo). Repetibilidade 0 px. 10 km zoom nova/base 0,91–0,94: diagnóstico no quadro congelado, proxy das armas × armas articuladas = 148 × 147 px (diferença 3 px) — o proxy não perde nitidez; o resto é atitude do casco/esteira (flutuação do item 15).
- 10:21 BRT · abate1221 f rc=124: limite de 770 s do R4 (3 cenários × espera até assentar). Refeito direto com timeout 2400 s (g).
- 10:36 BRT · RETOMADA 10:37: conferindo abate1221 g (timeout 2400 s, Chrome :9621) sem duplicar; depois unit (timeout longo) e APK.
- 10:37 BRT · abate1221 g rc=1: frota OK (6 abates → 6 explosões, som 12 = 2×6, borrifos 49/49, calmo), duelo OK (4 → som 8, 35/35), frota-cinema contagens CERTAS (7 → som 14, 56/56) mas "não assentou": na câmera lenta 0,5× mísseis tardios da IA ainda voavam aos 180 s. Regra de assentado do harness: 0 destroços e 0 sons na fila E (0 mísseis em voo OU 10 s sem abate novo) (backup /tmp/abate.pre_calmo2.mjs). Refeito só frota-cinema (h).
- 10:41 BRT · abate1221 h (só frota-cinema): 3 abates → 3 explosões, 3 chamadas, som 6 = 2×3, borrifos 28/28, assentado, programas 137=137, 0 erros. Única falha "total: só 3" é a soma de TODOS os modos (≥6), que não se aplica a rodada filtrada (corrigido: o total só vale sem ABATE_SO). Combinado g+h: frota 6 + duelo 4 + cinema 3 = 13 abates, 100% com explosão, som e borrifo → item 18 OK.
21. (10:45) Valter: deixar o NAVIO MAIS PRÓXIMO na tela do MENU INICIAL e no ESTALEIRO (câmera de vitrine mais perto, navio ocupando mais a tela), sem cortar proa/popa nem mastros em retrato e paisagem, sem cobrir botões/textos (HUD: nada sobre botões), com o mesmo realismo e resolução (LOD alto por pixel, item 20), giro/arrasto continuam funcionando. Ajustar por tamanho do navio (fragata × super encouraçado) para enquadrar sempre bem. Teste: capturas antes × depois nas duas telas, 3 navios de tamanhos diferentes, retrato/paisagem e canhoto.
21. (10:45) Valter: deixar o NAVIO MAIS PRÓXIMO no MENU INICIAL e no ESTALEIRO (câmera de vitrine mais perto, navio ocupando mais a tela), enquadrado pelo tamanho de cada navio (fragata × super encouraçado), sem cortar proa/popa/mastros em retrato e paisagem, sem cobrir botões/textos, mesmo realismo/LOD alto (item 20), giro/arrasto funcionando. Teste: capturas antes × depois, 3 tamanhos de navio, duas telas, canhoto.
21b. (10:46) Valter mandou print do ESTALEIRO (docs/1221/estaleiro-valter-1046.jpg, aba Comandante, Almirante Klevton): painéis SEMITRANSPARENTES misturados com a cena 3D — lista da esquerda esmaecida com outro navio do porto atravessando os nomes, ficha da direita escura por cima do cais/navio, textos sobrepostos ("+ T19% prata" sobre a linha de classe), botões do topo (VISTA DO PORTO/DIA/GIRO AUTO) apagados atrás, navio pequeno e longe. Corrigir: painéis com fundo sólido AMOLED legível (ou totalmente ocultos no modo 'olho'/visualizar, nunca meio-termo), navio enquadrado e grande na área livre entre os painéis (viewport/offset de câmera), sem navios do cenário passando atrás dos painéis/textos, nenhum texto sobre outro, botões do topo legíveis e sem sobreposição. Conferir todas as abas (Navio, Ficha, Módulos, Pintura, Bandeira, Comandante, Helis), retrato/paisagem e canhoto. Teste com capturas antes × depois.
21c. (10:47) CORREÇÃO do Valter sobre o 21b: o print é o MODO OLHO ("ver somente o navio" no estaleiro). Ao tocar no olho, os painéis (lista da esquerda, ficha/abas da direita, saldo, botões do topo VISTA DO PORTO/DIA/GIRO AUTO, REMOVER/COMANDANTES) têm de SUMIR POR COMPLETO (opacity 0 + visibility hidden + pointer-events none, sem resíduo/esmaecido/escurecimento lateral), sobrando só o navio em tela cheia, grande e perto (item 21, enquadrado pelo tamanho do navio, viewport inteiro), com giro/arrasto/zoom, e um único botão pequeno e discreto (olho riscado) num canto para voltar, sem cobrir o navio. Transição suave ida e volta. Navios do cenário não podem ficar na frente do navio em foco. Fora do modo olho, os painéis continuam com fundo sólido legível. Teste: capturas antes × depois no modo olho em todas as abas, retrato/paisagem e canhoto; nenhum texto/painel visível no modo olho.
- 10:50 BRT · Itens 21/21b/21c recebidos (10:50), antes do APK. unit i em andamento.
- 10:52 BRT · unit i (timeout 2400 s, direto): 76 passaram, 0 falharam, rc=0.
21d. (10:55) Valter: o OLHO do estaleiro é o botão no TOPO, ao lado do saldo de PRATA (ícone de olho antes de '210.717.165'). É esse botão que ativa o modo 'ver só o navio' do item 21c. Não confundir com os olhos da lista de navios à esquerda (visualizar navio).
- 11:00 BRT · Retomada após compactação; item 21d lido (o olho é o botão do topo ao lado do saldo — é o botaoFantasma do estaleiro). vitrine1221 ANTES (base 1.2.20 :4181, 37 casos, rc=0): estaleiro paisagem navio fracW 0,30–0,33 / área 0,15–0,20 (marcos corta embaixo); menu paisagem área 0,20–0,25; olho paisagem área 0,05–0,15 (não usa o viewport inteiro) e painéis ainda visíveis esmaecidos + escurecimento lateral; RETRATO quebrado: menu navio área 0,02 e cortado, estaleiro lista e ficha se sobrepõem e o navio sai da tela (fracW 1,3–5,6). Capturas em nexo-naval-shots/1221/vitrine/antes-*.png.
- 11:11 BRT · RETOMADA 11:12 (parou ~11:02). Nada rodando. Estado: unit i 76/0, item 18 OK, perf OK, vitrine1221 ANTES feito. Agora: itens 21/21b/21c/21d + retrato quebrado + Marcos cortado embaixo; depois vitrine DEPOIS, testes afetados, manual, APK.
- 11:19 BRT · Itens 21/21b/21c/21d implementados: (1) modernNavalCombat3D quadroVitrine — enquadramento em malha fechada (distância + deslocamento X e Y) em toda vista, inclusive porto; navio (caixa com mastros/bandeira+margem) ocupa até 94% L / 86% A da área livre (menu 88% por causa da respiração ±7%; olho 94/84; porto 80/80), centrado; (2) main.js vaoVitrine devolve retângulo l/r/t/b (painéis cortados pelo lado que menos rouba área + barra do topo/rodapé), olho = tela inteira; vao recalculado ao trocar de tela e ao tocar no olho; (3) fantasma.js ícone olho riscado + transição; (4) ui/telas1221.css: painéis do estaleiro sólidos #060606 sem vidro, sem degradê lateral; modo olho opacity 0 + visibility hidden + pointer-events none (só .tela; HUD de batalha inalterado), botão no canto sup. direito; retrato: logo abaixo do saldo no menu, estaleiro com lista em faixa horizontal no alto e ficha embaixo (50%). Teste rápido OK; dist rebuild.
21e. (11:21) Valter mandou REFERÊNCIA DE PROPORÇÃO para o MENU e o ESTALEIRO (docs/1221/referencia-proporcao-1121.jpg, print de outro jogo; usar SÓ o enquadramento, nada de marca, nome, layout ou arte copiados). Alvo: navio GRANDE no centro, ~55–65% da largura e ~55–65% da altura da tela em paisagem, vista de 3/4 pela proa, câmera um pouco acima do convés (~15–25° de elevação), proa vindo na direção do jogador, navio levemente à esquerda/centro, mar realista em volta, cidade/porto ao fundo; painéis e botões pequenos nas bordas (cards compactos à esquerda/direita, ação principal embaixo no centro), nenhum sobre o navio. Ajustar por tamanho do navio (fragata × super encouraçado) para manter a mesma proporção. Critério vitrine1221: fracW 0,55–0,65 e área ≥ 0,30 em paisagem no menu e no estaleiro, sem corte de proa/popa/mastro; retrato com proporção equivalente. Modo olho (21c/d): navio ainda maior (~70–80% da largura), sem painéis.
- 11:26 BRT · Item 21e recebido (referência de proporção, só enquadramento). Interrompi o vitrine1221 DEPOIS intermediário (build pré-21e, 30 casos, resultados superados) para ajustar câmera/painéis ao 21e.
- 11:56 BRT · Item 21e implementado: pose 3/4 pela proa (~48° do eixo, varredura ±0,2 rad no GIRO AUTO em vez de giro 360°; arrastar ainda gira 360°), elevação 0,30 rad (17°) no estaleiro e 0,32±0,04 (16–21°) no menu; enquadramento em malha fechada com alvo de LARGURA 60% da tela em paisagem (olho 75%), altura ≤92% da área livre (menu 95%, olho 90%); painéis do estaleiro em paisagem mais estreitos (lista clamp 124–196 px, ficha 204–330 px); no olho em paisagem o vão usa a tela toda (botão olho-riscado fica no canto). Teste rápido 915×412: estaleiro fracW 0,57–0,59 (área 0,32–0,41), menu fenghuang/marcos 0,57 (área 0,32–0,35), menu strizh 0,49 (limitado pela ALTURA: corveta pequena de mastro alto; área 0,32), olho 0,69–0,75; retrato: largura 0,85–0,94 (equivalente). Sem cortes. Corrigido de quebra: NACAO sem ITA → ficha do Marcos mostrava "undefined" (agora "Itália"). Observado: no retrato do estaleiro (só navegador; APK é sensorLandscape) algumas capturas headless saem pretas por 1 quadro — câmera sem NaN e canvas sem resize em 400 quadros; a confirmar no DEPOIS.
- 12:15 BRT · RETOMADA 12:15 (sessão interrompida ~12:10). Nada rodando. Estado: 21e implementado 11:56; vitrine1221 DEPOIS (72 casos) rodou às 12:00–12:12; em curso: fantasma.js (transição de ida), harness de transição/sobreposição, correções de painel compacto (barras da ficha, perfil×versão, rótulos da Bandeira).
- 12:24 BRT · DEPOIS #1 (12:00–12:12, 72 casos) analisado: enquadramento OK (estaleiro 0,59, olho 0,70–0,75, sem cortes, 0 navios do cenário na frente), mas achei e corrigi: (a) ficha compacta — grade das barras fixa 80+96 px num painel de 187 px → barra com largura 0 e rolagem lateral (agora 62 px | ≥34 px | auto, sem rolagem lateral); (b) menu — nome do navio do cartão do perfil encostava na versão (cartão 19 px, versão 3 px); (c) rótulos da Bandeira com reticências; (d) h1 do logo com entrelinha 1,14; (e) fantasma.js fixa o estilo antes de ligar → transição de IDA também suave. Harness: sobreposição recorta por TODOS os contêineres com rolagem, ignora linhas do mesmo nó e usa o núcleo das letras (70% da caixa da linha); transição amostrada a cada quadro por 700 ms (no Chrome headless ~3 qps, a amostra única de 120 ms caía antes do 1º quadro). Menu: 15–18° de elevação e +0,1 rad de través; alvo de largura 62%. Teste rápido: strizh menu 0,54 (antes 0,49), demais 0,58–0,60; olho 0,71–0,75; retrato 0,85–0,94. Capturas pretas ocasionais no headless: a BASE 1.2.20 também tem (2/12 × 5/12 com carga dupla), cor = fundo da página (#060606) → artefato de captura do SwiftShader, não do jogo.
- 12:30 BRT · RETOMADA (parou ~12:24). Sem outra sessão: a entrada "12:31" era minha com hora digitada errada (corrigida para 12:24, hora real da gravação). vitrine1221 DEPOIS #2 (build com as correções) em curso desde 12:25, sem duplicar.
- 12:38 BRT · vitrine1221 DEPOIS #2 (12:25–12:36, 72 casos, rc=0, erros [], programas 77): sobreposições de texto 0 em todos os casos; cortes 0; olho: 0 elementos visíveis, botão fora do navio, volta clicável; transição ida 0,03 (4 amostras intermediárias) e volta suaves, giro 0,72 rad, zoom OK. Paisagem: estaleiro fracW 0,57–0,59 (área 0,32–0,42), menu fenghuang 0,59 (0,34), marcos 0,59 (área 0,298, no limite de 0,30), strizh 0,53 (área 0,35; limitado pela altura do vão do menu: 270 de 289 px); olho 0,70–0,75. Retrato: 0,85–0,94, sem cortes. Critério 21e: 4 falhas marginais (strizh 0,53 < 0,55; marcos área 0,298 < 0,30), reportadas como lacuna. 72 fotos, nenhuma preta.
- 13:00 BRT · RETOMADA 13:00 BRT (parou ~12:38). Conferido: nenhum arquivo mudado <10 min fora de node_modules, sem Gradle/node de teste/chrome headless → sem sessão paralela. Estado: 21e DEPOIS #2 OK com 4 falhas marginais; agora: tentar strizh/marcos 21e barato, fechar pendências, regressão, manual, APK.
- 12:49 BRT · fantasma1216 rc=1 (12:36–12:37) só por critério do teste: media a opacidade da lista no MESMO instante do clique e 300 ms depois da volta; com a transição suave do 21c (headless ~3 qps) ainda estava em 1 → teste adaptado para medir após a transição (1,6 s / 2 s), critério ≤0,15 / >0,9 mantido. sobrepor1216 rc=0 (12:37–12:42, falhas 0); canhoto1217 rc=0 (12:42–12:47, falhas 0); luz1217 rc=0 (12:47–12:49, 0 falhas).
- 12:50 BRT · fantasma1216 rc=0 (adaptado): estaleiro opLista 0, alvo não clicável, giro 6, volta OK; batalha 0,06, 8/lado, teto de aeronaves OK.
- 12:59 BRT · perf1214 A/B (5 pares, 3 base→final e 2 final→base, final dist index-BZ43WcZ6.js × 1.2.20 :4181): laço mediano base 16,21/16,60/19,03/17,61/17,58 (mediana 17,58) × final 18,25/20,78/23,00/22,89/19,85 (mediana 20,78, +3,2 ms); p95 29,3–33,5 × 27,5–36,3; draw calls 301–350 × 337–341; programas_novos 0 nas 10; tardios []; triângulos 506 k × 516 k. Só ~30 quadros por rodada (SwiftShader ~1,5 qps de rAF). O código dos itens 21–21e só roda fora do combate (quadroVitrine só com !rodando), então não explica a diferença; o A/B limpo das 09:50 deu +3% (dentro da faixa da base). Fica como lacuna: medir no aparelho.
- 13:01 BRT · APK 1.2.21: vite build (index-BZ43WcZ6.js) + cap sync + assembleRelease rc=0 (13:00). aapt: br.com.valteramorim.nexonaval vc24 / 1.2.21, só VIBRATE (+ permissão interna DYNAMIC_RECEIVER_NOT_EXPORTED), sem INTERNET; apksigner v1+v2 OK, cert SHA-256 d0c31791…a599 (mesma chave). /workspace/NexoNavalStrike-1.2.21.apk 14.116.898 bytes, sha256 1f7623a50eaf92df1811964e155a6b1d7df0796f31af27640e804c473f6a2378; cópia idêntica em attachments. URLs no JS do jogo: só w3.org; conjunto de URLs do APK idêntico ao da 1.2.20 (licenças/comentários do Capacitor). APK 1.2.20 intacto (54b81917…).
- 13:01 BRT · regO (regressão FINAL 1.2.21) iniciada, dist index-CNYdX2Zp.js
- 13:01 BRT · 21e marginal: respiração do menu ±7%→±3,5% (no pico afastado o navio caía para 0,53–0,59). dist index-CNYdX2Zp.js. regO (regressão final completa + vitrine depois3) em segundo plano (/tmp/regO.sh).
- 13:02 BRT · Relatório /workspace/NexoNavalStrike-1.2.21-relatorio.md escrito (APK da dist index-BZ43WcZ6.js). Limpeza: tests/_q.tmp.mjs e /tmp/probe*.mjs apagados; :4183 encerrado.
- 13:03 BRT · CONFLITO: detectei OUTRA sessão ativa (regO, /tmp/regO.sh, iniciada 13:01; mudou a respiração do menu e reconstruiu a dist → index-CNYdX2Zp.js depois do meu APK das 13:00 de index-BZ43WcZ6.js). Eu tinha encerrado o :4181 às 13:02 sem saber; RELIGUEI às 13:03 (mesma base 1.2.20, /tmp/apk1220/assets/public, pid 1255612) antes do perf base1220q da regO. PAREI aqui para não disputar; o APK/relatório finais ficam com a sessão regO.
- 13:16 BRT · vitrine1221 v3 rc=124 (dist index-CNYdX2Zp.js)
- 13:16 BRT · (sessão regO) Ciente do CONFLITO 13:03: a outra sessão parou e deixou o fechamento comigo. Sigo com a regO na dist index-CNYdX2Zp.js (respiração ±3,5%); ao fim regero o APK (substitui o das 13:00 de index-BZ43WcZ6.js) e atualizo o relatório. Minha checagem das 13:00 não viu a outra sessão porque cortei a lista de processos com head — falha minha, sem dano (nenhum arquivo dela sobrescrito).
- 13:17 BRT · perf1214 base1220q rc=0 (dist index-CNYdX2Zp.js)
- 13:18 BRT · perf1214 finalq rc=0 (dist index-CNYdX2Zp.js)
- 13:19 BRT · perf1214 base1220r rc=0 (dist index-CNYdX2Zp.js)
- 13:20 BRT · perf1214 finalr rc=0 (dist index-CNYdX2Zp.js)
- 13:23 BRT · lod1221 n rc=0 (dist index-CNYdX2Zp.js)
- 13:25 BRT · arco1221web g rc=1 (dist index-CNYdX2Zp.js)
- 13:29 BRT · balanco1221web g rc=0 (dist index-CNYdX2Zp.js)
- 13:35 BRT · regO interrompida em placar1221 g0 (já: vitrine v3 rc=124 por timeout 770 s após 39/72 casos — menu marcos 0,60/área 0,32–0,33 ✓, strizh 0,50–0,53 ✗; perf q/r base 20,4/26,4 × final 21,8/24,4 ms, programas_novos 0; lod1221 n rc=0; balanco1221web g rc=0; arco1221web g rc=1 'programas 110 > 108'). CAUSA do arco: a pose 3/4 do 21e põe no quadro do MENU a pedra do farol (flatShading → 1 programa só dela) e a flâmula padrão de um navio do porto (sem alphaTest ≠ matBand → outro programa); compilados no menu (0 novos na partida) mas contam no total. Corrigido sem mudar a imagem: flâmula padrão com alphaTest 0,5 (= matBand, bandeira opaca) e pedra sem flatShading. Medido (tests/_progdiff.tmp.mjs): menu 31 × base 30, batalha 106 × base 108. dist index-CZ4OhT7y.js. regP (regressão final completa) reiniciada do zero.
- 13:35 BRT · regP (regressão FINAL 1.2.21) iniciada, dist index-CZ4OhT7y.js
- 13:43 BRT · vitrine1221 depois3 (timeout 1800) rc=1 (dist index-CZ4OhT7y.js)
- 13:45 BRT · perf1214 base1220Pq rc=0 (dist index-CZ4OhT7y.js)
- 13:46 BRT · perf1214 finalPq rc=0 (dist index-CZ4OhT7y.js)
- 13:47 BRT · perf1214 base1220Pr rc=0 (dist index-CZ4OhT7y.js)
- 13:48 BRT · perf1214 finalPr rc=0 (dist index-CZ4OhT7y.js)
- 13:51 BRT · lod1221 p rc=0 (dist index-CZ4OhT7y.js)
- 13:52 BRT · fantasma1216 p rc=0 (dist index-CZ4OhT7y.js)
- 13:54 BRT · arco1221web p rc=0 (dist index-CZ4OhT7y.js)
- 14:01 BRT · balanco1221web p rc=1 (dist index-CZ4OhT7y.js)
- 14:09 BRT · placar1221 p0 rc=0 (dist index-CZ4OhT7y.js)
- 14:13 BRT · RETOMADA 14:13 (pedido do Valter 14:12: resolver o que falta). regP (pid 1274486) em curso em placar1221 p1, dist index-CZ4OhT7y.js — não duplico. Abertos: balanco1221web p rc=1 (14:01), vitrine1221 depois3 rc=1 (strizh 0,50–0,53), e o que mais falhar na regP.
- 14:16 BRT · placar1221 p1 rc=0 (dist index-CZ4OhT7y.js)
- 14:16 BRT · balist1221 p rc=0 (dist index-CZ4OhT7y.js)
- 14:17 BRT · disparo1221 p rc=0 (dist index-CZ4OhT7y.js)
- 14:18 BRT · atingido1221 p rc=0 (dist index-CZ4OhT7y.js)
- 14:25 BRT · torp1221 p rc=0 (dist index-CZ4OhT7y.js)
- 14:27 BRT · ficha1217 p rc=0 (dist index-CZ4OhT7y.js)
- 14:30 BRT · luz1217 p rc=0 (dist index-CZ4OhT7y.js)
- 14:30 BRT · assin1219 p rc=0 (dist index-CZ4OhT7y.js)
- 14:30 BRT · oito1219 p8 rc=0 (dist index-CZ4OhT7y.js)
- 14:33 BRT · som1218 wp rc=0 (dist index-CZ4OhT7y.js)
- 14:36 BRT · som1218 sp rc=0 (dist index-CZ4OhT7y.js)
- 14:37 BRT · curva1219 p rc=0 (dist index-CZ4OhT7y.js)
- 14:40 BRT · camo1219 p rc=0 (dist index-CZ4OhT7y.js)
- 14:42 BRT · fx1219 p rc=0 (dist index-CZ4OhT7y.js)
- 14:47 BRT · sobrepor1216 p rc=0 (dist index-CZ4OhT7y.js)
- 14:58 BRT · (paralelo à regP, build isolada /tmp/dist1221w em :4185) CORREÇÕES: (1) balanco1221web p rc=1 era REAL — a fumaça da chaminé era emitida por QUADRO e por sorteio (0,25/quadro), então a densidade caía com a taxa de quadros (30 qps = metade da fumaça; no headless ~3 qps quase nenhuma partícula, "poucas partículas seguidas (1)"). Agora por TEMPO: 15 baforadas/s (= a densidade de 60 qps), até 3 por quadro, espalhadas no trecho que o navio andou. balanco1221web em :4185: TUDO OK (31 partículas seguidas no perto, 13 no cinema). (2) Strizh 0,50–0,53: o enquadramento usava os 8 cantos da caixa (cantos fantasmas: topo do mastro sobre proa/popa) e incluía a fumaça da chaminé (sprites até 46 m sobre o convés). Agora a vitrine enquadra pela SILHUETA REAL (vértices reais extremos em 48 fatias × 16 direções, só halos de lanterna entre os sprites, sem fumaça) e o teste mede a silhueta real (todos os vértices visíveis). A pose 3/4 se ajusta à forma: mastro alto (altura/compr. 0,29) gira até +6° para o través; longo e baixo sobe a câmera em malha fechada (elevação 15–23°). Rápido :4185 (strizh/fenghuang/marcos, paisagem): menu 0,58/0,61/0,61 (área 0,38/0,31/0,31), estaleiro 0,55/0,59/0,59, olho 0,68/0,75/0,75, cortes 0, CRITERIO21e falhas []. Varredura de TODAS as classes (TODOS=1) em curso.
- 14:55 BRT · canhoto1217 p rc=0 (dist index-CZ4OhT7y.js)
- 14:59 BRT · heli1218 p rc=0 (dist index-CZ4OhT7y.js)
- 15:01 BRT · cine1218 p rc=0 (dist index-CZ4OhT7y.js)
- 15:09 BRT · mapas1219 pd rc=0 (dist index-CZ4OhT7y.js)
- 15:14 BRT · RETOMADA (interrompido ~15:13). regP (pid 1274486, mapas1219 pe) e a varredura TODOS=1 em :4185 seguem — não duplico.
- 15:17 BRT · mapas1219 pe rc=0 (dist index-CZ4OhT7y.js)
- 15:30 BRT · mapas1219 pf rc=124 (dist index-CZ4OhT7y.js)
- 15:30 BRT · lend1215 p rc=0 (dist index-CZ4OhT7y.js)
- 15:32 BRT · linhaTiro1219 p rc=0 (dist index-CZ4OhT7y.js)
- 15:32 BRT · balanco1221 p (node, src) rc=0
- 15:32 BRT · missil1221 p (node, src) rc=0
- 15:33 BRT · modulos1221 p (node, src) rc=0
- 15:37 BRT · regP ENCERRADA por mim em abate1221 (dist antiga index-CZ4OhT7y.js, sem as correções de fumaça/enquadramento): abate1221 e unit rodam na regF (dist final). Na regP: tudo rc=0 exceto vitrine depois3 rc=1 e balanco1221web p rc=1 (corrigidos) e mapas1219 pf rc=124 (timeout 770 s com a máquina carregada — load ~12 em 8 núcleos com a varredura em paralelo; refaço na regF).
- 15:44 BRT · Varredura de TODAS as 47 classes (TODOS=1, paisagem, :4185, build com pose 3/4 em malha fechada pela forma: través até +8° para mastro alto, proa até −8° e elevação até +5,7° para longo e baixo; elevação total 15–24°): 141 casos, CRITERIO21e falhas [] (olho já com alvo 0,70–0,80). Menu fracW 0,58–0,64 (área mín. 0,31), estaleiro 0,58–0,60 (área mín. 0,30 — kestrel, no limite), olho 0,73–0,75; cortes 0, erros []. Strizh: menu/estaleiro/olho OK. Teste: critério do olho apertado de 0,68 para 0,70 (alvo do pedido). Lançando regF (dist final).
- 15:45 BRT · regF (regressão FINAL na dist final) iniciada, dist index-BHEQx54P.js
- 15:46 BRT · perf1214 base1220Fs rc=0 (dist index-BHEQx54P.js)
- 15:47 BRT · perf1214 finalFs rc=0 (dist index-BHEQx54P.js)
- 15:48 BRT · perf1214 base1220Ft rc=0 (dist index-BHEQx54P.js)
- 15:49 BRT · perf1214 finalFt rc=0 (dist index-BHEQx54P.js)
- 15:53 BRT · balanco1221web F rc=0 (dist index-BHEQx54P.js)
- 15:55 BRT · arco1221web F rc=0 (dist index-BHEQx54P.js)
- 15:59 BRT · lod1221 F rc=1 (dist index-BHEQx54P.js)
- 16:02 BRT · fx1219 F rc=0 (dist index-BHEQx54P.js)
- 16:03 BRT · vitrine1221 depois/final (72+ casos, timeout 2400) rc=0 (dist index-BHEQx54P.js)
- 16:04 BRT · RETOMADA (interrompido ~16:03). regF: 1 só instância (1358284 = script; 1361260 = subshell da faixa 2, filho dele) — não duplico. Investigando lod1221 F rc=1.
- 16:05 BRT · fantasma1216 F rc=0 (dist index-BHEQx54P.js)
- 16:11 BRT · placar1221 F0 rc=0 (dist index-BHEQx54P.js)
- 16:11 BRT · sobrepor1216 F rc=0 (dist index-BHEQx54P.js)
- 16:21 BRT · lod1221: CAUSA do F rc=1 (15:59, "10km-sem-zoom 41→36 px") = TESTE, não regressão do jogo. (a) A fumaça da chaminé agora sai por TEMPO (15/s): no headless (~3 qps) a 1.2.21 tem ~12× mais baforadas no quadro congelado que a 1.2.20 (que emitia 0,25 por QUADRO), e essas partículas (Points do cenário, fora da máscara do navio) ficavam na frente do navio de 14 px a 10 km; num celular a 60 qps as duas builds têm a mesma fumaça. (b) A própria base 1.2.20 não é determinística no quadro congelado: 10 km com zoom 139–184 px entre rodadas (1.2.21: 142–157). Correção no teste (tests/lod1221.mjs, backup /tmp/bk1221v/lod1221.mjs.1605): partículas ocultas durante as fotos (as duas builds; só o navio é medido) e DUAS passadas por build com a média (mesmo limite ≥ 90%). Nada mudou no jogo. Rodada H (dist index-BHEQx54P.js) rc=0, falhas 0: soma de pixels depois/depois2 × antes/antes2 — 2 km 342/342 × 335/339; 2 km zoom 14279/14246 × 15035/14838; 5 km 245/246 × 234/235; 5 km zoom 2425/2454 × 2472/2348; 10 km 42/42 × 43/42; 10 km zoom 446/433 × 501/451; programas 106=106 (base 108).
- 16:20 BRT · canhoto1217 F rc=0 (dist index-BHEQx54P.js)
- 16:21 BRT · placar1221 F1 rc=0 (dist index-BHEQx54P.js)
- 16:22 BRT · luz1217 F rc=0 (dist index-BHEQx54P.js)
- 16:26 BRT · mapas1219 Fpf rc=0 (dist index-BHEQx54P.js)
- 16:34 BRT · RETOMADA ('Continua'). regF: 1 instância só (1358284 script + 1361260 subshell filho da faixa 2), em unit; não duplico. Dist index-BHEQx54P.js; APK já gerado 15:53 dessa dist e copiado.
- 16:38 BRT · unit F rc=0 (dist index-BHEQx54P.js)
- 16:38 BRT · unit F rc=0 — 76 passaram, 0 falharam (dist index-BHEQx54P.js)
- 16:53 BRT · abate1221 F rc=1 (dist index-BHEQx54P.js)
- 16:53 BRT · balanco1221 F (node, src) rc=0
- 16:53 BRT · missil1221 F (node, src) rc=0
- 16:54 BRT · modulos1221 F (node, src) rc=0
- 16:58 BRT · abate1221 F rc=1: ÚNICA falha 'frota-cinema: só 1 abate real (cenário fraco)' = critério de AMOSTRA mínima (≥2 abates), não de defeito. Invariantes todas certas nos 3 modos: frota 5 abates→som 10, 42/42; duelo 4→som 8, 35/35; cinema 1→som 2, 14/14; calmo, programas iguais, 0 erros; total 10 ≥6. Na cinema a IA/headless deu poucos acertos. Refaço só frota-cinema (Fc) p/ amostra.
- 17:05 BRT · abate1221 Fc (só frota-cinema, dist index-BHEQx54P.js) rc=0 TUDO OK: 2 abates → som 4, borrifos 21/21, assentado, programas 129=129, 0 erros. regF COMPLETA (FIM_F 16:54): tudo rc=0 (lod via H, abate via F+Fc).
- 17:06 BRT · **APK FINAL** 1.2.21 (vc24): /workspace/NexoNavalStrike-1.2.21.apk (= anexos) · sha256 09fdc8d22f2ff83f7f0ec1a7971be773e1bf8b2886ca8fe91a06b86d2826c666 · 14.118.022 bytes · aapt br.com.valteramorim.nexonaval vc24/1.2.21, minSdk 22, targetSdk 35, só VIBRATE (+DYNAMIC_RECEIVER_NOT_EXPORTED interna), sem INTERNET · apksigner v1+v2 OK, mesma chave (cert SHA-256 d0c31791…a599) · dist index-BHEQx54P.js (build 15:45, APK 15:53). Capturas finais depois-{menu,estaleiro,olho}-fenghuang-paisagem.png (15:49–15:50). Temporários removidos; servidor :4185 encerrado.
