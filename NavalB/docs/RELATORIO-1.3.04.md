# Naval B 1.3.04 — relatório de integração

**Base:** Naval B 1.3.03 (`package.json` 1.3.03 → 1.3.04).

**APK:**
- `br.com.valteramorim.nexonaval.b`, versionCode 104, versionName 1.3.04.
- Mesma chave (SHA-256 …a599).
- Única permissão pedida: VIBRATE.

**Pedido:** código NOVO e próprio para o Acauã e o Uiraçu, sem mexer no código das outras aeronaves.

**Legenda:**
- **VERIFICADO:** testado (teste node na simulação real ou navegador).
- **LIDO:** conferido só lendo o código.
- **NÃO VERIFICADO:** só no aparelho (fps, som, toque real).

## 1. Arquivos novos (só dos caças)

- `src/sim/vtolAmorim.js`: armas, munição, intervalos, rearme, volta, lasers, nuke tático e IA dos 2 caças.
- `src/sim/vtolDadosSim.js`: posições das estações, lasers e munição (gerado do OBJ do Valter por `tools/vtol/gera.py`).
- `src/render/vtolAmorimFx.js`: botões do HUD, fumaça colorida, luzes piscando, feixes dos lasers e efeito do nuke tático.
- `tests/vtol134.mjs`: teste.

## 2. Ganchos em código existente

Cada gancho é uma linha e só age quando a aeronave é Acauã/Uiraçu (`h.vt`) ou o navio é o Destróier Amorim:

- `src/sim/world.js`: chama `passoVtolAmorim` e o comando `vtArma`.
- `src/net/commands.js`: registra o comando `vtArma`.
- `src/modernNavalCombat3D.js`: cria, chama e descarta `VtolAmorimFx`. Na câmera, usa distância 49 m / +4 m só quando `heli.vt`.
- `src/render/aereo3d.js`: estações por tipo (só modelos VTOL Amorim).
- `src/sim/classes.js`: textos e canhão das fichas do Acauã e do Uiraçu.
- `src/styles.css`: botões `.vt-armas`.

O voo, o manche, a física e as demais aeronaves ficaram iguais.

## 3. Itens

| Item | Estado |
|---|---|
| Munição por tipo: Acauã 6 AAM, 4 ASM, 2 TORP, 3 NUKE; Uiraçu 4, 4, 2, 3. | VERIFICADO |
| Botões AAM/ASM/TORP/NUKE com a munição somada dos 2 caças. Em 0 ficam esmaecidos e desabilitados. Só aparecem com caça no ar. | VERIFICADO (soma no teste) / LIDO (botões) |
| 1 disparo por clique. Sai do caça pilotado, ou do outro caça no ar se o pilotado não puder. Sem nenhum pronto, aparece um aviso. | VERIFICADO |
| Intervalo de 7 s (míssil/torpedo) e de 12 s (nuke). | VERIFICADO |
| Estação disparada some (pilone vazio) e volta ao rearmar. | LIDO |
| Nuke tático: detona só no alvo (raio de 450 m). Abatido no caminho não detona. No máximo 2 efeitos ao mesmo tempo. O nuke do Urubu-rei não foi tocado. | VERIFICADO (sim) / LIDO (efeito) |
| Rearme em 15 s pousado no navio. | VERIFICADO |
| Caça abatido volta pousado e cheio em 20 s. | VERIFICADO (20,0 s) |
| Laser dorsal só em alvo acima e ventral só em alvo abaixo. A linha nunca cruza o caça. Abatem mísseis. | VERIFICADO |
| Sem munição: a IA volta e rearma. Pilotado: mostra "SEM MUNIÇÃO — VOLTAR AO NAVIO". | VERIFICADO (IA) / LIDO (aviso) |
| Fumaça colorida por bocal, com o mesmo pool e os mesmos parâmetros do Urubu-rei. | LIDO / NÃO VERIFICADO no aparelho |
| Luzes de estrobo e anticolisão piscando (só a intensidade muda). | LIDO |
| Câmera de perseguição do Urubu-rei (49 m, +4 m), só nos 2 caças. | LIDO |

## 4. Desempenho

- Nenhuma mudança em DPR, fps, `autoQualidade` ou qualidade.
- Sem alocação por quadro: estados criados uma vez por caça.
- Lasers avaliados a 10 Hz.
- 4 linhas fixas para os feixes.
- Fps no aparelho: **NÃO VERIFICADO**.

## 5. Testes

- `node tests/vtol134.mjs`: TUDO OK.
- `node tests/destroier133.mjs`, `fragata132.mjs`, `amorim130.mjs`: TUDO OK (regressão).
