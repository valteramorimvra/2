// v1.2.2 — bancada estatística de dispersão do canhão (simulação real: granadas, colisão com o casco, sem defesas). Alvo: destróier parado em rumo aleatório, mira com trava (lead).
import { Sim } from '../src/sim/world.js';
import { criaArena, alturaTerreno } from '../src/sim/maps.js';
import { PARAM } from '../src/armasParametros.js';
const A = criaArena('atois'); const P0 = A.plano.centro;
export function disp(tipo, dist, N = 1000, opts = {}) { let tiros = 0, hits = 0, latS = 0, rS = 0, lat2 = 0, r2 = 0, nAg = 0, rAg = 0, nAg2 = 0, dhS = 0, tgS = 0, nPl = 0; let seed = 7;
  while (tiros < N) { const s = new Sim({ arena: A, seed: seed++ }); s.ameacas.ligadas = 0; s.revelaTudo = 1; let br = (seed * 0.61) % 6.28; for (let t = 0; t < 40; t++) { let ok = 1; for (let f = 0; f <= 1.1; f += 0.04) if (alturaTerreno(A, P0.x + Math.sin(br) * dist * f, P0.z - Math.cos(br) * dist * f) > -8) ok = 0; if (ok) break; br += 0.41; }
    if (opts.semCasco) s.acertaNavio = () => null; /* v1.2.4: mede o erro de ALCANCE sem o casco parar as granadas: todas cruzam o plano do alvo */ const n = s.adicionaNavio('azul', tipo, P0.x, P0.z, br + Math.PI / 2); const e = s.adicionaNavio('vermelho', 'destroier', P0.x + Math.sin(br) * dist, P0.z - Math.cos(br) * dist, (seed * 1.7) % 6.28);
    e.vida = e.C.vida = 1e9; e.ciws = []; e.a30 = []; n.papel = opts.bot ? 'bot' : 'jogador'; if (opts.vel) n.telAlvo = 4;
    s.aplica({ id: n.id, t: 'radar', v: 1 }); for (let i = 0; i < 60 * 2; i++) s.passo(); s.aplica({ id: n.id, t: 'travar', alvo: e.id }); for (let i = 0; i < 60 * (opts.vel ? 25 : 8); i++) { if (opts.giro) n.lemeCmd = 1; s.passo(); }
    if (opts.instavel) n.tEstavel = 0; else if (!opts.vel && !opts.giro) n.tEstavel = 10;
    for (let salva = 0; salva < 6 && tiros < N; salva++) { s.eventos.length = 0; const sol = s.pontaria(n); for (let i = 0; i < n.torres.length; i++) { const tr = n.torres[i]; const pt = n.P.torres[i]; const c = Math.cos(n.rumo), sn = Math.sin(n.rumo); const tx = n.x - pt.z * sn, tz = n.z + pt.z * c; const bz = Math.atan2(sol.px - tx, -(sol.pz - tz)); tr.az = ((bz - n.rumo + Math.PI * 3) % (Math.PI * 2)) - Math.PI; tr.el = sol.el; if (opts.instavel) n.tEstavel = 0; if (s.disparaCanhao(n, i, sol)) {} }
      let k = 0; for (const ev of s.eventos) if (ev.t === 'tiro') k++; tiros += k;
      /* v1.2.4: erro medido no PLANO DO ALVO (padrão de artilharia): cada granada é seguida da boca até cruzar o plano vertical que passa pelo alvo,
         perpendicular à linha boca→alvo. Lateral = desvio nesse plano; alcance = erro de altura ÷ tan(ângulo de queda); granada que para antes (casco/água curta) usa o ponto de parada. */
      const seg = []; for (const g of s.granadas) if (g.ativo && g.dono === n.id && g.t === 0) seg.push({ g, ox: g.x, oz: g.z, px: g.x, py: g.y, pz: g.z, ok: 0 });
      const mede = (q, x, y, z, vx, vy, vz, cruzou) => { const tx = e.x - q.ox, tz = e.z - q.oz, D = Math.hypot(tx, tz), ux = tx / D, uz = tz / D; const al = (x - q.ox) * ux + (z - q.oz) * uz, l = (x - q.ox) * uz - (z - q.oz) * ux;
        let r = al - D; if (cruzou) { const vh = vx * ux + vz * uz; const tg = Math.max(1e-4, -vy / Math.max(1, vh)); r = (y - (e.arfagem + e.C.F * 0.7)) / tg; } rS += r; latS += l; r2 += r * r; lat2 += l * l; nAg++; q.ok = 1; };
      for (let i = 0; i < 60 * 8; i++) { s.passo(); for (const ev of s.eventos) { if (ev.t === 'impacto' && ev.tipo === 'canhao' && ev.alvo === e.id && ev.dono === n.id) hits++; if ((ev.t === 'agua' || ev.t === 'impacto') && ev.dono === n.id) { const dx = ev.x - e.x, dz = ev.z - e.z; const ux = Math.sin(br), uz = -Math.cos(br); rAg += dx * ux + dz * uz; nAg2++; } }
        for (const q of seg) { if (q.ok) continue; const g = q.g; const tx = e.x - q.ox, tz = e.z - q.oz, D = Math.hypot(tx, tz); if (!g.ativo) { mede(q, q.px, q.py, q.pz, 0, 0, 0, false); continue; }
          const yA = e.arfagem + e.C.F * 0.7; if (opts.semCasco) { if (g.y <= yA && g.vy < 0) { const f = Math.max(0, Math.min(1, (q.py - yA) / Math.max(1e-6, q.py - g.y))); const x = q.px + (g.x - q.px) * f, z = q.pz + (g.z - q.pz) * f; const al = ((x - q.ox) * tx + (z - q.oz) * tz) / D; dhS += al - D; tgS += 1; nPl++; mede(q, x, yA, z, 0, 0, 0, false); continue; } q.px = g.x; q.py = g.y; q.pz = g.z; continue; } /* semCasco: alcance exato onde a granada desce à altura visada */
          const a1 = ((g.x - q.ox) * tx + (g.z - q.oz) * tz) / D; if (a1 >= D) { const a0 = ((q.px - q.ox) * tx + (q.pz - q.oz) * tz) / D; const f = Math.max(0, Math.min(1, (D - a0) / Math.max(1e-6, a1 - a0))); mede(q, q.px + (g.x - q.px) * f, q.py + (g.y - q.py) * f, q.pz + (g.z - q.pz) * f, g.vx, g.vy, g.vz, true); continue; }
          q.px = g.x; q.py = g.y; q.pz = g.z; }
        s.eventos.length = 0; if (!s.granadas.some((g) => g.ativo)) break; }
      if (opts.instavel || opts.giro) n.lemeCmd = 1; } }
  return { tiros, pct: hits / tiros, sdLat: Math.sqrt(lat2 / Math.max(1, nAg)), sdR: Math.sqrt(r2 / Math.max(1, nAg)), medLat: latS / Math.max(1, nAg), medR: rS / Math.max(1, nAg), medRagua: rAg / Math.max(1, nAg2), erroAlcance: nPl ? dhS / nPl : NaN, nPlano: nPl }; }
