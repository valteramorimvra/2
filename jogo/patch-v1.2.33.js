#!/usr/bin/env node
/*
 * Patch v1.2.33 — aplicado sobre o bundle compilado da v1.2.32 (index-HCW9E8Kr.js).
 *
 * Uso:  node patch-v1.2.33.js <entrada.js> <saida.js>
 *
 * Cada troca procura um trecho EXATO do bundle e exige que ele apareça uma única vez;
 * se o bundle mudar (nova build), o script para e diz qual trecho não encontrou.
 */
const fs = require("fs");
const [, , ENT, SAI] = process.argv;
if (!ENT || !SAI) {
  console.error("uso: node patch-v1.2.33.js <entrada.js> <saida.js>");
  process.exit(1);
}
let src = fs.readFileSync(ENT, "utf8");
const trocas = [];
const T = (desc, velho, novo) => trocas.push({ desc, velho, novo });

/* ------------------------------------------------------------------ */
/* 0. Funções auxiliares da 1.2.33 (escopo do módulo)                  */
/* ------------------------------------------------------------------ */
const AUX = String.raw`
/* v1.2.33 — auxiliares */
const __NK_FILA={passo:37,degrau:10,intervalo:4,rearme:10,cam:40,camLider:49},
__NK_METAL=[{c:"#3f9a68",e:"#1f2a24"},{c:"#3f6fc4",e:"#1d2433"},{c:"#c9a443",e:"#2d281c"}],
__NK_FUMACA=["#1ee46e","#2a7dff","#ffd21a"],
__NM_INTERVALO=8,
__SG={nk:.74,canhao:.8,def:.6,gran:.9},__sgC=new Map;
function __sg(n){n=String(n==null?"":n);let g=__sgC.get(n);if(g!=null)return g;const s=n.replace(/^sint:/,"");g=/^nk:/.test(s)?__SG.nk:/ciws|flares/.test(s)?__SG.def:/^gr:|granada|lancGr/.test(s)?__SG.gran:/^canhao|^cp_|^cam:canhao|salvaReforco/.test(s)?__SG.canhao:1;__sgC.set(n,g);return g}
function __nkUltimo(o,L){if(!o||!o.nukes||!L)return L;let u=L,ma=0;for(const w of o.nukes)if(w.ativo&&w.lider===L.idx&&w.dono===L.dono&&w.fase>=2&&(w.ala|0)>ma){const fx=Math.sin(L.rumo),fz=-Math.cos(L.rumo),a=__NK_FILA.passo*w.ala;if(Math.hypot(L.x-fx*a-w.x,L.z-fz*a-w.z)<160)ma=w.ala|0,u=w}return u}
function __nkPinta(R,l,h){const p=l.lider>=0?(l.ala===1?1:2):0;if(h._pinta===p)return;h._pinta=p;const C=__NK_METAL[p],M=R._nkMat||(R._nkMat=new Map);h.av.traverse(o=>{if(!o.isMesh||!o.material||Array.isArray(o.material))return;const m0=o.userData._m0||(o.userData._m0=o.material);if(!m0.isMeshStandardMaterial||m0.isMeshPhysicalMaterial||m0.transparent||m0.opacity<1||m0.roughness<.1)return;const k=m0.uuid+"|"+p;let m=M.get(k);if(!m){m=m0.clone();const hx=m0.color?m0.color.getHex():8421504,L=(.299*(hx>>16&255)+.587*(hx>>8&255)+.114*(hx&255))/255,es=L<.26;m.map=null;m.roughnessMap=null;m.color&&m.color.set(es?C.e:C.c);m.metalness=es?.9:.82;m.roughness=es?.36:.24;m.envMapIntensity=es?1.1:1.5;m.needsUpdate=!0;M.set(k,m)}o.material=m})}
function __nkTrilha(R,l,n,h,A){const c=R.camRef;if(c&&Math.hypot(c.position.x-n.x,c.position.y-n.y,c.position.z-n.z)>8e3){h._tx=null;return}let T=R._trl;if(!T){if(!R.cena||!R.fx||!R.fx.tex)return;T=R._trl=new xP(R.cena,2400,!1,3,R.fx.tex)}const cp=Math.cos(n.pitch||0),fx=Math.sin(n.rumo)*cp,fy=Math.sin(n.pitch||0),fz=-Math.cos(n.rumo)*cp,x=n.x-fx*13.8,y=n.y+1.6-fy*13.8,z=n.z-fz*13.8,cor=__NK_FUMACA[l.lider>=0?(l.ala===1?1:2):0];if(h._tx==null||Math.hypot(x-h._tx,y-h._ty,z-h._tz)>400){h._tx=x,h._ty=y,h._tz=z;return}const dx=x-h._tx,dy=y-h._ty,dz=z-h._tz,d=Math.hypot(dx,dy,dz),p=3;if(d<p)return;const N=Math.min(24,Math.floor(d/p));for(let k=1;k<=N;k++){const f=k*p/d;T.emite(h._tx+dx*f,h._ty+dy*f,h._tz+dz*f,(Math.random()-.5)*.6,(Math.random()-.5)*.4,(Math.random()-.5)*.6,cor,.8,3.2,6,3,-.04,.35)}const f=N*p/d;h._tx+=dx*f,h._ty+=dy*f,h._tz+=dz*f}
function __nkFilaPasso(R,A){R._trl&&R._trl.passo(A,R.vento?R.vento.x:0,R.vento?R.vento.z:0)}
function __nmPassa(o,A,t,e){if(t.ms&&t.ms.length){const m=t.m,v=t.voando,r=t.tRec;for(let i=t.ms.length-1;i>=0;i--){t.m=t.ms[i],t.voando=1,z5(o,A,t,e),t.m||t.ms.splice(i,1)}t.m=m,t.voando=v,t.tRec=r}t.voando&&t.m&&z5(o,A,t,e)}
function __kGiro(e){if(e._kg)return e._kg;const d=Math.max(300,e.desl||e.L*e.B*e.T*.55||3e3),T=String(e.est25||e.estilo||"");let k=1+.22*Math.log10(d/3e3);k*=e.porta||e.superPA||/capitania|porta/.test(T)?1.18:/cruzador/.test(T)?1.1:/destroi/.test(T)?1.04:/corveta|patrulha|lancha/.test(T)?.9:1;return e._kg=Math.max(.8,Math.min(1.6,k))}
function __aaPasso(w,A,r){w._ac=(w._ac||0)+A*r;if(w._ac>=1)return w._ac=Math.min(1,w._ac-1),1;return 0}
function __aaLaser(R,p,w,cam){if(!R._lz){const P=R.feixes&&R.feixes[0]&&R.feixes[0].parent;if(!P)return;R._lz=[];const M=new Vt({color:"#ff2f2f",transparent:!0,opacity:.6,depthWrite:!1,blending:oa,toneMapped:!1}),G=new ZA(.05,.05,1,5,1,!0).translate(0,.5,0).rotateX(Math.PI/2);for(let k=0;k<24;k++){const x=new $(G,M);x.visible=!1,x.frustumCulled=!1,P.add(x),R._lz.push(x)}R._lzV=new F}if((R._lzN|0)>=R._lz.length)return;const g=R._lz[R._lzN|0],dx=w.tx-p.x,dy=w.ty-p.y,dz=w.tz-p.z,L=Math.hypot(dx,dy,dz)||1;R._lzN=(R._lzN|0)+1;g.visible=!0,g.position.set(p.x,p.y,p.z),g.lookAt(R._lzV.set(w.tx,w.ty,w.tz));const s=(.8+Math.min(1.4,Math.hypot(p.x-cam.x,p.z-cam.z)/1800))*(.85+.3*Math.random());g.scale.set(s,s,L)}
function __aaLaserFim(R){if(!R._lz)return;for(let k=R._lzN|0;k<R._lz.length;k++)R._lz[k].visible=!1;R._lzN=0}
function __heliPas(a){if(a.buf.heli_pas_loop||!a.ctx)return a.buf.heli_pas_loop;const o=a.ctx.sampleRate,N=Math.round(o*2),b=a.ctx.createBuffer(1,N,o),r=b.getChannelData(0),R=io(4517),B=Et("bp",380,.9,o),B2=Et("bp",900,1.2,o),Lp=Et("lp",140,.7,o),Hc=Et("bp",5200,6,o);for(let h=0;h<N;h++){const d=h/o,f=R(),fa=(d*17.5)%1,pa=Math.exp(-fa/.05)*Math.min(1,fa/.004),ft=(d*100)%1,tr=Math.exp(-ft/.18);r[h]=1.5*B(f)*pa+.55*B2(f)*pa*pa+.9*Math.sin(It*35*d)*pa+.5*Lp(f)*(.6+.4*pa)+.16*Math.sin(It*100*d)*tr+.08*Math.sin(It*200*d+.7)*tr+.05*Hc(f)}qo(r,.22);a.buf.heli_pas_loop=b;a.mixL&&a._envia(a.mixL,"heli_pas_loop",b);return b}
function __vCap(t,v){return t==="nakhimov"?Math.min(v,27.778):v}
`;
T("aux: insere auxiliares antes do zA", "const zA=Object.freeze({id:\"bombardeiroNuclear\"", AUX + "const zA=Object.freeze({id:\"bombardeiroNuclear\"");

/* ------------------------------------------------------------------ */
/* 1. Bombardeiros: fila de 3, intervalo de 4 s, rearme de 10 s        */
/* ------------------------------------------------------------------ */
T("nk: tempo de preparo das bombas seguintes (10 s após a salva)",
  "tPrep1:10,tPrepN:[22,32,42],espRaio:2800",
  "tPrep1:10,tPrepN:[10,10,10],espRaio:2800");
T("nk: alas soltam 4 s / 8 s depois do líder; líder rearma 10 s após a última",
  "(w.soltaEm=o.t+1.5*w.ala)}",
  "(w.soltaEm=o.t+__NK_FILA.intervalo*w.ala,L.tPrep=Math.max(L.tPrep||0,__NK_FILA.intervalo*w.ala+__NK_FILA.rearme))}");
T("nk: formação em fila escalonada (líder embaixo, alas acima e atrás)",
  "f5(q);q.t+=t;const fx=Math.sin(L.rumo),fz=-Math.cos(L.rumo),rx=Math.cos(L.rumo),rz=Math.sin(L.rumo),ld=q.ala===1?-1:1,atr=110*q.ala,lat=95*q.ala,sx=L.x-fx*atr+rx*lat*ld,sz=L.z-fz*atr+rz*lat*ld,sy=Math.max(150,L.y-8*q.ala),ex=sx-q.x,ey=sy-q.y,ez=sz-q.z,Lv=Math.max(120,L.v||0);let vx=(L.vx||fx*Lv)+ex*.35,vz=(L.vz||fz*Lv)+ez*.35,vy=(L.vy||0)+ey*.6;const vM=Lv+90,vh=Math.hypot(vx,vz);vh>vM&&(vx*=vM/vh,vz*=vM/vh);vy=Math.max(-60,Math.min(60,vy));let dr=yA(Math.atan2(vx,-vz)-q.rumo);dr=Math.max(-.45*t,Math.min(.45*t,dr));const w=dr/Math.max(1e-4,t);q.rumo=yA(q.rumo+dr);const v=Math.min(vM,Math.max(110,Math.hypot(vx,vz)));q.v=v;q.vx=Math.sin(q.rumo)*v;q.vz=-Math.cos(q.rumo)*v;q.vy=vy;q.x+=q.vx*t;q.y+=vy*t;q.z+=q.vz*t;q.pitch=Math.atan2(vy,v);const rl=Math.max(-1,Math.min(1,-w*2.2));q.roll=(q.roll||0)+Math.max(-.8*t,Math.min(.8*t,rl-(q.roll||0)));q.w=w;q.bank=-q.roll;q.gam=q.pitch;",
  "f5(q);q.t+=t;const fx=Math.sin(L.rumo),fz=-Math.cos(L.rumo),atr=__NK_FILA.passo*q.ala,sx=L.x-fx*atr,sz=L.z-fz*atr,sy=Math.max(150,L.y+__NK_FILA.degrau*q.ala),ex=sx-q.x,ey=sy-q.y,ez=sz-q.z,Lv=Math.max(120,L.v||0),jd=Math.hypot(ex,ey,ez),pf=jd<90,kg=jd>400?.5:1.6;let vx=(L.vx||fx*Lv)+ex*kg,vz=(L.vz||fz*Lv)+ez*kg,vy=(L.vy||0)+ey*kg;const vM=Lv+(jd>400?90:45),vh=Math.hypot(vx,vz);vh>vM&&(vx*=vM/vh,vz*=vM/vh);vy=Math.max(-60,Math.min(60,vy));let dr=yA((pf?L.rumo:Math.atan2(vx,-vz))-q.rumo);const tr=(pf?1.2:.6)*t;dr=Math.max(-tr,Math.min(tr,dr));const w=dr/Math.max(1e-4,t);q.rumo=yA(q.rumo+dr);const v=Math.max(110,Math.hypot(vx,vz));q.v=v;q.vx=vx;q.vz=vz;q.vy=vy;q.x+=vx*t;q.y+=vy*t;q.z+=vz*t;q.pitch=pf?(L.pitch||0)+(Math.atan2(vy,v)-(L.pitch||0))*.3:Math.atan2(vy,v);const rl=pf?L.roll||0:Math.max(-1,Math.min(1,-w*2.2));q.roll=(q.roll||0)+Math.max(-.9*t,Math.min(.9*t,rl-(q.roll||0)));q.w=w;q.bank=-q.roll;q.gam=q.pitch;");

/* câmera do bombardeiro: atrás do último da fila, sem ficar colada */
T("nk: câmera segue o último bombardeiro da fila",
  "const s=49,i=Math.cos(this.pitch),n=Math.sin(this.yaw)*i,c=-Math.sin(this.pitch),r=-Math.cos(this.yaw)*i,l=this._nkP||(this._nkP={x:0,y:0,z:0});this.nkPose(t,l);const h=l.x,d=l.y+6,f=l.z;",
  "const U=__nkUltimo(this.S&&this.S.sim,t);this._nkMx=(this._nkMx||0)+((U!==t?1:0)-(this._nkMx||0))*Math.min(1,A*1.2);const s=__NK_FILA.camLider+(__NK_FILA.cam-__NK_FILA.camLider)*this._nkMx,i=Math.cos(this.pitch),n=Math.sin(this.yaw)*i,c=-Math.sin(this.pitch),r=-Math.cos(this.yaw)*i,l=this._nkP||(this._nkP={x:0,y:0,z:0});this.nkPose(t,l);if(U!==t&&this._nkMx>.001){const l2=this._nkP2||(this._nkP2={x:0,y:0,z:0});this.nkPose(U,l2);const k=this._nkMx;l.x+=(l2.x-l.x)*k,l.y+=(l2.y-l.y)*k,l.z+=(l2.z-l.z)*k}const h=l.x,d=l.y+6-2*this._nkMx,f=l.z;");

/* fumaça colorida e pintura metálica */
T("nk: fumaça de jato colorida (verde/azul/amarelo) + pintura metálica",
  "l.fase>=2&&(h.tR+=A,h.tR>.06))){h.tR=0;const f=Math.cos(n.rumo),u=Math.sin(n.rumo);for(const P of[-4.3,4.3])a.fumaca.emite(n.x+f*P-u*6,n.y-1,n.z+u*P+f*6,0,0,0,\"#dfe4ea\",.28,4,5,3,0,.1)}",
  "(__nkPinta(this,l,h),l.fase>=2?__nkTrilha(this,l,n,h,A):h._tx=null,0))){}");
T("nk: avança as partículas da fumaça colorida",
  "passoAvioes(A,t,e=0){const a=this.fx,s=t.nukes;if(!s)return;",
  "passoAvioes(A,t,e=0){const a=this.fx,s=t.nukes;if(!s)return;__nkFilaPasso(this,A);");

/* motor agradável e bomba mais baixa */
T("nk: motor mais suave e grave (3 aviões sem saturar)",
  "toca(k1,tj,.34/(1+d/520),q.x,q.z,dop,d)",
  "toca(k1,tj,(q.lider>=0?.15:.21)/(1+d/600),q.x,q.z,dop*.9,Math.max(d,650))");
T("nk: assobio da bomba em queda mais baixo",
  "toca(k2,\"assobio\",(b.chute?.09:.2)/(1+d/900),b.x,b.z,dop,d)",
  "toca(k2,\"assobio\",(b.chute?.06:.13)/(1+d/900),b.x,b.z,dop,d)");

/* ------------------------------------------------------------------ */
/* 2. Míssil nuclear dos navios: próxima bomba 8 s após o lançamento   */
/* ------------------------------------------------------------------ */
T("nm: jogador pode lançar com outro míssil ainda em voo",
  "const t=$m(A);return A.morto?\"morto\":t.voando?\"noAr\":t.tRec&&o.t<t.tRec?\"recarga\":o.t<zA.liberaApos?\"cedo\":\"\"}",
  "const t=$m(A);return A.morto?\"morto\":t.voando&&A.papel!==\"jogador\"?\"noAr\":t.tRec&&o.t<t.tRec?\"recarga\":o.t<zA.liberaApos?\"cedo\":\"\"}");
T("nm: lançamento guarda o míssil anterior e marca 8 s",
  "return f4(l,i,n),a.m=l,a.voando=1,a.usadas++,",
  "return f4(l,i,n),a.voando&&a.m&&(a.ms||(a.ms=[])).push(a.m),l.k=a.kSeq=(a.kSeq||0)+1,A.papel===\"jogador\"&&(a.tRec=o.t+__NM_INTERVALO),a.m=l,a.voando=1,a.usadas++,");
T("nm: fim do voo não reinicia a recarga do jogador",
  "function uP(o,A,t,e,a){t.voando=0,t.m=null,t.tRec=o.t+zA.tRecargaPouso,a||t.perdidas++}",
  "function uP(o,A,t,e,a){t.voando=0,t.m=null,A.papel!==\"jogador\"&&(t.tRec=o.t+zA.tRecargaPouso),a||t.perdidas++}");
T("nm: avança todos os mísseis em voo",
  "e.voando&&e.m&&z5(o,t,e,A),",
  "__nmPassa(o,t,e,A),");
T("nm: desenha todos os mísseis em voo",
  "t.navios.forEach(i=>{const n=i.nm1231,c=n&&n.m;if(!i.C||!i.C.missilNuclear)return;const r=a?a(i):null;if(r&&cE(r,n.voando&&c?c.esc:0),!n||!n.voando||!c)return;s.add(i.id);const l=this._slot(i.id),h=l.g;",
  "t.navios.forEach(i=>{const n=i.nm1231;if(!i.C||!i.C.missilNuclear)return;const r=a?a(i):null;if(r&&cE(r,n&&n.voando&&n.m?n.m.esc:0),!n)return;const LM=[];n.voando&&n.m&&LM.push([n.m,i.id]);if(n.ms)for(const mm of n.ms)LM.push([mm,i.id+\"_\"+mm.k]);for(const[c,K]of LM){s.add(K);const l=this._slot(K),h=l.g;");
T("nm: fecha o laço de mísseis no renderizador",
  "l.n=Math.min(zP,l.n+1),l.pts.geometry.attributes.position.needsUpdate=!0,l.pts.geometry.setDrawRange(0,l.n))});",
  "l.n=Math.min(zP,l.n+1),l.pts.geometry.attributes.position.needsUpdate=!0,l.pts.geometry.setDrawRange(0,l.n))}});");
T("nm: HUD mostra a contagem de 8 s mesmo com míssil no ar",
  "x=T&&!T.voando&&T.tRec>(A.tSim||0)?T.tRec-(A.tSim||0):0;",
  "x=T&&T.tRec>(A.tSim||0)?T.tRec-(A.tSim||0):0;");
T("nm: HUD rótulo/anel do botão NUCLEAR",
  "this._q(\"nuke\",T&&T.voando?\"EM VOO\":x>0?Math.ceil(x)+\"s\":",
  "this._q(\"nuke\",x>0?Math.ceil(x)+\"s\":T&&T.voando&&e.papel!==\"jogador\"?\"EM VOO\":");
T("nm: anel de recarga proporcional aos 8 s",
  "this._anel(\"nuke\",x>0?x/zA.tRecargaPouso:",
  "this._anel(\"nuke\",x>0?x/(T&&e.papel===\"jogador\"?__NM_INTERVALO:zA.tRecargaPouso):");
T("nm: botão pronto mesmo com míssil anterior em voo",
  "this._cls(\"nuke\",\"pronto\",!O&&!C&&z<=0&&!x&&!(T&&T.voando))",
  "this._cls(\"nuke\",\"pronto\",!O&&!C&&z<=0&&!x&&!(T&&T.voando&&e.papel!==\"jogador\"))");

/* ------------------------------------------------------------------ */
/* 3. Navios: Nakhimov a 100 km/h, curvas suaves conforme tipo e porte */
/* ------------------------------------------------------------------ */
T("navio: Nakhimov — velocidade máxima 100 km/h (23,742 × 1,17 = 27,78 m/s)",
  "nakhimov:{L:250.1,B:28.5,T:9.1,vmax:15.95,",
  "nakhimov:{L:250.1,B:28.5,T:9.1,vmax:23.742,");
T("navio: teto de 100 km/h do Nakhimov mesmo com melhorias",
  "vmax:r.vmax*c.vmax,acel:r.acel*c.acel,",
  "vmax:__vCap(t,r.vmax*c.vmax),acel:r.acel*c.acel,");
T("navio: descrição do Nakhimov",
  "papel:\"Cruzador nuclear de 250 m: 80 UKSK",
  "papel:\"Cruzador nuclear de 250 m, 100 km/h na velocidade máxima: 80 UKSK");
T("navio: guinada com inércia conforme tipo e porte",
  "A.w+=(P-A.w)*Math.min(1,t/(h.tGiro*Math.sqrt(e.L/142))),",
  "A.w+=(P-A.w)*Math.min(1,t/(h.tGiro*Math.sqrt(e.L/142)*__kGiro(e))),");

/* ------------------------------------------------------------------ */
/* 4. Helicópteros e aviões mais agressivos                            */
/* ------------------------------------------------------------------ */
T("aéreo: armas rearmam mais rápido",
  "zh={missil:2,torpedo:3,foguete:1.5}",
  "zh={missil:1.4,torpedo:2.4,foguete:1}");
T("aéreo: combate aéreo mais agressivo",
  "a2aAlc:1400,a2aCone:.7,a2aDpsAviao:14,a2aDpsHeli:7}",
  "a2aAlc:1700,a2aCone:.75,a2aDpsAviao:18,a2aDpsHeli:9.5}");
T("aéreo: cruzeiro de ataque mais rápido",
  "if(!K1(o,e,t,a,A)){let s,i=t.H.vmax*.85,n=D0;",
  "if(!K1(o,e,t,a,A)){let s,i=t.H.vmax*.95,n=D0;");
T("aéreo: caça em patrulha ataca navios mais cedo",
  "if(a&&Math.hypot(a.x-t.x,a.z-t.z)<t.H.alc*1.15&&t.mun>0){th(o,t,e,a),Da(t,at(t.x,t.z,a.x,a.z),t.H.vmax*.9,200,A,o);continue}",
  "if(a&&Math.hypot(a.x-t.x,a.z-t.z)<t.H.alc*1.4&&t.mun>0){th(o,t,e,a),Da(t,at(t.x,t.z,a.x,a.z),t.H.vmax,200,A,o);continue}");
T("aéreo: caças caçam aeronaves de mais longe",
  "if(r&&l<2200*2200){",
  "if(r&&l<3200*3200){");
T("aéreo: ataque mais próximo do alvo",
  "d=t.H.arma===\"mg\"?h?t.H.alc*.75:3200:Math.max(900,t.H.alc*.8)",
  "d=t.H.arma===\"mg\"?h?t.H.alc*.7:2400:Math.max(700,t.H.alc*.65)");
T("aéreo: quebra mais curta depois do disparo",
  "t.mun<u&&t.H.aviao&&(t.tQuebra=5,",
  "t.mun<u&&t.H.aviao&&(t.tQuebra=3,");

/* ------------------------------------------------------------------ */
/* 5. Som: bomba, canhões, antiaérea e granadas sem estourar           */
/* ------------------------------------------------------------------ */
T("som: ganho por categoria no mixer (worklet)",
  "_voz(A,t,e,a,s,i,n,c,r,l=0){const h=A.ids[t];if(h==null)return null;",
  "_voz(A,t,e,a,s,i,n,c,r,l=0){const h=A.ids[t];if(h==null)return null;e*=__sg(t);");
T("som: ganho por categoria (pool nativo do toca)",
  "if(this._poolToca(w,r,e,m.fc<19e3?m.fc:2e4,g,this._busNo(A))){",
  "if(this._poolToca(w,r*__sg(A),e,m.fc<19e3?m.fc:2e4,g,this._busNo(A))){");
T("som: ganho por categoria (síntese do toca)",
  "const u=l.currentTime+Math.min(n,.02),P=this._rota(t,r,e);return this._fonte(A,P,u,s)",
  "const u=l.currentTime+Math.min(n,.02),P=this._rota(t,r*__sg(A),e);return this._fonte(A,P,u,s)");
T("som: ganho por categoria (banco nativo)",
  "this._poolToca(this.banco&&this.banco[A],t,e,n,s,",
  "this._poolToca(this.banco&&this.banco[A],t*__sg(A),e,n,s,");
T("som: ganho por categoria (pré-renderizados nativos)",
  "return this._poolToca(i,t*.6,e,r.fc<19e3?r.fc:2e4,1,this._busNo(A))}",
  "return this._poolToca(i,t*.6*__sg(A),e,r.fc<19e3?r.fc:2e4,1,this._busNo(A))}");
T("som: ganho por categoria (camadas sintetizadas)",
  "const d=r;let f=this._rota(t,c,e);this._camGrafo(A,s,f,d)",
  "const d=r;let f=this._rota(t,c*__sg(\"cam:\"+A),e);this._camGrafo(A,s,f,d)");
T("som: mestre com mais folga antes do limitador",
  "this.lim.threshold.value=-1.5,this.ganho.gain.value=1.35,",
  "this.lim.threshold.value=-2.5,this.ganho.gain.value=1.2,");
T("som: menos vozes simultâneas por categoria (não trava)",
  "gI={canhao:14,expl:12,agua:8,missil:10,pas:4,def:6,ui:6,outro:8,gran:8,nk:16}",
  "gI={canhao:10,expl:10,agua:6,missil:8,pas:4,def:4,ui:6,outro:7,gran:6,nk:12}");
T("som: repetição mínima do mesmo som um pouco maior",
  "if(d[f]&&h-d[f]<.045&&r<.9)return;",
  "if(d[f]&&h-d[f]<.06&&r<.9)return;");
T("som: fallback sem mixer com menos vozes",
  "if(!this.mix&&(this.vozes||0)>=24){",
  "if(!this.mix&&(this.vozes||0)>=18){");

/* antiaérea */
T("som AA: rajada do CIWS mais suave",
  "this.toca(\"ciws\",{d:A,pan:t,vol:.95}),this.camada(\"ciws\",{d:A,pan:t,vol:.7})",
  "this.toca(\"ciws\",{d:A,pan:t,vol:.62}),this.camada(\"ciws\",{d:A,pan:t,vol:.42})");
T("som AA: 30 mm mais suave",
  "this.toca(\"canhao_rapido\",{d:A,pan:t,vol:.55,rate:1.25})",
  "this.toca(\"canhao_rapido\",{d:A,pan:t,vol:.42,rate:1.22})");
T("som AA: zumbido contínuo do CIWS menos áspero",
  "h[M]=Math.tanh(D*3.2)}l.curve=h;const d=a.createBiquadFilter();d.type=\"bandpass\",d.frequency.value=1150,d.Q.value=.9;",
  "h[M]=Math.tanh(D*1.9)}l.curve=h;const d=a.createBiquadFilter();d.type=\"bandpass\",d.frequency.value=880,d.Q.value=.7;");
T("som AA: zumbido contínuo com passa-baixa",
  "u.type=\"highpass\",u.frequency.value=1800;const P=a.createGain();P.gain.value=.5;",
  "u.type=\"highpass\",u.frequency.value=1500;const P=a.createGain();P.gain.value=.36;");
T("som AA: volume do zumbido contínuo",
  "n=A&&this.ligado?Math.min(.32,.32/(1+t/380)):0;",
  "n=A&&this.ligado?Math.min(.19,.19/(1+t/380)):0;");

/* granadas: som novo, sem estourar */
T("som granada: explosão realista (estalo + baque + coluna d'água + gotas)",
  "\"gr:impacto\"(o){const A=Math.round(o*2.6),t=io(97),e=Et(\"hp\",2500,.7,o),a=Et(\"bp\",420,.6,o),s=Et(\"bp\",4200,1.5,o),i=Et(\"bp\",2600,.5,o),n=Et(\"lp\",260,.8,o),c=io(98),r=new Float32Array(A);let l=0;for(let h=0;h<A;h++){const d=h/o,f=t();let u=2.2*e(f)*Math.exp(-d/.004)+2.4*a(f)*Math.exp(-d/.16)*Math.min(1,d/.0015)+1*Math.sin(It*(70-35*Math.min(1,d/.5))*d)*Math.exp(-d/.35);l=Math.max(l*.993,d<.6&&c()*.5+.5<.002*(1-d/.6)?.5+.5*Math.abs(c()):0),u+=s(f)*l*1.4,u+=1.1*i(f)*(d>.25?Math.min(1,(d-.25)/.3)*Math.exp(-(d-.25)/.7):0),u+=1.6*n(f)*Math.exp(-d/.9),r[h]=u}return qo(r,.2)}",
  "\"gr:impacto\"(o){const A=Math.round(o*2.8),t=io(97),c=io(98),e=Et(\"hp\",1800,.7,o),a=Et(\"bp\",650,.7,o),n=Et(\"lp\",220,.7,o),n2=Et(\"lp\",110,.7,o),i=Et(\"bp\",2400,.6,o),s=Et(\"bp\",3600,1.4,o),r=new Float32Array(A);let l=0;for(let h=0;h<A;h++){const d=h/o,f=t();let u=1.3*e(f)*Math.exp(-d/.0025);u+=d<.004?1.1*Math.sin(Math.PI*d/.004):d<.009?-.55*Math.sin(Math.PI*(d-.004)/.005):0;u+=1.6*a(f)*Math.exp(-d/.07)*Math.min(1,d/.001);u+=1.1*Math.sin(It*(62-30*Math.min(1,d/.4))*d)*Math.exp(-d/.28)*Math.min(1,d/.002);u+=1.2*n(f)*Math.exp(-d/.45);u+=.9*n2(f)*Math.exp(-d/1.1)*Math.min(1,d/.05);u+=1*i(f)*(d>.14?Math.min(1,(d-.14)/.22)*Math.exp(-(d-.14)/.75):0);l=Math.max(l*.992,d>.5&&d<2.4&&c()*.5+.5<.0016*(1-(d-.5)/1.9)?.4+.6*Math.abs(c()):0);u+=.9*s(f)*l;r[h]=Math.tanh(u*.9)}return qo(r,.16)}");
T("som granada: impacto sem passar do teto",
  "return this._bancoToca(\"gr:impacto\",Math.min(1.4,a*1.15),t,A)}",
  "return this._bancoToca(\"gr:impacto\",Math.min(1,a*.9),t,A)}");
T("som granada: disparo sem passar do teto",
  "this._bancoToca(\"gr:lanc\",Math.min(1.3,a*1.1),t,A)}",
  "this._bancoToca(\"gr:lanc\",Math.min(1,a*.85),t,A)}");
T("som granada: impacto da receita RBU",
  "const r=s*n*this.modeloDist(e).g;this._bancoToca(i.slice(1),Math.min(1.4,r*1.15),a,e)",
  "const r=s*n*this.modeloDist(e).g;this._bancoToca(i.slice(1),Math.min(1,r*.9),a,e)");
T("som granada: disparo da receita de lançamento",
  "const c=a*i*this.modeloDist(t).g;this._bancoToca(s.slice(1),Math.min(1.3,c),e,t)",
  "const c=a*i*this.modeloDist(t).g;this._bancoToca(s.slice(1),Math.min(1,c*.85),e,t)");

/* helicópteros */
T("som heli: pás batendo (blade slap), rotor de cauda e turbina",
  "this.laco(A+\"r\",\"heli_rotor_loop\",i*.75,e,n,c),this.laco(A+\"t\",\"heli_turbina_loop\",i*.28,e,n*1.05,c)}",
  "this.laco(A+\"r\",\"heli_rotor_loop\",i*.62,e,n,c),this.laco(A+\"t\",\"heli_turbina_loop\",i*.24,e,n*1.05,c),__heliPas(this)&&this.laco(A+\"p\",\"heli_pas_loop\",i*.5,e,n,c)}");
T("som heli: cabine com pás abafadas",
  "if(s){this.laco(A,\"heli_turbina_loop\",i*.12,e,1.6*n,c);return}",
  "if(s){this.laco(A,\"heli_turbina_loop\",i*.12,e,1.6*n,c),__heliPas(this)&&this.laco(A+\"p\",\"heli_pas_loop\",i*.16,e,n,c||900);return}");

/* ------------------------------------------------------------------ */
/* 6. Antiaérea: fluxo de traçantes constante + raios laser finos      */
/* ------------------------------------------------------------------ */
T("AA: zera os raios laser do quadro",
  "let n=1e9,c=0;const r=(t.save&&t.save.ajustes.efDefesa)!==\"normal\";a.trReduzido=r;",
  "let n=1e9,c=0;const r=(t.save&&t.save.ajustes.efDefesa)!==\"normal\";a.trReduzido=r;this._lzN=0;");
T("AA: 30 mm com traçantes em ritmo constante + laser nos reparos ímpares",
  "if(this.local(f,g.x,g.y,g.z,i),Math.random()<.33&&(!r||(w._k=(w._k||0)+1)%5===0)){",
  "if(this.local(f,g.x,g.y,g.z,i),P%2===1&&__aaLaser(this,i,w,s),__aaPasso(w,A,r?4:16)){");
T("AA: CIWS com laser fino nos reparos ímpares",
  "const g=w.tx-i.x,p=w.ty-i.y,M=w.tz-i.z,D=Math.hypot(g,p,M)||1,T=r?",
  "P%2===1&&__aaLaser(this,i,w,s);const g=w.tx-i.x,p=w.ty-i.y,M=w.tz-i.z,D=Math.hypot(g,p,M)||1,T=r?");
T("AA: esconde raios laser sem uso",
  "t.audio.ciwsContinuo(n<2600,n,c);",
  "__aaLaserFim(this),t.audio.ciwsContinuo(n<2600,n,c);");

T("correção: navio sem LOD de armas não derruba o quadro",
  "if(n._px!==f){n._px=f,n.armasLOD.visible=f;",
  "if(n._px!==f){n._px=f,n.armasLOD&&(n.armasLOD.visible=f);");

/* ------------------------------------------------------------------ */
/* 7. Novidades / manual                                               */
/* ------------------------------------------------------------------ */
const NOVIDADES = `<section><h3>Novidades 1.2.33</h3><p class="cr-dev">Responsável pelo desenvolvimento do game: Valter Amorim</p><p><b>Bombardeiros nucleares em fila:</b> os três voam em fila com cerca de 10 m de folga entre um e outro (37 m de centro a centro): o 1º (líder) mais abaixo, o 2º 10 m acima e o 3º mais 10 m acima. A câmera fica atrás do último da fila, com a perspectiva do piloto, sem ficar colada. Motores com som mais suave e grave. <b>Lançamento:</b> o líder só lança no seu comando; o 2º lança 4 s depois e o 3º 8 s depois. As próximas bombas ficam prontas 10 s depois da última da salva. <b>Fumaça de jato</b> colorida: verde no 1º, azul no 2º e amarela no 3º. <b>Pintura metálica</b> (verde, azul e dourado) com reflexo do céu.</p><p><b>Míssil nuclear dos navios</b> (Sejong, Nanchang, Nakhimov): a próxima bomba libera 8 s depois do lançamento, mesmo com a anterior ainda em voo.</p><p><b>Som sem estourar os alto-falantes:</b> a explosão da bomba ficou um pouco mais baixa, assim como os canhões dos navios. A antiaérea ficou mais suave (CIWS e 30 mm). As granadas ganharam som realista (estalo, baque grave, coluna d'água e gotas) sem pico. O mestre tem mais folga antes do limitador, e menos vozes simultâneas evitam que o som trave o jogo.</p><p><b>Helicópteros:</b> som realista das pás batendo no ar, do rotor de cauda e da turbina. Helicópteros e aviões ficaram mais agressivos: rearmam mais rápido, atacam mais perto e caçam de mais longe.</p><p><b>Antiaérea:</b> traçantes em fluxo contínuo (sem engasgos), com a mesma potência; alguns reparos (os de número par na contagem do navio) ganharam raio laser fino de designação.</p><p><b>Navios:</b> curvas mais suaves, com inércia conforme o tipo e o porte (corvetas viram mais rápido, cruzadores e porta-aviões giram mais devagar). <b>Almirante Nakhimov</b>: 100 km/h na velocidade máxima.</p></section>
`;
T("novidades 1.2.33",
  "<section><h3>Novidades 1.2.31</h3>",
  NOVIDADES + "<section><h3>Novidades 1.2.31</h3>");

/* ------------------------------------------------------------------ */
for (const { desc, velho, novo } of trocas) {
  const n = src.split(velho).length - 1;
  if (n !== 1) {
    console.error(`FALHOU (${n} ocorrências): ${desc}`);
    process.exit(2);
  }
  src = src.replace(velho, () => novo);
  console.log("ok  " + desc);
}
fs.writeFileSync(SAI, src);
console.log(`\n${trocas.length} trocas aplicadas → ${SAI}`);
