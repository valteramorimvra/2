# NOTAS-FISICA — bomba atômica (Nexo Naval Strike 3D)

Referência prática para o Architect. Unidades SI (m, s, kg). Valores **recomendados para jogo** (mid-range Android / WebGL), não nuclear real.

## 1. Dano (cap 50% HP)

Valter: máx **50% da vida** do navio, caindo com a distância; fogo amigo = 0.

```
danoFrac(d) ∈ [0, Dmax],  Dmax = 0.5
danoAplicado = C.vida * danoFrac(d) * blind   // nunca força kill
```

**Recomendado (queda contínua, sem platô flat):**
```
R0 = 800 m      // perto: quase Dmax
Rp = 2500 m     // médio
Rb = 5000 m     // borda → 0

danoFrac(d) =
  d <= 0     → Dmax
  d >= Rb    → 0
  d <= R0    → Dmax * (1 - 0.15 * d/R0)           // 0.50 → ~0.425
  d <= Rp    → Dmax * (0.425 → 0.18) linear
  else       → Dmax * 0.18 * ((Rb-d)/(Rb-Rp))^1.3
```

**Estado atual do patch:** platô flat `Dmax` de 0→1500 m, depois cai (ver REVISAO-PATCH #1). Cap 50% e fogo amigo OK.

## 2. Onda de choque (ar) — raio × tempo

Modelo Sedov-Taylor **escalado** (só para timing/visual; não simular blast real):

```
R(t) ≈ ξ (E/ρ)^{1/5} t^{2/5}     // ar, explosão pontual
```

No jogo, frentes longas ≈ som:
```
vChoque ≈ 343 m/s além de ~400 m
atraso(d) = d/v + τ0*(1 - exp(-d/d0))/v
  // atual: τ0=520, d0=171 → OK como curva suave supersônica→sônica
```

Intensidade (overpressure proxy):
```
fatorChoque(d) = max(0, 1 - d/Rchoc)^p ,  Rchoc ≈ 8000, p ≈ 1.4
// ou físico-lite: ~ 1/(1+(d/R*)^2)  com R*≈2200
```

**Impulso em navio (massa/escala):**
```
I_nav = I0 * fatorChoque(d) * (Mref / max(M, Mref*0.2))
I0 ≈ 12…25 m/s   // Δv radial no casco (NÃO 42×0.35 com platô alto — ver revisão)
M ≈ k * L * B * T  (proxy: L*B*calado)  ou  Mref/(L/Lref)
yaw:  ω += ω0 * fc * sin(θ_blast) * (Lref/L)
lista: Δφ ≈ 0.08…0.18 rad * fc
```

**Impulso em aeronave:**
```
I_air = I0a * fatorChoque(d) * (mRef / max(m, 0.15*mRef))
I0a ≈ 40…90 m/s para heli/caça; UAV menor massa → mais Δv
```

## 3. Onda de superfície (item 9)

Cilíndrica em águas profundas (energia ~1/r):
```
k = 2π/λ
c_fase = √(g/k)           // atual: λ=280 → c≈20.91 m/s ✓
c_grupo = c_fase / 2      // pacote de energia (recomendado p/ frente do envelope)
```

Amplitude no pico do pacote (u=0):
```
Amp(r,τ) = (A0 / max(r, λ)) * exp(-½u²) * exp(-τ/τd)
u = (r - c_env*τ) / w ,  w ≈ 2.2 λ ,  τd ≈ 55 s
```

| A0 | Amp@500 m | Amp@4 km | Uso |
|----|-----------|----------|-----|
| **4.2e4 (atual)** | **~54 m** | ~0.32 m | **insano p/ flutuação** (destrói visual; freeboard real ~5–10 m) |
| **6e3** | ~6–8 m | ~0.05 m | **recomendado** — balança forte perto, suave longe |
| 3e3 | ~3–4 m | ~0.02 m | conservador (“balançar um pouco”) |

Água rasa (se profundidade `h` conhecida e `kh <~ 1`):
```
c ≈ √(g h)     // em vez de √(g/k)
```
No mapa atual (mar aberto / ilhas), **híbrido** é melhor:
```
c_env = mix( √(g/k)/2 , √(g*h_eff) , w )  com h_eff≈80…150 m perto da costa
```
Ou, simples: `c_env = 0.5 * √(g/k) ≈ 10.5 m/s` (grupo) — anel chega ~2× mais lento, mais legível.

Clamp de heave no casco: `heaveNuke = clamp(Amp, -8, +8)` m antes de `atan` pitch/roll.

## 4. Destroços / árvores / estruturas

Balística:
```
v̇ = ĝ*(-g) - k_d * |v| * v     // arrasto quadrático (frame-rate independent)
// NÃO: vx *= 0.992 por frame (depende de Hz)
k_d ≈ 0.015…0.04 (árvore); 0.008 (metal pesado)
pool: ≤ 48 corpos; instanced + LOD; morrer se y<-2 ou t>12 s
```

Limiares de quebra (energia estrutura já em `energiaArma('nuclear')=[900,4200]`):
```
árvore:   fc > 0.08…0.12 e d < 4200  (OK)
ponte:    HP alto — OK com E=900
montanha: fora de T.estr — correto
```

## 5. Vibração do telefone

```
i = fatorChoque(dJog) ∈ [0,1]
padrão ms ∝ i   // atual vibraPadrao OK
// emitir UMA vez (evitar fila FX + evento nkVibra = double)
```

## 6. Fim de partida (~7 s)

```
nkEspetaculoAte = t_detona + 7
match: segura `fim` enquanto t < nkEspetaculoAte
UI: NÃO somar outro +7 s se o match já esperou
```

## 7. Performance (obrigatório)

- `NUKE_ONDAS.length===0` → early return (já feito)
- shader: `uNkP.w==0` skip (já feito)
- pools estáticos; **zero** `new` / `clone` / `find` em hot path após 1ª detonação
- máx 2 anéis; 1 no shader
- partículas puff: pool já em nuclearFx; não crescer sem bound
- evitar `cena.traverse` a cada detonação se possível (cache lista `arvNuke` no load)

## 8. Anti-NaN

- `r = hypot(...) || 1` antes de dividir (já em impulsos)
- Amp: `max(r, λ)` (já)
- shader: `max(uNkP.y, 1e-4)`, `max(r, 1.0)` (já)
- nunca `splice` em array enquanto outro sistema itera sem cópia
