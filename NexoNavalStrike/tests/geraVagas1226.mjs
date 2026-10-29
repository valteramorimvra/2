// v1.2.26: gera src/render/vagas1226.js (vagas do parque pré-calculadas — evita ~0,7 s de CPU por gigante ao montar o modelo). Rode após mudar PLANO_PA/parque.
import fs from 'node:fs'; import { CLASSES } from '../src/sim/classes.js'; import { vagas0 } from '../src/render/extras1226.js';
const o = {}; for (const k of Object.keys(CLASSES)) if (CLASSES[k].gigaPA) o[k] = vagas0(CLASSES[k]).map((v) => [v.tipo, +v.x.toFixed(2), +v.z.toFixed(2), +v.rot.toFixed(4)]);
fs.writeFileSync(new URL('../src/render/vagas1226.js', import.meta.url), '// GERADO por tests/geraVagas1226.mjs — não editar\nexport const VAGAS1226 = ' + JSON.stringify(o) + ';\n'); console.log(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.length])));
