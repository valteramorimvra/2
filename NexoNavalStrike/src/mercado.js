// Nexo Naval Strike v1.2.43 — MOEDA PRÓPRIA (Nexos), MERCADO (ofertas do dia, caixas e câmbio) e LOJA de pacotes.
// Tudo offline e fictício por enquanto: a loja credita na hora, sem cobrança (marcado na tela como compra de teste).
// Quando o jogo for para a Play Store, a loja troca o "creditar" por Google Play Billing + validação no servidor (Firebase).
import { CLASSES, ORDEM_CLASSES } from './sim/classes.js';
import { PINTURAS, PINTURAS_COMPRAVEIS, PRECO, Economia, loteCons } from './navalTechTreeEconomy.js'; import { ORDEM_CONS } from './naval5v5/consumiveis.js';

export const NEXOS = { nome: 'Nexos', sigla: 'NX', icone: '◆' };
export const DEV_NEXOS = 50_000; // reserva de teste (como a DEV de prata/ouro)

/* ---------- carteira com a 3ª moeda (estende a Economia sem mexer no save antigo) ---------- */
const P = Economia.prototype;
Object.defineProperty(P, 'nexos', { get() { const e = this.e; if (e.nexos == null) e.nexos = 0; if (!e.nexosDev) { e.nexos = Math.max(e.nexos, DEV_NEXOS); e.nexosDev = 1; } return e.nexos; } });
P.tem = function (moeda, v) { return (moeda === 'nexos' ? this.nexos : this.e[moeda] || 0) >= v; };
P.gasta = function (moeda, v) { if (!this.tem(moeda, v)) return false; if (moeda === 'nexos') this.e.nexos = this.nexos - v; else this.e[moeda] -= v; this.save.salva(); return true; };
P.credita = function (moeda, v) { if (moeda === 'nexos') this.e.nexos = this.nexos + v; else this.e[moeda] = (this.e[moeda] || 0) + v; this.save.salva(); };
/** Nexos ganhos na batalha: 1 por partida, +3 na vitória, +1 por navio afundado (máx. 8). */
export const nexosDaPartida = (r) => Math.min(8, 1 + (r.vitoria === true ? 3 : 0) + ((r.stats && r.stats.abates) || 0));

/* ---------- semente do dia (ofertas mudam à meia-noite) ---------- */
export const diaHoje = (d = new Date()) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const rng = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
export function tempoAteVirar(d = new Date()) { const f = new Date(d); f.setHours(24, 0, 0, 0); const s = Math.max(0, Math.round((f - d) / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h}h ${String(m).padStart(2, '0')}min`; }

/* ---------- OFERTAS DO DIA (6 cartões: navio premium, 2 pinturas, pacote de lotes, comandante de ouro, caixa com desconto) ---------- */
export function ofertasDoDia(eco, dia = diaHoje()) { const R = rng(dia * 7 + 13); const pick = (L) => L[Math.floor(R() * L.length)]; const out = [];
  const prem = ORDEM_CLASSES.filter((k) => CLASSES[k].premium && PRECO[k] && PRECO[k].ouro && !eco.possui(k));
  if (prem.length) { const k = pick(prem), o = PRECO[k].ouro, desc = [0.25, 0.3, 0.4][Math.floor(R() * 3)]; out.push({ id: 'navio:' + k, tipo: 'navio', k, titulo: CLASSES[k].nome, sub: CLASSES[k].classe, foto: `fotos/navios/${k}.webp`, moeda: 'nexos', preco: Math.round(o * (1 - desc) / 10 / 50) * 50, de: Math.round(o / 10), desc, destaque: 1 }); }
  const pint = PINTURAS_COMPRAVEIS.filter((p) => !eco.possuiPintura(p) && (PINTURAS[p].ouro || PINTURAS[p].prata)); for (let i = 0; i < 2 && pint.length; i++) { const p = pint.splice(Math.floor(R() * pint.length), 1)[0], P0 = PINTURAS[p], base = P0.ouro ? P0.ouro / 10 : P0.prata / 1000, desc = [0.2, 0.35, 0.5][Math.floor(R() * 3)]; out.push({ id: 'pint:' + p, tipo: 'pintura', p, titulo: P0.nome, sub: P0.lendaria ? 'Pintura LENDÁRIA' : P0.heroica ? 'Pintura HEROICA' : 'Camuflagem', moeda: 'nexos', preco: Math.max(50, Math.round(base * (1 - desc) / 10) * 10), de: Math.max(60, Math.round(base)), desc, cores: P0.cores }); }
  out.push({ id: 'lotes', tipo: 'lotes', titulo: 'Paiol completo ×5', sub: 'AP, SAP, tandem, iscas e reparos ouro', moeda: 'nexos', preco: 900, de: 1500, desc: 0.4 });
  out.push({ id: 'caixa:ouro', tipo: 'caixa', caixa: 'ouro', titulo: 'Caixa Ouro', sub: 'Pintura heroica/lendária garantida a cada 10', moeda: 'nexos', preco: 3200, de: 4000, desc: 0.2 });
  out.push({ id: 'ouro', tipo: 'moeda', titulo: '25.000 de ouro', sub: 'Câmbio especial do dia', moeda: 'nexos', preco: 2000, de: 2500, desc: 0.2, credito: { ouro: 25_000 } });
  return out; }
export function comprarOferta(eco, o, save) { const comp = (save.d.mercado = save.d.mercado || { dia: 0, ok: {} }); if (comp.dia !== diaHoje()) { comp.dia = diaHoje(); comp.ok = {}; } if (comp.ok[o.id]) return { ok: false, motivo: 'Oferta já resgatada hoje' };
  if (o.tipo === 'navio' && eco.possui(o.k)) return { ok: false, motivo: 'Você já tem este navio' }; if (o.tipo === 'pintura' && eco.possuiPintura(o.p)) return { ok: false, motivo: 'Você já tem esta pintura' };
  if (!eco.gasta(o.moeda, o.preco)) return { ok: false, motivo: `${NEXOS.nome} insuficientes` };
  if (o.tipo === 'navio') { eco.e.possui[o.k] = 1; eco.e.pesquisados[o.k] = 1; }
  else if (o.tipo === 'pintura') { (eco.e.pinturasPossui = eco.e.pinturasPossui || {})[o.p] = 1; }
  else if (o.tipo === 'lotes') { for (const t of ['sap', 'ap', 'tandem', 'iscaOuro', 'reparoOuro']) eco.e.lotes[t] = (eco.e.lotes[t] || 0) + 5; for (const kk of ORDEM_CONS) { const l = loteCons(kk, 'ouro'); eco.e.lotes[l] = (eco.e.lotes[l] || 0) + 5; } }
  else if (o.tipo === 'caixa') { comp.ok[o.id] = 1; save.salva(); return Object.assign(abreCaixa(eco, o.caixa, save, true), { ok: true }); }
  else if (o.credito) for (const m in o.credito) eco.credita(m, o.credito[m]);
  comp.ok[o.id] = 1; save.salva(); return { ok: true }; }

/* ---------- CAIXAS (tabela de prêmios sempre visível, como exige a Play Store para itens aleatórios) ---------- */
export const CAIXAS = {
  bronze: { nome: 'Caixa Bronze', preco: 400, cor: '#b87333', premios: [[46, 'prata', 150_000, 600_000], [30, 'lotes', 2, 4], [20, 'ouro', 300, 1_200], [4, 'pintura', 'comum']] },
  prata: { nome: 'Caixa Prata', preco: 1_200, cor: '#c0c7cf', premios: [[34, 'prata', 600_000, 2_000_000], [26, 'ouro', 1_200, 5_000], [24, 'lotes', 4, 8], [14, 'pintura', 'comum'], [2, 'pintura', 'heroica']] },
  ouro: { nome: 'Caixa Ouro', preco: 4_000, cor: '#f2c14e', garantia: 10, premios: [[30, 'ouro', 5_000, 20_000], [24, 'prata', 2_000_000, 6_000_000], [24, 'pintura', 'comum'], [16, 'pintura', 'heroica'], [5, 'pintura', 'lendaria'], [1, 'navio', 'premium']] },
};
export function abreCaixa(eco, id, save, jaPaga = false) { const C = CAIXAS[id]; if (!C) return { ok: false, motivo: 'Caixa inválida' }; if (!jaPaga && !eco.gasta('nexos', C.preco)) return { ok: false, motivo: `${NEXOS.nome} insuficientes` };
  const g = (save.d.caixas = save.d.caixas || {}); g[id] = (g[id] || 0) + 1; const R = Math.random;
  let tab = C.premios; if (C.garantia && g[id] % C.garantia === 0) tab = tab.filter((p) => p[1] === 'pintura' && p[2] !== 'comum'); /* garantia: a cada 10 caixas ouro, pintura heroica ou lendária */
  const tot = tab.reduce((s, p) => s + p[0], 0); let x = R() * tot, pr = tab[0]; for (const p of tab) { x -= p[0]; if (x <= 0) { pr = p; break; } }
  const [, tipo, a, b] = pr; const rnd = (lo, hi) => Math.round((lo + R() * (hi - lo)) / 1000) * 1000 || Math.round(lo + R() * (hi - lo));
  if (tipo === 'prata' || tipo === 'ouro') { const v = tipo === 'ouro' ? Math.round(a + R() * (b - a)) : rnd(a, b); eco.credita(tipo, v); return { tipo, v, txt: `${v.toLocaleString('pt-BR')} de ${tipo}` }; }
  if (tipo === 'lotes') { const n = Math.round(a + R() * (b - a)); for (const t of ['sap', 'ap', 'tandem']) eco.e.lotes[t] = (eco.e.lotes[t] || 0) + n; save.salva(); return { tipo, v: n, txt: `${n} lotes de cada munição especial` }; }
  if (tipo === 'pintura') { const L = PINTURAS_COMPRAVEIS.filter((p) => !eco.possuiPintura(p) && (a === 'lendaria' ? PINTURAS[p].lendaria : a === 'heroica' ? PINTURAS[p].heroica : !PINTURAS[p].lendaria && !PINTURAS[p].heroica)); if (!L.length) { eco.credita('ouro', 8_000); return { tipo: 'ouro', v: 8_000, txt: 'Coleção completa — 8.000 de ouro' }; } const p = L[Math.floor(R() * L.length)]; (eco.e.pinturasPossui = eco.e.pinturasPossui || {})[p] = 1; save.salva(); return { tipo, p, txt: `Pintura ${PINTURAS[p].nome}`, raro: a !== 'comum' }; }
  if (tipo === 'navio') { const L = ORDEM_CLASSES.filter((k) => CLASSES[k].premium && !eco.possui(k)); if (!L.length) { eco.credita('ouro', 50_000); return { tipo: 'ouro', v: 50_000, txt: '50.000 de ouro' }; } const k = L[Math.floor(R() * L.length)]; eco.e.possui[k] = 1; eco.e.pesquisados[k] = 1; save.salva(); return { tipo, k, txt: `Navio ${CLASSES[k].nome}!`, raro: 1 }; }
  return { tipo: 'nada', txt: '—' }; }
export const chanceTxt = (C) => { const tot = C.premios.reduce((s, p) => s + p[0], 0); const nome = { prata: 'Prata', ouro: 'Ouro', lotes: 'Lotes de munição', pintura: 'Pintura', navio: 'Navio premium' }; return C.premios.map((p) => `${nome[p[1]]}${p[1] === 'pintura' ? ' ' + p[2] : ''}: ${(p[0] / tot * 100).toFixed(p[0] / tot < 0.02 ? 1 : 0)}%`); };

/* ---------- CÂMBIO ---------- */
export const CAMBIO = [{ id: 'nx_ouro', de: 'nexos', para: 'ouro', taxa: 10, txt: '1 NX → 10 de ouro' }, { id: 'ouro_prata', de: 'ouro', para: 'prata', taxa: 400, txt: '1 de ouro → 400 de prata' }];
export function trocar(eco, c, qtd) { qtd = Math.max(1, Math.floor(qtd)); if (!eco.gasta(c.de, qtd)) return { ok: false, motivo: 'Saldo insuficiente' }; eco.credita(c.para, qtd * c.taxa); return { ok: true, v: qtd * c.taxa }; }

/* ---------- LOJA (pacotes; preço em reais apenas ilustrativo — compra de TESTE credita sem cobrança) ---------- */
export const LOJA = {
  nexos: [{ id: 'nx1', q: 500, bonus: 0, rs: 4.9 }, { id: 'nx2', q: 1_200, bonus: 100, rs: 9.9 }, { id: 'nx3', q: 2_600, bonus: 300, rs: 19.9, tag: 'Mais vendido' }, { id: 'nx4', q: 6_500, bonus: 1_000, rs: 49.9 }, { id: 'nx5', q: 14_000, bonus: 3_000, rs: 99.9, tag: 'Melhor valor' }],
  ouro: [{ id: 'au1', q: 5_000, rs: 4.9 }, { id: 'au2', q: 12_000, rs: 9.9 }, { id: 'au3', q: 30_000, rs: 19.9 }, { id: 'au4', q: 80_000, rs: 49.9 }],
  prata: [{ id: 'ag1', q: 2_000_000, rs: 4.9 }, { id: 'ag2', q: 5_000_000, rs: 9.9 }, { id: 'ag3', q: 12_000_000, rs: 19.9 }, { id: 'ag4', q: 30_000_000, rs: 49.9 }],
};
export function compraLoja(eco, moeda, id) { const p = (LOJA[moeda] || []).find((q) => q.id === id); if (!p) return { ok: false }; const v = p.q + (p.bonus || 0); eco.credita(moeda, v); return { ok: true, v }; }
/* Nexos da partida entram junto com a prata/ouro (aparece no resultado como g.nexos). */
{ const orig = P.creditar; P.creditar = function (r, k) { const g = orig.call(this, r, k); if (g && !r.pers) { g.nexos = nexosDaPartida(r); this.credita('nexos', g.nexos); } return g; }; }
