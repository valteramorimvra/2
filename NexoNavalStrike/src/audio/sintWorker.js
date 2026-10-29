// v1.2.57 — SÍNTESE DE ÁUDIO FORA DA THREAD DO JOGO (Web Worker).
// Os bancos sintetizados (motor/granadas, sons do jogador, nuclear, aeronaves/água) eram gerados na thread principal
// logo antes/durante a batalha — segundos de CPU no celular = travadas. Aqui eles são calculados em paralelo e os
// Float32Array voltam por TRANSFERÊNCIA (zero cópia). O resultado é guardado em IndexedDB pelo chamador (cacheSom.js).
import { RECEITAS } from './bancoSom.js';
import { geraJogador, NOMES_JOGADOR } from './somJogador.js';
import { geraNuclear, NOMES_NUCLEAR } from './somNuclear.js';
import { geraAA, NOMES_AA, SR_AA } from './aeroAgua1226.js';

self.onmessage = (ev) => { const { sr } = ev.data || {}; const out = { banco: {}, jog: {}, aa: {}, erros: {} }, tr = []; const t0 = performance.now();
  for (const n of Object.keys(RECEITAS)) { try { const a = RECEITAS[n](sr); out.banco[n] = a; tr.push(a.buffer); } catch (e) { out.erros[n] = String(e && e.message || e); } }
  for (const n of NOMES_JOGADOR.concat(NOMES_NUCLEAR)) { try { const [L, R] = (/^nk:/.test(n) ? geraNuclear : geraJogador)(n, sr); out.jog[n] = [L, R]; tr.push(L.buffer); if (R.buffer !== L.buffer) tr.push(R.buffer); } catch (e) { out.erros[n] = String(e && e.message || e); } }
  for (const n of NOMES_AA) { try { const y = geraAA(n, SR_AA); out.aa[n] = y; tr.push(y.buffer); } catch (e) { out.erros[n] = String(e && e.message || e); } }
  out.ms = Math.round(performance.now() - t0); self.postMessage(out, tr); };
