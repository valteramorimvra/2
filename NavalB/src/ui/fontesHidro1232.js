// 1.2.32 — dados do hidroavião para o manual (NÃO importado na 1.2.31). Para ligar: importe este arquivo em fontes1231.js,
// faça `novos: { ...NOVOS_1231, hidro: HIDRO_1232 }` e troque LIGAR_1232 para true em manualDados1231.js.
import { HIDRO_D, RESUMO_DADOS } from '../sim/dadosHidro1231.js';
export const HIDRO_1232 = { D: HIDRO_D, RESUMO: RESUMO_DADOS };
