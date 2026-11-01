# PROGRESSO 1.2.0 (versionCode 3)
## Feito
- Código 1.2 completo (sim, render, HUD, telas, economia, comandantes/retratos, helis, VANT, áudio CC0). Build vite OK.
- Correções de QA (17 itens, ver relatório seção 5).
- Unit 39/39 (inclui 13 navios × mapas, partidas completas + economia).
- e2e120 20:9 e 16:9 completos: 0 erros console, 0 sobreposições. Shots em /workspace/nexo-naval-shots/120/ (menus refeitos após ajuste da vitrine).
- package.json 1.2.0; build.gradle versionCode 3 / 1.2.0; cap sync; assembleRelease gerou android/app/build/outputs/apk/release/app-release.apk.
- Relatório rascunho em /workspace/NexoNavalStrike-1.2.0-relatorio.md (placeholders @@SHA@@ @@TAM@@ @@CERT@@ @@NAVIOS@@ @@APKINFO@@ @@SHOTS@@).
## Falta (nada — CONCLUÍDO)
- Verificar APK (aapt badging/permissions, apksigner cert), copiar p/ /workspace/NexoNavalStrike-1.2.0.apk, sha256/tamanho.
- Preencher placeholders do relatório; atualizar /workspace/NexoNavalStrike-progresso.md.
- APK copiado: /workspace/NexoNavalStrike-1.2.0.apk sha256 7331c869…68cdf 7090286 bytes, verificado (v3/1.2.0, target 35, só VIBRATE, cert d0c31791…a599). Falta: preencher relatório.
- Relatório preenchido; progresso geral atualizado. CONCLUÍDO.

## Revisão do Valter (20:12 UTC) — refazer APK v3
- [x] 1 DEV_ECONOMY (feito: 100M/1M, devVersao 2 migra saves antigos, Ajustes→Recarregar saldo (dev); + SAP prata, reembolso proporcional) 100M/1M + botão 'Recarregar saldo (dev)' + migração de saves com devAplicado
- [x] 2 HP numérico (feito: tag com barra+número, painel com número, lista com hp/max): tags inimigas, painel do jogador, lista do placar
- [x] 3 comandantes (feito: ORDEM_TELA, rosto repetido sempre 6 posições depois; c08 usa ret 6): sem rosto repetido lado a lado na mesma linha
- [ ] 4 checklist: 5 designs por país; premium 15–25% + comparação; camuflagens nacionais BR/DE/RU/EUA/UK/CN + ouro com HP; bandeiras estados BR + sinais náuticos; fogo/alagamento antes de afundar; mísseis só falham por terreno/CIWS/SAM/isca; munição prata/ouro com devolução do não usado
- [ ] regressão + shots afetados + APK + relatório

## Revisão item 4 (andamento)
- [x] 14 navios novos (EUA/CHN/RUS/UK = 5 cada; BRA 7), nomeOriginal, linhas na árvore, preços, bots (pf/POOL_PAPEL), layout. unit 39/39 OK.
- [x] Premium +20% (razaoPoder vs REF_PREMIUM, ajustado na carga) — falta UI de comparação
- [x] UI comparação premium (comparaPremium) + nome original no estaleiro
- [x] Pinturas nacionais BRA/DEU/RUS/EUA/UK/CHN (tipo 7 novo) + ouro com hp (m.vida) + Couraça dourada
- [x] Bandeiras: src/render/bandeiras.js (países+DEU, 27 estados simplificados, 26 sinais), aba Bandeira, gala (embandeirado)
- [ ] fogo/alagamento antes de afundar; mísseis/isca térmica; testes novos; e2e; APK; relatório
- [x] crítico <25% → fogo+alagamento (world.dano); isca térmica renomeada; 7 testes novos → unit 46/46 OK
- [ ] e2e (estaleiro bandeira/premium/pintura + hud) + shots; APK; relatório
- [x] (steering) Fenghuang CHN T3 premium 2 helis; premium em T1-T3 e 5 nações; teste razão 1,15–1,25 + bots premium
- [x] (steering) detalhe: mastro de ré treliça, radar2 girando, antenas, SATCOM/ESM, corrimão tijupá; grime/ferrugem ↑; esteira ↑
- [ ] unit, e2e 20x9+16x9 (menus hud resultado), APK, relatório
- [x] (steering visual) cidade.js (skyline instanciado, janelas acendem, holofotes, boias, reflexos), orla no porto e no estaleiro, farol; botão HORA (dia/entardecer/noite) no estaleiro; vigias iluminadas; convés vermelho (conves:'vermelho'); faixa escura linha d'água; pintura Neon Tech (ouro, emissiva, +8% HP); numeral maior
- [x] (steering) helis coaxial + utilitário (6 modelos); armasParametros.js (balística/efeitos parametrizáveis); faixa de serviço com emblema Nexo (enfeite.faixa)
- [ ] unit + e2e (menus hud resultado visual) 20x9/16x9, APK, relatório

## Revisão — couraçado/HUD/consumíveis/movimento (20/10 21h)
FEITO:
- HUD: "PRONTO"/recarga + distância km sob a mira; números de dano laranja grandes; log de impactos à direita ("IMPACTO DE CANHÃO 14.300"); contador DANOS no topo; anel verde de recarga.
- Consumíveis (src/naval5v5/consumiveis.js): kit/controle/bomba/reparoHeli/abastece prata+ouro; aba "Consumíveis" no pré-batalha; débito ao zarpar (paiol→compra), lote intacto volta, parcial reembolso; dev com 99 de cada; botões HUD (.h-cons) com contador/anel/dourado; FX (solda verde ouro, jatos d'água); IA usa (querCons), bots premium ouro 50%; comandante avarias melhora. Testes unitários de débito/devolução/efeito/IA.
- Movimento (PARAM.heli / PARAM.navio em armasParametros.js): heli com inércia, nariz −27°/+12°, 160 km/h, rolagem 38°, deriva ~1,9 s, balanço ±1° 0,5 Hz no pairado, spray <25 m, poeira no convoo, disco de rotor com linhas concêntricas, câmera 18 m nivelada, canhão 12 tiros/s traçante amarelo + faíscas/fumaça no alvo, tremor; míssil de asa sai reto e guia; flare (3 cargas) reduz SAM/CIWS; CIWS vs heli traçante vermelho + faíscas; DETECTADO sob o radar; HP número (×250) e km/h ao lado do retículo; trava com nome/distância/HP; setas de altitude 15–120 m. Navio: banda 3–8° conforme o tamanho.
FALTA: unit completo, e2e 20:9/16:9, APK, relatório.
- 21:50 revisão final entregue (ver relatório). Falta: foguetes ASW do couraçado.

## Revisão visual 2 (20/10, 22:50) — estado
- [x] Neon como LIBRÉ (camuflagem.js t8/neon(): faixa, chevrons, padrão técnico; emissão só nos filetes, zerada em faces horizontais).
- [x] Corrimãos/antenas: LineSegments claros → tubos escuros InstancedMesh (fim do contorno tipo wireframe, dia e noite).
- [x] Estaleiro: enquadramento automático (~60% da largura livre, câmera 3/4, cidade no alto); detalhe extra: convés antiderrapante texturizado, número de casco maior, bulbo, halos de luzes de navegação/convés.
- [x] Pesquisa de modelos: Pinshape Burke CC0 (exige login → não usado), Kenney Watercraft/Quaternius Ships CC0 (barcos casuais/piratas, não modernos), poly.pizza "low poly battleship" CC-BY (blocos, inferior ao procedural) → mantido o procedural.
- [x] Cidade: prédios 3D com janelas por shader (mundo), arranha-céus com coroa e luz vermelha, serra escura, cais com luzes, guindastes, reflexos dourados alongados.
- [x] Noite na partida: halos de navegação (BB vermelha, BE verde, mastro branca) + 2 PointLights de convés no navio do jogador.
- [x] LF-12 Martelo (RBU) no Trovão: comando `rbu`, 6 salvas × 12 foguetes, parábola ~56°, explosão subaquática 35 m; botão FOGUETES; IA usa; teste unitário.
- [x] HP das camuflagens: comuns 3–5%, nac_* 6–8%, ouro 10–12%; card "+X% HP"; teste unitário com HP real na sessão.
- [x] Unit 57/57; e2e 20x9 OK (0 erros). 
- [x] e2e 16x9 + menus/visual nos dois formatos; APK sha ff848569…91b2 (7.121.026 bytes); relatório atualizado.
- [x] (23:10) Steering v04/v07: ângulos 3/4 de lado (ang≈1.15), mar azul-escuro com reflexo de cor só na faixa do sol (filtro de normal anti-xadrez, espuma leve), luz do entardecer neutra + key/rim no estaleiro, vista do porto mais próxima. Rodando e2e menus+visual 20x9/16x9.

# 1.2.1 (versionCode 4) — iniciado 20/10 23:50
- [ ] 1 som  - [ ] 2 câmera/escala  - [ ] 3 sensação de velocidade  - [ ] 4 torres giram  - [ ] 5 CIWS/SAM poluição  - [ ] 6 leme

### 1.2.1 — item 1 (som) FEITO
- Causa: o boot destravava no pointerdown (não conta como gesto em toque no WebView) e music.play() rejeitado nunca era refeito. Reprodução com o dist do APK 1.2.0 (Chrome com política exigindo gesto + toque real): música 'pausada'.
- Correção: destrave em pointerup/touchend/click/keydown até ctx 'running', buffer mudo, resume em visibilitychange/focus/appStateChange, fallback HTMLAudio, fetch→XHR, decode callback/promise, reset único de volSom≈0 (volSomRevisto no PADRAO).
- tests/audio121.mjs: 9/9 (31 .ogg decodificados, 29/29 no jogo, running após 1 toque, música tocando, background/volta, botão Testar som). cdp.mjs abre() aceita {autoplay}.

### 1.2.1 — estado (atualizado)
- [x] 1 som (audio121 9/9)
- [x] 2 câmera perto: 3/4 de popa (offAz 0,6) + enquadramento em malha fechada pela largura real do modelo (meta 40%), FOV horizontal ≤ 80°, nunca sobre o convés; escala mínima 34 px p/ inimigos distantes
- [x] 3 velocidade: espuma/onda de proa ∝ nós, esteira 64 seg., borrifo 2×, caturro leve, FOV +4° / aceleração; m/s×1,944 = nós (teste)
- [x] 4 torres: PARAM.torre (40/25/20/15 °/s), só alinhadas, HUD GIRANDO + ponto; CIWS setor cego
- [x] 5 CIWS: 1 em 5 traçantes, curtos/finos, nunca a <70 m da lente nem no cone da mira, ≤1,2 km, log lateral agregado (×N), efDefesa
- [x] 6 governo: PARAM.navio rRef/kR/lemeTaxa/tGiro; contratorpedeiro 30 nós 180° em 30,4 s; piloto automático pelo radar; bússola desejado×real
- [x] 7 trava automática (sim travaAuto, bots iguais), espoleta varrida 15 m, torpedo filoguiado + detonação sob o casco; 100/100 + 100/100
- [x] 8 estresse: POOL.misseis 64, preaquecimento, cache de cor, degradação, pool de vozes 12, tabelas balísticas no carregamento, helis pré-criados
- [x] 9 AUTO-MIRA só do jogador (padrão off, salva, migração 1×), cone pequeno; radar não escolhe alvo; VLS livre com cone ±4°; AUTO-FOGO só com mira sobre o alvo
- [x] capturas finais, e2e 20:9/16:9 + unit 62/62, versão 1.2.1 (versionCode 4), APK /workspace/NexoNavalStrike-1.2.1.apk (sha256 93e1f020…09bb), relatório
