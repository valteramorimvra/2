// v1.2.57 — CACHE PERSISTENTE dos sons sintetizados (IndexedDB) + geração em Web Worker.
// 1ª abertura de cada versão: o worker gera em paralelo (a thread do jogo segue livre) e o resultado é salvo.
// Próximas aberturas: lê pronto do aparelho em ~100 ms, sem nenhum cálculo de síntese.
const DB = 'nns-som', ST = 'sint';
function abre() { return new Promise((ok, err) => { try { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(ST); r.onsuccess = () => ok(r.result); r.onerror = () => err(r.error); } catch (e) { err(e); } }); }
async function le(chave) { try { const db = await abre(); return await new Promise((ok) => { const t = db.transaction(ST, 'readonly').objectStore(ST).get(chave); t.onsuccess = () => ok(t.result || null); t.onerror = () => ok(null); }); } catch (e) { return null; } }
async function grava(chave, v) { try { const db = await abre(); await new Promise((ok) => { const tx = db.transaction(ST, 'readwrite'); const s = tx.objectStore(ST); s.clear(); s.put(v, chave); tx.oncomplete = ok; tx.onerror = ok; tx.onabort = ok; }); } catch (e) { /* sem cache: segue normal */ } }
function noWorker(sr) { return new Promise((ok, err) => { let w; try { w = new Worker(new URL('./sintWorker.js', import.meta.url), { type: 'module' }); } catch (e) { err(e); return; }
  const to = setTimeout(() => { try { w.terminate(); } catch (e) {} err(new Error('worker timeout')); }, 60000);
  w.onmessage = (ev) => { clearTimeout(to); try { w.terminate(); } catch (e) {} ok(ev.data); }; w.onerror = (e) => { clearTimeout(to); try { w.terminate(); } catch (x) {} err(e); }; w.postMessage({ sr }); }); }
/** Devolve { banco, jog, aa, origem: 'cache'|'worker', ms } ou null (aí o NavalAudio gera na thread principal como antes). */
export async function sinteseSons(sr, versao) { const chave = `${versao}|${sr}`, t0 = performance.now();
  const c = await le(chave); if (c && c.banco && c.jog && c.aa) return Object.assign(c, { origem: 'cache', ms: Math.round(performance.now() - t0) });
  try { const r = await noWorker(sr); if (!r || !r.banco) return null; grava(chave, { banco: r.banco, jog: r.jog, aa: r.aa }); return Object.assign(r, { origem: 'worker', ms: Math.round(performance.now() - t0) }); } catch (e) { return null; } }
