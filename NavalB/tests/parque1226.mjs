import { CLASSES } from '../src/sim/classes.js';
import { vagasParque1226 } from '../src/render/extras1226.js';
for (const k of ['chapada','lencois']) { const v = vagasParque1226(CLASSES[k]); const c = {}; for (const x of v) c[x.tipo] = (c[x.tipo]||0)+1; console.log(k, CLASSES[k].parque, v.length, JSON.stringify(c)); }
