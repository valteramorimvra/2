// v1.2.19 item 3 (assin ajustado): (A) classes antigas = 1.2.17 bit a bit no caminho do som de canhão; (B) 7 cruzeiros: banco próprio distinto,
// mais forte, energia 300 Hz–6 kHz (alto-falante de celular), sem clipping, determinístico, proporcional ao calibre.
import fs from 'node:fs'; import { execSync } from 'node:child_process';
import { CLASSES } from '../src/sim/classes.js'; import { bancoPesado } from '../src/audio/canhaoPesado.js';
const BASE = process.env.BASE || '/tmp/base-ia/src'; let falhas = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA') + ' ' + m); if (!c) falhas++; };
const ler = (f) => fs.readFileSync(f, 'utf8');
// (A1) texto idêntico: toca→salva (toca, _fonte…, salvaTorres), _voz/_vozM, tiro(), mixerNucleo inteiro
const bloco = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); return i < 0 || j < 0 ? null : s.slice(i, j); };
const NA = ler('src/NavalAudio.js'), NB = ler(BASE + '/NavalAudio.js');
// v1.2.21 (itens 4 e 5, intencionais): passagem() (chiado de passagem −2 dB) e atualizaMotor() (motor +, chiado −6 dB) mudaram de propósito e ficam fora da
// comparação bit a bit; o caminho do SOM DE CANHÃO (toca/_fonte/_ruido/_osc/síntese/salvaTorres) continua idêntico. As duas funções precisam ter a marca v1.2.21.
const semIt45 = (blk) => { if (!blk) return blk; const L = blk.split('\n'); const o = []; let fora = false; for (const l of L) { if (/^  [A-Za-z_]+\(/.test(l)) fora = /^  (passagem|atualizaMotor)\(/.test(l); if (!fora) o.push(l); } return o.join('\n'); };
const bA = bloco(NA, '  toca(nome, {', '  salva(nome,'), bB = bloco(NB, '  toca(nome, {', '  salva(nome,');
ok(bA && semIt45(bA) === semIt45(bB), 'toca/_fonte/síntese/salvaTorres idênticos à 1.2.17 (exceto passagem/atualizaMotor, itens 4/5 da 1.2.21)');
ok(process.env.BASE121 === '0' || (/  passagem\([^\n]*v1\.2\.21|ganhoPassagem/.test(bA) && /item 4/.test(bA)), 'mudanças de passagem/motor são as marcadas da 1.2.21');
for (const p of ['  _voz(', '  _vozM(', '  modeloDist(', '  a30(', '  salva(nome,']) { const l1 = NA.split('\n').find((x) => x.startsWith(p)), l2 = NB.split('\n').find((x) => x.startsWith(p)); ok(l1 && l1 === l2, p.trim() + ' idêntico'); }
const M5 = ler('src/modernNaval5v5.js'), M5B = ler(BASE + '/modernNaval5v5.js'); const ti = (s) => s.split('\n').find((x) => x.startsWith('  tiro(e, d, pan)'));
ok(ti(M5) === ti(M5B), 'tiro() idêntico (sem timbre/assinatura por navio)'); ok(!/assinatura|timbre\(/.test(M5), 'sem assinatura 14e no 5v5');
ok(ler('src/audio/mixerNucleo.js') === ler(BASE + '/audio/mixerNucleo.js'), 'mixerNucleo idêntico');
// (A2) funcional: fimEventos atual × 1.2.17 com as MESMAS salvas, todas as classes, perto/longe, jogador/inimigo, calibres
const metodo = (s) => { const l = s.split('\n').find((x) => x.startsWith('  fimEventos()')); return (0, eval)('({' + l.trim().replace(/\}\s*(\/\*.*\*\/)?\s*$/, '}') + '})').fimEventos; };
const fA = metodo(M5), fB = metodo(M5B); const L = Object.values(CLASSES); const antigas = L.filter((c) => !c.cruzeiroPesado), novas = L.filter((c) => c.cruzeiroPesado);
const noop = new Proxy(function () {}, { get: () => noop, apply: () => undefined });
const roda = (f, C, sv, meu) => { const reg = []; const audio = new Proxy({ buf: { cp_grande: 1, cp_100: 1 }, salvaTorres: (...a) => reg.push(JSON.stringify(a)), salva: (...a) => reg.push('s' + JSON.stringify(a)) }, { get: (t, k) => (k in t ? t[k] : noop) });
  const j = new Proxy({ audio, eu: { id: meu ? 7 : 1 }, S: { sim: { navios: { 7: { C } } } }, camModo: 'orbita' }, { get: (t, k) => (k in t ? t[k] : noop) }); const salvas = new Map([[7, JSON.parse(JSON.stringify(sv))]]);
  try { f.call(new Proxy({ j, salvas }, { get: (t, k) => (k in t ? t[k] : noop) })); } catch (e) { reg.push('ERR ' + e.message); } return reg.filter((x) => /^\[|^s\[/.test(x)); };
let nA = 0, dif = 0, nN = 0, cp = 0;
for (const C of [...antigas, ...novas]) for (const cal of [12.7, 30, 76, 100, 127, 152, 203, 280, 305, 356, 406, 460]) for (const d of [40, 900, 2500, 3300, 7000]) for (const meu of [0, 1]) {
  const sv = { n: 2, d, pan: 0.2, cal, l: [{ d, pan: 0.2, cal, torre: 1, cano: 0 }, { d: d + 3, pan: 0.2, cal, torre: 2, cano: 1 }], pool: [] }; const a = roda(fA, C, sv, meu), b = roda(fB, C, sv, meu);
  if (!C.cruzeiroPesado) { nA++; if (a.join() !== b.join() || !a.length) dif++; } else { nN++; if (a.length && /"cp_/.test(a[0])) cp++; } }
ok(nA > 1000 && dif === 0, `classes antigas: ${nA} casos de salva, ${dif} diferentes da 1.2.17 (nome, distância, pan, volume, torre/cano)`);
ok(novas.length === 7 && cp === nN, `7 cruzeiros: ${cp}/${nN} salvas no banco próprio cp_*`);
// (B) banco
const sr = 44100, dec = (n) => { const b = execSync(`ffmpeg -v quiet -i public/audio/${n}.ogg -ac 1 -ar ${sr} -f f32le -`, { maxBuffer: 1 << 28 }); return Float32Array.from(new Float32Array(b.buffer, b.byteOffset, b.length / 4)); };
const S = { canhao_grande: dec('canhao_grande'), canhao_medio: dec('canhao_medio'), canhao_rapido: dec('canhao_rapido') }; const t0 = Date.now(); const P = bancoPesado(S, sr), ms = Date.now() - t0; const P2 = bancoPesado(S, sr);
ok(ms < 1500, 'pré-render do banco ' + ms + ' ms (uma vez no carregamento)');
const lp = (y, fc) => { const a = 1 - Math.exp(-2 * Math.PI * fc / sr); let s = 0; const z = new Float32Array(y.length); for (let i = 0; i < y.length; i++) { s += a * (y[i] - s); z[i] = s; } return z; }; const hp = (y, fc) => { const l = lp(y, fc); return y.map((v, i) => v - l[i]); };
const db = (y) => { let e = 0; for (const v of y) e += v * v; return 10 * Math.log10(e / y.length + 1e-12); }; const banda = (y) => db(lp(lp(hp(hp(y, 300), 300), 6000), 6000)), grave = (y) => db(lp(lp(y, 150), 150));
const pk = (y) => y.reduce((m, v) => Math.max(m, Math.abs(v)), 0); const cor = (a, b) => { const n = Math.min(a.length, b.length); let ab = 0, aa = 0, bb = 0; for (let i = 0; i < n; i++) { ab += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i]; } return ab / Math.sqrt(aa * bb); };
for (const [k, y] of Object.entries(P)) ok(pk(y) <= 0.93 && y.every(Number.isFinite) && y.every((v, i) => v === P2[k][i]), `${k}: ${(y.length / sr).toFixed(2)} s, pico ${pk(y).toFixed(3)} (sem clipping), determinístico`);
const G = S.canhao_grande, M = S.canhao_medio, Q = S.canhao_rapido; const tab = [['cp_grande', G], ['cp_100', M], ['cp_30', Q], ['cp_127', Q]];
for (const [k, o] of tab) console.log(`   ${k}: total ${db(P[k]).toFixed(1)} dB (orig ${db(o).toFixed(1)}) · 300–6k ${banda(P[k]).toFixed(1)} (orig ${banda(o).toFixed(1)}) · <150 Hz ${grave(P[k]).toFixed(1)} (orig ${grave(o).toFixed(1)}) · correl. c/ original ${cor(P[k], o).toFixed(2)}`);
ok(db(P.cp_grande) >= db(G) + 4 && banda(P.cp_grande) >= banda(G) + 1.5 && grave(P.cp_grande) >= grave(G) + 6, '280 mm: mais forte que o canhão grande antigo no total, na banda do celular e no grave');
ok(banda(P.cp_100) >= banda(M) + 2, '100 mm: banda do celular acima do canhão médio antigo');
ok(db(P.cp_grande) > db(P.cp_30) && db(P.cp_100) > db(P.cp_30) && P.cp_grande.length > P.cp_100.length && P.cp_100.length > P.cp_30.length && P.cp_30.length > P.cp_127.length, 'proporcional ao calibre: 280 > 100 > 30 > 12,7 (energia e duração)');
ok(banda(P.cp_longe) > banda(P.cp_longe.map((v, i) => v)) - 1 && lp(P.cp_longe, 99999) && banda(P.cp_grande) - grave(P.cp_grande) > banda(P.cp_longe) - grave(P.cp_longe), 'cp_longe mais abafado que o próximo (ar absorve agudos)');
for (const [k, o] of tab) ok(Math.abs(cor(P[k], o)) < 0.9, k + ' distinto da gravação de origem');
console.log(falhas ? `RESULTADO: ${falhas} FALHA(S)` : 'RESULTADO: TUDO OK'); process.exit(falhas ? 1 : 0);
