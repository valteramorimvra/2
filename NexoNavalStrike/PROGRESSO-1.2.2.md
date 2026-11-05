# 1.2.2 (versionCode 5, mesma chave, appId igual, sem INTERNET) — progresso
Especificação consolidada (pedido original + correções do pai):
1. Câmera: pinça/scroll suaves até mínimo seguro; colisão com casco/superestrutura (caixas das malhas), ilhas e água; desliza p/ fora/cima sem tremer; near plane; pinça não mexe mira/leme; zoom salvo. Teste: 0 pontos dentro das caixas em zoom mínimo por classe.
2. Dano: míssil padrão 18–25% do HP (mesmo tier), pesado/ouro 30–40%, torpedo 25–35% (abaixo d'água, alagamento provável), canhão por calibre. Nº flutuante grande ≥1,5 s + log. Avarias MOT/LEME/CAN/VLS/RADAR, incêndio, alagamento. Explosão + fumaça preta no ponto. Sem acerto sem dano. Teste: médias nas faixas, 0 acertos <10%. Partida 5–8 min.
3. Detecção: assinatura (furtividade, camuflagem, velocidade, tiros recentes); fontes radar (ilhas bloqueiam), visão (noite/chuva), sonar curto, drone/heli. Não detectado: sem nome/HP/marcador/radar/modelo. Só radar: ponto sem nome. Confirmado: nome+HP (perto ou travado). Perda 10–15 s c/ fantasma "?". Placar "?" até 1º contato. Trava exige detectado. Bots iguais. Radar ATIVO detecta mais e revela. Alerta "detectado" pequeno fora do centro. Teste por classe/condição.
4. Realismo: dispersão melhora c/ navio estável; bots manobram, ilhas, zigue-zague contra torpedo, iscas, evasão a míssil; encontros 8–12 km; alarme/sons a bordo; msgs de topo 1 por vez (resto no log).
5. Dispersão canhão: base menor (3 km ≥60–70% no casco de destróier c/ lead; 8 km ≥30–40%); + curva/velocidade, avaria canhão/radar, mar; − estável >3 s, comandante artilharia, ÓPTICA/binóculo; elipse lateral < alcance, sem viés; anel sutil na mira; couraçado agrupado. PARAM em armasParametros; teste 1000 tiros por calibre/distância. NÃO mexer no tanque.
Manter: AUTO-MIRA regras, pools de estresse. Não matar processos alheios.
Capturas: zoom mínimo 3 classes; início sem inimigos; 1º contato/detectado; fantasma "?"; impacto míssil c/ nº dano; torpedo c/ alagamento (pausar no impacto).
## Feito (sim)
- 2 dano: src/naval5v5/danoReal.js (ref corveta/fragata/cruzador por tier, sem blind), radar como módulo, eventos com dano/apl/pct; unit 'DANO REAL' OK (21,4% / 34,9% / 29,9%)
- 3 detecção (sim): src/sim/deteccao.js + sensores() novo (q 1 ESM/2 radar/3 confirmado, vistos, fantasma 12 s, evento contato/detectado); trava/pontaria/IA exigem q≥2
- 4 encontros: planejaPartida meias 5600.. → 8–11,2 km
- 5 dispersão: PARAM.dispersao az .0055 alc .07 (erro em alcance ∝ d), fatorDisp, mira no meio do costado, torres convergem; unit 'DISPERSÃO' OK
- HUD/render detecção (sessão 2): modelo/esteira ocultos até q≥3, tags anon/fantasma "?" c/ fade, placar "?", nome/HP só perto(<7 km)/travado, alerta "detectado" pequeno à direita, anel de dispersão (.mr-disp), msg topo 1 por vez (resto no log lateral), nº dano mega 1,9 s preso à borda, fumaça preta + tremor + alarme a bordo
- 1 câmera (sessão 3): distCamF/distCamS suave, pinça+scroll, zoomMin 0.3, salvo em ajustes.zoomCam; pinça não arrasta mira (desfaz 1º dedo <350 ms, bloqueia até soltar); colideCamera(): caixas das malhas (caixasNavio), margem 2,5 m, sai pela face de menor penetração (nunca p/ baixo, subir preferido), ilha (+6 m) e água; near dinâmico 0,2–1
- 3 ajustes: PARAM.deteccao visDia 6500/entardecer 4800/noite 2200, radarMul 0.65 (horizonte radar na escala do jogo), esmMul 1.15; todos os navios saem em EMCON (radarAtivo 0), bots ligam radar com contato (capitânia após 60 s); unit 'DETECÇÃO' (2 testes) OK
- 4 IA: evasão (míssil pelo través, torpedo "pentear" + zigue-zague, zigue-zague leve <9 km), cobertura de ilha (vida<55% ou sem VLS), EMCON, não atira com ilha na linha (ai + torre livre), desencalhe de bots; planejaPartida exige caminho por água (BFS, ≤1,3–1,6× meia) → 10 km (santos 8 km); DURACAO frota 480 s → partidas 280–480 s
- 5: alc 0.06, mira a 0,7·borda livre (tiro rasante quicava antes do casco); rótulos de calibre corretos no teste
- testes: simLivre/bateriaDano/lib-dispersao com sim.revelaTudo=1 (armas isoladas); teste de spawns 8–12 km; unit completa 66/66 OK (antes do ajuste 0,7 — rerodar)
- tests/cap122.mjs escrito (teste de câmera + 6 capturas) — ainda não rodado
## Falta
- rodar cap122 (20x9 e 16x9), revisar capturas
- unit completa, e2e120 20x9/16x9, stress121, mira121, audio121
- Como Jogar (EMCON/radar, zoom, anel), versão 1.2.2/vc5, APK, relatório
## Estado
- [x] 1  - [x] 2  - [x] 3  - [x] 4  - [x] 5  - [x] testes  - [x] capturas  - [x] APK/relatório
- sessão 4: match.js EMCON na largada; mínimo seguro da câmera (contorno do casco + 16 m), sobe por cima da superestrutura; HP só confirmado; fantasma legível; Como Jogar; versão 1.2.2/vc5 aplicada; cap122 20x9 OK e capturas revisadas
- sessão 5: browser — cap122 16x9 OK, e2e120 20x9 OK, e2e120 16x9 OK, audio121 OK; stress121 16/17 e mira121 9/10 com 1 falha cada (investigando)
- sessão 5b: cache linhaLivre (LOS) p/ IA e torre livre; mira121 10/10 (medição do erro inicial 250 ms após deslocar), stress121 17/17
- capturas anel 20x9 OK (48 px estável → 124 px guinando)
- unit final 66/66 (após cache LOS); anel 16x9 OK
- sessão 5c: APK /workspace/NexoNavalStrike-1.2.2.apk vc5 1.2.2, cert d0c31791…a599, sem INTERNET, sha256 509c77ed…509b, 7.133.712 bytes; relatório /workspace/NexoNavalStrike-1.2.2-relatorio.md — CONCLUÍDO
