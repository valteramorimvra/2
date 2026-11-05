# PROGRESSO 1.2.18 (vc21) — Naval ORIGINAL (/workspace/nexo-naval-strike), a partir da 1.2.17 entregue

Regras: realismo extremo sem excesso, nada removido; 0 programas WebGL novos/sem alocação por quadro; só VIBRATE, mesma chave ~/.android/debug.keystore; sem INTERNET/CDN; assets sintetizados ou CC0/PD/CC-BY; nenhum nome real; não tocar o projeto B; manual com crédito "Responsável pelo desenvolvimento do game: Valter Amorim"; sons sem atraso (< 30 ms) e sem travar; build único assinado.

## Itens (relato do Valter no CELULAR REAL)
1. Sons de aceleração/navegação do navio (item 32: navegar, acelerar, desacelerar, girar parado) NÃO tocam.
2. Som da granada ao LANÇAR e ao CHEGAR (aproximação com assobio de vento + impacto) NÃO toca.
   - Causa raiz no aparelho real (Worklet, OfflineAudioContext, autoplay, roubo de voz, ganho, gatilho, fallback); fallback robusto sem Worklet; log de diagnóstico; teste RMS > limiar por evento com e sem Worklet; zero nós em combate, custo medido.
4. Lacunas da 1.2.17, se couber: controles do helicóptero no canhoto; Guanabara 4/4 plataformas; regressão completa no dist final.
5. APK ≤ 10 MB se possível sem perder qualidade (informar tamanho).

## Etapa 0 (09:21 BRT)
- Backup do fonte 1.2.17: /workspace/naval-src-1.2.17-backup.tgz. versionCode 21 / versionName 1.2.18.
- Ambiente: sem /dev/kvm acessível (grupo 103) → sem emulador Android; investigação no aparelho real via análise de código + simulação do WebView (Worklet removido) + modelo de alto-falante de celular + diagnóstico embutido no app.

## Item 3 (t1187, 09:22 BRT): granadas INIMIGAS chegando
- Quando granadas inimigas vêm na direção do navio do jogador: som de aproximação realista (assobio crescente, posicional/estéreo pelo lado de onde vem, sem atraso), mais indicador discreto de direção na borda da tela (pequeno, nunca no centro nem sobre botões; respeitar a opção de avisos).
- Realismo extremo, zero travadas (sem criar nós/alocações em combate), testar no fallback sem Worklet.

## Item 4 (t1188, 09:26 BRT): tela inicial mais profissional, botões melhores
- Print do Valter: /cursor/stores/store-c4f9a8c9-1171-46ce-b4f5-688918da1d47/grok-bot/agents/c98e0fb9-cd2b-49e7-9b39-7bb4ba2b1e4b/attachments/01M5MBHQ79EC1GKVDPWJ27A2KE.jpg
- Redesenhar o menu principal com aspecto de jogo AAA naval: botões com hierarquia clara (BATALHA principal destacado), ícones técnicos pequenos e coerentes por botão, cantos/chanfros militares, vidro escuro AMOLED com borda metálica fina, estados de toque (pressionado/foco) com feedback suave, tipografia consistente, espaçamento e alinhamento em grade, sem excesso de brilho. Manter todos os botões e funções (BATALHA, ESTALEIRO, COMANDANTES, TROFÉUS, AJUSTES, COMO JOGAR, HISTÓRICO, CRÉDITOS), saldo, perfil do Cap. Amorim e versão.
- BUG no print: a bandeira do Brasil da popa do navio (cena 3D) aparece sobreposta ao botão TROFÉUS/painel. Nada da cena pode ficar visualmente sobre/colado aos botões: enquadrar o navio à direita da coluna de botões ou escurecer gradiente atrás do painel.
- Rever também o brilho azul neon em volta do casco na água (parece excessivo/irreal) -> espuma/esteira realista.
- Testar em 21:9, 20:9, 19.5:9, 18:9, 16:9, 4:3 e canhoto: 0 sobreposições, nada cortado.

## Item 5 (t1189, 09:27 BRT): controles do helicóptero NÃO podem cobrir botões
- Print do Valter (destro, helicóptero H1 em voo): /cursor/stores/store-c4f9a8c9-1171-46ce-b4f5-688918da1d47/grok-bot/agents/c98e0fb9-cd2b-49e7-9b39-7bb4ba2b1e4b/attachments/01M5MBN4SH012KVM19NGBBFYDJ.jpg
- Sobreposições vistas: slider ALT (▲/▼) do helicóptero sobre o telégrafo (AVANTE TODA/MEIA/DEVAGAR/PARAR/RÉ) e sobre o leme; joystick do heli sobre AUTO-FOGO e DEVAGAR; ícone do helicóptero sobre o botão KIT; painel H1 Antissubmarino colado nos botões de arma; rótulo do aliado "Cdr. Reyes" encostado/sobre o botão PASSIVO; textos de aviso cortados no canto superior direito ("IMPACTO DE CAN...", "Drone inimigo lança...").
- Solução: no modo helicóptero, o layout do HUD deve ser próprio (ou esconder telégrafo/leme do navio que não se usa em voo e reposicionar), com 0 sobreposições entre qualquer controle, rótulo de contato e botão; rótulos 3D de navios nunca sobre botões do HUD. Avisos não truncados.
- Teste automático novo (heli1218) em todas as proporções, destro E canhoto, em voo/pouso/abastecimento: 0 sobreposições, nada fora da tela.

## Item 6 (t1190, 09:27 BRT): música de início = a ORIGINAL (a primeira feita)
- A música padrão ao abrir o jogo/menu deve ser a original (primeira trilha criada), já selecionada por padrão em instalação nova E migrada para quem atualiza (a menos que o usuário tenha escolhido outra explicitamente depois — se não houver como distinguir, voltar para a original). O usuário pode trocar nos Ajustes; a escolha persiste ao reabrir. Manter todas as outras trilhas como opção.

## Item 7 (t1191, 09:28 BRT): menu inicial com cenário em alta resolução, SEM embaçado
- No print do item 4 o fundo (mar, céu, navio distante) está desfocado/borrado. Remover o DOF/blur do menu, renderizar o cenário do menu em resolução nativa (devicePixelRatio cheio, sem render scale reduzido), texturas hi-res, antialias, mar e céu nítidos. Se precisar de legibilidade dos botões, usar só gradiente escuro atrás do painel, nunca blur do cenário. Validar por medida de nitidez (ex. variância do Laplaciano) contra a 1.2.17.

## Item 8 (t1193, 09:31 BRT): modo ORIGINAL das partidas = apenas 8 jogadores de cada lado
- No modo de batalha original/padrão (não o personalizado), cada lado tem exatamente 8 navios (jogador + 7 aliados vs 8 inimigos), nunca mais que isso, incluindo reforços/mercantes que contem como combatentes. Barra superior de contagem mostra 8 x 8. Conferir no print do item 5 que hoje aparecem mais ícones de um lado. Teste: N partidas em todas as arenas, contagem por lado == 8.

## Item 9 (t1194, 09:33 BRT): modo cinema mais cinematográfico
- Câmera passa MAIS POR CIMA do navio do jogador (sobrevoo), porém NÃO tão alta e um pouco afastada, mantendo o navio GRANDE na tela (ocupar ~45–65% da largura), movimentos suaves tipo grua/drone de filme, sem atravessar casco/água/interior.
- Ao atirar canhões: corte/plano que mostra o disparo (clarão de boca, fumaça, onda de choque, cápsula/recuo) e depois acompanha o projétil até o impacto; o mesmo para mísseis (ignição VLS, rastro, curva) e demais armas, com boom no impacto. Efeitos com realismo extremo, sem excesso.
- Planos variados e cinematográficos (sobrevoo, lateral baixa, proa→popa), troca natural, DOF leve só no modo cinema. Manter IA controlando o navio. Atualizar cine1217 -> cine1218 medindo altura/distância/tamanho do navio na tela e cobertura dos disparos.
- 9b (t1195, 09:34): no modo cinema, mesmo com a câmera passando um pouco pelo alto, o NOME do navio no casco deve aparecer e ficar legível (enquadrar com ângulo que inclua o costado com o nome; se preciso, nome também no convés/popa como em navios reais). Medir no cine1218: nome visível em ≥X% dos planos de sobrevoo.
- 9c (t1196, 09:34): passagens PROA→POPA E POPA→PROA (vice-versa), passando pelas armas: lançadores de mísseis/VLS, canhões, CIWS, lança-granadas, tubos de torpedo etc., mostrando cada uma de perto, com disparos e efeitos quando atiram.
- 9d (t1197, 09:35): modo cinema também mostra o navio do jogador SENDO ATINGIDO pelos inimigos: acompanhar projétil/míssil/torpedo/granada inimigo chegando e o impacto no casco (explosão, estilhaços, fogo, fumaça, coluna d'água nos quase-acertos), também interceptações da defesa (CIWS/SAM) com realismo extremo e sem excesso.

---
# REGISTRO DO QUE FOI FEITO (atualizado 11:10 BRT)

## Itens 1/2 — causa raiz + fallback (09:40–10:40 BRT) — FEITO
- Causa raiz: (a) motor/aceleração sintetizado quase todo em sub-grave < 300 Hz, que alto-falante de celular não reproduz, e ~20 dB abaixo de música/mar/combate (contribuição medida: +0,2/+0,4 dB banda cheia, ~0 dB na banda do celular); (b) lançamento da granada dominado por senoide de 38–88 Hz; assobio só audível nos últimos ~200 m (−41 dB no caminho nativo); (c) granadas na categoria 'missil' → voz roubada; (d) nenhuma detecção de Worklet com erro/mudo/travado nem de OfflineAudioContext travado.
- Correção: src/audio/bancoSom.js (sons sintetizados realistas: diesel, turbina, vapor, proa, esteira, thruster, gr:lanc, gr:assobio, gr:impacto, com energia 300 Hz–6 kHz); NavalAudio: banco JS + pool nativo pré-alocado (fallback sem Worklet), vigia de mixer (_vigiaMix/_mixMorto), timeouts, diagnóstico (localStorage nns.diagAudio, diagTexto() no "Testar som"), thruster 0,24, barramento motor 0,75.
- Teste tests/som1218.mjs (worklet/sem/mudo): motor acelerando −22/−23,6 dBFS banda celular; lançamento −26,8; chegada −19,5 (sem Worklet −18,4); impacto −28,3; motor na mistura real −2,9/−3,5 dB (antes mascarado). Nós criados em combate: 0 com Worklet; 1255 sem Worklet (camadas LEGADAS 1.2.17 de canhões etc., não o código novo — lacuna). Custo médio 0,07 ms/chamada.

## Item 3 — granadas inimigas chegando — FEITO
- Assobio crescente posicional (2 projéteis mais próximos, Doppler, pan), indicador de borda 22 px (hud1218.css) com avisoOk('avisosDefesa'), desvia das zonas de botões. som1218: visível 159/160, 0 sobreposições, 0 no centro (sem Worklet idem 158/160).

## Item 4 — menu AAA — FEITO (CSS telas1218.css + ícones SVG MP_IC, BATALHA destacado com subtítulo); navio enquadrado à direita do painel (borda esquerda ≥ painel+18 px, caixa +6% e +6 m p/ mastro da bandeira); brilho neon do casco → espuma iluminada pela cena (LUZ_ESPUMA).
## Item 6 — música — FEITO: padrão 'Original' + migração única (save.migra1218, flag musicaV1218); escolha persiste.
## Item 7 — menu nítido — FEITO: sem DOF no menu, DPR cheio (≤3).
## Item 8 — 8×8 — CONFERIDO: tests/frota1218.mjs 32 partidas/8 arenas → sempre 8×8 combatentes; mercantes (2+2) são não combatentes, fora do placar.
## Item 5 — heli (11:05 BRT): heli1218 1ª rodada: 0 sobreposições de controles; 13 falhas = log de impacto truncado com reticências (18:9/16:9) e rótulo 3D sobre botão (16:9). Correção: zonasProibidas inclui todo botão visível; log quebra linha em vez de "…".

## Item 10 (t1201, 11:52 BRT): Batalha personalizada — presets salvos
- Prints: /cursor/stores/store-c4f9a8c9-1171-46ce-b4f5-688918da1d47/grok-bot/agents/c98e0fb9-cd2b-49e7-9b39-7bb4ba2b1e4b/attachments/01M5MKZFX9Q7TAC4148TFHG61X.jpg
- No celular, o select nativo "Presets salvos…" (Preset 1/2/3/Vvv) não aplica o preset ao tocar, e não há como EXCLUIR. Trocar por lista própria do jogo (não o select nativo do WebView): tocar = carrega o preset (navios, camuflagens, posições, mapa etc.), botão excluir (lixeira) por preset com confirmação, renomear opcional; persistir em save; testar no fluxo de toque real (preset1218).

## Item 11 (t1201, 11:52 BRT): partidas personalizadas sem oponente
- Print: /cursor/stores/store-c4f9a8c9-1171-46ce-b4f5-688918da1d47/grok-bot/agents/c98e0fb9-cd2b-49e7-9b39-7bb4ba2b1e4b/attachments/01M5MKZMYHAPQH911PPCR6PB2E.jpg
- Placar mostra 2 aliados (Super Encouraçado Marcos Vinícius L 05) e INIMIGOS só "? Contato não identificado", nenhum inimigo aparece. Achar causa raiz (preset com inimigos vazios/inválidos, classe inexistente após renomeação, spawn fora do mapa/em terra, filtro "Só as do mapa", modo "Sem"?), garantir que toda partida personalizada tenha ≥1 inimigo válido e visível (se a config não tiver inimigo, gerar ou bloquear ZARPAR com aviso). Teste: todas as combinações de opções e presets → inimigos spawnados, vivos, alcançáveis.
- Também no print: o painel do placar (SUA FROTA/INIMIGOS) aberto cobre TRAVAR/SAM/ÓPTICA, e o rótulo 3D "Super Encouraçado Mar.../Cmte. Correia" fica sobre o botão CÂMERA. Placar e rótulos 3D nunca sobre botões.

## Item 12 (t1202, 11:54 BRT): retirar a câmera do drone
- Remover a visão/câmera do drone (troca automática para o drone ao decolar e qualquer opção de câmera do drone no botão CÂMERA). O drone continua decolando e funcionando (reconhecimento/ataque) normalmente; a câmera permanece no navio do jogador. Conferir que nada no HUD fica órfão e que o modo cinema não usa a câmera do drone.

---
# REGISTRO (continuação, 13:00 BRT)

## Item 5 — heli — FEITO: canhoto/21:9 tinha 1 falha (log fora da tela: espelho desatualizado ao entrar linha nova) → MutationObserver no log re-espelha no mesmo quadro (hud.canhoto/_espLogMO). heli1218: 0 falhas destro e canhoto × 6 proporções (rerodado no dist final).
## Item 9–9d — cinema — FEITO: cortes para interceptação também na fase 'chegada'; saltos de câmera eliminados (ao fim de um corte/segue força plano novo via _ctAnt; cópia em vez de lerp quando longe). cine1218: salto 0, interceptação filmada 1, falhas [] (rerodado no dist final).
## Áudio sem Worklet — FEITO: mixer ScriptProcessor (src/audio/mixerNucleo.js, mesmo algoritmo/camadas do Worklet, 3 nós criados 1× antes da partida). som1218 sem: 0 nós em combate (antes 1255); mudo: 0 nós; nenhum som removido. Lacuna: offtrava (OfflineAudioContext travado + sem Worklet) ainda sintetiza ao vivo.
## Item 10 — presets — FEITO: lista própria (.pb-presets): toque no nome carrega, ✎ renomeia, 🗑 confirma na linha (EXCLUIR/CANCELAR). Presets em save.d.presets (migração única do localStorage antigo). Causa extra achada: save.mescla descartava objetos fora do PADRÃO → pers e presets não sobreviviam ao reabrir; PADRAO ganhou pers/presets. Toast com pointer-events:none. preset1218 (toque real CDP): OK.
## Item 11 — sem inimigo — FEITO. Causa raiz: frotas pequenas nascem a 10–11 km, todos em EMCON (radar desligado), capitania fica na base e o batedor inimigo para a ~7–8 km (alcance de míssil) → sem detecção visual/radar/ESM, "?" no placar (guanabara: nunca detectado em 240 s). Correção (match.js): bases puxadas para a zona central quando ≤ 4 navios por lado (30%/18%, cópia do plano), informe de inteligência pré-missão (contato q=2 'intel', vida 90 s, nome no placar; world.js respeita c.vida); ZARPAR bloqueado com aviso se não houver inimigo válido; cfgPersonalizada filtra classes inválidas. Sonda /tmp/probe11d.mjs: 8 mapas × 6 combinações (1v1, 2v1 Marcos, 1v0, 3v3 ilhas+plataformas+mercantes, 8v8 aleatório mar 6, 1v1 colosso mar 1) → 48/48 com inimigo identificado, contato 100% do tempo e combate. Placar aberto: _encaixaLista acha o maior retângulo livre entre botões (rola por dentro), fora do espelho do canhoto. pers1218: 0 sobreposições destro/canhoto × 6 proporções, rótulos 3D 0 sobre botões.
## Item 12 — drone sem câmera — FEITO: removidos modo de câmera 'drone', item AÉREA do leque, ciclo do CÂMERA, toggle no botão DRONE (agora só avisa "Drone no ar"), IA-pilota-navio do drone e ajustes salvos 'drone'. Drone decola e plota contatos. Cinema não usa drone. pers1218 OK.

## Item 13 (t1206, 13:18 BRT): IA dos bots — buscar e engajar o time oposto, aproximar mais
- Bots INIMIGOS se direcionam ativamente para combater o time do jogador; bots ALIADOS procuram e engajam os inimigos (não ficam parados/orbitando longe nem fora de alcance).
- Ambos os lados se aproximam mais: distância de engajamento realista por classe/arma (entrar no alcance efetivo dos canhões e mísseis, manobras de aproximação em formação, sem kamikaze, sem colisão, respeitando terra/ilhas). Busca usando sensores (radar/sonar/visual) e últimas posições conhecidas; patrulha em direção ao centro/objetivo se não houver contato.
- Batalha equilibrada: nenhum lado concentra vantagem sistemática; manter personalidades de IA e uso balanceado de armas (item 27 da 1.2.17), regra fogo amigo 0.
- Teste ia1218: N partidas por arena medindo tempo até 1º contato/1º disparo, distância média de combate (deve cair vs 1.2.17), % de bots que engajam, taxa de vitória aliados×inimigos próxima de equilibrada, 0 bots ociosos >60 s, 0 encalhes/colisões.
## Item 13 — IA busca e engaja — FEITO (14:12 BRT). Mudanças em src/sim/ai.js:
- memória do time (datum: última posição + rumo×velocidade, 5 min); sem contato → vai ao datum ou varre em direção à base inimiga com alas abertas (nunca para; só a capitania para no ponto);
- distância de combate = alcance EFETIVO do canhão (padrão 3,6–4,8 km −agr·0,7 km; pesado 5–7 km; rápido 2,4–3,5 km); salva de mísseis na zona de não-escape (82%−agr·17% do alcance; capitania 90%);
- capitania com contato fecha até 6–8,5 km atrás da linha; sem contato há 90 s avança com a frota;
- sem mísseis mas com canhão/torpedo continua lutando (causa raiz dos bots ociosos: os dois lados sem VLS iam para trás das ilhas e a batalha morria);
- navio do jogador sob IA (heli) fecha distância além de 6,5 km em vez de orbitar e abrir;
- rota navegável: campo de fluxo BFS (grade 200 m, 1× por mapa, guardado no terreno) quando terra corta a linha até o alvo; folga de quilha do rumoSeguro 1,4×calado+3 m (antes 2×+3, barrava canais).
- ia1218 (96 partidas: 8 arenas × 3 cenários × 4 sementes, navio do jogador como bot 'equilibrado'): 1.2.17 → 1.2.18: vitórias az×vm 41×46 (+9 emp) → 44×45 (+7), desequilíbrio 0,06 → 0,01; distância média de combate 6,88 → 6,55 km; distância de disparo 6,61 → 6,35 km; 1º disparo 12,8 → 11,5 s; ociosos > 60 s 53 → 10 (todos em guanabara: canal raso, ver lacunas); encalhes 10 → 0; colisões 323 → 79; fogo amigo 0 → 0; bots que engajam 97,3% → 96,9%.
## Desempenho (13:10–13:30 BRT): perf1214 A/B 1.2.17 (APK extraído, :4177) × 1.2.18, qualidade Alta fixa: laço JS+WebGL médio 18,6 → 19,0 ms, p95 31,5 → 31,6 ms, p99 53,2 → 43,2 ms; 0 programas novos; 0 PointLight. quadro1218 (rAF, SwiftShader): p99 cruzeiro 1150 → 1142 ms, combate 1200 → 933 ms. aloc1216: 11,6 → 12,8 KB/quadro (amostragem).

# REGISTRO — regressão final (16:20 BRT)
## Correções achadas na regressão (14:20–15:48 BRT)
- som1218 worklet/sem: 1 oscilador+ganho criado em combate. Causa: bipes de contato (880 Hz/0,06 s), detectado (520/0,12), alarme de bordo (440 e 330/0,2) e testar (880/0,12) não estavam na lista BIPS pré-renderizada. Eles agora estão em BIPS: 0 nós.
- canhoto1217: o log de impactos (linha inteira, item 5) invadia a fita de rumo em telas ≤ 840 px (binóculo/espectador). Agora o log fica logo abaixo da fita (hud1218.css, top 62 px), sem truncar. Havia também um espelho inexato de 9 px na marca 'IA' no cinema: a marca está ancorada no navio (projeção 3D) e o espelho do canhoto a deslocava. Ela entrou no SKIP do espelha (bug real) e no SK do teste.
- som1218 offtrava: com o OfflineAudioContext travado, 470 nós eram criados em combate. Novo src/audio/renderJS.js: um emulador JS de Oscillator (poliBLEP), BufferSource, Biquad (fórmulas da especificação), Gain e AudioParam renderiza as MESMAS receitas no carregamento. Resultado: 0 nós em combate e "pré-render 0 ok/2 falha (+56 pelo emulador JS)". Nenhum som removido.
- heli1218 pouso-canhoto/21:9: rótulo 3D sobre botão. A etiqueta reaproveitada trocava de conteúdo ('⛴ Mercante' → nome). Agora a caixa real é medida uma vez na troca (nunca por quadro), e a etiqueta é escondida se cair sobre um botão.
- Manual (Novidades 1.2.18) ganhou o parágrafo "Som estável em qualquer celular / Tela". O crédito "Responsável pelo desenvolvimento do game: Valter Amorim" foi mantido.
## Dist final = dist/assets/index-4H45TKw6.js (build 15:48 BRT). Testes nesse dist:
- som1218 worklet OK (15:51) · sem OK (15:54) · mudo OK (16:17) · preset1218 OK (15:50) · pers1218 OK (16:15). Em execução: som1218 offtrava, pers1216, unit.
- No dist anterior (index-5jZ1Ds0C, mesma base menos o parágrafo do manual), 15:48: som1218 offtrava OK e heli1218 OK.
- No dist de 14:59 (antes das correções de label/emulador; só HUD/BIPS mudaram desde então): cine1218, canhoto1217, sobrepor1216, ficha1217, frota1218, aud1217, toque1217, radar1217, trava1217, picos1217, sam1217 e cine1217 OK; unit 76/0. Todos serão rerodados no dist final.
## APK (16:19 BRT), feito do dist final index-4H45TKw6.js
- /workspace/NexoNavalStrike-1.2.18.apk, cópia em attachments. sha256 ba216195ed7c0f071a67d0bb7a70d4222f37c492107acac82ac6b0e6669dfae7, 13.448.598 bytes (12,83 MiB; a 1.2.17 tinha 13.431.477).
- Certificado d0c31791…a599 (debug.keystore), vc21, "1.2.18". Única permissão de sistema: VIBRATE. DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION é a permissão interna de assinatura que o AndroidX declara, igual à 1.2.17.
- 16:19 BRT · MODO=worklet som1218 rc=0 (dist final index-4H45TKw6)
- 16:19 BRT · MODO=sem som1218 rc=0 (dist final index-4H45TKw6)
- 16:19 BRT · MODO=mudo som1218 rc=0 (dist final index-4H45TKw6)
- 16:19 BRT · X=1 preset1218 rc=0 (dist final index-4H45TKw6)
- 16:19 BRT · X=1 pers1218 rc=0 (dist final index-4H45TKw6)
- 16:20 BRT · MODO=offtrava som1218 rc=0 (dist final index-4H45TKw6)
- 16:21 BRT · unit EXIT 0 (dist final index-4H45TKw6)
- 16:22 BRT · X=1 cine1218 rc=0 (dist final index-4H45TKw6)
- 16:23 BRT · X=1 pers1216 rc=0 (dist final index-4H45TKw6)
- 16:23 BRT · X=1 frota1218 rc=0 (dist final index-4H45TKw6)
- 16:26 BRT · X=1 heli1218 rc=1 (dist final index-4H45TKw6)
- 16:26 BRT · X=1 aud1217 rc=0 (dist final index-4H45TKw6)
- 16:28 BRT · X=1 toque1217 rc=0 (dist final index-4H45TKw6)
- 16:35 BRT · X=1 radar1217 rc=0 (dist final index-4H45TKw6)
- 16:36 BRT · X=1 trava1217 rc=0 (dist final index-4H45TKw6)
- 16:38 BRT · X=1 canhoto1217 rc=0 (dist final index-4H45TKw6)
- 16:38 BRT · X=1 picos1217 rc=0 (dist final index-4H45TKw6)
- 16:40 BRT · X=1 sam1217 rc=0 (dist final index-4H45TKw6)
- 16:48 BRT · X=1 cine1217 rc=0 (dist final index-4H45TKw6)
- 16:48 BRT · FIMB (dist final index-4H45TKw6)
- 16:49 BRT · X=1 sobrepor1216 rc=0 (dist final index-4H45TKw6)
- 16:51 BRT · X=1 ficha1217 rc=0 (dist final index-4H45TKw6)
- 16:51 BRT · FIMA (dist final index-4H45TKw6)
## 17:02 BRT: a regressão do dist index-4H45TKw6 passou toda, exceto heli1218
- Falhas do heli1218: voo e abastecimento canhoto/16:9, "⛴ Mercante" sobre botão. Às 15:48 tinha passado, então a falha é intermitente.
- Causa: a caixa da etiqueta muda de largura quando muda a classe (velho/mini/alvo) ou o tamanho do HP, e a medição real só ocorre a 8 Hz.
- Correção (modernNavalCombat3D.js):
  - a caixa é medida de novo em qualquer troca de conteúdo, HP ou classe, nunca por quadro;
  - na medição a 8 Hz, uma etiqueta cuja caixa real toca um botão some na hora.
- O APK de 16:19 fica SUBSTITUÍDO por um novo build único. Rerodam no dist novo os testes de HUD/rótulos: heli1218 ×2, pers1218, canhoto1217, sobrepor1216, radar1217, cine1218 e picos1217.
- 17:05 BRT · heli1218 a rc=0 (dist index-1ta6xSNq)
- 17:06 BRT · pers1218 a rc=0 (dist index-1ta6xSNq)
## APK DEFINITIVO (17:09 BRT), substitui o de 16:19
- Feito do dist index-1ta6xSNq.js, que contém a correção das etiquetas (conferida no bundle: chave _lt com conteúdo:txt:hp:classe).
- /workspace/NexoNavalStrike-1.2.18.apk e cópia em attachments. sha256 ab1c868f741ec96e5c645254e7e75fc16f2868919ffd7afcd8f13c779da6f822, 13.448.640 bytes.
- Certificado d0c31791…a599, vc21, "1.2.18", só VIBRATE (mais a permissão interna do AndroidX, como na 1.2.17).
- 17:09 BRT · heli1218 b rc=1 (dist index-1ta6xSNq)
- 17:10 BRT · sobrepor1216 a rc=0 (dist index-1ta6xSNq)
- 17:12 BRT · radar1217 a rc=0 (dist index-1ta6xSNq)
- 17:14 BRT · picos1217 a rc=0 (dist index-1ta6xSNq)
- 17:16 BRT · canhoto1217 a rc=1 (dist index-1ta6xSNq)
- 17:23 BRT · cine1218 a rc=0 (dist index-1ta6xSNq)
## 17:35 BRT: investigação das falhas heli1218 b (17:09) e canhoto1217 a (17:16)
- **canhoto1217** ("espelho inexato 854/694 px em h-grInd"): DEFEITO DO TESTE. h-grInd é o indicador de borda das granadas inimigas. Ele é posicionado pela DIREÇÃO 3D da granada (translate a 30 Hz, igual às etiquetas/'IA') e já está no SKIP do espelha do jogo, de propósito. O teste o comparava como bloco fixo entre duas medidas, destro e canhoto, feitas em momentos diferentes. Como agora a IA engaja e granadas chegam durante o teste, a seta muda de lugar entre as medidas. Correção no teste: h-grInd entra no SK dos blocos (como h-marcas/h-ia).
- **heli1218 b**, 1ª falha ("radar:PASSIVO × h-baixo 9,7 km", abastecimento): DEFEITO DO JOGO, visível no print abastecimento-canhoto-20x9. Com DANOS visível (o navio leva dano porque a IA agora engaja), ajustaDanos desce o bloco de distância (h-baixo) para baixo do DANOS, e ele cai sobre o botão PASSIVO/ATIVO do radar. Correção (hud.js ajustaDanos): se tocar o .rd-modo, desce também abaixo dele.
- **heli1218 b**, 2ª falha ("Cmte. Prado" sobre botão, abastecimento-canhoto): causa ainda não provada. O teste ganhou diagnóstico (DIAG: caixa da etiqueta, botão, se a zona do jogo cobria, classe, _dw/_dx0) para a próxima rodada.
- 17:38 BRT · heli1218 c rc=1 (dist index-BBoA_vir)
- 17:41 BRT · canhoto1217 b rc=0 (dist index-BBoA_vir)
- 17:42 BRT · heli1218 d rc=0 (dist index-BBoA_vir)
- 17:47 BRT · DIAG do heli1218 c (17:38): "Cdr. Pemberton" sobre o botão placar (pouso-canhoto 21x9). zonaCobre=false, embora .h-placar[data-a=placar] JÁ esteja em zonasProibidas. CAUSA (DEFEITO DO JOGO): o placar é centrado e muda de largura quando ícones de navio entram ou saem. As zonas dos rótulos só eram refeitas a cada 0,12 s, então ficavam velhas por até 120 ms. Isso explica o caráter intermitente (era "Cmte. Prado" no abastecimento das rodadas anteriores). CORREÇÃO: hud.js calcula uma assinatura inteira dos ícones do placar (sem alocação, 15 Hz). Quando ela muda, _zSujo zera tZonas e as zonas são refeitas e os rótulos sobre botão escondidos no MESMO quadro.
## APK DEFINITIVO (18:02 BRT, substitui o das 17:09)
- dist index-Nl0FNjvM (correções h-baixo×PASSIVO + zonas do placar no mesmo quadro). vc21 / 1.2.18, cert d0c31791…a599 (mesma chave), permissão de sistema só VIBRATE.
- sha256 c0d11067a798ff1e8281335e9c24424816ae0bdac668df03b78f814fc290ee11 · 13.448.775 bytes · /workspace/NexoNavalStrike-1.2.18.apk + cópia em attachments (sha idêntico).
- 18:06 BRT · heli1218 f rc=1 (dist index-Nl0FNjvM)
- 18:06 BRT · heli1218 e rc=1 (dist index-Nl0FNjvM)

## Item 14 (t1215, 18:13 BRT): 8 NOVOS CRUZEIROS PESADOS (5 lendários + 3 super lendários) — entram NESTA versão 1.2.18
- Referência (link do Valter, só como referência técnica; NUNCA citar nome de jogo/navio/marca real no app): cruzeiro multimissão russo moderno lendário — 35.000 t, 290 m × 35 m, resistência 425.000→552.500, 17,5→22,7 nós, manobra 8,3→10,8, visão 10→12 km; visibilidade aérea 6,5→5,5 km, superfície 6→5,1, submarina 4,7→4,0.
  - Consumíveis: reparo ×6 (20% em 10 s, recarga 30 s), contramedida ×12 (1 s, recarga 10 s), munição ×2 (+20%, 30 s), guerra eletrônica ×5 (−15% dano guiado por 30 s, 45 s).
  - Armamento: 2 baterias de mísseis antinavio pesados (tipo supersônico de longo alcance + tipo VLS inclinado de 20 células), canhões 280 mm em 2 torres triplas à proa, lança-granadas antissubmarino 300 mm, torpedos 533 mm, helicóptero, canhão automático 100 mm, SAM de longo alcance (VLS), CIWS 30 mm.
- Fotos do Valter (ver chat; não acessíveis por Shell): casco cinza com convés vermelho, número de costado na proa (usar números próprios, não "088"), duas superestruturas altas com radares, mastros treliçados, VLS inclinados no convés de proa, heliponto com 2 helicópteros na popa, muitas antenas.
- Pedido: navio semelhante, MAIS FORTE e com MAIS CANHÕES, com canhões adicionais na PROA e na POPA; armamentos na quantidade descrita (mais os extras). Cada navio DIFERENTE dos outros (layout de torres, calibres, mísseis, superestrutura, camuflagem, stats), todos coerentes com a classe:
  - 5 LENDÁRIOS no nível lendário;
  - 3 SUPER LENDÁRIOS ainda mais fortes (nova raridade acima de lendário, com cor/selo próprio no estaleiro).
- Nomes (do Valter): Almirante Leidevaldo, Almirante Ronaldo, Capitã Kelly, Capitã Laiane, Almirante Klevton, Capitã Ana Nery, Rei Trajano. Proposta: super lendários = Rei Trajano, Almirante Leidevaldo, Almirante Ronaldo; lendários = Capitã Kelly, Capitã Laiane, Almirante Klevton, Capitã Ana Nery + 8º NOME PENDENTE (aguardando o Valter; usar provisório "Lendário 8" só internamente e trocar quando ele mandar).
- Requisitos:
  - modelos 3D de alta qualidade, realismo extremo;
  - nomes no casco paralelos à borda superior;
  - luz de mastro presa no topo;
  - ficha técnica completa no estaleiro (item 25 da 1.2.17), com comparação;
  - árvore tecnológica e preços coerentes com a raridade;
  - IA dos bots usando todas as armas;
  - modo cinema passando pelas armas;
  - balanceamento: fortes sem quebrar a batalha equilibrada (ia1218 ainda equilibrado);
  - 0 programas WebGL novos por partida, LOD, pools.
- Teste novo navios1218: os 8 aparecem no estaleiro, ficha correta, armas disparam (todas), luz no topo (luz1217), sem água no casco (aguaporto1217), canhoto/HUD 0 sobreposições, desempenho comparado.
- 18:15 BRT · pers1218 c rc=0 (dist index-Nl0FNjvM)
- 18:16 BRT · rodada do dist Nl0FNjvM: heli1218 e e f rc=1, de novo com rótulos sobre botões (travar e radar), e DIAG zonaCobre=false nos dois, embora travar e radar estejam nos seletores das zonas. CAUSA (DEFEITO DO JOGO, mesma família do placar): o teste muda o layout (canhoto, aviso, log de impacto, msg) e mede 300 ms depois, mas as zonas só eram refeitas a 8 Hz DENTRO do quadro. No headless um quadro leva até cerca de 1 s, e num celular a 60 fps a janela seria de até 120 ms com rótulo sobre botão. CORREÇÃO: o refresh das zonas foi extraído para _refZonas(), chamada a 8 Hz e também NA HORA, por evento (hud.canhoto/logImpacto/msg/alertaDetectado via aoMudarLayout; o placar via _zSujo). Nunca por quadro.
- 18:16 BRT · (nota) pers1218 c rc=0 no dist Nl0FNjvM (esse APK será substituído por causa da correção acima).
- 14b (t1216, 18:16 BRT): Valter CONFIRMOU a divisão: super lendários = Rei Trajano, Almirante Leidevaldo, Almirante Ronaldo; lendários = Capitã Kelly, Capitã Laiane, Almirante Klevton, Capitã Ana Nery. "Já inclui os que existem": fazer AGORA os 7 com os nomes que ele deu (não esperar o 8º; o 8º lendário só entra se ele mandar o nome — não inventar nome).
  - Navios super realistas, armamentos inspirados no link, gráficos de alta qualidade.
  - ANTIAÉREA como a do link, semelhante: SAM de longo alcance em VLS vertical (células no convés, lançamento a frio vertical com ignição acima do convés, mísseis interceptando aeronaves e mísseis) + defesa de ponto 30 mm combinada canhão/míssil tipo torre rotativa com 2 canhões rotativos 30 mm e radar próprio (vários montados por navio, cobrindo 360°), cadência altíssima com rastro traçante realista, sem excesso de brilho. Integrar na defesa automática existente (item 27).
- 18:18 BRT · canhoto1217 c rc=0 (dist index-Nl0FNjvM)
- 14c (t1217, 18:18 BRT): defesas (SAM/CIWS) AUTOMÁTICAS como já estão hoje (regra fixa: só canhões no auto-fogo do jogador; defesa aérea automática). Física extremamente realista em canhões e todos os armamentos dos novos navios: balística com arrasto e gravidade por calibre, velocidade de boca e dispersão reais por calibre (280/305 mm, 130 mm, 100 mm, 30 mm), recuo e tempo de recarga por torre, mísseis com perfil de voo (subida, cruzeiro rasante, manobra terminal), torpedos com velocidade/profundidade, granadas ASW com trajetória balística. Usar o motor de balística existente (src/naval5v5/balistica) sem criar programas WebGL novos.
- 14d (t1218, 18:18 BRT): incluir também os CANHÕES AUTOMÁTICOS PEQUENOS como no link: canhão automático de 100 mm (torre única, alta cadência, uso antisuperfície e antiaéreo) em cada navio novo, além dos 30 mm de defesa de ponto e de metralhadoras/canhões leves (ex. 12,7–30 mm) nas bordas, todos com balística real, rastro traçante, sons próprios e entrando no auto-fogo de canhões do jogador (regra: auto-fogo só canhões).
- 18:19 BRT · sobrepor1216 c rc=143 (dist index-Nl0FNjvM)
- 18:19 BRT · radar1217 c rc=143 (dist index-Nl0FNjvM)
- 18:20 BRT · sobrepor1216 c e radar1217 c interrompidos por mim (rc=143): o dist Nl0FNjvM já está superado pela correção das zonas e pelo item 14. Toda a regressão será rerodada no dist final.
- 14e (t1220, 18:21 BRT): SOM DOS CANHÕES VARIA DE NAVIO PRA NAVIO (todas as classes, não só as novas): assinatura sonora por navio/calibre/tipo de torre (estampido, grave, cauda/reverberação, mecânica de recarga), sintetizado/pré-decodificado no pool (0 nós em combate, com e sem Worklet), na faixa audível do celular. Teste: som1218 mede que cada classe tem assinatura distinta (correlação espectral < limiar entre navios).
- 18:23 BRT · heli1218 h rc=0 (dist index-B1iz3Ntc)
- 18:23 BRT · heli1218 g rc=0 (dist index-B1iz3Ntc)
- 18:27 BRT · unit (tests/unit.mjs, timeout 1500 s) rc=0: 76 passaram, 0 falharam (src antes do item 14).
- 18:27 BRT · PASSO 1 FECHADO: heli1218 g e h rc=0 no dist B1iz3Ntc (zonas recalculadas na hora pelo evento aoMudarLayout); canhoto1217 b e c rc=0 (defeito do TESTE em h-grInd, provado e corrigido). Causas: (a) h-baixo × PASSIVO = defeito do jogo (ajustaDanos); (b) rótulo × placar = zonas velhas quando o placar muda de largura (_zSujo); (c) rótulos × travar/radar = zonas só renovadas a 8 Hz dentro do quadro (quadro headless ~1 s) → agora recalculadas por evento.
- 18:33 BRT · navios1218 a rc=1 (dist index-C6079eVJ)
- 18:37 BRT · ITEM 14/14b/14c FEITO no src (dist index-DNbkVVnh): 7 cruzeiros pesados ORIGINAIS (classes.js CRZ/CRUZEIROS_1218), todos estilo cruzeiro multimissão com torres EXTRAS à vante E à ré:
  · Capitã Kelly L 11 — 4×3 280 mm (2+2), 20 VLS inclinados (longo/rasante), 48 SAM, 4 CIWS, 2 a30, 2×100 mm + 4×30 mm, torp 8, LG-30 ASW, 2 helis, estilo rus, cinza + convés vermelho. VIDA(860).
  · Capitã Laiane L 12 — 5×3 280 mm (3+2), 24 VLS (cruzeiro/longo), 40 SAM, 5 CIWS, 2×100 mm + 4×12,7 mm, 1 heli, estilo chn, aço azulado. VIDA(900).
  · Almirante Klevton L 13 — 4×4 280 mm (16 canos), 32 VLS (longo/hiper), 48 SAM, 4 CIWS, 4 a30, 2×100 + 4×30, 2 helis, rus, grafite. VIDA(920).
  · Capitã Ana Nery L 14 — 4×3 305 mm, 20 VLS (rasante/cruzeiro), 56 SAM, 5 CIWS, 4 a30, 2×100 + 6×30, 2 helis, capitania, ardósia. VIDA(880).
  · SUPER LENDÁRIOS (nova raridade superLend: grupo próprio no estaleiro, selo ✦ dourado-carmim, CSS telas1218.css): Rei Trajano SL 01 — 6×3 305 mm (3+3), 40 VLS, 64 SAM, 5 CIWS, 4 a30, 2×100 + 6×30, 12 torp, 2 helis, rus, aço-rubi (VIDA 1240); Almirante Leidevaldo SL 02 — 5×4 280 mm (20 canos), 48 VLS, 64 SAM, 2×100 + 6×12,7, chn, grafite-negro (VIDA 1200); Almirante Ronaldo SL 03 — 5×3 305 mm, 56 VLS, 72 SAM, rápido 14,8 m/s, capitania, azul-almirante (VIDA 1160).
  · Nome no casco (NOMES_OURO, paralelo à borda) e luz no topo (luzTopo genérica). Preços: lendários 46–50 mil ouro, super lendários 84–88 mil; BONUS_PREMIUM 1,05–1,4; TIPO_NAVIO (cruzador/capitania). Poder (razaoPoder vs Volkhar): lendários 0,89–1,03; super 1,38–1,44 (abaixo de Colosso 1,67 e supremos ≥2). Fora dos pools normais de bots (match.js exclui lendario) → ia1218 não muda.
  · Nenhum 8º navio inventado.
- 18:37 BRT · ITEM 14d FEITO: secundárias automáticas (src/naval5v5/secundarias.js): 100 mm (V0 880 m/s, 80 tpm, 9 km) no teto da casaria por bordo + canhões leves de borda 30 mm (960 m/s, 3 km) ou 12,7 mm (890 m/s, 1,8 km); balística REAL (solucaoArrasto com arrasto do calibre, dispersão PARAM, boca obstruída), traçante, giro/elevação do reparo animados, LOD junto com a30, pool de granadas [150..224) (principal nunca falta), som próprio por calibre/reparo; entram no AUTO-FOGO de canhões (regra mantida: auto-fogo só canhões; SAM/CIWS automáticos). Ficha: um cartão por secundária. Sim (node, duelo a 1,4 km): todas as armas disparam nos 7 (principal, 100 mm, leves, VLS, torpedo, LG-30, SAM).
- 18:37 BRT · ITEM 14e FEITO: assinatura do canhão por NAVIO (todas as 47 classes): src/audio/assinaturaCanhao.js pré-renderiza no carregamento 8+8+3 variantes (estampido, grave, ressonância do casco, cauda/reflexões, mecânica de recarga) a partir da gravação CC0 e envia ao pool do mixer (Worklet e ScriptProcessor); cada classe recebe combinação única por banco (variante × brilho do passa-baixas da voz × rate × eco), + torre/cano. 0 nós em combate. Teste novo tests/assin1218.mjs (node): critério dB ≥ 1.5 OK… correlação média 0,976, pior 0,9989 (< 0,999), distância espectral mín 1,65 dB rms (≥ 1,5), mediana 6,9 dB → rc=0.
- 18:37 BRT · navios1218 a rc=1 (dist C6079eVJ): DEFEITO DO JOGO achado pelo teste — estaleiro quebrava (TIPO_NAVIO sem as novas classes → GANHO_TIPO[undefined].mult). Corrigido (TIPO_NAVIO + fallback 'corveta' no resumo).
- 18:38 BRT · luz1217 n1 rc=0 (dist index-C6079eVJ)
- 18:40 BRT · aguaporto1217 n1 rc=0 (dist index-C6079eVJ)
- 18:42 BRT · navios1218 b rc=1 (dist index-DNbkVVnh)
- navios1218 b rc=1 (dist DNbkVVnh). Dois defeitos reais, corrigidos:
  - O CIWS no lugar 1 (a ré, L·0,26) ficava sobre a torre superelevada de ré nos 7 cruzeiros. Criei os lugares 5 e 6 nas asas do passadiço: ciwsLug [0,2,3,5,6], e [2,3,5,6] no Kelly e no Klevton para ficar simétrico. Conferido no layout, sem sobreposição.
  - Com controleIA, a câmera do HUD enviava 'mira' a cada 0,1 s e sobrescrevia a mira da IA, então a trava não fechava e VLS e torpedo não saíam. Agora a mira da câmera não é enviada enquanto a IA comanda o navio.
  - Ajuste do nome original: "Cruzeiro Pesado X (original)" e "Super Cruzeiro Pesado X (original)", no padrão do jogo.
  - Manual: seção Novidades 1.2.18 ganhou os 7 cruzeiros, a raridade SUPER LENDÁRIO, as secundárias e as assinaturas de som. O crédito foi mantido.
  - Testes já registrados: luz1217 n1 rc=0 e aguaporto1217 n1 rc=0 (dist DNbkVVnh). assin1218 rc=0: 47 classes, 601 pares, correlação média 0,9764, pior 0,9989, distância mínima 1,65 dB, mediana 6,90 dB.
- 18:48 BRT · ia1218 a rc=0 (dist index-CO12CITz)
- 18:48 BRT · assin1218 a rc=0 (dist index-CO12CITz)
- 18:50 BRT · navios1218 c rc=1 (dist index-CO12CITz)
- navios1218 c rc=1 (dist CO12CITz). A sobreposição está resolvida, mas 6 de 7 ainda sem VLS e torpedo. A depuração (`tests/_dbg1218.mjs`) mostrou trava=1 e travaMis subindo, com a sim a ~0,15× do tempo real no SwiftShader (14 s de relógio ≈ 2 s de sim). O teste dava 26 s de relógio, ≈ 4 s de sim, e a IA lança o torpedo aos ~6 s e a salva VLS aos ~8 s (nó: 7/7 com VLS, torpedo, RBU e SAM). Era um defeito do teste: agora ele avança +1 s de sim por segundo de relógio, e os eventos são drenados pelo laço do quadro.
- 18:58 BRT · ia1218 s4 rc=0 (dist index-CO12CITz)
- 19:05 BRT · navios1218 d rc=0 (dist index-CO12CITz)
- 19:13 BRT · som1218 f rc=0 (dist index-iKSUgd7P)
- 19:15 BRT · heli1218 f rc=0 (dist index-iKSUgd7P)
- 19:16 BRT · som1218 f rc=0 (dist index-iKSUgd7P)
- 19:17 BRT · unit f rc=0 (dist index-CO12CITz)
- 19:18 BRT · navios1218 f rc=0 (dist index-iKSUgd7P)
- 19:19 BRT · som1218 f rc=0 (dist index-iKSUgd7P)
- 19:20 BRT · heli1218 g rc=1 (dist index-iKSUgd7P)
- 19:20 BRT · cine1218 f rc=0 (dist index-iKSUgd7P)
- heli1218 g rc=1 (dist iKSUgd7P): na cena abastecimento-canhoto/16x9 os blocos saíam da tela (pausa em x=784–818 numa tela de ~732 px, CANHÃO em x=-86). Causa: DEFEITO DO TESTE sob carga. O resize re-espelha no requestAnimationFrame seguinte, e com 3 navegadores e o unit rodando juntos no SwiftShader esse quadro passou de 900 ms, então a medida pegou o layout da largura anterior. A rodada f, no mesmo dist, deu rc=0. Correção no teste: depois de cada resize ele espera 2 quadros reais, além dos 900 ms. O jogo não mudou: num celular o re-espelho sai em 1 quadro (16 ms).
- 19:25 BRT · preset1218 f rc=0 (dist index-iKSUgd7P)
- 19:25 BRT · som1218 f rc=0 (dist index-iKSUgd7P)
- 19:27 BRT · ficha1217 f rc=0 (dist index-iKSUgd7P)
- 19:27 BRT · aud1217 f rc=0 (dist index-iKSUgd7P)
- 19:28 BRT · pers1218 f rc=0 (dist index-iKSUgd7P)
- 19:28 BRT · frota1218 f rc=0 (dist index-iKSUgd7P)
- 19:29 BRT · trava1217 f rc=0 (dist index-iKSUgd7P)
- 19:30 BRT · toque1217 f rc=0 (dist index-iKSUgd7P)
- 19:31 BRT · sam1217 f rc=0 (dist index-iKSUgd7P)
- 19:38 BRT · cine1217 f rc=0 (dist index-iKSUgd7P)
- 19:39 BRT · luz1217 f rc=0 (dist index-iKSUgd7P)
- 19:41 BRT · pers1216 f rc=0 (dist index-iKSUgd7P)
- 19:42 BRT · aguaporto1217 f rc=0 (dist index-iKSUgd7P)
- 19:42 BRT · heli1218 h rc=0 (dist index-iKSUgd7P)
- 19:51 BRT · heli1218 i rc=0 (dist index-iKSUgd7P)
- 19:53 BRT · canhoto1217 f rc=0 (dist index-iKSUgd7P)
- 19:57 BRT · sobrepor1216 f rc=0 (dist index-iKSUgd7P)
## APK DEFINITIVO (20:00 BRT, substitui o das 18:02)
- Build do dist final index-iKSUgd7P (o mesmo de toda a regressão final). versionCode 21 / versionName 1.2.18, certificado d0c31791…a599 (mesma chave). Permissão de sistema: só VIBRATE (mais a permissão interna do AndroidX, como na 1.2.17). URLs nos assets: só textos de licença e de crédito, nenhuma CDN.
- sha256 a9170afa6954a8b5d2f104b41cf2f47653a6ea2d23322db1846b9d5685b16b0c · 13.454.682 bytes · /workspace/NexoNavalStrike-1.2.18.apk + cópia em attachments (sha idêntico).
- 20:01 BRT · radar1217 f rc=0 (dist index-iKSUgd7P)
- 20:06 BRT · picos1217 f rc=0 (dist index-iKSUgd7P)
- 20:07 BRT · perf1214 f rc=0 (dist index-iKSUgd7P)
- 20:29 BRT · quadro1218 f rc=124 (dist index-iKSUgd7P)
- quadro1218 f rc=124 = timeout de 770 s do runner (4 rodadas de 2×60 s mais boot no SwiftShader), antes de 1.2.17#2. O teste em si não falhou: 1.2.18#1 e #2 completos, sem erros. Rodo de novo com timeout de 1500 s.
- 20:57 BRT · quadro1218 g rc=0 (dist index-iKSUgd7P, timeout 1500 s)
- Resultado do quadro1218 g (21:07 BRT, dist index-iKSUgd7P, qualidade Alta fixa, rAF em ms no SwiftShader):
  - Rodada 1, limpa nas duas versões:
    - cruzeiro: média 605,7 → 587,8; p95 683,4 → 649,9; p99 1133,4 → 683,2;
    - combate: média 631,5 → 608,6; p95 683,3 → 683,3; p99 716,7 → 716,6.
  - Rodada 2, com uma pausa do box na 1.2.18: só 25 quadros de cruzeiro em 60 s e um quadro de 14,3 s em combate (combate p95 816,6, p99 14282,7). Contra a 1.2.17: cruzeiro p95 733,3 → 666,7, p99 783,3 → 683,3; combate p95 700 → 816,6.
  - A mesma pausa de cerca de 14 s apareceu na 1.2.17#1 da rodada f (p99 13816). Por isso a atribuo à máquina compartilhada, e não à versão, mas não tenho prova.
  - 0 programas novos (135 contra 138 na 1.2.17). Laço JS+WebGL (perf1214 f, 20:07): média 16,97 ms, p95 24,5, p99 27,6; 0 programas novos e 0 PointLight. A referência 1.2.17 do A/B das 13:10 era 18,6 / 31,5 / 53,2 ms.
