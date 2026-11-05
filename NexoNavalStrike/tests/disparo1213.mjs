// v1.2.13 — milhares de salvas: todo evento 'tiro' (som/clarão) tem granada viva e balística; nenhuma morre < 0,1 s sem impacto real
import { criaSessao } from '../src/sim/session.js';
import { CLASSES } from '../src/sim/classes.js';
import { alturaTerreno } from '../src/sim/maps.js';
import { defineMar } from '../src/sim/ocean.js';
const CL = process.env.CL ? process.env.CL.split(',') : Object.keys(CLASSES).filter((k) => k !== 'mercante');
const MARC = [0, 45, 90, 135, 180, 225, 270, 315]; const SEG = +(process.env.SEG || 10);
const CEN = (process.env.CEN || 'mar,mar6,costa').split(',');
const tot = { tiros: 0, semGranada: 0, precoce: 0, causas: {}, precCausa: {} }; const ex = []; const porCl = [];
// ponto de costa: água rasa (-6..-1 m) com terra (> 2 m) a 60–200 m na direção rumo
function achaCosta(T) { for (let z = -5000; z < 5000; z += 97) for (let x = -5000; x < 5000; x += 89) { const h = alturaTerreno(T, x, z); if (h > -6 && h < -1.5) for (let k = 0; k < 8; k++) { const r = k * Math.PI / 4; const hx = alturaTerreno(T, x + Math.sin(r) * 120, z - Math.cos(r) * 120); if (hx > 3) return { x, z, r }; } } return null; }
for (const k of CL) { let cT = 0, cP = 0, cS = 0;
  for (const cen of CEN) {
    const mapa = cen === 'costa' ? 'fiordes' : 'atois';
    for (const dist of [700, 2500, 6000]) for (const mg of MARC) {
      const S = criaSessao({ mapa, modo: 'duelo', classe: k, seed: 7 + mg }); if (cen === 'mar6') defineMar(6, 1.4); const s = S.sim, n = s.navios[S.match.jogadorId];
      if (dist > n.C.canhao.alc) continue;
      s.revelaTudo = 1; const a = s.navios.find((q) => q.time !== n.time); for (const q of s.navios) if (q !== n && q !== a) { q.x = 1e9; q.morto = 1; }
      let P0 = { x: 0, z: 0, r: 0 }; if (cen === 'costa') { const c = achaCosta(s.T); if (c) P0 = c; }
      const br = P0.r + mg * Math.PI / 180;
      const fix = () => { n.x = P0.x; n.z = P0.z; n.rumo = P0.r; n.v = 14; Object.assign(a, { x: P0.x + Math.sin(br) * dist, z: P0.z - Math.cos(br) * dist, v: 6, vida: a.C.vida, lista: 0, aguaAbordo: 0, alagamento: 0, incendio: 0, sam: 0, vls: 0, torp: 0 }); };
      fix(); a.papel = 'alvo'; const viva = new Map();
      for (let f = 0; f < 60 * SEG; f++) { fix(); const cmds = f === 5 ? [{ t: 'travar', id: n.id, alvo: a.id }] : f % 15 === 0 ? [{ t: 'canhao', id: n.id }] : []; s.passo(cmds);
        for (const e of s.eventos) if (e.t === 'tiro' && e.id === n.id && !e.sec) { tot.tiros++; cT++; const g = s.granadas[e.gi];
          if (!(e.gi >= 0) || !g) { tot.semGranada++; cS++; ex.push(`${k}/${cen}: tiro sem granada`); continue; }
          viva.set(e.gi, { f, g, y0: e.y, x0: e.x, z0: e.z, el: e.el, seq: g.t }); g.fim = null; }
        s.eventos.length = 0;
        for (const [gi, r] of viva) { const g = r.g; if (g.ativo && g.dono === n.id) continue; viva.delete(gi);
          const vida = (f - r.f) / 60 + 1 / 60; const c = g.fim || '?'; tot.causas[c] = (tot.causas[c] || 0) + 1;
          if (vida < 0.1 && c !== 'navio') { tot.precoce++; cP++; tot.precCausa[c] = (tot.precCausa[c] || 0) + 1; if ((tot.precCausa[c] || 0) <= 8) ex.push(`${k}/${cen}/${mg}°/${dist}m: morreu em ${vida.toFixed(3)}s por ${c} (boca y ${r.y0.toFixed(2)} el ${(r.el * 57.3).toFixed(2)}° terreno ${alturaTerreno(s.T, r.x0, r.z0).toFixed(1)})`); } }
      }
    }
  }
  porCl.push(`${k}: tiros ${cT} precoces ${cP} semGranada ${cS}`);
}
console.log(porCl.join('\n')); console.log(ex.join('\n'));
console.log('TOTAL tiros', tot.tiros, 'som==projétil', tot.tiros - tot.semGranada, '/', tot.tiros, 'precoces(<0,1s sem impacto real)', tot.precoce, JSON.stringify(tot.precCausa), 'causas', JSON.stringify(tot.causas));
process.exitCode = tot.semGranada || tot.precoce ? 1 : 0;
