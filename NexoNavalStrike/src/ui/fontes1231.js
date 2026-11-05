// v1.2.31 — LIGAÇÃO do manual/tutorial com os dados REAIS do jogo (só leitura; nada aqui altera o jogo).
// Caminhos relativos já pensados para src/ui/ do jogo. Se a 1.2.30/1.2.31 mudar um valor, o manual muda junto.
import { CLASSES, MISSEIS, TORPEDO, SAM, HELIS, TELEG } from '../sim/classes.js';
import { PARAM, recargaMinCal } from '../armasParametros.js';
import { CIWS, A30, LASER } from '../naval5v5/defesa.js';
import { NUK } from '../sim/nuclear.js';
import { CONS, ORDEM_CONS } from '../naval5v5/consumiveis.js';
import { CAMO_AEREO, ORDEM_CAMO_AEREO } from '../camoAereo.js';
import { PINTURAS } from '../navalTechTreeEconomy.js';
import { PAISES } from '../render/bandeiras.js';
import { fracMissil, fracTorpedo, hpRef } from '../naval5v5/danoReal.js';
import { NOS } from '../sim/util.js';
import { NOVOS_1231 } from './fontesNovos1231.js';
import * as WORLD from '../sim/world.js';
import { TIPO_NAVIO } from '../navalTechTreeEconomy.js';

// Regras da 1.2.30 lidas do jogo SÓ depois que a 1.2.30 estiver integrada (world.recargaVlsSeg existe = FINAL-06). Antes disso fica vazio → o texto mostra PENDENTE (nunca um número antigo/inventado).
const vlsRec = {}; if (typeof WORLD.recargaVlsSeg === 'function') for (const [id, t] of Object.entries(TIPO_NAVIO)) if (CLASSES[id] && vlsRec[t] === undefined) vlsRec[t] = WORLD.recargaVlsSeg(id);
export const V1230 = typeof WORLD.recargaVlsSeg === 'function' ? { vlsRec } : {};

export const FONTES_1231 = { v1230: V1230, CLASSES, MISSEIS, TORPEDO, SAM, HELIS, TELEG, PARAM, recargaMinCal, CIWS, A30, LASER, NUK, CONS, ORDEM_CONS, CAMO_AEREO, ORDEM_CAMO_AEREO, PINTURAS, PAISES, fracMissil, fracTorpedo, hpRef, NOS, novos: NOVOS_1231 };
