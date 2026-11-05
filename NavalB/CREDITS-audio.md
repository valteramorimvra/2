# Créditos de áudio — Nexo Naval Strike 3D

Todas as gravações abaixo são **CC0 1.0 (domínio público)**: uso comercial, modificação e redistribuição em app
permitidos, sem exigência de atribuição (creditamos por cortesia). Licença verificada na página de cada som em 20/10/2026.
Para os sons do Freesound foi usada a versão de pré-visualização HQ (mesma gravação, mesma licença), recortada,
normalizada e recodificada em OGG Vorbis mono pelo projeto.

| Arquivo no app | Uso | Origem (URL) | Autor | Licença |
|---|---|---|---|---|
| canhao_grande.ogg | canhão 127 mm | https://freesound.org/people/qubodup/sounds/187767/ (Cannon Shot) | qubodup | CC0 |
| canhao_medio.ogg | canhão 76 mm | https://freesound.org/people/qubodup/sounds/182822/ (Artillery Shots) | qubodup | CC0 |
| canhao_rapido.ogg | canhão 57 mm / rajada | https://freesound.org/people/qubodup/sounds/854186/ (Autocannon Three Shot Burst) | qubodup | CC0 |
| canhao_longe.ogg | disparo distante (eco) | https://freesound.org/people/craigsmith/sounds/486030/ (155mm Howitzer Fires) | craigsmith | CC0 |
| ciws.ogg | rajada do CIWS | https://freesound.org/people/qubodup/sounds/163119/ (Navy MK 15 CIWS Fast Burst, gravação do governo dos EUA) | qubodup | CC0 |
| vls_lancamento.ogg | lançamento VLS (silvo + foguete) | https://freesound.org/people/qubodup/sounds/182794/ (Rocket Launch) | qubodup | CC0 |
| explosao_perto.ogg | impacto próximo | https://freesound.org/people/derplayer/sounds/587180/ (explosion_near) | derplayer | CC0 |
| explosao_media.ogg | impacto no casco | https://freesound.org/people/qubodup/sounds/182429/ (Explosion) | qubodup | CC0 |
| explosao_grande.ogg | navio destruído | https://freesound.org/people/Hugofski/sounds/177556/ (massive explosion) | Hugofski | CC0 |
| explosao_longe.ogg | explosão distante | https://freesound.org/people/Kostrava/sounds/324277/ (distant explosion) | Kostrava | CC0 |
| respingo_grande.ogg | gêiser de granada na água | https://freesound.org/people/qubodup/sounds/442773/ (Big Water Splash) | qubodup | CC0 |
| respingo.ogg | respingo / entrada do torpedo | https://freesound.org/people/Bird_man/sounds/316744/ (Big Splash) | Bird_man | CC0 |
| impacto_metal.ogg | ricochete / estilhaço no casco | https://freesound.org/people/Johnnyfarmer/sounds/209772/ (Metal Boom) | Johnnyfarmer | CC0 |
| torpedo_corrida.ogg | torpedo correndo (loop) | https://freesound.org/people/craigsmith/sounds/675798/ (Torpedo traveling underwater) | craigsmith | CC0 |
| alarme_trava.ogg | alarme de trava de míssil | https://freesound.org/people/Alxy/sounds/189327/ (missile lock on sound) | Alxy | CC0 |
| motor_diesel_loop.ogg | propulsão diesel (loop, tom segue os nós) | https://freesound.org/people/AugustSandberg/sounds/264864/ (Marine diesel engine) | AugustSandberg | CC0 |
| turbina_loop.ogg | praça de máquinas / turbina (loop) | https://freesound.org/people/mrmayo/sounds/74914/ (ferry engine room1) | mrmayo | CC0 |
| musica_batalha.ogg | música de batalha | https://opengameart.org/content/determined-pursuit-epic-orchestra-loop | Emma_MA | CC0 |
| musica_menu.ogg | música do menu | https://opengameart.org/content/the-final-battle | skrjablin | CC0 |

Sons **sintetizados** no aparelho (Web Audio API, sem arquivo): servo do canhão, apito/bipe de proximidade, cliques
da interface, camada de assobio da turbina a gás, rádio, camada de "crack" no disparo, chuva/vento; e versões sintéticas
de TODOS os sons acima, usadas como reserva se um arquivo não decodificar.

## Novidades da versão 1.1.0 (sem novos arquivos de áudio)

Nenhuma gravação nova foi adicionada; as camadas abaixo são **sintetizadas no aparelho** (Web Audio API) ou reutilizam
as gravações CC0 já listadas:

| Efeito | Como é feito | Origem |
|---|---|---|
| CIWS contínuo ("motosserra" de 4500 tpm) | dente-de-serra a 75 Hz + saturação (waveshaper) + ruído modulado em amplitude, mixado sobre a gravação `ciws.ogg` | sintetizado + CC0 |
| Salvas sincronizadas das torres | `canhao_grande/medio.ogg` repetidos com atraso de milissegundos e pan por torre | CC0 (gravação real) |
| Canhão 30 mm | `canhao_rapido.ogg` com taxa de reprodução 1,25× | CC0 (gravação real) |
| Alerta "Míssil inimigo — defesa ativada" | dois tons sintetizados com pan na direção da ameaça + voz pt-BR pelo sintetizador de voz do sistema (speechSynthesis), quando o aparelho oferece uma | sintetizado / voz do sistema |
| Lançamento de SAM e abates de SAM, drones, torpedos e lanchas | `vls_lancamento.ogg` (1,25×), `explosao_longe.ogg`, `explosao_media.ogg` e `respingo_grande.ogg` com volume ajustado | CC0 (gravação real) |

A voz do alerta não é um arquivo: é gerada em tempo real pelo mecanismo de voz do próprio Android; se o WebView não
expuser `speechSynthesis`, o jogo usa só os tons e o texto no HUD.

## Novidades da versão 1.2.0 — novas gravações (todas CC0 1.0, licença verificada em 20/10/2026 na página de cada som)

| Arquivo no app | Uso | Origem (URL) | Autor | Licença |
|---|---|---|---|---|
| heli_rotor_loop.ogg | rotor do helicóptero (loop; tom/volume com Doppler e distância) | https://freesound.org/people/UnderlinedDesigns/sounds/172667/ (MILITARY ROTOR LOOP) | UnderlinedDesigns | CC0 |
| heli_turbina_loop.ogg | turbina do helicóptero (camada) | https://freesound.org/people/AntumDeluge/sounds/584326/ (Helicopter Loop) | AntumDeluge | CC0 |
| heli_passagem.ogg | passagem rasante de helicóptero naval | https://freesound.org/people/SirWilliam77/sounds/443427/ (SeaKing Flyby) | SirWilliam77 | CC0 |
| flares.ogg | disparo de flares/chaff (lançador de iscas) | https://freesound.org/people/craigsmith/sounds/675636/ (Flares gun fires) | craigsmith | CC0 |
| incendio_loop.ogg | incêndio a bordo (loop) | https://freesound.org/people/jamesdrake89/sounds/636178/ (Fire - Crackling, Spitting, Roaring) | jamesdrake89 | CC0 |
| alagamento_loop.ogg | água entrando no casco (alagamento) | https://freesound.org/people/Sonicquinn/sounds/439232/ (Rushing Through Canal Lock) | Sonicquinn | CC0 |
| rangido_metal.ogg | rangido metálico do casco afundando | https://freesound.org/people/LoafDV/sounds/238289/ (Long Metal Creak) | LoafDV | CC0 |
| rangido_metal2.ogg | gemido longo de aço (afundamento) | https://freesound.org/people/EagleStealthTeam/sounds/172411/ (Creaking Metal - Slow) | EagleStealthTeam | CC0 |
| bolhas_loop.ogg | bolhas/ar escapando do casco submerso | https://freesound.org/people/KolbyRFX/sounds/852478/ (Underwater Bubble Flow Loop) | KolbyRFX | CC0 |
| radio_estatica.ogg | estática do rádio entre mensagens | https://freesound.org/people/metrostock99/sounds/203255/ (OLD ARMY RADIO STATIC) | metrostock99 | CC0 |
| ui_clique.ogg | toque em botões do estaleiro/loja/troféus | https://freesound.org/people/Ranner/sounds/488534/ (UI click) | Ranner | CC0 |
| ui_confirma.ogg | confirmação de compra/seleção | https://freesound.org/people/LilMati/sounds/703884/ (Diamond Click - Luxury UI Click) | LilMati | CC0 |

Camadas novas sintetizadas (Web Audio): Doppler do rotor e dos mísseis (playbackRate pela velocidade radial), "moeda" de compra,
fanfarra curta de medalha, batidas do VANT (hélice elétrica), sopro da nuvem de chaff.

## v1.2.17 — "Épica naval" (epica_menu.ogg / epica_batalha.ogg)
Composição e síntese PRÓPRIAS deste projeto (script `/workspace/musica1217/gera.py`, 48 kHz, nenhuma amostra de terceiros): metais, cordas, coro por formantes, taikos, tímpanos, caixa, pratos, golpes metálicos, sonar e "braam". Domínio público (CC0) por dedicação do autor do projeto. Loop circular sem emenda (verificado por `emenda.py`), −14,9/−14,4 LUFS, LRA ≈ 9,6 LU.

## 1.2.18
- Motor (diesel/turbina/vapor/proa/esteira/thruster) e granada (lançamento, assobio de aproximação, impacto): sintetizados em código no próprio jogo (src/audio/bancoSom.js), sem amostras externas — domínio próprio do projeto.
- Música de abertura padrão: "The Final Battle" (skrjablin, CC0) — trilha ORIGINAL do menu; arquivo remasterizado da 1.2.14 mantido (mesma peça).


## v1.2.29 — gravações reais (Fiscal sons-reais, A/B)

Ver inventário completo e verificação de URLs em `LICENCAS-ASSETS.md`.

### Créditos CC-BY (obrigatório)

- "WWS Saab J35D Draken start/taxi" by Work With Sounds / Torsten Nilsson — CC BY 4.0 — jet_idle_loop
- "Canadian CF 18 maneuvers" (takeoff excerpt) by lonemonk — CC BY 3.0 — jet_takeoff (catapult proxy)
- "Torpedo launch underwater" by jobro — CC BY 3.0 — torpedo_lancamento

### CC0/PD trocados após A/B (espectro+envelope ≥ anterior)

canhao_grande/medio/rapido/longe, vls_lancamento, explosao_perto/media/grande/longe, jet_flyby (laribum CC0), explosao_nuke_head (Fg2 PD), missile_whoosh.

Impactos no casco do jogador: DSP sem tom (ij:/zj:). Catapulta: sintético + jet_takeoff. Nuke: head real + cauda grave 25 s.

## v1.2.16 / 1.2.29 — trilha “Ação” (acao_menu.ogg / acao_batalha.ogg)
Composição e síntese **próprias** deste projeto (trilha alternativa “Ação” nos Ajustes), 48 kHz, sem amostras de terceiros.
Dedicação CC0 / domínio próprio do autor do projeto (Valter Amorim / Nexo). Loop circular; pico ≤ −1 dBFS após remaster 1.2.29.

## Nuke pack (v1.2.29)

38 OGG CC0/PD — detalhe em LICENCAS-nuke-assets.md / MAPA-nuke-assets.md.
Principais: nuke_explosion_full_28s, nuke_explosion_near_12s, nuke_rumble_distant_25s, blast_*, pressure_wave_*, debris_*, wave_surge_*, building_collapse_*, trees_crack_*, wind_*.

# Créditos de áudio — Nexo Naval Strike 3D

Todas as gravações abaixo são **CC0 1.0 (domínio público)**: uso comercial, modificação e redistribuição em app
permitidos, sem exigência de atribuição (creditamos por cortesia). Licença verificada na página de cada som em 20/10/2026.
Para os sons do Freesound foi usada a versão de pré-visualização HQ (mesma gravação, mesma licença), recortada,
normalizada e recodificada em OGG Vorbis mono pelo projeto.

| Arquivo no app | Uso | Origem (URL) | Autor | Licença |
|---|---|---|---|---|
| canhao_grande.ogg | canhão 127 mm | https://freesound.org/people/qubodup/sounds/187767/ (Cannon Shot) | qubodup | CC0 |
| canhao_medio.ogg | canhão 76 mm | https://freesound.org/people/qubodup/sounds/182822/ (Artillery Shots) | qubodup | CC0 |
| canhao_rapido.ogg | canhão 57 mm / rajada | https://freesound.org/people/qubodup/sounds/854186/ (Autocannon Three Shot Burst) | qubodup | CC0 |
| canhao_longe.ogg | disparo distante (eco) | https://freesound.org/people/craigsmith/sounds/486030/ (155mm Howitzer Fires) | craigsmith | CC0 |
| ciws.ogg | rajada do CIWS | https://freesound.org/people/qubodup/sounds/163119/ (Navy MK 15 CIWS Fast Burst, gravação do governo dos EUA) | qubodup | CC0 |
| vls_lancamento.ogg | lançamento VLS (silvo + foguete) | https://freesound.org/people/qubodup/sounds/182794/ (Rocket Launch) | qubodup | CC0 |
| explosao_perto.ogg | impacto próximo | https://freesound.org/people/derplayer/sounds/587180/ (explosion_near) | derplayer | CC0 |
| explosao_media.ogg | impacto no casco | https://freesound.org/people/qubodup/sounds/182429/ (Explosion) | qubodup | CC0 |
| explosao_grande.ogg | navio destruído | https://freesound.org/people/Hugofski/sounds/177556/ (massive explosion) | Hugofski | CC0 |
| explosao_longe.ogg | explosão distante | https://freesound.org/people/Kostrava/sounds/324277/ (distant explosion) | Kostrava | CC0 |
| respingo_grande.ogg | gêiser de granada na água | https://freesound.org/people/qubodup/sounds/442773/ (Big Water Splash) | qubodup | CC0 |
| respingo.ogg | respingo / entrada do torpedo | https://freesound.org/people/Bird_man/sounds/316744/ (Big Splash) | Bird_man | CC0 |
| impacto_metal.ogg | ricochete / estilhaço no casco | https://freesound.org/people/Johnnyfarmer/sounds/209772/ (Metal Boom) | Johnnyfarmer | CC0 |
| torpedo_corrida.ogg | torpedo correndo (loop) | https://freesound.org/people/craigsmith/sounds/675798/ (Torpedo traveling underwater) | craigsmith | CC0 |
| alarme_trava.ogg | alarme de trava de míssil | https://freesound.org/people/Alxy/sounds/189327/ (missile lock on sound) | Alxy | CC0 |
| motor_diesel_loop.ogg | propulsão diesel (loop, tom segue os nós) | https://freesound.org/people/AugustSandberg/sounds/264864/ (Marine diesel engine) | AugustSandberg | CC0 |
| turbina_loop.ogg | praça de máquinas / turbina (loop) | https://freesound.org/people/mrmayo/sounds/74914/ (ferry engine room1) | mrmayo | CC0 |
| musica_batalha.ogg | música de batalha | https://opengameart.org/content/determined-pursuit-epic-orchestra-loop | Emma_MA | CC0 |
| musica_menu.ogg | música do menu | https://opengameart.org/content/the-final-battle | skrjablin | CC0 |

Sons **sintetizados** no aparelho (Web Audio API, sem arquivo): servo do canhão, apito/bipe de proximidade, cliques
da interface, camada de assobio da turbina a gás, rádio, camada de "crack" no disparo, chuva/vento; e versões sintéticas
de TODOS os sons acima, usadas como reserva se um arquivo não decodificar.

## Novidades da versão 1.1.0 (sem novos arquivos de áudio)

Nenhuma gravação nova foi adicionada; as camadas abaixo são **sintetizadas no aparelho** (Web Audio API) ou reutilizam
as gravações CC0 já listadas:

| Efeito | Como é feito | Origem |
|---|---|---|
| CIWS contínuo ("motosserra" de 4500 tpm) | dente-de-serra a 75 Hz + saturação (waveshaper) + ruído modulado em amplitude, mixado sobre a gravação `ciws.ogg` | sintetizado + CC0 |
| Salvas sincronizadas das torres | `canhao_grande/medio.ogg` repetidos com atraso de milissegundos e pan por torre | CC0 (gravação real) |
| Canhão 30 mm | `canhao_rapido.ogg` com taxa de reprodução 1,25× | CC0 (gravação real) |
| Alerta "Míssil inimigo — defesa ativada" | dois tons sintetizados com pan na direção da ameaça + voz pt-BR pelo sintetizador de voz do sistema (speechSynthesis), quando o aparelho oferece uma | sintetizado / voz do sistema |
| Lançamento de SAM e abates de SAM, drones, torpedos e lanchas | `vls_lancamento.ogg` (1,25×), `explosao_longe.ogg`, `explosao_media.ogg` e `respingo_grande.ogg` com volume ajustado | CC0 (gravação real) |

A voz do alerta não é um arquivo: é gerada em tempo real pelo mecanismo de voz do próprio Android; se o WebView não
expuser `speechSynthesis`, o jogo usa só os tons e o texto no HUD.

## Novidades da versão 1.2.0 — novas gravações (todas CC0 1.0, licença verificada em 20/10/2026 na página de cada som)

| Arquivo no app | Uso | Origem (URL) | Autor | Licença |
|---|---|---|---|---|
| heli_rotor_loop.ogg | rotor do helicóptero (loop; tom/volume com Doppler e distância) | https://freesound.org/people/UnderlinedDesigns/sounds/172667/ (MILITARY ROTOR LOOP) | UnderlinedDesigns | CC0 |
| heli_turbina_loop.ogg | turbina do helicóptero (camada) | https://freesound.org/people/AntumDeluge/sounds/584326/ (Helicopter Loop) | AntumDeluge | CC0 |
| heli_passagem.ogg | passagem rasante de helicóptero naval | https://freesound.org/people/SirWilliam77/sounds/443427/ (SeaKing Flyby) | SirWilliam77 | CC0 |
| flares.ogg | disparo de flares/chaff (lançador de iscas) | https://freesound.org/people/craigsmith/sounds/675636/ (Flares gun fires) | craigsmith | CC0 |
| incendio_loop.ogg | incêndio a bordo (loop) | https://freesound.org/people/jamesdrake89/sounds/636178/ (Fire - Crackling, Spitting, Roaring) | jamesdrake89 | CC0 |
| alagamento_loop.ogg | água entrando no casco (alagamento) | https://freesound.org/people/Sonicquinn/sounds/439232/ (Rushing Through Canal Lock) | Sonicquinn | CC0 |
| rangido_metal.ogg | rangido metálico do casco afundando | https://freesound.org/people/LoafDV/sounds/238289/ (Long Metal Creak) | LoafDV | CC0 |
| rangido_metal2.ogg | gemido longo de aço (afundamento) | https://freesound.org/people/EagleStealthTeam/sounds/172411/ (Creaking Metal - Slow) | EagleStealthTeam | CC0 |
| bolhas_loop.ogg | bolhas/ar escapando do casco submerso | https://freesound.org/people/KolbyRFX/sounds/852478/ (Underwater Bubble Flow Loop) | KolbyRFX | CC0 |
| radio_estatica.ogg | estática do rádio entre mensagens | https://freesound.org/people/metrostock99/sounds/203255/ (OLD ARMY RADIO STATIC) | metrostock99 | CC0 |
| ui_clique.ogg | toque em botões do estaleiro/loja/troféus | https://freesound.org/people/Ranner/sounds/488534/ (UI click) | Ranner | CC0 |
| ui_confirma.ogg | confirmação de compra/seleção | https://freesound.org/people/LilMati/sounds/703884/ (Diamond Click - Luxury UI Click) | LilMati | CC0 |

Camadas novas sintetizadas (Web Audio): Doppler do rotor e dos mísseis (playbackRate pela velocidade radial), "moeda" de compra,
fanfarra curta de medalha, batidas do VANT (hélice elétrica), sopro da nuvem de chaff.

## v1.2.17 — "Épica naval" (epica_menu.ogg / epica_batalha.ogg)
Composição e síntese PRÓPRIAS deste projeto (script `/workspace/musica1217/gera.py`, 48 kHz, nenhuma amostra de terceiros): metais, cordas, coro por formantes, taikos, tímpanos, caixa, pratos, golpes metálicos, sonar e "braam". Domínio público (CC0) por dedicação do autor do projeto. Loop circular sem emenda (verificado por `emenda.py`), −14,9/−14,4 LUFS, LRA ≈ 9,6 LU.

## 1.2.18
- Motor (diesel/turbina/vapor/proa/esteira/thruster) e granada (lançamento, assobio de aproximação, impacto): sintetizados em código no próprio jogo (src/audio/bancoSom.js), sem amostras externas — domínio próprio do projeto.
- Música de abertura padrão: "The Final Battle" (skrjablin, CC0) — trilha ORIGINAL do menu; arquivo remasterizado da 1.2.14 mantido (mesma peça).


## v1.2.29 — gravações reais (Fiscal sons-reais, A/B)

Ver inventário completo e verificação de URLs em `LICENCAS-ASSETS.md`.

### Créditos CC-BY (obrigatório)

- "WWS Saab J35D Draken start/taxi" by Work With Sounds / Torsten Nilsson — CC BY 4.0 — jet_idle_loop
- "Canadian CF 18 maneuvers" (takeoff excerpt) by lonemonk — CC BY 3.0 — jet_takeoff (catapult proxy)
- "Torpedo launch underwater" by jobro — CC BY 3.0 — torpedo_lancamento

### CC0/PD trocados após A/B (espectro+envelope ≥ anterior)

canhao_grande/medio/rapido/longe, vls_lancamento, explosao_perto/media/grande/longe, jet_flyby (laribum CC0), explosao_nuke_head (Fg2 PD), missile_whoosh.

Impactos no casco do jogador: DSP sem tom (ij:/zj:). Catapulta: sintético + jet_takeoff. Nuke: head real + cauda grave 25 s.

## Pacote nuke-assets (Fiscal → public/audio + public/tex/nuke)

| Arquivo | Origem / autor | Licença |
|---|---|---|
| air_blast_short_01.ogg | https://opengameart.org/content/100-cc0-sfx-2 | rubberduck |
| blast_body_chunky_01.ogg | https://opengameart.org/content/chunky-explosion | Joth |
| blast_head_ls_01.ogg | https://commons.wikimedia.org/wiki/File:Explosions-LS100155.ogg | Fg2 |
| blast_head_ls_02.ogg | https://commons.wikimedia.org/wiki/File:Explosions-LS100152.ogg | Fg2 |
| blast_overhead_01.ogg | https://freesound.org/people/noirenex/sounds/159402/ | noirenex |
| blast_tail_muffled_01.ogg | https://opengameart.org/content/muffled-distant-explosion | NenadSimic |
| bridge_steel_collapse_01.ogg | https://freesound.org/people/Wdomino/sounds/508546/ | Wdomino |
| building_collapse_01.ogg | https://freesound.org/people/greyfeather/sounds/712918/ | greyfeather |
| building_collapse_02.ogg | https://freesound.org/people/craigsmith/sounds/675900/ | craigsmith |
| building_collapse_03.ogg | https://freesound.org/people/craigsmith/sounds/487142/ | craigsmith |
| debris_falling_concrete_01.ogg | https://freesound.org/people/kyles/sounds/453823/ | kyles |
| debris_falling_concrete_02.ogg | https://freesound.org/people/OverlookHotelRecords/sounds/321143/ | OverlookHotelRecords |
| debris_falling_glass_01.ogg | https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx | rubberduck |
| debris_falling_metal_01.ogg | https://freesound.org/people/kyles/sounds/450873/ | kyles |
| debris_falling_metal_02.ogg | https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx | rubberduck |
| debris_falling_rock_01.ogg | https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx | rubberduck |
| debris_falling_wood_01.ogg | https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx | rubberduck |
| distant_thunder_rumble_01.ogg | https://freesound.org/people/billgrip/sounds/151447/ | billgrip |
| distant_thunder_rumble_02.ogg | https://freesound.org/people/mrrap4food/sounds/619052/ | mrrap4food |
| distant_thunder_rumble_03.ogg | https://freesound.org/people/FenrirFangs/sounds/234736/ | FenrirFangs |
| distant_thunder_rumble_04.ogg | https://freesound.org/people/soundofsong/sounds/738091/ | soundofsong |
| nuke_explosion_full_28s.ogg | Fg2 Explosions-LS* (Wikimedia PD) + OGA chunky/muffled (CC0) + Freesound thunder/rumble/whoosh CC0 listados abaixo | vários |
| nuke_explosion_near_12s.ogg | idem | vários |
| nuke_rumble_distant_25s.ogg | https://freesound.org/people/billgrip/sounds/151447/ + https://opengameart.org/content/rumbling-sound-effects | billgrip + bretbernhoft |
| pressure_wave_whoosh_01.ogg | https://opengameart.org/content/air-whoosh | pyranostudios |
| pressure_wave_whoosh_02.ogg | https://opengameart.org/content/air-whoosh | pyranostudios |
| thunder_short_01.ogg | https://opengameart.org/content/100-cc0-sfx-2 | rubberduck |
| trees_crack_fall_01.ogg | https://freesound.org/people/aabbccddee123/sounds/469441/ | aabbccddee123 |
| trees_crack_fall_02.ogg | https://freesound.org/people/kyles/sounds/637912/ | kyles |
| trees_crack_wind_01.ogg | https://freesound.org/people/felix.blume/sounds/134095/ | felix.blume |
| wave_splash_large_01.ogg | https://opengameart.org/content/battle-at-sea | Thimras |
| wave_splash_large_02.ogg | https://commons.wikimedia.org/wiki/File:Bathtub_water_splashes.ogg | gradha |
| wave_surge_crash_01.ogg | https://freesound.org/people/nofeedbak/sounds/431851/ | nofeedbak |
| wave_surge_crash_02.ogg | https://freesound.org/people/kyles/sounds/450634/ | kyles |
| wind_coast_blast_01.ogg | https://freesound.org/people/Breviceps/sounds/683013/ | Breviceps |
| wind_debris_blast_01.ogg | https://freesound.org/people/TheSurfboardingGiraffe/sounds/699674/ | TheSurfboardingGiraffe |
| wind_gust_01.ogg | https://freesound.org/people/lextrack/sounds/344887/ | lextrack |
| wind_gust_02.ogg | https://freesound.org/people/keirofinch/sounds/376534/ | keirofinch |
| debris_concrete_a.webp | https://ambientcg.com/view?id=Concrete034 | ambientCG |
| debris_concrete_b.webp | https://ambientcg.com/view?id=Concrete019 | ambientCG |
| debris_metal.webp | https://ambientcg.com/view?id=MetalPlates006 | ambientCG |
| debris_rock.webp | https://ambientcg.com/view?id=Rock023 | ambientCG |
| debris_wood.webp | https://ambientcg.com/view?id=WoodSiding007 | ambientCG |
| dust_cloud_atlas.webp | https://opengameart.org/content/smoke-particle-assets | Kenney |
| dust_ground.webp | https://ambientcg.com/view?id=Ground037 | ambientCG |
| explosion_sprites_kenney.webp | https://opengameart.org/content/smoke-particle-assets | Kenney |
| fireball_atlas.webp | https://opengameart.org/content/explosion-particles-sprite-atlas | TheJosh (deriv. Kenney) |
| fireball_atlas_512.webp | https://opengameart.org/content/explosion-particles-sprite-atlas | TheJosh (deriv. Kenney) |
| fireball_sheet_boom3.webp | https://opengameart.org/content/explosion-sheet | StumpyStrust |
| mushroom_smoke_atlas.webp | https://opengameart.org/content/smoke-particle-assets | Kenney |
| shockwave_distortion.webp | — | Grok Bot / Fiscal |
| shockwave_ring.webp | — | Grok Bot / Fiscal |
| water_foam.webp | https://ambientcg.com/view?id=Foam001 | ambientCG |
| water_spray.webp | https://ambientcg.com/view?id=Foam001 | ambientCG |

URLs e notas completas: `LICENCAS-nuke-assets.md` (cópia de `/workspace/fiscal/nuke-assets/LICENCAS.md`). Pico ffmpeg: `nuke_explosion_full_28s.ogg` max_volume −1,2 dBFS; duração 28 s.

