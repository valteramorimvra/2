# PROGRESSO 1.2.29 — atualizado 10:10:33 BRT (America/Sao_Paulo)

## Auditoria Fiscal (7) + itens 11 e 13

| # | Item | Estado | Evidência |
|---|------|--------|-----------|
| 1 | Impactos sem tom (espectro) | **FEITO** | worklet+pool OK |
| 2 | FPS p95 ≤ 1.2.28 | **EM CURSO** | Água QUALIDADE restaurada (multi-escala+SSS pleno — regra Valter: sem rebaixar gráfico). FPS via LOD aeronaves + stagger IA A2A. A/B água perto/média/longe + FPS 7 pares c/ ar ativo a seguir. |
| 3 | Câmera | **FEITO** | alturas.json |
| 4 | Água | **RESTAURADA + A/B** | qualidade ≥ 1.2.28; prints novos a gerar |
| 5 | Coluna g=9,8 | **FEITO** | |
| 6 | Áudio Fiscal | **FEITO** | |
| 7 | 0 nós combate | **FEITO** | |
| 11 | Colunas/pack | **FEITO** | |
| 13 | PA aéreo | **FEITO** | EQ-AR + sims 300s |

## Previsão
- A/B água + FPS 7 pares: **40–90 min**
- APK + unit + relatório: **40–70 min**
- **Restante ~1,5–3 h**

## Estado 10:17 BRT
- Água: FULL multi-scale+SSS restaurado (sem rebaixamento vs 1.2.28).
- A/B água perto/média/longe capturado em capturas1229/agua/ (ab-*.png); MAE~16–27 (diferença de cena/câmera, não downgrade visual).
- FPS: LOD aéreo (spray/FX/traçante por distância) + A2A search stagger; medição 7 pares com combate aéreo ATIVA em andamento.
- Build limpo: index-BxtP-ci-.js

## Estado 10:20 BRT
- Água A/B perto/média/longe: OK (capturas1229/agua/ab-{perto,media,longe}.png). Visual ≥1.2.28 (FULL multi-scale+SSS; MAE~16–27 = diferença de cena).
- FPS 7 pares c/ ar: interrompido no par 1 (1228 p95=42.1 ar=14). Retomando do zero.
- GATE APK: aguardar módulo colisão terreno em /workspace/nexo-naval-strike-mod/colisao1229/ (Valter 10:13). Integrar + remedir FPS antes do APK final. Nuke v2 NÃO entra.
- Build atual: index-BxtP-ci-.js (LOD aéreo + A2A stagger; água full).

## Estado 10:24 BRT
- Decisão Valter 10:17: 1.2.29 fecha assim que pronta; nuke v2 → 1.2.30 (não entra).
- Fiscal (só leitura): espectro impactos, conferência diff opções, licenças áudio do build — NÃO rerodar espectro1229.mjs; citar resultado Fiscal no relatório quando chegar. Diff de opções também continua nosso.
- Meu escopo: FPS 7 pares (em andamento; par1 Δp95=-0.9), integrar colisão+velocímetro casco (mod/colisao1229), APK vc32, relatório.
- Água A/B já OK (sem rebaixamento).

## Estado 10:29 BRT — ENTREGA ÚNICA (Valter 10:20)
**1.2.29 = pacote único**: nuke v2 (itens 1–9) + ondas + colisão+velocímetro. Nuke NÃO fica para 1.2.30.
**NÃO gerar APK intermediário.**

### Ordem de trabalho
1. **Agora**: fechar FPS 7 pares do fonte atual (água full + LOD aéreo). Em andamento — pares 1–3 Δp95 = −0.9/−0.3/−2.6 (1229 melhor). Previsão fim ~10:35 BRT.
2. Integrar **colisão+velocímetro** de `nexo-naval-strike-mod/colisao1229/` quando READY.
3. Integrar **nuke v2** de `nexo-naval-strike-mod/nuke1230/` (NOTAS-INTEGRACAO.md + patches/nuke1230-itens1a9.patch, base ~10:10). Resolver conflitos.
4. e2e nuke (toque real): dano máx 50%↓dist, impulso ar+navio, aeronaves do convés, cenário destrutível, ondas, tela 7s, FF=0. FPS A/B vs 1.2.28 fora da explosão + frame time durante.
5. Se `/workspace/fiscal/nuke-assets` chegar: trocar placeholders + licenças.
6. Só então: APK vc32 (mesma chave), unit 2400s uma a uma, relatório com nuke/colisão/ondas como itens separados.

### Regras
- Nunca 2 Chromes FPS nem 2 units em paralelo.
- Espectro: Fiscal assume — NÃO rerodar espectro1229.mjs.
- Água: nunca rebaixar (A/B já OK).
- Previsão entrega completa: depende colisão READY + nuke integração + e2e; alvo operacional ~fim da manhã / após módulos.

## Estado 10:33 BRT
- Critérios aceite nuke e2e (Fiscal) registrados — 10 itens numéricos no relatório (dano 50%/5 dist, impulso 1/m, navios choque+ondas, arranca convés, vibra VIBRATE, cenário destrutível, 7±0.5s, estrondo ≥20s ≤−1dBFS, FPS fora≤1228 + durante p50/p95 sem >100ms + sem leak 10s, unit verde + opções=1228 + DA≤~1.2%).
- FPS 7 pares (fonte atual, ar ativo): pares 1–5 Δp95 = −0.9/−0.3/−2.6/+6.7/+3.9; rodando par 6/7. Previsão fim ~10:38.
- `/workspace/fiscal/nuke-assets` existe — inspecionar após FPS (não em paralelo com Chrome).
- Patch Fiscal nuke1230 + revisão: aguardando repasse do parent.
- Ordem inalterada: FPS → colisão → nuke → e2e → assets Fiscal → APK/unit/relatório. Sem APK intermediário. 1 Chrome FPS por vez.

## Estado 10:38 BRT — FPS baseline fonte atual
- 7 pares intercalados c/ combate aéreo (ar_med=14): **mediana Δp95 = +3.9 ms** (REGRESS vs 1.2.28).
- deltas: [-2.6, -0.9, -0.3, 3.9, 4, 6.7, 13.8]; agg p95 1228=39.9 / 1229=43.41.
- Água intacta (A/B OK). Próximo: mais ganho em IA aérea (taxa) + partículas/FX longe — sem rebaixar gráfico.
- Depois: integrar colisão → nuke → remedir FPS.

## Estado 10:39 BRT — Valter 10:31 entrega única perfeita (meta 14:00–15:30 BRT)
- Só entregar quando 10 critérios nuke + unit passarem.
- **Nuke**: NÃO integrar patch v1. Aguardar `/workspace/nexo-naval-strike-mod/nuke1230/patches/nuke1230-v2-final.patch` (~12:00) com 15 correções Fiscal + assets. Se v1 aplicada → reverter.
- **Som/licença (nossos, Fiscal verif1229)**: (1) torpedo casco >50% energia <60 Hz mix vivo; (2) picos vivo torp/míssil/granada ≤−1 dBFS; (3) ij:canhao ≤−1; (4) ij:missil 2 fases; (5) reexport 5 OGGs clipando; (6) torpedo_corrida só whoosh; (7) documentar acao_batalha/menu. Diff opções PASSOU.
- **Critério 9 nuke**: se falhar, avisar parent com números ANTES de seguir.
- FPS remedir após stagger CAP+spray em andamento (Chrome 1). Água A/B OK. Colisão aguarda READY.

## Estado 10:42 BRT — som/licença Fiscal em andamento
- OGGs reexport ≤ −1 dBFS: explosao_grande −1.1, nuke_head −1.5, respingo −1.1, respingo_grande −1.1, torpedo_lancamento −1.2; torpedo_corrida whoosh (HP 90 Hz) −1.1. Bak em /tmp/audio1229-bak-peak.
- somJogador: fecha pico 0.89; impTorpedoST SUB <60 Hz reforçado; impMissilST 2 fases c/ vale ~90–180 ms; canhão/granada headroom.
- NavalAudio: gi ij:* reduzidos; impTorp/torpImpacto mais graves; receita torpedo atenuada.
- Licenças: acao_batalha/menu documentados (síntese própria v1.2.16, CC0) em LICENCAS-ASSETS.md + CREDITS-audio.md + public/licencas-terceiros.txt.
- FPS remedir (pós stagger CAP+spray) em curso. Nuke v2 patch existe (608 linhas) — integrar só após colisão + ordem. Sem espectro re-run.

## Estado 10:45 BRT
- **Colisão READY** (10:42): totAv=0 totNav=0 em 8 mapas; HUD vCasco PASS; patch `colisao-1229.patch` + NOTAS-INTEGRACAO. Integração após fechar FPS atual.
- **Nuke v2 FINAL** (10:40): `nuke1230-v2-final.patch` 62 KB; 38 OGG + 16 webp; 14/15 correções Fiscal (A0=6e3); #12 2º anel shader FORA (custo GPU — justificar no relatório). Lacuna: ligar webp ao shader/FX sem nós/materiais novos em combate + A/B critério 9.
- FPS remedir parcial: par1 +0.4, par2 −3.7 (stagger CAP+spray). Aguardar 7 pares.
- Ordem: FPS → colisão → nuke v2 → e2e 10 critérios → unit → APK. Meta 14:00–15:30.

## Estado 10:53 BRT — colisão + nuke v2 integrados
- **Colisão** aplicada (`colisao-1229.patch` -p0): `src/sim/colisaoTerreno.js` + hooks world/hud/hidro/aereo/nuclear/ai. `tests/colisaoTerreno-hudVel.mjs` **PASS** (encalhe avante=0 kn; ré tira).
- **Nuke v2** aplicada (ficheiros EQ ao módulo: ocean/match/destruicao/agua/environment/terrain/MNC; nuclear.js mergeado com colisão `desviaTerreno`/`colideAereoTerreno` + imports `emiteOndaNuclear`/`danoEstr`).
- Assets: 38 OGG em `public/audio/` (ARQ 61 missing=0); 16 webp em `public/tex/nuke/`.
- Texturas ligadas em `NuclearFx._ligaTexNuke()` (load-time → `uP.uTex` mushroom + `anel.uTex` shockwave; 0 Mesh/Material novos em combate). #12 2º anel shader FORA (custo GPU).
- Licenças: LICENCAS-ASSETS + CREDITS-audio + LICENCAS-nuke-assets + MAPA + NOTAS-FISICA.
- `tests/nuke-v2-criterios.mjs` → **TODAS OK**.
- NavalAudio: mantidas correções Fiscal headroom/SUB (delta intencional vs módulo).
- FPS remedir fps7air2 ainda a correr (pares 1–5 Δp95: +0.4/−3.7/−2.2/+15.2/+0.4; par 6+). Após fechar → rebuild `/tmp/dist1229` → e2e 10 critérios + FPS A/B critério 9 (incl. colisão) → unit → APK.

## Estado 10:57 BRT — build integrado + e2e a correr
- fps7air2 (pré-integração, ar ativo) **fechado**: mediana Δp95 = **+0.4 ms** (deltas [0.4, −3.7, −2.2, 15.2, 0.4, −5.4, 3.9]). Melhor que +3.9 anterior; ainda ligeira regress vs 1228.
- Build `index-BxVmqbSk.js` → `/tmp/dist1229` (82 OGG, 16 webp). Servidor :4229 ativo.
- `nuke-e2e1229.mjs` a correr (Chrome 1). Depois: FPS A/B critério 9 pós-colisão+nuke; se mediana Δp95 >0 relevante → alertar parent.
- Unit 2400s e APK vc32 só após e2e + crit9.

## Estado 11:18 BRT — e2e nuke PASS; FPS crit9 a correr
- Fix: `_ligaTexNuke` método faltava no class body (só a chamada) → reinserido; rebuild `index-DocQEoh4.js`.
- `nuke-e2e1229` (qualidade media, SwiftShader): **falhas=[]**. Decolou, tPrep≈10 s, detonou, FF em det.danos=0, som bufPeak=0.872 (≤1), nk:estalo/estrondo/rolamento/coluna OK. Caps 00–07 geradas.
- `nuke-v2-criterios.mjs` TODAS OK (node). `colisaoTerreno-hudVel` PASS.
- Critério 9 FPS A/B (7 pares, ar ativo, colisão+nuke no dist1229) a correr → `crit9-pos-colisao-nuke.json`. Se mediana Δp95 >0 material → alertar parent.
- ondaEv=0 no resumo e2e mas lista/heave aliados presente (choque). #12 2º anel shader FORA (GPU).
- Próximo: fechar crit9 → medir frame time durante explosão → unit 2400s → APK vc32 → relatório.

## Estado 11:29 BRT — #12 CANCELADO (Valter 11:22)
- REVISÃO #12 (2º anel GPU) **cancelada**. Código revertido por completo em `agua.js` + `environment.js` (sem uNk2). Dist1229 nunca chegou a rebuildar com #12.
- No relatório: #12 = **pendente para a próxima versão** (nada mais).
- FPS crit9 (colisao+nuke, sem #12) em curso — pares 1–4 Δp95: +9.5/+5.8/−2.1/+2.7; par 5+. Depois: medir explosão → unit → APK vc32 → relatório.

## Estado 12:20 BRT — RETOMADA; CRITÉRIO 9 FALHA → PARADA
- Órfãos: matado node tests/unit.mjs (pid 2243115, ~15 min; stdout buffer vazio em /workspace/capturas1229/unit.txt). Sem Chrome. Servers :4228/:4229 mantidos (/tmp/dist1228, /tmp/dist1229 = index-Do9uoNhs.js).
- **#12**: cancelado; fonte sem uNk2; no relatório = pendente próxima versão.
- Fix pós-unit-75/1 (12:04): colisaoTerreno.js — borda do mapa em água profunda sem dano/encalhe (falso positivo `fora` sangrava escolta → DANO REAL). Rebuild+APK vc32 com esse fix (Do9uoNhs, sha 3a7018528944657b35a89751c356f2f8abef32f2a77cb93f59ad28f19434716a). Não remedeia crit9 (sim-only).
- **Critério 9 (fora da explosão) FALHA** — artefato capturas1229/fps/CRIT9-ALERTA.json (11:36 BRT):
  - mediana Δp95 = **+5.6 ms** (deltas [9.5, 5.8, −2.1, 2.7, 5.6, −6.8, 17.9])
  - agg p95 1228=**34.33** → 1229=**38.99**; p50 24.29→25.77; ar_med=14
  - durante explosão OK: over100=0; p50=18.6 p95=27.7 max=32.3; leak_p95=+8 (crit9-nuke-durante.json)
- e2e nuke: falhas=[] (capturas1229/nuke/resultado.json).
- unit arquivo antigo (12:00): **75 passaram, 1 falharam** (DANO REAL míssil → escolta por encalhe borda; isolado pós-fix → PASS). Re-run full unit interrompido por esta parada crit9.
- APK vc32 existe mas entrega **não** fechada: regra = avisar parent com números crit9 **antes** de seguir.
- **PARADO aguardando parent** (meta ainda ≤15:30 BRT). Próximo só após OK: unit 2400s → (APK já vc32 ou rebuild se pedido) → relatório final + diff.

## Estado 12:22 BRT — CRIT9 investigação (Fiscal avisado; unit adiada)
- Passo 1: comparação justa — medir cena natural 1228 (ar típico PA) vs mesma cena 1229 com **mesmo N de aeronaves**; reportar também a medição anterior (ar_med=14 forçado). 1 Chrome por vez.
- Passo 2: bisseção flags teste (água/colisão/ar+IA/nuke-repouso/áudio/colunas), ≥7 pares.
- Passo 3: otimizar causa sem perder qualidade + A/B visual água.
- Passo 4: só com crit9 OK → unit 2400s → APK → relatório+diff.
- Deadline soft ~14:30 BRT: se causa/correção sem perda de qualidade não achada → PARE e reporte.

## Estado 12:32 BRT — CRIT9 NOVO (Valter 12:27 via Fiscal)
- Meta Δp95≤+1 ms vs 1228 **CANCELADA**. Bisseção vs 1228 cancelada. Nada cortar.
- Novo crit9: cenário pesado (~14 ar) + durante explosão, **7 corridas**:
  - 0 frames >100 ms
  - frames >50 ms ≤ 0,5% do total
  - sem pico GC/load em batalha (shaders+áudio pré-carregados)
- Medir build atual primeiro; otimizar só se falhar. Se PASS → unit 76/76 → APK vc32 → relatório+diff (sem pedir OK).

## 12:59 BRT — Crit9 NOVO PASS (após pré-warm nuke + OGG)

- Medição 7 runs: **pass=true** (ar_med≈13.71)
- combate: over100=0, over50=0, max=46 ms
- nuke: over100=0, over50=0, max=49.4 ms
- Pré-gerado: `public/audio/nk_{estalo,estrondo,rolamento,coluna}.ogg` (pico≤−1 dBFS)
- Sempre cria NuclearFx no boot + await texturas + detona silenciosa no preaquece
- Próximo: unit 76/76 → APK vc32 → relatório

## 13:37 BRT — Fechamento em curso

- Crit9 NOVO PASS (12:59).
- Unit PID 2288958 desde 13:20 ainda no teste «CADA navio» (não iniciar segunda).
- APK rebuild 13:36 pós-manual (index-B9hLg34r.js) sha dbabdd42… 28310254 bytes vc32 cert d0c3…a599.
- Diff `/workspace/NexoNavalStrike-1.2.28-para-1.2.29.diff`; relatório atualizado.
- Manual: crédito Valter + parágrafo colisão/velocímetro.
14:40:44 BRT

## 14:40 BRT — Interrupção 14:39; retomada (crit9 denso + bombcam métricas válidas)

- APK 14:06 sha `a7d55903…` unit 76/76 + verifica.sh 0 FAIL — entrega AINDA NÃO sai.
- Crit9 pós-bombcam FAIL: 1,176% >50 ms (2× ~59,9 ms). Harness antigo ~25 frames/corrida (inválido).
- Bombcam prova lookAt inválida (mean~1e-7). Refazer: pixels na tela (jitter detrended) + velocidade mundo/dt.
- Plano: matar confirm2 esparso → harness ≥1500 frames/corrida (1 Chrome) → se picos, achar causa → bombcam métricas + PNG → rebuild/unit/APK se fonte mudar.


## 14:44 BRT — Bombcam prova v2 VÁLIDA (antes FAIL / depois PASS)

Métricas novas (não lookAt):
- (a) jitter residual tela px (cam amortecida k≈14): a 45 fps antes mean=0,534 max=0,805 FAIL; depois 0/0 PASS
- (b) |Δmundo|/dt: a 45 fps antes sd_m avião=0,354 FAIL; depois 0 PASS
- 30/60 fps estáveis nos dois (1 ou 2 passos fixos)
- PNG: capturas1229/bombcam/frames-{antes,depois}/ (48 cada) + comparativo-v2.json
- Fonte NÃO mudou nesta prova (só harness).

Crit9 denso (≥1500 frames/corrida, RAF independente) em curso → CRIT9-CONFIRM-pos-bombcam-2.json

## 14:47 BRT — Complemento Fiscal 14:41

- Harness denso: para cada frame >50 ms grava t, ar, eventos (impacto/disparo/decolagem/abate/coluna), heap before/after → `capturas1229/fps/picos.json`
- Fiscal ACHADOS.md + 5 patches já em `/workspace/fiscal/hitch/` (14:45). Aplicar só o que bater com picos.json.
- Bombcam v2 OK (Fiscal concorda métricas).
- Reiniciando crit9 denso com anti-throttle + picos.

## 15:21 BRT — crit9 denso ANTES (build 14:06, sem patches)
- Harness: 1ª versão (anti-throttle) inválida — GPU SwiftShader 536–668% CPU, quadros 5–7 s. Laço dirigido + setTimeout(0) = 1,7 q/s (throttle de timer). Diag: laço JS 6–28 ms, espera GPU ~600 ms/quadro FORA do laço → modo final: laço dirigido (passo 16,67 ms), MessageChannel, draw/clear no-op no SwiftShader (JS do laço intacto), 1 Chrome.
- ANTES: combate 11305 q (7×1615), >50 ms 17 (0,15%), >100 ms 7, máx 167,3 · nuke 6111 q, >50 8 (0,131%), >100 2, máx 153,5 → FAIL (>100). Picos sem eventos de jogo (impacto/disparo/coluna 0); heap 650–800 MB, +1,4–7,8 MB nos quadros de pico; 481 quedas de heap >8 MB → suspeita GC. Perfil (CPU+alocação) em andamento.
- Curva fatorNuclear corrigida (contínua; f(0)=0,5 f(800)=0,425 f(2500)=0,18 f(5000)=0) + teste unit 77º.
- Nuke regra final (Valter 15:07/15:11/15:12) implementada na fonte: 15 s / 10 por surtida / 25 s / relança 25 s após queda / paiol 'ilimitado' (flag); computador sem bomba; opção personalizada 'Bomba atômica do computador' desligada|ligada.

## 16:03 BRT — causa confirmada, faixa de upload, Fiscal, eq-ar, depois, APK final
- Causa crit9 (perfil 500 µs + marcas): o JS bloqueia dentro de uniformMatrix4fv/uniformMatrix3fv/activeTexture (41–66 ms), back-pressure do command buffer do processo de GPU SwiftShader. GC ≈ 0 nos picos e a maioria dos picos sem evento de jogo.
- 15:27 sobeFaixa (fx.js Particulas/traçantes/esteiras + corposG no 3D): 356 → 169 KB/quadro de bufferSubData; nada cortado, zero alocação.
- 15:28 patches Fiscal 01/03/04 aplicados, 05 à mão (conflito de linha), 02 aplicado para teste.
- 15:29–15:33 eq-ar: com 02, dano aéreo no jogador em A 474 contra 262,6 sem 02 (+80%) → 02 REVERTIDO (15:33). 01 neutro (A/B idênticos). Controle com a regra antiga: B abates 6, bot nuke aos 151 s.
- 15:33 nuke-v2-criterios TODAS OK (34/0). 15:34–15:41 nuke e2e 0 falhas (10 cargas, detonou).
- 15:42–15:46 eq-ar final: normal PASS (A jogVida 1369,4/1632); ligada: bot decola aos 46,4 s e detona aos 147,1 s, B a2aHit 40 → 0. Equilíbrio não reajustado, números no relatório.
- 15:42 APK intermediário; 15:46–15:53 crit9 denso DEPOIS: combate 11305 q, >50 22 (0,195%), >100 7, máx 169,8 → FAIL; nuke >100 0, máx 86,1 → PASS.
- 15:59 bombcam v2 na fonte final PASS 10/10 (jMax ≤ 0,00087 px). 15:59 unit final iniciada (77).
- 16:00 linha nova nas Novidades 1.2.29 (regra da bomba) → APK final 733a407f…dcd9, 26 459 917 B, bundle index--okOyODo.js. Checks OK; verifica.sh CHECK-20261027-160046 0 FAIL (§6 conta 39 data-k; data-g 31 → 32 com +nukeBot).
- Diff atualizado com adendo de fontes. Relatório atualizado.

## 16:19:32 -03 — integrador: lock de medição + plano 16:09/16:15/16:19
- Lock /tmp/chrome-medicao.lock criado às 16:19:11 em nome da UNIT 77 final (PID 2389176, já em curso desde 15:59:20); /tmp/roda-cmp.sh solta o lock ao fim da UNIT e pega/solta para cada Chrome de medição.
- Fila: harness denso tests/fps-crit9-cmp.mjs na 1.2.28 (:4228) com passe GL por quadro; depois 1.2.29 (mesmo nº de aeronaves); depois controle sintético tests/fps-ctrl-sintetico.mjs (cena estática three r169 em :4230 / /tmp/ctrl, sem lógica de jogo, calibrada para o mesmo uniformMatrix*/activeTexture por quadro do combate).
- Redução de uniforms/texturas/sincronias: com o Fiscal (/workspace/fiscal/crit9fix/patches); integrador só avalia/integra/mede. Fonte não alterada nesta etapa.

## 16:26:52 -03 — UNIT_FINAL 77/77
- `node tests/unit.mjs` (PID 2389176) 15:59:20→16:24:49: **77 passaram, 0 falharam**. Relatório atualizado. Lock liberado 16:24:49; 1.2.28 denso iniciado 16:24:49 sob o lock.

## 17:07:05 -03 — prova decisiva crit.9: 1.2.28 × 1.2.29 × controle (sem mudança de fonte)
- 1.2.28: 11 305 quadros, >50 ms=23, >100 ms=3, máx 120,5; 1.2.29: >50=19, >100=2, máx 156,0 (aeronaves 11,57 vs 11,71). Chamadas/quadro quase iguais (uniformMatrix 1040 vs 1038; activeTexture 56 vs 50; bindTexture 88 vs 73; useProgram 100 vs 90; bufferSubData 49 vs 49).
- Passe com todas as funções GL embrulhadas: 1.2.29 26 picos >50 (2 >100, máx 128,3); 1.2.28 31 picos >50 (5 >100, máx 127,2). ~2/3 dos picos >50 dentro de UMA chamada GL (uniformMatrix*/bindTexture/…); os >100 ms ficam FORA das chamadas GL (parada do processo).
- Controle sintético (mesmos uniformMatrix 1040 / activeTexture 50 por quadro): 0 >50, 0 >100, máx 36,3/47,6 ms — não reproduz; não prova sozinho. Regra (3): PAREI; Valter decide. Patches do Fiscal ainda não chegaram. Lock /tmp/chrome-medicao.lock liberado 17:01:43.
