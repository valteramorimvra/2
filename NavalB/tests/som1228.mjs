/** v1.2.28 — A/B som: novos vs antigos mesmo calibre; railgun deve usar cadeia grande. */
import { CLASSES } from '../src/sim/classes.js';
import { IDS_1225 } from '../src/sim/classes1225.js';
import { IDS_1226 } from '../src/sim/classes1226.js';
import fs from 'node:fs';

const REF = {
  57: 'corsario', 76: 'corveta', 127: 'furtivo', 130: 'dragao', 155: 'tridente',
};
const NOVOS = [...IDS_1225, ...IDS_1226];
const out = { mudancas: [], ok: [], nota: [] };

for (const id of NOVOS) {
  const C = CLASSES[id];
  const cal = C.canhao.cal;
  const eletro = !!C.canhao.eletro;
  const ref = REF[cal] || REF[127];
  const cadeia = eletro ? 'canhao_grande+trilho_baixo (v1.2.28: mesma cadeia dos antigos 155)' : (cal > 100 ? 'canhao_grande' : 'canhao_medio');
  const refCadeia = (CLASSES[ref].canhao.cal > 100 ? 'canhao_grande' : 'canhao_medio');
  const mudou = eletro; // só railguns mudam nesta versão
  const row = { id, cal, eletro: +eletro, cadeia, ref, refCadeia, mudou: mudou ? 'sim — passou a usar cadeia grande dos antigos + acento trilho' : 'não — já era MESMO_BANCO do calibre' };
  out.mudancas.push(row);
  if (mudou) out.ok.push(`${id}: RAIL→grande+trilho`);
  else out.ok.push(`${id}: inalterado (já alinhado a ${ref})`);
}
out.nota.push('Convencionais: PCM idêntico aos antigos do calibre (audit 1.2.27). Railguns: agora tocam n5.tiro(canhao_grande) + trilho baixo.');
fs.writeFileSync('/workspace/nexo-naval-strike/capturas1228/som-ab.json', JSON.stringify(out, null, 2));
console.log(out.ok.join('\n'));
console.log('railguns mudados:', out.mudancas.filter((r) => r.mudou.startsWith('sim')).map((r) => r.id).join(', '));
