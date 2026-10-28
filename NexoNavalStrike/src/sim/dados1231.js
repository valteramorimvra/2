// v1.2.31 — DADOS dos 3 navios lendários reais (módulo NOVO; puro, sem THREE). Fonte de cada número: referencias/FONTES.md.
// Convenção: zb = distância a partir da PROA em metros (0 = proa, L = popa). Local do navio: z = zb − L/2 (proa em −z), x = boreste, y = cima (0 = linha d'água).
// Usado por classes1231 (física), layout1231 (sim) e modelo1231 (3D) — a mesma tabela garante que sim e modelo concordam.
const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const IDS_1231 = ['sejong', 'nanchang', 'nakhimov'];

/* ---- perfil do casco (compartilhado por sim e modelo) ---- */
const interp = (pts, u) => { if (u <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const [a, fa] = pts[i - 1], [b, fb] = pts[i]; const t = (u - a) / (b - a); const s = t * t * (3 - 2 * t); return fa + (fb - fa) * s; } return pts[pts.length - 1][1]; };
const bDeckBase = (u, tr) => (u < 0.1 ? tr + (1 - tr) * sst(0, 0.1, u) : u < 0.52 ? 1 : Math.pow(Math.cos(Math.min(1, (u - 0.52) / 0.48) * Math.PI / 2), 0.78));

export const SPEC = {
  /* ===================== SEJONG O GRANDE (KDX-III Batch I) ===================== */
  sejong: {
    L: 166, B: 21.4, T: 6.25, vmax: 15.43 /* 30 nós */, desl: 10000,
    casco: { esc: 'eua', transom: 0.86, flare: 0.40, rake: 0.075, bulbo: 0.55, fino: 0.8, Fpts: [[0, 6.6], [0.2, 6.7], [0.5, 7.1], [0.7, 8.0], [0.85, 9.6], [0.95, 11.8], [1, 12.7]] },
    /* blocos da casaria (zb0..zb1 medidos da proa na foto de costado; h = altura acima do convés; w = fração da meia-boca do convés; enc = afunilamento do topo) */
    blocos: [
      { n: 'passadicoBaixo', z0: 40, z1: 52, h: 5.2, w: 0.82, enc: 0.8 },
      { n: 'casaA', z0: 50, z1: 87, h: 8.2, w: 0.84, enc: 0.88 },
      { n: 'passadico', z0: 51, z1: 76, h: 4.6, w: 0.74, enc: 0.86, y: 8.2 },
      { n: 'exaustaoA', z0: 73, z1: 85, h: 2.6, w: 0.62, enc: 0.95, y: 8.2, mat: 'escuro' },
      { n: 'casaB', z0: 89, z1: 114, h: 12.6, w: 0.84, enc: 0.9 },
      { n: 'exaustaoB', z0: 90, z1: 101, h: 2.6, w: 0.62, enc: 0.95, y: 12.6, mat: 'escuro' },
      { n: 'hangar', z0: 114, z1: 144, h: 4.1, w: 0.96, enc: 0.96 },
    ],
    sup: { z0: 50, z1: 87, h: 6.4 },
    mastro: { zb: 62, base: 8.2 + 5.0, topo: 50 - 7.2 /* topo ≈ 50 m sobre a LA (foto) */, tipo: 'trelica' },
    canhao: { cal: 127, zb: [30], canos: 1 },
    vls: [ { n: 48, zb: 37, col: 8, cs: 1.02, tipo: 'vls', sobre: 0 } ],
    sam: [ { n: 32, zb: 124, col: 8, cs: 1.02, tipo: 'sam', sobre: 4.1 }, { n: 48, zb: 133.5, col: 8, cs: 1.02, tipo: 'sam', sobre: 4.1 } ],
    ciws: [ { zb: 103.5, x: 3.2, sobre: 12.6 + 0.3, tipo: 'ciws' }, { zb: 116.6, x: 4.8, sobre: 4.1, tipo: 'ram' } ],
    ssm: [ { zb: 93, lado: 1 }, { zb: 93, lado: -1 }, { zb: 96.5, lado: 1 }, { zb: 96.5, lado: -1 } ] /* 4 lançadores quádruplos (SSM-700K ×16) */,
    tubos: { zb: 112, n: 2, canos: 3 },
    heli: { zb0: 144, zb1: 166, zc: 153.6, pad: [144.6, 162.6] },
    nuke: { zb: 44, w: 3.4, l: 4.4 },
    gran: null,
  },
  /* ===================== TIPO 055 "NANCHANG" ===================== */
  nanchang: {
    L: 180, B: 20, T: 6.6, vmax: 15.43, desl: 12500,
    casco: { esc: 'chn', transom: 0.82, flare: 0.34, rake: 0.085, bulbo: 1.2, fino: 0.9, Fpts: [[0, 5.6], [0.2, 5.8], [0.5, 6.5], [0.7, 7.8], [0.85, 9.4], [0.95, 11.0], [1, 11.6]] },
    blocos: [
      { n: 'baseCasaria', z0: 62, z1: 98, h: 6.4, w: 0.9, enc: 0.84 },
      { n: 'passadico', z0: 66, z1: 90, h: 5.4, w: 0.7, enc: 0.78, y: 6.4 },
      { n: 'casaPopa', z0: 96, z1: 110, h: 8.6, w: 0.8, enc: 0.88 },
      { n: 'exaustao', z0: 98, z1: 109, h: 1.6, w: 0.62, enc: 0.95, y: 8.6, mat: 'escuro' },
      { n: 'hangar', z0: 128, z1: 153, h: 6.6, w: 0.9, enc: 0.9 },
    ],
    sup: { z0: 62, z1: 110, h: 6.0 },
    mastro: { zb: 78.5, base: 11.8, topo: 36.5, tipo: 'piramide' },
    canhao: { cal: 130, zb: [28], canos: 1 },
    vls: [ { n: 64, zb: 42.5, col: 8, cs: 1.04, tipo: 'vls', sobre: 0 } ],
    sam: [ { n: 48, zb: 119, col: 8, cs: 1.04, tipo: 'sam', sobre: 0 } ],
    ciws: [ { zb: 135, x: 0, sobre: 6.6 + 0.2, tipo: 'ciws' }, { zb: 56.5, x: 0, sobre: 0.4, tipo: 'hhq10' } ],
    tubos: { zb: 100, n: 2, canos: 3 },
    heli: { zb0: 153, zb1: 180, zc: 163.6, pad: [154, 174] },
    nuke: { zb: 51.5, w: 3.4, l: 4.4 },
    gran: null,
  },
  /* ===================== ALMIRANTE NAKHIMOV (proj. 11442M) ===================== */
  nakhimov: {
    L: 250.1, B: 28.5, T: 9.1, vmax: 15.95 /* 31 nós */, desl: 25860,
    casco: { esc: 'rus', transom: 0.8, flare: 0.36, rake: 0.075, bulbo: 1.0, fino: 0.95, Fpts: [[0, 8.8], [0.2, 9.0], [0.5, 9.8], [0.7, 11.0], [0.85, 13.0], [0.95, 15.0], [1, 15.8]] },
    blocos: [
      { n: 'passadico', z0: 104, z1: 128, h: 11, w: 0.62, enc: 0.84 },
      { n: 'passadico2', z0: 108, z1: 124, h: 6.0, w: 0.5, enc: 0.84, y: 11 },
      { n: 'torreMastro', z0: 128, z1: 150, h: 18, w: 0.5, enc: 0.78 },
      { n: 'casaPopa', z0: 150, z1: 178, h: 9, w: 0.7, enc: 0.88 },
      { n: 'exaustao', z0: 156, z1: 172, h: 2.4, w: 0.5, enc: 0.95, y: 9, mat: 'escuro' },
      { n: 'hangar', z0: 190, z1: 206, h: 5.2, w: 0.8, enc: 0.92 },
    ],
    sup: { z0: 104, z1: 178, h: 8.0 },
    mastro: { zb: 139, base: 18, topo: 58, tipo: 'piramide' },
    canhao: { cal: 130, zb: [184], canos: 1, frente: -1 /* 1 torre AK-130 (A-192M, cano duplo no modelo) à ré; frente = −1 */ },
    vls: [ { n: 80, zb: 81, col: 20, cs: 1.15, tipo: 'vls', sobre: 0 } ],
    sam: [ { n: 96, grupos: 12, tipo: 'sam' } ] /* 12 tambores × 8; layout especial em layout1231 */,
    fort: { zb0: 30.5, passo: 4.9, nCol: 6, dx: 3.9 },
    ciws: [ { zb: 100, x: 9.6, sobre: 0.4, tipo: 'pantsir' }, { zb: 100, x: -9.6, sobre: 0.4, tipo: 'pantsir' }, { zb: 150, x: 11.2, sobre: 0.4, tipo: 'pantsir' }, { zb: 150, x: -11.2, sobre: 0.4, tipo: 'pantsir' }, { zb: 180, x: 11, sobre: 0.4, tipo: 'pantsir' }, { zb: 180, x: -11, sobre: 0.4, tipo: 'pantsir' } ],
    tubos: { zb: 130, n: 2, canos: 5 },
    heli: { zb0: 207, zb1: 250.1, zc: 220, pad: [209, 231] },
    nuke: { zb: 68, w: 4.2, l: 5.2 },
    gran: { zb: 12.5 } /* RBU-12000 */,
  },
};
for (const id of IDS_1231) { const S = SPEC[id]; S.id = id; }

/* ---- funções de casco (mesma lógica de geoCasco/meiaBoca/bordaLivre do jogo, com os parâmetros reais) ---- */
export const bordaLivre1231 = (id, u) => interp(SPEC[id].casco.Fpts, u);
export const deckY1231 = (id, z) => { const S = SPEC[id]; return bordaLivre1231(id, Math.max(0, Math.min(1, (S.L / 2 - z) / S.L))); };
export function meiaDeck1231(id, u) { const S = SPEC[id], c = S.casco; let b = bDeckBase(u, c.transom) * S.B / 2; if (c.esc === 'chn') b *= 1 + 0.08 * sst(0.6, 0.9, u) * (u < 0.52 ? 0 : 1); else if (c.esc === 'rus') b *= 1 + 0.05 * sst(0.55, 0.85, u) * (u < 0.52 ? 0 : 1); return b; }
export const meiaBoca1231 = (id, z) => { const S = SPEC[id]; return meiaDeck1231(id, Math.max(0, Math.min(1, (S.L / 2 - z) / S.L))); };
export const zDe = (id, zb) => zb - SPEC[id].L / 2;
