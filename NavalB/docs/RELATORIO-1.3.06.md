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

## 1.3.21 — tiro em arco para todos, radar e relevo

| Item | Onde | Estado |
|---|---|---|
| 16 navios não faziam tiro em arco (reparos de 280–508 mm limitados a 45°; o arco pede > 46°): Trovão, Volkhar, Baluarte, Colosso, Antônia, Rodolfo, Marcos, Kelly, Laiane, Klévton, Ananery, Trajano, Leidevaldo, Ronaldo, Tamandaré, Barroso. Reparos remodelados para 65°. | `src/armasParametros.js` (`elevMax`) | VERIFICADO (Baluarte: arco 57° com carga reduzida por cima de montanha de 163 m a 4,1 km) |
| Radar LIGADO denuncia a posição a todos os inimigos no alcance do ESM, mesmo atrás do relevo (contato travável). Radar desligado atrás do relevo: nenhum navio vê (só aeronaves por cima, como já era). Mar aberto: visão por distância, tamanho, furtividade, camuflagem e hora, como já era. | `src/sim/world.js` (`sensores`) | VERIFICADO |
| Canhões, granadas e foguetes podem travar/adquirir alvo DETECTADO atrás do relevo (tiro em arco); sem detecção a trava é negada. | `world.js` (`arcoOk`, `travar`, `travaAuto`) | VERIFICADO |
| Granadas/foguetes: altura do arco calculada pelo relevo no caminho (passam por cima do morro perto do alvo ou do navio); a correção em voo só segue alvo detectado/travado; a IA só lança em alvo detectado (antes lançava no inimigo mais próximo mesmo sem vê-lo). | `world.js` (`lancaRbu`, `pontoRbu`, `passoRbu`) | VERIFICADO (radar ligado: 24/24 no alvo, 0 no morro; radar desligado: sem perseguição) |
| Óptica com alvo travado acompanha o alvo (desde a 1.3.17/1.3.19). | `autoMiraPasso` | VERIFICADO |

Testes: `acerto125` PASSOU, `canhao1212` 0 falhas, `disp1215`, `vtol138`, `destroier133`, `amorim130`, `fragata132` OK.

## 1.3.22

| Item | Onde | Estado |
|---|---|---|
| Ficha do navio, campo do canhão principal: "Elevação máxima do canhão" (por modelo/calibre: 76 mm 85°, 152 mm 60°, 406–508 mm 65° etc.) e "Tiro em arco (por cima do relevo)". | `src/fichaTecnica.js` | VERIFICADO |
| Atrás de uma cobertura (relevo), o inimigo só é visto/travado com o radar DELE e o SEU ligados. Qualquer um desligado → trava negada, a cobertura protege. | `src/sim/world.js` (`sensores`) | VERIFICADO (Baluarte × alvo atrás de montanha de 163 m: só os dois ligados → trava e tiro em arco) |

Testes: `acerto125` PASSOU, `canhao1212` 0 falhas, `vtol138`, `destroier133`, `amorim130`, `fragata132` OK.

## 1.3.23

| Item | Onde | Estado |
|---|---|---|
| CÂMERA FW mais perto: fator 1,2 → 1,1 da distância/altura originais (mesmo ângulo; a de antes da 1.3.16 era 1,0). | `src/modernNavalCombat3D.js` (`kFw`) | VERIFICADO (build) |

## 1.3.24 — projétil cai no ponto do mapa; manual atualizado

| Item | Onde | Estado |
|---|---|---|
| Granadas e foguetes deixam de ser semiguiados (lança-granadas/foguetes reais não são guiados): saem com o avanço calculado no lançamento e caem naquele ponto; o alvo que manobra a tempo escapa. Canhão já era balístico puro. | `src/armasParametros.js` (`rbuArco.guia` 0), `src/sim/world.js` | VERIFICADO (alvo reto: 8/8; alvo que para após o lançamento: 0/8) |
| Quem estiver no ponto de queda é atingido mesmo sem ser detectado (colisão física, sem depender de radar/visão). | `acertaNavio` | VERIFICADO (tiro às cegas em arco por cima de montanha em navio não detectado: acertos com MIRA LIVRE e mira manual) |
| ERRO corrigido: a mira MANUAL (sem trava) media a distância a partir da boca da torre 1 e não do centro do navio (como a tela mede) → o tiro caía até ~100 m fora do ponto mirado em navios longos. | `world.js` (`_pont1`) | VERIFICADO (sem dispersão: 0/60 → 24/24 acertos no ponto) |
| Manual do jogo (1.3.24): detecção/radar/cobertura, AUTO-MIRA × TRAVAR, trava num ponto, cruzes e símbolos por canhão, assentamento da torre, projétil sem correção de rumo, tiro em arco e elevação por calibre (tabela), granadas/foguetes não guiados, câmera FW, botões e ajustes padrão, aeronaves (bolinha, torpedo, COMBATE). | `src/ui/manualDados1231.js`, `src/ui/manualConteudo1231.js`, `src/ui/fontes1231.js` | VERIFICADO (navegador: seções de Armas; textos no build) |

Testes: `acerto125` PASSOU, `canhao1212` 0 falhas, `disp1215`, `vtol138`, `destroier133`, `amorim130`, `fragata132` OK.

## 1.3.25 — aeronaves no modo manual

| Item | Onde | Estado |
|---|---|---|
| Trava automática no MANUAL: navio inimigo mais perto do centro da tela (detectado pela frota ou a ≤ 6 km do avião), troca com histerese quando outro fica bem mais no centro; bolinha marcada e TRAVAR manual têm prioridade (4 s). Mensagem de trava silenciosa na troca automática. | `src/modernNavalCombat3D.js` (`nkAutoAlvo`) | VERIFICADO (navegador) |
| Câmera do MANUAL gira para o alvo travado quando você solta a tela (2,2 s), por trás do avião; alvo atrás (> 120°) → câmera volta para trás do avião, como antes. | `nkCam` | VERIFICADO (navegador: câmera −34° → −3° do alvo, avião a 37°) |
| Altura mínima do voo manual 150 m (piso firme, ajuda só nos últimos 40 m; antes empurrava para cima já abaixo de 320 m e o piso real era ~96 m). | `src/sim/nuclear.js` (`manAltMin`, `voaManual`) | VERIFICADO (mergulho total: mínimo 159 m) |
| Batida no relevo: explosão (antes a aeronave só sumia), aviso e volta à câmera do navio; recarga como aeronave abatida. | `nuclear.js`, `modernNavalCombat3D.js` (`nkTerreno`) | VERIFICADO (montanha de 628 m: bateu a 377 m) |
| Modo IA sem mudança. Manual do jogo atualizado. | `manualDados1231.js` | VERIFICADO |

## 1.3.26 — nada atira através do relevo

| Item | Onde | Estado |
|---|---|---|
| CIWS, 30 mm, laser e SAM só escolhem alvos com visada livre do relevo (linha 3D da montagem/mastro ao alvo). | `src/naval5v5/defesa.js` (`visT`) | VERIFICADO (heli inimigo a 1,1 km atrás de morro de 134 m: 0 quadros de fogo; em mar aberto: CIWS e laser atiram) |
| Canhões secundários e canhões automáticos do Amorim não atiram em alvo atrás do relevo. | `secundarias.js`, `amorim.js` | VERIFICADO (código + testes) |
| Aeronaves: canhão/metralhadora/foguetes/bazuca/torpedo/mísseis (sistema da pilotagem e IA), metralhadora de porta, AR-AR, helicópteros do sistema antigo, caças Acauã/Uiraçu (mísseis, torpedo, canhão, lasers) — só com visada livre; mensagem "alvo atrás do relevo". | `nuclear.js` (`visNk`), `defesa.js` (`lancaArAr`), `aereo.js`, `vtolAmorim.js`, `modernNavalCombat3D.js` | VERIFICADO (ASW e Beija-flor atrás de morro de 224 m: 0 disparos; com visada: disparam) |
| Própria estrutura: já respeitada (máscaras de linha de tiro do CIWS/30 mm/laser/secundárias e arcos das torres). | `linhaTiro.js` | sem mudança |
| Manual atualizado (Armas › Defesa). | `manualDados1231.js` | VERIFICADO |

## 1.3.27 — canhões automáticos na parte exposta

| Item | Onde | Estado |
|---|---|---|
| Visibilidade por partes do alvo (10 pontos: 7 no casco de proa a popa, 3 na superestrutura), da boca da arma, com linha 3D contra o relevo; recalculada a cada 0,3 s. Parcial → mira no meio da parte exposta; total → centro como antes; nenhuma → não atira. Todos os navios (secundárias) e os automáticos do Amorim. | `src/sim/world.js` (`partesVisiveis`), `secundarias.js`, `amorim.js` | VERIFICADO (alvo com 4/10 pontos visíveis: 92 acertos na parte exposta, 0 tiros no morro; exposto: centro) |
| Defesa (CIWS/30 mm/laser/SAM) e secundárias valem para todos os navios (código comum). | `defesa.js`, `secundarias.js` | — |
| Manual atualizado. | `manualDados1231.js` | VERIFICADO |

## 1.3.28

| Item | Onde | Estado |
|---|---|---|
| CÂMERA FW: fator 1,1 → 1,15 (a 1.3.16 era 1,2), mesmo ângulo. | `modernNavalCombat3D.js` (`kFw`) | VERIFICADO (build) |
| Saída da ÓPTICA: a câmera volta ao ponto que estava na óptica (marcação corrigida direto; inclinação em malha fechada com a sensibilidade medida da câmera atual). Com alvo travado e "trava segue", a trava leva a câmera ao ponto/alvo travado. Arrastar cancela. Antes a saída forçava a inclinação mínima e a mira caía perto do navio. | `voltaPontoBino` | VERIFICADO (navegador, câmera FW: ponto a 8,5 km → 8,36 km na mesma marcação; ponto a 1,88 km → 1,885 km) |
| Manual atualizado (Controles › Câmeras). | `manualDados1231.js` | VERIFICADO |

## 1.3.29

| Item | Onde | Estado |
|---|---|---|
| MANUAL: trava automática no navio dentro do cone de 40° em volta do eixo do nariz (3D: rumo e arfagem); fora do cone a trava solta (exceto TRAVAR apertado há < 4 s); câmera só gira para o alvo dentro do cone. | `modernNavalCombat3D.js` (`nkAutoAlvo`, `nkCam`), `nuclear.js` (`nkTrava` `liv`), `commands.js` | VERIFICADO (navegador: 23° e 17° travam; 63° solta) |
| IA: bomba no ponto marcado ao passar; se não passar exato, lança na menor distância da passagem até 500 m (`NUK.lancaTol`). | `nuclear.js` | VERIFICADO (ponto a 34° do rumo: caiu a 118 m) |
| IA contra navio: salva de todas as armas (todos os mísseis + 1 bomba + arma do heli) e volta ao navio; sem conseguir em 2 min, volta. Na volta: AR-AR em aeronave próxima e míssil/arma em navio ao alcance com visada; flares como antes. Bombas restantes voltam ao paiol. Caças Acauã/Uiraçu seguem o sistema próprio. | `nuclear.js` (`defendeRtb`) | VERIFICADO (caça: 4 mísseis, 1 bomba, volta e pousa) |
| Navios: câmera da auto-mira com velocidade máxima de giro (0,55 rad/s escolhendo, 0,9 com trava; menor na óptica). | `autoMiraPasso` | VERIFICADO (trava segue com erro ~1°) |
| A volta da óptica só move a câmera (marcação/inclinação); a física dos tiros não muda. | — | — |
| Manual atualizado. | `manualDados1231.js` | VERIFICADO |

## 1.3.30 — salva de armas da IA

| Item | Onde | Estado |
|---|---|---|
| Salva = UMA vez cada arma disponível contra o navio-alvo (1 lançamento/onda de mísseis, 1 bomba, 1 torpedo ou rajada da arma do heli, bazuca) e volta ao navio; sem conseguir em 2 min, volta. Na volta não insiste no mesmo alvo: luta só com outros inimigos que encontrar. Restante volta ao paiol. | `src/sim/nuclear.js` (`q.sv`, `alvoSalva`) | VERIFICADO (caça: 1 onda de 2 mísseis + 1 bomba → volta e pousa; Coaxial: 1 torpedo → volta; Beija-flor: 1 onda → volta e pousa) |
| ERRO antigo corrigido: o míssil próprio dos helicópteros (ex.: Beija-flor) nunca disparava no sistema da pilotagem; agora entra como míssil da aeronave (IA e botão MÍSSIL). | `nuclear.js` (lançamento) | VERIFICADO |
| Câmera do MANUAL: só gira para um alvo dentro do cone de 40° (1.3.29); fora disso fica atrás do avião, como sempre. | — | — |
| Manual atualizado. | `manualDados1231.js` | VERIFICADO |

## 1.3.31 — saída da óptica

| Item | Onde | Estado |
|---|---|---|
| Causa 1: o arraste feito DENTRO da óptica deixava o "toque manual" ativo por 1,5 s e cancelava a volta ao sair. Agora só um arraste depois de sair cancela. | `modernNavalCombat3D.js` (`voltaPontoBino`, `_nArr`) | VERIFICADO |
| Causa 2: a opção "câmera volta para trás do navio" girava a câmera externa de volta. Agora fica suspensa depois da óptica até o próximo arraste. A volta corre até chegar exatamente ao ponto (máx. 4 s). | `voltaPontoBino`, `_camFixa` | VERIFICADO (navegador, arraste logo antes de sair: FW 1.880 → 1.875 m; EXTERNA 1.881 → 1.879 m, mesma marcação, e fica no ponto) |
| Só a câmera se move; a física dos tiros não muda. Manual atualizado. | — | — |

## 1.3.32

| Item | Onde | Estado |
|---|---|---|
| Cone de trava das aeronaves no MANUAL: 40° → 60° (câmera gira para o alvo só dentro dele). | `nkAutoAlvo`, `nkCam` | VERIFICADO (navegador: 52° e 29° travam; 72° não) |
| Volta da óptica em TODAS as câmeras: giro e inclinação corrigidos pela sensibilidade medida da câmera (secante, com sentido e passo crescente onde o ponto quase não responde). Com alvo travado (inclusive o pego pela trava automática dentro da óptica) volta ao ponto travado com avanço. | `voltaPontoBino` | VERIFICADO (ponto a 1,88 km — externa 1.872, FW 1.871, convés 1.886, canhão 1.882, ampla 1.876, popa 1.880, 3/4 alta 1.875, popa alta 1.877, costado 1.875 m; mesma marcação) |
| Cinema e câmeras de míssil/foguete/projétil/torpedo seguem o próprio objeto (fora da volta). Manual atualizado. | — | — |

## 1.3.33

| Item | Onde | Estado |
|---|---|---|
| Aviões no MANUAL como nos vídeos do Valter: a câmera é o manche (giro da tela vira o avião; olhar para baixo mergulha, para cima sobe; joystick tem prioridade). Câmera mais perto (×0,58), avião maior na tela. Helicóptero e IA sem mudança. | `nkPasso`, `nkCam` | VERIFICADO (navegador: rumo 60° → 2° em ~4 s; mergulho até −29° com a câmera para baixo) |
| Sem cone: trava automática no navio inimigo no centro da tela; sem navio na tela, solta. | `nkAutoAlvo` | VERIFICADO (código e navegador) |
| Óptica com alvo travado acompanha o ponto travado real do navio (não o avanço). | `autoMiraPasso` | VERIFICADO (navegador: alvo andando −86° → −83°, erro da mira < 1°) |
| Saída da óptica suave (sem tremer): a câmera desliza até o ponto; inclinação achada por intervalo, medida só com a câmera assentada (vale nas câmeras de órbita com trechos planos), altura na tela pelo espaço da câmera (sem depender do plano de corte). | `voltaPontoBino` | VERIFICADO (ponto a 1,88 km — perto 1.894, FW 1.880, convés 1.894, canhão 1.881, ampla 1.880, popa 1.876, 3/4 alta 1.876, costado 1.879 m; popa alta 4.779 → 4.779 m; mesma marcação) |
| Manual atualizado (1.3.33). | `manualDados1231.js` | — |

## 1.3.34

| Item | Onde | Estado |
|---|---|---|
| Marcação de voo do MANUAL como nos vídeos: escada de inclinação (gira com o horizonte), ALT/VEL com régua, mira central com munição, moldura de cantos + losango no alvo com distância, estado PRONTO / CARREGANDO / FORA DO ALCANCE. Etiqueta do próprio avião sai do centro (vida no quadro da direita). | `nkMwPasso`, `hud.js`, `hud1334.css`, `marcasAereas` | VERIFICADO (capturas 857×400: reto, curva e mergulho; alvo a 1,3 km → PRONTO verde) |
| Tamanho e ângulos: no MANUAL a distância vem do tamanho real do modelo (≈0,72× — avião ≈ metade da largura), câmera acima mirando logo acima do avião (avião embaixo, fixo na tela), tela rola 45% da inclinação lateral (suave). IA e helicóptero sem mudança. | `nkCam` | VERIFICADO (avião em NDC y ≈ −0,6 a −0,7 em todas as capturas; horizonte na tela = 25° com rolagem 0,45 rad do avião; a escada gira igual) |

## 1.3.35

| Item | Onde | Estado |
|---|---|---|
| Tela rola 100% junto com o avião no MANUAL, sem atraso (o avião não parece girar no próprio eixo). | `nkCam` | VERIFICADO (rolagem da tela = rotação do modelo em todas as amostras) |
| Caça mais ágil no MANUAL: manche 5/s, rolagem até 1,8 rad/s (~100°/s), curva instantânea até 0,47 rad/s (~27°/s), arfagem 1,5×; ganho do comando pela câmera 3,5. Urubu-rei e IA sem mudança. | `voaManual`, `nkPasso` | VERIFICADO (curva medida 26,8°/s) |
| Alvo localizado no MANUAL → câmera-comando aponta para o alvo e o avião vai na direção exata (desce até ele, piso 150 m). Arraste ou manche devolvem o comando. | `nkCam` | VERIFICADO (desvio de 90° → erro de rumo 31° → 0,5° em ~4 s de jogo) |

## 1.3.36

| Item | Onde | Estado |
|---|---|---|
| Câmera do MANUAL presa ao avião desenhado (quaternion do modelo, mesmo quadro, sem atraso): atrás e acima no referencial do avião; arraste continua sendo o comando de direção. `cam.up` volta ao normal fora do avião. Distância 0,82× o tamanho do modelo (≈ +18%). Escada usa a inclinação/elevação reais da câmera. | `nkCam`, `atualizaCamera`, `nkMwPasso` | VERIFICADO (avião no mesmo ponto da tela — NDC 0,00/−0,66 — em voo reto, curva e mergulho) |

## 1.3.37

| Item | Onde | Estado |
|---|---|---|
| Acesso de combate estilo Modern Warships em todas as aeronaves (sistema do Urubu-rei mantido): botões em hexágono (contorno verde-água/verde pronto/vermelho alerta, anel de recarga fino), arco de armas em volta do LANÇAR, BASE/TRAVAR/IA no alto, FLARE/EJETAR embaixo no centro. Mesmas ações (data-a) de antes. | `hud1334.css` | VERIFICADO (857×400: nenhum botão sobreposto; antes BASE e EJETAR se cobriam) |

## 1.3.38

| Item | Onde | Estado |
|---|---|---|
| Aeronaves dos navios (sistema do convoo): comando pela câmera com o manche solto (avião: curva + mergulho; helicóptero: só curva), amortecido pela taxa de curva; sem retorno automático da câmera. | `laco` (heliCtrl), `atualizaCamera` | VERIFICADO (jato do Kordão: erro de rumo 69° → 2° sem passar; helicóptero do destróier: 59° → 22° e fechando) |
| Trava automática no navio do centro da tela (TRAVAR manual tem prioridade 4 s; troca de alvo só após 1,5 s de jogo, nos dois sistemas) e ida direta ao alvo. | `heliAutoAlvo`, `nkAutoAlvo` | VERIFICADO (alvo estável, sem alternar entre dois navios próximos) |
| Câmera presa ao avião do navio (depois do quadro do modelo, sem atraso), marcação de voo dos vídeos, etiqueta própria fora do centro. | `camAeroPresa`, `aeroPasso`, `marcasAereas` | VERIFICADO (captura: avião embaixo, escada, ALT/VEL, moldura no alvo a 3,7 km) |
| IA do navio do jogador (enquanto ele voa) apoia o alvo travado pela aeronave em vez de trocar a trava compartilhada. | `ai.js` | VERIFICADO (antes a trava alternava 1↔3 a cada 0,3 s) |
| Helicóptero do sistema do Urubu-rei: câmera comanda a curva, vai direto ao alvo, marcação de voo. Urubu-rei/caças: sem regressão (alvo a 5 km travado e no centro, erro 0,1°). | `nkPasso`, `nkCam` | VERIFICADO |

## 1.3.39

| Item | Onde | Estado |
|---|---|---|
| Controle profissional (modo Ace Combat) para aviões pilotados (Urubu-rei, caças e aviões dos navios): atitude em quaternion; manche lateral = rolagem (caça 3,2 rad/s, bombardeiro 1,1), manche para baixo = puxa (n até 7,5 g caça / 3 g bombardeiro; disponível ∝ v², estol natural); sustentação no eixo do avião + gravidade (curva = inclinar e puxar; de lado desce; de dorso mergulha); arrasto induzido; energia real (gravidade inteira, empuxo pela posição do acelerador); piso 150 m e teto preservados. | `sim/voaAce.js`, `voaManual`, `voaAsa` | VERIFICADO (rolagem 0→43° sem mudar o rumo; puxando a 71°: 25°/s a 7,5 g, perda 166→157 m/s; dorso + puxar = mergulho; subida a 70° no mínimo: 107→52 m/s com aviso ESTOL a 57 m/s) |
| Desenho com a atitude exata (slerp entre passos), câmera presa já existente acompanha; escada de voo com rolagem completa (dorso). | `nuclearFx`, `aereo3d`, `nkMwPasso` | VERIFICADO (modelo = inclinação simulada; asas firmes na tela) |
| Botão ARCADE/ACE (salvo nos ajustes; ARCADE padrão = comportamento anterior); no ACE não há comando pela câmera nem ida automática ao alvo; botão some no helicóptero e hidroavião. | `aceTroca`, `aceSync`, `hud.js`, `hud1334.css`, comando `aceModo` | VERIFICADO |

## 1.3.40

| Item | Onde | Estado |
|---|---|---|
| Voo, controles e câmeras de TODA a aviação iguais aos da 1.2.99 (commit 1e95e67): `voaManual` e `vooUnificado.js` da 1.2.99; `nkCam`, câmera e manche das aeronaves de navio da 1.2.99; saem o modo ACE (`voaAce.js`, comando `aceModo`, botão), câmera presa, comando pela tela, trava automática no centro, ida automática ao alvo, marcação de voo e botões em hexágono (`hud1334.css`); piso/assistência de altitude da 1.2.99 (manAltMin 160). | `nuclear.js`, `vooUnificado.js`, `modernNavalCombat3D.js`, `hud.js`, render | VERIFICADO (funções comparadas com a 1.2.99: iguais, exceto os 3 itens abaixo; navegador: manche inclina até 25° e o avião nivela sozinho ao soltar, câmera sem rolar, sem erros) |
| Mantidos de propósito (correções de defeito pedidas depois da 1.2.99): faixa do acelerador de cada aeronave (1.3.02), câmera que não entra no convés/hangar na decolagem (1.3.01), batida no relevo = abatida com recarga (1.3.25). IA, armas, informações do painel e apoio do navio ao alvo da aeronave não mudam. | — | — |

## 1.3.41

| Item | Onde | Estado |
|---|---|---|
| Câmera FW um pouco mais perto: kFw 1,15 → 1,12 (distância e altura na mesma proporção = mesmo ângulo). | `atualizaCamera` (fw) | Alterado (valor) |
| Trava do jogador (TRAVAR/ponto) não é trocada pela mira passando sobre outro navio nem solta ao olhar para o lado; só o 2º toque ou alvo inválido soltam. | `world.travaAuto` | VERIFICADO (olhando 69° ao lado por 5 s de jogo: trava mantida; 2º toque soltou) |
| AUTO-MIRA desligada: a câmera não é puxada para o alvo travado (fora da óptica). | `autoMiraPasso` | VERIFICADO (câmera ficou a −21,2° onde o jogador deixou) |

## 1.3.42

| Item | Onde | Estado |
|---|---|---|
| Pilotagem pela tela (MANUAL) em todas as aeronaves, a partir das versões testadas 1.3.35/1.3.38, adaptada aos vídeos de 04/11: câmera de perseguição sem rolar, distância 0,8× o tamanho do modelo, câmera 0,26×dist acima (avião embaixo e no meio); avião de navio com o mesmo enquadramento; helicóptero: tela comanda só a curva. Caça ágil e piso de 150 m (como 1.3.35). IA sem mudança. | `nkCam`, `nkPasso`, `atualizaCamera` (heli), `voaManual` | VERIFICADO (Urubu-rei: rumo −36° → 0°, avião em NDC (0; −0,73), horizonte sem rolar; caça do Kordão: −69° → −2°) |
| Busca por alvo + mira inteligente: trava o inimigo mais perto da mira (TRAVAR manda 4 s; troca só após 1,5 s), pequeno ponto verde que sai da mira e vai ao ponto de interceptação (alvo + velocidade × tempo de voo ~650 m/s); com tela/manche soltos o avião segue esse ponto. | `nkAutoAlvo`, `heliAutoAlvo`, `nkLead`, `nkMwPasso` | VERIFICADO (captura: moldura no alvo a 4,5 km, PRONTO ao lado da mira) |
| Marcação: mira central verde, A APONTAR (amarelo) / PRONTO / RECARREGAMENTO / FORA DO ALCANCE + distância à esquerda da mira, escada, ALT/VEL; botões redondos da 1.2.99 mantidos. | `hud1334.css`, `hud.js` | VERIFICADO |

## 1.3.43

| Item | Onde | Estado |
|---|---|---|
| Medições nos vídeos de 04/11 (2 quadros/s, recortes ampliados) e na imagem marcada: ponto verde no CENTRO da tela; retículo ⌖ fixo em 60%/62%; envergadura ≈ 61% da largura; estado da arma preso ao ponto (−85; +55 px em 480 de altura); escada/ALT/VEL (±14,6% da largura) em volta do ponto quando PRONTO. | — | — |
| PONTO VERDE: com alvo escolhido e tela/manche soltos, desliza do centro até o ponto de interceptação (4,5/s); a câmera segue (3/s) e o avião segue a câmera (curva e mergulho até o alvo). | `pontoVerde`, `nkCam`, câmera do avião de navio | VERIFICADO (Urubu-rei: −31° → 0°, A APONTAR → PRONTO; caça do Kordão: −68° → −2°) |
| Câmera ao longo do comando, 0,3×dist acima (centro visual do avião 16,7° abaixo do eixo), distância 0,72× o tamanho do modelo. Moldura do navio só quando PRONTO. | `nkCam`, `nkMwPasso`, `hud1334.css` | VERIFICADO (captura) |

## 1.3.44

| Item | Onde | Estado |
|---|---|---|
| MANUAL (vídeo 120403): arrastar = câmera em volta da aeronave (igual ao modo IA, volta para trás em 2,2 s), não muda a direção; câmera EXATAMENTE a do modo IA. Manche dirige. | `nkCam`, câmera do avião de navio | VERIFICADO (tela a −114°, avião visto de lado, rumo independente) |
| Busca por proximidade (centro da tela a ≤ 9% da largura do navio, ≤ 14 km), ALVO MARCADO + bipe, ponto verde fixo no navio, cruz de busca no centro; com alvo marcado e manche solto a aeronave vai exatamente ao navio (independe da câmera). Troca só levando a cruz a outro navio (1,5 s). | `buscaProx`, `nkAutoAlvo`, `heliAutoAlvo`, `nkPasso`, `nkMwPasso` | VERIFICADO (Urubu-rei: sem alvo segue reto; olhando o navio → trava; olhando 70° ao lado → −64° → −8°; caça do Kordão −62° → −1,6°) |
| Câmeras dos navios: canhão/convés só sobem ao sair do casco (antes trocavam de face e saltavam); enquadramento com trava nas câmeras de órbita entra/sai suave (antes degrau de até ~11 m); auto-mira com histerese entre navios próximos. | `colideCamera`, `atualizaCamera`, `autoMiraPasso` | VERIFICADO (9 câmeras × auto/livre/trava: sem inversões relevantes; saltos de posição ≤ 1,4 m por quadro) |

## 1.3.45

| Item | Onde | Estado |
|---|---|---|
| Escala real: removido o aumento visual de navios distantes (até 2,4×, v1.2.1) — tamanho na tela = distância real; velocidades conferidas (destróier 37 nós, fragata 35 nós). | render dos navios | VERIFICADO (escala 1,00 em todos; antes Fragata 151 m desenhada com 366 m) |
| Radar e mapa tático: silhuetas de navio/aeronave no rumo, linha de 1 min, rastro; aeronaves no radar; radar centrado na aeronave pilotada. | `hud.desenhaRadar`, `mapaTatico`, `hudQuadro` | VERIFICADO (captura) |
| TRAVAR troca direto para o navio sob a mira (manual, AUTO-MIRA e óptica). | `acao('travar')` | VERIFICADO (3 modos: alvo 1 → 3, câmera no novo alvo) |
| Modos MM/MMD (botão), câmera na distância do modo IA (FILA.cam, atrás do próprio avião). | `nkCam`, `nkPasso`, câmera do avião de navio, `pontoVerde` | VERIFICADO (MM: sem alvo não segue a tela; MMD: segue a tela; ambos vão ao alvo marcado; câmera 31,1 m manual × 31,7 m IA) |
| Teste em todas as categorias de aeronave: caça do sistema do Urubu-rei (Raio), avião de navio (Kordão), helicóptero de navio (destróier). Bombardeiro usa o mesmo código do caça (só a agilidade muda). | — | VERIFICADO (−64°→−10°, −62°→−2,3°, −52°→−1,2°) |
| EJETAR com posição própria (não cobre o BASE). | `hud1334.css` | VERIFICADO (nenhum botão sobreposto) |

## 1.3.46

| Item | Onde | Estado |
|---|---|---|
| Porta-aviões com aeronave pilotável: escolha (Urubu-rei ou aeronave do hangar) no estaleiro (aba das aeronaves) e na preparação; vai na partida como `aeroPil` → `n.nkAero`; botão DECOLAR; entra pilotando. | `main.js` (`aeroPaHtml`, `aplicaAeroPA`), `world.js`, `modernNavalCombat3D.js` | VERIFICADO (Lençóis com caça VTOL: decolou o caça, botão DECOLAR, pilotando) |
| Teste drive: ESQUADRILHA = liberação como nas batalhas (sem o comando de outras aeronaves). | `acao('heli')` | Alterado (mesmo código das batalhas) |
| EJETAR retirado da tela de pilotagem. | `hud.js` | VERIFICADO (botão ausente) |
| MMD (ponto verde dirige) segue como opção no botão MM/MMD. | — | — |

## 1.3.47

| Item | Onde | Estado |
|---|---|---|
| Câmera de todos os modos = a do modo IA (mesmo código: segue o mesmo avião da esquadrilha, mesma distância). | `nkCam` | VERIFICADO (mesma fórmula; a distância medida varia só com a esquadrilha formada ou não) |
| MMD = manual da 1.3.43: avião segue a câmera; navio mais perto do centro é marcado; ponto verde se move até o ponto de interceptação; câmera vai atrás. | `nkAutoAlvo`/`buscaCentro`, `pontoVerde`, `nkPasso`, `nkMwPasso` | VERIFICADO (avião seguiu a câmera −21°→−46° e foi ao navio) |
| MM: ponto verde com a tela; perto do navio marca e dirige; afastar o ponto (arrastando) solta. Sem a cruz. | `nkAutoAlvo`/`longeDoCentro`, `heliAutoAlvo` | VERIFICADO (marcou ao olhar o navio, avião virou; arrastou 70° ao lado → alvo solto) |

## 1.3.48

| Item | Onde | Estado |
|---|---|---|
| Botão TRAVAR retirado da tela das aeronaves (o ponto verde marca sozinho no MM/MMD). Acessos ao botão protegidos (`_cls`/`_q` checam se existe). | `hud.js` | VERIFICADO (botão ausente, sem erros) |

## 1.3.49

| Item | Onde | Estado |
|---|---|---|
| Formação igual à do modo IA em todos os modos: com o líder pilotado, os alas têm mais giro (2–3 rad/s), velocidade de alcance (+120/+200 m/s) e assentam suave no lugar perto dele. IA sem mudança. | `passoAla` | VERIFICADO (curva de 24°/s mantida: alas a 44/44/89/89 m — os lugares da formação — durante a curva e na reversão) |

## 1.3.50 — voo manual = voo da IA

Pedido: "em todos os modos a mesma suavidade e velocidade do modo IA; o que muda é o modo".

- `nuclear.js` `voaManual`: o manual (avião e helicóptero) agora chama o mesmo `voaPara` da IA. O manche dá só o rumo (lado) e a subida/descida (frente/trás). O ponto verde (MM) ou a câmera (MMD) mandam o rumo (`nkCtl.ru`) e a altitude (`al`). A velocidade é a de cruzeiro da IA, o piso continua em 150 m e bater no relevo continua derrubando a aeronave.
- `hidroaviao.js` `voaManualH`: usa o `voaAuto` da IA do mesmo jeito.
- `aereo.js` `voaJog`: as aeronaves dos navios pilotadas usam o `voa()` da IA. A velocidade é `vmax·0,85`, como no ataque da IA. O comando é `heliCtrl.ru/al`.
- Cliente: o MM/MMD mandam o rumo exato (alvo ou câmera) em vez dos ganhos do manche.
- O acelerador saiu da tela, porque deixou de ter efeito.

## 1.3.51 — ponto verde arrastável, armas no modo IA e trajetos no mapa tático (inclui a 1.3.50)

- O ponto verde virou móvel: `pvPasso`, `pvArrasta`, `pvNaTela` e `longeDoPonto` em `modernNavalCombat3D.js`. Toque perto do ponto (raio de 20% da altura da tela) e arraste; no resto da tela, arrastar continua girando a câmera.
  - MM: o ponto fica onde for solto. `buscaProx` procura em volta dele; travado, ele desliza até o navio e a aeronave vai exatamente para lá. Arrastado para mais de 0,22 de distância, a trava solta.
  - MMD: o ponto é uma direção no mundo e a aeronave vai para ele (rumo e altitude via `nkCtl.ru/al` e `heliCtrl.ru/al`). `buscaCentro` só trava navios a até 0,35 do ponto. A câmera é a do modo IA (a câmera de comando do MMD foi retirada). Perdido o alvo, o ponto volta para a frente.
  - Testes no Playwright: Raio em MM (ponto arrastado até o navio → trava; erro de rumo caiu de 19° para 1°) e Raio em MMD (ponto arrastado à direita → a aeronave virou de 42° para 88° e o ponto voltou para a frente).
- Armas no modo IA: sem o TRAVAR (retirado na 1.3.48), MÍSSIL e TORPEDO pediam "Trave um alvo". Agora `nkAlvoAuto` marca sozinho o melhor navio à frente (até 22 km). A bomba em preparo mostra o tempo restante (antes o LANÇAR era ignorado em silêncio). No helicóptero de foguetes/tiro, o LANÇAR marca o alvo (antes dizia "paiol vazio"). Na aeronave do navio, o torpedo marca sozinho o alvo à frente.
- Mapa tático: `amostra()` guarda o trajeto de cada unidade a cada 2 s, mesmo com o mapa fechado (até 300 pontos). Navios aparecem em linha cheia e aeronaves em linha tracejada, com cores próprias, e há legenda.

## 1.3.52 — radar: posição, movimento e direções

- `dirRadar()` (cliente) devolve o rumo real, a direção da tela/câmera e o rumo desejado de quem você controla. Navio: piloto de rumo, ou a guinada do leme projetada. Aeronave: `ctlRu` (ponto verde) ou o manche; no modo IA, o alvo.
- Minirradar (proa para cima): a linha ciano da tela agora aparece também pilotando aeronaves, e há uma linha âmbar tracejada para o rumo desejado, com um triângulo vazado na borda.
- Mapa tático: `ref()` e o anel de "você" passam a valer para o Urubu-rei/caça pilotado (antes só para o helicóptero do navio). Saem de você três raios: rumo, tela e desejado.
- Verificado em screenshot:
  - navio com rumo −90°, tela −159° e desejado −21°;
  - Raio em MMD com rumo −43°, tela −45° e desejado 3°.

## 1.3.53 — ponto verde respondendo ao toque

Valter relatou que, no celular, o ponto verde do MM e do MMD não dirigia a aeronave nem travava os alvos.

- Causa 1: na 1.3.51 era preciso tocar exatamente perto do ponto para arrastá-lo; tocando em outro lugar, só a câmera girava.
- Correção 1: agora o 1º dedo em qualquer área livre move o ponto pelo deslocamento do dedo (`pvMove`, ganho 1,25), e um 2º dedo gira a câmera.
- Causa 2: um toque curto no mar marcava a mira de solo (`miraSolo`), e `nkAutoAlvo` saía cedo sempre que ela existia; com isso a trava do ponto ficava bloqueada.
- Correção 2: `nkAutoAlvo` deixou de verificar a `miraSolo`.
- Testes com toque real (CDP `Input.dispatchTouchEvent`, celular emulado):
  - Raio em MM: o dedo começou longe do ponto e o arrastou até o navio; a trava aconteceu e o erro de rumo caiu de 18° para 1°.
  - Também testados: Raio em MMD, helicóptero do destróier em MM e MMD, Kordão em MM e Tufão em MMD.
- Correções adicionais encontradas nos testes:
  - A IA do navio refazia a trava enquanto você pilotava (`ai.js` 'travar' e `world.travaAuto`), puxando o ponto verde de volta. Com `controle >= 0`, a trava agora é só a do ponto verde.
  - No MMD, a direção do ponto vinha de `unproject` com a matriz da câmera de outro quadro; o ponto fugia para a borda e a aeronave não ia aonde ele apontava. Agora o ponto guarda um RUMO (`pv.hd`), calculado pelo yaw da câmera, e a aeronave vira até ele.
- Testes com toque real, todos passaram:
  - Raio em MMD: travou, a aeronave foi ao alvo (erro de 24° para 1°), soltou e virou para o novo rumo.
  - Raio em MM: travou (erro de 18° para 2°) e soltou.
  - Helicóptero do destróier em MM e em MMD: travou, soltou e, no MMD, dirigiu a aeronave.

## 1.3.54 — MM único no estilo Modern Warships, TRAVAR de volta e mapa tático maior

- `mmd()` agora devolve sempre false, ou seja, há um só modo manual. O botão MM/MMD virou **TRAVAR** (`nkTrava`, classe `nk-trv`): acende quando há trava e a cruz fica verde.
- A tela gira a câmera livremente; o arraste do ponto saiu.
- `mwBusca`: procura o navio inimigo mais perto do centro da tela (raio de 0,2 NDC, até 14 km, com histerese) e dá um bipe a cada troca. `mwPonto`: o ponto encaixa no navio, mostra a cruz cinza (`nk-busca`) e desenha a linha `mw-linha` da aeronave até o ponto.
- O ponto não trava mais sozinho (o `nkAutoAlvo`/`heliAutoAlvo` não é mais chamado). TRAVAR trava o navio do ponto; no mesmo navio, solta.
- Com o alvo travado, o rumo vai para o alvo (`nkCtl.ru`/`heliCtrl.ru`) e a câmera vira para ele quando a tela não é tocada há 1,2 s. Sem trava, a aeronave mantém o rumo; o helicóptero do navio não vira mais o nariz sozinho para o contato mais próximo (`aereo.js`).
- No MM, MÍSSIL e TORPEDO sem trava usam o navio do ponto, sem trava automática.
- Mapa tático: virou um retângulo que ocupa toda a área livre. A escala preenche o maior lado e o mapa acompanha você no outro.
- Testes com toque emulado:
  - Raio: ao girar a tela, o ponto encaixou com a cruz e o rumo não mudou (63°); ao tocar TRAVAR, o botão acendeu e o erro de rumo caiu de 47° para 16°, com a câmera indo ao alvo.
  - Helicóptero do destróier: o rumo ficou em −50° até a trava; depois o erro caiu de 42° para 4°.

## 1.3.55 — trajetos só do jogador

- No mapa tático, `amostra()` agora grava só o seu navio (`u.n === eu`) e as aeronaves que têm você como dono (`dono === eu.id`): o Urubu-rei e os caças com os seus alas, e as aeronaves do seu navio.
- No minirradar, o rastro também ficou só para `eu`/`minha`; navios e aeronaves bots, inimigos ou aliados, não deixam mais risco.
- A linha de rumo (onde a unidade estará em 1 min) continua para todos.

## 1.3.56 — mapa tático remodelado, rotas, MMD e ponto no nariz

### Mapa tático
- Mostra o mapa inteiro num quadrado do tamanho da altura livre.
- Fica girado para que a base do seu time fique embaixo: `orienta()` usa `T.plano`, e o ângulo é arredondado para múltiplos de 90° quando está perto.
- Os navios inimigos aparecem em quadros (`mt-card`) com distância, vida, velocidade, rumo e avarias.
- A legenda ficou dentro da largura do mapa.

### Rotas (novo `sim/rotas.js`)
- Comando `rota` (u: n/q/h; p = [x,z,…]; alvo; alt) e comandos `rotaPausa`/`rotaRetoma`. O `valida` agora aceita listas de números.
- Navio:
  - Rota é recusada se algum trecho tiver altura de terreno acima de −7 m (`segBloqueado` a cada 60 m). A validação roda no cliente e na simulação.
  - `ai.js` segue os pontos com o telégrafo do jogador; a IA de tiro continua atirando nos inimigos do caminho.
  - Leme firme ou toque de rumo pausam a rota; o telégrafo não pausa.
  - Ao retomar, se o caminho até o próximo ponto cruzar terra, um caminho por água é calculado em grade de 150 m e simplificado.
- Aeronave pilotável (Urubu-rei/caça líder e aeronaves do navio):
  - Voa até cada ponto com a IA de voo (que desvia do relevo), na altura escolhida.
  - No fim, o alvo vai para o ataque normal da IA.
  - Mexer no manche ou entrar no manual pausa a rota; o botão IA retoma. Os botões mostram ROTA ou PAUSADA.
- Ao assumir uma aeronave que está em rota, a rota continua.

### Aeronaves
- O ponto verde procura o navio mais perto da direção do nariz (até 14 km e 12°) e fica 3 km à frente do nariz quando não há navio.
- Travado, o rumo vai para o alvo e a altitude desce para 220 m (helicóptero: 120 m; helicóptero do navio: 60 m). Se passar do alvo, a aeronave faz a volta.
- TRAVAR com trava ativa só destrava.
- MMD voltou: sem trava, a aeronave segue o yaw da câmera. Botão MM/MMD acima do TRAVAR.

### Partidas
- Sem mercantes (`match.mercantes = false`) e sem tráfego civil (`trafegoOn === true` só se pedido).
- Trajetos só do navio e das aeronaves pilotáveis; os alas da esquadrilha ficam fora.

### Testes
- Partida: 0 mercantes e tráfego desligado.
- Mapa: você embaixo com rotação de 90° e 6 quadros de inimigos.
- Rota do navio aceita e seguida (ponto 1/2).
- Rota do Raio:
  - pontos 0 → 1 → fim, descendo de 742 m para 384 m;
  - manche → PAUSADA; IA → ROTA; no fim o ataque ficou LIGADO.
- MMD: o rumo foi de −38° a 4° em direção ao giro de 16°.
- Ponto no nariz encaixou; ao travar, a aeronave desceu de 691 m para 625 m com rumo no alvo; TRAVAR de novo destravou.

## 1.3.57 — dano por origem e ponto verde afastado

- Novo `sim/origem.js`. Cada projétil de aeronave sai marcado com `org = { pil, nome, arma, tick }`. Marcações:
  - mísseis, torpedos e foguetes dos helicópteros do navio (via `regAereoDispara`, que também cobre a metralhadora);
  - Urubu-rei e caças: míssil, porta, torpedo, bazuca, metralhadora e bomba;
  - hidroavião;
  - Acauã/Uiraçu.
- `pil` vale 1 quando a aeronave era a sua no manual. Projéteis reaproveitados do pool perdem a marca (`orgValida`).
- `world.dano` soma em `dono.stats.fontes[navio|pil|bot]`, por arma e por modelo, só o dano em inimigo.
- O resultado mostra o bloco "Dano por origem"; o histórico guarda `fontes` e o dano por arma e mostra o mesmo quadro.
- Teste: partida com Raio no manual e dano acelerado em 60 s de simulação.
  - Pilotada: Raio, 264 de mísseis.
  - IA: Beija-flor 1716 + Raio (alas) 1726.
  - Total 3706, igual ao dano causado. A tela de resultado mostrou o quadro.
- O ponto verde fica 6 km à frente do nariz, com distância mínima de 22% da altura da tela até a aeronave. Com a aeronave na metade de cima, o ponto vai para baixo dela.
- ESPERA com alvo travado passa para a IA, que faz o ataque.
- A mini-nuclear dos caças Acauã/Uiraçu ainda conta como dano do navio.

## 1.3.58 — MMD sobe/desce, ponto verde estilo MW sem linha, mínimo 120 m

- MMD: sem trava, a altitude pedida é `y + clamp(−(pitch−0,15)·1,6) · 1400 m` (helicóptero do navio: 300 m).
  - Teste: olhando para cima, subiu de 746 m para 1248 m seguindo o giro da tela.
- Ponto verde (`mwBusca`/`mwPonto`):
  - A base fica abaixo do centro da tela e afastada da aeronave; se ela está no alto, a base vai para baixo.
  - Escolhe o navio inimigo mais perto da base na tela (raio de 0,28, com histerese); girar a tela troca o alvo, com bipe.
  - A linha da aeronave até o ponto saiu.
- Trava: o rumo vai ao alvo e a altitude desce para 140 m (helicóptero: 120 m). A aeronave volta ao alvo até destravar.
  - Teste: com a tela no navio o ponto encaixou; TRAVAR deu alvo 1 e altitude pedida de 140 m, com a aeronave virando para o alvo; destravando, ficou livre.
- `NUK.manAltMin` passou para 120 m; avião do navio no manual com mínimo de 120 m.
