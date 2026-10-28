// v1.2.16 item 12: BATALHA PERSONALIZADA — 2 configurações jogadas até o fim (A: 5×5 com lendários e heroicas via TELA; B: aleatória via preset),
// verifica: composição/camuflagem/personalidade por bot, mar/duração, fogo amigo 0, 0 programas WebGL novos durante a partida, recompensa reduzida sem ouro, presets offline.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = process.env.DIR || '/workspace/nexo-naval-shots/1216/personalizada'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {};
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
// configuração A pela TELA
await ev(`(()=>{ const s=__nnsUI.save; s.d.pers={ azul:[{tipo:'marcos',pintura:'her_italia',perso:'agressivo'},{tipo:'rodolfo',pintura:'her_trovoes',perso:'equilibrado'},{tipo:'antonia',pintura:'her_aurora',perso:'cauteloso'},{tipo:'colosso',pintura:'her_fogos',perso:'agressivo'}],
  vermelho:[{tipo:'baluarte',pintura:'her_brasil',perso:'agressivo'},{tipo:'marcos',pintura:'her_cromo',perso:'equilibrado'},{tipo:'rodolfo',pintura:'her_oceano',perso:'cauteloso'},{tipo:'antonia',pintura:'her_faisca',perso:'agressivo'},{tipo:'colosso',pintura:'her_militar',perso:'equilibrado'}],
  mapa:'atois', hora:'dia', tempo:'limpo', mar:4, duracao:300 }; s.salva(); __nnsUI.TELAS.personalizada(); return 1 })()`); await esp(800);
await b.foto(DIR + '/tela-A.png');
R.ui = JSON.parse(await ev(`(()=>{ const L=[...document.querySelectorAll('.pb-linha')]; const r=L.map(e=>e.getBoundingClientRect()); let sob=0; for(let i=0;i<r.length;i++) for(let j=i+1;j<r.length;j++){ const a=r[i],c=r[j]; if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1) sob++; }
  const sel=[...document.querySelectorAll('.tela-personalizada select')]; const corta=sel.filter(s=>s.getBoundingClientRect().right>innerWidth+1).length; return JSON.stringify({linhas:L.length, sobreposicoes:sob, foraDaTela:corta, fundo:getComputedStyle(document.querySelector('.tela-personalizada')).backgroundColor}) })()`));
// preset salvo e relido (offline/localStorage)
await ev(`(()=>{ document.querySelector('[data-a=nomep]').value='Teste 5x5'; document.querySelector('[data-a=salvap]').click(); return 1 })()`); await esp(300);
R.preset = await ev(`JSON.stringify(Object.keys(__nnsUI.save.d.presets||{}))`); /* v1.2.18: presets no save */
await ev(`(()=>{ __nnsUI.TELAS.batalha(); return 1 })()`); await esp(300); await b.foto(DIR + '/tela-batalha-botao.png'); await ev(`(()=>{ document.querySelector('[data-a=pers]').click(); return 1 })()`); await esp(400);
async function joga(tag, clicaUI) {
  if (clicaUI) await ev(`(()=>{ document.querySelector('[data-a=zarparp]').click(); return 1 })()`);
  for (let i = 0; i < 240; i++) { if (await ev(`!!(window.__nns && __nns.S && __nns.rodando && __nns.eu)`)) break; await esp(500); }
  await ev(`(()=>{ __nns.tutorial=false; return 1 })()`); await esp(5000);
  const ini = JSON.parse(await ev(`(()=>{ const S=__nns.S, sim=S.sim; return JSON.stringify({ prog:__nns.R.info.programs.length, mar:null, dur:S.match.duracao, azul:sim.navios.filter(n=>n.time==='azul').map(n=>[n.tipo,n.pintura||(n.opc&&n.opc.pintura),n.agrIA]), vermelho:sim.navios.filter(n=>n.time==='vermelho').map(n=>[n.tipo,n.pintura||(n.opc&&n.opc.pintura),n.agrIA]) }) })()`));
  await b.foto(DIR + `/partida-${tag}.png`);
  // fogo amigo: tiro de um aliado acerta outro aliado → 0 dano
  const t0 = Date.now(); let ft = []; 
  // acelera o fim (a partida corre normalmente; só o relógio é adiantado para o tempo restante de ~25 s)
  await ev(`(()=>{ const m=__nns.S.match; m.tempo=Math.max(m.tempo, m.duracao-25); return 1 })()`);
  let fim = false; for (let i = 0; i < 300; i++) { const q = await ev(`(()=>{ const p=__nns.R.info.programs.length; return JSON.stringify({fim:!!(__nns.S&&__nns.S.sim.fim), p, tela:document.querySelector('.tela-resultado')?1:0}) })()`); const o = JSON.parse(q); ft.push(o.p); if (o.tela) { fim = true; break; } await esp(1000); }
  await esp(800); await b.foto(DIR + `/resultado-${tag}.png`);
  const res = await ev(`(()=>{ const t=document.querySelector('.tela-resultado'); return t? t.innerText.slice(0,600):'' })()`);
  return { ini, fim, progMax: Math.max(...ft), progIni: ini.prog, res, seg: (Date.now() - t0) / 1000 };
}
const antes = JSON.parse(await ev(`JSON.stringify({ouro:__nnsUI.eco.e.ouro, prata:__nnsUI.eco.e.prata})`));
R.A = await joga('A', true);
const depA = JSON.parse(await ev(`JSON.stringify({ouro:__nnsUI.eco.e.ouro, prata:__nnsUI.eco.e.prata})`)); R.A.ouroGanho = depA.ouro - antes.ouro; R.A.prataDelta = depA.prata - antes.prata;
// configuração B: aleatória (botão 🎲) 
await ev(`(()=>{ const m=document.querySelector('[data-a=menu]'); if(m) m.click(); return 1 })()`); await esp(800);
await ev(`(()=>{ __nnsUI.TELAS.personalizada(); document.querySelector('[data-a=aleat]').click(); return 1 })()`); await esp(600);
await ev(`(()=>{ const s=__nnsUI.save; s.d.pers.mapa='atois'; s.salva(); __nnsUI.TELAS.personalizada(); return 1 })()`); await esp(500); await b.foto(DIR + '/tela-B-aleatoria.png');
R.cfgB = await ev(`JSON.stringify(__nnsUI.save.d.pers)`);
const antesB = JSON.parse(await ev(`JSON.stringify({ouro:__nnsUI.eco.e.ouro})`));
R.B = await joga('B', true); R.B.ouroGanho = JSON.parse(await ev(`JSON.stringify({ouro:__nnsUI.eco.e.ouro})`)).ouro - antesB.ouro;
R.erros = await ev(`JSON.stringify((window.__erros||[]).slice(0,5))`);
console.log(JSON.stringify(R, null, 1));
const A = R.A.ini; if (A.azul.length !== 5 || A.vermelho.length !== 5) falhas.push('A não é 5×5: ' + A.azul.length + 'x' + A.vermelho.length);
if (!A.vermelho.some((x) => x[0] === 'marcos') || !A.azul.some((x) => x[1] === 'her_italia')) falhas.push('classes/camos não aplicadas');
if (!A.azul.some((x) => x[2] === 0.95) || !A.azul.some((x) => x[2] === 0.3)) falhas.push('personalidade não aplicada');
if (A.dur !== 300) falhas.push('duração não aplicada ' + A.dur);
for (const k of ['A', 'B']) { if (!R[k].fim) falhas.push(k + ': não terminou'); if (R[k].progMax > R[k].progIni) falhas.push(`${k}: programas novos ${R[k].progIni}→${R[k].progMax}`); if (R[k].ouroGanho > 0) falhas.push(k + ': ganhou ouro'); }
const U = typeof R.ui === "string" ? JSON.parse(R.ui) : R.ui; if (U.sobreposicoes || U.foraDaTela) falhas.push('UI sobreposta ' + R.ui); if (!R.preset.includes('Teste 5x5')) falhas.push('preset não salvo');
console.log('falhas', falhas.length, falhas.join(' | ')); await b.fecha(); process.exit(falhas.length ? 1 : 0);
