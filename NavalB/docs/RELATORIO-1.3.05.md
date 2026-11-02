# Naval B 1.3.05 — relatório

**Base:** Naval B 1.3.04.

**APK:**
- versionCode 105, versionName 1.3.05.
- Mesma chave (…a599).
- Só a permissão VIBRATE.

## Pedido do Valter

1. Pilotagem, física de voo, câmera e controle do Acauã e do Uiraçu iguais aos do Urubu-rei (Lençóis Maranhenses), adaptados, sem tocar no Urubu-rei.
2. Tirar os botões novos e usar a mesma tela de controle do Urubu-rei para pilotar e voltar ao navio.
3. As outras aeronaves seguem fiéis à 1.2.99.

## O que mudou

| Item | Onde | Estado |
|---|---|---|
| Física de voo pilotado = cópia do `voaManual` do Urubu-rei, lendo os mesmos ganhos `NUK` (inclinação, taxas, curva, altitudes). Adaptado: acelerador na faixa do próprio caça (o mesmo ramo que o `nuclear.js` usa para outras aeronaves), piso sobre mar/terreno e saída do pairado (VTOL) acelerando a 7 m/s² sem pulo. | `src/sim/vooVtolAmorim.js` (novo) · gancho `src/naval5v5/aereo.js` (só `h.vt`) | VERIFICADO: ω máx 0,360 = `manCurvaMax`; inclinação 1,00 = `manBank`; MÁX = vmax; MIN = 0,42 × vmax; recuperação de altitude |
| Câmera = cópia do `nkCam` do Urubu-rei: 49 m, +4 m, sem zoom, volta para trás após 2,2 s sem toque, presa ao avião sem tremer, nunca dentro do navio. | `src/render/camVtolAmorim.js` (novo) · gancho `src/modernNavalCombat3D.js` (só `heli.vt`) | VERIFICADO no navegador (distância ≈ 50 m) |
| Controle = mesma tela do Urubu-rei (manche com a mesma curva, acelerador de 5 posições). | já era o painel do bombardeiro | VERIFICADO |
| Fileira de botões AAM/ASM/TORP/NUKE da 1.3.04 removida. | `src/render/vtolAmorimFx.js`, `src/styles.css` | VERIFICADO (não existe mais) |
| Armas nos botões da própria tela: LANÇAR = NUKE · AR-AR = AAM · MÍSSIL = ASM · TORP · PORTA = CANHÃO · BASE = volta ao navio. Contagem somada dos 2 caças; em 0 esmaecido e sem toque. | `vtolAmorimFx.js` (`acao`, `painel`) · ganchos de 1 linha em `acao()` e `aeroPasso()` | VERIFICADO no navegador: NUKE 6 · AAM 10 · ASM 8 · TORP 4; ASM disparou pela tela; BASE → "A CAMINHO" |
| Fumaça colorida por bocal só em voo a ≥ 75 m/s. O Acauã/Uiraçu não recebe mais a trilha genérica de avião (que saía em qualquer velocidade). Nos outros aviões a trilha continua igual. | `vtolAmorimFx.js`, `src/render/aereo3d.js` (`!h.vt`) | VERIFICADO: 0 emissões abaixo de 75 m/s |
| Armas, intervalos 7 s/12 s, rearme 15 s, volta em 20 s, lasers, nuke tático: como na 1.3.04. | `src/sim/vtolAmorim.js` | VERIFICADO (`tests/vtol134.mjs`) |

## Outras aeronaves e Urubu-rei (fidelidade à 1.2.99)

- `src/sim/vooUnificado.js`, `src/render/nuclearFx.js`, `src/render/fx.js`, `src/render/aereo1225.js`: **idênticos à 1.2.99**. Física de voo, fumaça colorida e rastro que vira névoa não foram tocados.
- `src/sim/nuclear.js`: nenhuma linha mudou nesta versão. As diferenças desde a 1.2.99 são só as pedidas na 1.3.01–1.3.03 (resistência 20%, acelerador de cada aeronave, aviso de míssil, teste de combate).
- Teste: um caça Gavião de porta-aviões, pilotado, continua no voo antigo (`voaUnificado`). VERIFICADO.
- `tests/voo1278.mjs`: ok. `tests/nuclear1226.mjs` tem as mesmas 5 falhas que já tinha antes desta mudança. `tests/nkManual1226.mjs` não roda, porque aponta para um caminho que não existe aqui.

## NÃO VERIFICADO

- Fps, toque real e som no aparelho.
- A tela foi testada no navegador headless, que roda a simulação mais devagar.
