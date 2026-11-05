// teste automático do controle manual (node, determinístico)
const { Sim } = await import('/workspace/nexo-naval-strike/src/sim/world.js'); const { criaArena } = await import('/workspace/nexo-naval-strike/src/sim/maps.js');
const NK = await import('/workspace/nexo-naval-strike/src/sim/nuclear.js');
function cria() { const A = criaArena('atois'), P0 = A.plano.centro; const s = new Sim({ arena: A, seed: 5 }); const n = s.adicionaNavio('azul', 'chapada', P0.x, P0.z, 0); n.papel = 'jogador';
  const e = s.adicionaNavio('vermelho', 'corveta', P0.x + 5000, P0.z - 3000, 0); e.sam = 0; e.ciws.forEach(c => c.mun = 0); s.t = 125; return { s, n, e }; }
const res = {}; const falhas = [];
{ const { s, n, e } = cria(); s.passo([{ id: n.id, t: 'nuclear', alvo: e.id }, { id: n.id, t: 'nkPiloto', v: 1 }]); let q = NK.nkBombardeiroDe(s, n); let maxW = 0, maxDR = 0, maxDB = 0, r0 = q.roll, b0 = 0, minY = 1e9, solt = 0, det = 0, cue = 0, pousou = 0, tIaOn = -1;
  const imp = {}; let fase3t = 0;
  for (let i = 0; i < 60 * 260; i++) { const t = i / 60; let cmds = [];
    q = s.nukes.find(x => x.dono === n.id && (x.ativo)) || q;
    if (q.ativo && q.fase >= 2 && i % 6 === 0) { // piloto: aponta para o alvo com manche proporcional + ruído brusco de toque (testa suavização)
      if (q.fase === 2) { NK.impactoNuclear(q, imp); const lead = e; const brg = Math.atan2(lead.x - q.x, -(lead.z - q.z)); let er = brg - q.rumo; er = Math.atan2(Math.sin(er), Math.cos(er)); const jx = Math.max(-1, Math.min(1, er * 3)) * (i % 120 < 6 ? -1 : 1); const jy = (700 - q.y) / 300;
        cmds.push({ id: n.id, t: 'nkCtl', jx, jy: Math.max(-1, Math.min(1, jy)) }); if (i % 60 === 0 && q.alvo < 0) cmds.push({ id: n.id, t: 'nkTrava', alvo: e.id });
        const dErr = Math.hypot(imp.x - e.x, imp.z - e.z); if (dErr < 200 && imp.ok && !solt) { cmds.push({ id: n.id, t: 'nkSolta' }); cue = dErr; } }
      else if (q.fase === 3 && tIaOn < 0) { fase3t += 0.1; cmds.push({ id: n.id, t: 'nkCtl', jx: 0.6, jy: 0.3 }); if (fase3t > 8) { cmds.push({ id: n.id, t: 'nkPiloto', v: 0 }); tIaOn = t; } } }
    const pr = { roll: q.roll, bank: q.bank, w: q.w }; s.passo(cmds.length ? cmds : null);
    for (const ev of s.eventos || []) { if (ev.t === 'nkSolta') solt = t; if (ev.t === 'nkDetona') det = t; if (ev.t === "nkPousa") pousou = t; } s.eventos.length = 0;
    if (q.ativo && q.fase >= 2) { const dr = Math.abs(q.roll - pr.roll) * 60; if (dr > maxDR) { maxDR = dr; res.ondeRol = { t: +t.toFixed(2), fase: q.fase, man: q.manual, tA: +q.tAssume.toFixed(2), roll: +q.roll.toFixed(2), pr: +pr.roll.toFixed(2) }; } maxW = Math.max(maxW, Math.abs(q.w)); if (q.manual) maxDB = Math.max(maxDB, Math.abs(q.w - pr.w) * 60); if (q.manual && q.t > 15 && q.y < minY) { minY = q.y; res.ondeY = { t: +t.toFixed(1), fase: q.fase, vy: +q.vy.toFixed(1), gam: +q.gam.toFixed(3) }; } }
    if (det && pousou) break; }
  res.manual = { solta: solt, detona: det, pousou, ErroSoltura: Math.round(cue), maxTaxaRol: +maxDR.toFixed(3), maxCurva: +maxW.toFixed(3), maxDCurvaManual: +maxDB.toFixed(3), minAlt: Math.round(minY), alvoMorto: e.morto ? 1 : 0, friendly: n.vida >= n.C.vida ? 0 : 1 };
  if (!solt || !det) falhas.push('manual: sem soltura/detonação'); if (!e.morto) falhas.push('manual: alvo não destruído'); if (maxDR > 0.62) falhas.push('rolagem brusca ' + maxDR); if (!pousou) falhas.push('IA não pousou após religar'); if (minY < 150) falhas.push('altitude baixa ' + minY); }
{ const { s, n, e } = cria(); s.passo([{ id: n.id, t: 'nuclear', alvo: e.id }, { id: n.id, t: 'nkPiloto', v: 1 }]); let solt = 0, det = 0, maxDR = 0, q = NK.nkBombardeiroDe(s, n), lig = 0;
  for (let i = 0; i < 60 * 200 && !det; i++) { const t = i / 60, c = []; if (q.fase >= 2 && t < 20 && i % 6 === 0) c.push({ id: n.id, t: 'nkCtl', jx: 0.8, jy: 0.4 }); if (t >= 20 && !lig) { lig = 1; c.push({ id: n.id, t: 'nkPiloto', v: 0 }); }
    const r0 = q.roll; s.passo(c.length ? c : null); if (q.ativo && q.fase >= 2) maxDR = Math.max(maxDR, Math.abs(q.roll - r0) * 60); for (const ev of s.eventos) { if (ev.t === 'nkSolta') solt = t; if (ev.t === 'nkDetona') det = t; } s.eventos.length = 0; }
  res.iaReassume = { solta: +solt.toFixed(1), detona: +det.toFixed(1), maxTaxaRol: +maxDR.toFixed(3), alvoMorto: e.morto ? 1 : 0 }; if (!det) falhas.push('IA religada não completou o ataque'); if (maxDR > 0.62) falhas.push('IA reassume brusca ' + maxDR); }
{ const { valida } = await import('/workspace/nexo-naval-strike/src/net/commands.js'); for (const c of [{ id: 0, t: 'nkPiloto', v: 1 }, { id: 0, t: 'nkCtl', jx: 0.2, jy: -0.1 }, { id: 0, t: 'nkTrava', alvo: 1 }, { id: 0, t: 'nkSolta' }, { id: 0, t: 'nkEspera', v: 1 }]) if (!valida(c)) falhas.push('rede descarta ' + c.t); }
{ // ESPERA sem atacar: inimigo a 6,5 km; 120 s em espera → não lança, fica fora do alcance SAM, não é abatido; depois troca para MANUAL, depois IA de ataque → detona
  const { s, n, e } = cria(); const { SAM } = await import('/workspace/nexo-naval-strike/src/sim/classes.js'); e.sam = 8; s.passo([{ id: n.id, t: 'nuclear', alvo: e.id }]); s.passo([{ id: n.id, t: 'nkEspera', v: 1 }]); const q = NK.nkBombardeiroDe(s, n); let solt = 0, det = 0, minDE = 1e9, maxDR = 0, abat = 0, estados = [];
  for (let i = 0; i < 60 * 260 && !det && !abat; i++) { const t = i / 60, c = []; if (i === 60 * 120) { c.push({ id: n.id, t: 'nkPiloto', v: 1 }); estados.push('manual@120'); } if (i > 60 * 120 && i < 60 * 135 && i % 6 === 0) c.push({ id: n.id, t: 'nkCtl', jx: -0.5, jy: 0.2 }); if (i === 60 * 135) { e.sam = 0; c.push({ id: n.id, t: 'nkPiloto', v: 0 }); estados.push('iaAtaque@135'); }
    const r0 = q.roll; s.passo(c.length ? c : null); if (q.ativo && q.fase >= 2) { maxDR = Math.max(maxDR, Math.abs(q.roll - r0) * 60); if (t > 10 && t < 120) minDE = Math.min(minDE, Math.hypot(q.x - e.x, q.z - e.z)); }
    for (const ev of s.eventos) { if (ev.t === 'nkSolta') solt = t; if (ev.t === 'nkDetona') det = t; if (ev.t === 'nkAbatido') abat = t; } s.eventos.length = 0; }
  res.espera = { soltouAntes120: solt && solt < 120 ? 1 : 0, minDistInimigoEmEspera: Math.round(minDE), alcanceSAM: SAM.alc, abatido: abat, soltou: +solt.toFixed(1), detonou: +det.toFixed(1), maxTaxaRol: +maxDR.toFixed(3), estados };
  if (solt && solt < 120) falhas.push('espera atacou'); if (minDE < SAM.alc) falhas.push('espera entrou no alcance SAM'); if (!det) falhas.push('após espera→manual→IA não detonou'); if (maxDR > 0.62) falhas.push('espera brusca'); }
{ // combustível em ESPERA: volta e pousa sozinho com a bomba devolvida
  const { s, n, e } = cria(); s.passo([{ id: n.id, t: 'nuclear', alvo: e.id }]); s.passo([{ id: n.id, t: 'nkEspera', v: 1 }]); let pousa = null;
  for (let i = 0; i < 60 * 800 && !pousa; i++) { s.passo(null); for (const ev of s.eventos) if (ev.t === 'nkPousa') pousa = ev; s.eventos.length = 0; }
  res.combustivel = { pousou: pousa ? +(s.t - 125).toFixed(0) : 0, comBomba: pousa ? pousa.comBomba : 0, bombas: n.nk.bombas }; if (!pousa || !pousa.comBomba || n.nk.bombas !== 1) falhas.push('combustível: não pousou com a bomba'); }
console.log(JSON.stringify(res)); console.log('falhas', JSON.stringify(falhas)); process.exit(falhas.length ? 1 : 0);
