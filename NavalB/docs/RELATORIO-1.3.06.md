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

## 1.3.14 — curva dos mísseis (vídeo de referência)

| Item | Onde | Estado |
|---|---|---|
| A curva do míssil de VLS dos navios agora é redonda e contínua. Antes ele quase parava no alto (18 m/s) e virava em 0,2 s, formando uma quina. Agora: freada só até 45 m/s, curva a ~75 m/s com virada de até ~2 rad/s, e entrada no cruzeiro só com a curva completa. Resultado: subida vertical até ~47 m, curva entre 0,6 e 1,5 s (de 55 a ~100 m) e depois o arco baixo. Mísseis de aeronave e lançadores laterais não mudam. | `src/sim/world.js` (fases EJEÇÃO e PITCH) | VERIFICADO (trajetória na simulação; 8/8 acertos de 4,5 a 12 km) |

## 1.3.15 — câmera FW (vídeo de referência)

| Item | Onde | Estado |
|---|---|---|
| Nova câmera "CÂMERA FW" no menu de câmeras (botão FW). Fica atrás do navio a ~0,72×L + 22 m e pouco acima do convés (F + 0,075×L + 7 m), olha para a frente pela mira com o horizonte perto do meio da tela, acompanha o balanço do navio e gira com o arraste. Nenhuma outra câmera muda. | `src/modernNavalCombat3D.js` (`camModo` `fw`), `src/ui/hud.js` (botão) | VERIFICADO (navegador: menu, seleção e foto comparada ao vídeo) |

## 1.3.16

| Item | Onde | Estado |
|---|---|---|
| CÂMERA FW um pouco mais afastada (×1,2 na distância e na altura, mesmo ângulo) e câmera padrão (instalações novas e, uma vez, quem atualiza; depois vale a escolha do jogador, que fica salva). | `src/modernNavalCombat3D.js`, `src/save.js` (`migra1316`) | VERIFICADO (navegador: entra na batalha em FW) |
| Vozes da batalha, avisos de voz e dicas do tutorial desligados por padrão (uma vez para quem atualiza); continuam nos Ajustes. | `src/save.js` | VERIFICADO |
| Quadro do perfil (retrato/nome/vida/módulos) fora da batalha; botão ATIVO/PASSIVO do radar no lugar dele. | `src/ui/hud1316.css` | VERIFICADO (762×355 e 915×427) |
| MIRA LIVRE e ACÚSTICO embaixo de AUTO-MIRA e AUTO-FOGO, grade 2×2 com colunas iguais e 22 px entre todos (áreas de toque de 48 dp sem se cobrir). | `src/ui/hud1316.css` | VERIFICADO |
| NUCLEAR acima do TRAVAR, na mesma coluna (em telas baixas um pouco mais baixo, com o rótulo ao lado, para não tocar o placar nem o TRAVAR). | `src/ui/hud1316.css` | VERIFICADO |
| Óptica (binóculo): zoom inicial ≈13× → ≈15×; máximo 20× → 25× (trilho 2×–25×). | `src/modernNavalCombat3D.js`, `src/ui/hud.js` | VERIFICADO |
| Aeródromo militar retirado das batalhas por enquanto (chave `AERODROMO_OFF` em `src/sim/match.js`; `false` traz de volta). | `src/sim/match.js` | VERIFICADO (0 aeródromos; megabases continuam) |

## 1.3.17

| Item | Onde | Estado |
|---|---|---|
| Times mais perto na batalha normal (aproximação 0,3 → 0,4): ~4,2–5,5 km entre os centros das frotas (antes ~5,2–5,6). Abrigo atrás das ilhas mantido (6–10 de 10 navios abrigados nos mapas de ilhas; no Estreito não há ilha entre as frotas). | `src/sim/formacaoMil.js` | VERIFICADO (8 mapas, 2 sementes) |
| Bots largam JÁ a toda força rumo ao oponente (sem os ~10 s de aceleração). Para não encalharem na largada: abrigo só com a ilha a ≥ 650 m + 2·L à proa e ≥ 1,1·L (mín. 260 m) da costa; navio que nasce colado à costa vai para a água livre mais próxima e quem nasce apontado para terra gira para o rumo livre mais próximo. | `src/sim/match.js`, `src/sim/formacaoMil.js` (`afastaDaCosta`) | VERIFICADO: 0 navios presos nos primeiros 40 s em 12 mapas × 2 sementes (antes até 7 encalhes, alguns de 35–45 s) |
| Trava da mira: o centro da mira acompanha o navio travado desde o INÍCIO da trava (antes só com a trava a 100%, até lá só o quadro andava), também na óptica. Com AUTO-MIRA ligada o TRAVAR não trava (mensagem; botão mostra AUTO). | `src/modernNavalCombat3D.js` (`autoMiraPasso`, ação `travar`), `src/ui/hud.js` | VERIFICADO (navegador: erro da mira 0–2° com o alvo em movimento, câmera FW e óptica) |
| Aeronaves: com a bolinha do toque marcada, TRAVAR pega o navio inimigo mais próximo da bolinha. As outras funções da tela não mudam. | `src/modernNavalCombat3D.js` (`nkAcao`) | VERIFICADO (navegador: travou o navio a 144 m da bolinha) |
| Torpedos das aeronaves: na pilotagem, o LANÇAR (sem bomba a bordo) dispara o torpedo no alvo travado até 3,5 km, com aviso de distância/recarga; o ARMA dos helicópteros lançados do navio também (até 3,5 km). O disparo automático continua igual. | `src/sim/nuclear.js` (`nkTorp`), `src/naval5v5/aereo.js`, `src/net/commands.js`, `src/sim/world.js` | VERIFICADO (simulação: ASW, Coaxial e Inhambu — longe avisa, a 3 km lança e acerta) |
| COMBATE do hangar: (1) a partida acabava no 1º instante ("Frota aliada destruída", a base de onde a aeronave sai não contava); (2) o comando "começar no ar" não estava na lista de comandos aceitos e era descartado; (3) o alerta de SAM inimigo caía no código de "bateu no relevo" e tirava você da pilotagem 3 s depois. Os três corrigidos. | `src/sim/match.js`, `src/net/commands.js`, `src/modernNavalCombat3D.js` | VERIFICADO (navegador: começa a 750 m, pilotando, combate em andamento) |

Testes: `vtol138`, `destroier133`, `amorim130`, `fragata132`, `voo1278` OK. `esquadrilha1269` tem as mesmas falhas de antes desta versão (conferido sem as mudanças).

## 1.3.18

| Item | Onde | Estado |
|---|---|---|
| AUTO-MIRA, MIRA LIVRE, AUTO-FOGO e ACÚSTICO/RETO numa coluna só (onde já estavam AUTO-MIRA e AUTO-FOGO), um embaixo do outro, mesma largura e 10 px entre eles; área de toque de cada um até a metade do espaço (uma não cobre a outra). | `src/ui/hud1316.css` | VERIFICADO (navegador 762×355 e 915×427) |

## 1.3.19 — trava num ponto do navio

| Item | Onde | Estado |
|---|---|---|
| TRAVAR guarda o PONTO do navio sob a mira (proa/popa/lado/altura, em coordenadas do casco — gira com ele). Sem casco sob a mira: a pontaria padrão de antes (centro do casco). Botão verde com a trava acionada; 1º toque trava no ponto (mesmo com o alvo já adquirido pela mira automática), 2º toque solta. | `src/modernNavalCombat3D.js` (ação `travar`), `src/sim/world.js` (`travaPt`, `ptTrava`), `src/net/commands.js`, `src/ui/hud.js`, `src/ui/hud1316.css` | VERIFICADO |
| Canhões: solução balística com arrasto no ponto travado, com a velocidade DO PONTO (translação + guinada) e a altura dele. Granadas e foguetes: mesmo ponto com o avanço. | `src/sim/world.js` (`_pont1`, `pontoRbu`) | VERIFICADO (simulação, alvo a 4 km andando: impactos medianos a 39% (proa), −37% (popa), 1% (centro) e na ponte alta) |
| Mira, quadro e óptica ficam no ponto travado (centro da tela na altura dele). | `autoMiraPasso`, quadro do alvo | VERIFICADO (navegador) |
| Cruzes: vermelha meio apagada = ponto travado (com o avanço); cinza = para onde os canhões apontam agora (erro real de giro e elevação das torres), anda até a vermelha; alinhadas → a vermelha fica VERDE. Na óptica a cinza fica dentro do círculo, do lado de onde vem. | `src/modernNavalCombat3D.js`, `src/ui/hud1316.css` | VERIFICADO (navegador: cinza 30° → 0° e cruz verde; também na óptica) |

Sem ponto marcado nada muda: `acerto125` dá o mesmo resultado de antes (90% mísseis / 97% torpedos, PASSOU). `vtol138`, `destroier133`, `amorim130`, `fragata132` OK.

## 1.3.20 — conferência do sistema de mira (canhões, granadas e foguetes)

Medições com a dispersão zerada (só o cálculo), cada torre isolada, alvo parado e em movimento, o próprio navio parado e em movimento, 2,5 a 8 km, pontos na proa/centro/popa:

| Item | Resultado | Estado |
|---|---|---|
| Solução balística dos canhões (arrasto, avanço do ponto, velocidade do próprio navio, elevação por cano com a altura real da boca) | 0,1–0,4 m (1 torre) e 1,6–1,9 m (torres de 2–3 canos: é o afastamento entre canos paralelos) em destróier, capitânia, Baluarte (4 torres) e Marcos Vinícius (6 torres) | CORRETO — sem mudança |
| ERRO: a salva saía com a torre ainda girando (tolerância 0,02 rad = 1,1°) | 1º tiro errava 35–115 m a 3–6 km | CORRIGIDO: só dispara com a torre assentada (0,8 mrad no giro / 0,6 mrad na elevação, `ALINHA` em `src/naval5v5/armas.js`) → 0,4–6 m. O toque rápido continua disparando na direção atual do cano (escolha do jogador) |
| ERRO: granadas/foguetes com o alvo em movimento caíam À FRENTE (o avanço era somado duas vezes: na pontaria e de novo na correção em voo) | +7 m (3 km, 10 m/s), +19 m (4 km, 12 m/s) | CORRIGIDO: a correção em voo recalcula onde o ponto travado estará na chegada (tempo que falta do arco) e a pontaria usa o tempo de voo real do arco → 0,0–0,4 m ao longo do alvo; no casco batem no costado do lado de quem atira, como deve ser |
| Cada torre e cada montagem de granadas/foguetes é independente (giro, elevação, recarga, obstrução) | conferido no código e nos testes | CORRETO |
| Mira: um símbolo por canhão disponível (número da torre) mostrando para onde ELE aponta agora; vem até o ponto; verde por torre assentada; centro verde só com TODAS as disponíveis assentadas. "Disponível" = dentro do setor e com a boca livre NA DIREÇÃO DO ALVO (`obstrAlvo`, novo) | navegador: 3 torres da capitânia chegando em tempos diferentes; centro verde só com as 3 | VERIFICADO |

Testes: `acerto125` PASSOU, `canhao1212` 0 falhas, `disp1215` OK, `vtol138`, `destroier133`, `amorim130`, `fragata132`, `voo1278` OK.
