// v1.3.39 (Valter) — CONTROLE PROFISSIONAL ("modo Ace Combat") das aeronaves de asa fixa no MANUAL.
// O manche comanda as superfícies do avião, não a direção:
//  · manche para os lados = ROLAGEM (o avião gira no próprio eixo e fica de lado, sem mudar de rumo por si só);
//  · manche para baixo = PUXA (nariz para cima no referencial do avião); para cima = empurra (nariz para baixo);
//  · a curva sai de INCLINAR e PUXAR: a sustentação inclinada puxa o avião para dentro da curva;
//  · sustentação limitada pela velocidade (n disponível ∝ v²): devagar curva mais fechado até o limite de g;
//    abaixo da velocidade de estol não sustenta 1 g e o nariz cai (ESTOL);
//  · manche solto = o avião mantém a atitude (não nivela sozinho); de lado ou de dorso ele desce/derrapa pela gravidade;
//  · curva puxada perde velocidade (arrasto induzido); subir perde velocidade, descer ganha (gravidade).
// Atitude completa em quaternion (loops e voo de dorso), no MESMO referencial do modelo 3D (Euler YXZ: pitch, −rumo, −inclinação).
// Sem alocação por quadro.
const G = 9.81;

function qMul(a, b, o) { const ax = a[0], ay = a[1], az = a[2], aw = a[3], bx = b[0], by = b[1], bz = b[2], bw = b[3];
  o[0] = aw * bx + ax * bw + ay * bz - az * by; o[1] = aw * by - ax * bz + ay * bw + az * bx; o[2] = aw * bz + ax * by - ay * bx + az * bw; o[3] = aw * bw - ax * bx - ay * by - az * bz; return o; }
function qEixo(x, y, z, ang, o) { const h = ang / 2, s = Math.sin(h); o[0] = x * s; o[1] = y * s; o[2] = z * s; o[3] = Math.cos(h); return o; }
function qNorm(q) { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; q[0] /= l; q[1] /= l; q[2] /= l; q[3] /= l; return q; }
/** gira o vetor (vx,vy,vz) pelo quaternion q → o */
function qVet(q, vx, vy, vz, o) { const x = q[0], y = q[1], z = q[2], w = q[3]; const ix = w * vx + y * vz - z * vy, iy = w * vy + z * vx - x * vz, iz = w * vz + x * vy - y * vx, iw = -x * vx - y * vy - z * vz;
  o[0] = ix * w + iw * -x + iy * -z - iz * -y; o[1] = iy * w + iw * -y + iz * -x - ix * -z; o[2] = iz * w + iw * -z + ix * -y - iy * -x; return o; }
const _t = [0, 0, 0, 1], _r = [0, 0, 0, 1], _f = [0, 0, 0], _u = [0, 0, 0], _d = [0, 0, 0];

/** quaternion do modelo a partir de rumo, γ e inclinação (mesma convenção do desenho: rotation.set(γ, −rumo, −inclinação), ordem YXZ) */
export function aceIni(q) { const a = q.aq || (q.aq = [0, 0, 0, 1]); qEixo(0, 1, 0, -(q.rumo || 0), a); qMul(a, qEixo(1, 0, 0, q.gam || 0, _t), a); qMul(a, qEixo(0, 0, 1, -(q.bank || 0), _t), a); qNorm(a); q.paq = a.slice(); return a; }

/** solta o modo profissional: volta aos limites do voo normal (inclinação ≤ 1 rad, γ ≤ 0,5) sem salto de rumo */
export function aceFim(q) { if (!q.aq) return; q.bank = Math.max(-1, Math.min(1, q.bank || 0)); q.gam = Math.max(-0.5, Math.min(0.5, q.gam || 0)); q.roll = -q.bank; q.aq = null; q.paq = null; q.aceN = 1; }

/**
 * Um passo de atitude no CONTROLE PROFISSIONAL. Atualiza q.aq, q.rumo, q.gam, q.bank, q.roll, q.w, q.aceN e desconta a velocidade da curva puxada.
 * c = { rolMax (rad/s), nMax (g), vCanto (m/s, velocidade em que o nMax fica disponível), piso, assist, teto }
 * Manche: q.sx (−1..1, direita +), q.sy (−1..1, para CIMA +) — puxar = manche para BAIXO.
 */
export function aceAtitude(q, dt, c) { const a = q.aq || aceIni(q); if (!q.paq) q.paq = a.slice(); q.paq[0] = a[0]; q.paq[1] = a[1]; q.paq[2] = a[2]; q.paq[3] = a[3];
  const v = Math.max(20, q.v || 0), rumo0 = q.rumo || 0;
  // 1) rolagem no eixo longitudinal (inclinação + para a direita = rotação local −Z)
  const p = (q.sx || 0) * c.rolMax; if (p) qMul(a, qEixo(0, 0, 1, -p * dt, _t), a);
  // 2) sustentação comandada (g) — puxar (manche para baixo) aumenta; disponível cai com v² (estol natural)
  const nDisp = c.nMax * Math.min(1, (v / c.vCanto) * (v / c.vCanto)), puxa = -(q.sy || 0);
  let n = puxa >= 0 ? 1 + puxa * (c.nMax - 1) : 1 + puxa * 3; n = Math.max(-nDisp * 0.45, Math.min(nDisp, n)); q.aceN = n;
  qVet(a, 0, 0, -1, _f); qVet(a, 0, 1, 0, _u); qVet(a, 1, 0, 0, _d);
  // aceleração perpendicular à trajetória: sustentação no eixo "para cima" do avião + componente da gravidade fora do nariz
  const gF = -G * _f[1]; const gx = 0 - gF * _f[0], gy = -G - gF * _f[1], gz = 0 - gF * _f[2];
  const aUp = n * G + (gx * _u[0] + gy * _u[1] + gz * _u[2]), aDir = gx * _d[0] + gy * _d[1] + gz * _d[2];
  qMul(a, qEixo(1, 0, 0, (aUp / v) * dt, _t), a); /* arfagem: nariz segue a sustentação */
  qMul(a, qEixo(0, 1, 0, -(aDir / v) * dt, _t), a); /* derrapagem: de lado, a gravidade puxa o nariz para a asa baixa */
  // 3) piso (150 m) e teto: o avião é levantado/abaixado no referencial do mundo, sem tirar a inclinação
  qVet(a, 0, 0, -1, _f); if (q.y < c.piso + c.assist && _f[1] < 0) { const ax = -_f[2], az = _f[0], l = Math.hypot(ax, az) || 1, al = Math.min(-Math.asin(Math.max(-1, Math.min(1, _f[1]))), Math.max(0.15, (c.piso + c.assist - q.y) / c.assist) * 1.4 * dt); qMul(qEixo(ax / l, 0, az / l, al, _r), a, a); }
  else if (q.y > c.teto && _f[1] > 0) { const ax = -_f[2], az = _f[0], l = Math.hypot(ax, az) || 1; qMul(qEixo(ax / l, 0, az / l, -Math.min(Math.asin(Math.min(1, _f[1])), 0.6 * dt), _r), a, a); }
  qNorm(a);
  // 4) Euler YXZ (o mesmo do desenho) → rumo, γ, inclinação
  const x = a[0], y = a[1], z = a[2], w = a[3], m13 = 2 * (x * z + w * y), m33 = 1 - 2 * (x * x + y * y), m23 = 2 * (y * z - w * x), m21 = 2 * (x * y + w * z), m22 = 1 - 2 * (x * x + z * z);
  q.gam = Math.asin(Math.max(-1, Math.min(1, -m23))); if (Math.abs(m23) < 0.9999) { q.rumo = -Math.atan2(m13, m33); q.bank = -Math.atan2(m21, m22); }
  q.roll = -q.bank; q.pitch = q.gam; { let dr = q.rumo - rumo0; if (dr > Math.PI) dr -= 2 * Math.PI; else if (dr < -Math.PI) dr += 2 * Math.PI; q.w = dr / Math.max(1e-3, dt); }
  // 5) arrasto induzido: curva puxada gasta velocidade
  q.v = (q.v || 0) - Math.max(0, Math.abs(n) - 1) * 0.85 * dt;
  return a; }

/** parâmetros do avião no controle profissional (caça ágil; bombardeiro pesado) */
export function aceCfg(vmax, pesado, piso, assist, teto, o = {}) { o.rolMax = pesado ? 1.1 : 3.2; o.nMax = pesado ? 3 : 7.5; o.vCanto = (vmax || 250) * (pesado ? 0.7 : 0.62); o.piso = piso; o.assist = assist; o.teto = teto; return o; }
