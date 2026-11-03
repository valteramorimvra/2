# Naval B 1.3.06 — relatório

**Base:** Naval B 1.3.05.

**APK:**
- versionCode 106, versionName 1.3.06.
- Mesma chave (…a599).
- Só a permissão VIBRATE.

**Legenda:**
- **VERIFICADO:** testado (node na simulação real ou navegador).
- **LIDO:** conferido no código.
- **NÃO VERIFICADO:** só no aparelho.

## 1. Destróier Amorim com a tela de armamento do Lençóis Maranhenses

| Item | Onde | Estado |
|---|---|---|
| O botão nuclear do navio é a **DECOLAGEM** (DECOLAR / VOAR / PILOTAR), no mesmo modo de aeronave independente que o jogo já tem (`n.nkAero`). O botão HELI do destróier saiu (`heli: 0`), porque os caças saem pelo DECOLAR. | `src/sim/classesDestroierAmorim.js`, `src/sim/world.js` (`case 'nuclear'`) | VERIFICADO (navegador: "DECOLAR" → "VOAR / PILOTAR") |
| Ao decolar entra a pilotagem do Urubu-rei (`nkEntra`, manual), como no Lençóis. | `src/render/vtolAmorimFx.js` (`quadro`) | VERIFICADO (navegador: `nkPil` = 1, manual) |
| Os caças viraram aeronaves do pool do Urubu-rei. O Acauã é o líder e o Uiraçu é o ala, na esquadrilha do Urubu-rei. O que vem dele: voo `voaManual`, IA, câmera `nkCam`, tela `nkPasso`, fumaça, neblina nas asas (vórtices de ponta de asa da 1.2.98), motor, flares, reparo, ejeção e queda. | `src/sim/vtolAmorim.js` | VERIFICADO: curva ω 0,360 = `manCurvaMax`; inclinação 1,00 = `manBank`; MÁX = vmax do caça |
| Decolagem **vertical** do ponto do heliponto (60,5 / 76,5), seguida da transição para o voo à frente. Pouso **vertical** no próprio ponto, pelo botão BASE ou pela IA. | gancho `q.vtol` em `src/sim/nuclear.js` (1 linha, espelho de `q.rotor`; o Urubu-rei não passa por ele) | VERIFICADO (subida sobre o ponto; os 2 pousaram) |
| Botões adaptados na própria tela: LANÇAR = **NUKE**, AR-AR = **AAM**, MÍSSIL = **ASM**, **TORP**, mais BASE, FLARE, TRAVAR, IA, ESPERA, REPARO e EJETAR do Urubu-rei. Contagem somada dos 2 caças (NUKE 6 · AAM 10 · ASM 8 · TORP 4); em 0 o botão fica esmaecido. Nenhum botão novo. | `vtolAmorimFx.js`, `src/styles.css` (`.modo-vt`) | VERIFICADO (navegador; ASM disparou pela tela, 8 → 7) |
| Intervalos 7 s / 12 s; o ala dispara se o líder estiver em recarga; rearme em 15 s pousado; abatido volta pousado e cheio em 20 s; lasers dorsal e ventral; nuke tático só detona no alvo; canhão no alvo travado. | `vtolAmorim.js` | VERIFICADO (`tests/vtol136.mjs`) |
| Fumaça colorida: a trilha do Urubu-rei adaptada, uma por bocal (Acauã verde/amarela, Uiraçu azul/branca), só a ≥ 75 m/s. | gancho `cb.trilhaVt` em `src/render/nuclearFx.js` (só `q.vtol`) | VERIFICADO (navegador: as 4 cores emitidas e vistas) |
| Pousados no heliponto quando não estão no ar, com os pilones vazios até o rearme. O abatido some até voltar. | `src/modernNavalCombat3D.js` (`vtolPouso`) | LIDO |
| Computador com o Destróier Amorim também decola os caças, sem bomba. | `vtolAmorim.js` | VERIFICADO |
| Urubu-rei do Lençóis decola como antes, com bombas e sem `q.vtol`. | | VERIFICADO; `tests/nuclear1226.mjs` = 4 ok / 5 falhas, igual a antes |
| Retirados os arquivos da 1.3.05 (voo e câmera copiados em separado), substituídos pelo sistema real do Urubu-rei. Os ganchos da 1.3.05 em `aereo.js`, `aereo3d.js` e na câmera de helicóptero foram desfeitos. | | LIDO |

## 2. Outros pedidos

| Item | Onde | Estado |
|---|---|---|
| Botes minúsculos que atiravam (lanchas de ataque rápido do computador) retirados: nenhuma é lançada. | `src/naval5v5/defesa.js` (`limL = 0`) | VERIFICADO: 0 lanchas em 240 s de batalha de frota |
| Teste de combate: Lençóis Maranhenses 40% mais perto (2 km → 1,2 km). | `src/main.js` (`distRival: 1200`) | LIDO |
| Em todos os testes drive (navio, aeronave e teste de combate): sem navios mercantes e sem tráfego civil. | `src/modernNavalCombat3D.js` (`iniciar`) | LIDO |
| Árvore tecnológica: todas as 36 aeronaves embaixo dos navios, numa linha por categoria (caças, helicópteros, hidroaviões, bombardeiros, alerta aéreo e drones). O toque abre a aeronave no hangar. | `src/ui/telasLoja.js`, `src/ui/telas1243.css` | VERIFICADO (navegador: 36 quadros; toque → hangar) |

## 3. NÃO VERIFICADO

- Fps, som e toque no aparelho.
- A câmera segue o último caça da esquadrilha (o ala), que é a regra original do Urubu-rei.

## 1.3.07

- Vida do Destróier Amorim: 5.000. Vida de cada caça (Acauã e Uiraçu): 2.500. Arquivos: `src/sim/classesDestroierAmorim.js` e `src/sim/vtolAmorim.js` (`VIDA_VT`).
- VERIFICADO em `tests/vtol136.mjs`.

## 1.3.08 — sistema ORIGINAL do Urubu-rei nos caças

Pedido do Valter: "sistema original do Urubu-rei em todos os aspectos, sem adaptação em nada, exceto os botões; até a neblina nas asas".

Retirado tudo o que era adaptação:
- Decolagem e pouso verticais.
- Fumaça por bocal.
- Faixa de velocidade própria do caça.
- Lasers e canhão.
- Tempos próprios de rearme (15 s) e de volta do abatido (20 s).

Resultado:
- `src/sim/nuclear.js` não tem nenhuma linha dos caças.
- `src/render/nuclearFx.js`, `src/sim/vooUnificado.js`, `src/render/vorticeAsa.js` e `src/render/fx.js` estão idênticos aos da 1.2.99.

| Item | Estado |
|---|---|
| Decolagem: corrida no convés (catapulta), igual ao Urubu-rei | VERIFICADO (`tests/vtol138.mjs`) |
| Velocidades do Urubu-rei: 165 a 285 m/s | VERIFICADO |
| Curva igual à do Urubu-rei (ω 0,36) | VERIFICADO |
| Regresso e pouso originais (a 400 m do navio) e recarga original de 25 s | VERIFICADO |
| Câmera e fumaça colorida originais (uma cor por posição na esquadrilha) | VERIFICADO (navegador) |
| Neblina nas asas: os vórtices originais da 1.2.98 | LIDO (mesmo código, sem mudança) |
| Botões dos caças: LANÇAR = NUKE · AR-AR = AAM · MÍSSIL = ASM · TORP; munição somada, cheia a cada decolagem; 7 s e 12 s | VERIFICADO |
| Vida: destróier 5.000, cada caça 2.500 | VERIFICADO |
| O Urubu-rei do Lençóis continua igual | VERIFICADO |

## 1.3.09 — formação

Única mudança pedida:
- Depois da formação feita, o Acauã (da frente, abaixo) fica na posição do 1º da fila do Urubu-rei. O Uiraçu fica na posição do ÚLTIMO (74 m atrás e 20 m acima). O meio fica vazio.
- A câmera é a mesma do Urubu-rei: atrás do último, sem a escala de tamanho usada nas outras aeronaves. A velocidade também é a do Urubu-rei.

Linhas alteradas:
- `src/sim/nuclear.js` (`slotFila`: `aero && !L.vtol`).
- `src/modernNavalCombat3D.js` (`nkCam`: `&& !q.vtol`).
- `src/sim/vtolAmorim.js` (`w.ala = 2`).

Estado:
- VERIFICADO na simulação: 20 m acima; a câmera segue o último; velocidade 255/252 m/s.

## 1.3.10

| Item | Onde | Estado |
|---|---|---|
| TRAVAR e IA na tela dos caças. O toque já mandava os mesmos comandos do Urubu-rei, mas o TRAVAR feito no manual desligava o "seguir alvo". Agora o botão IA com alvo travado segue o alvo, e a IA ataca o alvo travado (ASM e NUKE, como o Urubu-rei com a bomba). Depois volta ao navio. | `src/render/vtolAmorimFx.js` (`acaoNk`), `src/sim/vtolAmorim.js` (`ia`) | VERIFICADO (toques no navegador; simulação) |
| Trem de pouso: estava fundido na peça fixa, sempre baixado. Agora pernas e portas são peças móveis, com os pivôs e ângulos do META do Valter. Baixado no convés e na corrida; recolhe para trás em 4 s depois de sair, e as portas fecham; baixa na aproximação do navio. | `tools/vtol/gera.py`, `src/render/vtolDados.js`, `src/render/modeloVtol.js` (`tremVtol`), `vtolAmorimFx.js` | VERIFICADO (fotos do trem baixado e recolhido; em voo: 0 → −90° em 4 s) |
| Todo o armamento disponível: NUKE, AAM, ASM e TORP disparam pelos botões. | | VERIFICADO |
| Armamento dos caças 5× mais resistente à defesa aérea (CIWS, SAM e laser): `resistMissil` do jogo nos ASM e NUKE (fator 0,2). | `vtolAmorim.js` | VERIFICADO (chance de abate pelo CIWS × 0,20) |

## 1.3.11

| Item | Onde | Estado |
|---|---|---|
| Câmera dos caças do destróier = a do Pica-pau: mesma proporção (tamK 0,593) e enquadramento, mesma posição e distância em todo o voo. | `src/render/vtolAmorimFx.js` (`tamPica`); `nkCam` sem o desvio da 1.3.09 | VERIFICADO (navegador) |
| A mesma arma nuclear do Pica-pau: bomba atômica do sistema no LANÇAR (10 a bordo). O computador só leva a bomba com a opção ligada. | `src/sim/vtolAmorim.js` (`arma`) | VERIFICADO (LANÇAR solta: 10 → 9) |
| Todo o armamento ativo: AAM, ASM, TORP, bomba, canhão 25/30 mm e lasers dorsal e ventral (feixes). | `vtolAmorim.js`, `vtolAmorimFx.js` | VERIFICADO |
| Acauã e Uiraçu no hangar e na árvore tecnológica (caças, nível V), com miniatura gerada pelo próprio hangar. | `src/aeronaves.js`, `public/fotos/aero/acaua.jpg` e `uiracu.jpg` | VERIFICADO (árvore e hangar no navegador) |
| Batalha normal com formação militar. Cada time: 1 porta-aviões grande (no fundo da formação, oposto ao do outro time), 1 couraçado, 1 destróier, 1 cruzador e 1 corveta ou fragata. O jogador fica na vaga do seu tipo; o lado vermelho recebe o navio do mesmo tipo com poder mais próximo. | `src/sim/formacaoMil.js` (novo), `src/sim/match.js` | VERIFICADO (5 mapas) |
| Inimigos mais perto no início: 5,2 a 5,6 km entre as frotas (antes ~7–8 km). | `formacaoMil.js` (`aproxima` 0,3) | VERIFICADO |
| Mapas de ilhas: os navios ficam abrigados atrás das ilhas em relação ao inimigo, em ponto sorteado perto da vaga. | `abrigaAtrasDeIlhas` | VERIFICADO (10/10 navios abrigados em 4 mapas) |
| Bots largam em velocidade máxima (os 2 times) para chegar mais cedo ao combate. | `match.js` | VERIFICADO |

Fora da batalha normal nada muda: duelo, treino, teste de combate e batalha personalizada continuam iguais.

## 1.3.12

| Item | Onde | Estado |
|---|---|---|
| Caças do destróier: voo e velocidade do Pica-pau (perfil `jato`: máx. 165 m/s, mín. 0,42×). Armamento, defesas e IA continuam os deles, com a bomba atômica do Pica-pau no LANÇAR. | `src/sim/vtolAmorim.js` (`arma`) | VERIFICADO (`tests/vtol138.mjs`) |
| Hangar: Acauã e Uiraçu individuais, cada um com até 3 aeronaves do mesmo tipo (líder + 2 alas) na formação em V do Pica-pau. A câmera fica no último. Voo e velocidade do Pica-pau; armamento, lasers, canhão e IA deles; botões somando os 3. | `vtolAmorim.js` (`lancaVtolInd`), `src/sim/world.js`, `src/render/vtolAmorimFx.js` | VERIFICADO (simulação: 3 no ar, alas a 34 m atrás ±26 m, câmera no ala 2, ASM pela tela) |
| Hidroaviões retirados de tudo por enquanto, por uma chave (`HIDRO_OFF`, `src/sim/hidroaviao.js`): árvore, hangar, comércio, estaleiro, escolha de veículo e botão HIDRO na batalha. Basta `false` para voltarem. | `hidroaviao.js`, `aeronaves.js`, `telasLoja.js`, `main.js`, `hud.js` | VERIFICADO (navegador: árvore, comércio, hangar e batalha sem hidroavião) |

## 1.3.13 — mísseis entre navios (vídeo de referência do Valter)

| Item | Onde | Estado |
|---|---|---|
| Fumaça: rastro branco-acinzentado ENCORPADO, parado no ar (não acompanha o míssil), que abre em tufos e se desfaz em ~3–4 s. No booster: opacidade 0,30, 2,6 m, vida 4,2 s; no cruzeiro: 0,16, 1,6 m, 3 s. Antes: 0,10/0,07, ~1 m, 16 s. | `src/render/fx.js` (`rastroMissil`) | VERIFICADO (fotos no navegador) |
| Altura: arco baixo, pico ≈ 1,4% da distância (era 7,5%). A 7 km: sobe 47–64 m, arco até ~108 m e rasante perto do alvo (antes ~390 m). | `src/armasParametros.js` (`missil.arco`) | VERIFICADO (simulação) |
| Som: o lançamento do VLS é um rugido de foguete de banda larga (até ~12 kHz), com ataque seco e queda em ~0,9 s (camada nova `missilFoW`). Saíram desse lançamento o "rugido contínuo" e a varredura tonal 180→880 Hz; a amostra `vls_lancamento` continua. | `src/NavalAudio.js`, `src/modernNavalCombat3D.js` | VERIFICADO: pico 1,08 (inimigo) / 1,40 (jogador), contra 1,47 / 1,60 antes; o limitador e o softclip continuam na cadeia. Volume final no aparelho: NÃO VERIFICADO |
