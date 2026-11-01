// Ondas de Gerstner — FONTE ÚNICA para a GPU e para a física.
// O shader desloca cada ponto da malha p0 para P = p0 + D(p0), com D = Σ (Q·A·d·cos f, A·sin f).
// A física precisa da altura no ponto P do MUNDO (onde o navio está), então inverte o deslocamento horizontal
// por iteração de ponto fixo (p0 ← P − Dxz(p0)); 4 iterações convergem para < 1 mm com Σ Q·k·A < 1.
// Assim a altura usada na flutuação é exatamente a superfície que o shader desenha.

/** Trecho GLSL idêntico às contas de `deslocaGerstner` abaixo (uniforms uW = (dx, dz, A, k), uQ = (Q, c)). */
/** v1.2.3: 6 trens (4 de mar + 2 de marola curta) — física e shader usam o mesmo número. */
export const NW = 6;
export const GLSL_GERSTNER = `uniform float uT; uniform vec4 uW[${NW}]; uniform vec4 uQ[${NW}];
vec3 onda(vec2 p, out vec3 nrm, out float crista){ vec3 desl = vec3(0.0); nrm = vec3(0.0, 1.0, 0.0); crista = 0.0;
  for (int i = 0; i < ${NW}; i++) { vec2 d = uW[i].xy; float A = uW[i].z; float k = uW[i].w; float Q = uQ[i].x; float c = uQ[i].y; float f = k * (dot(d, p) - c * uT); float C = cos(f); float S = sin(f);
    desl.x += Q * A * d.x * C; desl.z += Q * A * d.y * C; desl.y += A * S; nrm.x -= d.x * k * A * C; nrm.z -= d.y * k * A * C; nrm.y -= Q * k * A * S; crista += Q * k * A * S; }
  nrm = normalize(nrm); return desl; }`;

/** Port 1:1 do GLSL `onda()` (sem a normal). out = {x, y, z, crista}. */
export function deslocaGerstner(W, px, pz, t, out) {
  let dx = 0, dy = 0, dz = 0, cr = 0;
  for (let i = 0; i < W.length; i++) { const w = W[i]; const f = w.k * (w.dx * px + w.dz * pz - w.c * t); const C = Math.cos(f), S = Math.sin(f);
    dx += w.Q * w.A * w.dx * C; dz += w.Q * w.A * w.dz * C; dy += w.A * S; cr += w.Q * w.k * w.A * S; }
  out.x = dx; out.y = dy; out.z = dz; out.crista = cr; return out;
}
const _d = { x: 0, y: 0, z: 0, crista: 0 };
/** Altura EXATA da superfície desenhada no ponto do mundo (x, z) — inverte o deslocamento horizontal. */
export function alturaGerstner(W, x, z, t) {
  let px = x, pz = z;
  for (let it = 0; it < 4; it++) { deslocaGerstner(W, px, pz, t, _d); px = x - _d.x; pz = z - _d.z; }
  return deslocaGerstner(W, px, pz, t, _d).y;
}
/** Esbeltez total Σ Q·k·A (1 = cristas em cúspide; > 1 laçaria a malha). */
export const esbeltez = (W) => W.reduce((s, w) => s + w.Q * w.k * w.A, 0);
