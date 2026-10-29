// Nexo Naval Strike v1.2.26 — RENDER da arma nuclear: bombardeiro 'Urubu-rei' (id 'bombardeiroNuclear', modelo do navios1226), bomba + paraquedas, e a DETONAÇÃO:
//  clarão (pulso duplo) → bola de fogo (ruído procedural) → esfera de choque + nuvem de condensação (Wilson) → anel de choque na água →
//  coluna d'água / base surge → COGUMELO (haste + capa toroidal que ROLA, sobe e se expande; incandescente no início) → céu escurece/clareia.
// Desempenho: TUDO criado no carregamento (memória estática, 0 alocação/0 programa novo em combate). Puffs = 1 InstancedBufferGeometry
// (1 draw call para cogumelo+haste+coluna+surge; ordenação de trás p/ frente na CPU; LOD por qualidade e por distância). Total ≤ 7 draw calls no pico.
// Luzes: NENHUMA luz nova (recompilaria todos os sombreadores); modula sol/hemi/exposição/céu/neblina já existentes e RESTAURA os valores-base no fim.
import * as THREE from 'three'; import { raioChoque } from '../sim/nuclear.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { modeloHeli } from './aereo3d.js'; import { Particulas } from './fx.js'; /* v1.2.33: fumaça colorida dos bombardeiros */ import { montaHidro3D } from './hidro3d.js'; import { HIDROS } from '../sim/hidroaviao.js'; /* v1.2.39 */ /* v1.2.26: bombardeiro único 'bombardeiroNuclear' (Urubu-rei) */

const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const Y0 = 150; // altura da rajada (= NUK.hRajada)
/* v1.2.33: esquadrilha nuclear — fumaça de jato (verde líder, azul 2º, amarela 3º) e pintura metálica nas mesmas cores, com reflexo do céu */
const NK_FUMACA = ['#1ee46e', '#2a7dff', '#ffd21a']; const NK_PALIDA = ['#bfe9cf', '#c2d6f2', '#f1e6b8']; /* v1.2.49: véu externo da fumaça (cor diluída no ar) */
const NK_METAL = [{ c: '#3f9a68', e: '#1f2a24' }, { c: '#3f6fc4', e: '#1d2433' }, { c: '#c9a443', e: '#2d281c' }];
const papelFila = (q) => (q.lider >= 0 ? (q.ala === 1 ? 1 : 2) : 0);
/** Curvas do cogumelo (m, s) — exportadas para teste/documentação */
export const CURVA = {
  topo: (T) => Y0 + 3300 * (1 - Math.exp(-T / 24)),              // altura do centro da capa
  raioCapa: (T) => 180 + 1050 * (1 - Math.exp(-T / 30)),          // raio maior do toro
  raioBola: (T) => 280 * (1 - Math.exp(-T / 0.32)),               // bola de fogo
  choque: (T) => raioChoque(T),         // v1.2.53: frente de choque FÍSICA (Kinney-Graham + Rankine-Hugoniot) — a mesma da simulação
  flash: (T) => Math.exp(-T / 0.03) + 0.9 * (1 - Math.exp(-T / 0.15)) * Math.exp(-T / 0.9), // pulso duplo térmico
  surge: (T) => (T < 2 ? 0 : 1900 * (1 - Math.exp(-(T - 2) / 14))),
  dura: 160,
};

function texPuff() { const N = 128, d = new Uint8Array(N * N * 4); const h = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v; };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = i / N * 2 - 1, y = j / N * 2 - 1, r = Math.hypot(x, y); let f = 0, a = 0.5, s = 4; for (let o = 0; o < 5; o++) { f += a * vn(i / N * s + o * 7, j / N * s + o * 3); a *= 0.5; s *= 2; }
    const b = Math.max(0, 1 - r * r) ; const al = Math.max(0, Math.min(1, b * 1.6 * (0.45 + f) - 0.25 * r)); const k = (j * N + i) * 4; d[k] = d[k + 1] = d[k + 2] = Math.round(255 * Math.min(1, 0.55 + f * 0.6)); d[k + 3] = Math.round(255 * al); }
  const t = new THREE.DataTexture(d, N, N); t.needsUpdate = true; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t; }

const VS_PUFF = `attribute vec4 iPos; attribute vec4 iCol; attribute vec2 iExt; varying vec2 vUv; varying vec4 vCol; varying float vH; varying vec3 vN; varying float vD; varying float vSd; varying vec3 vVp;
void main(){ vec4 mv = modelViewMatrix * vec4(iPos.xyz, 1.0); float c = cos(iExt.y), s = sin(iExt.y); vUv = mat2(c, -s, s, c) * (uv - 0.5) + 0.5; mv.xy += position.xy * iPos.w; vN = normalize(vec3(position.xy * 1.7, 0.75)); vCol = iCol; vH = iExt.x; vD = -mv.z; vSd = iExt.y; vVp = mv.xyz; gl_Position = projectionMatrix * mv; }`;
const FS_PUFF = `uniform sampler2D uTex; uniform vec3 uSolV; uniform vec3 uSolCor; uniform vec3 uAmb; uniform vec3 uFogCor; uniform float uFog; uniform float uFlash;
varying vec2 vUv; varying vec4 vCol; varying float vH; varying vec3 vN; varying float vD; varying float vSd; varying vec3 vVp;
/* fiscal nukefumaca (item 1, plano B): forma/alfa PROCEDURAIS no shader (sem textura): queda radial suave + fbm 2D por puff; sem RGB de fuligem escura */
float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), f.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){ float vR = length(vUv - 0.5) * 2.0; vec2 pp = (vUv - 0.5) * 2.0 + vec2(vSd * 3.7, vSd * 1.9); float fb = (vn2(pp * 1.7) * 0.55 + vn2(pp * 3.9 + 5.3) * 0.3 + vn2(pp * 8.3 + 9.1) * 0.15);
  float rr = vR + (fb - 0.5) * 0.62; float ta = 1.0 - smoothstep(0.28, 0.98, rr); ta *= ta * (3.0 - 2.0 * ta); vec4 tx = vec4(0.74 + 0.26 * fb, 0.0, 0.0, ta); float a = tx.a * vCol.a; if (a < 0.004) discard; float lam = clamp(dot(vN, uSolV) * 0.6 + 0.45, 0.0, 1.0);
  vec3 c = vCol.rgb * tx.r * (uAmb + uSolCor * lam + uFlash);
  vec3 q = mix(vec3(0.55, 0.08, 0.02), vec3(1.0, 0.55, 0.15), clamp(vH * 1.4, 0.0, 1.0)); q = mix(q, vec3(1.0, 0.95, 0.8), clamp(vH * 2.0 - 1.2, 0.0, 1.0)); c += q * vH * 2.6 * (0.6 + 0.4 * tx.r); float nt = 1.0 - clamp(dot(uAmb, vec3(0.333)) * 2.4, 0.0, 1.0); c += vec3(0.78, 0.46, 0.20) * nt * (0.5 + 1.0 * clamp(vH, 0.0, 1.0) + 0.45 * (1.0 - vR) + 0.5 * smoothstep(0.35, 0.95, vR) * clamp(vN.y * 0.5 + 0.7, 0.0, 1.0)) * (0.45 + 0.9 * fb); /* brasa p/ noite */
  { float cosT = dot(normalize(vVp), uSolV), g = 0.62, hg = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * cosT, 1.5); c += uSolCor * clamp(hg * 0.06, 0.0, 0.9) * smoothstep(0.3, 0.95, vR) * exp(-2.5 * a) * 1.4; } /* v1.2.54: ESPALHAMENTO Henyey-Greenstein — borda prateada do cogumelo contra o sol (Beer: só onde é fino) */
  float f = 1.0 - exp(-pow(uFog * vD, 2.0)); c = mix(c, uFogCor, f * (1.0 - clamp(vH, 0.0, 1.0))); gl_FragColor = vec4(c, a); }`;

const NOISE = `float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y), mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
const VS_OBJ = `varying vec3 vP; varying vec3 vNw; varying vec3 vV; void main(){ vP = position; vec4 w = modelMatrix * vec4(position, 1.0); vNw = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`;
/** bola de fogo: ruído 3D animado + rampa de temperatura (núcleo branco → laranja → vermelho escuro na borda) */
const FS_BOLA = NOISE + `uniform float uT; uniform float uCalor; uniform float uA; varying vec3 vP; varying vec3 vNw; varying vec3 vV;
void main(){ vec3 q = vP * 2.6 + vec3(0.0, -uT * 1.2, 0.0); vec3 w = vec3(n3(q + 1.7), n3(q + 4.3), n3(q + 7.9)); float n = n3(q * 1.6 + w * 2.2 - uT * 0.8) * 0.55 + n3(vP * 7.0 + w * 1.5 - vec3(uT * 2.0)) * 0.3 + n3(vP * 15.0 - uT * 3.0) * 0.15; /* v1.2.54: convecção turbulenta (domain warping) */ float mu = clamp(dot(vNw, vV), 0.0, 1.0); float k = clamp(uCalor * (0.55 + 0.6 * mu) + (n - 0.5) * 0.5, 0.0, 1.2);
  vec3 c = mix(vec3(0.35, 0.05, 0.02), vec3(1.0, 0.42, 0.08), ss(0.1, 0.55, k)); c = mix(c, vec3(1.0, 0.9, 0.62), ss(0.55, 0.95, k)); c = mix(c, vec3(1.0), ss(0.95, 1.15, k));
  c = mix(c, vec3(0.13, 0.08, 0.06), smoothstep(0.5, 0.72, n) * (1.0 - uCalor) * 0.75); /* v1.2.54: bolsões de fuligem aparecem ao esfriar */ float borda = smoothstep(0.0, 0.55, mu + (n - 0.5) * 0.5); gl_FragColor = vec4(c * (1.2 + 2.5 * uCalor), uA * borda * (0.6 + 0.4 * mu)); }`.replace(/ss\(/g, 'smoothstep(');
/** casca de choque / nuvem de condensação: alfa na BORDA (fresnel) + ruído; uModo 0 = choque (refração clara), 1 = Wilson (névoa branca densa) */
const FS_CASCA = NOISE + `uniform float uA; uniform float uModo; uniform float uT; uniform vec3 uLuz; varying vec3 vP; varying vec3 vNw; varying vec3 vV;
void main(){ float mu = abs(dot(vNw, vV)); float n = n3(vP * 9.0 + uT * 0.4); float a; vec3 c;
  if (uModo < 0.5) { /* v1.2.26: frente de choque real é quase invisível — só uma ondulação tênue, sem contorno nítido de bolha */ float nb = n3(vP * 4.0 - uT * 0.25); a = (pow(1.0 - mu, 2.6) * 0.22 * (0.5 + n) + 0.025 * (0.6 + n)) * smoothstep(0.0, 0.32, mu + (nb - 0.5) * 0.35) * (0.7 + 0.6 * nb) * smoothstep(-0.02, 0.18, vP.y); /* v1.2.55: cúpula se MISTURA ao céu e à explosão — silhueta derretida por ruído, sem aro geométrico, e some rente ao mar */ c = vec3(0.9, 0.94, 0.98) * uLuz * (0.85 + 0.3 * n); /* v1.2.54 (referência): cúpula do choque visível como vidro ondulado (ar comprimido refrata a luz) */ } else { /* v1.2.26: nuvem de condensação (Wilson) DENSA e realista — véu leitoso em camadas horizontais (estratos de umidade), flocos em 2 escalas, borda espessa (fresnel), saia baixa sobre a água e topo mais iluminado */ float n2 = n3(vP * 23.0 - uT * 0.9); float est = 0.55 + 0.45 * smoothstep(0.2, 0.9, 0.5 + 0.5 * sin(vP.y * 38.0 + n * 3.0)); float flo = smoothstep(0.18, 0.62, n * 0.65 + n2 * 0.35); float saia = 1.0 + 0.6 * (1.0 - smoothstep(0.0, 0.22, vP.y)); a = (0.62 + 0.38 * pow(1.0 - mu, 1.2)) * mix(0.55, 1.0, flo) * est * saia * smoothstep(-0.03, 0.12, vP.y); a *= smoothstep(0.04, 0.62, mu + (flo - 0.5) * 0.5 + (n2 - 0.5) * 0.25); /* v1.2.55: borda da Wilson derrete no ar */ /* silhueta esfiapada e macia, sem contorno geométrico */ a = clamp(a * 0.82, 0.0, 0.8); /* v1.2.55: Wilson translúcida — mistura com a capa e o céu */ c = mix(vec3(0.80, 0.83, 0.87), vec3(1.0), smoothstep(0.0, 0.8, vP.y) * 0.7 + flo * 0.3) * uLuz; }
  gl_FragColor = vec4(c, a * uA); }`;
const VS_ANEL = `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FS_ANEL = `uniform float uA; uniform vec3 uLuz; uniform sampler2D uTex; uniform float uUsaTex; varying vec2 vU; void main(){ float r = vU.x; float b = smoothstep(0.80, 0.97, r) * (1.0 - smoothstep(0.97, 1.0, r)); float esc = smoothstep(0.3, 0.8, r) * (1.0 - smoothstep(0.8, 0.92, r)) * 0.25; vec3 c = mix(vec3(0.25, 0.3, 0.33), vec3(0.95, 0.97, 1.0), b / max(b + esc, 1e-3)) * uLuz; float a = (b * 0.8 + esc) * uA; if (uUsaTex > 0.5) { vec4 tx = texture2D(uTex, vec2(fract(r * 0.92 + 0.04), 0.5)); c = mix(c, tx.rgb * uLuz, 0.55); a = max(a, tx.a * uA * 0.85); } gl_FragColor = vec4(c, a); }`;
const FS_FLASH = `uniform float uA; varying vec2 vU; void main(){ vec2 p = vU * 2.0 - 1.0; float r = length(p); float g = exp(-r * r * 3.5) + 0.35 * exp(-r * 9.0); gl_FragColor = vec4(vec3(1.0, 0.97, 0.9) * g, 1.0) * uA; }`;
/* v1.2.54 (referência do Valter): REFLEXOS DE LENTE — fantasmas circulares ao longo da linha bola de fogo → centro da tela (bokeh de lente real) */
const FS_LENTE = `uniform float uA; uniform vec2 uP; uniform float uAsp; varying vec2 vU; void main(){ vec2 p = vU * 2.0 - 1.0; p.x *= uAsp; vec2 s = vec2(uP.x * uAsp, uP.y); vec3 c = vec3(0.0);
  for (int i = 0; i < 7; i++) { float fi = float(i); float k = -0.35 - 0.28 * fi + (i == 3 ? 1.3 : 0.0) + (i == 5 ? 1.75 : 0.0); float r = 0.05 + 0.035 * mod(fi * 3.0, 5.0); float d = length(p - s * k); float disco = smoothstep(r, r * 0.8, d) * (0.45 + 0.55 * smoothstep(r * 0.45, r, d)); vec3 cc = mix(vec3(1.0, 0.75, 0.45), vec3(0.6, 0.85, 1.0), fract(fi * 0.37)); c += cc * disco * 0.22; }
  float ds = length(p - s); c += vec3(1.0, 0.86, 0.66) * (exp(-ds * ds * 18.0) * 0.6 + exp(-abs(p.y - s.y) * 60.0) * exp(-abs(p.x - s.x) * 1.2) * 0.25); gl_FragColor = vec4(c * uA, 1.0); }`;
/* v1.2.54: FAIXA DE BRILHO no mar — reflexo da bola de fogo na água (caminho de glitter que se alarga para a câmera e cintila com as ondas) */
const FS_GLINT = `uniform float uA; uniform float uT; uniform vec3 uCor; varying vec2 vU; float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), f.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){ float x = vU.x - 0.5, y = vU.y; float w = mix(0.26, 0.035, y); float g = exp(-x * x / (w * w)); float cint = pow(vn(vec2(vU.x * 140.0, vU.y * 420.0 - uT * 5.0)) * vn(vec2(vU.x * 61.0 + 3.1, vU.y * 190.0 + uT * 3.0)), 1.6) * 2.4 + 0.12; /* cintilação suave das facetas das ondas */ float fade = smoothstep(0.0, 0.12, y) * (1.0 - smoothstep(0.92, 1.0, y)); gl_FragColor = vec4(uCor * g * cint * fade * uA, 1.0); }`;
/* v1.2.54: ANEL DE CONDENSAÇÃO em volta da haste (halo de Wilson fino e brilhante que se expande e some) */
const VS_HALO = `varying float vR; varying float vAz; void main(){ vR = length(position.xz); vAz = atan(position.z, position.x); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FS_HALO = `uniform float uA; uniform vec3 uLuz; uniform float uT; varying float vR; varying float vAz; float hs(float x){ return fract(sin(x * 91.7) * 43758.5); } float vn(float x){ float i = floor(x), f = fract(x); return mix(hs(i), hs(i + 1.0), f * f * (3.0 - 2.0 * f)); }
void main(){ float b = exp(-pow((vR - 0.9) / 0.045, 2.0)) + 0.35 * exp(-pow((vR - 0.8) / 0.08, 2.0)); float n = 0.6 + 0.4 * vn(vAz * 9.5 + uT * 0.3) * vn(vAz * 23.0 - uT * 0.2); float a = b * n * uA; gl_FragColor = vec4(uLuz * vec3(1.0, 0.93, 0.84), a); if (a < 0.004) discard; }`;
const FS_TELA = `uniform float uA; uniform vec3 uCor; varying vec2 vU; void main(){ vec2 p = vU * 2.0 - 1.0; float r = length(p * vec2(1.0, 0.8)); /* v1.2.54: FASE 0 — véu do clarão com queda radial (sem branco chapado) + ABERRAÇÃO CROMÁTICA nas bordas do sensor (franja quente fora, fria dentro) */ float core = uA * (0.58 + 0.42 * (1.0 - r * r * 0.55)); float fr = smoothstep(0.55, 1.2, r) * uA; vec3 c = uCor * core * vec3(1.0 + 0.3 * fr, 1.0 - 0.06 * fr, 1.0 - 0.28 * fr) + vec3(0.35, 0.05, 0.45) * fr * 0.22 * smoothstep(0.95, 1.3, r) - vec3(0.0, 0.03, 0.0) * fr; gl_FragColor = vec4(c, min(0.95, core)); }`;

function geoBombardeiro() { const P = [], V = [], cor = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), C = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = C.r; a[i * 3 + 1] = C.g; a[i * 3 + 2] = C.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); const g2 = g.index ? g.toNonIndexed() : g; g2.deleteAttribute('uv'); return g2; };
  const CZ = '#59626c', ESC = '#3b434b', VID = '#141c24';
  P.push(cor(new THREE.CylinderGeometry(1.15, 0.65, 19, 14).rotateX(Math.PI / 2).translate(0, 0, 0.5), CZ)); // fuselagem
  P.push(cor(new THREE.ConeGeometry(1.15, 4.5, 14).rotateX(-Math.PI / 2).translate(0, 0, -11.25), CZ)); // nariz
  V.push(cor(new THREE.SphereGeometry(1, 16, 10).scale(0.85, 0.7, 2.4).translate(0, 0.95, -7.6), VID)); // cabine (vidro: material próprio)
  const asa = (span, z0, corda, enfl, esp, y) => { const s = new THREE.Shape(); s.moveTo(0, z0); s.lineTo(span, z0 + enfl); s.lineTo(span, z0 + enfl + corda * 0.42); s.lineTo(0, z0 + corda); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: esp, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, y + esp / 2, 0); return g; };
  for (const sx of [1, -1]) { P.push(cor(asa(11.5, -3, 7, 6.2, 0.45, -0.2).scale(sx, 1, 1), CZ)); P.push(cor(asa(4.6, 7.5, 3.2, 2.6, 0.25, 0.3).scale(sx, 1, 1), CZ)); // asa enflechada + estabilizador
    P.push(cor(new THREE.CylinderGeometry(0.72, 0.6, 6.2, 12).rotateX(Math.PI / 2).translate(sx * 4.3, -1.05, 1.8), ESC)); P.push(cor(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12).rotateX(Math.PI / 2).translate(sx * 4.3, -1.05, -1.4), '#1b1f23')); P.push(cor(new THREE.CylinderGeometry(0.55, 0.62, 0.6, 12, 1, true).rotateX(Math.PI / 2).translate(sx * 4.3, -1.05, 5.1), '#2b2622')); } // naceles (bimotor)
  { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(4.2, 4.6); s.lineTo(6.2, 4.6); s.lineTo(5.0, 0); s.closePath(); P.push(cor(new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false }).rotateY(-Math.PI / 2).translate(0.15, 0.6, 5.2), ESC)); } // deriva
  const g = mergeGeometries([mergeGeometries(P, false), mergeGeometries(V, false)], true); g.computeVertexNormals(); // grupos: 0 = fuselagem, 1 = vidro
  { const nr = g.attributes.normal, cl = g.attributes.color, p = g.attributes.position, n0 = g.groups[0].count; for (let i = 0; i < n0; i++) { const ny = nr.getY(i), k = ny < -0.2 ? 1.45 : 1, f = 0.94 + 0.06 * Math.sin(p.getZ(i) * 2.1) * Math.sin(p.getX(i) * 1.7); cl.setXYZ(i, Math.min(1, cl.getX(i) * k * f), Math.min(1, cl.getY(i) * k * f), Math.min(1, cl.getZ(i) * k * f)); } } // ventre claro (contra-sombreamento naval) + leve variação de painéis
  g.computeBoundingSphere(); return g; }
function geoBomba() { const L = new THREE.LatheGeometry([[0, -2.0], [0.32, -1.75], [0.42, -1.2], [0.42, 0.9], [0.3, 1.5], [0.12, 1.75], [0, 1.8]].map(([r, y]) => new THREE.Vector2(r, y)), 14).rotateX(Math.PI / 2); // nariz em −z, cauda em +z
  const f = []; for (let k = 0; k < 4; k++) f.push(new THREE.BoxGeometry(0.04, 0.7, 0.6).translate(0, 0.45, 1.5).rotateZ(k * Math.PI / 2)); const g = mergeGeometries([L.toNonIndexed(), ...f.map((x) => x.toNonIndexed())].map((x) => { x.deleteAttribute('uv'); return x; }), false); g.computeVertexNormals(); return g; }

export class NuclearFx {
  /** @param cb { som(parte, x, y, z), tremor(k), vibra(ms), tremorOk(), msg(txt, cor) } */
  constructor(cena, R, amb, nivel, fx, cb = {}) { this.cena = cena; this.R = R; this.amb = amb; this.fx = fx; this.cb = cb; this.nivel = nivel; this.tl = 0; this.base = null; this.st = { picoPuffs: 0, deton: 0 };
    this.NP = [260, 480, 700][nivel] ?? 480; this.slots = [0, 1, 2].map((i) => /* v1.2.32: 3 detonações simultâneas (salva de 3 bombardeiros) */ ({ i, ativo: 0, t0: 0, x: 0, y: 0, z: 0, d: 0, fila: [] }));
    const N = this.NP * 3; this.N = N; this.kind = new Uint8Array(N); this.pa = new Float32Array(N * 4); // a,b,c,s por puff
    let r = 1226; const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    for (let s = 0; s < 3; s++) for (let j = 0; j < this.NP; j++) { const i = s * this.NP + j, u = j / this.NP; this.kind[i] = u < 0.46 ? 0 : u < 0.66 ? 1 : u < 0.84 ? 2 : u < 0.94 ? 3 : 4; // 0 capa, 1 haste, 2 surge, 3 coluna, 4 saia
      this.pa[i * 4] = rnd() * Math.PI * 2; this.pa[i * 4 + 1] = rnd() * Math.PI * 2; this.pa[i * 4 + 2] = rnd(); this.pa[i * 4 + 3] = rnd(); }
    const ig = new THREE.InstancedBufferGeometry(); const pl = new THREE.PlaneGeometry(1, 1); ig.index = pl.index; ig.setAttribute('position', pl.attributes.position); ig.setAttribute('uv', pl.attributes.uv);
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4).setUsage(THREE.DynamicDrawUsage); this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4).setUsage(THREE.DynamicDrawUsage); this.aExt = new THREE.InstancedBufferAttribute(new Float32Array(N * 2), 2).setUsage(THREE.DynamicDrawUsage);
    ig.setAttribute('iPos', this.aPos); ig.setAttribute('iCol', this.aCol); ig.setAttribute('iExt', this.aExt); ig.instanceCount = 1; this.ig = ig;
    this.tmp = { pos: new Float32Array(N * 4), col: new Float32Array(N * 4), ext: new Float32Array(N * 2), prof: new Float32Array(N), ord: new Uint32Array(N) }; this._ordArr = Array.from({ length: N }, (_, i) => i);
    this.uP = { uTex: { value: texPuff() }, uSolV: { value: new THREE.Vector3(0, 1, 0) }, uSolCor: { value: new THREE.Color(1, 1, 1) }, uAmb: { value: new THREE.Color(0.4, 0.4, 0.45) }, uFogCor: { value: new THREE.Color() }, uFog: { value: 0.0001 }, uFlash: { value: 0 } };
    this.puffs = new THREE.Mesh(ig, new THREE.ShaderMaterial({ uniforms: this.uP, vertexShader: VS_PUFF, fragmentShader: FS_PUFF, transparent: true, depthWrite: false })); this.puffs.frustumCulled = false; this.puffs.renderOrder = 7; this.puffs.visible = false; this.puffs.userData.nk = 1; cena.add(this.puffs);
    const sph = new THREE.SphereGeometry(1, 40, 20), dome = new THREE.SphereGeometry(1, 40, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    this.bolaMat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uCalor: { value: 1 }, uA: { value: 1 } }, vertexShader: VS_OBJ, fragmentShader: FS_BOLA, transparent: true, depthWrite: false });
    this.bola = new THREE.Mesh(sph, this.bolaMat); this.bola.renderOrder = 6; // atrás dos puffs: a capa de fumaça engole a bola ao esfriar
    const casca = (modo) => new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uModo: { value: modo }, uT: { value: 0 }, uLuz: { value: new THREE.Color(1, 1, 1) } }, vertexShader: VS_OBJ, fragmentShader: FS_CASCA, transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true });
    this.choque = new THREE.Mesh(sph, casca(0)); this.choque.renderOrder = 9; this.wilson = new THREE.Mesh(dome, casca(1)); this.wilson.renderOrder = 8; this.wilson2 = new THREE.Mesh(dome, casca(1)); this.wilson2.renderOrder = 8; /* v1.2.54: DUPLA nuvem de Wilson (frente direta + reflexão na água) */
    this.anel = new THREE.Mesh(new THREE.RingGeometry(0.0, 1, 128, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uLuz: { value: new THREE.Color(1, 1, 1) }, uTex: { value: null }, uUsaTex: { value: 0 } }, vertexShader: VS_ANEL, fragmentShader: FS_ANEL, transparent: true, depthWrite: false })); this.anel.renderOrder = 4;
    { const uv = this.anel.geometry.attributes.uv, p = this.anel.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, Math.hypot(p.getX(i), p.getZ(i)), 0); } // uv.x = raio normalizado
    this.brilhoM = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 } }, vertexShader: VS_ANEL, fragmentShader: FS_FLASH, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
    this.brilho = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.brilhoM); this.brilho.renderOrder = 20;
    this.telaM = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uCor: { value: new THREE.Color(1, 0.97, 0.9) } }, vertexShader: VS_ANEL, fragmentShader: FS_TELA, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
    this.tela = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.telaM); this.tela.renderOrder = 30;
    this.lenteM = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uP: { value: new THREE.Vector2() }, uAsp: { value: 1 } }, vertexShader: VS_ANEL, fragmentShader: FS_LENTE, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
    this.lente = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.lenteM); this.lente.renderOrder = 31;
    this.glintM = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uT: { value: 0 }, uCor: { value: new THREE.Color(1, 0.7, 0.4) } }, vertexShader: VS_ANEL, fragmentShader: FS_GLINT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.glint = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), this.glintM); this.glint.renderOrder = 3;
    this.haloM = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uT: { value: 0 }, uLuz: { value: new THREE.Color(1, 1, 1) } }, vertexShader: VS_HALO, fragmentShader: FS_HALO, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.halo = new THREE.Mesh(new THREE.RingGeometry(0.62, 1.0, 128, 1).rotateX(-Math.PI / 2), this.haloM); this.halo.renderOrder = 8;
    this.extras = [this.lente, this.glint, this.halo];
    for (const m of [this.bola, this.choque, this.wilson, this.wilson2, this.anel, this.brilho, this.tela, ...this.extras]) { m.visible = false; m.userData.nk = 1; m.frustumCulled = false; cena.add(m); }
    this._ligaTexNuke(); /* v1.2.29: webp em public/tex/nuke/ → uniforms existentes; 0 nós/materiais novos em combate */
    // bombardeiros/bombas/paraquedas (pool 4, como na simulação)
    const gb = geoBombardeiro(), mb = [new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.28, side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ color: '#1c2a36', roughness: 0.06, metalness: 0.9, envMapIntensity: 1.2 })], /* fuselagem: tinta naval fosca semimetálica; cabine: vidro escuro espelhado */ gbo = geoBomba(), mbo = new THREE.MeshStandardMaterial({ color: '#c9ccc4', roughness: 0.5, metalness: 0.5 });
    const gc = new THREE.SphereGeometry(9, 16, 6, 0, Math.PI * 2, 0, Math.PI * 0.42).translate(0, -9 * Math.cos(Math.PI * 0.42), 0), mc = new THREE.MeshStandardMaterial({ color: '#f2efe8', roughness: 0.9, side: THREE.DoubleSide, emissive: '#2a1c10' });
    this.bomb = []; for (let i = 0; i < 12; i++) { /* v1.2.32: pool = sim/nuclear.js NB */ const a = modeloHeli('bombardeiroNuclear') || new THREE.Mesh(gb, mb) /* v1.2.26: o MESMO Urubu-rei do navios1226 (materiais PBR compartilhados com o parque/ala → 0 programas novos) */, b = new THREE.Mesh(gbo, mbo), c = new THREE.Mesh(gc, mc); a.rotation.order = 'YXZ'; b.rotation.order = 'YXZ'; for (const m of [a, b, c]) { m.visible = false; m.userData.nk = 1; m.traverse((o) => { o.userData.nk = 1; }); cena.add(m); }
      this.bomb.push({ av: a, bo: b, ch: c, tR: 0, queda: 0, vx: 0, vy: 0, vz: 0, rx: 0 }); }
    this.sams = Array.from({ length: 8 }, () => ({ t: -1, tv: 1, x: 0, y: 0, z: 0, idx: 0 })); this._v = new THREE.Vector3(); this._c = new THREE.Color(); this._c2 = new THREE.Color(); this.vento = { x: 3.5, z: -1.2 };
  }
  /** eventos nk* da simulação */
  evento(e, sim) { const fx = this.fx;
    switch (e.t) {
      case 'nkSamLanc': { const s = this.sams.find((q) => q.t < 0); if (s) { s.t = 0; s.tv = e.tv; s.x = e.x; s.y = e.y; s.z = e.z; s.idx = e.idx; } fx.lancaMissil(e.x, e.y, e.z); break; }
      case 'nkAbatido': { const b = this.bomb[e.idx]; fx.abateAereo(e.x, e.y, e.z, e.vx, e.vy, e.vz, 1.6); fx.clarao(e.x, e.y, e.z, 0.6); if (b) { b.queda = 1; b.vx = e.vx; b.vy = e.vy; b.vz = e.vz; b.av.visible = true; b.av.position.set(e.x, e.y, e.z); } break; }
      case 'nkBombaAbatida': fx.explosao(e.x, e.y, e.z, 1.3); fx.clarao(e.x, e.y, e.z, 0.7); break;
      case 'nkDetona': this.detona(e.x, e.y, e.z); break;
      case 'nkChoqueNavio': { const n = sim && sim.navios && sim.navios[e.id]; if (!n || !fx.agua) break; const c = this.camRef; if (c && Math.hypot(c.position.x - n.x, c.position.z - n.z) > 9000) break; const L = n.C.L || 120, hx = Math.sin(n.rumo), hz = -Math.cos(n.rumo), k = Math.min(1, 0.35 + e.fc); fx._aguaViva = Math.max(fx._aguaViva || 0, 5); /* v1.2.54 (referência): a frente bate no casco — cortina de spray varrendo o navio */
        let ux = 0, uz = 0; for (const d of (sim.nukeDet || []).slice(-1)) { const L2 = Math.hypot(n.x - d.x, n.z - d.z) || 1; ux = (n.x - d.x) / L2; uz = (n.z - d.z) / L2; }
        for (let i = 0; i < Math.round(36 * k); i++) { const u = (Math.random() - 0.5) * L, px = n.x + hx * u - ux * (n.C.B || 16) * 0.6, pz = n.z + hz * u - uz * (n.C.B || 16) * 0.6, vy = 10 + Math.random() * 26 * k; fx.agua.emite(px, 1.5, pz, ux * (20 + Math.random() * 30) * k, vy, uz * (20 + Math.random() * 30) * k, i % 2 ? '#f4f8fa' : '#e0e9ec', 0.55, (6 + Math.random() * 12) * k, Math.min(4.5, 2 * vy / 9.8 + 0.3), 4, 9.8, 0.15); } break; }
    } void sim; }
  detona(x, y, z) { const s = this.slots.find((q) => !q.ativo) || this.slots.reduce((a, b) => (a.t0 < b.t0 ? a : b)); const cam = this.camRef; s.ativo = 1; s.t0 = this.tl; s.x = x; s.y = y; s.z = z; this.st.deton++;
    const d = cam ? Math.hypot(cam.position.x - x, cam.position.y - y, cam.position.z - z) : 3000; s.d = d; const ts = d / 343, tw = Math.min(2.5, d / 1500), k = Math.max(0.18, 1 - d / 9000); /* fiscal nukefumaca (item 4 revisado): atraso REAL d/343 (sem cap); ganho alto + voz protegida no NavalAudio */
    s.fila.length = 0; s.fila.push(
      /* v1.2.29: clarão imediato; som atrasado pela velocidade do som (343 m/s); tremor/vibração por distância */
      [0, 'clarao'], [ts, 'estalo'], [ts + 0.08, 'estrondo'], [ts + 0.95, 'rolamento'], [0.55, 'coluna'],
      [tw, 'tremor', 0.4 * k], [ts, 'tremor', 2.6 * k], [ts + 3.5 + Math.min(4, d / 2500), 'retorno'], /* v1.2.54: VENTO DE RETORNO (o ar volta para o vácuo da bola de fogo) */ [ts + 1.8, 'tremor', 1.0 * k], [ts + 3.8, 'tremor', 0.55 * k]); /* REVISAO #9: vibra só via nkVibra */
    { const F = this.fx; if (F && F.fumaca) for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, el = 0.35 + Math.random() * 1.0, v = 60 + Math.random() * 160; F.fumaca.emite(x + Math.cos(a) * 40, Math.max(20, y), z + Math.sin(a) * 40, Math.cos(a) * Math.cos(el) * v, Math.sin(el) * v, Math.sin(a) * Math.cos(el) * v, i % 3 ? '#1b1a19' : '#2c2723', 0.95, 4 + Math.random() * 6, 6 + Math.random() * 6, 0.4, 9.8, 0.05); } } /* v1.2.54: DESTROÇOS lançados da haste (referência) — caem balísticos e somem ao tocar o mar */
    if (this.cb.silencio) this.cb.silencio(ts); /* v1.2.54: silêncio opressor entre o clarão e a chegada da frente */ if (!this.base) this.capturaBase(); }
  capturaBase() { const A = this.amb, u = A.uC; this.base = { zen: u.uZen.value.clone(), hor: u.uHor.value.clone(), csol: u.uCorSol.value.clone(), sol: A.sol.color.clone(), is: A.sol.intensity, hemi: A.hemi.intensity, hc: A.hemi.color.clone(), expo: this.R.toneMappingExposure, fog: this.cena.fog ? this.cena.fog.color.clone() : null }; }
  restaura() { const A = this.amb, u = A.uC, B = this.base; if (!B) return; u.uZen.value.copy(B.zen); u.uHor.value.copy(B.hor); u.uCorSol.value.copy(B.csol); A.sol.color.copy(B.sol); A.sol.intensity = B.is; A.hemi.intensity = B.hemi; A.hemi.color.copy(B.hc); this.R.toneMappingExposure = B.expo; if (B.fog && this.cena.fog) this.cena.fog.color.copy(B.fog); this.base = null; }


  /** Carrega atlases webp no boot e liga a uniforms já existentes (puffs.uTex, anel.uTex). Sem Mesh/Material novos.
   *  v1.2.29: Promise — aguardar ANTES do preaquece/compile p/ não recompilar shader em combate (uUsaTex 0→1). */
  _ligaTexNuke() {
    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
    const root = (base.endsWith('/') ? base : base + '/') + 'tex/nuke/';
    const L = new THREE.TextureLoader();
    const carrega = (nome) => new Promise((ok) => { try { L.load(root + nome, (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true; ok(tex); }, undefined, () => ok(null)); } catch (_) { ok(null); } });
    this.prontoTex = Promise.all([
      carrega('mushroom_smoke_atlas.webp').then((tex) => { if (!tex) return; const old = this.uP.uTex.value; this.uP.uTex.value = tex; if (old && old.dispose) try { old.dispose(); } catch (_) {} }),
      carrega('dust_cloud_atlas.webp').then((tex) => { if (tex) this._texDust = tex; }),
      carrega('fireball_atlas.webp').then((tex) => { if (tex) this._texFire = tex; }),
      carrega('shockwave_ring.webp').then((tex) => { if (!tex) return; const u = this.anel.material.uniforms; u.uTex.value = tex; u.uUsaTex.value = 1; }),
      carrega('shockwave_distortion.webp').then((tex) => { if (tex) this._texChoque = tex; }),
      carrega('water_foam.webp').then((tex) => { if (tex) this._texFoam = tex; }),
      carrega('water_spray.webp').then((tex) => { if (tex) this._texSpray = tex; }),
      carrega('debris_concrete_a.webp').then((tex) => { if (tex) this._texDebris = tex; }),
    ]).then(() => { this._texOk = 1; });
    return this.prontoTex;
  }

  passo(dt, sim, cam, alpha = 0) { this._alpha = alpha; this.tl += dt; this.camRef = cam; if (!this._pw && cam) { this._pw = 1; /* v1.2.26: pré-compila GLSL do nuclear no 1º quadro (o pico em T≈13 era a 1ª compilação de casca/bola/anel/puffs ao virarem visíveis) */ try { for (const m of [this.bola, this.choque, this.wilson, this.wilson2, this.anel, this.brilho, this.tela, this.puffs, ...this.extras]) m.visible = true; if (this.R && this.R.compile) this.R.compile(this.cena, cam); } catch (_) {} finally { for (const m of [this.bola, this.choque, this.wilson, this.wilson2, this.anel, this.brilho, this.tela, ...this.extras]) m.visible = false; this.puffs.visible = false; } } this.passoAvioes(dt, sim, alpha); this.passoSams(dt, sim); this.passoArvores(dt);
    let algum = 0, flashMax = 0, glow = 0, dim = 0; for (const s of this.slots) { if (!s.ativo) continue; const T = this.tl - s.t0; if (T > CURVA.dura) { s.ativo = 0; continue; } algum = 1;
      for (const q of s.fila) if (q[0] >= 0 && T >= q[0]) { const [, o, k] = q; q[0] = -1; if (o === 'tremor') { if (this.cb.tremorOk && this.cb.tremorOk()) this.cb.tremor && this.cb.tremor(k); } else if (o === 'vibra') { /* ignorado: nkVibra único */ } else if (o === 'clarao') { /* visual já via CURVA.flash */ } else this.cb.som && this.cb.som(o, s.x, s.y, s.z); }
      const kd = 1 / (1 + s.d / 6000); flashMax = Math.max(flashMax, CURVA.flash(T) * kd); glow = Math.max(glow, (0.75 * Math.exp(-T / 7) * (1 - Math.exp(-T / 0.4))) * kd); dim = Math.max(dim, 0.5 * ss(3, 25, T) * (1 - ss(55, 125, T)) / (1 + s.d / 15000)); }
    this.puffs.visible = algum; for (const m of this.extras) m.visible = false; this.choque.visible = this.wilson.visible = this.wilson2.visible = this.anel.visible = this.bola.visible = this.brilho.visible = this.tela.visible = false;
    if (!algum) { if (this.base) this.restaura(); return; }
    this.ceu(flashMax, glow, dim); let n = 0, sm = null; for (const s of this.slots) if (s.ativo) { n = this.puffsSlot(s, this.tl - s.t0, cam, n); if (!sm || s.t0 > sm.t0) sm = s; } this.ordena(n, cam);
    this.objs(sm, this.tl - sm.t0, cam, flashMax); }

  ceu(f, g, dim) { const A = this.amb, u = A.uC, B = this.base, c = this._c; const quente = c.setRGB(1.0, 0.62, 0.32), poeira = this._c2.setRGB(0.24, 0.2, 0.18);
    u.uZen.value.copy(B.zen).lerp(poeira, dim * 0.8).lerp(quente, Math.min(0.85, g * 0.9 + f * 0.6)); u.uHor.value.copy(B.hor).lerp(poeira, dim).lerp(quente, Math.min(0.9, g + f * 0.7)); u.uCorSol.value.copy(B.csol).multiplyScalar(1 - dim * 0.6);
    A.sol.color.copy(B.sol).lerp(quente, Math.min(1, g * 1.2)); A.sol.intensity = B.is * (1 - dim * 0.55) + 6 * f + 2.2 * g; A.hemi.intensity = B.hemi * (1 - dim * 0.4) + 2.5 * f + g; A.hemi.color.copy(B.hc).lerp(quente, Math.min(1, g));
    this.R.toneMappingExposure = B.expo * (1 + 1.6 * f) * (1 - 0.25 * dim); if (B.fog && this.cena.fog) this.cena.fog.color.copy(B.fog).lerp(poeira, dim * 0.7).lerp(quente, Math.min(0.8, g + f * 0.5)); this.flash = f; }

  puffsSlot(s, T, cam, n0) { const P = this.tmp.pos, C = this.tmp.col, E = this.tmp.ext, pa = this.pa, NP = this.NP, cx = s.x, cz = s.z; const dc = Math.hypot(cam.position.x - cx, cam.position.z - cz);
    const lod = dc > 16000 ? 3 : dc > 9000 ? 2 : 1; const yc = CURVA.topo(T), Rc = CURVA.raioCapa(T), rc = 0.58 * Rc * (0.7 + 0.3 * (1 - Math.exp(-T / 10))), Rb = CURVA.raioBola(T), kc = ss(0.6, 5, T);
    const fade = 1 - ss(100, CURVA.dura, T), Phi = 2.6 * (1 - Math.exp(-T / 16)), hTopoHaste = yc - rc * 0.55, cresceH = ss(2, 12, T), rs = 0.2 * Rc, rsurge = CURVA.surge(T);
    let n = n0; const wx = this.vento.x * T, wz = this.vento.z * T;
    for (let j = 0; j < NP; j += lod) { const i = s.i * NP + j, k = this.kind[i], a = pa[i * 4], b = pa[i * 4 + 1], c = pa[i * 4 + 2], r = pa[i * 4 + 3]; let x, y, z, sz, al, h = 0, cr, cg, cb2;
      if (k === 0) { // CAPA toroidal: rola (sobe por dentro, sai por cima, desce pela borda); início = esfera da bola de fogo
        const ph = b - Phi * (0.7 + 0.6 * c), lob = 1 + 0.15 * kc * Math.sin(5 * a + 2.3 * c + T * 0.05) * Math.sin(3 * b + 1.1), rr = (Rc + rc * Math.cos(ph) * (0.75 + 0.3 * c)) * lob, yy = yc + rc * 0.62 * Math.sin(ph) * (0.8 + 0.3 * r) + rc * 0.13 * kc * Math.cos(7 * a + 1.9 * r - T * 0.04); /* v1.2.54: lóbulos de Rayleigh-Taylor (couve-flor) na capa */
        const sx = Math.cos(a) * Math.sin(b), sy = Math.cos(b), sz2 = Math.sin(a) * Math.sin(b), rb = Rb * (0.35 + 0.55 * c);
        x = (1 - kc) * sx * rb + kc * Math.cos(a) * rr; z = (1 - kc) * sz2 * rb + kc * Math.sin(a) * rr; y = (1 - kc) * (Y0 + sy * rb + 30 * T) + kc * yy;
        sz = ((1 - kc) * Rb * 0.7 + kc * rc * (0.75 + 0.5 * r)) * (1 + 0.08 * Math.sin(T * 0.3 + a)); al = 0.82 * fade * ss(0.05, 0.5, T);
        const dentro = 0.5 - 0.5 * Math.cos(ph); const brasa = r < 0.22 ? Math.exp(-T / 30) * 0.7 * (0.6 + 0.4 * Math.sin(T * 1.7 + a * 5)) : 0; h = Math.exp(-T / 3.5) * 1.25 + Math.exp(-T / 14) * 0.55 * dentro * (1 - c * 0.5) + brasa; const sombra = 0.55 + 0.45 * Math.max(0, Math.sin(ph)), clar = ss(45, 130, T); /* v1.2.54: capa de FULIGEM cinza-escura com brasas entre os lóbulos (referência), clareando devagar com a condensação */ cr = (0.4 + 0.36 * clar) * sombra; cg = (0.37 + 0.33 * clar) * sombra; cb2 = (0.35 + 0.29 * clar) * sombra; }
      else if (k === 1) { // HASTE: puffs sobem ciclicamente; mais larga na base (spray/poeira), estreita no meio, junta na capa
        const u0 = (c + T * 0.014) % 1, yy = 20 + u0 * (hTopoHaste - 20); if (u0 > cresceH) { al = 0; x = cx; y = -999; z = cz; sz = 0; } else {
          const w = rs * (0.55 + 0.35 * r) * (1 + 1.3 * Math.pow(1 - u0, 3)) * (0.6 + 0.4 * kc), aa = a + T * 0.12; x = Math.cos(aa) * w * 0.6; z = Math.sin(aa) * w * 0.6; y = yy; sz = w * (0.9 + 0.5 * r); al = 0.7 * fade * ss(1.5, 6, T) * ss(1, 0.85, u0); }
        h = Math.exp(-T / 5) * 0.4 * (1 - u0 * 0.3) + (r < 0.18 ? Math.exp(-T / 12) * 0.5 : 0); const clh = ss(45, 130, T); cr = 0.36 + 0.26 * clh; cg = 0.33 + 0.24 * clh; cb2 = 0.31 + 0.21 * clh; } /* v1.2.54: haste escura com fogo por dentro */
      else if (k === 2) { // BASE SURGE: anel baixo de névoa d'água expandindo
        if (c < 0.35) { /* v1.2.54: BASE de fumaça/poeira escura rolando em volta da haste (referência) */ const rr = (260 + 520 * (1 - Math.exp(-T / 6))) * (0.55 + 0.9 * r); x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = 30 + 90 * c / 0.35; sz = (130 + 150 * r) * (0.5 + 0.5 * ss(0.8, 5, T)); al = 0.72 * ss(0.8, 3, T) * (1 - ss(40, 95, T)); h = Math.exp(-T / 4) * 0.5; cr = 0.38; cg = 0.35; cb2 = 0.33; }
        else { /* v1.2.54: MURALHA DE ÁGUA — spray branco alto na frente da onda de superfície */ const rr = rsurge * (0.86 + 0.18 * c); x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = 20 + (90 + 260 * r) * (1 - Math.exp(-Math.max(0, T - 2) / 4)) * (1 - 0.5 * ss(20, 60, T)); sz = (140 + 190 * r) * (0.6 + 0.4 * ss(2, 12, T)) * (1 + T / 70);
        al = 0.42 * ss(2.2, 5, T) * (1 - ss(28, 75, T)); sz *= 0.85; cr = cg = 0.95; cb2 = 0.98; } } /* v1.2.55: muralha menos densa */
      else if (k === 3) { // COLUNA D'ÁGUA oca: sobe e desaba (vira surge)
        const tc = T - 0.6, hc = tc > 0 ? 1100 * Math.sin(Math.min(Math.PI, tc / 13 * Math.PI)) : 0, u0 = c; const rr = (220 + 90 * r) * (1 + 0.6 * u0) * (1 + tc / 30); x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = u0 * hc; sz = 110 + 120 * r;
        al = 0.7 * ss(0.6, 1.5, T) * (1 - ss(10, 18, T)); cr = cg = 0.95; cb2 = 1; }
      else { // SAIA (anel de condensação em volta da haste) — aparece com a capa subindo (5–40 s)
        const rr = Rc * (0.75 + 0.25 * c), yy = yc * (0.42 + 0.06 * r); x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = yy; sz = rc * 0.45; al = 0.5 * ss(5, 12, T) * (1 - ss(28, 50, T)); cr = cg = cb2 = 0.96; }
      const pv = y / 3500; const o = n * 4; P[o] = cx + x + wx * pv; P[o + 1] = y; P[o + 2] = cz + z + wz * pv; P[o + 3] = al > 0.003 ? sz : 0; C[o] = cr; C[o + 1] = cg; C[o + 2] = cb2; C[o + 3] = al; E[n * 2] = h; E[n * 2 + 1] = a * 3 + r * 6 + T * 0.02 * (r - 0.5); n++; }
    return n; }

  ordena(n, cam) { const P = this.tmp.pos, pr = this.tmp.prof, ox = cam.position.x, oy = cam.position.y, oz = cam.position.z; for (let i = 0; i < n; i++) { const dx = P[i * 4] - ox, dy = P[i * 4 + 1] - oy, dz = P[i * 4 + 2] - oz; pr[i] = dx * dx + dy * dy + dz * dz; }
    const ord = this._ordArr; ord.length = n; for (let i = 0; i < n; i++) ord[i] = i; ord.sort((a, b) => pr[b] - pr[a]);
    const aP = this.aPos.array, aC = this.aCol.array, aE = this.aExt.array, C = this.tmp.col, E = this.tmp.ext; let m = 0;
    for (let q = 0; q < n; q++) { const i = ord[q]; if (P[i * 4 + 3] <= 0) continue; for (let k = 0; k < 4; k++) { aP[m * 4 + k] = P[i * 4 + k]; aC[m * 4 + k] = C[i * 4 + k]; } aE[m * 2] = E[i * 2]; aE[m * 2 + 1] = E[i * 2 + 1]; m++; }
    this.ig.instanceCount = Math.max(1, m); this.st.puffs = m; this.st.picoPuffs = Math.max(this.st.picoPuffs, m); this.aPos.needsUpdate = this.aCol.needsUpdate = this.aExt.needsUpdate = true; this.aPos.addUpdateRange && (this.aPos.clearUpdateRanges(), this.aPos.addUpdateRange(0, m * 4), this.aCol.clearUpdateRanges(), this.aCol.addUpdateRange(0, m * 4), this.aExt.clearUpdateRanges(), this.aExt.addUpdateRange(0, m * 2));
    const A = this.amb, U = this.uP; U.uSolV.value.copy(A.dirSol || A.uC.uSol.value).transformDirection(cam.matrixWorldInverse); U.uSolCor.value.copy(A.sol.color).multiplyScalar(Math.min(2.2, A.sol.intensity * 0.55)); U.uAmb.value.copy(A.hemi.color).multiplyScalar(Math.min(1.4, 0.25 + A.hemi.intensity * 0.35));
    if (this.cena.fog) { U.uFogCor.value.copy(this.cena.fog.color); U.uFog.value = this.cena.fog.density || 0.0001; } U.uFlash.value = Math.min(2, (this.flash || 0) * 3); }

  objs(s, T, cam, f) { const luz = Math.min(1.4, 0.35 + this.amb.sol.intensity * 0.3);
    if (T < 8) { const r = Math.max(5, CURVA.raioBola(T) * (1 - ss(3, 8, T) * 0.45)); this.bola.visible = true; this.bola.position.set(s.x, T < 0.6 ? s.y : CURVA.topo(T) * ss(0.6, 5, T) + s.y * (1 - ss(0.6, 5, T)), s.z); this.bola.scale.set(r, r * (1 - 0.25 * ss(2, 8, T)), r); this.bolaMat.uniforms.uT.value = T; this.bolaMat.uniforms.uCalor.value = Math.exp(-T / 2.2); this.bolaMat.uniforms.uA.value = 1 - ss(2.5, 7.5, T); }
    const rc = CURVA.choque(T); if (T < 8) { this.choque.visible = true; this.choque.position.set(s.x, s.y, s.z); this.choque.scale.setScalar(rc); this.choque.material.uniforms.uA.value = (1 - ss(2, 8, T)) * ss(0, 0.05, T); this.choque.material.uniforms.uLuz.value.setScalar(luz); }
    if (T > 0.25 && T < 5.2) { this.wilson.visible = true; this.wilson.position.set(s.x, 0, s.z); const rw = Math.max(200, rc * 0.92); this.wilson.scale.set(rw, rw * 0.6, rw); const m = this.wilson.material.uniforms; m.uA.value = ss(0.25, 0.7, T) * (1 - ss(2.4, 5.2, T)) * 1.0; m.uT.value = T; m.uLuz.value.setScalar(Math.max(luz, 0.9 + f)); }
    if (T > 0.6 && T < 4.6) { this.wilson2.visible = true; this.wilson2.position.set(s.x, 0, s.z); const r2 = Math.max(160, CURVA.choque(T - 0.35) * 0.8); this.wilson2.scale.set(r2, r2 * 0.42, r2); const m2 = this.wilson2.material.uniforms; m2.uA.value = 0.55 * ss(0.6, 1.0, T) * (1 - ss(2.6, 4.6, T)); m2.uT.value = T + 3.1; m2.uLuz.value.setScalar(Math.max(luz, 0.85 + f)); } /* v1.2.54: 2ª casca de condensação (choque refletido no mar), mais baixa e atrasada */
    const rw = Math.sqrt(Math.max(0, rc * rc - s.y * s.y));
    if (rw > 60 && T < 14 && this.fx && this.fx.agua) { /* v1.2.54 (referência): COROA DE SPRAY — onde a frente toca o mar a superfície é arrancada em spray branco alto (só no arco voltado para a câmera, onde se vê) */ const W = this.fx.agua, az = Math.atan2(cam.position.z - s.z, cam.position.x - s.x), kk = 1 - ss(6, 14, T), nE = Math.round((this.nivel >= 2 ? 15 : this.nivel === 1 ? 11 : 6) * kk); /* v1.2.55: coroa menos densa */ this.fx._aguaViva = Math.max(this.fx._aguaViva || 0, 4);
      for (let i = 0; i < nE; i++) { const a = az + (Math.random() - 0.5) * 2.2, px = s.x + Math.cos(a) * rw, pz = s.z + Math.sin(a) * rw, vr = 18 + Math.random() * 30, vy = (14 + Math.random() * 30) * (0.5 + 0.5 * kk); W.emite(px, 1, pz, Math.cos(a) * vr, vy, Math.sin(a) * vr, i % 3 ? '#f2f6f8' : '#dce6ea', 0.5 * kk, 12 + Math.random() * 22, Math.min(5, 2 * vy / 9.8 + 0.4), 10, 9.8, 0.2); } } if (rw > 0 && T < 12) { this.anel.visible = true; this.anel.position.set(s.x, 0.8, s.z); this.anel.scale.setScalar(rw); this.anel.material.uniforms.uA.value = 1 - ss(5, 12, T); this.anel.material.uniforms.uLuz.value.setScalar(luz); }
    { const yc = CURVA.topo(T), Rc = CURVA.raioCapa(T); if (T > 2.5 && T < 16) { this.halo.visible = true; const rh = Rc * (1.15 + 0.06 * (T - 2.5)); this.halo.position.set(s.x, yc * 0.6, s.z); this.halo.scale.set(rh, 1, rh); this.haloM.uniforms.uA.value = 0.85 * ss(2.5, 3.6, T) * (1 - ss(9, 16, T)); this.haloM.uniforms.uT.value = T; this.haloM.uniforms.uLuz.value.setScalar(Math.max(luz, 0.75)).lerp(this._c.setRGB(1, 0.72, 0.45), Math.min(0.6, Math.exp(-T / 6))); } } /* v1.2.54: anel de condensação na haste */
    { const g = Math.max(f * 1.2, 0.75 * Math.exp(-T / 8) * ss(0, 0.3, T)); if (g > 0.01) { const ex = s.x, ez = s.z, cx = cam.position.x, cz = cam.position.z, dx = ex - cx, dz = ez - cz, L = Math.hypot(dx, dz); if (L > 300) { this.glint.visible = true; this.glint.position.set((ex + cx) / 2, 0.7, (ez + cz) / 2); this.glint.rotation.set(0, Math.atan2(dx, dz) + Math.PI, 0); this.glint.scale.set(L * 0.42, 1, L); this.glintM.uniforms.uA.value = Math.min(1.4, g); this.glintM.uniforms.uT.value = T; this.glintM.uniforms.uCor.value.setRGB(1, 0.62 + 0.3 * Math.min(1, f * 2), 0.32 + 0.4 * Math.min(1, f * 2)); } } } /* v1.2.54: reflexo da bola de fogo no mar */
    if (f > 0.02 || T < 2.5) { const v = this._v.set(s.x, CURVA.topo(T) * 0.4 + s.y, s.z).project(cam); if (v.z < 1 && Math.abs(v.x) < 1.4 && Math.abs(v.y) < 1.4) { this.lente.visible = true; this.lente.position.copy(cam.position); this.lente.quaternion.copy(cam.quaternion); this.lente.translateZ(-(cam.near + 0.6)); const hh = Math.tan(cam.fov * Math.PI / 360) * (cam.near + 0.6); this.lente.scale.set(hh * cam.aspect, hh, 1); this.lenteM.uniforms.uP.value.set(v.x, v.y); this.lenteM.uniforms.uAsp.value = cam.aspect; this.lenteM.uniforms.uA.value = Math.min(1, f * 1.2 + 0.5 * Math.exp(-T / 1.2)); } } /* v1.2.54: bokeh / reflexos de lente */
    if (f > 0.01) { // clarão: brilho no ponto (sempre por cima) + véu de tela (adicional)
      const v = this._v.set(s.x, s.y, s.z).project(cam); if (v.z < 1) { this.brilho.visible = true; const d = Math.max(50, cam.position.distanceTo(this._v.set(s.x, s.y, s.z))); this.brilho.position.copy(this._v.set(s.x, s.y, s.z)); this.brilho.quaternion.copy(cam.quaternion); const sc = d * 0.9 * (0.4 + f); this.brilho.scale.set(sc, sc, 1); this.brilhoM.uniforms.uA.value = Math.min(1.5, f * 1.6); }
      this.tela.visible = true; this.tela.position.copy(cam.position); this.tela.quaternion.copy(cam.quaternion); this.tela.translateZ(-(cam.near + 0.5)); const hh = Math.tan(cam.fov * Math.PI / 360) * (cam.near + 0.5) * 1.2; this.tela.scale.set(hh * cam.aspect, hh, 1); this.telaM.uniforms.uA.value = Math.min(0.92, f * 1.1); } }

  /** v1.2.29: pose interpolada (alpha = S.acc/DT) — evita salto 1↔2 passos/frame a 200–285 m/s */
  _pose(q, a, o) { const A = a == null ? 0 : a; const px = q.px != null ? q.px : q.x, py = q.py != null ? q.py : q.y, pz = q.pz != null ? q.pz : q.z;
    o.x = px + (q.x - px) * A; o.y = py + (q.y - py) * A; o.z = pz + (q.z - pz) * A;
    const pr = q.prumo != null ? q.prumo : q.rumo, pp = q.ppitch != null ? q.ppitch : (q.pitch || 0), pl = q.proll != null ? q.proll : (q.roll || 0);
    let dr = q.rumo - pr; while (dr > Math.PI) dr -= Math.PI * 2; while (dr < -Math.PI) dr += Math.PI * 2;
    o.rumo = pr + dr * A; o.pitch = pp + ((q.pitch || 0) - pp) * A; o.roll = pl + ((q.roll || 0) - pl) * A; return o; }
  passoAvioes(dt, sim, alpha = 0) { const fx = this.fx, Q = sim.nukes; if (!Q) return; if (this._trl) this._trl.passo(dt, this.vento ? this.vento.x : 0, this.vento ? this.vento.z : 0); this.st.avioes = 0; const a = alpha, P = this._pAv || (this._pAv = { x: 0, y: 0, z: 0, rumo: 0, pitch: 0, roll: 0 }), Pb = this._pBo || (this._pBo = { x: 0, y: 0, z: 0 });
    for (let i = 0; i < 12; i++) { const q = Q[i], b = this.bomb[i]; if (!q) continue;
      if (b.queda) { const av = b.av; b.vy -= 9.81 * dt; b.vx *= 0.995; b.vz *= 0.995; av.position.x += b.vx * dt; av.position.y += b.vy * dt; av.position.z += b.vz * dt; av.rotation.x -= 0.6 * dt; av.rotation.z += 1.4 * dt; b.tR += dt;
        if (b.tR > 0.03) { b.tR = 0; fx.fumaca.emite(av.position.x, av.position.y, av.position.z, 0, 2, 0, '#2a2622', 0.7, 14, 6, 6); fx.brilho.emite(av.position.x, av.position.y, av.position.z, 0, 0, 0, '#ff9a3a', 0.9, 7, 0.35, 4); }
        if (av.position.y < 0) { b.queda = 0; av.visible = false; fx.explosao(av.position.x, 2, av.position.z, 1.2); fx.impactoAeronave(av.position.x, av.position.z, Math.min(160, Math.hypot(b.vx || 0, b.vy || 0, b.vz || 0) || 90), b.vx || 0, b.vz || 0); } } /* v1.2.50: queda do bombardeiro no mar = cortina em V + combustível em chamas na superfície */
      else if (q.ativo && q.hidro) { b.av.visible = false; this.st.avioes++; this._pose(q, a, P); this.hidro(q, b, P, dt); }
      else { if (b.hd) for (const k in b.hd) b.hd[k].visible = false; b.av.visible = !!q.ativo; if (q.ativo) { this.st.avioes++; this._pose(q, a, P); b.av.position.set(P.x, P.y, P.z); { const ks = 1 - Math.exp(-dt * 7); if (b.nkP == null || Math.abs(b.nkP - P.pitch) > 1.5) { b.nkP = P.pitch; b.nkR = P.roll; } b.nkP += (P.pitch - b.nkP) * ks; b.nkR += (P.roll - b.nkR) * ks; b.av.rotation.set(b.nkP, -P.rumo, b.nkR); } /* v1.2.40: atitude suavizada na tela */ this.pinta(q, b); if (q.fase >= 2) this.trilha(q, P, b); else b._tx = null; } }
      const B = q.b; b.bo.visible = !!B.ativo; b.ch.visible = !!(B.ativo && B.chute); if (B.ativo) { const bx = B.px != null ? B.px : B.x, by = B.py != null ? B.py : B.y, bz = B.pz != null ? B.pz : B.z; Pb.x = bx + (B.x - bx) * a; Pb.y = by + (B.y - by) * a; Pb.z = bz + (B.z - bz) * a; b.bo.position.set(Pb.x, Pb.y, Pb.z); const v = Math.hypot(B.vx, B.vz); b.bo.rotation.set(Math.atan2(B.vy, v), -Math.atan2(B.vx, -B.vz), 0);
        if (B.chute) { const vv = Math.hypot(B.vx, B.vy, B.vz) || 1, o = Math.min(1, (B.t - 1.5) * 2); b.ch.position.set(Pb.x - B.vx / vv * 16, Pb.y - B.vy / vv * 16, Pb.z - B.vz / vv * 16); b.ch.scale.setScalar(0.2 + 0.8 * o); b.ch.lookAt(Pb.x, Pb.y, Pb.z); b.ch.rotateX(-Math.PI / 2); } } } }
  /** v1.2.39: hidroavião — modelo próprio por tipo (criado na 1ª vez), hélices girando, borrifo na corrida/pouso na água e esteira de espuma. */
  hidro(q, b, P, dt) { const S = HIDROS[q.hidro]; if (!S) return; const hd = b.hd || (b.hd = {}); let m = hd[q.hidro]; if (!m) { m = hd[q.hidro] = montaHidro3D(S); m.traverse((o) => { o.userData.nk = 1; }); this.cena.add(m); }
    for (const k in hd) hd[k].visible = k === q.hidro; m.position.set(P.x, P.y, P.z);
    /* v1.2.40: atitude suavizada na tela (inclinação e arfagem entram com filtro de ~0,15 s; rumo segue direto) → movimento macio, sem tremer */ const ks = 1 - Math.exp(-dt * 7); if (b.hdP == null || Math.abs(b.hdP - P.pitch) > 1.5) { b.hdP = P.pitch; b.hdR = P.roll; } b.hdP += (P.pitch - b.hdP) * ks; b.hdR += (P.roll - b.hdR) * ks; m.rotation.set(b.hdP, -P.rumo, b.hdR);
    { const U = m.userData; if (U.misseis) for (let i = 0; i < U.misseis.length; i++) U.misseis[i].visible = i < (q.misseis ?? 8); if (U.torps) for (let i = 0; i < U.torps.length; i++) U.torps[i].visible = i < (q.torps ?? 4); } /* armas penduradas somem ao disparar */
    const giro = (q.fase === 4 ? Math.max(0.2, q.v / S.vDecola) : 1) * 55 * dt; for (const h of m.userData.helices) h.rotation.z += giro;
    if (m.userData.estrobo) m.userData.estrobo.visible = (this.tl * 1.2) % 1 < 0.08;
    const naAgua = q.fase === 1 || (q.fase === 4 && q.y < 4); if (naAgua && q.v > 4) { b.tW = (b.tW || 0) + dt; if (b.tW > 0.04) { b.tW = 0; const fx = this.fx, sx = Math.sin(P.rumo), sz = -Math.cos(P.rumo), cx = Math.cos(P.rumo), cz = Math.sin(P.rumo), k = Math.min(1, q.v / 50);
      for (const s of [-1, 1]) fx.agua.emite(P.x + sx * S.L * 0.05 + cx * s * 2.2, P.y - 0.6, P.z + sz * S.L * 0.05 + cz * s * 2.2, cx * s * (6 + 10 * k) - sx * q.v * 0.2, 3 + 9 * k, cz * s * (6 + 10 * k) - sz * q.v * 0.2, '#eef3f6', 0.75, 2.2 + 2.5 * k, 1.4, 2.2, 9.8);
      if (fx.borrifo) fx.borrifo(P.x - sx * S.L * 0.45, P.z - sz * S.L * 0.45, -sx * q.v * 0.3, -sz * q.v * 0.3, 0.6 * k); } } }
  /** v1.2.33: pintura metálica por posição na fila (clona materiais uma vez por papel; vidro/luzes ficam). */
  pinta(q, b) { const p = papelFila(q); if (b._pinta === p) return; b._pinta = p; const C = NK_METAL[p], M = this._nkMat || (this._nkMat = new Map());
    b.av.traverse((o) => { if (!o.isMesh || !o.material || Array.isArray(o.material)) return; const m0 = o.userData._m0 || (o.userData._m0 = o.material);
      if (!m0.isMeshStandardMaterial || m0.isMeshPhysicalMaterial || m0.transparent || m0.opacity < 1 || m0.roughness < 0.1) return;
      const k = m0.uuid + '|' + p; let m = M.get(k); if (!m) { m = m0.clone(); const hx = m0.color ? m0.color.getHex() : 0x808080, L = (0.299 * ((hx >> 16) & 255) + 0.587 * ((hx >> 8) & 255) + 0.114 * (hx & 255)) / 255, esc = L < 0.26;
        m.map = null; m.roughnessMap = null; if (m.color) m.color.set(esc ? C.e : C.c); m.metalness = esc ? 0.9 : 0.82; m.roughness = esc ? 0.36 : 0.24; m.envMapIntensity = esc ? 1.1 : 1.5; m.needsUpdate = true; M.set(k, m); }
      o.material = m; }); }
  /** v1.2.33: fumaça de jato contínua saindo da cauda — puffs a cada 3 m ao longo do caminho percorrido (contínua mesmo com quadro lento). */
  trilha(q, P, b) { const c = this.camRef; if (c && Math.hypot(c.position.x - P.x, c.position.y - P.y, c.position.z - P.z) > 8000) { b._tx = null; return; }
    let T = this._trl; if (!T) { if (!this.fx || !this.fx.tex) return; T = this._trl = new Particulas(this.cena, 6000, false, 3, this.fx.tex); }
    const cp = Math.cos(P.pitch || 0), fx = Math.sin(P.rumo) * cp, fy = Math.sin(P.pitch || 0), fz = -Math.cos(P.rumo) * cp, x = P.x - fx * 13.8, y = P.y + 1.6 - fy * 13.8, z = P.z - fz * 13.8, cor = NK_FUMACA[papelFila(q)];
    if (b._tx == null || Math.hypot(x - b._tx, y - b._ty, z - b._tz) > 400) { b._tx = x; b._ty = y; b._tz = z; return; }
    const dx = x - b._tx, dy = y - b._ty, dz = z - b._tz, d = Math.hypot(dx, dy, dz), passo = 1.8; if (d < passo) return; const N = Math.min(60, Math.floor(d / passo)); const pal = NK_PALIDA[papelFila(q)];
    for (let k = 1; k <= N; k++) { const f = (k * passo) / d, px = b._tx + dx * f, py = b._ty + dy * f, pz = b._tz + dz * f, r = Math.random(); /* v1.2.49: fumaça de demonstração realista — núcleo denso colorido + véu pálido que se expande e se desfaz no vento */
      T.emite(px, py, pz, (r - 0.5) * 1.2, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 1.2, cor, 0.72, 2.6 + r * 1.2, 7 + r * 3, 3.6, -0.03, 0.3);
      if (k % 2 === 0) T.emite(px, py, pz, (Math.random() - 0.5) * 2.4 + this.vento.x * 0.3, (Math.random() - 0.3) * 1.2, (Math.random() - 0.5) * 2.4 + this.vento.z * 0.3, pal, 0.34, 4.2 + r * 2, 11 + r * 5, 5.2, -0.05, 0.25); }
    const f = (N * passo) / d; b._tx += dx * f; b._ty += dy * f; b._tz += dz * f; }
  passoSams(dt, sim) { for (const s of this.sams) { if (s.t < 0) continue; s.t += dt; const q = sim.nukes && sim.nukes[s.idx]; if (!q || s.t > s.tv) { s.t = -1; continue; } const u = s.t / s.tv, x = s.x + (q.x - s.x) * u, y = s.y + (q.y - s.y) * u * u, z = s.z + (q.z - s.z) * u; this.fx.fumaca.emite(x, y, z, 0, 0, 0, '#e8eaec', 0.45, 5, 3.5, 4, 0, 0.2); this.fx.brilho.emite(x, y, z, 0, 0, 0, '#ffd27a', 1, 3, 0.08, 0); } }
  /** Cache InstancedMesh arvNuke no 1º uso (REVISAO #11). */
  _cacheArv() {
    if (this._arvMeshes) return;
    this._arvMeshes = []; this.cena.traverse((o) => { if (o.isInstancedMesh && o.userData && o.userData.arvNuke) this._arvMeshes.push(o); });
    this._arvQ = []; this._arvFree = [];
    for (let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6, 1.2), new THREE.MeshStandardMaterial({ color: '#3a5a2a', roughness: 0.95 }));
      m.visible = false; m.vivo = 0; m.userData.nk = 1; m.castShadow = false; this.cena.add(m); this._arvQ.push(m); this._arvFree.push(m);
    }
  }
  /** v1.2.29 nuke v2 item 6: árvores → corpos livres (pool 48); montanhas ficam. */
  arrancaArvores(cx, cz, r = 4200) {
    this._cacheArv();
    const mt = this._mtArv || (this._mtArv = new THREE.Matrix4()), p = this._vArv || (this._vArv = new THREE.Vector3());
    const s0 = this._sArv || (this._sArv = new THREE.Vector3()), q0 = this._qArv || (this._qArv = new THREE.Quaternion());
    const r2 = r * r, lim = 48; let n = 0;
    for (const o of this._arvMeshes) {
      if (n >= lim || !o.count) continue;
      const N = o.count;
      for (let i = 0; i < N && n < lim; i++) {
        o.getMatrixAt(i, mt); p.setFromMatrixPosition(mt);
        const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz; if (d2 > r2 || d2 < 4) continue;
        const d = Math.sqrt(d2), fc = Math.pow(1 - d / r, 1.2); if (fc < 0.08) continue;
        mt.decompose(p, q0, s0); if (s0.x < 1e-3) continue;
        mt.makeScale(0, 0, 0); mt.setPosition(p.x, p.y, p.z); o.setMatrixAt(i, mt); o.instanceMatrix.needsUpdate = true;
        const m = this._arvFree.pop(); if (!m) break;
        if (m.geometry !== o.geometry) { m.geometry = o.geometry; if (o.material) m.material = o.material; }
        m.vivo = 1; m.visible = true; m.position.copy(p); m.quaternion.copy(q0); m.scale.copy(s0);
        const ux = dx / d, uz = dz / d, v = 18 + 55 * fc;
        m.vx = ux * v; m.vy = 8 + 22 * fc; m.vz = uz * v;
        { const h = Math.sin(p.x * 12.9898 + p.z * 78.233) * 43758.5453; const r1 = h - Math.floor(h), r2b = (h * 1.7) - Math.floor(h * 1.7), r3 = (h * 2.3) - Math.floor(h * 2.3); m.wx = (r1 - 0.5) * 3; m.wy = (r2b - 0.5) * 4; m.wz = (r3 - 0.5) * 3; }
        m.tVivo = 0; n++;
      }
    }
    this._arvN = (this._arvN || 0) + n;
  }
  passoArvores(dt) {
    const Q = this._arvQ; if (!Q || !Q.length) return;
    const kd = Math.exp(-1.6 * dt); /* REVISAO #8: arrasto independente de FPS */
    for (const m of Q) {
      if (!m.vivo) continue; m.tVivo += dt; m.vy -= 9.81 * dt; m.vx *= kd; m.vz *= kd;
      m.position.x += m.vx * dt; m.position.y += m.vy * dt; m.position.z += m.vz * dt;
      m.rotation.x += m.wx * dt; m.rotation.y += m.wy * dt; m.rotation.z += m.wz * dt;
      if (m.position.y < 0) { m.position.y = 0; m.vy = 0; m.vx *= 0.4; m.vz *= 0.4; m.wx *= 0.5; m.wz *= 0.5; } /* não atravessa o chão */
      if (m.tVivo > 12) { m.vivo = 0; m.visible = false; if (this._arvFree) this._arvFree.push(m); }
    }
  }
}
