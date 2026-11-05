// Modelos PROCEDURAIS dos navios (projetos originais; nada copiado de jogos ou estaleiros reais).
// Casco por seções transversais interpoladas (proa perfuradora de ondas, costado furtivo inclinado para dentro no
// tumblehome, borda livre com tosado, popa transom com hangar e heliponto marcado), superestrutura piramidal facetada
// com painéis planos de radar AESA, mastro fechado, canhão em torre furtiva, VLS com tampas que abrem, tubos triplos
// de torpedo, CIWS, botes, balsas, corrimãos e números de casco. Peças estáticas são FUNDIDAS (mergeGeometries) por
// material → poucos draw calls; peças móveis (torres, CIWS, radar, tampas VLS) ficam separadas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'; import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { texPintura, texChapas, texRugo, texNumero, texHeliponto, prisma, texJanelas, texPorta, texHangar, grao } from './textures.js';
import { CLASSES } from '../sim/classes.js';
import { NOMES_PADRAO } from '../sim/nomes.js';
export { NOMES_PADRAO };
import { layoutDe, deckY as deckYC, meiaBoca, bordaLivre } from '../sim/layout.js';
import { montaModelo1231 } from './modelo1231.js'; /* v1.2.31 */
import { materialPintura, texBandeira, materialConves } from './camuflagem.js';
import { registraLuz } from './cidade.js';
import { MASC_PRE } from '../sim/mascarasLT.js';
import { MASC, geraMascaras } from '../sim/linhaTiro.js';
import { extras1225 } from './extras1225.js'; /* v1.2.25 itens 12/14 */
import { mesclaFilhos, mesclaLuzes } from './mescla1230.js'; /* v1.2.30 FPS */
import { extras1226 } from './extras1226.js'; import { extrasMegabase } from './megabase3d.js'; /* v1.2.26: parque instanciado dos porta-aviões gigantes + canhão eletromagnético */
import { NOMES_OURO_1225 } from '../sim/classes1225.js';
/** v1.2.19 item 5: caixas (AABB local) de cada peça FIXA do modelo: casaria, mastros, chaminés, torres, VLS, hangar, radares, outras montagens.
 *  Fora: casco e convés (tratados analiticamente pela planta real), linhas, peças finas (< 15 cm: balaústres, antenas-fio), canos móveis das torres. */
function mascarasDoModelo(g, C, P, matCasco, M) { g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), bx = new THREE.Box3(), cx = [], sz = new THREE.Vector3();
  const MONT = /^(ciws\d+|a30_\d+|sec_\d+|laser\d+)$/, CANO = /^cano\d?$/;
  g.traverse((o) => { if (!o.isMesh || o.isInstancedMesh && o.name === 'tampas') return; if (o.material === matCasco || o.material === M.conves || o.material === M.linha || o.material.transparent) return;
    let dono = '', p = o; while (p && p !== g) { if (CANO.test(p.name)) return; if (MONT.test(p.name)) dono = p.name; if (p.name === 'flamula' || p.name === 'gala') return; p = p.parent; }
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bx.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld).applyMatrix4(inv); bx.getSize(sz); if (Math.min(sz.x, sz.y, sz.z) < 0.15 && Math.max(sz.x, sz.y, sz.z) < 6) return;
    if (Math.min(sz.x, sz.z) < 0.15 && sz.y < 6) return; const G = o.geometry, ps = G.attributes.position, ix = G.index, nt = ix ? ix.count : ps.count; let tri = null; if (!o.isInstancedMesh && nt <= 6000) { tri = new Float32Array(nt * 3); const mm = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), v = new THREE.Vector3(); for (let i = 0; i < nt; i++) { v.fromBufferAttribute(ps, ix ? ix.getX(i) : i).applyMatrix4(mm); tri[i * 3] = v.x; tri[i * 3 + 1] = v.y; tri[i * 3 + 2] = v.z; } }
    cx.push({ a: [bx.min.x, bx.min.y, bx.min.z], b: [bx.max.x, bx.max.y, bx.max.z], dono, tri, nome: o.name || (o.parent && o.parent.name) || '' }); });
  const R = geraMascaras(C, P, cx); R.caixas = cx.length; if (globalThis.__cx) R.cx = cx; if (!globalThis.__cxTri) for (const c of cx) c.tri = null; return R; } /* triângulos descartados após a máscara (memória) */

const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Casco: { costado, conves, espelho }. Coordenadas locais: proa −z, boreste +x, y = 0 na linha d'água. */
let TV = null, TVE = null;
/** Faixa de vigias (escotilhas redondas) — cor e mapa de emissão (luz interna). Repete na horizontal. */
/** v1.2.16: nome em ouro metálico nos dois costados a vante e na popa (lendários com nome próprio). */
/** v1.2.16 item 34: nomes FICTÍCIOS padrão (sóbrios, em PT, sem religiosos, inventados — não são nomes de navios reais) para os navios sem nome próprio. */
export const NOMES_OURO = { parcel: 'PARCEL DAS PAREDES', /* v1.2.42 */ tamandare: 'ALMIRANTE TAMANDARÉ', barroso: 'ALMIRANTE BARROSO', isakov: 'ALMIRANTE ISAKOV', /* v1.2.33 */ colosso: 'VALTER AMORIM', baluarte: 'RAFAELLA', marcos: 'MARCOS VINÍCIUS', rodolfo: 'COMANDANTE RODOLFO', antonia: 'CAPITÃ ANTÔNIA', atlantico: 'ATLÂNTICO', kelly: 'CAPITÃ KELLY', laiane: 'CAPITÃ LAIANE', klevton: 'ALMIRANTE KLEVTON', ananery: 'CAPITÃ ANA NERY', trajano: 'REI TRAJANO', leidevaldo: 'ALMIRANTE LEIDEVALDO', ronaldo: 'ALMIRANTE RONALDO' }; Object.assign(NOMES_OURO, NOMES_OURO_1225); /* v1.2.25 */ /* v1.2.18 item 14: nomes no casco dos 7 cruzeiros pesados */
function texVigias(emis) { if (emis ? TVE : TV) return emis ? TVE : TV; const c = document.createElement('canvas'); c.width = 64; c.height = 32; const x = c.getContext('2d'); x.clearRect(0, 0, 64, 32);
  for (let i = 0; i < 2; i++) { x.fillStyle = emis ? (i ? '#ffe2b0' : '#ffc06a') : '#1e252c'; x.beginPath(); x.arc(16 + i * 32, 16, 8, 0, Math.PI * 2); x.fill(); if (!emis) { x.strokeStyle = '#8b949c'; x.lineWidth = 2; x.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; if (emis) TVE = t; else TV = t; return t; }
export function geoCasco(C) {
  const { L, B, T } = C; const tumble = C.casco === 'tumblehome'; const NS = 56, K = 16;
  const EC = C.cascoN || 'bra'; /* v1.2.7: escolas de casco por nação */
  const rake = tumble ? (EC === 'eua' ? -0.065 : -0.045) : ({ chn: 0.085, rus: 0.07, uk: 0.08, bra: 0.065, corv: 0.055 })[EC] ?? (L < 100 ? 0.06 : 0.075);
  const transom = ({ bra: 0.92, eua: 0.86, corv: 0.84, chn: 0.82 })[EC] ?? 0.8, flare = ({ uk: 0.4, chn: 0.24, eua: 0.36, corv: 0.34 })[EC] ?? 0.3;
  const us = []; for (let i = 0; i <= NS; i++) { const s = i / NS; us.push(s < 0.5 ? s * 0.98 : 0.49 + (1 - Math.pow(1 - (s - 0.5) * 2, 1.6)) * 0.51); } us[NS] = 1;
  const bDeck = (u) => (u < 0.1 ? transom + (1 - transom) * sstep(0, 0.1, u) : u < 0.52 ? 1 : Math.pow(Math.cos(Math.min(1, (u - 0.52) / 0.48) * Math.PI / 2), 0.78));
  const bWl = (u) => bDeck(u) * (u < 0.52 ? 0.985 : 1 - flare * sstep(0.52, 1, u)) * (u < 0.06 ? 0.93 : 1);
  const Tu = (u) => T * (u < 0.12 ? 0.62 + 0.38 * sstep(0, 0.12, u) : u > 0.82 ? 1 - 0.72 * sstep(0.82, 1, u) : 1);
  const fino = (u) => (u < 0.08 ? 0.55 : u < 0.6 ? 1 : 1 - sstep(0.6, 0.97, u)) * (EC === 'corv' ? 0.62 : EC === 'eua' ? 0.8 : 1); /* corveta/EUA: fundo em V (quina viva) */
  const secao = [];
  for (let i = 0; i <= NS; i++) { const u = us[i]; const z0 = L / 2 - u * L; const T0 = Tu(u), F0 = bordaLivre(C, u), bw = bWl(u) * B / 2, f = fino(u); const S = [];
    // tumblehome: o convés é mais ESTREITO que a linha d'água (costado inclinado para dentro, assinatura radar baixa)
    const bd = tumble ? bw * (EC === 'eua' ? 0.76 : 0.8) : bDeck(u) * B / 2 * (u > 0.55 ? 1 : 0.995) * (EC === 'chn' ? 1 + 0.1 * sstep(0.6, 0.9, u) : EC === 'rus' ? 1 + 0.06 * sstep(0.55, 0.85, u) : 1); /* CHN/RUS: proa com grande alargamento */
    for (let k = 0; k <= K; k++) { const s = k / K; let y, w; const ks = 0.6;
      if (s <= ks) { const e = s / ks; y = -T0 + T0 * e; const U = Math.pow(1 - Math.pow(1 - e, 5), 0.2), V = Math.pow(e, 0.85); w = bw * (f * U + (1 - f) * V); }
      else { const e = (s - ks) / (1 - ks); y = F0 * e; if (tumble) { w = bw + (bd - bw) * e; } else if (EC === 'rus') { const kn = 0.55; w = e < kn ? bw + (bd * 1.04 - bw) * (e / kn) : bd * 1.04 - bd * 0.07 * ((e - kn) / (1 - kn)); /* quina (knuckle) e costado recolhido acima dela */ }
        else { const pf = u > 0.6 ? 0.9 + 1.1 * sstep(0.6, 0.95, u) : 0.9; w = bw + (bd - bw) * Math.pow(e, pf); // chanfro anti-radar na quina do convés (CHN: costado limpo, sem chanfro)
          if (e > 0.86 && EC !== 'chn') w -= (bd * (EC === 'uk' || EC === 'corv' ? 0.06 : 0.04)) * (e - 0.86) / 0.14; } }
      const zr = z0 + 0.14 * (y + T0) * sstep(0.05, 0, u) - rake * L * sstep(0.8, 1, u) * ((y + T0) / (T0 + F0)) - (L > 100 && !tumble ? 0.015 * L * sstep(0.9, 1, u) * Math.max(0, 1 - Math.abs(y + T0 * 0.7) / (T0 * 0.35)) : 0);
      S.push([Math.max(0, w), y, zr]); }
    secao.push(S); }
  const pos = [], cor = [], uv = [], idx = []; const nV = K + 1; const CA = new THREE.Color(EC === 'eua' ? '#3a2c2a' : EC === 'chn' ? '#6a2a24' : '#5f2622'), CB = new THREE.Color(EC === 'eua' ? '#2b3036' : '#15181c'), CT = new THREE.Color('#ffffff'), cc = new THREE.Color(); /* faixa de flutuação (boot-topping) por escola */
  for (let i = 0; i <= NS; i++) for (const lado of [1, -1]) for (let k = 0; k <= K; k++) { const [x, y, z] = secao[i][k]; pos.push(x * lado, y, z); uv.push((L / 2 - z) / 9, (y + T) / 9); cc.copy(y < -0.15 ? CA : y < 0.55 ? CB : CT); cor.push(cc.r, cc.g, cc.b); }
  const id = (i, lado, k) => (i * 2 + (lado > 0 ? 0 : 1)) * nV + k;
  for (let i = 0; i < NS; i++) for (let k = 0; k < K; k++) { const a = id(i, 1, k), b = id(i + 1, 1, k), c = id(i + 1, 1, k + 1), d = id(i, 1, k + 1); idx.push(a, b, c, a, c, d); const a2 = id(i, -1, k), b2 = id(i + 1, -1, k), c2 = id(i + 1, -1, k + 1), d2 = id(i, -1, k + 1); idx.push(a2, c2, b2, a2, d2, c2); }
  const costado = new THREE.BufferGeometry(); costado.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); costado.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3)); costado.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); costado.setIndex(idx); costado.computeVertexNormals();
  const dp = [], di = [], du = []; for (let i = 0; i <= NS; i++) { const [x, y, z] = secao[i][K]; dp.push(x, y, z, -x, y, z); du.push(x / 5, (L / 2 - z) / 5, -x / 5, (L / 2 - z) / 5); }
  for (let i = 0; i < NS; i++) { const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3; di.push(a, c, b, b, c, d); }
  const conves = new THREE.BufferGeometry(); conves.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); conves.setAttribute('uv', new THREE.Float32BufferAttribute(du, 2)); conves.setIndex(di); conves.computeVertexNormals();
  const ep = [], ei = [], ec = [], eu = []; const S0 = secao[0]; S0.forEach(([x, y, z]) => ep.push(x, y, z)); S0.forEach(([x, y, z]) => ep.push(-x, y, z));
  for (let k = 0; k < K; k++) { const a = k, b = k + 1, c = nV + k, d = nV + k + 1; ei.push(a, b, d, a, d, c); }
  for (let i = 0; i < ep.length; i += 3) { const y = ep[i + 1]; (y < -0.15 ? CA : y < 0.55 ? CB : CT).toArray(ec, ec.length); eu.push(ep[i] / 12 + 0.5, (y + 4) / 12); }
  const espelho = new THREE.BufferGeometry(); espelho.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3)); espelho.setAttribute('color', new THREE.Float32BufferAttribute(ec, 3)); espelho.setAttribute('uv', new THREE.Float32BufferAttribute(eu, 2)); espelho.setIndex(ei); espelho.computeVertexNormals();
  return { costado, conves, espelho, secao };
}

// ---------- materiais por equipe (compartilhados entre todos os navios do time) ----------
const MATS = {};
export function materiais(time) {
  if (MATS[time]) return MATS[time];
  const azul = time === 'azul'; const base = azul ? '#7d8286' : '#696e72'; /* v1.2.9: cinzas navais naturais (menos azulados) */ /* v1.2.3: inimigo com a MESMA pintura detalhada do jogador (cinza-ardósia próprio), não mais camuflagem escura chapada */
  const map = texPintura(THREE, { base, s: azul ? 1 : 4 });
  const nm = texChapas(THREE, { s: 2 }), rg = texRugo(THREE, { s: 3 });
  const M = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.46, metalness: 0.56, envMapIntensity: 1.05 } /* v1.2.15: aço pintado mais metálico (reflexo PMREM do céu), ainda acetinado */ /* v1.2.10: pintura metálica naval mais convincente (reflexo suave do céu, sem espelho) */, o)); /* v1.2.8: aço pintado — metálico sutil, ainda fosco */ /* v1.2.5: pintura mais fosca */
  const naoDerrapante = texRugo(THREE, { s: 9, base: 0.85 });
  const m = {
    casco: M({ map, normalMap: nm, normalScale: new THREE.Vector2(0.45, 0.45), roughnessMap: rg, vertexColors: true }),
    sup: M({ map, normalMap: nm, normalScale: new THREE.Vector2(0.55, 0.55), roughnessMap: rg }),
    conves: M({ map: texConves(), color: azul ? '#40464c' : '#2c3136', roughness: 0.92, metalness: 0.08, roughnessMap: naoDerrapante, bumpMap: naoDerrapante, bumpScale: 0.4 }),
    escuro: M({ color: '#1d2228', roughness: 0.55, metalness: 0.5 }),
    painel: M({ color: '#2a3138', roughness: 0.32, metalness: 0.7 }),
    claro: M({ color: azul ? '#d7dbdf' : '#9aa1a8', roughness: 0.45, metalness: 0.2 }),
    aa: M({ color: azul ? '#a3a9af' : '#80878e', roughness: 0.74, metalness: 0.12, envMapIntensity: 0.55 }), /* v1.2.19 item 4: CIWS/30 mm/laser em tinta naval FOSCA (cinza-névoa) — antes 'claro' quase branco e acetinado virava bolha branca com bloom */
    vidro: M({ color: '#0d1b2a', roughness: 0.08, metalness: 0.9, envMapIntensity: 1.3 }),
    bote: M({ color: '#ea580c', roughness: 0.7, metalness: 0.05 }),
    heli: new THREE.MeshStandardMaterial({ map: texHeliponto(THREE), roughness: 0.85, metalness: 0.05 }),
    janela: registraLuz(new THREE.MeshStandardMaterial({ map: texJanelas(THREE, 9), emissiveMap: texJanelas(THREE, 9), emissive: '#ffcf8a', roughness: 0.12, metalness: 0.6, envMapIntensity: 1.4 }), 0.9),
    vigia: registraLuz(new THREE.MeshStandardMaterial({ map: texVigias(), emissiveMap: texVigias(true), emissive: '#ffd59a', transparent: true, alphaTest: 0.3, roughness: 0.3, metalness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }), 2.2),
    porta: new THREE.MeshStandardMaterial({ map: texPorta(THREE), roughness: 0.6, metalness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 }),
    grade: new THREE.MeshStandardMaterial({ map: texPorta(THREE, true), roughness: 0.6, metalness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 }),
    hangar: new THREE.MeshStandardMaterial({ map: texHangar(THREE), roughness: 0.65, metalness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 }),
    linha: new THREE.LineBasicMaterial({ color: azul ? '#d5dadf' : '#8b939b', transparent: true, opacity: 0.85 }),
    balaustre: new THREE.MeshStandardMaterial({ color: azul ? '#59626b' : '#3a4148', roughness: 0.55, metalness: 0.5 }),
  };
  MATS[time] = m; return m;
}
const mesh = (g, m) => { const x = new THREE.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; return x; };
const cil = (r1, r2, h, n = 12) => new THREE.CylinderGeometry(r1, r2, h, n);
const caixa = (w, h, d) => new THREE.BoxGeometry(w, h, d);
/** Bloco furtivo octogonal com paredes inclinadas. */
const bloco = (w, c, h, enc = 0.84, ch = 0.18) => { const x = w / 2, z = c / 2, a = Math.min(x, z) * ch * 2; return prisma(THREE, [[-x + a, -z], [x - a, -z], [x, -z + a], [x, z - a], [x - a, z], [-x + a, z], [-x, z - a], [-x, -z + a]], h, enc, 0.92); };

/** Torre do canhão: base furtiva facetada + munhão + cano com extrator e freio de boca. Pivô em y = 1.9 (igual à sim). */
/** Casamata de couraçado (152 mm duplo): face inclinada, teto com telêmetro de "orelhas", periscópios, canos longos com
 *  sacos de vedação e freio de boca. Pivô em (0, t.py, t.pz) — os mesmos números que a simulação usa para a boca do cano. */
function torreCouracado(M, t) {
  const g = new THREE.Group(); g.name = 'torre'; const canos = t.canos || 2;
  const casa = mesh(prisma(THREE, [[-3.9, -6.6], [3.9, -6.6], [5.9, -3.6], [5.9, 6.4], [5.2, 7.2], [-5.2, 7.2], [-5.9, 6.4], [-5.9, -3.6]], 4.3, 0.9, 0.93), M.sup); casa.position.y = 0.15; g.add(casa);
  const anel = mesh(cil(6.1, 6.3, 0.5, 28), M.escuro); anel.position.y = 0.05; g.add(anel);
  const tel = mesh(caixa(14.2, 0.9, 1.5), M.sup); tel.position.set(0, 3.55, 4.3); g.add(tel); [-1, 1].forEach((sx) => { const o = mesh(cil(0.55, 0.55, 0.5, 12).rotateZ(Math.PI / 2), M.escuro); o.position.set(sx * 7.2, 3.55, 4.3); g.add(o); });
  [-1, 1].forEach((sx) => { const pe = mesh(caixa(1.1, 0.7, 1.3), M.sup); pe.position.set(sx * 2.6, 4.75, -2.6); g.add(pe); const vi = mesh(caixa(0.8, 0.22, 0.05), M.escuro); vi.position.set(sx * 2.6, 4.8, -3.27); g.add(vi); });
  const esc = mesh(caixa(2.2, 0.35, 2.0), M.escuro); esc.position.set(0, 4.55, 1.2); g.add(esc);
  const piv = new THREE.Group(); piv.name = 'pivo'; piv.position.set(0, t.py, t.pz); g.add(piv);
  for (let k = 0; k < canos; k++) { const cano = new THREE.Group(); cano.name = k ? 'cano' + (k + 1) : 'cano'; cano.position.x = canos > 1 ? ((2 * k - (canos - 1)) / (canos - 1)) * t.esp : 0; /* v1.2.9: canos simétricos (= sim) */ piv.add(cano); const Lc = t.lc;
    cano.add(mesh(cil(0.27, 0.43, Lc, 16).rotateX(-Math.PI / 2).translate(0, 0, -Lc / 2), M.sup));
    cano.add(mesh(cil(0.62, 0.7, 1.7, 14).rotateX(-Math.PI / 2).translate(0, 0, -3.9), M.escuro));
    cano.add(mesh(cil(0.47, 0.47, 1.1, 14).rotateX(-Math.PI / 2).translate(0, 0, -Lc * 0.42), M.sup));
    cano.add(mesh(cil(0.36, 0.33, 0.9, 14).rotateX(-Math.PI / 2).translate(0, 0, -Lc + 0.45), M.escuro)); }
  const porta = mesh(caixa(canos > 1 ? t.esp * 2 + 2.0 : 2.0, 1.7, 0.4), M.escuro); porta.position.set(0, t.py, -6.45); g.add(porta);
  return g;
}
/** Torre furtiva EMBUTIDA (155 mm): casamata baixa facetada de faces planas, cano que se recolhe numa ranhura. */
function torreEmbutida(M, t) { const g = new THREE.Group(); g.name = 'torre'; const s = 1.35;
  const casa = mesh(prisma(THREE, [[-1.6 * s, -4.4 * s], [1.6 * s, -4.4 * s], [3.0 * s, -1.6 * s], [3.0 * s, 3.4 * s], [-3.0 * s, 3.4 * s], [-3.0 * s, -1.6 * s]], 2.0 * s, 0.62, 0.8), M.sup); casa.position.y = 0.05; g.add(casa);
  const ran = mesh(caixa(0.9, 0.5, 3.6 * s), M.escuro); ran.position.set(0, 1.45 * s, -2.6 * s); g.add(ran);
  const piv = new THREE.Group(); piv.name = 'pivo'; piv.position.set(0, t.py / (t.esc || 1), t.pz / (t.esc || 1)); g.add(piv); const L = t.lc / (t.esc || 1);
  const cano = new THREE.Group(); cano.name = 'cano'; piv.add(cano); cano.add(mesh(cil(0.2, 0.3, L, 12).rotateX(-Math.PI / 2).translate(0, 0, -L / 2), M.escuro)); cano.add(mesh(caixa(0.7, 0.55, 1.6).translate(0, 0, -0.6), M.sup)); return g; }
function torreCanhao(M, cal, canos = 1, t = null) {
  if (t && t.estilo === 'couracado') return torreCouracado(M, t);
  if (t && t.estilo === 'embutido') return torreEmbutida(M, t);
  const g = new THREE.Group(), s = cal / 127, dupla = canos > 1; g.name = 'torre';
  const base = mesh(bloco((4.6 * s + 1.4) * (dupla ? 1.35 : 1), (5.8 * s + 1.6) * (dupla ? 1.12 : 1), (2.2 * s + 0.6) * (dupla ? 1.15 : 1), 0.66, 0.34), M.sup); base.position.z = 0.4; g.add(base);
  const piv = new THREE.Group(); piv.name = 'pivo'; piv.position.set(0, 1.9, -1.2 * s); g.add(piv);
  const L = cal > 140 ? 9 : cal > 100 ? 7.5 : 5.2; const off = dupla ? s * 0.85 : 0;
  for (let k = 0; k < canos; k++) { const cano = new THREE.Group(); cano.name = k ? 'cano' + (k + 1) : 'cano'; cano.position.x = dupla ? ((2 * k - (canos - 1)) / (canos - 1)) * off : 0; /* v1.2.9: 3 canos: −1, 0, +1 (= sim) */ piv.add(cano);
    cano.add(mesh(cil(0.1 * s + 0.07, 0.17 * s + 0.08, L, 12).rotateX(-Math.PI / 2).translate(0, 0, -L / 2), M.escuro));
    cano.add(mesh(cil(0.22 * s + 0.07, 0.22 * s + 0.07, 0.9, 12).rotateX(-Math.PI / 2).translate(0, 0, -L * 0.45), M.escuro));
    cano.add(mesh(cil(0.2 * s + 0.08, 0.2 * s + 0.08, 0.55, 10).rotateX(-Math.PI / 2).translate(0, 0, -L + 0.28), M.escuro)); }
  const manto = mesh(caixa((1.1 * s + 0.3) * (dupla ? 2.1 : 1), 0.9 * s + 0.3, 0.6), M.sup); manto.position.z = -0.1; piv.add(manto);
  return g;
}
/** Reparo secundário de 30 mm (gira e eleva). */
function reparo30(M) { const g = new THREE.Group(); g.add(mesh(cil(0.55, 0.65, 0.7, 10).translate(0, 0.35, 0), M.aa)); const cab = new THREE.Group(); cab.name = 'cab'; cab.position.y = 0.95; g.add(cab);
  cab.add(mesh(caixa(0.9, 0.6, 1.1), M.aa)); cab.add(mesh(cil(0.06, 0.07, 2.4, 6).rotateX(-Math.PI / 2).translate(0, 0.05, -1.7), M.escuro)); return g; }
function ciwsMount(M) { const g = new THREE.Group(); g.name = 'ciws'; const b = mesh(cil(0.85, 1.0, 1.1, 12), M.aa); b.position.y = 0.55; g.add(b);
  const cab = new THREE.Group(); cab.name = 'cab'; cab.position.y = 1.3; g.add(cab); const d = mesh(new THREE.SphereGeometry(0.85, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.5, 1), M.aa); d.position.y = 0.2; cab.add(d);
  const cn = new THREE.Group(); cn.name = 'canos'; cn.position.set(0, -0.1, -0.6); cab.add(cn); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const t = mesh(cil(0.05, 0.05, 1.9, 5).rotateX(-Math.PI / 2).translate(Math.cos(a) * 0.14, Math.sin(a) * 0.14, -0.95), M.escuro); cn.add(t); }
  return g; }
function helicoptero(M) { const g = new THREE.Group(); const m2 = new THREE.MeshStandardMaterial({ color: '#59646d', roughness: 0.6, metalness: 0.3 });
  const f = mesh(new THREE.CapsuleGeometry(1.25, 4.6, 6, 12), m2); f.rotation.x = Math.PI / 2; f.position.y = 1.7; g.add(f); const cab = mesh(new THREE.SphereGeometry(1.15, 12, 8), M.vidro); cab.position.set(0, 1.9, -2.6); cab.scale.set(0.95, 0.8, 1.1); g.add(cab);
  const cauda = mesh(cil(0.32, 0.55, 6.5, 8), m2); cauda.rotation.x = Math.PI / 2; cauda.position.set(0, 2.1, 5.2); g.add(cauda); const der = mesh(caixa(0.12, 1.7, 1.2), m2); der.position.set(0, 2.9, 8.2); g.add(der);
  for (let i = 0; i < 4; i++) { const p = mesh(caixa(0.45, 0.06, 6.4).translate(0, 0, 3.2), M.escuro); p.position.y = 3.25; p.rotation.y = i * Math.PI / 2 + 0.4; g.add(p); }
  [-1, 1].forEach((s) => { const r = mesh(cil(0.3, 0.3, 0.25, 10), M.escuro); r.rotation.z = Math.PI / 2; r.position.set(s * 1.2, 0.3, -1.4); g.add(r); }); return g; }
function bote(M) { const g = new THREE.Group(); const t = new THREE.CapsuleGeometry(0.42, 5.6, 4, 10); t.rotateX(Math.PI / 2); [-1, 1].forEach((s) => { const c = mesh(t, M.bote); c.position.x = s * 0.9; g.add(c); }); const fundo = mesh(caixa(1.6, 0.3, 5.8), M.escuro); fundo.position.y = -0.2; g.add(fundo); const cons = mesh(caixa(0.8, 0.8, 0.7), M.claro); cons.position.set(0, 0.4, 0.4); g.add(cons); return g; }
let TCV = null;
/** Convés antiderrapante: chapas com juntas, pontos de amarração e faixa de passadiço (tile de 5 m, cinza neutro — a pintura tinge). */
function texConves() { if (TCV) return TCV; const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'); x.scale(4, 4); /* v1.2.17 item 3: 4× resolução (juntas e marcas nítidas) */ x.fillStyle = '#b9bdc1'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { const v = 150 + Math.random() * 70 | 0; x.fillStyle = `rgba(${v},${v},${v},0.35)`; x.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5); }
  x.strokeStyle = 'rgba(40,44,48,0.55)'; x.lineWidth = 2; x.strokeRect(1, 1, 254, 254); x.beginPath(); x.moveTo(128, 0); x.lineTo(128, 256); x.stroke();
  x.fillStyle = 'rgba(30,32,36,0.7)'; for (const [a, b] of [[64, 64], [192, 64], [64, 192], [192, 192]]) { x.beginPath(); x.arc(a, b, 5, 0, Math.PI * 2); x.fill(); }
  for (let i = 0; i < 14; i++) { const px = Math.random() * 256, py = Math.random() * 256, r = 10 + Math.random() * 34; const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${Math.random() < 0.3 ? '90,62,40' : '60,64,68'},0.16)`); g.addColorStop(1, 'rgba(60,64,68,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2); } /* v1.2.5: desgaste e manchas no convés */
  x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 1; for (let k = 32; k < 256; k += 32) { x.beginPath(); x.moveTo(0, k + 0.5); x.lineTo(256, k + 0.5); x.stroke(); }
  grao(c, 6, 21); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = (globalThis.__nnsAniso || 8) /* v1.2.15: anisotropia máx. suportada */; TCV = t; return t; }
const HALOS = new Map(); let THALO = null;
/** Halo aditivo das luzes (navegação/convés): acende ao entardecer/noite via registraLuz (opacidade segue a hora). */
function matHalo(cor) { if (HALOS.has(cor)) return HALOS.get(cor); if (!THALO) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.75)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); THALO = new THREE.CanvasTexture(c); }
  const m = new THREE.SpriteMaterial({ map: THALO, color: cor, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); m.userData.opac = 0.95; registraLuz(m); HALOS.set(cor, m); return m; }
function corrimao(segs, pts, h = 1.05, passo = 1.6) { for (let i = 0; i < pts.length - 1; i++) { const [ax, ay, az] = pts[i], [bx, by, bz] = pts[i + 1]; for (const f of [1, 0.5]) segs.push(ax, ay + h * f, az, bx, by + h * f, bz); const d = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(d / passo)); for (let k = 0; k < n; k++) { const u = k / n; segs.push(ax + (bx - ax) * u, ay + (by - ay) * u, az + (bz - az) * u, ax + (bx - ax) * u, ay + (by - ay) * u + h, az + (bz - az) * u); } } }

/** v1.2.15: material de letras de OURO metálico (PBR): canvas local com capitais espaçadas, bisel/sombra de gravação; metalness alto, rugosidade baixa (reflete o ambiente PMREM). */
const _OURO = new Map(); function matOuro(txt, estilo = 'ouro') { const nav = estilo === 'naval', ck = nav ? 'N:' + txt : txt; if (_OURO.has(ck)) return _OURO.get(ck); /* v1.2.16 item 34: estilo 'naval' = letras branco-acinzentadas foscas (padrão marinha de guerra), mesmo programa do nome em ouro */
  /* v1.2.16: canvas POTÊNCIA DE 2 (2048×256), fonte genérica 'serif' bold (existe em qualquer WebView), letras ajustadas à largura; UV cortado na largura usada;
     MIPMAPS PRÓPRIOS com reforço de alfa (o mipmap automático diluía o alfa das letras finas e o alphaTest 0,35 as descartava em ângulo rasante/distância no celular → só o nome de popa, de frente, sobrevivia) */
  const W = 2048, H = 256; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'); const n = txt.length;
  let fs = 190; /* v1.2.16 item 11: padrão MARINHA DE GUERRA — capitais condensadas sóbrias (genérica do sistema) com pontes de estêncil */ const FN = (f) => `900 ${f}px "sans-serif-condensed", "Roboto Condensed", "DejaVu Sans Condensed", "Arial Narrow", sans-serif`; x.font = FN(fs); let esp = fs * 0.14; const larg = () => [...txt].reduce((a, ch) => a + (ch === ' ' ? fs * 0.45 : x.measureText(ch).width), 0) + esp * (n - 1) + 40;
  while (larg() > W - 8 && fs > 40) { fs -= 6; x.font = FN(fs); esp = fs * 0.14; } const usado = Math.min(W, Math.ceil(larg()));
  const base = H * 0.5 + fs * 0.36; const gr = x.createLinearGradient(0, base - fs * 0.75, 0, base + fs * 0.05); if (nav) { gr.addColorStop(0, '#f6f7f8'); gr.addColorStop(0.5, '#e4e7ea'); gr.addColorStop(1, '#c7ccd1'); } else { gr.addColorStop(0, '#fff2c0'); gr.addColorStop(0.38, '#e8be50'); gr.addColorStop(0.62, '#b8862a'); gr.addColorStop(1, '#f4d67e'); }
  x.textBaseline = 'alphabetic'; x.lineJoin = 'round'; let px = 20;
  for (const ch of txt) { const w = ch === ' ' ? fs * 0.45 : x.measureText(ch).width; if (ch !== ' ') { x.fillStyle = nav ? 'rgba(10,12,14,0.55)' : 'rgba(40,28,8,0.9)'; x.fillText(ch, px + 4, base + 5); x.strokeStyle = nav ? '#4b5258' : '#8a6418'; x.lineWidth = Math.max(3, fs * 0.05); x.strokeText(ch, px, base); x.fillStyle = gr; x.fillText(ch, px, base); x.strokeStyle = nav ? 'rgba(255,255,255,0.35)' : 'rgba(255,246,210,0.6)'; x.lineWidth = 2; x.strokeText(ch, px, base); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.fillRect(px - 6, base - fs * 0.39, w + 12, Math.max(3, fs * 0.045)); x.globalCompositeOperation = 'source-over'; /* ponte de estêncil */ } px += w + esp; }
  const mips = [cv]; let c0 = cv; while (c0.width > 1 || c0.height > 1) { const c1 = document.createElement('canvas'); c1.width = Math.max(1, c0.width >> 1); c1.height = Math.max(1, c0.height >> 1); const y = c1.getContext('2d', { willReadFrequently: true }); y.imageSmoothingEnabled = true; y.imageSmoothingQuality = 'high'; y.drawImage(c0, 0, 0, c1.width, c1.height);
    if (c1.width * c1.height > 1) { const d = y.getImageData(0, 0, c1.width, c1.height); const a = d.data; for (let k = 3; k < a.length; k += 4) a[k] = Math.min(255, a[k] * 1.45); y.putImageData(d, 0, 0); } mips.push(c1); c0 = c1; }
  const t = new THREE.CanvasTexture(cv); t.mipmaps = mips; t.generateMipmaps = false; t.minFilter = THREE.LinearMipmapLinearFilter; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = (globalThis.__nnsAniso || 8); t.repeat.set(usado / W, 1); t.needsUpdate = true;
  const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: nav ? '#1c1f22' : '#5a4210', emissiveIntensity: nav ? 0.3 : 0.55, transparent: true, alphaTest: 0.12, metalness: nav ? 0.05 : 0.9, roughness: nav ? 0.72 : 0.3, envMapIntensity: nav ? 0.6 : 1.35, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 });
  /* puxa o decalque ~0,25% para a câmera no espaço de vista: sem z-fighting com o costado mesmo a 5 km (precisão de profundidade do celular) */
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  mvPosition.xyz *= 0.9975; gl_Position = projectionMatrix * mvPosition;'); }; m.customProgramCacheKey = () => 'nomeOuro1216';
  m.userData.asp = (usado / W) * (W / H); m.userData.nomeOuro = 1; _OURO.set(ck, m); return m; }
/** Monta o navio completo (modelo-matriz). */
function montaModelo(tipo, time, mais = 0) {
  if (CLASSES[tipo].m1231) return montaModelo1231(CLASSES[tipo], time); /* v1.2.31: 3 navios lendários reais (modelo próprio) */
  const C = CLASSES[tipo], P = layoutDe(C, mais), M = materiais(time); const g = new THREE.Group(); const { L, B } = C;
  const dY = (z) => deckYC(C, z), meia = (z) => meiaBoca(C, z) / (C.casco === 'tumblehome' ? 0.86 : 1);
  const H = geoCasco(C); const mc = M.casco.clone(); mc.map = M.casco.map.clone(); mc.map.repeat.set(L / 40, 1); mc.map.needsUpdate = true; mc.normalMap = M.casco.normalMap.clone(); mc.normalMap.repeat.set(L / 9, 2); mc.normalMap.needsUpdate = true;
  g.add(mesh(H.costado, mc)); { const kb = ({ eua: 0, chn: 1.45, uk: 0.8, bra: 0.9, corv: 0.55, rus: 1 })[C.cascoN] ?? 1; const bb = mesh(new THREE.SphereGeometry(1, 16, 10).scale(B * 0.11 * Math.max(0.01, kb), C.T * 0.32 * Math.max(0.01, kb ** 0.6), L * 0.045 * Math.max(0.01, kb)), M.escuro); bb.visible = kb > 0; bb.position.set(0, -C.T * 0.62, -L / 2 + L * 0.03); g.add(bb); } /* bulbo de proa */
  /* v1.2.16: convés e espelho de popa voltaram a ser montados (estavam engolidos por um comentário // na mesma linha → casco aberto: viam-se faces internas, mar e fundo DENTRO do navio) */
  const dm = mesh(H.conves, M.conves); dm.position.y = 0.02; g.add(dm); g.add(mesh(H.espelho, mc));
  const meiaEm = (z, y) => { let sc = H.secao[0], bz = 1e9; for (const q of H.secao) { const dz = Math.abs(q[0][2] - z); if (dz < bz) { bz = dz; sc = q; } } let m = 0; for (const q of sc) if (Math.abs(q[1] - y) < 1.5) m = Math.max(m, Math.abs(q[0])); if (!m) for (const q of sc) m = Math.max(m, Math.abs(q[0])); return m; }; /* v1.2.15: meia-boca REAL na altura do nome (seção mais próxima em z), letras rentes ao costado */
  const meiaReal = (z) => { const u = Math.max(0, Math.min(1, (L / 2 - z) / L)); const i = Math.round(u * (H.secao.length - 1)); return H.secao[Math.min(H.secao.length - 1, i)][16][0]; };
  // números de casco nas amuras (azul: claros; vermelho: discretos)
  const tn = texNumero(THREE, C.num.replace(' ', ''), time === 'azul' ? '#f1f5f9' : '#e2e8f0'); const mn = new THREE.MeshBasicMaterial({ map: tn, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  [-1, 1].forEach((s) => { const zz = -L * 0.3; const hN = Math.min(L * 0.06, dY(zz) * 0.62), wN = hN * 2.1; const p = new THREE.Mesh(new THREE.PlaneGeometry(wN, hN), mn); p.position.set(s * (meiaReal(zz) * 0.93 + 0.15), dY(zz) * 0.58, zz); p.rotation.y = s * Math.PI / 2; p.rotation.z = C.casco === 'tumblehome' ? -s * 0.2 : 0; p.userData.det = 1; g.add(p); });
  /* v1.2.15 NOME EM LETRAS DOURADAS (Colosso: VALTER AMORIM · Rafaella: RAFAELLA) — capitais com espaçamento uniforme, alinhadas à linha do convés, acima da linha d'água, nos dois costados perto da proa e no espelho de popa; ouro METÁLICO PBR (reflete o céu), textura de canvas local */
  { /* v1.2.16 item 34: posicionamento do nome reaproveitável (nome fictício padrão em estilo naval nos navios sem nome próprio, aplicado no clone) */ const poeNome = (g, mo, esc = 1) => { const zz = -L * 0.19, kG = Math.max(0, Math.min(1, (L - 180) / 150)), hT = Math.max(1.6, Math.min(6 + 4 * kG, dY(zz) * (0.42 + 0.16 * kG))) * esc /* v1.2.17 item 5: navios > 300 m (borda livre alta) com letras proporcionais ao casco (até 9 m), legíveis no estaleiro */, wT = hT * mo.userData.asp; /* v1.2.16: letras GRANDES (era ≤3,4 m · 26% da borda livre) */
    [-1, 1].forEach((s) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(wT, hT), mo); const yN = dY(zz) - hT * 0.62; p.position.set(s * (Math.max(meiaEm(zz, yN), meiaEm(zz - wT / 2, yN), meiaEm(zz + wT / 2, yN)) + 0.22), yN, zz); { /* v1.2.17 item 13: letras PARALELAS à borda do convés — linha de base segue o TOSADO (inclinação do convés no trecho do nome) e a face acompanha a
       inclinação do costado (tumblehome inclina para dentro, sem girar o texto). Antes: rotation.z girava o texto no próprio plano (≈11° no tumblehome). O balanço/caturro vem do grupo do navio. */
      const k = (dY(zz + 2) - dY(zz - 2)) / 4, ai = C.casco === 'tumblehome' ? 0.2 : 0; const u = new THREE.Vector3(0, -s * k, -s).normalize(), nN = new THREE.Vector3(s * Math.cos(ai), Math.sin(ai), 0);
      const v = new THREE.Vector3().crossVectors(nN, u).normalize(); nN.crossVectors(u, v).normalize(); p.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(u, v, nN)); p.userData.tosado = Math.atan(k); }
      p.name = 'nomeOuro'; p.renderOrder = 3; g.add(p); }); /* v1.2.16: fora do LOD 'det' (visível a média distância) e fora da fusão estática; desenhado depois da faixa de enfeite */
    { const zp = L / 2 - 0.4, hP = hT * 0.8, wP = Math.min(meiaReal(L / 2 - 2) * 1.5, hP * mo.userData.asp); const p = new THREE.Mesh(new THREE.PlaneGeometry(wP, wP / mo.userData.asp), mo); p.position.set(0, dY(zp) - hP * 1.2, zp + 0.35); p.name = 'nomeOuroPopa'; p.renderOrder = 3; g.add(p); } }; g.userData.poeNome = poeNome; const nomeOuro = NOMES_OURO[C.id] || null; /* v1.2.16: + MARCOS VINÍCIUS, COMANDANTE RODOLFO, CAPITÃ ANTÔNIA */ if (nomeOuro) poeNome(g, matOuro(nomeOuro)); }
  // v1.2.7: escovéns da âncora embutidos nas amuras (recesso escuro + âncora)
  [-1, 1].forEach((sx) => { const za = -L * 0.41, ya = dY(za) * 0.72; const rc = mesh(caixa(0.14, Math.max(1.1, L * 0.009), Math.max(1.4, L * 0.011)), M.escuro); rc.position.set(sx * (meiaReal(za) * 0.97 + 0.02), ya, za); rc.rotation.z = C.casco === 'tumblehome' ? -sx * 0.2 : sx * 0.08; rc.userData.det = 1; g.add(rc);
    const an = mesh(caixa(0.18, Math.max(0.8, L * 0.006), 0.35), M.claro); an.position.set(sx * (meiaReal(za) * 0.97 + 0.1), ya - 0.15, za); an.userData.det = 1; g.add(an); });
  // ---- superestrutura piramidal integrada ----
  const s = P.sup, cS = s.z1 - s.z0, zS = (s.z0 + s.z1) / 2, wS = meiaReal(zS) * 2 * (C.casco === 'tumblehome' ? 0.92 : 0.86), y0 = dY(zS), h = s.h;
  const s1 = mesh(bloco(wS, cS, h, 0.88, 0.2), M.sup); s1.position.set(0, y0, zS); g.add(s1);
  const s2 = mesh(bloco(wS * 0.84, cS * 0.66, h, 0.82, 0.26), M.sup); s2.position.set(0, y0 + h, s.z0 + cS * 0.36); g.add(s2);
  const vb = mesh(bloco(wS * 0.74, cS * 0.2, 1.3, 0.92, 0.25), M.vidro); vb.position.set(0, y0 + h * 2 - 0.2, s.z0 + cS * 0.2); g.add(vb);
  const tt = mesh(bloco(wS * 0.7, cS * 0.3, 0.7, 0.8, 0.25), M.sup); tt.position.set(0, y0 + h * 2 + 1.05, s.z0 + cS * 0.25); g.add(tt);
  const jan = new THREE.Mesh(new THREE.PlaneGeometry(wS * 0.72, 1.1), M.janela); jan.position.set(0, y0 + h * 2 + 0.45, s.z0 + cS * 0.1 - 0.05); jan.rotation.order = 'YXZ'; jan.rotation.y = Math.PI; jan.rotation.x = 0.22; jan.userData.det = 1; g.add(jan);
  // mastro integrado fechado (pirâmide facetada) com 4 painéis planos AESA; corveta: mastro menor com radar giratório
  const nMg0 = g.children.length;
  const yM = y0 + h * 2 + 1.7, zM = s.z0 + cS * 0.42; const hm = L * 0.085 * (C.id === 'corveta' ? 0.8 : 1);
  const mm = mesh(bloco(wS * 0.52, cS * 0.28, hm, 0.42, 0.3), M.sup); mm.position.set(0, yM, zM); g.add(mm);
  const pr = Math.min(wS * 0.3, hm * 0.32) * 0.62; [[0, -1], [0, 1], [1, 0], [-1, 0]].forEach(([sx, sz]) => { const p = mesh(new THREE.CircleGeometry(pr, 8), M.painel); const off = sx ? wS * 0.26 * 0.74 : cS * 0.14 * 0.74; p.position.set(sx * off, yM + hm * 0.42, zM + sz * off); p.lookAt(p.position.x + sx * 10, p.position.y + 2.6, p.position.z + sz * 10); g.add(p); });
  const top = mesh(cil(0.25, 0.42, 5, 8), M.claro); top.position.set(0, yM + hm + 2.4, zM); g.add(top); const dome = mesh(new THREE.SphereGeometry(0.95, 12, 8), M.claro); dome.position.set(0, yM + hm + 5.3, zM); g.add(dome);
  const nMg1 = g.children.length;
  const rg = new THREE.Group(); rg.name = 'radar'; rg.position.set(0, yM + hm + 0.6, zM); rg.add(mesh(caixa(4.2, 0.9, 0.3), M.escuro)); g.add(rg);
  // chaminé furtiva com grelha
  const zc = s.z1 - cS * 0.12; if (C.canhao.torres < 3 && !C.couracado) { const ch = mesh(bloco(wS * 0.4, cS * 0.18, h * 1.2, 0.7, 0.35), M.sup); ch.position.set(0, y0 + h, zc); g.add(ch); const bc = mesh(caixa(wS * 0.22, 0.2, cS * 0.08), M.escuro); bc.position.set(0, y0 + h * 2.2 + 0.05, zc); g.add(bc); }
  g.userData.chamine = new THREE.Vector3(0, y0 + h * 2.3, zc);
  if (C.canhao.torres >= 3 || C.couracado) { // ---- Fortaleza B 90: superestrutura de couraçado (torre de comando, chaminés, mastros, botes) ----
    const zT = s.z0 + cS * 0.17; const t3 = mesh(bloco(wS * 0.58, cS * 0.24, h, 0.9, 0.22), M.sup); t3.position.set(0, y0 + h * 2, zT); g.add(t3);
    const t4 = mesh(bloco(wS * 0.5, cS * 0.17, h * 0.85, 0.9, 0.25), M.sup); t4.position.set(0, y0 + h * 3, zT - 0.5); g.add(t4);
    const asa = mesh(caixa(wS * 0.98, 0.35, 3.2), M.sup); asa.position.set(0, y0 + h * 3 + 0.2, zT - cS * 0.05); g.add(asa); /* asas do passadiço */
    for (const [yy, ww, zz] of [[y0 + h * 3 + 1.6, wS * 0.46, zT - cS * 0.085 - 0.6], [y0 + h * 2 + 1.5, wS * 0.54, zT - cS * 0.12 - 0.05], [y0 + h + 1.5, wS * 0.8, s.z0 + cS * 0.035]]) {
      const jf = new THREE.Mesh(new THREE.PlaneGeometry(ww, 1.0), M.janela); jf.position.set(0, yy, zz); jf.rotation.y = Math.PI; jf.userData.det = 1; g.add(jf); }
    for (const sx of [-1, 1]) for (const [yy, ww, zz, k] of [[y0 + h * 3 + 1.6, cS * 0.13, zT - 0.5, 0.25], [y0 + h * 2 + 1.5, cS * 0.2, zT, 0.29], [y0 + 1.6, cS * 0.7, zS, 0.43], [y0 + h + 1.4, cS * 0.45, s.z0 + cS * 0.36, 0.36]]) {
      const jl = new THREE.Mesh(new THREE.PlaneGeometry(ww, 0.75), M.janela); jl.position.set(sx * (wS * k + 0.06), yy, zz); jl.rotation.y = sx * Math.PI / 2; jl.userData.det = 1; g.add(jl); }
    const dt2 = mesh(cil(1.5, 1.7, 1.6, 16), M.sup); dt2.position.set(0, y0 + h * 3.85 + 0.8, zT + 1); g.add(dt2); const dt3 = mesh(caixa(5.2, 0.7, 1.0), M.escuro); dt3.position.set(0, y0 + h * 3.85 + 1.9, zT + 1); g.add(dt3); /* diretor de tiro com telêmetro */
    for (const [f, hh] of [[0.6, 10.5], [0.76, 9.5]]) { const zf = s.z0 + cS * f; const ch2 = mesh(cil(2.3, 2.9, hh, 20).scale(1, 1, 1.45), M.sup); ch2.position.set(0, y0 + h + hh / 2, zf); g.add(ch2);
      const ta = mesh(cil(2.45, 2.45, 0.9, 20).scale(1, 1, 1.45), M.escuro); ta.position.set(0, y0 + h + hh + 0.2, zf); g.add(ta); for (const sx of [-0.8, 0.8]) { const ap = mesh(cil(0.18, 0.18, 2.2, 6), M.escuro); ap.position.set(sx, y0 + h + hh + 1, zf - 2.4); g.add(ap); } }
    g.userData.chamine = new THREE.Vector3(0, y0 + h + 11, s.z0 + cS * 0.6);
    const zMa = s.z0 + cS * 0.9, hMa = 17; for (const [lx, lz] of [[0, -1.6], [-1.5, 1.1], [1.5, 1.1]]) { const pe = mesh(cil(0.22, 0.32, hMa, 8), M.claro); pe.position.set(lx * 0.6, y0 + h + hMa / 2, zMa + lz * 0.6); pe.rotation.set(lz * 0.05, 0, -lx * 0.05); g.add(pe); } /* mastro de ré em tripé */
    const vg = mesh(caixa(9, 0.3, 0.3), M.claro); vg.position.set(0, y0 + h + hMa - 2.5, zMa); g.add(vg); const rr = mesh(caixa(3.4, 1.4, 0.25), M.painel); rr.position.set(0, y0 + h + hMa + 0.4, zMa); g.add(rr); const ds = mesh(new THREE.SphereGeometry(0.75, 10, 8), M.claro); ds.position.set(0, y0 + h + hMa - 1.3, zMa - 0.8); g.add(ds);
    for (const sx of [-1, 1]) for (const f of [0.62, 0.8]) { const b2 = bote(M); b2.position.set(sx * (wS / 2 - 1.2), y0 + h + 0.55, s.z0 + cS * f); b2.scale.setScalar(1.15); b2.traverse((o) => { o.userData.det = 1; }); g.add(b2);
      const tu = mesh(cil(0.12, 0.12, 3.2, 6), M.claro); tu.position.set(sx * (wS / 2 - 0.3), y0 + h + 1.6, s.z0 + cS * f - 2.6); tu.userData.det = 1; g.add(tu); const tu2 = tu.clone(); tu2.position.z += 5.2; g.add(tu2); }
    const gr = mesh(cil(0.35, 0.45, 9, 8), M.escuro); gr.position.set(0, y0 + h + 4.5, s.z1 + 3); g.add(gr); const lan = mesh(caixa(0.4, 0.4, 11), M.escuro); lan.position.set(0, y0 + h + 8.6, s.z1 + 7.5); lan.rotation.x = -0.35; g.add(lan); /* guindaste dos botes */
  }
  // ---- v1.2.0: escolas nacionais de projeto (linhas inspiradas; peças 100% procedurais e originais) ----
  /* v1.2.6: escola de projeto pela NAÇÃO (todos os navios derivados herdam), não só pelas 4 classes-base; corvetas e o couraçado ficam com o desenho próprio */
  const NAC_EST = { EUA: 'eua', CHN: 'chn', RUS: 'rus', UK: 'uk', BRA: 'bra' }; const fortaleza = C.canhao.torres >= 3 || C.couracado;
  const est = C.est25 && !C.superPA ? 'n25' /* v1.2.25 */ : fortaleza ? C.estilo : ['eua', 'chn', 'rus', 'uk'].includes(C.estilo) ? C.estilo : L < 100 ? 'corv' : NAC_EST[C.nacao] || 'bra';
  const tiraMastro = () => { for (const o of g.children.slice(nMg0, nMg1)) g.remove(o); }; let semTrelica = 0, semEsm = 0;
  const painel4 = (cx, cy, cz, ax, az, r, incl = 2.4) => [[0, -1], [0, 1], [1, 0], [-1, 0]].forEach(([sx, sz]) => { const pp = mesh(new THREE.CircleGeometry(r, 8), M.painel); pp.position.set(cx + sx * ax, cy, cz + sz * az); pp.lookAt(pp.position.x + sx * 10, pp.position.y + incl, pp.position.z + sz * 10); g.add(pp); });
  if (est === 'eua') { tiraMastro(); semTrelica = 1; semEsm = 1; /* casaria piramidal única e facetada, painéis embutidos nas 4 faces, sem mastro exposto */
    const hT = h * 1.7, zT = s.z0 + cS * 0.4; const pt = mesh(bloco(wS * 0.8, cS * 0.52, hT, 0.5, 0.16), M.sup); pt.position.set(0, y0 + h * 2, zT); g.add(pt);
    painel4(0, y0 + h * 2 + hT * 0.5, zT, wS * 0.3, cS * 0.19, Math.min(wS * 0.15, hT * 0.3), 4.5);
    rg.position.set(0, y0 + h * 2 + hT + 0.5, zT); const ant = mesh(cil(0.2, 0.3, 2.2, 8), M.claro); ant.position.set(0, y0 + h * 2 + hT + 1.6, zT + 1.2); g.add(ant); }
  else if (est === 'chn') { tiraMastro(); rg.position.set(0, y0 + h * 4.4 + 0.5, s.z0 + cS * 0.42); }
  else if (est === 'uk') { tiraMastro(); semEsm = 1; }
  else if (est === 'rus') { tiraMastro(); semEsm = 1; /* torre-mastro piramidal fechada com 4 painéis planos e cúpula no topo */
    const hT = L * 0.12, zT = s.z0 + cS * 0.45; const tw = mesh(bloco(wS * 0.46, cS * 0.3, hT, 0.36, 0.3), M.sup); tw.position.set(0, y0 + h * 2, zT); g.add(tw);
    painel4(0, y0 + h * 2 + hT * 0.45, zT, wS * 0.17, cS * 0.11, Math.min(wS * 0.12, hT * 0.16), 3);
    const dm = mesh(new THREE.SphereGeometry(1.3, 14, 10), M.claro); dm.position.set(0, y0 + h * 2 + hT + 1.0, zT); g.add(dm); rg.position.set(0, y0 + h * 2 + hT + 2.6, zT); }
  else if (est === 'n25') { tiraMastro(); semTrelica = 1; semEsm = 1; /* v1.2.25: mastro integrado facetado com painéis planos (extras1225) */ }
  else if (est === 'bra') { semTrelica = 1; /* fragata de mastro único integrado: radar de navegação vai para o teto do hangar/casaria de ré */ }
  const ouro = new THREE.MeshStandardMaterial({ color: '#c9a227', roughness: 0.32, metalness: 0.85 });
  if (est === 'eua' && C.estilo === 'eua') { // casco perfurador tumblehome + casaria trapezoidal única integrada até o hangar (sem mastro treliçado)
    const ca = mesh(bloco(wS * 0.92, L * 0.2, h * 1.6, 0.74, 0.12), M.sup); ca.position.set(0, y0, s.z1 + L * 0.08); g.add(ca);
    for (const sx of [-1, 1]) { const pa = mesh(new THREE.PlaneGeometry(cS * 0.22, h * 1.1), M.painel); pa.position.set(sx * (wS * 0.33), y0 + h * 1.6, s.z0 + cS * 0.3); pa.rotation.y = sx * Math.PI / 2; pa.rotation.z = -sx * 0.32; pa.userData.det = 1; g.add(pa); } }
  if (est === 'chn') { // mastro integrado fechado alto + 4 grandes painéis octogonais baixos + segunda casaria à ré
    const mi = mesh(bloco(wS * 0.6, cS * 0.36, h * 2.4, 0.6, 0.26), M.sup); mi.position.set(0, y0 + h * 2, s.z0 + cS * 0.42); g.add(mi);
    [[0, -1], [0, 1], [1, 0], [-1, 0]].forEach(([sx, sz]) => { const pp = mesh(new THREE.CircleGeometry(Math.min(wS * 0.17, h * 0.95), 8), M.painel); pp.position.set(sx * wS * 0.3, y0 + h * 1.25, s.z0 + cS * 0.42 + sz * cS * 0.19); pp.lookAt(pp.position.x + sx * 10, pp.position.y + 1.2, pp.position.z + sz * 10); g.add(pp); });
    const re = mesh(bloco(wS * 0.8, cS * 0.35, h * 1.4, 0.82, 0.2), M.sup); re.position.set(0, y0, s.z1 + cS * 0.25); g.add(re); const dm = mesh(new THREE.SphereGeometry(1.8, 14, 10), M.claro); dm.position.set(0, y0 + h * 1.4 + 1.6, s.z1 + cS * 0.25); g.add(dm); }
  if (est === 'rus' && C.baterias) { // casaria maciça cheia de antenas, mastro em treliça, cúpulas e baterias inclinadas de mísseis
    for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) { const bt = new THREE.Group(); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) bt.add(mesh(cil(0.42, 0.42, 6.2, 10).rotateX(Math.PI / 2).translate(i * 0.92 - 0.46, j * 0.92, 0), M.sup)); bt.position.set(sx * (meia(s.z1 + 4 + k * 7) - 1.6), dY(s.z1 + 4 + k * 7) + 0.6, s.z1 + 4 + k * 7); bt.rotation.set(0.42, sx * 0.25, 0); g.add(bt); } }
  if (est === 'uk') { // mastro piramidal alto com radar esférico no topo + chaminé grande à ré
    const mx = s.z0 + cS * 0.35, hp = L * 0.16; const mp = mesh(bloco(wS * 0.5, cS * 0.26, hp, 0.32, 0.3), M.sup); mp.position.set(0, yM, mx); g.add(mp); rg.position.set(0, yM + hp + 2.1, mx); rg.add(mesh(new THREE.SphereGeometry(2.6, 18, 14), M.claro)); { const pa = mesh(new THREE.CircleGeometry(1.7, 8), M.painel); pa.position.set(0, 0.2, 2.62); rg.add(pa); const pb = pa.clone(); pb.position.z = -2.62; pb.rotation.y = Math.PI; rg.add(pb); } /* v1.2.6: a esfera do radar gira (com os dois painéis) */
    const ch = mesh(bloco(wS * 0.45, cS * 0.24, h * 1.9, 0.78, 0.3), M.sup); ch.position.set(0, y0 + h, s.z1 - cS * 0.2); g.add(ch); const ct = mesh(caixa(wS * 0.3, 0.5, cS * 0.13), M.escuro); ct.position.set(0, y0 + h * 2.9 + 0.2, s.z1 - cS * 0.2); g.add(ct); g.userData.chamine = new THREE.Vector3(0, y0 + h * 3 + 0.6, s.z1 - cS * 0.2); }
  if (C.premium) { // friso dourado ao longo da borda + estrela dourada nas amuras (selo premium)
    for (const sx of [-1, 1]) { const pts = []; for (let i = 2; i < H.secao.length - 1; i += 2) pts.push(H.secao[i][16]); for (let i = 0; i < pts.length - 1; i++) { const [ax, ay, az] = pts[i], [bx, by, bz] = pts[i + 1]; const len = Math.hypot(bx - ax, az - bz); const f = mesh(caixa(0.12, 0.28, len + 0.05), ouro); f.position.set(sx * (ax + bx) / 2 * 1.002, (ay + by) / 2 - 0.25, (az + bz) / 2); f.rotation.y = Math.atan2(sx * (bx - ax), bz - az); f.userData.det = 1; g.add(f); } } }
  // bandeira nacional pintada nos dois lados da superestrutura + flâmula no mastro
  { const tb = texBandeira(C.nacao || 'BRA'); const mb = new THREE.MeshStandardMaterial({ map: tb, roughness: 0.7, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -3 }); const bw = Math.min(cS * 0.2, 7.5), bh = bw / 1.5;
    for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), mb); b.position.set(sx * (wS / 2 * 0.86 + 0.08), y0 + h * 1.45, s.z0 + cS * 0.62); b.rotation.y = sx * Math.PI / 2; b.userData.det = 1; g.add(b); }
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.0), new THREE.MeshStandardMaterial({ map: tb, side: THREE.DoubleSide, roughness: 0.8, alphaTest: 0.5 /* 1.2.21: mesmos parâmetros do matBand → mesmo programa WebGL (bandeira opaca: imagem idêntica) */ })); fl.position.set(0, dY(L * 0.49) + 3.2, L * 0.49 + 1.6); fl.rotation.y = Math.PI / 2; fl.userData.det = 1; fl.name = 'flamula'; g.add(fl);
    const pau = mesh(cil(0.06, 0.08, 4.2, 6), M.claro); pau.position.set(0, dY(L * 0.49) + 2.1, L * 0.49); g.add(pau); }
  // ---- v1.2.0 (revisão, cruzador pesado de escola russa): VLS no alto da superestrutura com tampas individuais, escudos de sopro
  // atrás das torres, mastro intermediário com 3º radar girando 360°, domos extras e balsas salva-vidas em fileira ----
  if (C.vlsSup) { const zv = s.z0 + cS * 0.18, yv = y0 + h + 0.08; const nC = 4, nL = 4, cs = 1.05; const base = mesh(caixa(nC * cs + 0.5, 0.22, nL * cs + 0.5), M.escuro); base.position.set(0, yv, zv); g.add(base);
    const tq = new THREE.InstancedMesh(caixa(0.9, 0.1, 0.9), M.sup, nC * nL); const mt = new THREE.Matrix4(); let k = 0; for (let i = 0; i < nC; i++) for (let j = 0; j < nL; j++) { mt.makeTranslation((i - (nC - 1) / 2) * cs, yv + 0.16, zv + (j - (nL - 1) / 2) * cs); tq.setMatrixAt(k++, mt); } tq.castShadow = true; tq.userData.det = 1; g.add(tq);
    for (const t of P.torres) { const sh = mesh(caixa(Math.min(wS * 0.7, 9), 2.4, 0.25), M.sup); sh.position.set(0, t.y + 0.6, t.z + 5.4); sh.userData.det = 1; g.add(sh); } // escudos de sopro
    const zm = s.z0 + cS * 0.7, ym = y0 + h * 2.2; const mm = mesh(cil(0.3, 0.45, L * 0.05, 8), M.claro); mm.position.set(0, ym + L * 0.025, zm); g.add(mm);
    const r3 = new THREE.Group(); r3.name = 'radar3'; r3.position.set(0, ym + L * 0.05 + 0.3, zm); const p3 = mesh(caixa(4.2, 1.4, 0.2), M.painel); p3.position.y = 0.8; p3.rotation.x = -0.25; r3.add(p3); r3.add(mesh(cil(0.25, 0.3, 0.6, 8), M.escuro)); g.add(r3);
    for (const [dx, dz] of [[-2.4, -1], [2.4, -1], [0, 2.2]]) { const dm = mesh(new THREE.SphereGeometry(0.95, 12, 8), M.claro); dm.position.set(dx, y0 + h * 2 + 0.9, s.z0 + cS * 0.5 + dz); dm.userData.det = 1; g.add(dm); }
    for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) { const bl = mesh(new THREE.CapsuleGeometry(0.4, 0.85, 4, 10).rotateZ(Math.PI / 2), M.claro); bl.position.set(sx * (wS / 2 - 0.5), y0 + 0.5, s.z1 + 2 + i * 1.5); bl.userData.det = 1; g.add(bl); } }
  // ---- v1.2.0 rev.2: lança-foguetes ASW LF-12 Martelo (estilo RBU) — 2 lançadores de 12 tubos em leque, à frente da torre A ----
  if (C.rbu) { P.granadas.forEach((gm, gi) => { const sx = gm.lado, zl = gm.z; const lg = new THREE.Group(); lg.name = 'lg' + gi; lg.position.set(gm.re ? 0 : sx * Math.min(Math.abs(gm.x), meiaReal(zl) - gm.r - 0.25), gm.re ? gm.y : dY(zl), zl); if (gm.re) { const pd = mesh(cil(2.0, 2.2, 0.4, 14), M.sup); pd.position.y = 0.2; g.add(pd); pd.position.add(lg.position); } /* v1.2.7: assentado no convés, dentro da boca */
      const bs = mesh(cil(1.5, 1.8, 1.0, 14), M.sup); bs.position.y = 0.5; lg.add(bs); const sp = mesh(caixa(2.6, 1.4, 1.6), M.sup); sp.position.y = 1.6; lg.add(sp);
      const fx = new THREE.Group(); fx.position.set(0, 2.3, 0); fx.rotation.x = 0.98 - Math.PI / 2 + Math.PI / 2 - 0.6; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const tb = mesh(cil(0.2, 0.2, 2.6, 8).rotateX(Math.PI / 2), M.escuro); tb.position.set((c - 1.5) * 0.46, r * 0.44, -0.2); fx.add(tb); }
      fx.rotation.x = 0.35; fx.name = 'lgEl'; lg.add(fx); lg.rotation.y = -gm.centro; lg.traverse((o) => { o.userData.det = 1; }); g.add(lg); }); }
  // ---- armas (posições iguais às da simulação) ----
  P.torres.forEach((t, i) => { const tc = torreCanhao(M, C.canhao.cal, t.canos || 1, t); if (t.estilo === 'padrao' && t.esc) tc.scale.setScalar(t.esc); if (t.estilo === 'embutido' && t.esc) tc.scale.setScalar(t.esc); tc.name = 'torre' + i; tc.position.set(0, t.y, t.z); if (t.frente < 0) tc.rotation.y = Math.PI; g.add(tc);
    if (t.barbeta) { const sb = C.canhao.cal / 127; const rb = t.estilo === 'couracado' ? 5.6 : 2.6 * sb + 0.8; const bb = mesh(cil(rb, rb + 0.3, t.barbeta, 28).translate(0, t.barbeta / 2, 0), M.sup); bb.position.set(0, t.y - t.barbeta, t.z + 0.3); g.add(bb); } });
  // reparos de 30 mm
  (P.sec || []).forEach((a) => { let m; if (a.tipo === 'pesado') { m = torreCanhao(M, a.cal, 1); m.scale.setScalar(0.92); } else { m = reparo30(M); m.scale.setScalar(a.cal >= 25 ? 0.95 : 0.7); } m.name = 'sec_' + a.i; m.position.set(a.x, a.y - (a.tipo === 'pesado' ? 0 : 0.15), a.z); m.rotation.y = -a.centro; g.add(m); if (a.tipo === 'pesado') { const pd = mesh(cil(2.3, 2.6, 0.5, 14), M.sup); pd.position.set(a.x, a.y - 0.1, a.z); g.add(pd); } }); /* v1.2.18 item 14d: 100 mm (torre leve com pedestal) e canhões leves de borda */
  P.a30.forEach((a, i) => { const m = reparo30(M); m.name = 'a30_' + i; m.position.set(a.x, a.y - 0.95, a.z); g.add(m); if (a.lado) { const pd = mesh(caixa(1.8, 0.9, 1.8), M.sup); pd.position.set(a.x, a.y - 1.4, a.z); g.add(pd); } });
  // VLS: base + tampas (InstancedMesh: 1 draw call; as tampas abrem no lançamento)
  for (const b of P.blocosVls) { const bs = mesh(caixa(b.col * b.cs + 0.6, 0.26, b.lin * b.cs + 0.6), M.escuro); bs.position.set(b.xc || 0, b.y + 0.1, b.zc); g.add(bs);
    if (b.tipo === 'samPa') { /* v1.2.17: patrocínio (sponson) em aço do costado até o lançador, com mão-francesa e balaustrada */ const sx = Math.sign(b.xc), mb = meia(b.zc) * 0.96, xo = Math.abs(b.xc) + b.col * b.cs / 2 + 1.0, w = xo - mb, dp = b.lin * b.cs + 2.4; const pl = mesh(caixa(w, 0.9, dp), M.sup); pl.position.set(sx * (mb + w / 2), b.y - 0.4, b.zc); g.add(pl);
      const mf = mesh(caixa(0.7, Math.hypot(w * 0.8, 5.5), 0.7), M.sup); mf.position.set(sx * (mb + w * 0.4), b.y - 3.2, b.zc); mf.rotation.z = -sx * Math.atan2(w * 0.8, 5.5); g.add(mf);
      const ba = mesh(caixa(0.08, 1.0, dp), M.claro); ba.position.set(sx * xo, b.y + 0.45, b.zc); ba.userData.det = 1; g.add(ba); } }
  if (P.celulas.length) { const tampas = new THREE.InstancedMesh(caixa(0.92, 0.08, 0.92).translate(0.46, 0, 0), M.sup, P.celulas.length); tampas.name = 'tampas'; tampas.castShadow = true; const mt = new THREE.Matrix4(); P.celulas.forEach((c, i) => { mt.makeTranslation(c.x - 0.46, c.y, c.z); tampas.setMatrixAt(i, mt); }); g.add(tampas); }
  // tubos triplos de torpedo nos dois bordos
  for (const tb of P.tubos) { if (tb.sub) { const pt = mesh(caixa(0.1, 0.9, 1.6), M.escuro); pt.position.set(tb.x / 0.9 * 0.99, -0.55, tb.z); pt.userData.det = 1; g.add(pt); continue; } /* porta do tubo submerso: só a escotilha na linha d'água */ const tg = new THREE.Group(); tg.position.set(tb.x, tb.y, tb.z); for (let i = 0; i < (tb.canos || 3); i++) { const t = mesh(cil(0.36, 0.36, 6.6, 12).rotateX(Math.PI / 2), M.escuro); t.position.set(0, i * 0.78, 0); tg.add(t); } /* v1.2.7: tubo de 533 mm × 6,6 m para o torpedo de 0,54 × 5,9 m */ tg.add(mesh(caixa(1.0, 0.3, 2.4).translate(0, -0.42, 0), M.sup)); tg.rotation.y = tb.lado * 0.6; g.add(tg); }
  // CIWS
  P.ciws.forEach((c, i) => { const m = ciwsMount(M); m.name = 'ciws' + i; m.position.set(c.x, c.y - 1.3, c.z); g.add(m); });
  // pedestais de CIWS sobre o hangar
  if (P.ciws.some((c) => c.lug === 1)) { const pd = mesh(caixa(2.4, 5.2, 2.4), M.sup); pd.position.set(0, deckYC(C, L * 0.26) + 2.5, L * 0.26); g.add(pd); }
  // hangar + convés de voo com helicóptero
  if (C.heli && !C.porta) { const zh = L * 0.28, chg = L * 0.12; const hg = mesh(bloco(meia(zh) * 1.7 * (C.casco === 'tumblehome' ? 0.86 : 1), chg, 5.6, 0.9, 0.12), M.sup); hg.position.set(0, dY(zh), zh - chg / 2 + 2); g.add(hg);
    const porta = new THREE.Mesh(new THREE.PlaneGeometry(meia(zh) * 1.25, 4.6), M.hangar); porta.position.set(0, dY(zh) + 2.5, zh + 2.05); porta.userData.det = 1; g.add(porta);
    const zp = (zh + L / 2) / 2 + 2, cp = L / 2 - zh - 1; const pad = new THREE.Mesh(new THREE.PlaneGeometry(meia(zp) * 1.7 * (C.casco === 'tumblehome' ? 0.82 : 1), cp), M.heli); pad.rotation.x = -Math.PI / 2; pad.position.set(0, dY(zp) + 0.07, zp); pad.receiveShadow = true; g.add(pad);
    /* v1.2.0: o helicóptero agora é um meio DINÂMICO (render/aereo3d.js), não faz mais parte do modelo */ }
  else if (C.canhao.torres < 3) { const zp = L * 0.38; const pad = new THREE.Mesh(new THREE.PlaneGeometry(meia(zp) * 1.5, L * 0.2), M.heli); pad.rotation.x = -Math.PI / 2; pad.position.set(0, dY(zp) + 0.07, zp); g.add(pad); }
  // botes nos turcos, balsas, portas, venezianas
  for (const sx of [-1, 1]) { const zb = zS + cS * 0.05; const b = bote(M); b.position.set(sx * (wS / 2 + 0.4), y0 + h + 0.6, zb); b.traverse((o) => { o.userData.det = 1; }); g.add(b);
    for (const f of [0.25, 0.7]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.9), M.porta); p.position.set(sx * (wS / 2 * 0.95 + 0.04), y0 + 1.0, s.z0 + cS * f); p.rotation.y = sx * Math.PI / 2; p.userData.det = 1; g.add(p); }
    for (const f of [0.45, 0.55, 0.85]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.2), M.grade); p.position.set(sx * (wS / 2 * 0.93 + 0.04), y0 + h * 0.62, s.z0 + cS * f); p.rotation.y = sx * Math.PI / 2; p.userData.det = 1; g.add(p); }
    for (let i = 0; i < 3; i++) { const bl = mesh(new THREE.CapsuleGeometry(0.42, 0.9, 4, 10).rotateZ(Math.PI / 2), M.claro); bl.position.set(sx * wS * 0.36, y0 + h + 0.55, s.z0 + cS * (0.66 + i * 0.1)); bl.userData.det = 1; g.add(bl); } }
  // quebra-mar, cabrestantes, cabeços e pau da bandeira
  const zQ = P.torres[0].z - 5.5, wQ = meia(zQ) * 0.7; for (const sx of [-1, 1]) { const q = mesh(caixa(wQ * 1.1, 0.9, 0.14), M.sup); q.position.set(sx * wQ * 0.48, dY(zQ) + 0.45, zQ + wQ * 0.22); q.rotation.y = sx * 0.42; g.add(q); const cb = mesh(cil(0.35, 0.42, 0.5, 12), M.escuro); cb.position.set(sx * 0.9, dY(zQ - 4) + 0.25, zQ - 4); cb.userData.det = 1; g.add(cb); }
  for (const zf of [-0.38, -0.12, 0.3, 0.44]) { const zz = L * zf; for (const sx of [-1, 1]) { const c = mesh(cil(0.16, 0.18, 0.45, 8), M.escuro); c.position.set(sx * (meiaReal(zz) - 0.7), dY(zz) + 0.22, zz); c.userData.det = 1; g.add(c); } }
  // v1.2.0 (revisão): mastro de ré em treliça com verga, radar de navegação GIRANDO (radar2), antenas chicote,
  // cúpulas SATCOM/ESM e mais corrimãos na superestrutura
  const zMr = s.z1 - cS * 0.32, yMr = y0 + h * 2, hMr = L * 0.075 * (semTrelica ? 0.001 : 1); const pernas = []; const nTr0 = g.children.length;
  for (const [ax, az] of [[-1, -1], [1, -1], [0, 1]]) { const p = mesh(cil(0.12, 0.2, hMr, 6), M.escuro); p.position.set(ax * wS * 0.12, yMr + hMr / 2, zMr + az * 1.1); p.rotation.z = -ax * 0.05; p.rotation.x = az * 0.04; g.add(p); pernas.push(p); }
  for (const f of [0.3, 0.6]) { const an = mesh(caixa(wS * 0.24 * (1 - f * 0.5), 0.12, 2.4 * (1 - f * 0.4)), M.escuro); an.position.set(0, yMr + hMr * f, zMr); an.userData.det = 1; g.add(an); }
  const verga = mesh(caixa(wS * 0.62, 0.18, 0.22), M.escuro); verga.position.set(0, yMr + hMr * 0.82, zMr); g.add(verga);
  const r2 = new THREE.Group(); r2.name = 'radar2'; r2.position.set(0, yMr + hMr + 0.3, zMr); const ant2 = mesh(caixa(3.2, 0.35, 0.22), M.escuro); ant2.position.y = 0.35; r2.add(ant2); r2.add(mesh(cil(0.2, 0.25, 0.4, 8), M.escuro)); g.add(r2);
  if (semTrelica) { for (const o of g.children.slice(nTr0)) if (o !== r2) g.remove(o); r2.position.set(0, y0 + h * 2 + 0.25, zMr); const bs = mesh(cil(0.5, 0.7, 0.5, 10), M.sup); bs.position.set(0, y0 + h * 2 + 0.25, zMr); g.add(bs); } /* v1.2.6: sem mastro treliçado — radar de navegação direto no teto */
  for (const sx of [-1, 1]) { const d = mesh(new THREE.SphereGeometry(Math.max(0.7, L / 170), 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), M.claro); d.position.set(sx * wS * 0.3, y0 + h * 2 + 1.0, s.z0 + cS * 0.62); d.userData.det = 1; g.add(d); const pd = mesh(cil(0.3, 0.35, 1.0, 8), M.sup); pd.position.set(sx * wS * 0.3, y0 + h * 2 + 0.5, s.z0 + cS * 0.62); g.add(pd); }
  if (!semEsm) { const esm = mesh(cil(0.55, 0.55, 0.9, 10), M.claro); esm.position.set(0, yM + hm + 6.9, zM); g.add(esm); /* v1.2.17 item 31: ESM fora do LOD 'det' — topo do mastro idêntico perto/longe (a lanterna não flutua ao trocar de LOD) */ }
  // vigias/escotilhas iluminadas nos dois conveses da superestrutura (acendem ao entardecer/noite)
  for (const sx of [-1, 1]) for (const [ky, kw] of [[0.38, 0.9], [1.38, 0.62]]) { const wv = cS * kw; const gv = new THREE.PlaneGeometry(wv, 0.9); const uvv = gv.attributes.uv; const rep = Math.max(2, Math.round(wv / 2.4)); for (let i = 0; i < uvv.count; i++) uvv.setX(i, uvv.getX(i) * rep); const v = new THREE.Mesh(gv, M.vigia); v.position.set(sx * (wS / 2 * (ky > 1 ? 0.8 : 0.95) + 0.06), y0 + h * ky, zS + (ky > 1 ? -cS * 0.12 : 0)); v.rotation.y = sx * Math.PI / 2; v.userData.det = 1; g.add(v); }
  // corrimãos e antenas (linhas)
  const segs = []; for (const lado of [1, -1]) { const pts = []; for (let i = 1; i < H.secao.length; i++) { const p = H.secao[i][16]; pts.push([p[0] * lado * 0.98, p[1], p[2]]); } corrimao(segs, pts); }
  { const rx = wS * 0.43, ry = y0 + h; corrimao(segs, [[-rx, ry, s.z0 + 1.5], [rx, ry, s.z0 + 1.5], [rx, ry, s.z1 - 1.5], [-rx, ry, s.z1 - 1.5], [-rx, ry, s.z0 + 1.5]], 1.0, 1.8); }
  const yv = yM + hm - 1.6; segs.push(-wS * 0.32, yv, zM, wS * 0.32, yv, zM); for (const sx of [-1, 1]) segs.push(sx * wS * 0.45, y0 + h * 2, s.z1 - cS * 0.15, sx * wS * 0.6, y0 + h * 2 + L * 0.07, s.z1 - cS * 0.15);
  for (const sx of [-1, 1]) { const xv = sx * wS * 0.3; segs.push(xv, yMr + hMr * 0.82, zMr, xv, yMr + hMr * 0.82 + 5.5, zMr); segs.push(xv, yMr + hMr * 0.82, zMr, sx * wS * 0.42, y0 + h, zMr + 3); } // antenas chicote e estais
  for (const f of [0.2, 0.5, 0.8]) for (const sx of [-1, 1]) segs.push(sx * wS * 0.4, y0 + h * 2 + 0.6, s.z0 + cS * f, sx * wS * 0.44, y0 + h * 2 + 0.6 + L * 0.05, s.z0 + cS * f + 0.6); // antenas HF
  { const rx = wS * 0.36, ry = y0 + h * 2; corrimao(segs, [[-rx, ry, s.z0 + cS * 0.08], [rx, ry, s.z0 + cS * 0.08], [rx, ry, s.z0 + cS * 0.5], [-rx, ry, s.z0 + cS * 0.5], [-rx, ry, s.z0 + cS * 0.08]], 1.0, 1.6); } // corrimão do tijupá
  // v1.2.0 rev.2: corrimãos/balaústres/antenas como TUBOS finos escuros em InstancedMesh (1 draw call) — nada de linhas claras de 1 px
  // (que viravam um contorno branco tipo wireframe à noite)
  const nSeg = segs.length / 6, tubo = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true).translate(0, 0.5, 0); const linhas = new THREE.InstancedMesh(tubo, M.balaustre, nSeg); linhas.name = 'linhas';
  { const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), sc = new THREE.Vector3(), mt = new THREE.Matrix4();
    for (let i = 0; i < nSeg; i++) { a.fromArray(segs, i * 6); b.fromArray(segs, i * 6 + 3); d.subVectors(b, a); const len = d.length() || 0.01; q.setFromUnitVectors(up, d.normalize()); const r = len > 3 ? 0.045 : 0.035; sc.set(r, len, r); mt.compose(a, q, sc); linhas.setMatrixAt(i, mt); } }
  linhas.userData.det = 1; g.add(linhas);
  // luzes de navegação (BB vermelha, BE verde, mastro/alcançado brancas) + holofote
  const luz = (cor, x, y, z, k = 1, setor = null) => { const m = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.22, L / 480), 8, 6), new THREE.MeshBasicMaterial({ color: cor })); m.position.set(x, y, z); m.userData.luz = 1; g.add(m);
    const sp = new THREE.Sprite(matHalo(cor)); sp.scale.setScalar(Math.max(2.6, L / 55) * k); sp.position.set(x, y, z); sp.userData.luz = 1; sp.renderOrder = 4; if (setor) sp.userData.setor = setor; /* v1.2.15: SETOR COLREG (bb/be 112,5°, topo 225° vante, popa 135°) */ g.add(sp); };
  // iluminação de convés (refletores âmbar nas quinas da superestrutura apontando para o convés): halos suaves só à noite
  for (const sx of [-1, 1]) for (const zz of [s.z0 - 0.4, s.z1 + 0.4]) luz('#ffd9a0', sx * wS * 0.42, y0 + h + 0.4, zz, 0.7);
  for (const t of P.torres.slice(0, 1)) luz('#ffe7c2', 0, y0 + h * 2 + 0.9, s.z0 - 0.3, 0.8);
  luz('#ff3b30', -wS / 2 - 0.3, y0 + h * 2, s.z0 + cS * 0.2, 1, 'bb'); luz('#34c759', wS / 2 + 0.3, y0 + h * 2, s.z0 + cS * 0.2, 1, 'be'); luz('#fff8e7', 0, dY(L * 0.49) + 1, L * 0.49, 1, 'popa'); /* v1.2.17 item 31: a luz de TOPO é ancorada depois (no topo real do mastro) */
  g.userData.holofote = new THREE.Vector3(0, y0 + h * 2 + 1.6, s.z0 + cS * 0.1);
  extras1211(g, C, P, M, dY, meia);
  extras1225(g, C, P, M, dY, meia, { s, cS, wS, y0, h, rg }); /* v1.2.25 */ extras1226(g, C, P, M); /* v1.2.26 */
  { /* v1.2.17 item 31: LUZ DE TOPO ANCORADA no ponto mais alto da estrutura FIXA do mastro (sem peças de LOD 'det', sem partes giratórias), em todas as classes/escolas.
       Se um radar giratório passa por cima desse ponto, um mastaréu fino (como nos navios reais) leva a lanterna acima do giro. Tamanho ∝ navio (lanterna 0,36–0,8 m). */
    g.updateMatrixWorld(true); const DIN = /^(sec_\d+|lg\d|torre\d|ciws\d|a30_\d|radar|radar2|radar3|flamula|tampas|linhas|nomeOuro|nomeOuroPopa|gala)$/; const bx = new THREE.Box3(), T = new THREE.Vector3(0, -1e9, 0);
    const vis = (o) => { for (const c of o.children) { if (DIN.test(c.name) || c.userData.luz || c.userData.det) continue; if (c.isMesh && !c.isInstancedMesh) { if (!c.geometry.boundingBox) c.geometry.computeBoundingBox(); bx.copy(c.geometry.boundingBox).applyMatrix4(c.matrixWorld); if (bx.max.y > T.y) T.set((bx.min.x + bx.max.x) / 2, bx.max.y, (bx.min.z + bx.max.z) / 2); } vis(c); } }; vis(g);
    let topoGiro = -1e9; for (const nm of ['radar', 'radar2', 'radar3']) { const rgx = g.getObjectByName(nm); if (!rgx) continue; bx.setFromObject(rgx); const cx = (bx.min.x + bx.max.x) / 2, cz = (bx.min.z + bx.max.z) / 2, raio = Math.max(bx.max.x - bx.min.x, bx.max.z - bx.min.z) / 2 + 0.4; if (Math.hypot(T.x - cx, T.z - cz) < raio && bx.max.y > T.y - 0.6) topoGiro = Math.max(topoGiro, bx.max.y); }
    const rL = Math.min(0.4, Math.max(0.18, L / 900)); if (topoGiro > -1e9) { const hp = topoGiro - T.y + 0.9, mp = mesh(cil(Math.max(0.07, rL * 0.32), Math.max(0.09, rL * 0.42), hp, 6), M.escuro); mp.position.set(T.x, T.y + hp / 2 - 0.05, T.z); mp.name = 'mastareu'; g.add(mp); T.y += hp - 0.05; }
    const lt = new THREE.Mesh(new THREE.SphereGeometry(rL, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff8e7' })); lt.position.set(T.x, T.y + rL * 0.9, T.z); lt.userData.luz = 1; lt.name = 'luzTopo'; g.add(lt);
    const sp = new THREE.Sprite(matHalo('#fff8e7')); sp.scale.setScalar(Math.max(1.8, L / 85)); sp.position.copy(lt.position); sp.userData.luz = 1; sp.userData.setor = 'topo'; sp.renderOrder = 4; g.add(sp); /* halo contido (sem excesso de brilho) */
    g.userData.topoMastro = T.clone(); g.userData.luzTopo = lt.position.clone(); g.userData.raioLuz = rL; }
  if (!MASC[C.id] && (globalThis.__ltGera || !MASC_PRE[C.id])) MASC[C.id] = mascarasDoModelo(g, C, P, mc, M); /* v1.2.19: no app as máscaras vêm PRÉ-CALCULADAS (src/sim/mascarasLT.js): 0 ms na carga */ /* v1.2.19 item 5: linha de tiro livre das antiaéreas (1× por classe) */
  if (C.base) extrasMegabase(g, C, P, dY); /* v1.2.60: megabase flutuante (pontão, módulo militar e comercial) */
  g.userData.matCasco = mc; g.userData.matSup = M.sup; g.userData.matConves = M.conves; return funde(g);
}

/** v1.2.11: convés de voo (porta-aviões / cruzador porta-aeronaves), ilha deslocada a boreste, caças estacionados e reparos LASER. */
function extras1211(g, C, P, M, dY, meia) { const L = C.L, s = P.sup; if (C.osv) extrasOSV(g, C, P, M, dY, meia);
  if (C.mercante) { const cores = ['#9a3b2e', '#2f5d8a', '#c08a2e', '#4d6b3c', '#7a7f86', '#a34d1f', '#2e6f6a']; const mats = cores.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.25 })); const geo = caixa(2.35, 2.5, 12);
    let k = 0; for (let z = -L * 0.36; z < s.z0 - 8; z += 12.8) { const nb = Math.max(2, Math.floor(meia(z) * 2 / 2.5) - 1); const alt = 2 + ((k * 7) % 3); for (let i = 0; i < nb; i++) for (let h = 0; h < alt; h++) { const q = mesh(geo, mats[(i * 3 + h * 5 + k) % mats.length]); q.position.set((i - (nb - 1) / 2) * 2.5, dY(z) + 1.3 + h * 2.55, z + 6); g.add(q); } k++; }
    for (const z of [-L * 0.2, L * 0.02]) { const gu = mesh(caixa(0.8, 14, 0.8), M.sup); gu.position.set(0, dY(z) + 7, z); g.add(gu); } } /* contêineres empilhados + mastros de carga */
  if (P.deckV && !C.superPA /* v1.2.25: convés próprio em extras1225 */) { const D = P.deckV, len = D.z1 - D.z0, zc = (D.z0 + D.z1) / 2;
    if (P.ilhaX) { g.updateMatrixWorld(true); const bx = new THREE.Box3(), cc = new THREE.Vector3(), sz = new THREE.Vector3(); const DIN = /^(torre\d|ciws\d|a30_\d|lg\d|tampas|linhas|flamula)$/;
      for (const o of g.children) { if (DIN.test(o.name)) continue; bx.setFromObject(o); if (bx.isEmpty()) continue; bx.getCenter(cc); bx.getSize(sz); if (sz.z > L * 0.45 || cc.z < s.z0 - 6 || cc.z > s.z1 + 6 || bx.min.y < dY(cc.z) - 0.6) continue; o.position.x += P.ilhaX; o.position.y += D.y - dY(cc.z) - 0.2; } }
    const dk = new THREE.Group(); dk.position.set(D.x, 0, zc); dk.rotation.y = D.ang; g.add(dk);
    const top = mesh(caixa(D.w, 0.7, len), M.conves); top.position.y = D.y - 0.35; dk.add(top);
    const hb = Math.max(0.5, D.y - dY(D.z1 - 2)); const pa = mesh(caixa(D.w * 0.82, hb, len * 0.96), M.sup); pa.position.y = D.y - 0.7 - hb / 2 + 0.2; dk.add(pa); /* costado do hangar sob o convés */
    for (const zz of [-len * 0.42, len * 0.42]) { const sp = mesh(caixa(D.w * 0.98, 0.5, 2.2), M.escuro); sp.position.set(0, D.y - 0.95, zz); dk.add(sp); }
    const li = (w, d, x, z) => { const q = mesh(caixa(w, 0.04, d), M.claro); q.position.set(x, D.y + 0.03, z); q.userData.det = 1; dk.add(q); };
    li(0.45, len * 0.92, 0, 0); for (const sx of [-1, 1]) li(0.25, len * 0.9, sx * D.w * 0.45, 0); for (let k = 0; k < 9; k++) li(0.45, 3, D.w * 0.3, -len * 0.4 + k * len * 0.1);
    for (let k = 0; k < 3; k++) { const pd = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), M.heli); pd.rotation.x = -Math.PI / 2; pd.position.set(-D.w * 0.18, D.y + 0.05, -len * 0.3 + k * len * 0.3); pd.userData.det = 1; dk.add(pd); }
    if (C.porta === 'pa') { const sk = mesh(caixa(D.w * 0.7, 0.6, 14).rotateX(-0.16), M.conves); sk.position.set(0, D.y + 0.6, -len / 2 + 6); dk.add(sk); } /* rampa leve de proa */
    /* v1.2.29: caças estáticos REMOVIDOS — atrapalhavam a mira (proa/miolo do convés no kordao e PA legado). Ala dinâmica em aereo3d + parque1226 nos gigantes. */
  }
  /* LASER: pedestal + cabeça com janela óptica escura (o feixe é efeito em fx.js, sem luz dinâmica) */
  for (const [il, l] of (P.laser || []).entries()) { const lg = new THREE.Group(); lg.name = 'laser' + il; /* v1.2.19 item 5: nome p/ a máscara de linha de tiro */ lg.position.set(l.x, l.y - 1.2, l.z); const pe = mesh(cil(0.9, 1.1, 1.6, 12), M.sup); pe.position.y = 0.8; lg.add(pe);
    const hd = mesh(new THREE.SphereGeometry(1.05, 14, 10).scale(1, 0.85, 1), M.aa); hd.position.y = 2.1; lg.add(hd); const ln = mesh(cil(0.42, 0.42, 0.5, 14).rotateX(Math.PI / 2), M.vidro); ln.position.set(0, 2.15, -0.95); lg.add(ln);
    for (const sx of [-1, 1]) { const rd = mesh(caixa(0.12, 0.8, 0.9), M.escuro); rd.position.set(sx * 1.05, 2.1, 0); lg.add(rd); } g.add(lg); }
}
/** v1.2.45: navio de APOIO OFFSHORE (Parcel das Paredes) refeito com formas reais: casaria de 4 pavimentos em blocos CHANFRADOS (cantos arredondados),
 *  faixas de janelas e vigias, passadiço com vidraça inclinada e asas até o costado, teto com balaustrada, mastro treliçado com radar/radomes/antenas,
 *  chaminés gêmeas, guincho e cabeços na proa, amurada azul com corrimão amarelo no convés de carga, contêineres corrugados, tanques, carretéis,
 *  guindaste articulado (pedestal, cabine, lanças com cilindros hidráulicos, moitão), pórtico A de popa, bote de resgate com turco e balsas salva-vidas.
 *  O casco/costado são os do navio (casco azul + sup branca pela pintura 'offshore'); a casaria genérica de navio de guerra é removida antes. */
const MAT_OSV = {}; const mOSV = (c, r = 0.6, m = 0.3, mapa) => MAT_OSV[c + (mapa ? ':t' : '')] || (MAT_OSV[c + (mapa ? ':t' : '')] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, map: mapa || null }));
let _texCont = null; const texConteiner = () => { if (_texCont) return _texCont; const W = 128, H = 64, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < W; i += 4) { const g = x.createLinearGradient(i, 0, i + 4, 0); g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.18)'); x.fillStyle = g; x.fillRect(i, 3, 4, H - 6); }
  x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, 0, W, 3); x.fillRect(0, H - 3, W, 3); x.fillRect(0, 0, 3, H); x.fillRect(W - 3, 0, 3, H); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(110,60,30,${0.05 + Math.random() * 0.1})`; x.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 6, 1 + Math.random() * 3); }
  _texCont = new THREE.CanvasTexture(c); _texCont.colorSpace = THREE.SRGBColorSpace; return _texCont; };
const rbox = (w, h, d, r = 0.35) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2));
function extrasOSV(g, C, P, M, dY, meia) { const L = C.L, s = P.sup, cS = s.z1 - s.z0, h = s.h, zS = (s.z0 + s.z1) / 2, y0 = dY(zS), wS = meia(zS) * 2 * 0.92;
  /* 1) tira a casaria/mastro/chaminé genéricos de navio de guerra e o heliponto (o que está acima do convés na área da casaria, sem nome de arma) */
  { g.updateMatrixWorld(true); const bx = new THREE.Box3(), FICA = /^(torre\d|nomeOuro|nomeOuroPopa)$/;
    for (const o of [...g.children]) { if (FICA.test(o.name || '')) continue; bx.setFromObject(o); if (bx.isEmpty()) continue; const cz = (bx.min.z + bx.max.z) / 2; let tira = false; o.traverse((q) => { if (q.material === M.heli) tira = true; });
      if (!tira && bx.min.y > 0.4 && bx.min.y > dY(cz) - 1.2 && ((cz > s.z0 - 4 && cz < s.z1 + 7) || /^(radar\d?|flamula|gala)$/.test(o.name || ''))) tira = true; if (tira) g.remove(o); } }
  const add = (geo, mat, x, y, z, det) => { const o = mesh(geo, mat); o.position.set(x, y, z); if (det) o.userData.det = 1; g.add(o); return o; };
  const branco = M.sup, azul = mOSV('#1f6fb5', 0.5, 0.35), amar = mOSV('#e3b02a', 0.5, 0.4), escuro = mOSV('#1b1d21', 0.55, 0.5), cinza = mOSV('#8d959c', 0.6, 0.4), verm = mOSV('#c0392b', 0.5, 0.35), laranja = mOSV('#ea6a1e', 0.6, 0.15);
  const jan = (w, hh, x, y, z, ry = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), M.janela); p.position.set(x, y, z); p.rotation.y = ry; p.userData.det = 1; g.add(p); return p; };
  /* 2) casaria em 4 pavimentos chanfrados, recuando à ré, com janelas nos lados e na frente */
  const PAV = [[wS, cS, 0], [wS * 0.94, cS * 0.86, 0.02], [wS * 0.88, cS * 0.68, 0.04], [wS * 0.9, cS * 0.44, 0.06]];
  PAV.forEach(([w, c, f], i) => { const yb = y0 + h * i, zc = s.z0 + cS * f + c / 2; add(rbox(w, h, c, 0.45), branco, 0, yb + h / 2, zc); add(caixa(w + 0.1, 0.16, c + 0.1), branco, 0, yb + h - 0.02, zc, 1); /* friso do pavimento */
    const hj = i === 3 ? h * 0.5 : h * 0.3, yj = yb + h * (i === 3 ? 0.58 : 0.55); for (const sx of [-1, 1]) jan(c * 0.8, hj, sx * (w / 2 + 0.03), yj, zc, sx * Math.PI / 2); if (i < 3) jan(w * 0.7, hj, 0, yj, s.z0 + cS * f - 0.03, Math.PI); });
  /* passadiço: vidraça frontal inclinada + asas até o costado */ { const yb = y0 + h * 3, zf = s.z0 + cS * 0.06; const vf = add(caixa(wS * 0.86, h * 0.62, 0.12), M.vidro, 0, yb + h * 0.58, zf - 0.25); vf.rotation.x = 0.28;
    const wa = meia(zf + cS * 0.12) * 2 - 0.4; add(rbox(wa, 0.35, 3.2, 0.12), branco, 0, yb + h * 0.32, zf + 1.8); for (const sx of [-1, 1]) { add(rbox(1.6, h * 0.8, 2.6, 0.2), branco, sx * (wa / 2 - 0.8), yb + h * 0.75, zf + 1.8); jan(2.2, h * 0.36, sx * (wa / 2 - 0.8), yb + h * 0.82, zf + 0.48, Math.PI); }
    add(rbox(wS * 1.0, 0.3, cS * 0.5, 0.12), branco, 0, yb + h + 0.12, s.z0 + cS * 0.29); /* teto com beiral */
    for (const sx of [-1, 1]) for (let k = 0; k < 9; k++) add(cil(0.04, 0.04, 1.0, 5), amar, sx * wS * 0.49, yb + h + 0.75, s.z0 + cS * (0.06 + k * 0.055), 1);
    for (const sx of [-1, 1]) add(cil(0.05, 0.05, cS * 0.45, 5).rotateX(Math.PI / 2), amar, sx * wS * 0.49, yb + h + 1.22, s.z0 + cS * 0.28, 1); }
  /* mastro treliçado (atrás do passadiço) com radar giratório, radomes, antenas e luzes */ { const zm = s.z0 + cS * 0.5, ym = y0 + h * 4 + 0.2, Hm = 11, aM = 0.85;
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const pe = add(cil(0.08, 0.1, Hm, 6), escuro, dx * aM * 0.8, ym + Hm / 2, zm + dz * aM * 0.8); pe.rotation.z = -dx * 0.012; }
    for (let k = 1; k < 7; k++) { const yy = ym + k * Hm / 7, a = aM * (1 - k * 0.025); for (const [w, d, x, z] of [[a * 2, 0.08, 0, -a], [a * 2, 0.08, 0, a], [0.08, a * 2, -a, 0], [0.08, a * 2, a, 0]]) add(caixa(w, 0.08, d), escuro, x * 0.8, yy, zm + z * 0.8, 1); if (k % 2) for (const sx of [-1, 1]) { const dg = add(caixa(0.05, Hm / 7 * 1.4, 0.05), escuro, sx * a * 0.8, yy - Hm / 14, 0 + zm - a * 0.8, 1); dg.rotation.z = sx * 0.55; } }
    for (const k of [2, 4, 6]) add(rbox(aM * 2.6, 0.12, aM * 2.6, 0.04), amar, 0, ym + k * Hm / 7 - 0.06, zm, 1); /* plataformas */
    const rb = new THREE.Group(); rb.name = 'radar'; rb.position.set(0, ym + Hm * 0.66, zm - aM - 0.4); const ant = mesh(rbox(4.6, 0.26, 0.4, 0.1), escuro); rb.add(ant); g.add(rb);
    const rb2 = new THREE.Group(); rb2.name = 'radar2'; rb2.position.set(0, ym + Hm * 0.86, zm - aM - 0.2); rb2.add(mesh(rbox(3.2, 0.2, 0.32, 0.08), escuro)); g.add(rb2);
    add(new THREE.SphereGeometry(0.78, 18, 14), mOSV('#f2f4f5', 0.35, 0.1), 0, ym + Hm + 0.75, zm); add(cil(0.3, 0.4, 0.5, 10), escuro, 0, ym + Hm + 0.05, zm);
    for (const [x, z, r] of [[-wS * 0.3, s.z0 + cS * 0.62, 0.55], [wS * 0.3, s.z0 + cS * 0.62, 0.55], [wS * 0.36, s.z0 + cS * 0.2, 0.42]]) { add(cil(0.12, 0.15, 1.2, 8), escuro, x, y0 + h * 4 + 0.75, z, 1); add(new THREE.SphereGeometry(r, 16, 12), mOSV('#f2f4f5', 0.35, 0.1), x, y0 + h * 4 + 1.35 + r * 0.6, z); }
    for (const [x, hh] of [[-0.7, 4.5], [0.7, 3.6], [0, 2.8]]) add(cil(0.03, 0.05, hh, 5), escuro, x, ym + Hm + hh / 2, zm + 0.6, 1); }
  /* chaminés gêmeas (à ré da casaria, no 3º pavimento) */ for (const sx of [-1, 1]) { const zc = s.z1 - 2.2, xc = sx * wS * 0.3; add(rbox(1.5, h * 1.5, 2.3, 0.35), branco, xc, y0 + h * 2 + h * 0.75, zc); add(rbox(1.56, 0.55, 2.36, 0.15), escuro, xc, y0 + h * 3.5 + 0.2, zc); add(cil(0.28, 0.28, 0.7, 10), escuro, xc - sx * 0.2, y0 + h * 3.5 + 0.7, zc + 0.3); }
  /* balsas salva-vidas (casulos brancos) e bote de resgate laranja com turco */ for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) add(cil(0.38, 0.38, 1.5, 12).rotateZ(Math.PI / 2), mOSV('#f4f4f2', 0.45, 0.1), sx * (wS / 2 + 0.35), y0 + h * 1 + 0.5, s.z0 + cS * (0.3 + k * 0.12), 1);
  { const zb = s.z1 - 5, xb = (meia(zb) - 1.4); const b = add(new THREE.SphereGeometry(1, 18, 10).scale(1.05, 0.62, 3.1), laranja, xb, y0 + h * 1.25, zb); void b; add(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 1, 2.6), mOSV('#f4f4f2', 0.4, 0.1), xb, y0 + h * 1.25 + 0.55, zb, 1);
    const tu = add(caixa(0.22, h * 1.6, 0.22), escuro, xb + 1.2, y0 + h * 1.2, zb - 1.6); void tu; const br = add(caixa(1.5, 0.2, 0.2), escuro, xb + 0.5, y0 + h * 2, zb - 1.6); void br; }
  /* proa: guincho de âncora, cabeços, monitores laterais de reserva */ { const zp = -L * 0.43, yp = dY(zp); for (const sx of [-1, 1]) { add(cil(0.55, 0.55, 1.1, 14).rotateZ(Math.PI / 2), escuro, sx * 1.1, yp + 0.6, zp); add(cil(0.25, 0.25, 0.7, 8), escuro, sx * (meia(zp + 4) - 1), yp + 0.35, zp + 4); add(cil(0.25, 0.25, 0.7, 8), escuro, sx * (meia(zp + 4) - 1), yp + 0.35, zp + 4.8); } add(rbox(2.6, 0.7, 1.4, 0.15), verm, 0, yp + 0.4, zp - 0.4); }
  /* 3) convés de carga à ré: amurada azul + corrimão amarelo, contêineres corrugados, tanques e carretéis */ const z0 = s.z1 + 1.5, zFim = L / 2 - 1.2;
  for (const sx of [-1, 1]) { for (let z = z0; z < zFim; z += 3) { const z2 = Math.min(zFim, z + 3), zm = (z + z2) / 2, x = sx * (meia(zm) - 0.12); add(caixa(0.18, 1.1, z2 - z + 0.02), azul, x, dY(zm) + 0.55, zm); add(cil(0.045, 0.045, z2 - z, 5).rotateX(Math.PI / 2), amar, x - sx * 0.05, dY(zm) + 1.75, zm, 1); add(cil(0.03, 0.03, 0.65, 5), amar, x - sx * 0.05, dY(zm) + 1.42, z, 1); } }
  const tC = texConteiner(), CT = ['#3c8a3a', '#e0752a', '#eceeec', '#3c8a3a', '#8f989f', '#e0752a', '#1e5aa6', '#e9c033'];
  let k = 0; for (let z = z0 + 2.5; z < zFim - 14; z += 6.5) for (const sx of [-1, 1]) { if ((k * 7) % 5 === 1) { k++; continue; } const alt = 1 + ((k * 5) % 3 === 0 ? 1 : 0); for (let a = 0; a < alt; a++) add(caixa(2.44, 2.59, 6.06), mOSV(CT[(k + a * 3) % CT.length], 0.68, 0.3, tC), sx * meia(z) * 0.42, dY(z) + 1.3 + a * 2.6, z); k++; }
  for (const sx of [-1, 1]) { const zt = zFim - 11; add(cil(1.05, 1.05, 5, 18).rotateX(Math.PI / 2), mOSV('#f2f4f5', 0.4, 0.3), sx * meia(zt) * 0.45, dY(zt) + 1.4, zt); for (const dz of [-1.8, 1.8]) add(rbox(2.4, 0.9, 0.3, 0.08), escuro, sx * meia(zt) * 0.45, dY(zt) + 0.45, zt + dz, 1); }
  for (const sx of [-1, 1]) { const zr = zFim - 6, xr = sx * meia(zr) * 0.36; add(cil(1.0, 1.0, 1.4, 22).rotateZ(Math.PI / 2), azul, xr, dY(zr) + 1.25, zr); for (const dx of [-0.75, 0.75]) add(cil(1.45, 1.45, 0.12, 24).rotateZ(Math.PI / 2), escuro, xr + dx, dY(zr) + 1.45, zr); }
  /* guindaste articulado (bombordo, à ré da casaria) */ { const zc = s.z1 + 3.5, xc = -meia(zc) * 0.58, yc = dY(zc), bc = mOSV('#f1f3f4', 0.45, 0.3);
    add(cil(0.95, 1.15, 3.4, 18), azul, xc, yc + 1.7, zc); add(cil(1.3, 1.3, 0.4, 20), escuro, xc, yc + 3.5, zc); const cab = add(rbox(2.2, 2.0, 2.6, 0.3), bc, xc, yc + 4.7, zc); void cab; jan(1.6, 0.8, xc - 1.11, yc + 5.0, zc, -Math.PI / 2);
    const b1 = new THREE.Group(); b1.position.set(xc, yc + 5.2, zc + 0.6); b1.rotation.x = -0.55; g.add(b1); const l1 = mesh(rbox(0.85, 0.95, 12, 0.18), bc); l1.position.z = 6; b1.add(l1); const cyl = mesh(cil(0.18, 0.18, 6, 10).rotateX(Math.PI / 2), escuro); cyl.position.set(0, -0.75, 2.6); cyl.rotation.x = 0.12; b1.add(cyl);
    const b2 = new THREE.Group(); b2.position.set(0, 0, 11.6); b2.rotation.x = 1.05; b1.add(b2); const l2 = mesh(rbox(0.7, 0.75, 9, 0.15), bc); l2.position.z = 4.4; b2.add(l2); const ponta = mesh(cil(0.4, 0.4, 0.5, 12).rotateZ(Math.PI / 2), amar); ponta.position.z = 8.9; b2.add(ponta);
    b1.updateMatrixWorld(true); const pt = ponta.getWorldPosition(new THREE.Vector3()); const fio = add(cil(0.025, 0.025, Math.max(1, pt.y - (yc + 2.5)), 4), escuro, pt.x, (pt.y + yc + 2.5) / 2, pt.z, 1); void fio; add(rbox(0.6, 0.8, 0.6, 0.1), amar, pt.x, yc + 2.3, pt.z); }
  /* pórtico A de popa (tubos com cilindros hidráulicos) */ { const zp = zFim - 1.2, yp = dY(zp), wA = meia(zp) * 1.6, aA = azul; for (const sx of [-1, 1]) { const pe = add(cil(0.32, 0.38, 9.5, 12), aA, sx * wA / 2, yp + 4.4, zp + 0.9); pe.rotation.x = 0.22; const hy = add(cil(0.14, 0.14, 4.2, 8), escuro, sx * wA / 2, yp + 2, zp - 1.0); hy.rotation.x = -0.5; }
    add(rbox(wA + 0.9, 0.8, 0.8, 0.2), mOSV('#f1f3f4', 0.45, 0.3), 0, yp + 8.95, zp + 1.95); add(cil(0.55, 0.55, 0.3, 16).rotateZ(Math.PI / 2), amar, 0, yp + 8.3, zp + 2.1); }
  /* tubulação de incêndio (FiFi) vermelha subindo aos monitores */ for (const sx of [-1, 1]) add(cil(0.18, 0.18, h * 4, 8), verm, sx * wS * 0.42, y0 + h * 2, s.z0 + cS * 0.9, 1);
}
/** Funde as malhas estáticas por material (e separa as de detalhe para o LOD). */
/** Inverte o sentido (winding) de uma geometria NÃO indexada: troca o 2º e o 3º vértice de cada triângulo em todos os atributos. */
function inverteTri(g) { for (const a of Object.values(g.attributes)) { const v = a.array, n = a.itemSize; for (let i = 0; i + 3 * n <= v.length; i += 3 * n) for (let c = 0; c < n; c++) { const t = v[i + n + c]; v[i + n + c] = v[i + 2 * n + c]; v[i + 2 * n + c] = t; } a.needsUpdate = true; } }
function funde(root) {
  const DIN = /^(sec_\d+|lg\d|torre\d|ciws\d|a30_\d|radar|radar2|radar3|flamula|tampas|linhas|nomeOuro|nomeOuroPopa)$/; const din = { has: (k) => DIN.test(k) };
  root.updateMatrixWorld(true); const grupos = new Map(); const remover = [];
  const visita = (o) => { for (const c of o.children.slice()) { if (din.has(c.name)) continue; if (c.isMesh && !c.isInstancedMesh && !c.userData.luz) { const k = c.material.uuid + (c.userData.det ? ':d' : ''); if (!grupos.has(k)) grupos.set(k, { mat: c.material, det: !!c.userData.det, geos: [] });
        let gg = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); gg.applyMatrix4(c.matrixWorld); if (c.matrixWorld.determinant() < 0) inverteTri(gg) /* v1.2.16: peça espelhada (escala −1) assada na fusão invertia o sentido dos triângulos → faces internas à mostra */; const keep = ['position', 'normal', 'uv'].concat(c.material.vertexColors ? ['color'] : []);
        for (const a of Object.keys(gg.attributes)) if (!keep.includes(a)) gg.deleteAttribute(a); if (!gg.attributes.uv) gg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2)); if (!gg.attributes.normal) gg.computeVertexNormals();
        grupos.get(k).geos.push(gg); remover.push(c); } visita(c); } };
  visita(root); for (const c of remover) c.parent.remove(c);
  // remove grupos vazios
  const limpa = (o) => { for (const c of o.children.slice()) { limpa(c); if (c.type === 'Group' && !c.children.length && !din.has(c.name)) o.remove(c); } }; limpa(root);
  const det = []; for (const { mat, det: d, geos } of grupos.values()) { const m = mergeGeometries(geos, false); if (!m) continue; const x = new THREE.Mesh(m, mat); x.castShadow = true; x.receiveShadow = true; x.name = d ? 'det' : 'base'; root.add(x); if (d) det.push(x); geos.forEach((q) => q.dispose()); }
  /* v1.2.21 desempenho (item 20b sem perder nada): PROXY das armas ao longe. Entre ~26 px e ~10 px de navio na tela as armas (CIWS, 30 mm, secundárias,
     lança-granadas, radares girando) continuam DESENHADAS, mas cada uma custava 2–8 chamadas de desenho (≈ 20–45 por navio). Aqui as mesmas malhas, com os
     MESMOS materiais (pintura incluída, sombra incluída), são fundidas por material numa cópia estática da pose de repouso: 1 chamada por material.
     Nessa faixa uma montagem de 3 m mede 0,2–0,5 px, então giro/recuo não são visíveis; perto (> 26 px) voltam as peças articuladas. */
  { const ARM = /^(sec_\d+|lg\d|ciws\d|a30_\d|radar2|radar3)$/; const gp = new Map(); let nIgn = 0; root.updateMatrixWorld(true);
    root.traverse((o) => { if (!ARM.test(o.name)) return; o.traverse((c) => { if (!(c.isMesh) || Array.isArray(c.material)) return; if (c.isInstancedMesh || c.userData.luz) { nIgn++; return; }
      const k = c.material.uuid; if (!gp.has(k)) gp.set(k, { mat: c.material, geos: [] }); let gg = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); gg.applyMatrix4(c.matrixWorld); if (c.matrixWorld.determinant() < 0) inverteTri(gg);
      const keep = ['position', 'normal', 'uv'].concat(c.material.vertexColors ? ['color'] : []); for (const a of Object.keys(gg.attributes)) if (!keep.includes(a)) gg.deleteAttribute(a); if (!gg.attributes.uv) gg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2)); if (!gg.attributes.normal) gg.computeVertexNormals(); gp.get(k).geos.push(gg); }); });
    if (gp.size && !nIgn) { const px = new THREE.Group(); px.name = 'armasLOD'; px.visible = false; for (const { mat, geos } of gp.values()) { const m = mergeGeometries(geos, false); geos.forEach((q) => q.dispose()); if (!m) continue; const x = new THREE.Mesh(m, mat); x.castShadow = true; x.receiveShadow = true; x.name = 'armaLOD'; px.add(x); } root.add(px); } }
  /* v1.2.30 FPS (crit. 9): peças ARTICULADAS (torres, CIWS, 30 mm, secundárias, radares) — dentro de cada grupo rígido (pivô, cabeça, feixe de canos) as malhas-folha de mesmo
     material viram 1 só (geometria assada na matriz local; o grupo continua girando/recuando/escalando igual). Mesmos triângulos, mesmos materiais. */
  { const DYN = /^(sec_\d+|torre\d|ciws\d|a30_\d|radar|radar2|radar3)$/; mesclaFilhos(root, (p) => { for (let q = p; q && q !== root; q = q.parent) if (DYN.test(q.name)) return true; return false; }); }
  /* v1.2.30 FPS: esferas de luz de navegação/convés (8 por navio, 1 material cada) → 1 malha com cor por vértice (mesma cor, mesmos pontos) */
  mesclaLuzes(root, (c) => !!c.userData.luz);
  return root;
}

const MODELOS = {};
export function esqueceModelo(tipo) { for (const k in MODELOS) if (k.startsWith(tipo + ":")) delete MODELOS[k]; } /* v1.2.19: só para o teste/ajuste de linha de tiro */
/** Instância de navio (clone compartilhando geometria e materiais) com referências às peças móveis. */
export function criaNavio3D(tipo, time, pintura, enfeite = null, mais = 0) {
  const k = tipo + ':' + time + (mais > 0 ? ':' + mais : ''); if (!MODELOS[k]) MODELOS[k] = montaModelo(tipo, time, mais); /* v1.2.21 item 19b: modelo com as células VLS extras do módulo */
  const g = MODELOS[k].clone(); const U = MODELOS[k].userData; pintura = pintura || CLASSES[tipo].pintura || 'cinza_naval';
  { const nm = enfeite && enfeite.nome; if (nm && !NOMES_OURO[tipo] && U.poeNome) U.poeNome(g, matOuro(String(nm).toUpperCase().slice(0, 22), 'naval'), 0.72); } /* v1.2.16 item 34 */
  // pintura/camuflagem: troca só os materiais do casco e da superestrutura (o resto compartilha) — shader procedural
  const mc = materialPintura(U.matCasco, pintura, 1, CLASSES[tipo].F), ms = materialPintura(U.matSup, pintura), mv = materialConves(U.matConves, pintura); g.traverse((o) => { if (!o.isMesh) return; if (o.material === U.matCasco) o.material = mc; else if (o.material === U.matSup) o.material = ms; else if (o.material === U.matConves) o.material = mv; }); g.rotation.order = 'YXZ'; const C = CLASSES[tipo], P = layoutDe(C);
  const ref = { g, pintura, torres: [], ciws: [], a30: [], radar: g.getObjectByName('radar'), radar2: g.getObjectByName('radar2'), radar3: g.getObjectByName('radar3'), flamula: g.getObjectByName('flamula'), tampas: g.getObjectByName('tampas'), armasLOD: g.getObjectByName('armasLOD'), det: [], linhas: g.getObjectByName('linhas'), luzes: [], chamine: MODELOS[k].userData.chamine, holofote: MODELOS[k].userData.holofote, topoMastro: U.topoMastro, luzTopo: U.luzTopo, raioLuz: U.raioLuz, abertas: new Float32Array(P.celulas.length) };
  if (ref.tampas) { ref.tampas = ref.tampas; ref.tampas.instanceMatrix = ref.tampas.instanceMatrix.clone(); }
  ref.lg = (P.granadas || []).map((m, i) => { const q = g.getObjectByName('lg' + i); return q ? { g: q, el: q.getObjectByName('lgEl') } : null; }); /* v1.2.7 */
  P.torres.forEach((t, i) => { const tr = g.getObjectByName('torre' + i); ref.torres.push({ g: tr, piv: tr.getObjectByName('pivo'), cano: tr.getObjectByName('cano'), cano2: tr.getObjectByName('cano2'), cano3: tr.getObjectByName('cano3'), cano4: tr.getObjectByName('cano4'), lcLocal: t.estilo === 'couracado' ? t.lc : t.estilo === 'embutido' ? t.lc / (t.esc || 1) : (C.canhao.cal > 140 ? 9 : C.canhao.cal > 100 ? 7.5 : 5.2) }); });
  ref.sec = (P.sec || []).map((a) => { const m = g.getObjectByName('sec_' + a.i); return m ? { g: m, el: m.getObjectByName('pivo') || m.getObjectByName('cab') } : null; }); /* v1.2.18 item 14d */
  P.a30.forEach((a, i) => { const m = g.getObjectByName('a30_' + i); ref.a30.push({ g: m, cab: m.getObjectByName('cab') }); });
  P.ciws.forEach((c, i) => { const m = g.getObjectByName('ciws' + i); ref.ciws.push({ g: m, cab: m.getObjectByName('cab'), canos: m.getObjectByName('canos') }); });
  g.traverse((o) => { if (o.name === 'det') ref.det.push(o); if (o.userData.luz) ref.luzes.push(o); });
  if (enfeite) aplicaEnfeite(g, C, P, enfeite);
  return ref;
}
/** Bandeira escolhida pelo jogador no pau da popa (país, estado brasileiro ou sinal náutico) e, opcional, o navio
 * EMBANDEIRADO em arco (gala): cabo da proa ao topo do mastro e daí à popa com as bandeiras do Código Internacional de Sinais. */
const MAT_BAND = new Map(); const matBand = (k) => { if (!MAT_BAND.has(k)) MAT_BAND.set(k, new THREE.MeshStandardMaterial({ map: texBandeira(k), side: THREE.DoubleSide, roughness: 0.8, transparent: /^SIN-[AB]$/.test(k), alphaTest: 0.5 })); return MAT_BAND.get(k); };
const SEQ_GALA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let TFAIXA = null;
/** Faixa de serviço diagonal (vermelha com filetes azul/branco) e emblema ORIGINAL do Nexo (âncora num círculo). */
function texFaixa() { if (TFAIXA) return TFAIXA; const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'); x.clearRect(0, 0, 512, 256);
  const band = (x0, w, cor) => { x.fillStyle = cor; x.beginPath(); x.moveTo(x0 + 70, 0); x.lineTo(x0 + 70 + w, 0); x.lineTo(x0 + w, 256); x.lineTo(x0, 256); x.closePath(); x.fill(); };
  band(120, 30, '#1d4ed8'); band(154, 8, '#ffffff'); band(166, 190, '#d62828'); band(360, 8, '#ffffff'); band(372, 30, '#1d4ed8');
  x.fillStyle = '#fff'; x.beginPath(); x.arc(296, 128, 66, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#f59e0b'; x.lineWidth = 7; x.stroke(); x.fillStyle = '#0f2a5c'; x.beginPath(); x.arc(296, 128, 52, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#fff'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(296, 92); x.lineTo(296, 160); x.moveTo(278, 104); x.lineTo(314, 104); x.stroke(); x.beginPath(); x.arc(296, 138, 26, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke(); x.beginPath(); x.arc(296, 86, 7, 0, Math.PI * 2); x.stroke();
  TFAIXA = new THREE.CanvasTexture(c); TFAIXA.colorSpace = THREE.SRGBColorSpace; TFAIXA.anisotropy = (globalThis.__nnsAniso || 8) /* v1.2.15: anisotropia máx. suportada */; return TFAIXA; }
function aplicaEnfeite(g, C, P, { bandeira, gala, faixa }) {
  const fl = g.getObjectByName('flamula'); if (fl && bandeira) fl.material = matBand(bandeira);
  if (faixa) { const L = C.L, zz = -L * 0.12; const m = new THREE.MeshBasicMaterial({ map: texFaixa(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }); const hF = deckYC(C, zz) * 0.85, wF = hF * 2;
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(wF, hF), m); p.position.set(sx * (meiaBoca(C, zz) * 1.0 + 0.2), hF * 0.52, zz); p.rotation.y = sx * Math.PI / 2; if (sx < 0) p.scale.x = -1; p.userData.det = 1; g.add(p); } }
  if (!gala) return; const L = C.L; const topo = g.userData.topoMastro ? new THREE.Vector3().copy(g.userData.topoMastro) : new THREE.Vector3(0, P.sup.h * 3 + 10 + L * 0.1, P.sup.z0 + (P.sup.z1 - P.sup.z0) * 0.35); /* v1.2.17: cabo da gala preso no topo real do mastro */
  const dY = (z) => deckYC(C, z); const proa = new THREE.Vector3(0, dY(-L * 0.5) + 1.5, -L * 0.5), popa = new THREE.Vector3(0, dY(L * 0.49) + 3.5, L * 0.49);
  const geo = new THREE.PlaneGeometry(1.5, 1.0); let n = 0; const cabo = [];
  for (const [a, b] of [[proa, topo], [topo, popa]]) { const d = a.distanceTo(b); const k = Math.max(4, Math.floor(d / 2.6));
    for (let i = 0; i < k; i++) { const t = (i + 0.5) / k; const p = a.clone().lerp(b, t); p.y -= Math.sin(Math.PI * t) * d * 0.035; cabo.push(p);
      const m = new THREE.Mesh(geo, matBand('SIN-' + SEQ_GALA[n++ % 26])); m.position.copy(p); m.position.y -= 0.55; m.rotation.y = Math.PI / 2; m.userData.det = 1; g.add(m); } }
  const lg = new THREE.BufferGeometry().setFromPoints([proa, ...cabo, popa]); const linha = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: '#1f2937' })); linha.name = 'gala'; g.add(linha); }
const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _s = new THREE.Matrix4();
/** Abre/fecha a tampa da célula VLS i (0 = fechada, 1 = aberta 100°). */
export function tampaVls(ref, P, i, a) { if (!ref.tampas) return; const c = P.celulas[i], ks = c.w ? c.w / 0.92 : 1; _m.makeTranslation(c.x - 0.46 * ks, c.y, c.z); _r.makeRotationZ(a * 1.75); _m.multiply(_r); if (ks !== 1) _m.multiply(_s.makeScale(ks, ks, ks)); /* v1.2.31: tampa por célula (Fort-M) */ ref.tampas.setMatrixAt(i, _m); ref.tampas.instanceMatrix.needsUpdate = true; }
