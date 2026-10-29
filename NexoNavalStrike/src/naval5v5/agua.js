import * as THREE from 'three';
export const LUZ_ESPUMA = { value: new THREE.Color(1, 1, 1) }; /* v1.2.18 item 4: luz ambiente da espuma/esteira (sem brilho próprio) */
// Shader de água "modern naval" otimizado para WebView móvel (WebGL 1, sem textura de profundidade).
// • v1.2.29 item 4: normais multi-escala + SSS Beer + whitecaps por inclinação + reflexo/refração melhores (LOD).
// • 6 ondas de Gerstner (v1.2.3) com cristas agudas (o MESMO GLSL_GERSTNER usado pela física).
// • Gradiente de profundidade: fundo #00172e → costa #004d66 → crista #22a6b3.
// • Fresnel (Schlick) com reflexo do céu, brilho especular Blinn-Phong do sol nas cristas.
// • Espuma de crista por limiar de altura/inclinação; espuma de arrebentação na costa (mapa de profundidade).
// • Espuma de interseção do casco: máscara ANALÍTICA por navio (SDF do plano do casco com proa afilada) enviada
//   em arrays de uniforms (até 10 navios) — funciona em qualquer GPU móvel; inclui onda de proa que cresce com a velocidade.
// • Nível BARATO (qualidade baixa): normal por vértice, sem ruído de detalhe e espuma de casco só nos 4 navios mais próximos.
import { GLSL_GERSTNER } from './gerstner.js';

export const MAX_CASCOS = 10;
export const CORES_AGUA = { fundo: '#0a2633', costa: '#1f5560', crista: '#44747d' }; /* v1.2.9: oceano natural, menos saturado */ /* v1.2.5: azul-esverdeado */

export function shadersAgua(GLSL_CEU, nivel) {
  const def = nivel === 0 ? '#define BARATO\n' : '';
  const vs = def + GLSL_GERSTNER + `
/* v1.2.16: precision highp (ShaderMaterial.precision) */
/* v1.2.30 nuke1230 item 9: anel nuclear — uNk=(cx,cz,t0,A0) uNkP=(c,k,rMax,ativo); ativo=0 → ramo barato */
uniform vec4 uNk; uniform vec4 uNkP;
varying vec3 vW; varying float vCr; varying vec3 vN;
void main(){ vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz; vec3 n; float cr; float atn = 1.0 - smoothstep(2500.0, 7000.0, length(wp.xz - cameraPosition.xz));
  vec3 d = onda(wp.xz, n, cr) * atn; wp += d;
  if (uNkP.w > 0.5) {
    float tau = uT - uNk.z; float r = length(wp.xz - uNk.xy); float cg = uNkP.x; float cf = cg * 2.0; /* cg=grupo, cf=fase */
    float front = cg * tau;
    float ww = max(40.0, 2.2 * 6.2831853 / max(uNkP.y, 1e-4)); float uu = (r - front) / ww;
    if (tau > 0.0 && r > 8.0 && r < uNkP.z && uu > -2.5 && uu < 2.2) {
      float Amp = uNk.w / max(r, 6.2831853 / uNkP.y) * exp(-0.5 * uu * uu) * exp(-tau / 55.0);
      float ph = uNkP.y * (r - cf * tau); float hnk = Amp * cos(ph);
      wp.y += hnk * atn;
      float srd = -Amp * uNkP.y * sin(ph) * atn; /* ∂η/∂r */ /* ∂η/∂r ≈ −A k sin */
      vec2 rd = (wp.xz - uNk.xy) / max(r, 1.0);
      n = normalize(n + vec3(-rd.x * srd, 0.0, -rd.y * srd) * 0.55);
      cr += clamp(hnk * 0.08 + max(0.0, -uu) * 0.35 * (Amp / max(uNk.w / 400.0, 1.0)), 0.0, 1.6); /* espuma na crista do anel */
    }
  }
  vW = wp; vCr = cr * atn; vN = normalize(mix(vec3(0.0, 1.0, 0.0), n, atn)); gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0); }`;
  const fs = def + GLSL_CEU + GLSL_GERSTNER + `
uniform vec3 uFundo; uniform vec3 uCosta; uniform vec3 uCrista; uniform float uLuzAgua; uniform float uAmp;
uniform sampler2D uProf; uniform float uTam; uniform float uNeb; uniform float uChuva; uniform vec3 uFog;
uniform vec4 uCas[${MAX_CASCOS}]; uniform vec4 uDim[${MAX_CASCOS}]; uniform float uNC; uniform float uCurv[${MAX_CASCOS}]; /* v1.2.19 item 3: curvatura da trajetória (rad/m, + = guinada a boreste) */
varying vec3 vW; varying float vCr; varying vec3 vN;
float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float ns(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1, 0)), f.x), mix(hs(i + vec2(0, 1)), hs(i + vec2(1, 1)), f.x), f.y); }
/** Espuma ao redor dos cascos: SDF do plano do casco (proa afilada) + onda de proa e esteira lateral ∝ velocidade. */
/* v1.2.14: meia-boca da LINHA D'ÁGUA igual ao casco 3D (geoCasco: espelho de popa 0,8, meia-nau 0,985, proa cos^0,78 com flare máx. 0,4) — planta REAL de cada classe */
float meiaWl(float u){ float bd = u < 0.1 ? 0.8 + 0.2 * smoothstep(0.0, 0.1, u) : (u < 0.52 ? 1.0 : pow(max(0.0, cos(min(1.0, (u - 0.52) / 0.48) * 1.5707963)), 0.78));
  return bd * (u < 0.52 ? 0.985 : 1.0 - 0.4 * smoothstep(0.52, 1.0, u)) * (u < 0.06 ? 0.93 : 1.0); }
float espumaCasco(vec2 p){ float e = 0.0;
  for (int i = 0; i < ${MAX_CASCOS}; i++) { if (float(i) >= uNC) break; vec4 C = uCas[i]; vec4 D = uDim[i]; vec2 d = p - C.xy;
    if (dot(d, d) > (D.x + 60.0 + D.z * 14.0) * (D.x + 60.0 + D.z * 14.0)) continue;
    float lx = d.x * C.z + d.y * C.w; float lz = -d.x * C.w + d.y * C.z; float u = clamp((D.x - lz) / (2.0 * D.x), 0.0, 1.0);
    float w = D.y * meiaWl(u);
    float sdf = max(abs(lx) - w, abs(lz) - D.x); float spd = D.z;
    float larg = 0.7 + spd * 0.12 + smoothstep(0.62, 1.0, u) * spd * 0.45; /* v1.2.9: espuma de contato FINA */ /* v1.2.1: onda de proa e espuma lateral ∝ nós */ float t = 1.0 - smoothstep(0.0, larg, sdf);
    float n = ns(vec2(lx * 0.55, lz * 0.22 - uT * (1.0 + spd * 0.2))) * 0.6 + ns(vec2(lx * 1.7, lz * 0.9 + uT)) * 0.4;
    float vel = clamp(spd / 12.0, 0.0, 1.0); e = max(e, t * step(-0.6, sdf) * /* v1.2.15: faixa de contato da 1.2.13 de volta (a máscara exata já apaga o que cai dentro do casco) */ smoothstep(0.12 - 0.08 * vel, 0.52, n + 0.45 * t) * (0.3 + 0.35 * vel));
    /* v1.2.15 BIGODE DE PROA: crista de espuma colada à roda de proa (1º quarto do casco), sobe com a velocidade e se dissolve para ré */
    float bp = smoothstep(0.7, 0.98, u) * (1.0 - smoothstep(0.0, 1.2 + spd * 0.22, abs(sdf + 0.2))) * clamp((spd - 2.0) / 10.0, 0.0, 1.0); e = max(e, bp * smoothstep(0.3, 0.7, n + 0.25) * 0.85);
    // ondas de proa divergentes (braços de Kelvin, ~19,5°) que nascem na roda de proa e se abrem para ré
    float sp = lz + D.x; float arm = abs(abs(lx) - sp * 0.36 - w * 0.3); float ka = (1.0 - smoothstep(0.0, 1.5 + spd * 0.16, arm)) * smoothstep(0.0, 6.0, sp) * (1.0 - smoothstep(D.x * 0.5, D.x * 1.5, sp)) * step(0.0, sdf);
    e = max(e, ka * smoothstep(0.25, 0.6, n + 0.2) * clamp((spd - 2.5) / 9.0, 0.0, 1.0) * 0.3);
    // v1.2.3: faixa de esteira turbulenta atrás da popa — comprimento e largura ∝ velocidade, se desfaz com a distância
    /* v1.2.19 item 3: a faixa SEGUE A CURVA — em guinada o caminho já percorrido é um arco de raio 1/k: a ré da popa, à distância s, o eixo da esteira
       desloca (1 − cos ks)/k para o lado do centro da curva (o mesmo lado do leme). Comprimento limitado a ~80° de arco. Reto: k = 0 → idêntico ao anterior. */
    float kc = uCurv[i], ka2 = abs(kc); float ra = lz - D.x; float compE = 25.0 + spd * 14.0; if (ka2 > 1e-5) compE = min(compE, 1.4 / ka2);
    float lxE = lx; if (ka2 > 1e-5 && ra > 0.0) { float ph = min(ra * ka2, 1.4); lxE = lx - sign(kc) * (1.0 - cos(ph)) / ka2; }
    float wE = D.y * (0.9 + ra / max(compE, 1.0) * 1.6);
    float te = step(0.0, ra) * (1.0 - smoothstep(compE * 0.4, compE, ra)) * (1.0 - smoothstep(wE * 0.6, wE, abs(lxE)));
    e = max(e, te * smoothstep(0.3, 0.75, n + 0.35 - ra / max(compE, 1.0) * 0.4) * clamp((spd - 1.5) / 8.0, 0.0, 1.0) * 0.45); }
  return e; }
/** v1.2.15: textura de espuma REAL — rede de bolhas (células de ruído) que se rompe conforme a espuma envelhece/afina (k = densidade). Sem textura nova. */
float renda(vec2 p, float k){ float a = ns(p * 1.9 + uT * 0.07), b = ns(p * 4.3 - uT * 0.11), c = ns(p * 9.7 + vec2(uT * 0.05, 0.0)); float cel = abs(a - 0.5) * 1.3 + abs(b - 0.5) * 0.7 + c * 0.25; return smoothstep(1.0 - k, 1.0 - k + 0.35, cel + k * 0.55); }
/** v1.2.13: o mar NÃO é desenhado dentro do casco (planta da linha d'água um pouco recolhida, proa afilada). D.w = 1: navio vivo. */
bool dentroCasco(vec2 p, float py){ for (int i = 0; i < ${MAX_CASCOS}; i++) { if (float(i) >= uNC) break; vec4 C = uCas[i]; vec4 D = uDim[i]; if (D.w < 0.5) continue; vec2 d = p - C.xy; if (dot(d, d) > D.x * D.x * 1.3) continue;
    /* v1.2.14: SEÇÃO DO CASCO NA ALTURA DA ÁGUA (D.w = borda livre): crista alta perto do convés usa a planta do convés (flare + lançamento da proa ~7%·L) */
    float hy = clamp(py / D.w, 0.0, 1.0); float lx = d.x * C.z + d.y * C.w; float lz = -d.x * C.w + d.y * C.z; if (lz < 0.0) lz /= 1.0 + 0.14 * hy; float u = clamp((D.x - lz) / (2.0 * D.x), 0.0, 1.0);
    float bdk = u < 0.1 ? 0.8 + 0.2 * smoothstep(0.0, 0.1, u) : (u < 0.52 ? 1.0 : pow(max(0.0, cos(min(1.0, (u - 0.52) / 0.48) * 1.5707963)), 0.78));
    float w = D.y * mix(meiaWl(u), bdk, hy);
    if (abs(lx) < w * 0.995 + 0.04 + abs(py) * 0.06 && abs(lz) < D.x * 0.997 + 0.3) return true; } return false; } /* v1.2.16: máscara até o COSTADO (antes recolhida 3% − 12 cm: sobrava faixa de mar dentro do casco) + folga do balanço (|y|·0,06 ≈ adorno de 3,5° na altura da crista) */ /* v1.2.14: máscara na planta real (antes elipse a 86% − 0,3 m: sobrava faixa de mar/espuma dentro do casco) */
void main(){ vec3 V = normalize(cameraPosition - vW); float dc = length(cameraPosition - vW);
  if (dentroCasco(vW.xz, vW.y)) discard;
  vec3 N; float cr = vCr;
#ifdef BARATO
  N = normalize(vN);
#else
  /* v1.2.29 item 4: normais MULTI-ESCALA — Gerstner + 1 oitava meso (2 ns) + micro 1 ns perto; LOD por distância (qualidade ≥ 1.2.28) */
  vec3 dd = onda(vW.xz, N, cr); cr = vCr; float det = 1.0 - smoothstep(140.0, 1100.0, dc); vec2 q = vW.xz * 0.09;
  vec2 q1 = mat2(0.799, 0.602, -0.602, 0.799) * q, q2 = mat2(0.485, -0.875, 0.875, 0.485) * q * 1.73;
  if (det > 0.0) {
    float n1 = ns(q1 + uT * 0.35) - ns(q2 - uT * 0.3);
    N = normalize(N + vec3(n1, 0.0, n1 * 0.9) * (0.16 * det));
  }
  { float dn = 1.0 - smoothstep(16.0, 140.0, dc); if (dn > 0.0) {
      float f1 = ns(vW.xz * 0.62 + uT * 1.1);
      N = normalize(N + vec3(f1 - 0.5, 0.0, (f1 - 0.5) * 0.85) * (0.22 * dn));
      /* v1.2.33b: marolas capilares finas que correm com o vento (só perto da câmera) */ float f2 = ns(vec2(vW.x * 1.35 + uT * 2.1, vW.z * 0.42 - uT * 0.4)) - ns(vec2(vW.x * 0.47 - uT * 0.6, vW.z * 1.6 + uT * 1.7)); N = normalize(N + vec3(f2 * 0.6, 0.0, f2 * 0.45) * (0.12 * dn));
  } }
  float filt = clamp(smoothstep(90.0, 1100.0, dc) + length(fwidth(vW.xz)) * 0.04, 0.0, 0.93); N = normalize(mix(N, vec3(0.0, 1.0, 0.0), filt));
#endif
  float prof = 150.0; vec2 uv = vW.xz / uTam + 0.5; if (uv.x > 0.0 && uv.y > 0.0 && uv.x < 1.0 && uv.y < 1.0) prof = texture2D(uProf, uv).r * 150.0;
  // cor: gradiente de profundidade + realce de crista pela altura da onda
  float hn = clamp(vW.y / max(uAmp, 0.05) * 0.5 + 0.5, 0.0, 1.0);
  vec3 base = mix(uCosta, uFundo, smoothstep(3.0, 45.0, prof)); base = mix(base, uCrista, smoothstep(0.45, 1.0, hn) * 0.28); base += uCrista * (0.03 + 0.08 * hn); /* v1.2.26 I: cristas legíveis */ base *= mix(1.0, 0.86, smoothstep(20.0, 140.0, prof) * (1.0 - hn * 0.6)); /* v1.2.8: água funda mais densa nos cavados */ /* luz que atravessa a massa d'água (azul-petróleo nas faces) */
  /* v1.2.29 item 4: SSS tipo Beer — luz atravessa a crista (espessura ∝ hn e ângulo solar) */
  float sss = pow(max(dot(V, -uSol), 0.0), 2.4) * smoothstep(0.35, 1.0, hn) * 0.62; base += uCrista * sss * 0.72;
#ifndef BARATO
  { float mc = ns(vW.xz * 0.0035 + 3.7); base *= 0.9 + 0.2 * mc; base = mix(base, base * vec3(0.86, 1.04, 1.06), smoothstep(0.55, 0.9, mc) * 0.5);
    float face = clamp(dot(N, -V) * -1.0, 0.0, 1.0);
    float beer = exp(-0.04 * max(prof, 0.5)); /* absorção com profundidade (Beer) */
    base += vec3(0.018, 0.08, 0.09) * beer * smoothstep(0.4, 0.95, hn) * (0.4 + 0.6 * max(uSol.y, 0.0)) * (1.0 - face * 0.35) * uLuzAgua;
  }
#endif
  float NdL = max(dot(N, uSol), 0.0); base *= (0.52 + 0.48 * NdL) * uLuzAgua;
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 4.5); /* Schlick mais agressivo nas vistas rasantes */
  { /* refração Snell + tintura de fundo melhorada */ vec3 Rf = refract(-V, N, 0.75); float kRf = step(0.001, dot(Rf, Rf));
    vec3 tint = mix(uCosta * 1.22, uFundo * 0.85, smoothstep(1.5, 38.0, prof));
    float kSee = (1.0 - fres) * (0.38 + 0.22 * smoothstep(0.0, 12.0, prof)) * kRf;
    base = mix(base, tint * (0.65 + 0.4 * NdL) * uLuzAgua, kSee); }
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec2 sx = normalize(uSol.xz + vec2(1e-4)); vec2 rx = normalize(R.xz + vec2(1e-4)); float faixa = pow(max(dot(rx, sx), 0.0), 18.0) * (1.0 - uNoite); /* reflexo de cor só na FAIXA DO SOL */
  vec3 cr0 = ceu(R); float lum = dot(cr0, vec3(0.3, 0.45, 0.25)); vec3 ceuEsc = mix(vec3(0.05, 0.11, 0.19), vec3(0.18, 0.28, 0.4), clamp(lum, 0.0, 1.0)) * (0.55 + 0.45 * lum);
  vec3 c = mix(base, mix(ceuEsc, cr0, 0.40 + 0.60 * faixa), clamp(fres, 0.0, 0.86)); /* v1.2.29 item 4: reflexo céu mais limpo */
  /* especular: Blinn duro + lóbulo médio (aprox. GGX barato) nas cristas */
  vec3 H = normalize(V + uSol); float nh = max(dot(N, H), 0.0); float cristaW = 0.40 + 0.60 * smoothstep(0.28, 0.92, hn);
  float sp = (pow(nh, 520.0) * 2.1 + pow(nh, 64.0) * 0.28 + pow(nh, 10.0) * 0.04 * faixa) * cristaW * (0.22 + 0.78 * faixa);
  sp *= 1.0 - 0.8 * smoothstep(70.0, 230.0, cameraPosition.y);
  c += uCorSol * sp * (1.0 - uChuva * 0.8) * (1.0 - uNuvem * 0.75);
#ifndef BARATO
  { /* v1.2.33b: CINTILAÇÃO do sol — facetas minúsculas que piscam no caminho do sol (glitter) */ float gl = ns(vW.xz * 2.3 + vec2(uT * 1.7, -uT * 0.9)) * ns(vW.xz * 3.7 - vec2(uT * 1.3, -uT * 1.1)); float spk = smoothstep(0.62, 0.9, gl) * pow(nh, 36.0) * (0.15 + 0.85 * faixa) * (1.0 - smoothstep(80.0, 1400.0, dc)) * (1.0 - uNoite); c += uCorSol * spk * 2.2 * (1.0 - uNuvem * 0.85) * (1.0 - uChuva); }
#endif
  // espuma: cristas (limiar de inclinação/altura), arrebentação e cascos
#ifdef BARATO
  float rn = 0.5;
#else
  float rn = ns(vW.xz * 0.7 + uT * 0.2);
#endif
  /* v1.2.29 item 4: whitecaps por inclinação (1-Ny) + altura — espuma de crista e esteira mais legíveis */
  float slope = 1.0 - clamp(N.y, 0.0, 1.0);
  float espC = smoothstep(0.38, 0.78, cr + (rn - 0.5) * 0.38 + slope * 1.4) * smoothstep(0.36, 0.88, hn) * 0.48 * (0.6 + 0.55 * rn) * (1.0 - smoothstep(380.0, 2000.0, dc));
  float espR = (1.0 - smoothstep(0.3, 3.6, prof)) * (0.38 + 0.48 * ns(vW.xz * 0.55 + uT * 0.55)) * (0.5 + 0.5 * smoothstep(0.28, 0.88, hn));
  float espH = espumaCasco(vW.xz);
  float esp = clamp(max(max(espC, espR), espH * 0.88), 0.0, 0.94);
#ifndef BARATO
  { float k = clamp(esp * 1.25, 0.0, 1.0); float rd = renda(vW.xz * 0.55, k); float fino = 1.0 - smoothstep(20.0, 420.0, dc); esp *= mix(1.0, 0.35 + 0.95 * rd, fino); /* v1.2.15: espuma com rede de bolhas que se desfaz (longe: média) */
    c = mix(c, mix(c, vec3(0.34, 0.46, 0.47) * uLuzAgua, 0.5), clamp(espH * 1.4, 0.0, 1.0) * 0.3 * fino); /* v1.2.18 item 4: aerada verde-acinzentada (sem 'neon') */ } /* água aerada turquesa sob a espuma */
#endif
  vec3 corE = vec3(0.88, 0.915, 0.935) * (0.32 + 0.64 * max(uSol.y, 0.15) * (0.75 + 0.25 * max(dot(N, uSol), 0.0))) * max(uLuzAgua, 0.3); /* v1.2.29: espuma um pouco mais limpa */
  c = mix(c, corE, esp);
  float f = 1.0 - exp(-uNeb * uNeb * dc * dc); c = mix(c, uFog, clamp(f, 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0); }`;
  return { vs, fs };
}
