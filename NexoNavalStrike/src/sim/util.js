// Utilidades da simulação (JS puro, sem Three.js, sem Math.random: tudo determinístico).
// Mundo: x = leste, z = sul (−z = norte), y = cima; 1 unidade = 1 metro. Rumo 0 = norte, cresce no sentido horário.
export const G = 9.81;
export const RAD = 180 / Math.PI;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
/** Normaliza ângulo para (−π, π]. */
export const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
/** Rumo em graus inteiros 0..359. */
export const graus = (a) => ((Math.round(a * RAD) % 360) + 360) % 360;
/** Marcação (0 = norte, horário) de (x1,z1) para (x2,z2). */
export const marcacao = (x1, z1, x2, z2) => Math.atan2(x2 - x1, -(z2 - z1));
/** Vetor (x,z) unitário da proa para o rumo r. */
export const frenteX = (r) => Math.sin(r);
export const frenteZ = (r) => -Math.cos(r);
export const dist2 = (ax, az, bx, bz) => Math.hypot(bx - ax, bz - az);
export const NOS = 1.943844; // m/s → nós

/** Gerador pseudoaleatório com semente (mulberry32). Mesmo resultado em qualquer aparelho. */
export class Rng {
  constructor(seed = 1) { this.s = seed >>> 0 || 1; }
  next() { let t = (this.s += 0x6d2b79f5) >>> 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  range(a, b) { return a + (b - a) * this.next(); }
  /** Normal aproximada (soma de 4 uniformes), média 0, desvio 1. */
  gauss() { return (this.next() + this.next() + this.next() + this.next() - 2) * 1.7320508; }
  int(n) { return Math.floor(this.next() * n); }
}

/** Hash 32 bits (FNV-1a) de números — usado para detectar dessincronia em partidas online futuras. */
export function hashNums(arr) { let h = 0x811c9dc5; for (let i = 0; i < arr.length; i++) { const v = Math.round(arr[i] * 1000) | 0; for (let k = 0; k < 4; k++) { h ^= (v >>> (k * 8)) & 255; h = Math.imul(h, 16777619); } } return h >>> 0; }
