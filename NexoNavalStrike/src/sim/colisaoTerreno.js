// v1.2.29 item 10 — colisão com terreno (montanhas/rochas/ilhas/plataformas).
// Consultas com taxa reduzida + cache espacial por célula. Determinístico.
import { clamp, ang } from './util.js';
import { alturaTerreno, distTerra } from './maps.js';

/** Cache de altura por célula ~cel m; invalida a cada tick do dono via geracao. */
const CACHE = { T: null, cel: 80, gen: 0, map: null, hits: 0, miss: 0, us: 0 };

export function resetCacheTerreno() { CACHE.T = null; CACHE.map = null; CACHE.gen++; CACHE.hits = CACHE.miss = CACHE.us = 0; }

function cacheDe(T) {
  if (CACHE.T !== T || !CACHE.map) {
    CACHE.T = T; CACHE.cel = Math.max(25, Math.round((T.cel || 50) * 0.7)); /* ~25–35 m: casco não cabe numa célula */
    CACHE.map = new Map(); CACHE.gen++;
  }
  return CACHE;
}

/** Amostra altura com cache espacial (chave = célula). */
export function alturaCache(T, x, z) {
  const C = cacheDe(T), cel = C.cel;
  const i = Math.floor(x / cel), j = Math.floor(z / cel);
  /* v1.2.29 hitch: chave INT (sem string i+','+j → GC) — offset evita negativo; XOR antigo colidia */
  const k = ((i + 50000) * 100000) + (j + 50000);
  const m = C.map; let v = m.get(k);
  if (v !== undefined) { C.hits++; return v; }
  C.miss++; v = alturaTerreno(T, x, z); m.set(k, v);
  if (m.size > 4096) { /* LRU barato: limpa metade quando enche */ let n = 0; for (const key of m.keys()) { m.delete(key); if (++n > 2048) break; } }
  return v;
}

/**
 * Sonda terreno à frente (look-ahead ∝ velocidade).
 * Retorna { hit, dist, hMax, hNow, lado, sobe, altMin }.
 * lado: -1 bombordo / +1 boreste (lado mais curto/livre); sobe: 1 se dá para passar por cima com pitch/G.
 */
export function sondaTerreno(T, x, y, z, rumo, v, opts = {}) {
  /* v1.2.29 hitch: sem performance.now por sonda (14 aeronaves × ~10 amostras/passo → overhead + jitter) */
  const look = opts.look != null ? opts.look : clamp(Math.abs(v) * 3.2 + 220, 280, 2200);
  const folga = opts.folga != null ? opts.folga : 28;
  const pitchMax = opts.pitchMax != null ? opts.pitchMax : 0.42; /* ~24° */
  const gMax = opts.gMax != null ? opts.gMax : 3.2;
  const sx = Math.sin(rumo), sz = -Math.cos(rumo);
  const passo = Math.max(40, look / 8);
  let hMax = -1e9, hNow = alturaCache(T, x, z), distHit = look, hit = 0;
  for (let d = passo; d <= look; d += passo) {
    const h = alturaCache(T, x + sx * d, z + sz * d);
    if (h > hMax) hMax = h;
    if (!hit && h + folga > y) { hit = 1; distHit = d; }
  }
  // laterais: lado livre (menor altura no look/2)
  let hL = -1e9, hR = -1e9;
  const lat = Math.min(420, look * 0.45);
  for (const f of [0.45, 0.85]) {
    const d = look * f;
    hL = Math.max(hL, alturaCache(T, x + Math.sin(rumo - 0.7) * d, z - Math.cos(rumo - 0.7) * d));
    hR = Math.max(hR, alturaCache(T, x + Math.sin(rumo + 0.7) * d, z - Math.cos(rumo + 0.7) * d));
  }
  const lado = hL < hR ? -1 : 1; /* menor obstáculo = lado preferido */
  const altMin = hMax + folga;
  const dy = altMin - y;
  const tChega = Math.max(0.4, distHit / Math.max(25, Math.abs(v)));
  const vyNeed = dy / tChega;
  const pitchNeed = Math.atan2(vyNeed, Math.max(25, Math.abs(v)));
  const gNeed = Math.abs(vyNeed) / 9.81 + 1;
  const sobe = dy <= 0 || (pitchNeed <= pitchMax && gNeed <= gMax) ? 1 : 0;
  return { hit, dist: distHit, hMax, hNow, lado, sobe, altMin, look };
}

/**
 * Desvio inteligente para IA/autopilot.
 * Devolve { rumo, alt, vMul } — rumo/alt sugeridos; vMul < 1 se precisar frear.
 */
export function desviaTerreno(T, x, y, z, rumo, rumoDes, v, altDes, opts = {}) {
  const s = sondaTerreno(T, x, y, z, rumo, v, opts);
  let rumoOut = rumoDes, altOut = Math.max(altDes, s.hNow + (opts.folga || 28));
  let vMul = 1;
  if (!s.hit) {
    // ainda assim sobe se o chão sobe
    if (s.altMin > altOut) altOut = s.altMin;
    return { rumo: rumoOut, alt: altOut, vMul, s };
  }
  if (s.sobe) {
    altOut = Math.max(altOut, s.altMin);
    // se o obstáculo está perto, alivia a curva e sobe
    if (s.dist < Math.abs(v) * 1.4) vMul = 0.85;
    return { rumo: rumoOut, alt: altOut, vMul, s };
  }
  // contorna pelo lado mais curto (menor altura lateral)
  const urg = clamp(1 - s.dist / s.look, 0.25, 1);
  const giro = s.lado * (0.55 + 0.9 * urg); /* até ~1.45 rad */
  rumoOut = ang(rumo + giro);
  altOut = Math.max(altOut, s.hNow + (opts.folga || 28) + 40, y + 30);
  vMul = s.dist < Math.abs(v) * 1.2 ? 0.7 : 0.9;
  return { rumo: rumoOut, alt: altOut, vMul, s };
}

/** Colisão dura aeronave × terreno. true = penetrou (destruir). Empurra para fora se raso. */
export function colideAereoTerreno(sim, q, dt, opts = {}) {
  const T = sim.T; const ht = alturaTerreno(T, q.x, q.z); /* direto: precisão de impacto */
  const margem = opts.margem != null ? opts.margem : 2.5;
  if (q.y > ht + margem) return 0;
  const pen = ht + margem - q.y;
  /* v1.2.29: qualquer penetração real destrói (manual ou IA). Sem “empurrão” que deixava atravessar por vários frames. */
  if (pen > 0.4) return 1;
  q.y = ht + margem + 0.5; q.vy = Math.max(q.vy || 0, 8);
  return 0;
}

/**
 * Resposta de casco × terra: para sem atravessar, dano leve coerente.
 * Substitui/reforça o ramo de encalhe quando o casco entra em terra seca.
 */
/* fiscal nukefumaca (item 9): casco amostrado em 9 estações (proa -> popa, pontas inclusas) x 3 (bordos+eixo) = 27 pontos; antes só 5 pontos (sem ponta da proa/popa nem bordos de meia-nau) e a GUINADA girava o casco para dentro da rocha sem checar. Só roda perto de terra (distTerra). */
const ESTA = [0.5, 0.375, 0.25, 0.125, 0, -0.125, -0.25, -0.375, -0.5], BORDO = [0, 0.5, -0.5];
function cascoEmTerra(T, C, x, z, rumo) {
  const sx = Math.sin(rumo), sz = -Math.cos(rumo), cx = Math.cos(rumo), cz = Math.sin(rumo);
  for (const ea of ESTA) for (const eb of BORDO) if (alturaTerreno(T, x + sx * ea * C.L + cx * eb * C.B, z + sz * ea * C.L + cz * eb * C.B) > 0.5) return 1;
  return 0;
}
/* fix09: altura máxima de rocha sob os 27 pontos do casco — distingue encosto raso (≤3 m, a ré basta) de casco ENTERRADO fundo (spawn/teleporte) */
function alturaMaxCasco(T, C, x, z, rumo) {
  const sx = Math.sin(rumo), sz = -Math.cos(rumo), cx = Math.cos(rumo), cz = Math.sin(rumo); let m = -1e9;
  for (const ea of ESTA) for (const eb of BORDO) m = Math.max(m, alturaTerreno(T, x + sx * ea * C.L + cx * eb * C.B, z + sz * ea * C.L + cz * eb * C.B));
  return m;
}
/* fix09 (item 9): casco ENTERRADO (spawn/save/empurrão/teleporte) -> acha a água livre mais próxima (anéis crescentes, 16 direções, casco inteiro fora da rocha e centro além do calado) para a despenetração. Só roda enterrado. */
function saidaLivre(T, C, x, z, rumo) {
  const lim = T.tam * 0.47;
  for (let r = 5; r <= 2400; r += (r < 100 ? 5 : 25)) for (let k = 0; k < 16; k++) {
    const a = (k + (r % 10 ? 0.5 : 0)) * Math.PI / 8, px = x + Math.sin(a) * r, pz = z - Math.cos(a) * r;
    if (Math.abs(px) > lim - C.L || Math.abs(pz) > lim - C.L) continue;
    if (!cascoEmTerra(T, C, px, pz, rumo) && alturaTerreno(T, px, pz) < -C.T) return [px, pz];
  }
  return null;
}
export function respondeNavioTerreno(sim, n, ox, oz, dt, orr) {
  const T = sim.T, C = n.C;
  const lim = T.tam * 0.47;
  const sx = Math.sin(n.rumo), sz = -Math.cos(n.rumo);
  const perto = distTerra(T, n.x, n.z) < C.L * 0.75 + 120 || distTerra(T, ox, oz) < C.L * 0.75 + 120 || Math.abs(n.x) > lim - C.L || Math.abs(n.z) > lim - C.L;
  if (!perto && !n.encalhe) return 0;
  // amostras no casco — alturaTerreno DIRETO (cache por célula errava dentro do casco)
  let hMax = -1e9, hProa = -1e9, terraSeca = 0, ctx = 0, ctz = 0, mpx = n.x, mpz = n.z;
  for (const ea of ESTA) for (const eb of BORDO) {
    const al = ea * C.L, lat = eb * C.B;
    const px = n.x + sx * al + Math.cos(n.rumo) * lat;
    const pz = n.z + sz * al + Math.sin(n.rumo) * lat;
    const h = alturaTerreno(T, px, pz);
    if (h > hMax) { hMax = h; mpx = px; mpz = pz; }
    if (al > 0 && h > hProa) hProa = h;
    if (h > 0.5) { terraSeca++; ctx += px; ctz += pz; }
  }
  const raso = hMax > -C.T; /* acima do calado */
  const fora = Math.abs(n.x) > lim || Math.abs(n.z) > lim;
  if (!raso && !fora) { n.encalhe = 0; n.tRaspa = 0; n.encalheDuro = 0; n._rochaDuro = 0; return 0; }

  // gradiente → normal para água (no PONTO DE CONTATO = média das amostras em terra; sem contato = proa)
  const bxp = terraSeca ? ctx / terraSeca : mpx, bzp = terraSeca ? ctz / terraSeca : mpz;
  const e = terraSeca ? 25 : 10;
  let gx = alturaTerreno(T, bxp + e, bzp) - alturaTerreno(T, bxp - e, bzp);
  let gz = alturaTerreno(T, bxp, bzp + e) - alturaTerreno(T, bxp, bzp - e);
  let gl = Math.hypot(gx, gz);
  if (gl < 1e-3) { gx = bxp - n.x; gz = bzp - n.z; gl = Math.hypot(gx, gz); if (gl < 1e-3) { gx = sx; gz = sz; gl = 1; } } /* platô: normal = do centro para o ponto de contato (aponta p/ dentro da terra) */
  const nx = -gx / gl, nz = -gz / gl;
  const steep = gl / (2 * e) > 0.3; /* paredão de rocha (encosta íngreme): contato físico já na borda do raso */

  /* v1.2.29: borda do mapa em água profunda — só prende o casco, SEM dano/encalhe
     (antes `fora` entrava no hard-stop de terra e sangrava HP no limiar 0.47·tam). */
  if (fora && terraSeca < 1 && hMax <= 1.5) {
    n.x = clamp(n.x, -lim, lim); n.z = clamp(n.z, -lim, lim);
    if (Math.abs(n.x) >= lim - 1e-3) n.v *= (Math.sign(n.x) === Math.sign(Math.sin(n.rumo)) ? 0 : 1);
    if (Math.abs(n.z) >= lim - 1e-3) n.v *= (Math.sign(n.z) === Math.sign(-Math.cos(n.rumo)) ? 0 : 1);
    n.encalhe = 0; n.tRaspa = 0; n.encalheDuro = 0;
    return 0;
  }

  if (terraSeca >= 1 || hMax > 1.5 || (steep && raso)) { /* v1.2.29: qualquer amostra em terra seca = contato */
    const tel = n.telAlvo | 0; /* 0=ré, 1=parar, 2..4=avante */
    n.pivo = 0;
    const rx = bxp - n.x, rz = bzp - n.z; /* alavanca do contato (fora do CG) */
    const emTerraAntes = cascoEmTerra(T, C, ox, oz, orr != null ? orr : n.rumo);
    /* RÉ: sai pela popa + leve empurrão para a água — ré SEMPRE libera. Se já está enterrado FUNDO (>3 m de rocha), a ré não basta. */
    let re = 0, nx2 = 0, nz2 = 0;
    if (tel === 0) {
      const spd = Math.min(3.5, 1.2 + Math.max(0.6, Math.abs(n.v))); /* m/s */
      nx2 = ox - Math.sin(n.rumo) * spd * dt; nz2 = oz + Math.cos(n.rumo) * spd * dt;
      const h2 = alturaTerreno(T, nx2 + sx * C.L * 0.42, nz2 + sz * C.L * 0.42);
      if (h2 > 0.5 || emTerraAntes) { nx2 += nx * 2.5 * dt; nz2 += nz * 2.5 * dt; }
      if (!emTerraAntes) re = 1; else { const h0 = alturaMaxCasco(T, C, ox, oz, orr != null ? orr : n.rumo); re = (h0 <= 1 && !(n._tPush > sim.t - 10)) || (h0 <= 3 && alturaMaxCasco(T, C, nx2, nz2, n.rumo) < h0 - 0.02); } /* encosto na borda (≤1 m) ou enterramento raso que a ré reduz: a ré basta; senão empurra até a água */
    }
    if (re) {
      n.x = nx2; n.z = nz2;
      if (n.v > -0.8) n.v = -Math.max(1.5, Math.abs(n.v));
      n.encalheDuro = 0;
    } else if (emTerraAntes) {
      /* fix09: JÁ ENTERRADO (save/spawn/teleporte/empurrão) e a ré não basta: despenetra empurrando o casco até a água livre mais próxima; sem velocidade própria enquanto enterrado — nunca avança pela rocha */
      let S = n._saidaRocha;
      if (!S || sim.t - S.t > 2 || Math.hypot(S.x - n.x, S.z - n.z) < 3) { const r = saidaLivre(T, C, n.x, n.z, n.rumo); S = n._saidaRocha = r ? { x: r[0], z: r[1], t: sim.t } : null; }
      if (S) {
        const ddx = S.x - n.x, ddz = S.z - n.z, dd = Math.hypot(ddx, ddz) || 1, st = Math.min(dd, clamp(dd * 0.5, 6, 60) * dt);
        n.x += ddx / dd * st; n.z += ddz / dd * st;
      } else { n.x = ox - Math.sin(n.rumo) * 3.5 * dt; n.z = oz + Math.cos(n.rumo) * 3.5 * dt; }
      n._tPush = sim.t; n.v = clamp(n.v || 0, -0.9, 0);
      n.encalheDuro = tel > 0 ? 1 : 0;
    } else {
      /* v1.2.30 item 9 — CONTATO FÍSICO: componente normal anulada (sem penetrar), tangencial mantida com atrito (desliza pela costa),
         torque de guinada pelo contato fora do CG, rebote ∝ v normal no 1º contato, dano ∝ v normal. Nunca teleporta. */
      const cs = sx * nx + sz * nz;             /* cos entre proa e normal-para-a-água (<0 = proa contra a terra) */
      const vIn = n.v || 0, vN = Math.max(0, -cs * vIn); /* velocidade normal de impacto (m/s) */
      const dx0 = n.x - ox, dz0 = n.z - oz, vnD = -(dx0 * nx + dz0 * nz);
      let tx = dx0, tz = dz0; if (vnD > 0) { tx += nx * vnD; tz += nz * vnD; } /* remove o componente que entra na terra */
      const atr = 1 - Math.min(0.9, 0.45 * dt * 6);  /* atrito por passo (≈ −0,45/s·6) */
      tx *= atr; tz *= atr;
      const k2 = (C.L * C.L + C.B * C.B) / 12, tau = rx * nz - rz * nx; /* torque ∝ r × n */
      const primeiro = !n._rochaDuro;
      let dw = (tau * vN * (primeiro ? 1.2 : dt * 2.5)) / k2; dw = clamp(dw, -0.3, 0.3);
      const rumoTent = n.rumo; let wNovo = clamp((n.w || 0) + dw, -0.35, 0.35);
      // 1ª opção: desliza com a guinada pedida; 2ª: sem guinada; 3ª: meio passo; 4ª: fica
      const cand = [[ox + tx, oz + tz, rumoTent], [ox + tx, oz + tz, orr != null ? orr : rumoTent], [ox + tx * 0.5, oz + tz * 0.5, orr != null ? orr : rumoTent]];
      let ok = false;
      for (const [cx, cz, cr] of cand) { if (!cascoEmTerra(T, C, cx, cz, cr)) { n.x = cx; n.z = cz; n.rumo = cr; ok = true; break; } }
      if (!ok) { n.x = ox; n.z = oz; if (orr != null) n.rumo = orr; wNovo = 0; }
      n.w = wNovo;
      /* velocidade ao longo da proa: perde (cos) no choque frontal, mantém no raspão + atrito; rebote só no 1º contato */
      const vAnt = n.v; n.v = vIn > 0 ? vIn * (1 - Math.max(0, -cs)) * (1 - 0.4 * dt) : vIn * (1 - 0.4 * dt);
      if (primeiro && vN > 1) n.v -= Math.min(3, 0.2 * vN);
      n.encalheDuro = -cs > 0.75 ? 1 : 0; /* só travado quando quase frontal (hidro zera o motor avante) */
      if (n.encalheDuro && n.v > 0) n.v = 0;
      const vT = Math.abs(vAnt) * Math.sqrt(Math.max(0, 1 - cs * cs));
      // dano leve ∝ v normal de impacto (+ raspão ∝ v tangencial)
      sim.dano(n, C.vida * (primeiro ? 0.0012 * vN : 0) + C.vida * dt * (0.00012 * vT + 0.0004 * vN), null, 'encalhe', 1);
      if (vN > 0.4 || vT > 0.6) { if (!n._tRoca || sim.t - n._tRoca > 0.28) { n._tRoca = sim.t; sim.evento({ t: 'roca', id: n.id, x: bxp, z: bzp, v: +vT.toFixed(2), vn: +vN.toFixed(2) }); } }
    }
    n._rochaDuro = 1;
    if (!n.encalhe) sim.evento({ t: 'encalhe', id: n.id, raspa: 0, x: bxp, z: bzp, duro: 1 });
    n.encalhe = 1; n.tRaspa = (n.tRaspa || 0) + dt;
    return 1;
  }

  // RASPA em raso (água rasa / praia): desliza ao longo, perde velocidade, dano leve
  let dx = n.x - ox, dz = n.z - oz; const dn = dx * nx + dz * nz;
  if (dn < 0) { dx -= dn * nx; dz -= dn * nz; }
  const pz = Math.min(3, 0.6 + (hMax + C.T) * 0.4) * dt * 6;
  n.x = ox + dx + nx * pz; n.z = oz + dz + nz * pz;
  const tx = -nz, tz = nx, fw = Math.sin(n.rumo) * tx - Math.cos(n.rumo) * tz;
  const rt = Math.atan2(fw >= 0 ? tx : -tx, -(fw >= 0 ? tz : -tz));
  if (n.v > 0.3) n.rumo = ang(n.rumo + clamp(ang(rt - n.rumo), -0.25 * dt, 0.25 * dt));
  n.v *= 1 - 0.55 * dt; if (n.v > 1.2 && !steep) n.v = Math.min(n.v, 1.2); /* encalhe suave só em areia/raso; paredão de rocha mantém a velocidade p/ o contato físico */ n.pivo = 0;
  sim.dano(n, C.vida * 0.004 * dt * Math.min(1, Math.abs(n.v) / 4 + 0.2), null, 'encalhe', 1);
  if (!n.encalhe) sim.evento({ t: 'encalhe', id: n.id, raspa: 1, x: bxp, z: bzp });
  n.encalhe = 1; n.tRaspa = (n.tRaspa || 0) + dt;
  if (n.tRaspa > 6 && Math.abs(n.v) < 0.8) { n.x += nx * 2 * dt; n.z += nz * 2 * dt; }
  /* fiscal nukefumaca (item 9): a raspa em raso nunca pode empurrar o casco para terra seca — se o novo passo enterra, mantém a pose anterior */
  if (cascoEmTerra(T, C, n.x, n.z, n.rumo)) { n.x = ox; n.z = oz; if (orr != null) { n.rumo = orr; n.w = 0; } if (n.v > 0) n.v = 0; }
  return 1;
}

/** Look-ahead barato para IA de navio (amostras throttle). Integra com rumoSeguro. */
export function terraAFrente(sim, n, dist) {
  const T = sim.T, d = dist != null ? dist : 500 + n.C.L * 2 + Math.abs(n.v) * 35;
  const prof = n.C.T * 1.4 + 3;
  const sx = Math.sin(n.rumo), sz = -Math.cos(n.rumo);
  // 4 amostras (menos que rumoSeguro×candidatos) — throttle por id
  if (((sim.tick + n.id) & 1) === 1 && n._terraAF != null && sim.t - (n._terraAFt || 0) < 0.2) return n._terraAF;
  let pior = 1e9, hitD = d;
  for (const f of [0.25, 0.5, 0.75, 1]) {
    const h = -alturaCache(T, n.x + sx * d * f, n.z + sz * d * f);
    if (h < pior) { pior = h; if (h < prof) hitD = Math.min(hitD, d * f); }
  }
  const r = { livre: pior > prof, pior, hitD, urg: pior > prof ? 0 : clamp(1 - hitD / d, 0, 1) };
  n._terraAF = r; n._terraAFt = sim.t; return r;
}

export function statsCacheTerreno() { return { hits: CACHE.hits, miss: CACHE.miss, usMs: +CACHE.us.toFixed(2), size: CACHE.map ? CACHE.map.size : 0 }; }

/** Velocidade REAL do casco (m/s) pelo deslocamento no passo, suavizada → n.vHud (HUD em nós). */
export function atualizaVCasco(n, ox, oz, dt) {
  const dx = n.x - ox, dz = n.z - oz;
  const dist = Math.hypot(dx, dz);
  const fwd = Math.sin(n.rumo) * dx - Math.cos(n.rumo) * dz; /* >0 avante */
  const vInst = (dist < 1e-8 ? 0 : (fwd >= 0 ? 1 : -1) * dist / Math.max(1e-6, dt));
  n.vCasco = vInst;
  const tau = 0.35; /* s de suavização */
  const k = 1 - Math.exp(-dt / tau);
  n.vHud = (n.vHud || 0) + (vInst - (n.vHud || 0)) * k;
  if (Math.abs(n.vHud) < 0.03) n.vHud = 0;
  return n.vHud;
}

/** Se encalhado duro com máquina avante/parado, HUD = 0 (motor não anda o casco). */
export function zeraVHudSeTravado(n) {
  if (n.encalheDuro && (n.telAlvo | 0) > 0) { n.vHud = 0; n.vCasco = 0; }
}
