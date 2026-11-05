// v1.2.19 item 5: pré-calcula (offline) as máscaras de linha de tiro das 47 classes a partir dos TRIÂNGULOS REAIS dos modelos 3D
// e grava src/sim/mascarasLT.js (bits em base64). No app: 0 ms de geração na carga da partida; a simulação usa as mesmas máscaras.
// Uso: node tools/geraMascarasLT.mjs   (o teste tests/linhaTiro1219.mjs confere que o arquivo está em dia com os modelos)
import './shimdoc.mjs'; import fs from 'node:fs';
const _l = console.log; console.log = (...a) => { if (typeof a[0] === 'string' && a[0].startsWith('THREE')) return; _l(...a); }; console.warn = () => {};
const R = new URL('../src/', import.meta.url).pathname; process.env.LT_GERA = '1'; globalThis.__ltGera = 1;
const SM = await import(R + 'render/shipModels.js'); const { CLASSES } = await import(R + 'sim/classes.js'); const LT = await import(R + 'sim/linhaTiro.js');
const out = {}; let n = 0; for (const k of Object.keys(CLASSES)) { delete LT.MASC[k]; SM.esqueceModelo(k); SM.criaNavio3D(k, 0); const M = LT.MASC[k]; out[k] = {}; for (const t of ['ciws', 'a30', 'sec', 'laser']) { out[k][t] = (M[t] || []).map(LT.empacota); n += out[k][t].length; } }
const txt = '// GERADO por tools/geraMascarasLT.mjs (v1.2.19 item 5) — NÃO editar à mão. Máscaras de linha de tiro (1 bit por célula az×el, 1 = bloqueado).\nexport const MASC_PRE = ' + JSON.stringify(out) + ';\n';
fs.writeFileSync(R + 'sim/mascarasLT.js', txt); _l(`${Object.keys(out).length} classes · ${n} montagens · ${txt.length} bytes`);
