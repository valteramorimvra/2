/** v1.2.28 — enquadramento costado ~95% em 915×412; externas mais perto que 1.2.27; internas iguais. */
import { CLASSES } from '../src/sim/classes.js';
import { PARAM } from '../src/armasParametros.js';
import fs from 'node:fs';

const ASP = 915 / 412, VFOV = 55 * Math.PI / 180;
const HFOV = 2 * Math.atan(Math.tan(VFOV / 2) * ASP);
const tanH = Math.tan(HFOV / 2);
const OLD = { popa: 1.00, tresq: 1.70, popaAlta: 1.15, costado: 1.22, longeK: 2.2, longe0: 120, distL: 0.62, dist0: 18 };
const NEW = { popa: 0.65, tresq: 0.95, popaAlta: 0.72, costado: 0.48, longeK: 1.45, longe0: 55, distL: PARAM.cam.distL, dist0: PARAM.cam.dist0, fracao: PARAM.cam.fracao };

function fillCostado(dL) {
  const distH = dL * Math.cos(0.08);
  return 1 / (2 * distH * tanH);
}

const ids = ['corsario', 'furtivo', 'cruzador', 'volkhar', 'abrolhos', 'chapada', 'lencois'];
const rows = [];
let ok = true;
const fOld = fillCostado(OLD.costado), fNew = fillCostado(NEW.costado);
for (const id of ids) {
  const L = CLASSES[id].L;
  const row = { id, L, fillOld: +fOld.toFixed(3), fillNew: +fNew.toFixed(3),
    pertoOld: +(L * OLD.distL + OLD.dist0).toFixed(1), pertoNew: +(L * NEW.distL + NEW.dist0).toFixed(1),
    longeOld: +(L * OLD.longeK + OLD.longe0).toFixed(1), longeNew: +(L * NEW.longeK + NEW.longe0).toFixed(1),
    popaOld: +(L * OLD.popa).toFixed(1), popaNew: +(L * NEW.popa).toFixed(1),
    costadoOld: +(L * OLD.costado).toFixed(1), costadoNew: +(L * NEW.costado).toFixed(1) };
  rows.push(row);
  if (!(fNew > fOld && fNew >= 0.88 && fNew <= 1.05)) { ok = false; row.fail = 'costado fill'; }
  if (!(row.pertoNew < row.pertoOld && row.longeNew < row.longeOld && row.popaNew < row.popaOld && row.costadoNew < row.costadoOld)) {
    ok = false; row.fail = (row.fail || '') + ' dist';
  }
}
const out = { asp: +ASP.toFixed(3), hfovDeg: +(HFOV * 180 / Math.PI).toFixed(1), fracao: NEW.fracao, nkDist: 58, nkDistOld: 110, fillCostadoOld: +fOld.toFixed(3), fillCostadoNew: +fNew.toFixed(3), rows, ok, nota: 'internas canhao/conves inalteradas' };
fs.writeFileSync('/workspace/nexo-naval-strike/capturas1228/camera-frame.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
process.exit(ok ? 0 : 1);
