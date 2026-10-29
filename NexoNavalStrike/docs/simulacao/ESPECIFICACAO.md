# Nexo Naval Strike: especificação de simulação, VFX e áudio (v1.2.53)

## 0. Premissa de plataforma

O pedido original fala em DirectX 12, Vulkan, UE5/HDRP e compute shaders. O jogo real roda em outra plataforma: **three.js r169 (WebGL2 / GLSL ES 3.0) dentro de um WebView Android (Capacitor)**, com Web Audio (AudioWorklet) no áudio.

WebGL2 **não tem compute shaders, indirect draw nem buffers de GPU graváveis**. Por isso cada técnica abaixo foi traduzida para o equivalente que roda a 60 FPS num celular médio:

| Pedido (AAA) | Implementação real no jogo |
|---|---|
| GPU particle buffers + indirect draw | Pools **fixos** de partículas (`Particulas`, ring buffer pré-alocado), 1 draw call por pool, upload só da faixa suja (`sobeFaixa`). |
| Raymarching volumétrico de fumaça | Billboards com textura fractal (billow) + **fase de Henyey-Greenstein**, **Beer-Lambert** e **turbulência tipo curl noise** no vertex shader. |
| Malha FFT + mapa de alturas transiente | Gerstner (6 ondas) + **pacotes de onda de impacto analíticos** no vertex shader (até 6), + anel nuclear. |
| Thread de áudio dedicada | AudioWorklet (thread de áudio do navegador) + **gerenciador de vozes com camadas e virtualização** na thread de jogo. |

---

## 1. Hidrodinâmica de superfície e colunas d'água

### 1.1 Energia e altura da coluna

$$E_k = \tfrac12 m v^2 + E_{\text{química}}, \qquad h = \frac{\eta\,E_k}{m_w\,g}$$

Na prática, o jogo usa a altura parametrizada por calibre (`PARAM.calibre.colunaAlt`, fator `f = (cal−57)/(305−57)`) e por classe. Cada gota recebe a velocidade balística $v_{y0}=\sqrt{2gh}$, e a vida da gota é o tempo de voo $2v_{y0}/g$.

### 1.2 Matriz de resposta (`colunaTipo`)

| Classe | f mín. | Altura | Largura | Densidade | Comportamento |
|---|---|---|---|---|---|
| Leve (< 40 mm) / AA (`geiser`) | 0 | ×0,4–0,6 | ×0,5 | baixa | spray laminar, micro-gotas, vida curta |
| Artilharia 127–460 mm (`canhao`) | `fc(cal)` | ×1 | ×1 | média | pilar central + colar cônico + spray que se rompe no ápice (Rayleigh-Plateau ≈ coroa) |
| Míssil | 0,72 | ×1,25 | ×1,35 | ×1,25 | coluna + fogo/fumaça |
| Torpedo / carga de profundidade | 0,85 | ×1,55 | ×1,7 | ×1,6 | bolha (fases), upwelling, colapso em cascata, 2 trens de onda |

### 1.3 Arrasto quadrático do ar (implementado)

$$\frac{d\vec v}{dt} = \vec g - k\,|\vec v|\,\vec v,\qquad k=\frac{\rho_{ar} C_d A}{2m}\approx 0{,}004\ \text{m}^{-1}$$

Integração semi-implícita estável: $\vec v \leftarrow \vec v / (1 + k|\vec v|\Delta t)$, dentro de `Particulas.passo` (só no pool de água).

### 1.4 Retorno de momento ao mar (implementado)

O impacto e o **colapso** da coluna (em $t \approx 1{,}6\,v_{y0}/g$) criam pacotes radiais de ondas de gravidade em águas profundas:

$$\omega=\sqrt{g k},\quad c_g=\frac{\omega}{2k},\quad \eta(r,\tau)=A\,e^{-\tau/4}\,\frac{\cos(kr-\omega\tau)}{1+0{,}22\,kr}\,S(r)$$

- `S` é o envelope que corta à frente de $2c_g\tau+\lambda/2$.
- Há uma depressão central inicial (cratera) com $\tau<1{,}2$ s.
- A normal recebe $\partial\eta/\partial r$, e a crista positiva vira espuma (`vCr`).
- O torpedo gera 2 trens de onda: o upwelling da bolha e o colapso 3,2 s depois.
- Código: `IMP_ONDAS` / `uImp[6]` em `src/naval5v5/agua.js`, alimentado por `fx.coluna`, `colunaTorpedoFases` e `impactoAeronave`.

---

## 2. Fumaça, dispersão e mísseis

### 2.1 Rastro de míssil

- Fica num **pool próprio** (`fx.trilha`), para não reciclar partículas e não "correr atrás" do míssil.
- As partículas são emitidas por **distância** (espaçamento fixo de 6 m, até 16 por quadro). Isso equivale a amostrar a curva da trajetória, sem buracos nem corte duro.
- Cada partícula nasce **parada no ar**, sem herdar a velocidade do míssil.
- Ela engorda ($\dot r = 1{,}25$–$1{,}7$ m/s), sofre cisalhamento pelo vento global e perde opacidade sem perder volume.

### 2.2 Ótica da fumaça (shader `FS_PT`)

- Fase de Henyey-Greenstein, normalizada pelo espalhamento isotrópico, com $g=0{,}7$:

$$p(\theta)=\frac{1-g^2}{(1+g^2-2g\cos\theta)^{3/2}}$$

- Transmitância de Beer-Lambert: $T=e^{-3\rho}$. O brilho de contraluz só aparece no véu fino.
- Luz da cena: a cor da fumaça é multiplicada pela luz ambiente do horizonte, então fica dourada no pôr do sol e escura à noite.
- Turbulência: o campo rotacional é desenhado para parecer curl noise. É rotacional por construção, mas não é exatamente livre de divergência. É avaliado no vertex shader com deslocamento proporcional ao tamanho do puff.
- **Resfriamento da fuligem:**
  - A cor nasce como carbono marrom-acinzentado (nunca preto puro, luminância ≥ 0,13).
  - Ela relaxa para vapor cinza (0,60; 0,61; 0,63) à taxa $0{,}2(1-t)$ por segundo.
  - O alfa é quadrático na textura: miolo cheio, bordas finas.

---

## 3. Detonação nuclear

### 3.1 Frente de choque (implementada em `src/sim/nuclear.js`)

Sobrepressão de pico (Kinney-Graham), com distância escalada $Z = R/W^{1/3}$ e $W = 1$ kt TNT ($W^{1/3}=100$):

$$\frac{\Delta P}{P_0}=\frac{808\,[1+(Z/4{,}5)^2]}{\sqrt{1+(Z/0{,}048)^2}\sqrt{1+(Z/0{,}32)^2}\sqrt{1+(Z/1{,}35)^2}}$$

Velocidade da frente (Rankine-Hugoniot), com $\gamma=1{,}4$ e $c_0=343$ m/s:

$$v_s=c_0\sqrt{1+\frac{\gamma+1}{2\gamma}\frac{\Delta P}{P_0}}$$

- $R(T)$ é integrado uma vez por RK2 ($\Delta t=10$ ms, 90 s), numa tabela determinística.
- `atrasoChoque(d)` é a inversa por busca binária.
- O render (`CURVA.choque`) usa **a mesma** função `raioChoque`. Assim o anel visível e o empurrão físico chegam juntos.

Valores obtidos:

| T (s) | R (m) | ΔP/P₀ |
|---|---|---|
| 0,1 | 125 | 6,13 |
| 1 | 525 | 0,26 |
| 5 | 1 949 | 0,045 |
| 20 | 7 140 | 0,012 |

### 3.2 Impulso nos navios: torque e inércia

A força lateral é $F = p\,f_c\,A_{\text{lat}}$, com $A_{\text{lat}}=L\cdot F$ (borda livre). Ela atua a $F/2$ acima da linha d'água. As inércias por unidade de massa são:

$$I_{roll}=\frac{B^2+(2\,KG)^2}{12},\qquad I_{pitch}=\frac{L^2+T^2}{12},\qquad \Delta\dot\phi=\frac{F\cdot F/2}{m\,I_{roll}}$$

- O impulso vira **velocidade angular** (`balV`, `catV`).
- A mola-amortecedor de `hidro.js` integra adernamento e rolamento reais, sem salto de ângulo. Também sobra uma lista residual pequena e há impulso de avanço e guinada.
- Sem dano letal a aliados.

### 3.3 Convés de voo

Hoje, a parte arrancada das aeronaves do convés visível é proporcional à intensidade da frente (até 50% com $f_c$ = 1, sempre sobra pelo menos uma). As mais próximas do ponto zero saem primeiro. Isso **ainda não** é o critério de atrito estático ($I > \mu_s g\,\Delta t$); ele fica como próximo passo.

Daí ela vira corpo físico: gravidade, contato com o casco (restituição 0,2, atrito de Coulomb 0,4), queda no mar, flutuação e afundamento (v1.2.50).

### 3.4 Aeronaves em voo

| Faixa | Efeito |
|---|---|
| Raio crítico (< 0,45 × raio aéreo) | Inimigas: desintegração (`derrubaAereo`). |
| Raio médio | **STALL** (`passoTurbulencia`): perde sustentação (até 22 m/s de afundamento), rola e guina sem controle por 2,5–7,5 s, em sentido determinístico pelo índice; o piloto recupera suavemente. |
| Perto do mar | Se o stall levar a menos de 4 m da água: queda. |

### 3.5 Som da detonação

- O som chega com atraso $t=d/343$, filtrado por passa-baixa dependente da distância.
- Há silêncio entre o clarão e a chegada da frente.
- A fila de sons atrasados é fixa, sem criar nós novos.

---

## 4. Áudio: DSP e concorrência

### 4.1 Cadeia mestre (já existente)

Teto → passa-alta a 85 Hz (2×) → peaking 240 Hz a −1,5 dB → passa-baixa 14 kHz → limitador (−8 dB, joelho macio) → ganho 0,8 → softclip `tanh` (máx. 0,84).

- O corte a 85 Hz já remove o infrassom inútil (abaixo de 25 Hz) e economiza headroom.
- **Pico medido na v1.2.53: 0,558** (sem clipping).

### 4.2 Gerenciador de concorrência (implementado em `NavalAudio._voz`)

| Camada | Conteúdo | Peso |
|---|---|---|
| 0 Crítico | nuclear, UI, impacto no próprio navio | ×8 |
| 1 Tático | canhões, mísseis, explosões | ×2 |
| 2 Secundário | granadas, defesa, outros | ×1 |
| 3 Ambiente | respingos, passagens | ×0,6 |

Regras, na ordem:

1. Voz abaixo de −40 dB não ocupa canal.
2. **Rajada:** o mesmo som em menos de 30 ms e menos de 250 m vira uma voz só, com soma de potência.
3. Acima de 24 vozes físicas, as camadas 2–3 viram **virtuais** (só contadas, sem nó nem DSP).
4. Entre 16 e 24 vozes, a camada 3 é descartada com $p=(n-16)/8$.
5. Uma camada cheia rouba a voz mais fraca **da camada**. O pool cheio (32) rouba a mais fraca global. A prioridade vale ganho × peso / (1 + 2·idade).
6. Osciladores acima de Nyquist (0,45·fs) não são criados (antes geravam aliasing e gastavam CPU).

Referência compilável em C++17: `AudioConcurrencyManager.hpp` + `teste_audio.cpp`.

```
g++ -std=c++17 -O2 -Wall -Wextra teste_audio.cpp -o teste_audio && ./teste_audio
```

Resultado: 0 avisos, saída 0, e a detonação nuclear sempre ganha canal.

---

## 5. Estruturas de shader (GLSL ES 3.0, como implementado)

```glsl
// Água — ondas de impacto (vertex shader do mar)
uniform vec4  uImp[6];   // (x, z, t0, A) — A = 0 → inativa
uniform float uImpK[6];  // número de onda k = 2π/λ

// Partículas (todos os pools)
attribute vec3 cor; attribute float al; attribute float tam;      // cor, alfa, tamanho (CPU, faixa suja)
uniform float uT;      // relógio comum (turbulência)
uniform float uTurb;   // 0 água/brilho · 0,7 rastro · 1 fumaça
uniform vec3  uSol;    // direção do sol (Henyey-Greenstein)
uniform vec3  uLuz;    // luz ambiente da cena
uniform float uDens;   // densidade ótica do pool (fumaça 0,6 · rastro 0,62)
uniform float uAgua;   // 1 = textura de spray (lençol + filetes + gotas), sem giro
```

Curva de densidade da fumaça ao longo da vida ($t$ de 1 a 0):

$$\alpha = a_0\cdot\min(1,\,2{,}2t)\cdot\big[t>0{,}92 ? (1-t)/0{,}08 : 1\big]\cdot \text{tex}_a^2\cdot 1{,}25\cdot uDens$$

O tamanho cresce linearmente com `cresce`. O vento atua como $\Delta v = 0{,}3\,\vec w\,\Delta t$. A gravidade é negativa (a fumaça sobe) ou positiva (as gotas caem). Uma gota que volta ao mar morre na hora, e nenhuma partícula de fumaça passa da superfície do mar.

---

## 6. Orçamento de quadro (alvo: 60 FPS, 16,6 ms, celular médio Adreno 6xx / Mali-G7x)

Estes valores são **metas de projeto**, não medições no aparelho. O teste automatizado roda em CPU (SwiftShader) e não serve para cronometrar a GPU de um celular.

| Sistema | Thread | Orçamento |
|---|---|---|
| Simulação (passo fixo 60 Hz, física, IA, balística) | jogo | 3,0 ms |
| Partículas: atualização de 5 pools (≈ 12 k slots) + upload da faixa suja | jogo | 1,6 ms |
| Lógica de render (poses, LOD, traçantes instanciados) | jogo | 1,4 ms |
| Áudio: gerenciador de vozes (O(32) por pedido) | jogo | 0,2 ms |
| Mixer AudioWorklet (≤ 32 vozes + cadeia mestre) | áudio | ≤ 2,5 ms por bloco de 128 amostras, em paralelo |
| GPU: mar (Gerstner 6 + impactos 6 + nuclear) | GPU | 3,5 ms |
| GPU: navios, terreno e céu | GPU | 4,5 ms |
| GPU: partículas (5 draw calls aditivas/alfa, overdraw limitado) | GPU | 2,5 ms |
| GPU: pós/tonemapping | GPU | 1,0 ms |
| **Folga** | — | **≈ 1,8 ms** |

Proteções que já existem:

- Degradação automática das emissões com ocupação acima de 70% (até 35%).
- LOD de efeitos por distância.
- Qualidade BAIXA/MÉDIA/ALTA por memória do aparelho.
- Nenhuma alocação por quadro nos efeitos.

---

## 7. Evolução da detonação (v1.2.54, com base nos vídeos de referência do Valter)

- **Fase 0:**
  - Véu do clarão com queda radial (sem branco chapado) e aberração cromática nas bordas.
  - Reflexos de lente (7 fantasmas de bokeh na linha entre a bola de fogo e o centro da tela).
  - Faixa de brilho da bola de fogo no mar.
- **Fase 1:**
  - Cúpula do choque visível como vidro ondulado.
  - **Dupla** nuvem de Wilson: a frente direta e a reflexão no mar, mais baixa e 0,35 s atrasada.
  - Coroa de spray branco onde a frente toca a água, no arco voltado para a câmera.
  - Cortina de spray no casco de cada navio atingido.
  - Destroços lançados da haste.
- **Fase 2:**
  - Bola de fogo com convecção turbulenta (domain warping) e bolsões de fuligem ao esfriar.
  - Capa em couve-flor (lóbulos de Rayleigh-Taylor), de fuligem cinza-escura com brasas, que clareia com a condensação (45 a 130 s).
  - Haste escura com fogo por dentro.
  - Anel de condensação fino em volta da haste.
  - Base de fumaça escura rolando.
  - Muralha de spray branco na frente da onda de superfície.
  - Borda prateada (Henyey-Greenstein) contra o sol.
- **Som:**
  - Silêncio do ambiente (15%) entre o clarão e a chegada da frente.
  - Estalo, estrondo e rolamento.
  - **Vento de retorno**: ruído rosa com banda de 180 a 880 Hz, 7 s, que chega 3,5 a 7,5 s depois da frente.
- **Concorrência de áudio:** os sons sintetizados (ruído e osciladores) entram no mesmo controle de concorrência (teto de 28 nós; acima de 18, as camadas abaixo de −22 dB viram virtuais).

---

## 8. Refinos da v1.2.56 (pedido com prints da partida)

### 8.1 Frente de choque oceânica: lâmina contínua (substitui os tufos)

Malha `CylinderGeometry(1, 1, 1, 160, 1, aberta)` com shader `VS_CORT`/`FS_CORT` em `nuclearFx.js`. São duas instâncias.

| Parâmetro | Lâmina do choque | Base surge |
|---|---|---|
| Raio | $\sqrt{R_{choque}(T)^2 - y_0^2}$ (viaja com a frente física) | `CURVA.surge(T)` |
| Altura | 30 + 70·k (k = 1 − smoothstep(5, 14, T)) | 60 + 160·(1 − e^(−(T−2)/5)), cai à metade entre 25 e 60 s |
| Abertura para fora (topo) | +12% | +20% |
| Alfa máximo | 0,85 × 0,75 (≈ 0,64), só rente à água: $(1-y)^{1,8}$ | 0,7 × 0,75 |
| Textura | ruído de valor em 3 escalas, esticado na vertical (420 × 3, 1134 × 6,6, 2940 × 15): filetes de micro-gotas, nada esférico | idem |
| Dissipação | fade entre 5 e 14 s | entre 28 e 70 s |

O spray no casco dos navios atingidos usa gotas finas: tamanho 2,5–6 m e alfa 0,4.

### 8.2 Colunas d'água translúcidas

Pool de água com textura de spray.

- O miolo (alfa da textura > 0,5) recebe **cor de luz atravessando a água** (0,60; 0,83; 0,86) e **50% menos opacidade**.
- O branco fica só nas bordas rasgadas e nas gotas.
- Alfa global × 0,85.
- Arrasto quadrático $k = 0{,}004\ \text{m}^{-1}$.
- A gota que volta ao mar morre na hora.
- O colapso gera ondas reais na malha (§1.4).

### 8.3 Rastros

| Rastro | Tamanho inicial | Crescimento | Alfa | Comportamento |
|---|---|---|---|---|
| Míssil, booster | 1,5 m (estreito no bocal) | 2,8 m/s | 0,36 | abre em leque |
| Míssil, cruzeiro | 1,1 m | 2,1 m/s | 0,28 | abre em leque |
| Bombardeiro, núcleo | 1,0–1,6 m | 4,6 m/s | 0,55 | vida 9–13 s |
| Bombardeiro, véu | — | — | 0,18 | — |

Comum aos rastros:

- Turbulência tipo curl noise (`uTurb` = 1).
- **Dessaturação** (`desat`): a cor relaxa para névoa (0,84; 0,85; 0,86) à taxa $0{,}22(1-t)$ por segundo.

### 8.4 Disparo de mísseis (máquina de estados)

```js
// world.js — prontidão: VLS só bloqueia DESTRUÍDO (avaria < 0,08); avariado (< 0,3) dispara 1 por vez com recarga ×2
const tem = n.C.vls && n.C.missil && n.vls > 0 && (!n.avaria || n.avaria.vls >= 0.08);
// lancaMissil: if (n.avaria.vls < 0.3) qtd = 1;  ...  n.tVls = recargaVlsSeg(n.tipo) * (n.avaria.vls < 0.3 ? 2 : 1);

// combat3D — FILA de re-engajamento: recarregando / travando / mirando → o pedido fica 8 s na fila e sai sozinho
if (n.tVls > 0 || !pr.ok) { if (n.tVls > 0 || /^(travando|travandoMis|mira)$/.test(pr.motivo)) this._filaVls = { alvo: n.alvoId, ate: sim.t + 8 }; return; }
// a cada quadro: if (prVls.ok && n.tVls <= 0) dispara; descarta se trocar de alvo ou expirar

// passoMisseis — ALVO PERDIDO: 1 tentativa de readquirir inimigo no cone ±30° até 4 km; senão deriva balística
```

- O lançador nunca fica preso por haver mísseis em voo ou na fase terminal. O jogo não tinha esse limite; o bloqueio real era o VLS avariado aparecendo como "VAZIO".
- O HUD agora mostra **DESTRUÍDO** quando o VLS está destruído com mísseis no paiol.

### 8.5 Perfil de mixagem dos canhões

| Etapa | Valor |
|---|---|
| Ganho base, categoria `canhao` | 0,56 → **0,36** (−3,8 dB) |
| `ganhoCalibre` | ×1,25 → ×0,9 (−2,9 dB) |
| Camada grave `ganhoCamCanhao` | ×1,22 → ×0,95 (−2,2 dB) |
| **Total** | **≈ −7 dB nos canhões (−9 dB na camada grave)** |
| Atenuação de agudos com a distância | $f_c = \max(280,\ 20000/(1+d/320))$ Hz. A 320 m: 10 kHz; 1 km: 4,8 kHz; 3 km: 1,9 kHz; 6 km: 1 kHz |
| Barramento de armamento (canhão + lançadores) | prateleira −4 dB acima de 5,5 kHz → compressor (limiar −20 dB, joelho 12 dB, 4:1, ataque 3 ms, soltura 250 ms) → ganho de compensação +1,9 dB |
| Mestre (inalterado) | passa-alta 85 Hz (2×), limitador −8 dB, softclip tanh 0,84 |
| Pico medido | **0,541** (antes 0,567) |

### 8.6 Pintura dos bombardeiros

- **Cores do Brasil mescladas:** faixas onduladas no espaço do modelo (verde #009c3b, amarelo #ffdf00, azul #002776 e filete branco), com semente diferente por papel.
- **Iniciais** V (líder), R (ala 1) e A (ala 2) no dorso e nas duas asas, com o mesmo degradê, contorno branco e escuro.
- Os decalques são colados por raycast na superfície real do modelo.

---

## 9. Travamentos ligados ao áudio: diagnóstico e solução (v1.2.57)

**Diagnóstico.** Usei o perfilador de CPU (Chrome DevTools Protocol) numa batalha de 40 s com o build sem minificação. A síntese dos bancos de som rodava na thread do jogo **durante o começo da batalha**:

- funções `ruido`, `estereo.rt`, `geraAA`, `bqStep`, `graos`, `caudaDifusa`, `reverb`, `geraJogador`, `_nukeEmenda`;
- em lotes com `setTimeout(0)`, que competiam com cada quadro.

**Solução:**

1. **Web Worker** (`src/audio/sintWorker.js`): os bancos (motor e granadas, sons do jogador, nuclear, aeronaves e água) são calculados numa thread separada. Os `Float32Array` voltam por **transferência**, sem cópia. Depois disso, o perfil da batalha não tem mais nenhuma função de síntese na thread principal.
2. **Cache persistente (IndexedDB)** em `src/audio/cacheSom.js`, com a chave versão + taxa de amostragem. Da 2ª abertura em diante, os sons vêm prontos do aparelho e não há síntese nenhuma.
3. Se o Worker ou o IndexedDB faltarem, o jogo cai automaticamente no caminho antigo, sem quebrar.
4. **AudioContext `latencyHint: 'balanced'`**: o buffer de saída fica maior, então o mixer (AudioWorklet) não fica sem CPU no celular (sem estalos nem engasgos). A latência continua imperceptível.
5. Mantido de antes: concorrência por camadas, virtualização (incluindo síntese ao vivo), envio ao mixer por transferência e osciladores acima de Nyquist descartados.

**Outros ajustes da v1.2.57:**

- Anel nuclear no mar: decai com $e^{-\tau/30}$, apaga entre 55 e 110 s e é removido aos 120 s, na física e no shader.
- Bomba: +4,5 dB (pico medido 0,53).
- Fumaça: densidade 0,46; rastros 0,42.
- Granadas: brasa leve e rastro fino de fumaça.
- Foguetes: rastro fino.
