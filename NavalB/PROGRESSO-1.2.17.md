# 1.2.17 (vc20) — Naval ORIGINAL — fechar os parciais da 1.2.16
Base: 1.2.16 (vc19, sha a191e771…3c0f). Realismo máximo, sem excesso, sem remover nada.
1. 13a ilhas e plataformas na Batalha Personalizada; 13c IA completa das aeronaves; 13i camuflagens de aeronaves.
2. 17 animação e som realistas em TODOS os armamentos (foguetes, granadas, torpedos, AA, CIWS), sem excesso.
3. 32 menu e telas: texturas de alta resolução, DOF, cidade/base realista (sem blocos).
4. 9 DOF na câmera de cinema; revalidar cine1216.
5. Nomes legíveis no estaleiro em navios >300 m (nome1216 ≥150 px) sem perder o estilo de marinha.
6. Botão de pausa visível com o HUD oculto; botões ≥48 dp sem sobreposição.
7. SAM no super porta-aviões Atlântico.
8. Mostrar o detalhamento das recompensas da Batalha Personalizada.
9. Música de combate com intensidade dinâmica (respeitando música desligada e o estilo).
10. Conferir os 34 nomes padrão contra nomes de navios reais; verificar água no casco no porto; retestar itens 7, 8, 11 e 13.
11. Manual atualizado; crédito "Responsável pelo desenvolvimento do game: Valter Amorim".

## Etapa 0 (20:15 BRT)
- Máquina ok (node_modules, dist, build). Backup do código-fonte 1.2.16: /workspace/naval-src-1.2.16-backup.tgz. versionCode 20 / versionName 1.2.17 em build.gradle e package.json.

## Etapa 1 — item 5 (nomes) — FEITO
- poeNome: letra cresce com o comprimento (kG=(L-180)/150; hT até 10 m / 0,58·borda livre).
- nome1216 (TAG 1217b, shots 1217/nomes): colosso 175/189 px ✓; baluarte/Rafaella 110/119 px (282 m, < 300 m, borda baixa tumblehome) — lacuna honesta.

## Etapa 2 — item 6 (pausa/toque 48 dp) — FEITO
- src/ui/hud1217.css: áreas de toque ::after ≥48 px (pausa, cons, chaves, rd-modo, placar, fantasma, es-vista, es-ver, btn-voltar); cons gap 14; chaves 2×2 em ≤840 px; pausa 0,55 e clicável no modo fantasma.
- main.js: botão fantasma do estaleiro a +14 px do GIRO AUTO.
- tests/toque1217.mjs: falhas 0 (estaleiro, batalha, binóculo ×5 tamanhos; pausa no fantasma). sobrepor1216: falhas 0.

## Etapa 3 — item 7 (SAM no Atlântico) — código feito, verificando
- classes.js sam:16; layout.js 2 blocos 'samPa' de 8 células em patrocínios (BB vante, BE popa); shipModels.js patrocínio+mão-francesa+balaustrada.
- Patrocínio de BB movido para z=+0,12L (a ré do nome dourado; em -0,2L cobria o "T" de ATLÂNTICO).
- Unit novo "v1.2.17 SAM no Atlântico": 16 células (8 BB + 8 BE, |x|>B/2), lançou 8/8 ✓. tests/sam1217.mjs (partida real): 16 células, samLanc ✓, 0 erros; capturas 1217/sam/. — FEITO

## Etapa 4 — item 8 (detalhamento da recompensa da personalizada) — código feito
- economia.creditar guarda persBruto/persCorte; tela de resultado mostra Subtotal (partida normal) → "Batalha personalizada: 35% da prata" (corte) → Prata líquida; Ouro riscado → 0; Pesquisa riscada → 35%; aviso "fora do ranking". Cabeçalho "BATALHA PERSONALIZADA (detalhamento)". Teste: pers1216 com DIR=1217/personalizada.

## Etapa 5 — item 9 (música de combate dinâmica) — código feito
- NavalAudio.intensidadeCombate(nivel, dt): intensidade suavizada (sobe 1,2 s / desce 6 s); camada percussiva sintetizada no BUS da música (atual: tímpanos 96 bpm + cordas graves filtradas; ação: bumbo 124 bpm + chimbal) e presença 1,5→3 dB. Só com música ligada, som ligado, vol>0, faixa de batalha tocando.
- Jogo: nível = 0,45·proximidade do inimigo (14→4 km) + 0,45·alerta de míssil + 0,5·dano sofrido (decai 8 s) + 0,25·disparo (decai 10 s); 0 no fim/morte/pausa; sem alocação.
- Teste novo tests/musica1217.mjs.

## Etapa 6 — item 10a (34 nomes padrão × navios reais) — FEITO
- Busca web + listas (NGB naval.com.br letras2, pt.wikipedia Marinha do Brasil e Marinha Portuguesa): nenhum dos 34 nomes completos coincide com navio real. Palavras isoladas existem (NRP "Andorinha", pesqueiro "Falcão do Mar"), mas não os nomes compostos (ANDORINHA DO MAR, FALCÃO DA BARRA/VELOZ). Mantidos.

## Novos itens do Valter (21:04 BRT), entram na 1.2.17
12. TEST DRIVE usa a camuflagem escolhida para o navio.
13. Nome no casco PARALELO à borda superior (sem inclinação diferente da borda), acompanhando a inclinação/curvatura do casco e o balanço do navio.
14. Granadas: som de lançamento realista e característico (referência sonora de jogos navais modernos; não citar nomes de jogos reais no app).
15. Som de APROXIMAÇÃO das armas inimigas (granadas, foguetes, mísseis, torpedos), gradativo: aumenta conforme chega ao navio do usuário (distância + Doppler); cada arma com som característico. Granada chegando = assobio/vento.
16. Impactos de granada/foguete podem causar incêndio no navio do usuário e no inimigo; fogo e fumaça realistas, sem excesso.
17. Trava de mira dos mísseis leva um tempo para travar no alvo; o progresso aparece no ícone/botão do míssil (anel ou preenchimento; estado TRAVADO distinto).
18. Botão do radar não pode cobrir outros botões (incluir no teste de sobreposição, em todas as proporções).
19. Mísseis: aparência melhorada e som mais alto e realista.
20. Torpedo mais realista (esteira, trajetória, modelo) e som melhor.
21. Impacto no navio levanta colunas naturais de explosão/água realistas.
22. Isca térmica (flare) mais realista e MENOS luminosa.
23. Ao abrir a árvore tecnológica, ela já para (rola e centraliza) no navio selecionado.
Tudo com extremo realismo e nada em excesso.

## Etapa 7 — retomada 21:04 BRT (itens 1–23)
- Máquina NÃO reiniciou (uptime 1h57, desde ~19:07 BRT); node_modules (89) e dist presentes; vite preview :4173 meu, ativo.
- pers1216 (DIR 1217/personalizada): A 5×5 e B aleatória terminaram, 0 programas novos, ouro 0 — falhou só num bug do teste (JSON.parse de objeto na linha 51); corrigido no teste. Tela de resultado mostra "BATALHA PERSONALIZADA (detalhamento)"; falta captura rolada até o subtotal/corte.
- Pendentes: 1 (13a/13c/13i), 2, 3, 4, 10b/c, 11, 12–23; testes musica1217 e regressões.
24. (Valter 21:05) FOGUETES: som realista e característico no LANÇAMENTO (do jogador e inimigos) e som de APROXIMAÇÃO gradativo quando vêm em direção ao navio do usuário (cresce com a proximidade, Doppler), distinto de granadas e mísseis. Sem excesso.
24b. (Valter 21:05, esclarecimento) Som de aproximação dos foguetes só quando se aproximam do navio do USUÁRIO. Som de lançamento de foguetes INIMIGOS só audível se o inimigo estiver perto (atenuação por distância realista; longe = inaudível).
24b. (Valter 21:05, esclarecimento) Som de aproximação dos foguetes só quando se aproximam do navio do USUÁRIO. Som de lançamento de foguetes INIMIGOS só audível se o inimigo estiver perto (atenuação por distância realista; longe = inaudível).
24c. (Valter 21:07) Áudio 3D de batalha para TODOS: ouvir disparos/lançamentos dos ALIADOS e impactos/explosões quando navios INIMIGOS ou ALIADOS são atingidos, com volume e abafamento (low-pass) conforme a distância e atraso do som pela velocidade do som (~343 m/s) para distâncias grandes; cada arma com som característico. Limitar vozes simultâneas (pool) para não haver excesso nem travadas.
25. (Valter 21:14) FICHA TÉCNICA NO ESTALEIRO por navio: descrição do navio (papel, deslocamento, comprimento, velocidade, blindagem/HP, sensores, furtividade). Cada ARMAMENTO com SÍMBOLO (ícone pequeno próprio) + descrição + números REAIS do jogo (lidos dos dados usados no combate, nunca inventados): calibre do canhão, tempo de recarga, dano por tiro, alcance, velocidade do projétil, cadência; mísseis: dano, alcance, velocidade, resistência/HP do míssil (contra interceptação), tempo de trava; torpedos; foguetes; granadas; AA/CIWS. O poder de fogo PODE variar de navio para navio (ex.: mesmo canhão com recarga/dano diferente por classe/tier/upgrades) — mostrar o valor daquele navio. Comparação discreta com o navio atual (verde/vermelho). Sem sobreposição, legível, estilo vidro.
25b. REGRA DE COMBATE: tiros de CANHÃO e GRANADAS não têm sistema de defesa (não são interceptados por CIWS/AA/iscas) — se o tiro acertar, causa dano. Só mísseis (e torpedos, se já houver) podem ser interceptados/enganados. Garantir isso no código e escrever no manual e na ficha.

## Itens 25 e 25b (Valter, 21:16 BRT)
- 25: ficha técnica de cada navio no estaleiro: cada armamento com símbolo, descrição e números REAIS do combate daquele navio (calibre, recarga, dano, alcance, velocidade; mísseis: + resistência e tempo de trava). Valores podem variar por navio. Comparação com o navio atual; nada sobreposto.
- 25b: tiros de canhão e granadas NÃO têm sistema de defesa (se acertarem, causam dano). Só mísseis e torpedos podem ser interceptados. Garantir no código + manual.

## Etapa 8 (21:16) — item 17 código
- armasParametros: PARAM.trava.tMisAtivo 2.2 / tMisPassivo 3.4. world.js: n.travaMis (só jogador), evento 'travadoMis', prontidão motivo 'travandoMis' (rótulo "TRAVANDO n%").
- HUD: anel interno .cb-tv no VLS (âmbar crescendo), classe travadoMis = anel vermelho cheio + cadeado (.cb-trv). Testes novos: tests/trava1217.mjs, tests/arvore1217.mjs (item 23). radar1217 refeito alternando ATIVO/PASSIVO por pointer.
26. (Valter 21:23) TIRO AUTOMÁTICO no navio do USUÁRIO: só os CANHÕES disparam automaticamente. Mísseis, foguetes, granadas e torpedos NUNCA disparam sozinhos — só por comando do jogador. (A defesa automática AA/CIWS contra aeronaves e mísseis que chegam, pedida antes, continua.) Bots inalterados. Teste automatizado: com tiro automático ligado, 0 lançamentos de míssil/foguete/granada/torpedo do jogador sem toque. Atualizar manual.

## Item 26 (Valter, 21:24 BRT)
- 26: no navio do USUÁRIO o tiro automático vale só para os CANHÕES. Mísseis, foguetes, granadas e torpedos NUNCA disparam sozinhos. Defesa automática AA/CIWS contra aeronaves e mísseis continua; bots não mudam. Teste provando 0 lançamentos automáticos dessas armas + manual.

## Etapa 9 (21:24) — itens 17/18/23/25/25b
- trava1217: falhas 0 (ativo 2,2 s / passivo 3,4 s; TRAVANDO n%; TRAVADO vermelho + cadeado). CSS: botão em trava sai do cinza; cadeado no canto sup. esquerdo (não colide com o alerta).
- radar1217 refeito (ATIVO e PASSIVO × 5 proporções + binóculo): 15 cenas, 0 falhas.
- arvore1217 (item 23): 12 casos, 0 falhas.
- 25b: CIWS/SAM/laser/A30 só procuram mísseis/torpedos/aeronaves (INTERCEPTAVEIS em defesa.js); ricochete agora causa 25% do dano (acertou = dano). Unit "item 25b": 144 projéteis, 0 engajamentos, todos os acertos com dano.
- 25: src/fichaTecnica.js + aba "Ficha" no estaleiro (comparação ▲/▼ com o navio atual). Unit "item 25": 117 números conferidos contra a simulação. UI: tests/ficha1217.mjs.
- Unit: testes que punham trava=1 agora também travaMis=1 (item 17); montagens: células SAM em patrocínio isentas (checadas no patrocínio).
27. (Valter 21:26) Defesas (AA/CIWS/iscas) continuam automáticas. Quando o jogador SAI do navio (ex.: pilota helicóptero/avião), a IA assume o navio do jogador e PODE usar mísseis, granadas, foguetes, torpedos etc. conforme necessidade, de forma equilibrada (conservando munição). Ao voltar ao navio, item 26 volta a valer (só canhões no automático).
27b. Bots: totalmente controlados pela IA, usando todas as armas conforme a necessidade e de forma equilibrada (sem gastar tudo de uma vez, respeitando personalidades).
27c. Aviões e helicópteros: voo e manobra mais FLUIDOS (suavização de entrada, inércia/inclinação realistas, curva coordenada, câmera suave sem tremer), controles responsivos.
27d. SONS: todos necessários, mas NUNCA podem travar o jogo: sons pré-carregados/decodificados no carregamento (nada de decode em combate), pool de vozes com limite e prioridade, sem alocação por disparo. Teste de travada: picos de frame com rajadas de foguetes/granadas/mísseis e muitas vozes = sem picos acima da linha de base.

## Item 26 — FEITO (21:27 BRT)
- armas.js passoArmas5: removido o bloco AUTO de salvas VLS/torpedos do jogador (comentário v1.2.17 item 26); AUTO-FOGO segue só nos canhões.
- ai.js: comandos 'missil'/'torpedo' com guarda !ehJog (IA no comando do navio do usuário não lança).
- world.js: RBU/granadas automáticas só para papel !== 'jogador'.
- Defesa (CIWS/SAM/30mm/laser/iscas) intocada; bots intocados.
- Manual (seção AUTO-FOGO): só canhões no automático + 25b (canhão/granadas sem defesa; ricochete 25%).
- Teste unit "v1.2.17 item 26": 4 partidas (destroier/cruzador/furtivo/aurora; AUTO e IA no comando) → usuário 0 VLS/0 torp/0 rbu; 450 tiros de canhão; defesa 88 ações; bots 485 mísseis/11 torpedos. Teste v1.1 AUTO-FOGO atualizado (vls=0, torp=0). PASSA.
- ficha1217 (browser): 20 casos, 0 falhas.
- Próximo: rebuild dist, suíte unit completa, itens pendentes 13/áudio/visuais/1/2/3/4/10.

## Itens 27–27d (pedido 21:28 BRT)
- 27: jogador fora do navio (heli/drone) → IA assume e usa TODAS as armas com equilíbrio; defesas seguem automáticas. (Ajusta o item 26: a regra "só canhões no automático" vale enquanto o USUÁRIO comanda o navio; com controleIA a IA usa VLS/torpedo/granadas.)
- 27b: bots usam todas as armas com equilíbrio.
- 27c: voo mais fluido de aviões e helicópteros.
- 27d: sons nunca travam o jogo: pré-carregados, pool de vozes, teste de picos.
- Regra: muito realismo em tudo.
28. (Valter 21:28) MÚSICA "AÇÃO" NOVA: precisa ser claramente DIFERENTE e MELHOR que a atual (não um remix leve). Nova composição sintetizada/livre, orquestral-cinematográfica naval de combate: percussão épica, metais, cordas em ostinato, baixo forte, andamento mais rápido, alta resolução (≥44.1 kHz estéreo, sem ruído), mix limpo e não abafada, loop sem emenda audível. Manter a "Atual" como opção. Comparar espectro/BPM com a antiga no relatório. Respeitar música desligada.

## Item 28 (pedido 21:28 BRT)
- Música "Ação" NOVA: composição cinematográfica naval de combate, claramente diferente e melhor que a atual, alta resolução, sem som abafado, loop sem emenda. A "Atual" continua como opção.
28b. (Valter 21:29, esclarecimento) A música ORIGINAL (a primeira) CONTINUA intacta. ACRESCENTAR uma faixa NOVA, com mais AÇÃO e EMOÇÃO (crescendos, clímax, tema heroico), selecionável. Nada removido: manter também a "Ação" existente como opção; a nova vira opção extra (ex.: "Ação Épica"/"Emoção").

## Item 28b — esclarecimento (21:29 BRT)
- A trilha original ("Atual") fica intacta. A "Ação" da 1.2.16 também fica. A nova faixa entra como TERCEIRA opção: "Épica naval", com mais ação e emoção (crescendos, clímax, tema heroico).
- Plano: gerador próprio /workspace/musica1217/gera.py (síntese própria, sem amostras), 48 kHz, Vorbis q7, render CIRCULAR (notas e reverb dão a volta no fim → loop sem emenda), sem passa-baixa geral (não abafa). Arquivos public/audio/epica_menu.ogg e epica_batalha.ogg; estilo 'epica' em NavalAudio (setEstiloMusica + _html + tocaMusica) e no seletor do menu.
- 21:37 BRT: itens 26/27 revisados — com o jogador fora do navio (controleIA) a IA volta a usar VLS/torpedo/granadas (ai.js sem guarda ehJog; RBU IA com controleIA); AUTO-FOGO do usuário no comando segue só canhões (armas.js). 27b: janela de torpedo da IA 2,8→4,4 km (batedor 4,2→5,2). Teste unit "itens 26/27" PASSA: 7 partidas, usuário+AUTO 0/0/0, 700 tiros; IA no comando 566 tiros + 27 salvas VLS; bots 11003 tiros/724 VLS/9 torp/7 RBU; defesa 105 ações. Manual atualizado.
- trava1217 (após CSS): falhas 0.
- Item 28: gerador /workspace/musica1217/gera.py (epica_menu 62,6 s pronto; epica_batalha renderizando).
- ACHADO: tocaMusica() nunca trocava o arquivo pelo estilo (só _html mapeava acao_) — a "Ação" 1.2.16 tocava a faixa original + camada de bateria. Corrigir com _arqMus() para acao/epica.
29. (Valter 21:39) MODO CINEMA (refinar item 9):
- Câmera focada principalmente no NAVIO DO USUÁRIO e nas SUAS ARMAS: travellings rentes ao casco de PROA a POPA (e vice-versa), passagens próximas aos CANHÕES (recuo, fumaça, clarão), lançadores VLS, torpedos.
- ACOMPANHA projéteis: segue o projétil de canhão (modelo de projétil perfeito e em alta resolução, com rastro/calor sutil), mísseis, foguetes, granadas, torpedos até o impacto.
- No IMPACTO no inimigo ouve-se o ESTRONDO (perto = forte e nítido). Outros projéteis/mísseis/granadas/foguetes que passarem perto também são ouvidos nesse modo (áudio 3D relativo à câmera, item 24c).
- No modo cinema a IA ASSUME o controle do navio do usuário (usa armas com equilíbrio, como item 27); ao sair, o controle volta ao jogador.
- Cortes suaves, câmera estável, sem atravessar casco/água (sem interior/água visível), letterbox discreto, câmera lenta opcional nos impactos. Sem excesso.
- 21:42 BRT: item 28 — 1ª versão clara demais (ruído de prato/caixa com centroide 15–18 kHz: chiado irreal) → ruído em banda real (FFT); 2ª versão centroide ~730 Hz (escura) → presença +5 dB acima de 2,5 kHz e pratos +4 dB; re-render. Loop: emenda.py (concatenação 2×) — emenda menor que qualquer início de compasso (ok). LUFS −14/−13,6, LRA 8,8–9,4 LU (Ação 1.2.16: 0,6 LU — sem dinâmica).
- Item 27d: pool sintetizado (_contaSint/_sintLotado: ≤ 64 fracas / 96 total) + tests/picos1217.mjs (rajadas 20 e 80 sons/quadro). Item 13: nome com base no tosado + face no costado (quaternion por base u/v/n) + tests/tosado1217.mjs.

## Item 29 (pedido 21:42 BRT) — modo cinema
- Câmera focada no navio do usuário e nas armas: passagens rentes proa→popa e perto dos canhões; segue projéteis de canhão (modelo em alta resolução), mísseis, foguetes, granadas e torpedos até o impacto, com estrondo no impacto.
- Outros projéteis que passarem perto também são ouvidos, áudio 3D relativo à câmera.
- No modo cinema a IA assume o navio e devolve o controle ao jogador quando ele sai.
- A câmera nunca atravessa casco nem água.
30. (Valter 21:44) RADAR/MINIMAPA: ao girar a mira, o radar mostra em tempo real a DIREÇÃO DA MIRA (linha/cone fino discreto, acompanha o giro) e também a direção da PROA do navio (indicador de rumo distinto, ex.: traço/seta na cor do navio). Visual pequeno, legível, sem cobrir contatos nem outros botões. Funciona em todas as câmeras/binóculo.

### 21:47 BRT — item 29 (código) + item 28 v3
- cinema.js: IA assume (iaNavio) ao entrar e devolve ao sair; planos rasante proa→popa / perto do canhão / órbita; corte 'segue' para granada de canhão (alta resolução via cine.segueG no render), foguete/RBU e torpedo até o impacto, com estrondo (explosão no casco ou coluna d'água); _foraCasco (nunca dentro de casco) + água ≥ crista+1,6 m.
- render: pan() relativo à câmera real no cinema; passagem de granadas/foguetes perto da câmera → NavalAudio.passagem (estalo supersônico + sopro Doppler).
- Música épica v3 + realce de agudos (shelf 6,5 kHz +5 dB): centróide 1049/1085 Hz, >10k 1,0/1,4 %, −14,9/−14,4 LUFS, LRA 9,7/9,5, emenda ok. Copiada para public/audio; CREDITS-audio atualizado; espectro em 1217/musica_epica_espectro.png.

## Item 30 (21:46 BRT) — radar: direção da MIRA em tempo real (acompanha o giro) + direção da PROA com indicador diferente; pequeno, discreto, sem cobrir contatos. PENDENTE.
### 21:55 BRT — item 30 (código) + 27c + manual
- hud.js desenhaRadar: proa = traço âmbar curto + triângulo cheio na borda; mira = tracejado ciano translúcido (girando com this.yaw em tempo real via _miraAzRadar) + losango vazado na borda; desenhados ANTES dos contatos. Sem alocação.
- aereo.js 27c: heli com taxa de guinada em estado e aceleração angular limitada; avião com taxa de rolagem em estado (4 rad/s²) e arfagem com atraso.
- Manual: seção "Novidades 1.2.17" com o crédito e itens 26/27/25b/28/29/30/27c/27d.
- tests/cine1217.mjs (itens 29+30) criado e em execução.
31. (Valter 21:52) BUG: LUZ BRANCA DO TOPO DO MASTRO flutuando no ar em alguns navios. Corrigir: luz de mastro presa ao vértice/osso mais alto real do mastro de CADA classe (ancorar no modelo, não em altura fixa), tamanho/intensidade proporcional ao navio, acompanha balanço/inclinação/escala/LOD. Teste automatizado em TODAS as classes (estaleiro, menu, batalha): distância luz→topo do mastro ≤ 0,3 m. Luzes de navegação realistas (branca de mastro, vermelha BB, verde BE, branca de popa) sem excesso de brilho.

## Item 31 (21:53 BRT, bug) — luz branca do topo do mastro flutuando em alguns navios: ancorar no topo REAL do mastro de cada classe, tamanho proporcional, acompanha balanço e LOD; teste em todas as classes com distância ≤ 0,3 m. PENDENTE.
32. (Valter 21:56) SOM DE NAVEGAÇÃO característico por navio (por classe/tamanho/propulsão): motor/turbina + casco na água + esteira; varia contínuo com a velocidade (tom/volume sobem ao ACELERAR, descem ao DESACELERAR, transientes realistas), e som do bow thruster/giro com o NAVIO PARADO. Loops sintetizados de alta qualidade, crossfade sem emenda, sem excesso.
33. (Valter 21:56) CAUSA CONFIRMADA DA TRAVADA = MUITOS SONS disparados ao mesmo tempo. Os sons são necessários: CORRIGIR sem remover — todos os buffers pré-decodificados no carregamento; pool fixo de nós de áudio (sem criar nós por disparo); limite de vozes por categoria com prioridade (perto/importante primeiro) e voice stealing do mais distante/fraco; agrupar rajadas (um som de salva em vez de N idênticos no mesmo quadro); throttle por fonte; nenhuma alocação nem decode no frame; limiter/compressor no master. Teste obrigatório: 8x8 navios com rajadas de foguetes/granadas/mísseis/canhões + aviões → sem picos de frame acima da linha de base sem áudio, 0 nós de áudio criados em combate.
34. (Valter 21:56) TUDO NESTA VERSÃO 1.2.17 — não adiar nada para "outra versão". Itens 1–33 completos; não entregar parcial.
35. (Valter 21:57) CADA SOM SEM ATRASO: todo som toca no mesmo instante do evento visual (latência < 30 ms, sincronizado com clarão/impacto/lançamento). SUBSTITUI o "atraso pela velocidade do som" do item 24c: NÃO aplicar atraso por distância. A distância muda só volume e abafamento (low-pass). A otimização do item 33 (pool/limite de vozes) NÃO pode introduzir fila/atraso: som com prioridade toca imediatamente (voice stealing em vez de esperar). Teste: medir latência evento→início do som em rajadas = < 30 ms.
35. (Valter 21:59) Cada som toca SEM ATRASO, junto do evento visual (< 30 ms). SUBSTITUI o atraso por distância do item 24c: NÃO aplicar atraso de 343 m/s; distância só muda volume e abafamento. Pool do item 33 com voice stealing, SEM fila. Teste de latência.

### 21:59 BRT — retomada (contexto novo)
- Máquina NÃO reiniciou (uptime 2h49); vite preview :4173 ativo (PIDs 7581/7594); unit completa em andamento (/workspace/unit1217c.log).
- cine1217 (itens 29+30): **0 falhas** — 9000 passos de cinema: 0 quadros com câmera dentro de casco, 0 abaixo d'água (mín. 3,7 m), planos rasante/canhão/órbita, segue granada em alta resolução (214 quadros), 6 cortes de impacto, IA assumiu (1) e devolveu (0), pan relativo à câmera (direita 1, frente 0), passagem 3D tocou, programas WebGL 135→135, 0 erros JS. Radar: mira acompanha o giro em 0°/70°/160°/−110° (erro 0). Capturas 1217/cinema e 1217/radar30.
- Plano item 33/35 (prioridade): MIXER em AudioWorklet (public/audio/mixer.js) — todos os one-shots (arquivos + camadas sintetizadas PRÉ-RENDERIZADAS no carregamento via OfflineAudioContext) tocam em vozes fixas do worklet: 0 nós criados por disparo; limite por categoria + voice stealing do mais fraco (sem fila); agrupamento de rajadas (mesmo som no mesmo quadro = 1 voz com soma de potência); throttle por fonte; eco de distância num bus fixo; laços (heli, míssil, torpedo, avarias) num pool fixo criado na largada; sem atraso de distância (item 35). Reserva: cadeias fixas + BufferSource se não houver AudioWorklet.

## Retomada (sessão atual) — itens 33/35, 32, 31
- [x] Itens 33/35 CÓDIGO: NavalAudio integra public/audio/mixer.js (AudioWorklet). São 3 mixers fixos criados na inicialização: efeitos (64 vozes, saída 2 → bus de eco fixo), laços (64) e camada rítmica da música (64). Todos os sons sintetizados são PRÉ-RENDERIZADOS (OfflineAudioContext) no carregamento: camadas, canhão k0..10, explosão, passagens, salva, flares, alertas, bips, UI e batidas da música. Os buffers são enviados ao worklet uma vez.
  - _voz: limites por categoria (canhão 14, explosão 12, água 8, míssil 10, passagem 4, defesa 6, UI 6, outros 8; total 56), prioridade, roubo da voz mais fraca e SEM FILA (mais fraco que tudo = descartado). Rajada: mesmo som em menos de 30 ms e a menos de 250 m vira 1 voz (soma de potência). Throttle de 45 ms por chave mantido.
  - Item 35: todos os atrasos de distância removidos (toca, camada, salva, flares); a distância só muda volume, passa-baixa e eco.
  - Laços (rotor, turbina, incêndio, alagamento, bolhas, voo de míssil, torpedo, vento, jato, navegação de outros navios) passam pelo mixer de laços: chave → voz e roubo do laço mais baixo. Só envia mensagem quando o valor muda.
  - CIWS: cadeia criada em iniciaMotor. destrava só cria buffer se o contexto não estiver rodando. Vozes WAV vão para o mixer no carregamento.
  - Reserva sem AudioWorklet: caminho antigo, mantido.
- [x] Item 32 CÓDIGO: perfilNav(C) com propulsão diesel, CODOG, COGAG ou vapor (por deslocamento), frequências ∝ 1/√L e inércia ∝ deslocamento. Motor próprio com onda de proa (∝ v^1,5), esteira com frequência de pá e transiente da turbina ao acelerar; thruster de proa (item 18) parado. Os 3 navios mais próximos têm máquina da classe + casco via mixer de laços.
- [x] Unit: 79/80; a falha era atlantico.samPa (patrocínio BB 0,44 m além do limite) → x = −(B·0,7+2,9). Re-rodado: OK.
- [x] Item 31: luz de topo ancorada no ponto mais alto da estrutura FIXA (sem det e sem giratórios); mastaréu quando um radar giratório passa por cima; ESM fora do LOD det; r = L/900 (0,18–0,4 m); halo max(1,8, L/85). Vitrine usa as mesmas posições. O cabo da gala sai do topo real.
  - tests/luz1217.mjs: 0 falhas em 40 classes, modelo/batalha perto, LOD e balanço 10° (folga ≤ 0,3 m), e vitrine 40/40 (desvio 0,000). Saída em /workspace/luz1217.out.

### Itens 33/35 — teste tests/aud1217.mjs (sessão atual)
- Criado tests/aud1217.mjs: 8x8 (frota + porta-aviões), frotas a 2,5 km trocando fogo + 40 chamadas/quadro (foguetes, granadas, mísseis, canhões, explosões, passagens, flares, salvas) + 6 rotores + 12 laços de míssil; fases alternadas base(sem áudio)/áudio.
- 1ª rodada: falha "camada:boosterSep não tocou isolada" — categoria míssil cheia com caudas antigas de mesma força → descartava o novo. Correção: prioridade de roubo pondera a idade (at/(1+2·idade)), o evento novo rouba a cauda mais velha.
- 2ª rodada: 0 falhas. Nós criados em combate 0; downloads/decod 0; q95 base 533 / áudio 450 ms (box sem GPU, ~2,5 qps; áudio não piora); latência evento→início no worklet máx 11,6 ms (1 quantum de 128 a 44,1 kHz ≈ 2,9 ms + troca de thread), igual a 7 km (sem atraso por distância); 46 sons isolados, 0 perdidos; vozes ≤ 55/64; roubados ~300, agrupados ~240, descartados (mais fracos, saturação) ~700 por fase. outputLatency do Chrome headless 32 ms (dispositivo, vale igual para o vídeo).
- Pré-render no carregamento: 21–24 s neste box (assíncrono, OfflineAudioContext); quadros durante p95 500 vs 483 ms depois (máx 833 vs 500) — sem travada perceptível. Saída: /workspace/aud1217.out

## Retomada 02:38 BRT (máquina REINICIOU ~02:39: uptime 2 min)
- node_modules e dist sumiram com o reinício → npm ci (89 pacotes) + vite build ok; keystore ~/.android/debug.keystore presente, SHA-256 D0:C3:17:91…A5:99 (mesma chave). vite preview :4173 reiniciado. Código-fonte intacto (edições 13a/13c/13i presentes).
- [x] 13a: teste node de 8 arenas: +6 ilhas em todas; 4 plataformas sólidas (alturaTerreno −1 no centro), guanabara 3/4 (baía rasa); custo ≤ 0,4 s na largada. Fallback de fundo raso (16 m) para arenas reais.
- [x] 13c CÓDIGO: alvo pelo armamento (torpedo → grande/lento; míssil → maior vida; foguete/mg → pequeno e pouco defendido, cada CIWS pesa; histerese); evasão AA (SAM guiando ou dentro de 1,6 km de navio com CIWS → jinking senoidal ±29–40°, rasante 20 m heli/45 m avião, potência máx.); ruptura pós-disparo (curva de 120° nos primeiros segundos). Aproximação baixa e retorno para rearmar já existiam (mantidos).
- [x] 13i CÓDIGO: src/camoAereo.js (6 esquemas: cinza naval, baixa visibilidade, azul oceânico, verde-oliva, areia, noturno); aereo3d clona c/c2 por esquema (mesmo programa WebGL); estaleiro aba Helicópteros "Camuflagem das aeronaves" + vitrine; economia camoAereoDe/escolherCamoAereo; jogadorOpc.camoAereo; personalizada: seletor por lado + aleatório (match aplica por time).
- [x] 12: testeDrive já usa eco.pinturaDe(k) (código conferido).
- [x] Item 3 CÓDIGO (texturas/cidade): textures.js cvK/grao/hiRes (anisotropia 8) — números 2×, heliponto 2×+grão, portas e hangar 4×+grão; convés 1024 px com grão. cidade.js: skyline em pódio + torre recuada (62% dos prédios > 34 m), 30% torres de pele de vidro com reflexo fresnel do céu, lajes e recuo de janelas no shader (cache predios3); coberturas() com casas de máquinas, condensadoras e caixas d'água (sem blocos lisos).
- [x] Item 4 CÓDIGO (DOF): src/render/dof.js — cena desenhada normalmente → copyFramebufferToTexture → profundidade em meia resolução por override MeshDepthMaterial (transparentes/partículas fora) → quad com CoC físico c = A·max(|z−S|−zona,0)/z, espiral áurea 28 amostras, peso por CoC (nítido não vaza), bokeh leve. Menu/estaleiro (foco no navio, ab 0,5–0,7, zona 0,55·L) e cinema (puxada de foco suave no assunto, ab 0,35–0,45, zona ∝ distância). Ajuste "PROFUNDIDADE DE CAMPO" (padrão ligado; desligado na qualidade baixa). Programas pré-aquecidos (aquece).
- [x] tests/dof1217.mjs: **0 falhas** — camo de aeronave "oliva" aplicada (6 esquemas), 0 botões sobrepostos (Helis) e 0 controles sobrepostos (personalizada); partida com 6 ilhas extras + 3 plataformas, camo por time (azul noturno ×6, vermelho areia ×7); navio do jogador lançado contra a plataforma parou a 116 m do centro (não atravessa; r 42 m); programas WebGL no cinema com DOF 140→140; 0 erros JS. Capturas 1217/dof e 1217/personalizada13.
- [x] Diagnóstico do DOF: 90 quadros comparando o mesmo quadro com/sem DOF (pixels > 200/765 mais escuros): 0–1 px por quadro — o disco escuro de uma captura era a FUMAÇA PRETA real do navio em chamas (confirmado com DOF desligado), não artefato.
- [x] Achado no diagnóstico: câmera do cinema podia entrar entre as pernas da plataforma → _foraCasco também empurra para fora das plataformas/obstáculos (raio 27 m, abaixo de 50 m).

## Retomada 03:07 BRT
- Máquina NÃO reiniciou de novo (uptime 29 min, desde o reinício de ~02:38); node_modules (89) e dist presentes; vite preview :4173 ativo (PIDs 7650/7666).
- Em execução: suíte unit completa (/workspace/unit1217f.log) e regressão de navegador sequencial com 34 testes (/workspace/reg1217/roda.sh → resumo.txt).
- [x] Manual (Como jogar → Novidades 1.2.17): incluídos personalizada (ilhas/plataformas/camo, detalhamento da recompensa), IA e camuflagem das aeronaves, visual (texturas, cidade, DOF, nome, luz de mastro), armas (trava, míssil/torpedo/flare/colunas/incêndio, SAM do Atlântico, ficha), som (lançamento, aproximação, 3D sem atraso, navegação, música dinâmica) e toque (pausa, 48 dp, radar, árvore, test drive). O crédito foi mantido.
36. (Valter 03:12) VISUALIZAR na árvore tecnológica (print: /cursor/stores/store-c4f9a8c9-1171-46ce-b4f5-688918da1d47/grok-bot/agents/c98e0fb9-cd2b-49e7-9b39-7bb4ba2b1e4b/attachments/01M5KP7M6Q8W0F4CK2ZCSFMKYE.jpg — Marcos Vinícius, ficha embaixo à esquerda cobrindo o casco):
- Mover a ficha de dados para o ALTO à ESQUERDA (sem cobrir o navio nem o Voltar).
- Novo quadro À DIREITA com mais informações (dados reais do jogo: deslocamento, HP/blindagem, sensores/radar/sonar, furtividade, AA/CIWS, torpedos, aeronaves, camuflagem atual, nação/bandeira) — vidro, legível, sem sobreposição (entrar no teste sobrepor). Voltar continua visível (reposicionar se preciso).
- ZOOM POR PINÇA moderado (sem excesso: limites mín/máx por tamanho do navio), e INCLINAÇÃO do cenário (arrastar vertical = pitch da câmera com limites). Câmera NUNCA abaixo da água nem dentro do casco (sem água/partes internas visíveis) — colisão de câmera com casco e plano da água. Rotação automática pausa enquanto o usuário toca e volta suave depois.
- Observado no print, verificar/corrigir: brilho/arco verde estranho perto da superestrutura; navio parecendo muito baixo na água; cidade ainda em blocos (item 3/32).
36b. (Valter 03:14) VISUALIZAR: também GIRAR o cenário com o dedo (arrastar horizontal = órbita 360° em volta do navio). Ao PARAR de mexer (~2–3 s sem toque), a cena volta SUAVEMENTE ao modo original: câmera cinematográfica girando automaticamente (zoom/inclinação retornam gradualmente ao enquadramento padrão). Mesmo comportamento recomendado no menu inicial e no estaleiro com rotação.

## Itens 36/36b — implementação e verificação (03:20–03:55 BRT)
- **Ficha** `.vz-ficha` no ALTO à esquerda (top 12 px + safe-area, máx. min(360 px, 36vw)). **Quadro novo** `.vz-info` à direita (vidro fosco, `pointer-events:none`), dados reais da classe + módulos (`modsDe`): nação/bandeira, deslocamento, dimensões/calado, casco HP × blindagem, radar ativo + ESM, sonar, furtividade (alta/média/baixa + RCS ×), AA/CIWS (CIWS, SAM, 30 mm, iscas), torpedos/tubos, aeronaves/hangares, camuflagem atual. Media queries para ≤ 800 px de largura e ≤ 380 px de altura. Voltar visível.
- **Gestos** (vitrine cine): arrasto horizontal = órbita 360°; vertical = inclinação 0,04–0,70 rad; pinça com limites pelo tamanho (zMin = clamp((B·1,6+40)/(L·0,8+30), 0,5, 0,8), zMax 1,7). `tToque` zera a cada gesto; após 2,5 s o peso `w = smoothstep((tToque−2,5)/2,5)` reativa o giro cinematográfico e leva zoom→1 e inclinação→base suavemente. Estaleiro: zoom volta após 2,5 s. Menu inicial: `orbitaTela` na `.tela-inicio` (exceto botões/cartões).
- **Câmera nunca dentro do casco**: empurrão por elipse (B/2+8, L/2+8) no referencial do navio quando y < F·3,2+6; **nunca sob a água**: y ≥ mar + 2,5 m.
- **Brilho/arco verde**: halos das luzes de navegação da vitrine ignoravam o setor COLREG; agora `userData.setor` (BE/BB 112,5°, topo, popa) controla a visibilidade.
- **Navio baixo na água**: medido no modelo (raio vertical junto ao costado, meia-nau): convés a 11,3–11,8 m com F = 12 m e navio em y = −0,07 → linha d'água correta (borda livre real ≈ 3% de L para 392 m). Inclinação cinematográfica base 0,115→0,125.
- **Cidade em blocos**: orla do fundo 230→440 prédios (instanciados, 0 programas novos: 34 programas), arranha-céus com esbeltez real (28–46 m de base, altura ×1,3–2,1), só 6% de arranha-céus em orla grande, paleta real (concreto/arenito, cinza-azulado, tijolo, poucos brancos). Capturas `visualizar36/cidade_visualizar.png`.
- **tests/vz1217.mjs**: 15 telas (3 navios × 5 proporções) 0 sobreposições / 0 cortes; gestos reais PointerEvent OK; 300 gestos aleatórios: q mín 1,97 (fora do casco), y mín 10,0 m; volta ao cinematográfico (ang avança, zoom 1,0, elev 0,103); 48 lanternas × setor 0 erros; menu gira e volta; 0 erros JS → **vz1217 falhas 0**.
- **tosado1217** (16 falhas): o código do nome estava certo; o TESTE media a "borda" com raio que batia em torres/superestrutura e comparava o ângulo da reta sem módulo 180° (no boreste o texto corre proa→popa). Novo método: vértice mais alto do costado em cada estação (malha estática `base`, faixa acima das letras, meia-boca acima das letras p/ tumblehome) → **0 falhas**, desvio ≤ 0,82° nos 8 navios.
- **musica1217** "não desceu": a intensidade caiu (0,98→0,77) mas o teste esperava 25 s de relógio; headless roda ~2 qps (≈12 s de jogo) e golpe/tiro decaem em 8–10 s + τ 6 s. Teste passa a esperar 30 s de TEMPO DE JOGO. Reexecução após o FIM da regressão.
- Manual: parágrafo VISUALIZAR em "Novidades 1.2.17" (crédito mantido).
- smoke1211 (NaN 0, 3 partidas completas), hud129 (0 sobreposições, erros []), sam1217 (5 lançamentos, erros []) — sem linha "falhas" por formato do log, todos OK. Unitários: 80 passaram, 0 falharam.

## Retomada 03:53 BRT
- Máquina NÃO reiniciou (uptime 1:15); previews :4173 (PID 7666) e :4174 (PID 35698) ativos; regressão roda.sh em porto1216. Ambiente íntegro, nada a restaurar.
- **Item 10b — água no casco no PORTO — FEITO**: novo `tests/aguaporto1217.mjs` (método do agua1214 aplicado à vitrine do porto: quadro com × sem oceano na silhueta do próprio navio acima de 0,75·F; proa, popa e rasante). 9 classes (corveta…marcos): **0 px** de água/espuma dentro do casco (silhuetas 2,6–15,8 mil px; o oceano altera 6–23 mil px do quadro → teste não é vazio). Capturas `1217/porto10b/`.
- **Item 10c** (retestes 7, 8, 11, 13): sam1217 (Atlântico 16 SAM, 5 lançamentos) OK; pers1216/personalizada13 (recompensa detalhada) OK; tosado1217 0 falhas (item 13). Item 11 coberto pela regressão.
37. (Valter 03:57) BUG DA RÉ (prioridade): ao acionar a ré, assim que a velocidade fica NEGATIVA (~ -1 nó), a PROA começa a girar sozinha para a direção designada (rumo/leme). Corrigir com física realista de marcha a ré: em ré o leme tem efeito invertido e bem mais fraco (popa conduz, fluxo da hélice não passa pelo leme), sem o piloto de rumo "puxar" a proa; o navio NÃO deve girar sozinho com leme a meio. Leve tendência realista de desvio (efeito da hélice, popa para BB) pequena, sem giro forçado. Transição suave em torno de 0 (sem salto de sinal, histerese), vale para jogador e bots. Teste automatizado: leme a meio em ré −1…−10 nós → variação de rumo ≤ 2°/min (apenas desvio de hélice); com leme carregado em ré → giro no sentido invertido e mais lento que avante.
37b. (Valter 03:58, CORREÇÃO do 37) É a POPA (não a proa) que começa a girar para a direção designada assim que a velocidade de ré fica negativa (~ -1 nó), de forma abrupta/indevida. Diagnosticar no código de manobra (provável inversão de sinal do rumo/leme ou o piloto de rumo usando o vetor de velocidade negativo = aponta a popa para o rumo). Corrigir: comando de rumo/leme não pode "virar" o navio para apontar a popa ao rumo de repente; em ré o leme tem efeito realista (invertido, fraco, proporcional à velocidade, gradual desde 0), sem salto ao cruzar 0/−1, com histerese. Leme a meio em ré = sem giro (só leve desvio de hélice). Jogador e bots. Teste automatizado conforme item 37 + gráfico de taxa de guinada × velocidade (−10…+10 nós) contínuo, sem degrau em 0/−1.

## Itens 37/37b — marcha a ré (04:00–04:20 BRT) — FEITO
- **Diagnóstico** (simulação, fragata, telégrafo em ré, rumo designado 90°): o piloto de rumo continuava governando com seguimento a ré → leme cheio + propulsor de proa → ~2°/s já a −0,9 nó (+80° em 1 min). Além disso o termo de ré era `(v<0 ? −0,5 : 1)`, que mantinha o MESMO sentido de avante e somava a esteira da hélice (0,22·|u|), que a ré não passa pelo leme. O sentido do giro parado também mudava com o telégrafo, o que dava um salto em v = 0.
- **Correção** (`src/naval5v5/hidro.js`, mesma física para jogador e bots):
  1. Estado `n.re` com histerese: entra com v < −0,25 m/s ou máquina a ré com v < 0,3; sai com v > 0,05 e máquina avante.
  2. A ré o piloto deixa o leme a meio e guarda o rumo pedido.
  3. Leme a ré: invertido pelo próprio sinal de v, fraco (40%), proporcional a v·|v| desde 0 e sem esteira.
  4. Efeito transversal da hélice dando atrás: popa para BB, ≤ 1,2°/min com máquina toda a ré.
  5. Giro parado (propulsor de proa) sai em rampa linear até −1 m/s, com sentido independente do telégrafo.
- **Bots** (`src/sim/ai.js`): com `n.re` o leme é invertido (ganho 0,6, amortecimento também invertido), sem realimentação.
- **Teste `tests/re1217.mjs`**:
  - Corveta, fragata, destróier e Marcos, de −10 a +10 nós em passos de 0,5.
  - Leme a meio a ré: 0,6–1,15°/min (≤ 2). Rumo designado a ré: idem, o piloto não puxa.
  - Leme cheio: sentido invertido e mais fraco de 2 a 10 nós. Exemplos: corveta +5 → 2,69°/s e −5 → −0,35°/s; Marcos +10 → 1,42 e −10 → −0,56.
  - Curva contínua, sem troca de sentido nem aumento entre 0 e −1 nó.
  - Bot a −3 nós: |w| máx. 0,05°/s.
  - **0 falhas.** Gráfico e CSV em `1217/re37/guinada_x_velocidade.svg|csv`.
- Regressões: fisica1216 8/0 (giro parado: corveta 3,20°/s, destróier 1,98°/s, sem mudança). Manual: parágrafo MARCHA A RÉ.
- Regressão completa 1 (dist anterior): 33 suítes. Ajustes de teste:
  - fantasma1216 media o botão PAUSA, que fica a 55% de propósito pelo item 6; o teste agora mede um botão de combate.
  - som1216 está obsoleto: o atraso de 343 m/s foi retirado pelo item 35 e o som passou ao pool do worklet. Ele foi substituído pelo aud1217: 0 falhas, latência máx. 20 ms, 18 tiros.
- Regressão 2 (dist novo com 36/37) em andamento: `/workspace/reg1217/r2/resumo.txt`.
38. (Valter 04:24) BUG NO MODO CANHOTO — corrigir (detalhe ainda não informado). Auditar o modo canhoto por completo: espelhamento de TODO o HUD (incluindo botões novos 1.2.16/1.2.17: radar, VLS com anel de trava, telegrafo de máquinas, leme em arco, ocultar HUD, pausa, binóculo + slider de zoom, LANÇAR ESQUADRILHA, cinema, contadores), 0 sobreposições em todas as proporções, toques/arraste/pinça funcionando nos lados corretos, leme e acelerador sem sinal invertido (girar à direita continua sendo BE), mira e joystick corretos, persistência da opção ao reabrir (save.mescla), estaleiro/menus/Visualizar. Novo teste canhoto1217: mesmas cenas do sobrepor1216 + interação, 0 falhas.
38b. (Valter 04:25) PRINT do modo canhoto: /cursor/stores/store-c4f9a8c9-1171-46ce-b4f5-688918da1d47/grok-bot/agents/c98e0fb9-cd2b-49e7-9b39-7bb4ba2b1e4b/attachments/01M5KTCTMERTP65RW9S2DD7YR8.jpg (telefone ~20:9, batalha). Problemas visíveis:
- Botões de armas circulares na borda ESQUERDA CORTADOS fora da tela (só aparecem metade: "R", "A", "DEC…") — respeitar safe-area/margem, nada fora da tela.
- Leme em arco (BB/BE, 35° BE) sobrepondo o RADAR e o botão ATIVO.
- Telégrafo de máquinas (AVANTE TODA…RÉ) sobrepondo o botão DEC e o texto "24 NÓS".
- Lado direito só com AUTO-MIRA/MIRA LIVRE/AUTO-FOGO: os botões de disparo (canhão/VLS/torpedo/foguete/granada) não aparecem — reposicionar corretamente no layout canhoto.
- Radar encostando no cartão do comandante.
Corrigir o layout canhoto como espelho completo e limpo do destro (mesma qualidade), com 0 sobreposições e 0 elementos fora da tela em 16:9, 18:9, 19.5:9, 20:9, 21:9; incluir no teste canhoto1217 e no sobrepor. Conferir também o modo destro nessa mesma tela.
38c. (Valter 04:27) SOLUÇÃO PEDIDA: no modo canhoto INVERTER TUDO — o layout canhoto é o ESPELHO HORIZONTAL EXATO do layout destro (mesmas posições/espaçamentos/margens espelhados: x' = largura − x − w), gerado a partir do destro (não um layout separado à mão). Textos, ícones e números NÃO ficam espelhados (só as posições). Leme em arco espelhado mantém BB à esquerda e BE à direita (sentido real). Como o destro já passa no sobrepor, o canhoto herda 0 sobreposição e 0 fora da tela; teste canhoto1217 confirma.

## Retomada 05:17 BRT — registro do que já foi feito em 38/38b/38c (modo canhoto)
- Diagnóstico (print do Valter + sonda `/workspace/sonda38.mjs`): o canhoto antigo era um conjunto de regras CSS manuais (`.hud.canhoto …` em hud120.css) escritas para o HUD 1.2.0; os blocos novos (leme em arco + telégrafo `h-acel`, radar à esquerda `.hud.v12`, chaves, consumíveis) não tinham regra. `h-armas` ia para `left` com `scaleX(-1)` + `transform-origin` herdado → ficava em x = −222 px (botões cortados, disparo "sumido"); `h-acel` não mudava de lado → leme/telégrafo sobre radar/ATIVO/DEC/"24 NÓS".
- Solução (item 38c): regras manuais REMOVIDAS. `Hud.espelha()` (src/ui/hud.js) mede o layout DESTRO (translate zerado) e aplica x' = W − x − w com a propriedade CSS `translate` (não mexe em transform/scale): blocos de topo; filhos dos grupos de controle (h-armas, h-acel, h-cons, h-chaves, h-heli); "satélites" absolutos que saem de lado do dono (ícones de torre do CANHÃO, ATIVO/PASSIVO). Textos/ícones/números, radar e leme em arco NÃO espelham (BB à esquerda, BE à direita). Elementos presos ao mundo (marcas, mira, caixa de alvo, impacto, números de dano, leque) ficam fora. Safe-area respeitada (sondas --sl/--sr). Remedição só por evento (ResizeObserver/MutationObserver da classe/resize), nunca por quadro (medido: 7 remedições em 20 s).
- Leque de câmeras abre para a direita no canhoto; dicas do tutorial trocam "(esquerda)"↔"(direita)".
- 38b no DESTRO também (o canhoto herda): cartão do comandante, DANOS, velocidade e ATIVO/PASSIVO passaram para uma coluna à direita do radar (nada sobre o DISCO do radar); placar com borda esquerda = max(centro − w/2, fim do cartão + 6 px); fita 3 px abaixo do placar; log lateral abaixo da fita/estreito.
- Teste `tests/canhoto1217.mjs` (novo): 21:9, 20:9, 19.5:9, 18:9, 16:9, 1280×720, 4:3 × combate/binóculo/cinema/espectador; 0 sobreposições (clicáveis + disco do radar + blocos do topo), 0 fora da tela, espelho ≤ 1,5 px (medido ≤ 0,37 px), 0 textos espelhados, leme (toque direita = +0,57 BE, esquerda = −0,57 BB), telégrafo (topo = AVANTE TODA, base = RÉ), leque dentro da tela e para a direita, persistência via save. Resultado: **0 falhas** (`/workspace/canhoto1217.log`, capturas `1217/canhoto/`). sobrepor1216 (destro) 0 falhas; hud129 sem erros.
- Unit: adaptados a item 17 (trava de míssil completa em duelo/SAM), item 26 (AUTO-FOGO do usuário só canhões) e item 7 (células SAM em patrocínio). Rodada completa em andamento.
- **aguaporto1217 rc=1 na r2 — decisão: bug do TESTE (dois)**: (1) `ReferenceError: __nnsUI is not defined` — com a máquina carregada (load ~7) o boot passou do laço de ~80 s e o teste seguia sem checar; agora espera até 5 min e falha com mensagem clara (boot medido: 9 s com a máquina livre). (2) Ao rodar de novo apareceram 2 px intermitentes em fragata/popa: depuração por raycast no pixel → `MAT.rotor` (disco do rotor do helicóptero no convés, transparente 0,85): o mar visto através do rotor girando é correto, não é água dentro do casco. A silhueta do teste agora exclui material translúcido do próprio navio. Resultado: 9 classes, **0 px**. Lacuna: o 4º ponto ("vitrine", câmera atual do Visualizar) mede silhueta 0 (navio fora do recorte 320×144 acima de 0,75·F nessa câmera) — as 3 câmeras fixas (proa, popa, rasante) cobrem o casco.
- **Unit**: 76 passaram, 0 falharam (`/workspace/unit1217h.log` + reexecução após corrigir o `prot` do SAM, que também precisava da trava de míssil do item 17).
- 05:5x BRT: manual "Novidades 1.2.17" ganhou o parágrafo MODO CANHOTO (crédito mantido). `vite build` final; regressão 3 (`/workspace/reg1217/r3`) contra o dist final: canhoto1217, sobrepor1216, aguaporto1217, hud129, toque1217, smoke1211, radar1217.

### Regressão 3 (dist index-DL7vkxG5, 05:50 BRT) — resultado e correção
- canhoto1217 rc=1: 1 falha "cinema@19.5x9: espelho inexato 2,0 px em h-placar" (demais cenas ≤ 0,37 px). sobrepor1216 0 falhas; aguaporto1217 0 px / 0 falhas; hud129 rc=0.
- Causa: o placar tem conteúdo dinâmico (relógio + ícones de afundados); no cinema um navio afundou entre a medida destro e a canhoto, a largura mudou e o par comparou conteúdos diferentes (TESTE). Além disso havia 1 quadro de defasagem real no JOGO: o ResizeObserver só agendava o re-espelho para o próximo rAF.
- Correções: hud.js — ResizeObserver chama espelha() direto (após layout, antes da pintura: mesmo quadro; translate não muda tamanho → sem laço). canhoto1217 — se algum bloco não transitório muda de largura entre as duas medidas, repete o par (até 4×); tolerância 1,5 px mantida.
- 05:57 BRT: canhoto1217 contra o dist novo (B6f6dWI9, :4174 e depois :4173): 0 falhas (par repetido 1×, espelho ≤ 0,37 px). 1ª reexecução em :4173 deu rc=1 porque o boot passou de 80 s enquanto o gradle rodava (erro do TESTE: `__nnsUI` indefinido); espera ampliada para 300 s; reexecução 06:20 BRT: 0 falhas. sobrepor1216 final: 0 falhas.
- BUILD ÚNICO 05:57 BRT: cap sync + assembleRelease. SHA-256 939a56dfc8070cbb20e5fc88b2da79e753ce2bcc48b0a88a0e63a94049fc9dbf, 13.431.477 bytes, vc20/1.2.17, cert d0c31791…a599, VIBRATE (+ DYNAMIC_RECEIVER do AndroidX). Copiado para /workspace/NexoNavalStrike-1.2.17.apk e attachments/. Unit 76/0. Relatório: /workspace/NexoNavalStrike-1.2.17-relatorio.md.
- Rerun no dist de teste (:4174, index-B6f6dWI9): canhoto1217 **0 falhas** (cinema@19.5x9 0,37 px; 1 par repetido; 4 re-medições em 20 s).
- dist final = index-B6f6dWI9 (mesmo hash do dist de teste). Regressão 3, restante (dist DL7vkxG5, só a linha do RO difere): sobrepor1216 0, aguaporto1217 0 px, hud129 rc 0, toque1217 0, smoke1211 rc 0, radar1217 15 cenas 0.

## BUILD ÚNICO 05:57 BRT
- `npx cap sync android && ./gradlew assembleRelease -q` → app-release.apk 13.431.477 bytes, SHA-256 939a56dfc8070cbb20e5fc88b2da79e753ce2bcc48b0a88a0e63a94049fc9dbf.
- apksigner: v1+v2, cert d0c31791…a599 (mesma chave). aapt: br.com.valteramorim.nexonaval vc 20 / vn 1.2.17, compileSdk 35, minSdk 22; permissões VIBRATE (+ DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION do AndroidX). Manual dentro do APK: "MODO CANHOTO" e crédito presentes; 0 URLs de CDN.
- Copiado para /workspace/NexoNavalStrike-1.2.17.apk e attachments/NexoNavalStrike-1.2.17.apk (sha idênticos).
- Pós-build (só testes, nada do app alterado): sobrepor1216 no dist final 0 falhas; canhoto1217 no dist final deu rc=1 por boot > 80 s sob carga do gradle (__nnsUI indefinido; mesmo defeito de harness do aguaporto) → espera de boot ampliada para 300 s; reexecução no dist final: **canhoto1217 0 falhas** (reg1217/r3/canhoto1217_final2.log). Unit: **76 passaram, 0 falharam** (unit1217i.log).
