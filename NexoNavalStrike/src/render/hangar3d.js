// v1.2.61 — HANGAR 3D INTERATIVO (menu): galpão militar com iluminação PBR (ambiente refletido), piso de concreto com poças e marcas de pneu,
// porta aberta para o mar, empilhadeiras, jipe, caixas de munição, aeronaves de fundo, luzes de advertência e TRIPULAÇÃO andando
// (1 InstancedMesh = 1 chamada de desenho para todos). Usa o MESMO renderizador do jogo (sem 2º contexto WebGL no celular).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { modeloHeli } from './aereo3d.js';
import { montaHidro3D, camoHidro3D } from './hidro3d.js';
import { HIDROS } from '../sim/hidroaviao.js';

const W0 = 150, D0 = 110, H0 = 30; /* galpão: largura (x), profundidade (z), altura */
function texPiso() { const N = 1024, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); x.fillStyle = '#7b8086'; x.fillRect(0, 0, N, N);
  for (let i = 0; i < 26000; i++) { const v = 100 + Math.random() * 60 | 0; x.fillStyle = `rgba(${v},${v + 2},${v + 5},0.16)`; x.fillRect(Math.random() * N, Math.random() * N, 1 + Math.random() * 3, 1 + Math.random() * 3); }
  x.strokeStyle = 'rgba(35,38,42,0.45)'; x.lineWidth = 2; for (let k = 0; k <= N; k += 128) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, N); x.stroke(); x.beginPath(); x.moveTo(0, k); x.lineTo(N, k); x.stroke(); } /* juntas */
  x.strokeStyle = 'rgba(20,20,22,0.22)'; x.lineWidth = 9; for (let i = 0; i < 14; i++) { x.beginPath(); const cx = Math.random() * N, cy = Math.random() * N, r = 200 + Math.random() * 500, a = Math.random() * 6.28; x.arc(cx, cy, r, a, a + 0.6 + Math.random()); x.stroke(); } /* marcas de pneu */
  x.strokeStyle = '#d9a91f'; x.lineWidth = 10; x.setLineDash([]); x.beginPath(); x.moveTo(N * 0.5, N); x.lineTo(N * 0.5, N * 0.62); x.stroke(); x.strokeRect(N * 0.2, N * 0.18, N * 0.6, N * 0.44); /* faixas amarelas: vaga central e guia */
  x.setLineDash([40, 30]); x.lineWidth = 6; x.strokeRect(N * 0.06, N * 0.08, N * 0.88, N * 0.84); x.setLineDash([]);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = globalThis.__nnsAniso || 8; return t; }
function texRugosidade() { const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); x.fillStyle = '#c8c8c8'; x.fillRect(0, 0, N, N);
  for (let i = 0; i < 16; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); const px = Math.random() * N, py = Math.random() * N, r = 10 + Math.random() * 30; const gr = x.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, '#202020'); gr.addColorStop(0.7, '#383838'); gr.addColorStop(1, 'rgba(200,200,200,0)'); x.fillStyle = gr; x.beginPath(); x.ellipse(px, py, r * 1.6, r, Math.random() * 3, 0, 6.28); x.fill(); void g; } /* POÇAS: rugosidade baixa = reflexo espelhado */
  const t = new THREE.CanvasTexture(c); return t; }
function texParede() { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); for (let i = 0; i < 256; i += 8) { const v = i % 16 ? 74 : 88; x.fillStyle = `rgb(${v},${v + 4},${v + 10})`; x.fillRect(i, 0, 8, 256); } /* chapa ondulada */
  x.fillStyle = 'rgba(30,30,28,0.25)'; for (let i = 0; i < 60; i++) x.fillRect(Math.random() * 256, 180 + Math.random() * 76, 2, 20); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 2); t.colorSpace = THREE.SRGBColorSpace; return t; }
function texVista() { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#9fb6c9'); g.addColorStop(0.55, '#d3dde4'); g.addColorStop(0.56, '#5d7f94'); g.addColorStop(1, '#2c4c60'); x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  x.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 90; i++) x.fillRect(Math.random() * 512, 150 + Math.random() * 100, 8 + Math.random() * 30, 1); /* reflexos no mar */
  x.fillStyle = '#6d7680'; x.fillRect(300, 118, 170, 24); x.fillRect(420, 96, 20, 24); x.fillRect(426, 82, 6, 16); /* porta-aviões ao longe */ const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
let _ts = null; function texSombra() { if (_ts) return _ts; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.45, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); _ts = new THREE.CanvasTexture(c); return _ts; }
const S = (c, r = 0.7, m = 0.1) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

/** Figura humana simples (pernas, tronco, braços, cabeça, boné) com cores por vértice → 1 geometria instanciada. */
function geoPessoa() { const pc = (g, cor) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), C = new THREE.Color(cor); for (let i = 0; i < n; i++) { a[i * 3] = C.r; a[i * 3 + 1] = C.g; a[i * 3 + 2] = C.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; };
  const K = (r, h, x, y, z, cor, rx = 0) => pc(new THREE.CapsuleGeometry(r, h, 4, 10).rotateX(rx).translate(x, y, z), cor); /* cápsulas: membros arredondados (sem cara de bloco) */
  const P = [K(0.085, 0.72, -0.1, 0.5, 0, '#4a5340'), K(0.085, 0.72, 0.1, 0.5, 0, '#4a5340'), K(0.2, 0.32, 0, 1.17, 0, '#5a6448'), pc(new THREE.BoxGeometry(0.42, 0.34, 0.27).translate(0, 1.22, 0.005), '#c9a227') /* colete refletivo de pátio */,
    K(0.06, 0.5, -0.27, 1.13, 0.02, '#5a6448'), K(0.06, 0.5, 0.27, 1.13, 0.02, '#5a6448'), pc(new THREE.SphereGeometry(0.05, 8, 6).translate(-0.27, 0.82, 0.03), '#b98c6c'), pc(new THREE.SphereGeometry(0.05, 8, 6).translate(0.27, 0.82, 0.03), '#b98c6c'),
    pc(new THREE.CylinderGeometry(0.055, 0.065, 0.1, 10).translate(0, 1.5, 0), '#b98c6c'), pc(new THREE.SphereGeometry(0.115, 14, 12).scale(0.95, 1.1, 1).translate(0, 1.64, 0), '#c49a7a'),
    pc(new THREE.SphereGeometry(0.125, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55).translate(0, 1.67, 0), '#2f3a2a'), pc(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 12, 1, false, -Math.PI * 0.5, Math.PI).translate(0, 1.66, 0.06), '#2f3a2a') /* boné com aba */,
    pc(new THREE.CapsuleGeometry(0.075, 0.16, 3, 8).rotateX(Math.PI / 2).translate(-0.1, 0.07, 0.05), '#1b1b1b'), pc(new THREE.CapsuleGeometry(0.075, 0.16, 3, 8).rotateX(Math.PI / 2).translate(0.1, 0.07, 0.05), '#1b1b1b')];
  return mergeGeometries(P); }
function empilhadeira() { const g = new THREE.Group(); const lar = S('#e08a1e', 0.45, 0.2), pr = S('#1d2024', 0.6, 0.5), pn = S('#141618', 0.9, 0);
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(1.4, 0.9, 2.4), lar, 0, 0.75, 0); add(new THREE.BoxGeometry(1.3, 0.9, 0.9), pr, 0, 0.65, 1.2); for (const [x, z] of [[-0.7, 0.8], [0.7, 0.8], [-0.7, -0.8], [0.7, -0.8]]) add(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 14).rotateZ(Math.PI / 2), pn, x, 0.36, z);
  for (const x of [-0.6, 0.6]) { add(new THREE.BoxGeometry(0.07, 2.1, 0.07), pr, x, 2.0, 0.6); add(new THREE.BoxGeometry(0.07, 2.1, 0.07), pr, x, 2.0, -0.7); } add(new THREE.BoxGeometry(1.3, 0.07, 1.4), pr, 0, 3.05, -0.05); /* gaiola */
  add(new THREE.BoxGeometry(0.12, 2.6, 0.12), pr, -0.45, 1.4, -1.35); add(new THREE.BoxGeometry(0.12, 2.6, 0.12), pr, 0.45, 1.4, -1.35); for (const x of [-0.35, 0.35]) add(new THREE.BoxGeometry(0.12, 0.06, 1.3), pr, x, 0.2, -2.0); add(new THREE.BoxGeometry(1.1, 0.4, 0.06), lar, 0, 0.6, -1.36);
  add(new THREE.BoxGeometry(1.2, 0.6, 1.0), S('#3f4a33', 0.8, 0), 0, 0.55, -2.0); /* caixa de munição nos garfos */ return g; }
function jipe() { const g = new THREE.Group(); const v = S('#4b5636', 0.75, 0.15), pn = S('#141618', 0.9, 0); const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(1.9, 0.7, 3.8), v, 0, 0.95, 0); add(new THREE.BoxGeometry(1.8, 0.5, 1.2), v, 0, 1.5, 0.3); add(new THREE.BoxGeometry(1.85, 0.06, 0.06), pn, 0, 1.9, -0.4); for (const [x, z] of [[-0.95, 1.2], [0.95, 1.2], [-0.95, -1.2], [0.95, -1.2]]) add(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 14).rotateZ(Math.PI / 2), pn, x, 0.42, z); add(new THREE.CylinderGeometry(0.4, 0.4, 0.25, 12).rotateX(Math.PI / 2), pn, 0, 1.0, 2.05); return g; }

export class Hangar3D {
  constructor(R) { this.R = R; this.ativo = false; this.cena = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(40, 1, 0.3, 900); this.ang = 0.75; this.elev = 0.3; this.dist = 30; this.alvoDist = 30; this.auto = true; this.tAuto = 0; this.t = 0; this.alvoY = 2; this._monta(); }
  _monta() { const C = this.cena, R = this.R; try { const pm = new THREE.PMREMGenerator(R); C.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); } catch (e) { /* sem PMREM: segue só com luzes */ }
    C.background = new THREE.Color('#161b21'); C.fog = new THREE.Fog('#1c2228', 80, 260);
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(W0, D0).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: texPiso(), roughnessMap: texRugosidade(), roughness: 0.92, metalness: 0.05, envMapIntensity: 0.45, color: '#9aa0a6' })); piso.receiveShadow = true; C.add(piso);
    const mp = new THREE.MeshStandardMaterial({ map: texParede(), roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide });
    const parede = (w, h, x, y, z, ry) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mp); o.position.set(x, y, z); o.rotation.y = ry; C.add(o); };
    parede(D0, H0, -W0 / 2, H0 / 2, 0, Math.PI / 2); parede(D0, H0, W0 / 2, H0 / 2, 0, -Math.PI / 2); parede(W0, H0, 0, H0 / 2, D0 / 2, Math.PI);
    const PW = 74, PH = 21; parede((W0 - PW) / 2, H0, -(PW + (W0 - PW) / 2) / 2, H0 / 2, -D0 / 2, 0); parede((W0 - PW) / 2, H0, (PW + (W0 - PW) / 2) / 2, H0 / 2, -D0 / 2, 0); parede(PW, H0 - PH, 0, PH + (H0 - PH) / 2, -D0 / 2, 0); /* porta aberta para o mar */
    const vista = new THREE.Mesh(new THREE.PlaneGeometry(PW * 3, PH * 3), new THREE.MeshBasicMaterial({ map: texVista(), fog: false })); vista.position.set(0, PH * 1.1, -D0 / 2 - 60); C.add(vista);
    const pa = new THREE.Mesh(new THREE.PlaneGeometry(PW + 6, 30).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#8d939a', roughness: 0.85 })); pa.position.set(0, -0.02, -D0 / 2 - 15); C.add(pa); /* pátio do lado de fora */
    const teto = new THREE.Mesh(new THREE.PlaneGeometry(W0, D0).rotateX(Math.PI / 2), S('#2b3036', 0.8, 0.3)); teto.position.y = H0; C.add(teto);
    { const T = []; for (let z = -D0 / 2 + 6; z < D0 / 2; z += 11) { T.push(new THREE.BoxGeometry(W0, 0.5, 0.5).translate(0, H0 - 1.5, z)); T.push(new THREE.BoxGeometry(W0, 0.3, 0.3).translate(0, H0 - 4.5, z)); for (let x = -W0 / 2 + 8; x < W0 / 2; x += 9) T.push(new THREE.BoxGeometry(0.25, 3.4, 0.25).translate(x, H0 - 3, z).rotateZ(0)); }
      const tr = new THREE.Mesh(mergeGeometries(T), S('#3b424b', 0.5, 0.6)); C.add(tr); } /* treliças do telhado */
    { const L = []; for (let z = -D0 / 2 + 12; z < D0 / 2; z += 22) for (const x of [-36, 0, 36]) L.push(new THREE.BoxGeometry(10, 0.2, 2).translate(x, H0 - 5, z)); const lm = new THREE.Mesh(mergeGeometries(L), new THREE.MeshBasicMaterial({ color: '#fff4dc' })); C.add(lm); } /* luminárias */
    C.add(new THREE.HemisphereLight('#b8c8da', '#2a2924', 0.32)); C.environmentIntensity = 0.55; /* r163+: reflexos do ambiente menos lavados — contraste de galpão real */
    const sol = new THREE.DirectionalLight('#ffe9cf', 2.6); sol.position.set(-30, 40, -90); sol.castShadow = true; sol.shadow.mapSize.set(1024, 1024); Object.assign(sol.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 10, far: 220 }); sol.shadow.bias = -0.0005; C.add(sol); C.add(sol.target); this.sol = sol; /* luz do dia entrando pela porta */
    for (const [x, z] of [[-30, 10], [30, 10], [0, 30]]) { const sp = new THREE.SpotLight('#ffe6c0', 150, 80, 0.85, 1.0, 1.4) /* penumbra total: sem anel duro no piso */; sp.position.set(x, H0 - 5.5, z); sp.target.position.set(x * 0.5, 0, z * 0.4); C.add(sp); C.add(sp.target); }
    const mats = { caixa: S('#3f4a33', 0.8, 0.05), barril: S('#2f3b2c', 0.5, 0.4) };
    { const G = []; for (let i = 0; i < 22; i++) { const b = new THREE.BoxGeometry(2.2, 1.1, 1.2); const x = 46 + (i % 3) * 2.4, z = -18 + Math.floor(i / 6) * 3.6, y = 0.55 + (Math.floor(i / 3) % 2) * 1.1; b.translate(x, y, z); G.push(b); } for (let i = 0; i < 12; i++) { const b = new THREE.BoxGeometry(1.8, 1.2, 2.4); b.translate(-58 + (i % 4) * 2.1, 0.6 + Math.floor(i / 8) * 1.2, 24 + Math.floor(i / 4) % 2 * 2.6); G.push(b); }
      const cx = new THREE.Mesh(mergeGeometries(G), mats.caixa); cx.castShadow = cx.receiveShadow = true; C.add(cx);
      const B = []; for (let i = 0; i < 9; i++) B.push(new THREE.CylinderGeometry(0.42, 0.42, 1.25, 12).translate(-66 + (i % 3) * 0.95, 0.63, -14 + Math.floor(i / 3) * 0.95)); const br = new THREE.Mesh(mergeGeometries(B), mats.barril); br.castShadow = true; C.add(br); }
    const e1 = empilhadeira(); e1.position.set(-44, 0, 14); e1.rotation.y = 0.6; C.add(e1); const e2 = empilhadeira(); e2.position.set(-50, 0, 6); e2.rotation.y = 1.1; C.add(e2); this.empilha = e2;
    const j = jipe(); j.position.set(-36, 0, -16); j.rotation.y = -0.4; C.add(j);
    try { const h1 = modeloHeli('tufao'); h1.position.set(46, 0, 32); h1.rotation.y = -2.4; h1.traverse((o) => { if (o.name === 'disco') o.visible = false; if (o.isMesh) o.castShadow = true; }); C.add(h1); this.fundo1 = h1;
      const h2 = modeloHeli('beijaflor'); h2.position.set(60, 0, 8); h2.rotation.y = -2.0; h2.traverse((o) => { if (o.name === 'disco') o.visible = false; if (o.isMesh) o.castShadow = true; }); C.add(h2);
      const hd = montaHidro3D(HIDROS.albatroz); hd.position.set(-50, 0, -34); hd.rotation.y = 0.9; hd.traverse((o) => { if (o.isMesh) o.castShadow = true; }); C.add(hd); } catch (e) { /* decoração opcional */ }
    this.luzesAv = []; for (const [x, z] of [[-W0 / 2 + 1, -10], [W0 / 2 - 1, -10], [-PW / 2, -D0 / 2 + 0.5], [PW / 2, -D0 / 2 + 0.5]]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff3b2f' })); l.position.set(x, PH + 1, z); C.add(l); this.luzesAv.push(l); } /* luzes de advertência piscando */
    /* TRIPULAÇÃO: mecânicos andando em rotas e alguns parados conversando */
    const NG = 14; this.gente = new THREE.InstancedMesh(geoPessoa(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), NG); this.gente.castShadow = true; C.add(this.gente);
    this.rotas = []; for (let i = 0; i < NG; i++) { const anda = i < 8; this.rotas.push({ anda, cx: (i % 4 - 1.5) * 22 + (anda ? 0 : 6), cz: (Math.floor(i / 4) - 1.5) * 18, r: anda ? 8 + (i % 3) * 5 : 0, v: (anda ? 0.11 + 0.03 * (i % 3) : 0) * (i % 2 ? 1 : -1), fase: i * 1.7, ry: i * 0.9 }); }
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(1, 1, 1); this._e = new THREE.Euler(); }
  /** Coloca a aeronave escolhida no centro (escala real), apoiada no piso, com sombras. */
  mostra(item, camo) { if (this.modelo) { this.cena.remove(this.modelo); this.modelo = null; } if (!item) return; let m;
    try { m = item.modelo.hidro ? camoHidro3D(montaHidro3D(HIDROS[item.modelo.hidro]), camo) : modeloHeli(item.modelo.heli, camo); } catch (e) { return; } /* v1.2.69: com a camuflagem escolhida */
    m.traverse((o) => { if (o.name === 'disco') o.visible = false; if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); m.updateMatrixWorld(true); const bx = new THREE.Box3(); m.traverse((o) => { if (o.isMesh && o.visible && o.name !== 'disco' && o.geometry) { let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) { vis = false; break; } if (vis) { o.geometry.computeBoundingBox(); bx.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } } }); if (bx.isEmpty()) bx.setFromObject(m); /* só malhas visíveis (peças ocultas não inflam o enquadramento) */ const sz = bx.getSize(new THREE.Vector3()), ct = bx.getCenter(new THREE.Vector3());
    m.position.set(-ct.x, -bx.min.y + 0.02, -ct.z); const g = new THREE.Group(); g.add(m); { /* sombra de contato (oclusão sob a fuselagem) — vale também com sombras dinâmicas desligadas na qualidade baixa */ const so = new THREE.Mesh(new THREE.PlaneGeometry(sz.x * 1.25, sz.z * 1.25).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: texSombra(), transparent: true, depthWrite: false, opacity: 0.62, color: '#000' })); so.position.y = 0.03; so.renderOrder = 1; g.add(so); } g.rotation.y = Math.PI * 0.85; this.cena.add(g); this.modelo = g; const tam = Math.max(sz.x, sz.z, sz.y * 2);
    this.alvoDist = Math.min(46, tam * 1.25 + 6); this.alvoY = Math.min(4, sz.y * 0.45); this.tam = tam; this.id = item.id; }
  arrasta(dx, dy) { this.ang -= dx * 0.006; this.elev = Math.max(0.04, Math.min(1.1, this.elev + dy * 0.004)); this.tAuto = 4; }
  zoom(f) { this.alvoDist = Math.max((this.tam || 10) * 0.6 + 4, Math.min((this.tam || 10) * 3 + 20, this.alvoDist * f)); this.tAuto = 4; }
  redimensiona(W, H) { this.cam.aspect = W / Math.max(1, H); this.cam.updateProjectionMatrix(); }
  passo(dt) { this.t += dt; if (this.tAuto > 0) this.tAuto -= dt; else if (this.auto) this.ang += dt * 0.16;
    this.dist += (this.alvoDist - this.dist) * Math.min(1, dt * 3.5); const c = this.cam, ce = Math.cos(this.elev); c.position.set(Math.sin(this.ang) * ce * this.dist, 1.6 + Math.sin(this.elev) * this.dist, Math.cos(this.ang) * ce * this.dist); c.lookAt(0, this.alvoY, 0);
    const M = this._m, Q = this._q, P = this._p, E = this._e; for (let i = 0; i < this.rotas.length; i++) { const r = this.rotas[i]; let x, z, ry, y = 0;
      if (r.anda) { const a = r.fase + this.t * r.v; x = r.cx + Math.cos(a) * r.r; z = r.cz + Math.sin(a) * r.r; ry = -a + (r.v > 0 ? 0 : Math.PI); y = Math.abs(Math.sin(this.t * 7 + i)) * 0.05; } else { x = r.cx; z = r.cz; ry = r.ry + Math.sin(this.t * 0.6 + i) * 0.25; }
      if (Math.hypot(x, z) < (this.tam || 12) * 0.62) { const k = (this.tam || 12) * 0.62 / Math.max(0.1, Math.hypot(x, z)); x *= k; z *= k; } /* ninguém atravessa a aeronave em exibição */
      P.set(x, y, z); Q.setFromEuler(E.set(0, ry, 0)); M.compose(P, Q, this._s); this.gente.setMatrixAt(i, M); } this.gente.instanceMatrix.needsUpdate = true;
    const pisca = (this.t % 1.2) < 0.18; for (const l of this.luzesAv) l.visible = pisca;
    if (this.empilha) { this.empilha.position.x = -50 + Math.sin(this.t * 0.25) * 6; this.empilha.rotation.y = 1.1 + Math.cos(this.t * 0.25) * 0.3; }
    this.R.render(this.cena, this.cam); }
  /** Miniatura (data URL) da aeronave para a lista lateral — renderizada uma vez, fora da tela. */
  miniatura(item, w = 220, h = 130) { const salva = { m: this.modelo, id: this.id, ang: this.ang, el: this.elev, d: this.dist, ad: this.alvoDist, y: this.alvoY, t: this.tam }; this.mostra(item);
    const rt = this._rt || (this._rt = new THREE.WebGLRenderTarget(w, h, { colorSpace: THREE.SRGBColorSpace })); const c = this.cam, asp = c.aspect; c.aspect = w / h; c.updateProjectionMatrix();
    const ce = Math.cos(0.42), d = Math.min(44, this.alvoDist * 0.78); c.position.set(Math.sin(0.8) * ce * d, 1.6 + Math.sin(0.42) * d, Math.cos(0.8) * ce * d); c.lookAt(0, this.alvoY, 0); for (const l of this.luzesAv) l.visible = false; if (this.gente) this.gente.visible = false;
    this.R.setRenderTarget(rt); this.R.render(this.cena, c); const px = new Uint8Array(w * h * 4); this.R.readRenderTargetPixels(rt, 0, 0, w, h, px); this.R.setRenderTarget(null); if (this.gente) this.gente.visible = true;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ctx = cv.getContext('2d'), im = ctx.createImageData(w, h); for (let y = 0; y < h; y++) im.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4); ctx.putImageData(im, 0, 0);
    c.aspect = asp; c.updateProjectionMatrix(); if (this.modelo) this.cena.remove(this.modelo); this.modelo = salva.m; if (salva.m) this.cena.add(salva.m); Object.assign(this, { id: salva.id, ang: salva.ang, elev: salva.el, dist: salva.d, alvoDist: salva.ad, alvoY: salva.y, tam: salva.t }); return cv.toDataURL('image/jpeg', 0.82); }
}
