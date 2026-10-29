import { SILH_1225 } from '../render/aereo1225.js'; /* v1.2.25 */
import { SILH_1226 } from '../render/aereo1226.js'; /* v1.2.26 */
// v1.2.15 (V) — SILHUETAS laterais corretas de cada aeronave (desenho original, vetorial, sem marcas reais): mesma
// configuração que o modelo 3D de cada uma (rotor de cauda / coaxial / tandem / cabine grande / caça VTOL / drone).
const S = (corpo) => `<svg class="silh" viewBox="0 0 64 26" aria-hidden="true"><g fill="currentColor" stroke="currentColor" stroke-linejoin="round">${corpo}</g></svg>`;
const rotor = (x, y, w = 46) => `<rect x="${x - w / 2}" y="${y}" width="${w}" height="1.3" rx=".6"/><rect x="${x - 0.9}" y="${y}" width="1.8" height="3.2"/>`;
export const SILH = {
  // leve: cabine bolha pequena, cauda fina, esquis
  leve: S(`${rotor(28, 4, 40)}<path d="M18 10q2-3 9-3h6q5 0 6 4l1 3q0 2-3 2H22q-5 0-4-6z"/><path d="M38 11h18l3-4h2l-1 7-22 1z" stroke-width=".4"/><circle cx="60" cy="11" r="2.4" fill="none" stroke-width=".9"/><path d="M20 19h20M24 16v3M35 16v3" fill="none" stroke-width="1.1"/>`),
  // multimissão: fuselagem média, nariz de radar, trem de rodas, 2 mísseis sob a fuselagem
  multi: S(`${rotor(30, 3, 48)}<path d="M12 12q0-4 8-5h14q7 0 8 5v4q0 2-3 2H16q-4 0-4-6z"/><path d="M41 10h14l4-5h2l-1 8-19 2z" stroke-width=".4"/><circle cx="60" cy="9" r="2.6" fill="none" stroke-width=".9"/><rect x="18" y="19" width="14" height="1.8" rx=".9"/><circle cx="17" cy="22" r="1.4"/><circle cx="36" cy="22" r="1.4"/>`),
  // ASW: fuselagem média com torpedo leve e sonar de imersão (cabo)
  asw: S(`${rotor(30, 3, 48)}<path d="M12 12q0-4 8-5h14q7 0 8 5v4q0 2-3 2H16q-4 0-4-6z"/><path d="M41 10h14l4-5h2l-1 8-19 2z" stroke-width=".4"/><circle cx="60" cy="9" r="2.6" fill="none" stroke-width=".9"/><rect x="20" y="19.2" width="11" height="1.6" rx=".8"/><path d="M33 18v5" fill="none" stroke-width=".7"/><rect x="31.8" y="22.6" width="2.4" height="2.4" rx=".6"/>`),
  // ataque: fuselagem ESTREITA, cabine em tandem (dois degraus), asas curtas com casulos de foguetes, canhão no queixo
  ataque: S(`${rotor(30, 3, 48)}<path d="M10 14l5-5h5l2-2h6l2 2h4q6 0 8 4v3H14z"/><path d="M42 12h14l3-6h2l-1 9-18 1z" stroke-width=".4"/><path d="M58 6v8" fill="none" stroke-width="1.2"/><rect x="22" y="15.5" width="12" height="1.4"/><rect x="21" y="17" width="5" height="2.6" rx="1"/><rect x="29" y="17" width="5" height="2.6" rx="1"/><path d="M13 15l-4 2" fill="none" stroke-width="1.1"/><path d="M16 21h22" fill="none" stroke-width="1"/>`),
  // coaxial: DOIS rotores empilhados, sem rotor de cauda, cauda curta com duas derivas
  coaxial: S(`${rotor(27, 1.5, 42)}${rotor(27, 4.5, 42)}<path d="M14 12q0-4 7-5h12q6 0 7 5v4q0 2-3 2H17q-3 0-3-6z"/><path d="M39 11h13l1 4-14 1z" stroke-width=".4"/><path d="M51 7v9M54 7v9" fill="none" stroke-width="1.4"/><circle cx="18" cy="21" r="1.4"/><circle cx="35" cy="21" r="1.4"/>`),
  // utilitário: cabine GRANDE e alta com porta lateral, metralhadora na porta, rodas
  utilitario: S(`${rotor(30, 2.5, 50)}<path d="M10 13q0-6 9-7h17q7 0 7 6v5q0 2-3 2H14q-4 0-4-6z"/><rect x="23" y="9" width="9" height="7" rx=".8" fill="#0b1220" stroke="none"/><path d="M42 10h13l4-5h2l-1 8-18 2z" stroke-width=".4"/><circle cx="60" cy="9" r="2.6" fill="none" stroke-width=".9"/><path d="M27 13h-7" fill="none" stroke-width="1"/><circle cx="16" cy="22" r="1.5"/><circle cx="37" cy="22" r="1.5"/>`),
  // caça VTOL: jato de asa média, nariz pontudo, entrada de ar lateral, deriva, bocais orientáveis
  jato: S(`<path d="M4 14l10-3h26l12-7h4l-3 9 7 1v2l-8 1H14z"/><path d="M22 14l14 0-6 6h-4z" stroke-width=".4"/><rect x="24" y="11" width="5" height="3" rx="1" fill="#0b1220" stroke="none"/><path d="M14 11q3-3 8-3l3 3z"/><circle cx="31" cy="18" r="1.3" fill="#0b1220" stroke="none"/>`),
  // drone (UAV de asa fixa): fuselagem fina, asa reta longa, cauda em V, hélice traseira
  uav: S(`<path d="M8 13q2-2 8-2h26q4 0 6 2-2 2-6 2H16q-6 0-8-2z"/><path d="M22 12l6-8h3l-2 8zM22 14l6 8h3l-2-8z" stroke-width=".4"/><path d="M48 13l6-6h2l-3 6 3 6h-2z" stroke-width=".4"/><path d="M58 9v8" fill="none" stroke-width="1.2"/>`),
  // caça do porta-aviões (CATOBAR): asa enflechada, dupla deriva, gancho
  caca: S(`<path d="M3 14l11-3h24l10-6h4l-2 8 9 1v2l-9 1H14z"/><path d="M22 14h16l-8 7h-4z" stroke-width=".4"/><path d="M14 11q3-3 8-3l3 3z"/><path d="M52 16l5 4" fill="none" stroke-width=".9"/>`),
  // v1.2.16: helicóptero pesado de ataque Tufão (mesma escola do ataque, maior)
  get tufao() { return this.ataque; },
};
Object.assign(SILH, SILH_1225, SILH_1226); /* v1.2.25 + v1.2.26 */
export const silh = (id) => SILH[id] || SILH.leve;
