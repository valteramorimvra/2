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
