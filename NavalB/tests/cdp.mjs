// Cliente CDP mínimo (Chrome headless com WebGL por SwiftShader) — captura exceções e console.error.
import { spawn } from 'node:child_process'; import fs from 'node:fs';
import { WebSocket as WS } from 'ws';
if (typeof globalThis.WebSocket === 'undefined') globalThis.WebSocket = WS;
export async function abre(url, { w = 915, h = 412, autoplay = 'no-user-gesture-required' } = {}) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const pr = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--autoplay-policy=${autoplay}`, `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/nns${port}`, `--window-size=${w},${h}`, 'about:blank'], { stdio: 'ignore' });
  let lst; for (let i = 0; i < 60; i++) { try { lst = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (lst.find((t) => t.type === 'page')) break; } catch (e) {} await new Promise((r) => setTimeout(r, 200)); }
  process.on('exit', () => { try { pr.kill('SIGKILL'); } catch (e) {} }); /* v1.2.15: nunca deixa Chrome órfão */
  const ws = new WebSocket(lst.find((t) => t.type === 'page').webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(); const erros = [], avisos = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Runtime.exceptionThrown') erros.push('EXC ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 300)); else if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) (d.params.type === 'error' ? erros : avisos).push(d.params.type + ' ' + d.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300)); else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') erros.push('LOG ' + d.params.entry.text.slice(0, 300) + ' ' + (d.params.entry.url || '')); };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  const ev = async (expr, ms = 60000) => { const r = await Promise.race([send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), new Promise((ok) => setTimeout(() => ok({ result: { result: { value: '__timeout' } } }), ms))]); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text); return r.result.result.value; };
  const vai = async (u) => { await send('Page.navigate', { url: u }); await new Promise((r) => setTimeout(r, 3000)); };
  const foto = async (arq, clip) => { const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); fs.writeFileSync(arq, Buffer.from(r.result.data, 'base64')); };
  const tam = async (w2, h2) => send('Emulation.setDeviceMetricsOverride', { width: w2, height: h2, deviceScaleFactor: 1, mobile: true });
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  if (url) await vai(url);
  return { ev, vai, foto, tam, espera, erros, avisos, send, fecha: () => { ws.close(); pr.kill('SIGKILL'); } };
}
