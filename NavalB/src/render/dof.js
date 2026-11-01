// v1.2.17 itens 3/4: PROFUNDIDADE DE CAMPO (DOF) de lente fina para o menu/estaleiro e o MODO CINEMA.
// Caminho sem custo de programas por partida: a cena é desenhada NORMALMENTE na tela (mesmos programas, tom e espaço de cor do jogo),
// a cor é copiada para uma textura (copyFramebufferToTexture), a PROFUNDIDADE vem de uma passada em meia resolução com um único
// MeshDepthMaterial (override; transparentes/partículas ficam fora para não "solidificar" fumaça) e um quad aplica o desfoque por
// círculo de confusão físico c = A·|z − S| / z (S = distância de foco, A = abertura), coleta em espiral áurea (28 amostras) com peso por
// CoC da amostra (o nítido não vaza no desfocado) e leve realce de bokeh nos pontos brilhantes. Tudo criado UMA vez; nada alocado por quadro.
import * as THREE from 'three';
const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const FS = `#include <packing>
uniform sampler2D tCor; uniform sampler2D tProf; uniform float foco; uniform float zona; uniform float ab; uniform float maxR; uniform vec2 px; uniform float near; uniform float far; varying vec2 vUv;
float zv(vec2 uv){ float d = unpackRGBAToDepth(texture2D(tProf, uv)); return -perspectiveDepthToViewZ(d, near, far); }
float coc(float z){ return clamp(ab * max(abs(z - foco) - zona, 0.0) / max(z, 0.1) * maxR, 0.0, maxR); } /* zona = profundidade nítida aceitável em torno do foco (m) */
void main(){ float z0 = zv(vUv); float c0 = coc(z0); vec3 base = texture2D(tCor, vUv).rgb; if (c0 < 0.5) { gl_FragColor = vec4(base, 1.0); return; }
  vec3 soma = base; float ps = 1.0; const float GA = 2.39996323;
  for (int i = 1; i < 28; i++) { float fi = float(i); float r = sqrt(fi / 27.0) * c0; float a = fi * GA; vec2 o = vec2(cos(a), sin(a)) * r * px; vec2 uv = vUv + o;
    float zi = zv(uv); float ci = coc(zi); float w = zi < z0 ? clamp(ci - r + 1.0, 0.0, 1.0) : clamp(min(ci, c0) - r + 1.0, 0.0, 1.0); /* frente desfocada cobre; fundo só entra se ele próprio estiver desfocado */
    vec3 cs = texture2D(tCor, uv).rgb; float l = dot(cs, vec3(0.299, 0.587, 0.114)); w *= 1.0 + 1.5 * max(l - 0.82, 0.0); soma += cs * w; ps += w; }
  gl_FragColor = vec4(soma / ps, 1.0); }`;
export class Dof {
  constructor(R) { this.R = R; this.w = 0; this.h = 0; this.tex = null; this.rt = null; this.trans = []; this.vis = []; this._nObj = -1; this._tLista = 0; this._cc = new THREE.Color();
    this.depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    this.mat = new THREE.ShaderMaterial({ uniforms: { tCor: { value: null }, tProf: { value: null }, foco: { value: 60 }, zona: { value: 0 }, ab: { value: 0.6 }, maxR: { value: 8 }, px: { value: new THREE.Vector2(1, 1) }, near: { value: 1 }, far: { value: 1000 } }, vertexShader: VS, fragmentShader: FS, depthTest: false, depthWrite: false, toneMapped: false });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat); this.quad.frustumCulled = false; this.cq = new THREE.Scene(); this.cq.add(this.quad); this.camQ = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); this._v = new THREE.Vector2(); }
  _ajusta() { const v = this.R.getDrawingBufferSize(this._v); if (v.x === this.w && v.y === this.h && this.tex) return; this.w = v.x; this.h = v.y;
    if (this.tex) this.tex.dispose(); if (this.rt) this.rt.dispose(); this.tex = new THREE.FramebufferTexture(this.w, this.h); this.tex.minFilter = this.tex.magFilter = THREE.LinearFilter;
    this.rt = new THREE.WebGLRenderTarget(Math.max(1, this.w >> 1), Math.max(1, this.h >> 1), { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    this.mat.uniforms.tCor.value = this.tex; this.mat.uniforms.tProf.value = this.rt.texture; this.mat.uniforms.px.value.set(1 / this.w, 1 / this.h); }
  _lista(cena, t) { /* objetos transparentes/partículas (fora da passada de profundidade); refeita só quando a cena muda de tamanho ou a cada 1,5 s — sem alocação */
    if (this._nObj === cena.children.length && t - this._tLista < 1.5) return; this._nObj = cena.children.length; this._tLista = t; const L = this.trans; L.length = 0;
    cena.traverse((o) => { const m = o.material; if (o.isPoints || o.isSprite || o.isLine || (m && (Array.isArray(m) ? m.some((q) => q.transparent) : m.transparent || m.depthWrite === false))) L.push(o); }); }
  /** Desenha a cena com DOF. foco (m) = distância ao assunto; ab = abertura (0 = sem desfoque); maxR em px de tela (escala com a resolução). */
  render(cena, cam, foco, ab = 0.6, maxR = 8, t = 0, zona = 0) { const R = this.R; R.render(cena, cam); if (!(ab > 0)) return; this._ajusta(); R.copyFramebufferToTexture(this.tex);
    this._lista(cena, t); const L = this.trans, V = this.vis; for (let i = 0; i < L.length; i++) { V[i] = L[i].visible; L[i].visible = false; }
    const ov = cena.overrideMaterial, bg = cena.background, au = R.shadowMap.autoUpdate, ac = R.getClearAlpha(); R.getClearColor(this._cc);
    cena.overrideMaterial = this.depthMat; cena.background = null; R.shadowMap.autoUpdate = false; R.setClearColor(0xffffff, 1); R.setRenderTarget(this.rt); R.clear(); R.render(cena, cam); R.setRenderTarget(null);
    cena.overrideMaterial = ov; cena.background = bg; R.shadowMap.autoUpdate = au; R.setClearColor(this._cc, ac); for (let i = 0; i < L.length; i++) L[i].visible = V[i];
    const u = this.mat.uniforms; u.foco.value = Math.max(0.5, foco); u.zona.value = zona; u.ab.value = ab; u.maxR.value = maxR * (this.h / 720); u.near.value = cam.near; u.far.value = cam.far; const ac2 = R.autoClear; R.autoClear = false; R.render(this.cq, this.camQ); R.autoClear = ac2; }
  /** Compila os programas do DOF antecipadamente (carregamento) — 0 programas novos ao entrar no cinema durante a partida. */
  aquece(cena, cam) { const R = this.R; this._ajusta(); const ov = cena.overrideMaterial, bg = cena.background; cena.overrideMaterial = this.depthMat; cena.background = null; R.setRenderTarget(this.rt); R.render(cena, cam); R.setRenderTarget(null); cena.overrideMaterial = ov; cena.background = bg; R.compile(this.cq, this.camQ); } /* render (não compile): o override só vale no render */
}
