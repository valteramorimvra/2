# Naval B 1.3.03 — relatório de integração

**Base:** Naval B 1.3.02 (`package.json` 1.3.02 → 1.3.03).

**APK:**
- `br.com.valteramorim.nexonaval.b`, versionCode 103, versionName 1.3.03.
- Mesma chave (SHA-256 …a599).
- Uma única permissão pedida ao usuário: VIBRATE. A outra que aparece no APK é interna do Android e não é pedida.

**Legenda:**
- **VERIFICADO:** testado (teste node sobre a simulação real, foto no navegador ou leitura do APK).
- **LIDO:** conferido só lendo o código.
- **NÃO VERIFICADO:** não pôde ser executado aqui (aparelho real, áudio, fps).
- **NÃO IMPLEMENTADO:** ficou fora desta versão (motivo ao lado).

---

## 1. Pedidos diretos do Valter

| Item | Onde | Estado |
|---|---|---|
| Uma salva por disparo, de um slot só. No Amorim, o próximo slot só sai depois que a salva atual saiu toda. | `src/sim/amorim.js:32` | VERIFICADO (`tests/amorim130.mjs`) |
| Ficha do navio com cenário mais claro. | `src/main.js` (fichaNavio, `claro: true`) | VERIFICADO (build) / NÃO VERIFICADO no aparelho |
| Botão **TESTE DE COMBATE** no canto inferior esquerdo da ficha. A árvore abre a mesma ficha, então ele vale na árvore também. | `src/main.js:580-595`, `src/styles.css` | VERIFICADO (build) |
| Teste de combate: só mar ao entardecer e Lençóis Maranhenses a ~2 km. | `src/sim/maps.js:92` (`marAberto`), `src/sim/session.js:11-13` | VERIFICADO: 0 pontos de terra; carrier a 2.000 m |
| Ataque reduzido: poucas aeronaves no ar, repostas por outras. | `src/naval5v5/aereo.js:79` (`maxArTeste`) | VERIFICADO: até 4 no ar, repostas ao cair |
| Urubu-rei liberado com **1** bomba no teste e, depois dela, ataque equilibrado. O Urubu-rei original não foi tocado. | `src/sim/nuclear.js:491,496` (`nkLimiteBot`) | VERIFICADO: decolou 1 vez (46 s) |
| Teste de combate para helicópteros, aeronaves e hidroaviões: botão no hangar; começam no ar a 750 m, formados e em velocidade. | `src/ui/telaHangar.js:28,64`, `src/sim/nuclear.js:249` (`nkArIni`), `src/modernNavalCombat3D.js:1007,1011` | LIDO / NÃO VERIFICADO em voo |
| Teste de combate não credita prata, ouro nem progresso, e volta para a tela de origem. | `src/main.js` (mostraResultado/pausa) | LIDO |
| **Travamento no lançamento nuclear (Nakhimov):** cada míssil criava uma `PointLight` ao aparecer. Isso muda o número de luzes da cena e obriga o three.js a recompilar todos os shaders. Agora há uma luz única, criada no carregamento. | `src/render/missil1231.js:8,25-28` | LIDO (mesmo padrão já usado em `render/fx.js:92`) / NÃO VERIFICADO no aparelho |
| **Som que some:** (1) o vigia do áudio existia mas nunca era chamado; agora roda no laço único. (2) Sair ou reiniciar a partida pausada deixava o áudio suspenso; `encerra()` agora o libera. | `src/modernNavalCombat3D.js:651,270` | LIDO / NÃO VERIFICADO no aparelho |

## 2. Destróier Amorim D-01 (`destroier_amorim`)

| Item | Onde | Estado |
|---|---|---|
| Modelo do OBJ do Valter (71.064 tris), sem mudar forma, cor nem peça. Peças móveis separadas: 3 torres com `pivo` e `cano`/`cano2`, 4 CIWS, 4 autos de 30 mm e 3 radares. Torre 3 e CIWS de ré "desgirados" para o jogo girar pelo azimute. | `tools/destroier/gera.py`, `src/render/destroierAmorimDados.js`, `src/render/modeloDestroierAmorim.js` | VERIFICADO (fotos) |
| Emblema da Marinha (PNG) nos 2 lados do hangar. Bandeiras de popa e proa configuráveis. | `modeloDestroierAmorim.js`, `public/texturas_emblema_marinha.png` | VERIFICADO (foto) |
| Ficha: 176 m, `VIDA(320)`, vmax 17 m/s. | `src/sim/classesDestroierAmorim.js` | VERIFICADO |
| 3×2 155 mm com cadência 5 s (`cad: 5.0`). | | VERIFICADO (as 3 torres atiram) |
| 160 VLS e laterais 6+6 com escolha automática do slot; salva de 6, recarga 6 s. | `src/sim/amorim.js:22-23` (configuração por classe) | VERIFICADO |
| 18 tubos de torpedo; 1 aperto = 9 torpedos, de 9 tubos diferentes; recarga 10 s. O Amorim e a Fragata ficaram iguais. | `src/sim/world.js:441` | VERIFICADO |
| 4 CIWS, 6 lasers (feixe no centro da esfera), 4 autos de 30 mm com linha de tiro contra a estrutura, 4 lança-granadas. | layout | VERIFICADO (estado); lasers e CIWS = sistemas do jogo |
| Ganchos no jogo. | `src/sim/classes.js:24,212,296-297`, `src/sim/layout.js:28`, `src/render/shipModels.js:17,209,540,545` | VERIFICADO |
| Camuflagens bloqueadas (`pinturaFixa`). | | LIDO |
| Ala aérea fixa (sem troca) nas abas de helicóptero. | `src/main.js:172,245` | LIDO |
| Economia: 160.000 de ouro, bônus premium 1,75. | | LIDO |

## 3. Caças Acauã e Uiraçu

| Item | Onde | Estado |
|---|---|---|
| Modelos de jogo do OBJ (7.996 / 7.532 tris). Cores do Valter, vidro fumê, viseira dourada, bandeira nas derivas, luzes emissivas. | `tools/vtol/gera.py`, `src/render/vtolDados.js`, `src/render/modeloVtol.js` | VERIFICADO (foto no heliponto) |
| Pousados nos pontos 60,5 e 76,5, transversais. Somem ao sair para voar e voltam ao pousar. | `src/modernNavalCombat3D.js:713` | VERIFICADO (foto) / LIDO |
| `helisPadrao: ['acaua','uiracu']`, travados. 1 por clique (LIBERAR), decolagem vertical. | `src/sim/classes.js:38-39` | VERIFICADO (teste: Acauã decola pelo botão) |
| Estações de míssil como peças próprias: a disparada some (pilone vazio) e reaparece ao rearmar. | `src/render/aereo3d.js:111,119` | LIDO / NÃO VERIFICADO em voo |
| Munição: Acauã 10 mísseis (6 AAM + 4 ASM), Uiraçu 8 (4 + 4), no sistema de aeronave de navio do jogo. | | VERIFICADO (ficha) |

## 4. NÃO IMPLEMENTADO nesta versão

Motivo comum: são sistemas novos grandes, que mexeriam em código compartilhado.

- **Pilotagem pela câmera e HUD do Urubu-rei** (gancho `q.vtol` em `nuclear.js`). Os caças voam pelo sistema de aeronave de navio que o jogo já tem (botão HELI, mesmo manche dos outros caças). O Urubu-rei original não foi tocado.
- **NUKE** dos caças (3 por caça) e **torpedos** dos caças: o sistema de aeronave de navio tem uma arma principal por aeronave. As estações de nuke e torpedo aparecem no modelo, mas não disparam.
- **Botões de HUD somados dos 2 caças** (AAM 10 · ASM 8 · NUKE 6 · TORP 4) e intervalos 7 s / 12 s por tipo.
- **Fumaça colorida por bocal** (verde/amarela no Acauã, azul/branca no Uiraçu).
- **Laser dorsal e ventral** próprios dos caças.
- **Rearme em 15 s e retorno em 20 s:** valem os tempos de rearme e de reposição do sistema de aeronave de navio do jogo.
- **Luzes piscando** (estrobo e anticolisão): as luzes são emissivas fixas.

## 5. Desempenho

- Nenhuma mudança em qualidade, DPR, teto de fps nem `autoQualidade`.
- Geometrias novas decodificadas uma vez e compartilhadas, sem alocação por quadro.
- O vigia do áudio roda no laço único, limitado a 1 vez por segundo.
- Fps, aquecimento e memória no aparelho: **NÃO VERIFICADOS**.

## 6. Testes

- `node tests/destroier133.mjs`: TUDO OK.
- `node tests/fragata132.mjs`: TUDO OK.
- `node tests/amorim130.mjs`: TUDO OK.
- Teste de combate (cenário, distância, limite de 1 nuclear, aeronaves no ar): VERIFICADO por script node.
