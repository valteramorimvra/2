// v1.2.12 — cada torre dos navios novos dispara contra alvos em várias marcações; botão CANHÃO sempre gera tiros com torre no arco
import { criaSessao } from '../src/sim/session.js';
import { torreCobre } from '../src/naval5v5/armas.js';
const CL = (process.env.CL || 'volkhar,baluarte,kordao,estrelar,colosso,horizonte,trovao,cruzador,fragata').split(',');
const MARC = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]; const DIST = (process.env.DIST || '2500,7000').split(',').map(Number);
let falhas = 0; const out = [];
for (const k of CL) {
  const linha = []; let ok = 0, tot = 0;
  for (const dist of DIST) for (const mg of MARC) {
    const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: k, seed: 5 }); const s = S.sim, n = s.navios[S.match.jogadorId];
    s.revelaTudo = 1; const a = s.navios.find((q) => q.time !== n.time); for (const q of s.navios) if (q !== n && q !== a) { q.x = 1e9; q.morto = 1; }
    const br = mg * Math.PI / 180;
    const fix = () => { n.x = 0; n.z = 0; n.rumo = 0; n.v = 0; n.telAlvo = 0; Object.assign(a, { x: Math.sin(br) * dist, z: -Math.cos(br) * dist, v: 0, telAlvo: 0, vida: 1e9, sam: 0, vls: 0, torp: 0 }); };
    fix(); a.papel = 'alvo';
    const por = new Array(n.torres.length).fill(0); let tiros = 0;
    for (let f = 0; f < 60 * 25; f++) { fix(); const cmds = f === 5 ? [{ t: 'travar', id: n.id, alvo: a.id }] : (process.env.TOQUE ? f === 90 : f % 20 === 0) ? [{ t: 'canhao', id: n.id }] : []; s.passo(cmds); for (const e of s.eventos) if (e.t === 'tiro' && e.id === n.id) { tiros++; if (e.torre >= 0) por[e.torre]++; } s.eventos.length = 0; }
    const az = Math.atan2(a.x - n.x, -(a.z - n.z)); const esperadas = n.torres.map((_, i) => torreCobre(n, i, az));
    const faltou = esperadas.map((e, i) => e && !por[i] ? i : -1).filter((i) => i >= 0);
    tot++; if (!faltou.length && (esperadas.some(Boolean) ? tiros > 0 : true)) ok++; else { falhas++; linha.push(`${mg}°/${dist}m: torres sem tiro ${faltou.join(',')} (arco ${esperadas.map(Number).join('')}, tiros ${por.join('/')}, bloq ${n.sol && n.sol.bloq}, d ${n.sol && Math.round(n.sol.d)}, trav ${n.sol && n.sol.travado}, el ${n.sol && n.sol.el && n.sol.el.toFixed(3)})`); }
  }
  out.push(`${k}: ${ok}/${tot} OK${linha.length ? '\n   ' + linha.slice(0, 8).join('\n   ') : ''}`);
}
console.log(out.join('\n')); console.log('falhas', falhas); process.exitCode = falhas ? 1 : 0;
