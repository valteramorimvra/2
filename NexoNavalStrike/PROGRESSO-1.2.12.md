# PROGRESSO 1.2.12
- 21:05 início; backup /tmp/src1211bak, /tmp/public1211bak, /tmp/tests1211bak; versionCode 15 / 1.2.12
- 21:09 item 2: teste por torre (tests/canhao1212.mjs) com gatilho repetido passa 48/48 em todas as novas → causa não é arco/bloqueio; investigando toque único/movimento
- 21:15 item 2 FEITO: causa = toque do CANHÃO expirava em 0,7 s (n.gatilho) enquanto torres pesadas (15°/s) ainda giravam após travar/mudar marcação → sem tiro; agora pendente por torre até 12 s, 1 tiro por torre por toque; tests/canhao1212.mjs (toque único e repetido) 9 classes × 12 marcações × 2-4 distâncias OK
- 21:17 item 3 FEITO: PARAM.canhao.vel 3,6→3,28 (−8,9%); tabela de tiro (balistica.tabela) recalculada do V0; alcance máx ≥ alc em todas as classes; testes de dispersão/solução OK
- 21:25 item 6 FEITO: mercantes em TODA batalha (frota 2/lado, duelo 1/lado, opção padrão do jogo), nascem na rota de comboio que cruza a área de combate (passa a 1,3 km da zona central), casco ×2 (VIDA 520), bots comuns preferem navios de guerra (só batedores caçam); ícone retangular âmbar no minimapa (verde aliado / vermelho inimigo); rótulo '⛴ Mercante' quando detectado; 5 mapas/modos: todos aparecem, detectados, sem NaN, menor distância ao centro 0,4–4,2 km
- 21:25 item 7 FEITO (código): contato anônimo = símbolo pequeno ◆/◇ sem texto, nunca na região central, não empilha (sobrepôs → oculta)
- 21:39 item 1 FEITO: leque de câmeras (segurar 250 ms, meia-volta à esquerda do botão, rótulos curtos, esmaecidas sem objeto → pendente na próxima salva/tiro/foguete, arrastar+soltar, tocar item, tocar fora fecha, toque curto alterna); fluxo de toque testado em hud129 (20:9)
- 21:41 itens 4/5 (código): impactoMissil (bola de fogo contida 16 part., fumaça escura 30, destroços c/ gravidade 22, brasas 10, anel), lancaMissil (nuvem de gases), rolagem do míssil, sons sintetizados missilRugido/missilImpacto/torpImpacto; torpedo: casco torneado c/ cone de popa, ogiva clara, cinta, 4 aletas, hélice dupla, bolhas ×1,7, impactoTorpedo (coluna d'água + espuma + anel); 300 m/s inalterado
- 21:55 unit 76/76 OK (com itens 2,3,6,7 e 1/4/5)
- 21:58 torpedo: 24/24 acertos a 2,5 km contra alvo manobrando a 3/4, v máx 300 m/s (tests/torpedo1212.mjs); smoke 8×8 6 cenários sem NaN

## 22:25 — finalização
- Cap: 0 programas WebGL novos (111→111). HUD 20:9/16:9 OK com o leque aberto e fechado. Boca do cano MAX 0,34 OK.
- Build vc15 1.2.12 assinado (mesma chave), sha256 246a3b08…01df, 7.332.848 bytes. Copiado para attachments. Relatório completo.
