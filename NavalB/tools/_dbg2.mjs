import './shimdoc.mjs';
const _l=console.log; console.log=(...a)=>{ if(typeof a[0]==='string'&&a[0].startsWith('THREE'))return; _l(...a)}; console.warn=()=>{};
const R = new URL('../src/', import.meta.url).pathname; globalThis.__ltGera=1; globalThis.__cx=1;
const SM = await import(R+'render/shipModels.js'); const LT = await import(R+'sim/linhaTiro.js');
delete LT.MASC.destroier; SM.esqueceModelo('destroier'); SM.criaNavio3D('destroier',0);
const cx = LT.MASC.destroier.cx; const [x0,y0,z0]=[0,13.676,-18.9];
for (const c of cx) { if (c.b[1] < y0 - 1) continue; const zc=(c.a[2]+c.b[2])/2; console.log(c.dono, c.a.map(v=>v.toFixed(1)).join(','), '|', c.b.map(v=>v.toFixed(1)).join(','), zc<z0?'PROA':'POPA'); }
const C=(await import(R+'sim/classes.js')).CLASSES.destroier; const Lm=await import(R+'sim/layout.js');
for (const azd of [-10,0,5]) for (const el of [0.05,0.15]) { const az=azd*Math.PI/180, dx=Math.sin(az), dz=-Math.cos(az); const hits=[];
 cx.forEach((c,k)=>{ if(c.dono==='ciws0')return; for(let s=2;s<120;s+=0.25){const x=x0+dx*s*Math.cos(el),y=y0+Math.sin(el)*s,z=z0+dz*s*Math.cos(el); if(x>c.a[0]-.3&&x<c.b[0]+.3&&y>c.a[1]-.3&&y<c.b[1]+.3&&z>c.a[2]-.3&&z<c.b[2]+.3){hits.push(k+':'+(c.dono||'-')+'@'+s.toFixed(1)+' '+c.a.map(v=>v.toFixed(1))+'|'+c.b.map(v=>v.toFixed(1)));break;}}});
 let dk=''; for(let s=2;s<75;s+=0.6){const x=x0+dx*s,z=z0+dz*s,y=y0+s*Math.tan(el); if(y<Lm.deckY(C,z)+0.3&&Math.abs(x)<Lm.meiaBoca(C,z)+0.3){dk='DECK@'+s.toFixed(1)+' deckY '+Lm.deckY(C,z).toFixed(1);break;}}
 console.log(azd,el,hits.join(' ; '),dk); }
console.log(Object.keys(cx[111]), cx[111].nome||'', cx[110]&&cx[110].a, cx[112]&&cx[112].a);
let cnt=0; for (const [k,c] of cx.entries()) if (c.b[0]-c.a[0]<0.7 && c.b[1]-c.a[1]<0.7 && c.b[2]-c.a[2]<0.7) cnt++; console.log('small boxes', cnt, cx.length);
