// v1.2.0 — CAMUFLAGENS PROCEDURAIS no shader (sem textura pintada): o padrão é calculado por pixel a partir da posição
// LOCAL do casco/superestrutura (fragmentado, dazzle, digital, manchas costeiras, metálico com friso dourado…), sobre um
// mapa de sujeira/escorrimento. Também as BANDEIRAS nacionais (desenhadas em canvas, domínio público).
import * as THREE from 'three';
import { PINTURAS } from '../navalTechTreeEconomy.js';
import { texPintura } from './textures.js';
import { desenhaBandeira } from './bandeiras.js';
import { texNacional } from './camoNacional.js';

const GLSL = /* glsl */`
uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform float uTipo; uniform float uEsc; uniform float uT; uniform vec2 uDesg;
varying vec3 vPosL; varying vec3 vNorL;
float h21(vec2 p);
vec3 neon(vec3 p);
vec3 lendFx(vec3 p);
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1,0)), u.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), u.x), u.y); }
float fbm2(vec2 p){ float a = 0.0, m = 0.5; for (int i = 0; i < 4; i++) { a += m * vn(p); p *= 2.03; m *= 0.5; } return a; }
#ifdef NAC
uniform sampler2D uNacTex; uniform float uVar; uniform float uParte; uniform float uBordo;
vec3 sr(vec3 c){ return pow(c, vec3(2.2)); }
vec4 gMot = vec4(0.0); float gLun = 0.0;
vec4 motivo(vec3 p, float cel, float hb, float hh, float vel, float voo){ // v1.2.19 item 12: bicho do atlas no costado, voltado para a proa, animado só por uT
  float per = hh * 2.5, zz = (p.z + uT * vel) / per, k = floor(zz), u = fract(zz) * 1.25 - 0.125; float ph = fract(uT * (voo > 0.5 ? 0.45 : 0.3) + h21(vec2(k, 2.0)));
  float lun = voo > 0.5 ? 0.5 + 0.5 * sin(uT * 2.4 + k * 1.7) : smoothstep(0.05, 0.3, ph) * (1.0 - smoothstep(0.42, 0.95, ph)); gLun = lun;
  u = voo > 0.5 ? u : (u - 0.5) / (1.0 + 0.12 * lun) + 0.5 + 0.07 * lun; // bote: estica e avança para a proa
  float l = (p.y - hb - (voo > 0.5 ? 0.25 * hh * sin(uT * 1.2 + k) * 0.3 : hh * 0.14 * sin(3.1416 * clamp((ph - 0.05) / 0.6, 0.0, 1.0)))) / hh;
  if (voo > 0.5) l = (l - 0.5) / (0.86 + 0.14 * lun) + 0.5; // bater de asas
  if (u < 0.02 || u > 0.98 || l < 0.0 || l > 1.0) return vec4(0.0);
  vec2 uv = vec2((mod(cel, 3.0) + u) / 3.0, (1.0 - floor(cel / 3.0)) * 0.5 + l * 0.5), gc = vec2(zz * 1.25 / 3.0, p.y / hh * 0.5);
  return textureGrad(uNacTex, uv, dFdx(gc), dFdy(gc)); }
float estrela(vec2 a, float dens, float r){ vec2 c = floor(a), f = fract(a) - 0.5; if (h21(c) < 1.0 - dens) return 0.0; float an = atan(f.y, f.x), rr = r * (0.55 + 0.45 * pow(abs(cos(an * 2.5)), 3.0)); return 1.0 - smoothstep(rr - 0.04, rr + 0.04, length(f)); } // estrela de 5 pontas pequena
vec3 nacBase(vec3 p, vec2 q){ int v = int(uVar + 0.5); float n = fbm2(q * 0.05); vec3 c; float hb = 1.2, hh = max(2.6, uBordo - 1.45); // o bicho ocupa o costado da faixa d’água até a borda
  float lado = 1.0 - smoothstep(0.55, 0.85, abs(vNorL.y));
  if (v == 1) { // BRASIL: verde no casco, faixa amarela ondulada, superestrutura azul com estrelas brancas
    c = mix(sr(vec3(0.02, 0.45, 0.22)), sr(vec3(0.0, 0.36, 0.17)), n); float on = 1.08 + 0.08 * sin(p.z * 0.09 - uT * 0.7); if (abs(p.y - on) < 0.16) c = sr(vec3(1.0, 0.82, 0.0));
    if (uParte < 0.5) { c = mix(sr(vec3(0.0, 0.17, 0.46)), sr(vec3(0.05, 0.24, 0.55)), n); c = mix(c, vec3(0.95), estrela(vec2(p.z, p.y) * 0.7, 0.05, 0.3)); }
    gMot = uParte > 0.5 ? motivo(p, 0.0, hb, hh, 2.2, 0.0) * lado : vec4(0.0); }
  else if (v == 2) { // EUA: azul-marinho com estrelas, listras vermelhas e brancas na faixa baixa; águia de asas abertas
    c = mix(sr(vec3(0.09, 0.16, 0.33)), sr(vec3(0.13, 0.21, 0.40)), n); c = mix(c, vec3(0.92), estrela(vec2(p.z, p.y) * 0.9, 0.07, 0.3) * step(1.9, p.y));
    if (p.y > 0.9 && p.y < 1.85) c = mod(floor((p.y - 0.9) / 0.135), 2.0) < 0.5 ? sr(vec3(0.70, 0.10, 0.17)) : sr(vec3(0.93, 0.93, 0.92));
    if (uParte < 0.5) c = mix(sr(vec3(0.52, 0.56, 0.60)), sr(vec3(0.46, 0.50, 0.55)), n);
    gMot = uParte > 0.5 ? motivo(p, 1.0, 1.9, max(2.6, uBordo - 2.0), 3.5, 1.0) * lado : vec4(0.0); }
  else if (v == 3) { // ALEMANHA: preto / vermelho / dourado em faixas que ondulam ao longo do casco (sem nenhum símbolo)
    float y1 = 0.25 * uBordo + 0.3 * sin(p.z * 0.035 - uT * 0.8) + 0.12 * sin(p.z * 0.11 + uT * 0.5), y2 = y1 + 0.3 * uBordo + 0.2 * sin(p.z * 0.05 + uT * 0.6);
    c = p.y > y2 ? sr(vec3(0.06, 0.06, 0.07)) : (p.y > y1 ? sr(vec3(0.80, 0.02, 0.02)) : sr(vec3(0.95, 0.73, 0.0))); c *= 0.9 + 0.2 * n;
    if (uParte < 0.5) { c = mix(sr(vec3(0.20, 0.21, 0.23)), sr(vec3(0.27, 0.28, 0.30)), n); float f = fract(p.y / 2.4); if (f < 0.05) c = sr(vec3(0.80, 0.02, 0.02)); else if (f < 0.09) c = sr(vec3(0.95, 0.73, 0.0)); }
    gMot = vec4(0.0); }
  else if (v == 4) { // REINO UNIDO: azul-real com faixas diagonais vermelhas debruadas de branco; leão no bote
    c = mix(sr(vec3(0.0, 0.14, 0.42)), sr(vec3(0.03, 0.19, 0.48)), n); float d = abs(fract((p.z + p.y * 1.6) / 46.0) - 0.5) * 46.0; if (d < 1.6) c = sr(vec3(0.78, 0.06, 0.18)); else if (d < 2.4) c = vec3(0.92);
    if (uParte < 0.5) c = mix(sr(vec3(0.86, 0.87, 0.88)), sr(vec3(0.76, 0.78, 0.80)), n);
    gMot = uParte > 0.5 ? motivo(p, 2.0, hb, hh, 2.0, 0.0) * lado : vec4(0.0); }
  else { // CHINA: vermelho profundo com estrelas douradas; grous-de-coroa-vermelha em voo
    c = mix(sr(vec3(0.62, 0.06, 0.05)), sr(vec3(0.52, 0.04, 0.04)), n); c = mix(c, sr(vec3(1.0, 0.85, 0.0)), estrela(vec2(p.z, p.y) * 0.8 + 5.0, 0.05, 0.32));
    if (uParte < 0.5) { c = mix(sr(vec3(0.80, 0.80, 0.78)), sr(vec3(0.70, 0.70, 0.69)), n); if (fract(p.y / 2.6) < 0.04) c = sr(vec3(1.0, 0.85, 0.0)); }
    gMot = uParte > 0.5 ? motivo(p, 3.0, hb, hh, 4.0, 1.0) * lado : vec4(0.0); }
  return mix(c, gMot.rgb, gMot.a); }
#endif
vec3 tres(float k){ return k < 0.42 ? uC0 : (k < 0.78 ? uC1 : uC2); }
vec3 camo(vec3 p){
  vec2 q = vec2(p.z, p.y + abs(p.x) * 0.35) * uEsc; int t = int(uTipo + 0.5);
#ifdef NAC
  if (t == 24) return nacBase(p, q);
#endif
  if (t == 1) { // fragmentado (splinter): duas grades oblíquas combinadas → polígonos angulosos
    vec2 a = vec2(q.x * 0.9 + q.y * 0.55, q.y * 1.3 - q.x * 0.35) * 0.06; vec2 b = vec2(q.x * 0.7 - q.y * 0.8, q.y * 0.9 + q.x * 0.45) * 0.05;
    return tres(fract(h21(floor(a)) * 0.6 + h21(floor(b) + 7.0) * 0.55)); }
  if (t == 2) { // dazzle: faixas largas com ângulo que muda por seção do casco
    float sec = floor(q.x * 0.018 + 0.5); float ang = (h21(vec2(sec, 3.0)) - 0.5) * 2.4; float s = fract((q.x * cos(ang) + q.y * sin(ang) * 2.2) * 0.045 + h21(vec2(sec, 9.0)));
    return s < 0.34 ? uC0 : (s < 0.62 ? uC1 : uC2); }
  if (t == 3) { // digital oceânico: pixels em duas escalas
    float k = h21(floor(q * 0.55)) * 0.55 + h21(floor(q * 0.18) + 3.0) * 0.6; return tres(fract(k)); }
  if (t == 4) { // manchas costeiras (fbm)
    float n = fbm2(q * 0.035 + 1.7); return n < 0.45 ? uC0 : (n < 0.58 ? uC1 : uC2); }
  if (t == 5) { // metálico absorvente + friso dourado na borda/linha d'água
    float g = clamp(p.y * 0.03, 0.0, 1.0); vec3 c = mix(uC0, uC1, g * 0.8 + fbm2(q * 0.08) * 0.25); float friso = step(abs(p.y - 1.35), 0.22); return mix(c, uC2, friso); }
  if (t == 6) { // escuro com faixa dourada diagonal na proa
    vec3 c = mix(uC0, uC1, fbm2(q * 0.05) * 0.8); float f = step(abs(fract(q.x * 0.012 + q.y * 0.02) - 0.5), 0.02) * step(q.x, -0.2 * uEsc * 40.0); float friso = step(abs(p.y - 1.35), 0.18); return mix(c, uC2, max(f, friso)); }
  if (t == 7) { // dois tons horizontais (casco escuro até a borda, superestrutura clara) com borda levemente ondulada
    float lim = 2.6 + (vn(vec2(p.z * 0.05, 1.0)) - 0.5) * 0.8; vec3 c = p.y < lim ? uC0 : uC1; return mix(c, uC2, fbm2(q * 0.06) * 0.18); }
  if (t == 9) { // FAIXAS NEXO: casco claro, faixa azul larga com filetes vermelho/amarelo e chevrons diagonais amarelo/preto
    float y = p.y; vec3 c = mix(uC0, uC0 * 0.92, fbm2(q * 0.05)); if (y > 1.2 && y < 4.4) c = uC1; if (abs(y - 4.6) < 0.22) c = uC2; if (abs(y - 1.0) < 0.18) c = vec3(0.96, 0.78, 0.1);
    float ch = fract(q.x * 0.018 + y * 0.05); if (y > 1.2 && y < 4.4 && ch < 0.035) c = vec3(0.96, 0.78, 0.1); if (y > 1.2 && y < 4.4 && ch > 0.035 && ch < 0.06) c = vec3(0.05); return c; }
  if (t == 8) { // NEON TECH (v1.2.0 rev.2): LIBRÉ pintada — casco grafite, faixa larga azul-escura com padrão técnico
    // (placas retangulares em dois tons), chevrons brancos na proa/meia-nau e filetes finos (só os filetes emitem, em neon())
    float y = p.y; vec3 c = mix(uC0, uC1, fbm2(q * 0.05) * 0.7);
    float banda = step(1.5, y) * step(y, 3.9);
    if (banda > 0.5) { vec2 tq = vec2(p.z / 2.6, (y - 1.5) / 0.6); float on = step(0.62, h21(floor(tq) + 11.0)); vec2 f = abs(fract(tq) - 0.5);
      c = mix(uC2 * 0.32, uC2 * 0.55, on * step(max(f.x * 1.1, f.y), 0.42)); }
    float ch = fract((p.z + abs(y - 2.7) * 2.2) / 34.0); if (banda > 0.5 && ch < 0.05) c = vec3(0.88, 0.91, 0.95); if (banda > 0.5 && ch > 0.05 && ch < 0.075) c = uC2 * 0.9;
    if (abs(y - 1.5) < 0.09 || abs(y - 3.9) < 0.09) c = uC2;
    if (y > 4.6 && abs(fract(y / 3.1) - 0.5) < 0.016) c = mix(c, uC2, 0.8); // filetes finos na superestrutura
    return c; }
  if (t == 10) { // RELÂMPAGO AUSTRAL (lendária): grafite-aço em chapas + veios finos azul-gelo
    vec3 c = mix(uC0, uC1, fbm2(q * 0.05) * 0.8); float v = 1.0 - smoothstep(0.0, 0.035, abs(fbm2(q * 0.028 + 3.1) - 0.5)); return mix(c, uC2 * 0.55, v * 0.6); }
  if (t == 11) { // MARÉ DE OBSIDIANA (lendária): negro-vítreo com marmorizado profundo
    float n = fbm2(q * 0.03 + fbm2(q * 0.07) * 1.5); return mix(uC0, uC1, smoothstep(0.3, 0.8, n)); }
  if (t == 12) { // BRASA DOURADA (lendária): grafite com veios de ouro
    vec3 c = mix(uC0, uC1, fbm2(q * 0.05) * 0.8); float v = 1.0 - smoothstep(0.0, 0.03, abs(fbm2(q * 0.045 + 7.3) - 0.5)); return mix(c, uC2 * 0.8, v * 0.75); }
  if (t == 13) { // VERDE-AMARELA (heróica): casco verde, faixa amarela em losango, superestrutura azul com filete branco
    float y = p.y; vec3 c = mix(uC0, uC0 * 0.88, fbm2(q * 0.05)); float lz = abs(fract(p.z / 46.0) - 0.5) * 2.0; if (y > 1.1 && abs(y - 2.9) < 1.5 * (1.0 - lz) + 0.25) c = uC1;
    if (y > 5.2) c = mix(uC2, uC2 * 0.85, fbm2(q * 0.06)); if (abs(y - 5.2) < 0.16) c = vec3(0.92); return c; }
  if (t == 14) { // TRICOLOR DO MEDITERRÂNEO (heróica): cinza-claro + faixas verde/branca/vermelha inclinadas na proa
    vec3 c = mix(uC0, uC0 * 0.9, fbm2(q * 0.05) * 0.8); float zz = p.z + p.y * 0.55;
    if (p.y > 1.1 && p.z < -60.0) { float f = mod(-zz, 300.0); if (f > 222.0 && f < 228.0) c = uC1; else if (f > 228.0 && f < 234.0) c = vec3(0.93); else if (f > 234.0 && f < 240.0) c = uC2; } return c; }
  if (t == 15) { // ESQUADRA ATLÂNTICA (heróica): cinza-naval, faixa azul-marinho de 1,1 a 2,6 m e filete branco
    vec3 c = mix(uC0, uC0 * 0.9, fbm2(q * 0.05) * 0.8); if (p.y > 1.1 && p.y < 2.6) c = uC1; if (abs(p.y - 2.75) < 0.12) c = uC2; return c; }
  if (t == 16) { vec3 c = mix(uC0, uC1, fbm2(q * 0.05) * 0.8); return c; } // FOGOS: azul-noite (as explosões são emissão animada)
  if (t == 17) { vec3 c = mix(uC0, uC1, fbm2(q * 0.05) * 0.8); float v = 1.0 - smoothstep(0.0, 0.02, abs(fbm2(q * 0.035 + 5.7) - 0.5)); return mix(c, uC2 * 0.35, v * 0.5); } // TROVÕES
  if (t == 18) { vec3 c = mix(uC0, uC1, fbm2(q * 0.06) * 0.7); float cs = 1.0 - smoothstep(0.0, 0.05, abs(fract(p.z / 6.0) - 0.5) * 6.0); return c * (1.0 - cs * 0.25); } // FAÍSCA: chapas com costuras
  if (t == 19) { float k = h21(floor(q * 0.5)) * 0.6 + h21(floor(q * 0.16) + 9.0) * 0.55; k = fract(k); return k < 0.3 ? uC0 : (k < 0.6 ? uC1 : (k < 0.85 ? uC2 : uC1 * 0.6)); } // MILITAR DIGITAL
  if (t == 20) { float g = smoothstep(0.0, 9.0, p.y); return mix(uC0, uC1, g * 0.7 + fbm2(q * 0.05) * 0.3); } // AURORA: casco escuro
  if (t == 21) { float g = smoothstep(0.0, 10.0, p.y); return mix(uC0, uC1, g + (fbm2(q * 0.04) - 0.5) * 0.3); } // OCEANO PROFUNDO
  if (t == 22) { float n = fbm2(q * 0.08); return mix(uC0, uC1, 0.45 + 0.35 * n); } // AÇO POLIDO (cromo escovado)
  if (t == 23) { // CINZA-CLARO MEDITERRÂNEO (fábrica do Marcos Vinícius): faixas verde/branca/vermelha no extremo da proa e no espelho de popa
    vec3 c = mix(uC0, uC1, fbm2(q * 0.05) * 0.8); float zz = p.z + p.y * 0.5;
    if (p.y > 1.1 && p.z < -150.0) { float f = -zz - 165.0; if (f > 0.0 && f < 4.0) c = uC2; else if (f >= 4.0 && f < 8.0) c = vec3(0.93); else if (f >= 8.0 && f < 12.0) c = vec3(0.78, 0.17, 0.21); }
    if (p.z > 192.0 && p.y > 1.1) { float f = p.x + 9.0; if (abs(p.x) < 9.0) c = f < 6.0 ? uC2 : (f < 12.0 ? vec3(0.93) : vec3(0.78, 0.17, 0.21)); } return c; }
  float n = fbm2(q * 0.05); return mix(uC0, uC1, smoothstep(0.35, 0.75, n) * 0.55) + (uC2 - uC0) * 0.06 * vn(q * 0.4); // cor lisa com leve variação de chapas
}
vec3 lendFx(vec3 p){ // v1.2.15 efeito ESPECIAL das lendárias — sutil (≤ ~0.5 de emissão nos veios, zero nas faces horizontais), animado por uT
  float lado = 1.0 - smoothstep(0.55, 0.85, abs(vNorL.y)); vec2 q = vec2(p.z, p.y + abs(p.x) * 0.35) * uEsc; int t = int(uTipo + 0.5);
#ifdef NAC
  if (t == 24) { float br = 0.04 + 0.12 * gLun; vec3 e = gMot.rgb * gMot.a * br; int v = int(uVar + 0.5); if (v == 3 && uParte > 0.5) { float sw = pow(max(0.0, 1.0 - abs(fract(p.z * 0.006 - uT * 0.07) - 0.5) * 10.0), 2.0); e += vec3(0.95, 0.6, 0.05) * sw * 0.08; } return e * lado; }
#endif
  if (t == 13) { float w = pow(0.5 + 0.5 * sin(p.z * 0.06 - p.y * 0.3 - uT * 1.3), 10.0); return vec3(1.0, 0.95, 0.7) * w * 0.07 * lado; }
  if (t == 14 || t == 22) { float w = pow(max(0.0, 1.0 - abs(fract(p.z * 0.004 - p.y * 0.01 - uT * 0.06) - 0.5) * 9.0), 3.0); return vec3(1.0) * w * (t == 22 ? 0.16 : 0.07) * lado; }
  if (t == 15) { float f = 1.0 - smoothstep(0.08, 0.2, abs(p.y - 2.75)); float sw = pow(max(0.0, 1.0 - abs(fract(p.z * 0.005 + uT * 0.08) - 0.5) * 12.0), 2.0); return uC2 * f * (0.04 + 0.5 * sw) * lado; }
  if (t == 16) { vec2 cc = vec2(p.z, p.y * 1.6) / 22.0; vec2 ci = floor(cc); vec2 cf = fract(cc) - 0.5; float h = h21(ci + 3.0); float ph = fract(uT * 0.18 + h); vec2 o = vec2(h21(ci + 7.0), h21(ci + 9.0)) * 0.4 - 0.2; float r = length(cf - o);
    float anel = (1.0 - smoothstep(0.0, 0.035, abs(r - ph * 0.42))) * (1.0 - ph) * step(0.45, h); float ra = step(0.6, h21(floor(vec2(atan(cf.y - o.y, cf.x - o.x) * 2.5, ph * 3.0)) + ci));
    vec3 cor = 0.6 + 0.4 * cos(6.2832 * (h + vec3(0.0, 0.33, 0.67))); return cor * anel * (0.35 + 0.4 * ra) * lado; }
  if (t == 17) { float v = 1.0 - smoothstep(0.0, 0.02, abs(fbm2(q * 0.035 + 5.7) - 0.5)); float seg = floor(p.z / 40.0); float fl = step(0.93, fract(uT * 0.7 + h21(vec2(seg, 1.0)))) ; float corre = pow(max(0.0, 1.0 - abs(fract(p.z * 0.02 - uT * 1.9 + h21(vec2(seg, 4.0))) - 0.5) * 6.0), 4.0); return uC2 * v * (0.05 + 0.9 * fl + 0.45 * corre) * lado; }
  if (t == 18) { float cs = 1.0 - smoothstep(0.0, 0.04, abs(fract(p.z / 6.0) - 0.5) * 6.0); vec2 c2 = floor(vec2(p.z * 2.0, p.y * 2.0)); float sp = step(0.985, h21(c2 + floor(uT * 9.0))); return uC2 * cs * sp * 1.1 * lado; }
  if (t == 19) { vec2 cel = floor(q * 0.5); float k = step(0.97, fract(h21(cel) + uT * 0.03)); return uC2 * k * 0.05 * lado; }
  if (t == 20) { float x2 = p.z * 0.02 + 0.6 * sin(p.z * 0.011 + uT * 0.25); float cort = pow(0.5 + 0.5 * sin(x2 * 6.0 + uT * 0.5), 3.0) * smoothstep(2.0, 6.0, p.y) * (1.0 - smoothstep(9.0, 22.0, p.y)); vec3 cor = mix(uC2, vec3(0.62, 0.36, 1.0), 0.5 + 0.5 * sin(p.z * 0.01 - uT * 0.2)); return cor * cort * 0.22 * lado; }
  if (t == 21) { vec2 a = vec2(p.z * 0.09, p.y * 0.5); float c1 = vn(a + vec2(uT * 0.35, 0.0)), c2 = vn(a * 1.7 - vec2(uT * 0.25, uT * 0.1)); float k = pow(1.0 - abs(c1 - c2), 12.0) * (1.0 - smoothstep(1.0, 8.0, p.y)); return uC2 * k * 0.18 * lado; }
  if (t == 10) { float v = 1.0 - smoothstep(0.0, 0.035, abs(fbm2(q * 0.028 + 3.1) - 0.5)); float onda = pow(0.5 + 0.5 * sin(uT * 1.7 - p.z * 0.09), 6.0); return uC2 * v * (0.08 + 0.55 * onda) * lado; }
  if (t == 11) { float w = 0.5 + 0.5 * sin(p.z * 0.035 + p.y * 0.25 - uT * 0.45); vec3 ir = 0.5 + 0.5 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + p.z * 0.004 + p.y * 0.03 + uT * 0.02)); return mix(uC2, ir, 0.5) * pow(w, 8.0) * 0.09 * lado; }
  if (t == 12) { float v = 1.0 - smoothstep(0.0, 0.03, abs(fbm2(q * 0.045 + 7.3) - 0.5)); float br = 0.22 + 0.16 * sin(uT * 0.9 + p.z * 0.05) + 0.08 * vn(vec2(p.z * 0.3, uT * 0.6)); return uC2 * v * br * lado; }
  return vec3(0.0); }
vec3 neon(vec3 p){ // emissão SUAVE apenas nos filetes da libré (nunca em arestas: zera em faces horizontais)
  float lado = 1.0 - smoothstep(0.55, 0.85, abs(vNorL.y)); float y = p.y;
  float fil = (1.0 - smoothstep(0.03, 0.09, abs(y - 1.5))) + (1.0 - smoothstep(0.03, 0.09, abs(y - 3.9)));
  float ch = fract((p.z + abs(y - 2.7) * 2.2) / 34.0); float chev = step(1.5, y) * step(y, 3.9) * step(0.05, ch) * step(ch, 0.075);
  float sup = step(4.6, y) * (1.0 - smoothstep(0.004, 0.016, abs(fract(y / 3.1) - 0.5))) * 0.6;
  return uC2 * (fil * 0.9 + chev * 0.7 + sup) * lado; }`;
const CACHE = new Map(); let GRIME = null, GRIME_L = null; /* v1.2.31: GRIME_L = desgaste sutil (pinturas com limpa:1) */
/** v1.2.15: relógio ÚNICO compartilhado das camuflagens lendárias (uniform, sem novo programa) — atualizado pelo renderer a cada quadro. */
export const CAMO_T = { value: 0 };
// convés: cinza naval (padrão) ou VERMELHO-FERRUGEM antiderrapante (pinturas com `conves: 'vermelho'`)
const CONVES = new Map();
export function materialConves(base, pintura) { const P = PINTURAS[pintura] || {}; if (!P.conves || !base) return base; const k = base.uuid + ':' + P.conves; if (CONVES.has(k)) return CONVES.get(k);
  const m = base.clone(); m.color = new THREE.Color(P.conves === 'vermelho' ? '#7e2b22' : P.conves === 'azul' ? '#26364f' : P.conves === 'escuro' ? '#25292e' : '#40464c'); m.roughness = 0.88; CONVES.set(k, m); return m; }
const lin = (hex) => new THREE.Color(hex);
/** Material pintado (cópia do material base com o padrão `pintura`). parte: 'casco' | 'sup'. */
export function materialPintura(base, pintura, parte = 0, bordo = 6) {
  const P = PINTURAS[pintura] || PINTURAS.cinza_naval; const k = base.uuid + ':' + pintura + ':' + parte; if (CACHE.has(k)) return CACHE.get(k);
  if (!GRIME) GRIME = texPintura(THREE, { base: '#bcbcbc', sujeira: 0.85, ferrugem: 0.8, s: 5 }); // desgaste + ferrugem leve (escorridos)
  if (P.limpa && !GRIME_L) GRIME_L = texPintura(THREE, { base: '#bcbcbc', sujeira: 0.85, ferrugem: 0.6, s: 6 });
  const m = base.clone(); const g = (P.limpa ? GRIME_L : GRIME).clone(); if (base.map) { g.repeat.copy(base.map.repeat); g.wrapS = g.wrapT = THREE.RepeatWrapping; } g.needsUpdate = true; m.map = g; m.color = new THREE.Color('#ffffff');
  const U = { uC0: { value: lin(P.cores[0]) }, uC1: { value: lin(P.cores[1]) }, uC2: { value: lin(P.cores[2]) }, uTipo: { value: P.tipo || 0 }, uEsc: { value: 1 }, uT: CAMO_T, uDesg: { value: new THREE.Vector2(bordo || 6, (parte ? 1 : 0.55) * (P.limpa ? 0.75 : 1)) } }; /* v1.2.26: desgaste PBR (borda livre, intensidade casco/sup) */ const nac = P.tipo === 24; if (nac) Object.assign(U, { uNacTex: { value: texNacional() }, uVar: { value: P.var || 1 }, uParte: { value: parte }, uBordo: { value: bordo || 6 } }); /* v1.2.19 item 12: TODAS as nacionais lendárias = 1 programa (nação/parte só como uniforms) */
  const neon = P.tipo === 8, lend = P.tipo >= 10; if (neon || lend) { m.emissive = new THREE.Color('#ffffff'); m.emissiveIntensity = 1; }
  m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 vPosL; varying vec3 vNorL;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vPosL = position; vNorL = normal;');
    sh.fragmentShader = (nac ? '#define NAC\n' : '') + GLSL + '\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb *= camo(vPosL) * 1.9;\n' + (parte ? '' : ' { /* v1.2.33b: emendas das chapas do casco (fiadas a cada ~1,6 m e cavernas a cada ~6 m) e FAIXA MOLHADA acima da linha d’água */ float vertC = 1.0 - smoothstep(0.35, 0.7, abs(vNorL.y)); float fi = 1.0 - smoothstep(0.0, 0.035, abs(fract(vPosL.y / 1.6) - 0.5) - 0.465); float cv = 1.0 - smoothstep(0.0, 0.02, abs(fract(vPosL.z / 6.0) - 0.5) - 0.48); diffuseColor.rgb *= 1.0 - (max(fi, cv * 0.7) * 0.07 * vertC); float wetH = (1.0 - smoothstep(0.9, 2.4, vPosL.y)) * step(0.0, vPosL.y) * vertC; diffuseColor.rgb *= 1.0 - wetH * 0.18; }\n') + ' diffuseColor.rgb *= vPosL.y < 0.9 ? ' + (P.limpa ? '1.0' : '0.24') + ' : 1.0; /* faixa escura da linha d’água (boot-topping) */ { float lmC = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lmC), 0.14); /* v1.2.15: tinta naval real é pouco saturada */ float sal = smoothstep(0.9, 1.3, vPosL.y) * (1.0 - smoothstep(1.3, 2.6, vPosL.y)) * (0.5 + 0.5 * vn(vec2(vPosL.z * 0.4, 2.0))); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.8, 0.79), sal * 0.12); /* sal/marca d’água acima do boot-topping */ float esc = step(0.86, h21(vec2(floor(vPosL.z * 0.45), 5.0))) * smoothstep(0.0, 3.5, vPosL.y) * (1.0 - smoothstep(0.0, 0.08, abs(fract(vPosL.z * 0.45) - 0.5))) * (1.0 - abs(vNorL.y)); diffuseColor.rgb *= 1.0 - esc * 0.22; /* escorridos de ferrugem/sujeira sob os embornais */ } float wRust = 0.0; { /* v1.2.26: desgaste PBR do casco/superestrutura — escorridos de ferrugem dos embornais, manchas de corrosão, limo da linha d’água, variação tonal */ float vert = 1.0 - smoothstep(0.35, 0.7, abs(vNorL.y)); float bd = uDesg.x; float y = vPosL.y; float z = vPosL.z; float col = z * 0.32; float ci = floor(col); float hs = h21(vec2(ci, 11.0)); float fx = abs(fract(col) - 0.5 - (hs - 0.5) * 0.3); float wid = 0.04 + 0.07 * h21(vec2(ci, 12.0)); float len = 1.5 + 5.0 * h21(vec2(ci, 13.0)); float st = step(0.62, hs) * (1.0 - smoothstep(wid * 0.4, wid, fx)) * smoothstep(bd - len, bd - 0.15, y) * (1.0 - smoothstep(bd - 0.05, bd + 0.2, y)) * (0.55 + 0.45 * vn(vec2(z * 3.0, y * 0.7))); float pr = smoothstep(0.74, 0.9, vn(vec2(z * 0.18, y * 0.45) + 7.0) * 0.7 + vn(vec2(z * 1.3, y * 1.6)) * 0.3); float wl = smoothstep(0.7, 1.0, y) * (1.0 - smoothstep(1.0, 2.0 + 0.6 * vn(vec2(z * 0.25, 3.0)), y)); float mancha = vn(vec2(z * 0.06, y * 0.12) + 3.0); wRust = (st * 0.85 + pr * 0.55) * vert * uDesg.y; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.30, 0.15, 0.07) * (0.7 + 0.5 * vn(vec2(z * 4.0, y * 4.0))), clamp(wRust, 0.0, 0.72)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.20, 0.22, 0.16), wl * 0.3 * vert * uDesg.y); diffuseColor.rgb *= 0.9 + 0.16 * mancha; }').replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = clamp(roughnessFactor + wRust * 0.3, 0.04, 1.0);' + (parte ? '' : ' { float vw = 1.0 - smoothstep(0.35, 0.7, abs(vNorL.y)); float wg = (1.0 - smoothstep(0.9, 2.4, vPosL.y)) * step(0.0, vPosL.y) * vw; roughnessFactor = mix(roughnessFactor, 0.22, wg * 0.8); } /* v1.2.33b: casco molhado brilha */') + '').replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n metalnessFactor *= 1.0 - clamp(wRust, 0.0, 1.0) * 0.8;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance = ' + (neon ? 'neon(vPosL)' : lend ? 'lendFx(vPosL)' : 'vec3(0.0)') + ';'); };
  m.customProgramCacheKey = () => 'camo' + (P.tipo || 0) + (P.limpa ? 'L' : '') + (base.vertexColors ? 'v' : '') + (parte ? 's' : 'c'); /* v1.2.33b: casco tem chapas/faixa molhada */
  m.userData.pintura = pintura; m.metalness = P.metal != null ? P.metal : P.tipo === 5 ? 0.55 : base.metalness; m.roughness = P.rug != null ? P.rug : P.tipo === 5 ? 0.42 : base.roughness; /* v1.2.11: metálicas dos lendários */
  CACHE.set(k, m); return m;
}
// ---------- bandeiras (geometria simplificada das bandeiras nacionais; símbolos nacionais são de domínio público) ----------
const FLAG = {};
export function texBandeira(nacao) {
  if (FLAG[nacao]) return FLAG[nacao]; const c = document.createElement('canvas'); c.width = 192; c.height = 128; const x = c.getContext('2d'); const W = 192, H = 128;
  const estrela = (cx, cy, r, cor, rot = -Math.PI / 2) => { x.fillStyle = cor; x.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + (i * Math.PI) / 5, rr = i % 2 ? r * 0.4 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); };
  if (nacao === 'BRA') { x.fillStyle = '#009c3b'; x.fillRect(0, 0, W, H); x.fillStyle = '#ffdf00'; x.beginPath(); x.moveTo(W / 2, 12); x.lineTo(W - 16, H / 2); x.lineTo(W / 2, H - 12); x.lineTo(16, H / 2); x.closePath(); x.fill();
    x.fillStyle = '#002776'; x.beginPath(); x.arc(W / 2, H / 2, 30, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.arc(W / 2 + 24, H / 2 + 60, 74, Math.PI * 1.21, Math.PI * 1.58); x.stroke(); for (let i = 0; i < 9; i++) { x.fillStyle = '#fff'; x.fillRect(W / 2 - 18 + (i * 37) % 34, H / 2 + 4 + (i * 13) % 18, 2.5, 2.5); } }
  else if (nacao === 'EUA') { for (let i = 0; i < 13; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#b22234'; x.fillRect(0, (i * H) / 13, W, H / 13 + 1); } x.fillStyle = '#3c3b6e'; x.fillRect(0, 0, W * 0.4, H * 7 / 13); for (let r = 0; r < 9; r++) for (let k = 0; k < (r % 2 ? 5 : 6); k++) estrela(7 + k * 12.5 + (r % 2 ? 6 : 0), 6 + r * 7.2, 2.6, '#fff'); }
  else if (nacao === 'CHN') { x.fillStyle = '#de2910'; x.fillRect(0, 0, W, H); estrela(32, 32, 19, '#ffde00'); [[64, 13], [76, 26], [76, 43], [64, 56]].forEach(([a, b], i) => estrela(a, b, 6.5, '#ffde00', -Math.PI / 2 + Math.atan2(32 - b, 32 - a) + Math.PI / 2 * 0 + i * 0.2)); }
  else if (nacao === 'RUS') { [['#ffffff', 0], ['#0039a6', 1], ['#d52b1e', 2]].forEach(([c2, i]) => { x.fillStyle = c2; x.fillRect(0, (i * H) / 3, W, H / 3 + 1); }); }
  else if (nacao === 'UK') { x.fillStyle = '#012169'; x.fillRect(0, 0, W, H); x.lineCap = 'butt'; const diag = (cor, lw) => { x.strokeStyle = cor; x.lineWidth = lw; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, H); x.moveTo(W, 0); x.lineTo(0, H); x.stroke(); }; diag('#fff', 26); diag('#c8102e', 9);
    x.fillStyle = '#fff'; x.fillRect(W / 2 - 21, 0, 42, H); x.fillRect(0, H / 2 - 21, W, 42); x.fillStyle = '#c8102e'; x.fillRect(W / 2 - 12, 0, 24, H); x.fillRect(0, H / 2 - 12, W, 24); }
  else if (!desenhaBandeira(x, nacao, W, H)) { x.fillStyle = '#64748b'; x.fillRect(0, 0, W, H); }
  if (!/^SIN-[AB]$/.test(nacao)) { x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, W - 3, H - 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = (globalThis.__nnsAniso || 8) /* v1.2.15: anisotropia máx. suportada */; FLAG[nacao] = t; return t; }
/** URL de dados da bandeira (para HUD/menus). */
export function urlBandeira(nacao) { const t = texBandeira(nacao); return t.image.toDataURL('image/png'); }
