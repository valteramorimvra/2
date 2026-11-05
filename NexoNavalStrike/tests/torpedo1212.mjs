const SRC = process.env.SRC || '/workspace/nexo-naval-strike/src';
const { criaSessao } = await import(SRC + '/sim/session.js');
let hit=0, tot=0, vmax=0; const erros=[];
for (let k=0;k<24;k++){ const S=criaSessao({ mapa:'atois', modo:'duelo', classe:'destroier', seed:10+k }); const s=S.sim, n=s.navios[S.match.jogadorId]; s.revelaTudo=1; const a=s.navios.find(e=>e.time!==n.time&&!e.C.mercante); for (const q of s.navios) if(q!==n&&q!==a){q.x=1e9;q.morto=1;}
 const br=(k*37%360)*Math.PI/180; const pos=()=>{ n.x=0;n.z=0;n.v=0; }; pos(); a.x=Math.sin(br)*2500; a.z=-Math.cos(br)*2500; a.rumo=br+1.4; a.telAlvo=3; a.papel='alvo'; a.chaff=0;
 for (let f=0;f<60*6;f++){ pos(); n.miraSobre=1; n.mira.az=Math.atan2(a.x-n.x,-(a.z-n.z)); s.passo(f===2?[{t:'travar',id:n.id,alvo:a.id}]:[]); s.eventos.length=0; }
 n.tTorp=0; const L=s.lancaTorpedo(n,a.id); if(!L){ erros.push('nao lancou '+JSON.stringify(s.eventos.filter(e=>e.t==='naoPronto'))); continue; } tot++; let h=0, fim=null;
 for (let f=0;f<60*30 && !h && !fim;f++){ s.passo([]); for (const tp of s.torpedos) if (tp.ativo) vmax=Math.max(vmax,tp.v||0); for (const e of s.eventos){ if(e.t==='torpImpacto'&&e.alvo===a.id) h=1; if(e.t==='torpFim') fim=e; } s.eventos.length=0; }
 hit+=h; if(!h) erros.push('erro '+k+' '+JSON.stringify(fim)); }
console.log('torpedo acertos', hit+'/'+tot, 'v máx', vmax.toFixed(0), 'm/s', erros.slice(0,6).join(' | '));
