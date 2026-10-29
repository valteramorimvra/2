// MatchManager: monta as frotas em spawns opostos (4.000 m), cronômetro, zona marítima central e condições de fim.
import { marcacao, clamp } from './util.js';
import { alturaTerreno, distTerra } from './maps.js';
import { CLASSES, ORDEM_HELIS } from './classes.js';
import { esquadras, poder, poderLista } from './esquadra.js';
import { NOMES_BOT, NOME_JOGADOR } from '../navalComandantes.js';
import { pinturaBot, modsDe } from '../navalTechTreeEconomy.js';
import { pegaVaga, aproximaTime } from './spawnCantos.js'; /* v1.2.25 item 13 */

export const ZONA_TEMPO = 75;      // s acumulados controlando a zona sozinho para vencer
export const DURACAO = { treino: 900, frota: 600, duelo: 600 /* v1.2.11: batalhas de 10 min */ /* v1.2.2: partidas de 5–8 min */ };
// Papéis táticos do 5x5: 2 destróieres batedores, 2 cruzadores de ataque, 1 nau-capitânia
export const COMPOSICAO = [['batedor', 'destroier'], ['batedor', 'furtivo'], ['ataque', 'cruzador'], ['ataque', 'fragata'], ['capitania', 'capitania']];
export const papelDaClasse = (tipo) => (CLASSES[tipo] && CLASSES[tipo].pf) || (['capitania', 'dragao', 'aurora'].includes(tipo) ? 'capitania' : ['cruzador', 'fragata', 'tempestade', 'leviata'].includes(tipo) ? 'ataque' : 'batedor');
/** v1.2.0: bots de NACIONALIDADES MISTAS — cada vaga do 5x5 sorteia (determinístico pela semente) um navio do papel. */
export const POOL_PAPEL = { batedor: ['destroier', 'furtivo', 'corveta', 'corsario', 'sentinela', 'tridente'], ataque: ['cruzador', 'fragata', 'tempestade', 'leviata', 'dragao'], capitania: ['capitania', 'dragao', 'aurora'] };
for (const k of Object.keys(CLASSES)) { const pf = CLASSES[k].pf; if (pf && !CLASSES[k].mercante && !CLASSES[k].civil && !CLASSES[k].porta && !CLASSES[k].lendario && !POOL_PAPEL[pf].includes(k)) POOL_PAPEL[pf].push(k); }
export const COMPOSICAO8 = [['batedor', 'destroier'], ['batedor', 'furtivo'], ['batedor', 'fragata'], ['ataque', 'cruzador'], ['ataque', 'fragata'], ['ataque', 'destroier'], ['ataque', 'tempestade'], ['capitania', 'capitania']]; /* v1.2.11: 8 navios por time */
function composicaoMista(rng, base = COMPOSICAO8) { const out = []; const usados = new Set(); for (const [papel] of base) { let pool = POOL_PAPEL[papel].filter((k) => !usados.has(k)); if (!pool.length) pool = POOL_PAPEL[papel]; const k = pool[Math.floor(rng.next() * pool.length)] || POOL_PAPEL[papel][0]; usados.add(k); out.push([papel, k]); } return out; }

export class MatchManager {
  constructor({ modo = 'frota', classeJogador = 'destroier', classeRival = null, jogadorOpc = null, mista = true, portaAvioes = false, mercantes = false, pers = null }) { this.pers = pers; this.portaAvioes = portaAvioes; this.mercantes = mercantes; this.merc = { azul: 0, vermelho: 0 }; this.jogadorOpc = jogadorOpc; this.mista = mista; this.modo = modo; this.classe = classeJogador; this.classeRival = classeRival || classeJogador; this.tempo = 0; this.duracao = (pers && pers.duracao) || DURACAO[modo] || 600; this.zona = { azul: 0, vermelho: 0, dono: null, disputada: 0 }; this.jogadorId = 0; }
  monta(sim) {
    if (this.pers) { const P0 = sim.T.plano; sim.T.plano = { ...P0, azul: { ...P0.azul }, vermelho: { ...P0.vermelho }, vagas: P0.vagas ? JSON.parse(JSON.stringify(P0.vagas)) : null }; } /* v1.2.18: cópia — o ajuste das bases (item 11) nunca altera o plano do mapa */
    const sorteioL = !!(sim.T.def && sim.T.def.ladoSorteio && this.modo !== 'treino' && ((Math.imul(sim.rng.s, 2654435761) >>> 16) & 1)); /* v1.2.25 item 9: mapas com canto vantajoso medido sorteiam (pela semente, sem consumir o rng) qual lado fica com cada canto → equilíbrio esperado 50/50 */
    if (!!globalThis.__nnsTrocaLado !== sorteioL && !sim.T._trocado) { const P0 = sim.T.plano; sim.T.plano = { ...P0, azul: P0.vermelho, vermelho: P0.azul, vagas: P0.vagas ? { azul: P0.vagas.vermelho, vermelho: P0.vagas.azul } : P0.vagas }; sim.T._trocado = 1; } /* só teste de espelho: troca os CANTOS dos lados */
    const P = sim.T.plano; this.centro = P.centro; sim.match = this; P._uso = {}; /* v1.2.25 item 13: vagas da formação zeradas a cada partida */
    const coloca = (time, base, alvo, lista) => { const rumo = marcacao(base.x, base.z, alvo.x, alvo.z); const px = Math.cos(rumo), pz = Math.sin(rumo); // perpendicular (boreste)
      lista.forEach(([papel, tipo], i) => { const off = (i - (lista.length - 1) / 2) * (lista.length > 5 ? 330 : 380); let x = base.x + px * off, z = base.z + pz * off; const C = CLASSES[tipo]; let rumoN = rumo;
        const vg = this.modo !== 'treino' ? pegaVaga(P, time, this.modo === 'duelo' && !C.mercante ? 'jogador' : papel, C, sim.T) : null; /* v1.2.25 item 13: vaga da FORMAÇÃO no canto do time (duelo: os dois no centro do núcleo = mesma distância) */
        if (vg) { x = vg.x; z = vg.z; rumoN = vg.rumo; } else
        // recua para o centro até achar água funda e livre
        for (let k = 0; k < 40 && (alturaTerreno(sim.T, x, z) > -(C.T + 2.5) || distTerra(sim.T, x, z) < C.L * 0.6); k++) { const alvo = k < 14 ? base : P.centro; x += (alvo.x - x) * 0.1; z += (alvo.z - z) * 0.1; }
        const opc = papel === 'jogador' ? Object.assign({ comandante: NOME_JOGADOR }, this.jogadorOpc || {}) : this.opcBot(sim, time, tipo, nomes); const ex = lista[i][2]; if (ex && ex.pintura) opc.pintura = ex.pintura; if (papel !== 'jogador' && !opc.mods && opc.pintura) opc.mods = modsDe(tipo, { pintura: opc.pintura }); /* v1.2.21 item 19: bot com pintura recebe o MESMO efeito (casco reforçado/RCS) que o jogador */ if (this.pers && this.pers.camoAereo && this.pers.camoAereo[time]) opc.camoAereo = this.pers.camoAereo[time]; /* v1.2.17 13i: camuflagem das aeronaves por lado na personalizada */ /* v1.2.16 BATALHA PERSONALIZADA: camuflagem escolhida */
        const nv = sim.adicionaNavio(time, tipo, x, z, rumoN, papel, opc); if (nv && lista[i][3]) nv.funcao = lista[i][3]; /* v1.2.25 item 9 */ if (ex && ex.perso && nv) nv.agrIA = ex.perso === 'agressivo' ? 0.95 : ex.perso === 'cauteloso' ? 0.3 : 0.62; }); };
    const nomes = new Set();
    if (this.modo === 'treino') { /* v1.2.5 TESTE DRIVE: navio do jogador perto de uma ilha + alvos fixos e móveis que não atiram */
      coloca('azul', P.azul, P.centro, [['jogador', this.classe]]); const n = sim.navios[0]; this.jogadorId = 0; sim.ameacas && (sim.ameacas.ligadas = 0);
      const alvos = [[2600, -0.25, 0], [3400, 0.2, 0], [4300, -0.05, 0], [3000, 0.55, 1], [4800, 0.35, 1]]; this.alvos = [];
      alvos.forEach(([d, da, mov], i) => { let x = 0, z = 0, ok = false; for (let k = 0; k < 30 && !ok; k++) { const b = n.rumo + da + (k % 2 ? 1 : -1) * k * 0.09, dd = d * (1 - k * 0.012); x = n.x + Math.sin(b) * dd; z = n.z - Math.cos(b) * dd; ok = alturaTerreno(sim.T, x, z) < -8 && distTerra(sim.T, x, z) > 160; }
        const a = sim.adicionaNavio('vermelho', mov ? 'corveta' : 'fragata', x, z, n.rumo + Math.PI / 2 * (i % 2 ? 1 : -1), 'alvo', { comandante: mov ? `Alvo-drone ${i - 2}` : `Barcaça-alvo ${i + 1}`, pintura: 'cinza_naval' });
        a.vls = 0; a.torp = 0; a.sam = 0; a.chaff = 0; a.ciws.length = 0; a.a30.length = 0; a.alvoMovel = mov; a.telAlvo = mov ? 2 : 1; a.lemeCmd = mov ? (i % 2 ? 0.22 : -0.22) : 0; this.alvos.push(a.id); });
      sim.navios.forEach((q) => { q.radarAtivo = q.papel === 'jogador' ? 1 : 0; }); n.telAlvo = 1; return this; }
    if (this.modo === 'duelo') { coloca('azul', P.azul, P.vermelho, [['jogador', this.classe]]); coloca('vermelho', P.vermelho, P.azul, [[papelDaClasse(this.classeRival), this.classeRival]]);
      if (this.mercantes) { const atrasD = (base, alvo, d, lado) => { const b = marcacao(alvo.x, alvo.z, base.x, base.z); const px = Math.cos(b), pz = Math.sin(b); const lim = sim.T.tam * 0.43, cl = (v) => Math.max(-lim, Math.min(lim, v)); return { x: cl(base.x + Math.sin(b) * d + px * lado), z: cl(base.z - Math.cos(b) * d + pz * lado) }; };
        coloca('azul', atrasD(P.azul, P.vermelho, -2500, 2000), P.vermelho, [['mercante', 'mercante']]); coloca('vermelho', atrasD(P.vermelho, P.azul, -2500, -2000), P.azul, [['mercante', 'mercante']]); for (const q of sim.navios) if (q.C.mercante) { q.mercante = 1; q.rotaA = { x: q.x, z: q.z }; } } /* v1.2.12: 1 mercante por lado também no duelo */
      this.jogadorId = sim.navios.findIndex((q) => q.papel === 'jogador'); }
    else if (this.pers) { /* v1.2.16 BATALHA PERSONALIZADA: cada bot de cada lado escolhido pelo jogador (classe, camuflagem, personalidade); mesmas regras de visão/realismo; fogo amigo 0 */
      const V = (L) => (L || []).filter((b) => b && CLASSES[b.tipo] && !CLASSES[b.tipo].mercante).slice(0, 11).map((b) => [papelDaClasse(b.tipo), b.tipo, b]);
      const nM = this.mercantes ? 1 : 0; const al = V(this.pers.azul).slice(0, 7 - nM), ini = V(this.pers.vermelho).slice(0, 8 - nM); /* v1.2.19 item 6: 8×8 SEMPRE = 8 cascos por lado contando o mercante */ /* v1.2.16 (20-corrigido): até 8 por lado (você + 7) */ const meio = Math.floor(al.length / 2);
      /* v1.2.18 item 11: com frotas pequenas as bases (10–11 km) ficavam além do alcance visual/ESM e todos saem em EMCON — o inimigo nunca era detectado. As bases se aproximam da zona central (nº de navios ≤ 4) */
      { const nMax = Math.max(al.length + 1, ini.length || 1), k = nMax <= 2 ? 0.3 : nMax <= 4 ? 0.18 : 0; if (k) { if (P.vagas) { aproximaTime(P, 'azul', k); aproximaTime(P, 'vermelho', k); } else for (const B of [P.azul, P.vermelho]) { B.x += (P.centro.x - B.x) * k; B.z += (P.centro.z - B.z) * k; } } } /* v1.2.25: com vagas, base e formação se aproximam juntas */
      coloca('azul', P.azul, P.vermelho, [...al.slice(0, meio), ['jogador', this.classe], ...al.slice(meio)]);
      coloca('vermelho', P.vermelho, P.azul, ini.length ? ini : [['batedor', 'destroier']]); 
      const atras = (base, alvo, d, lado) => { const b = marcacao(alvo.x, alvo.z, base.x, base.z); const px = Math.cos(b), pz = Math.sin(b); const lim = sim.T.tam * 0.43, cl = (v) => Math.max(-lim, Math.min(lim, v)); return { x: cl(base.x + Math.sin(b) * d + px * lado), z: cl(base.z - Math.cos(b) * d + pz * lado) }; }; /* dentro da arena */
      if (this.mercantes) for (const [tm, B, A] of [['azul', P.azul, P.vermelho], ['vermelho', P.vermelho, P.azul]]) { coloca(tm, atras(B, A, -1600, tm === 'azul' ? -2600 : 2600), A, [['mercante', 'mercante']]); /* v1.2.19 item 6: 1 mercante por lado (8×8 com o comboio) */ } /* v1.2.16 item 13a: mercantes opcionais no modo personalizado */ if (this.modo !== 'duelo' && this.modo !== 'treino') for (const [tm, B, A] of [['azul', P.azul, P.vermelho], ['vermelho', P.vermelho, P.azul]]) { if (sim.navios.some((q) => q.time === tm && q.C.id === 'parcel')) continue; coloca(tm, atras(B, A, -700, tm === 'azul' ? 1700 : -1700), A, [['ataque', 'parcel']]); } /* v1.2.42: PARCEL DAS PAREDES (apoio offshore, canhões d'água) começa em AMBOS os times */
      this.jogadorId = sim.navios.findIndex((n) => n.papel === 'jogador'); }
    else { const meu = papelDaClasse(this.classe); let al, inimigos; if (this.mista) { const E = esquadras(sim.rng, POOL_PAPEL, meu, this.classe, { pa: this.portaAvioes, merc: this.mercantes, troca: !!globalThis.__nnsTrocaEsq }); al = E.azul; inimigos = E.vermelho; this.funcaoJog = E.funcaoJog; this.poderEsq = { azul: +(poderLista(al) + poder(this.classe)).toFixed(2), vermelho: +poderLista(inimigos).toFixed(2) }; } /* v1.2.25 item 9: ESQUADRAS por função, sorteadas aos pares (mesmo papel/função, poder mais próximo) */ else { al = COMPOSICAO8.slice(); const k = Math.max(0, al.findIndex(([p]) => p === meu)); al.splice(k, 1); inimigos = COMPOSICAO8.slice(); if (this.portaAvioes) { al.splice(al.length - 1, 1); inimigos.splice(inimigos.length - 1, 1); } if (this.mercantes) { const ia = (L) => { const i = L.map((q) => q[0]).lastIndexOf('ataque'); return i >= 0 ? i : 0; }; al.splice(ia(al), 1); inimigos.splice(ia(inimigos), 1); } } /* v1.2.19 item 6: o mercante ocupa a 8ª vaga — 8 cascos por lado SEMPRE */ /* v1.2.16 (item 20-corrigido): no máx. 8 NAVIOS DE GUERRA por lado — com porta-aviões ele ocupa a 8ª vaga */
      const meio = Math.floor(al.length / 2); const ord = [...al.slice(0, meio), ['jogador', this.classe, undefined, this.funcaoJog], ...al.slice(meio)]; { const lim = 8 - (this.mercantes ? 1 : 0) - (this.portaAvioes ? 1 : 0); while (ord.length > lim) ord.splice(ord.findIndex((q) => q[0] !== 'jogador') , 1); while (inimigos.length > lim) inimigos.pop(); } /* v1.2.19 item 6: trava final 8×8 */ /* v1.2.11: 8×8 — jogador no centro da linha */ coloca('azul', P.azul, P.vermelho, ord); coloca('vermelho', P.vermelho, P.azul, inimigos);
      /* v1.2.11: PORTA-AVIÕES (opção) 1,2 km atrás da linha e MERCANTES (2 por lado) no comboio da retaguarda */
      const atras = (base, alvo, d, lado) => { const b = marcacao(alvo.x, alvo.z, base.x, base.z); const px = Math.cos(b), pz = Math.sin(b); const lim = sim.T.tam * 0.43, cl = (v) => Math.max(-lim, Math.min(lim, v)); return { x: cl(base.x + Math.sin(b) * d + px * lado), z: cl(base.z - Math.cos(b) * d + pz * lado) }; }; /* dentro da arena */
      if (this.portaAvioes) for (const [tm, B, A] of [['azul', P.azul, P.vermelho], ['vermelho', P.vermelho, P.azul]]) coloca(tm, atras(B, A, 1200, 0), A, [['capitania', 'horizonte', undefined, 'pa']]);
      if (this.mercantes) for (const [tm, B, A] of [['azul', P.azul, P.vermelho], ['vermelho', P.vermelho, P.azul]]) { coloca(tm, atras(B, A, -1600, tm === 'azul' ? -2600 : 2600), A, [['mercante', 'mercante']]); /* v1.2.19 item 6: 1 mercante por lado (8×8 com o comboio) */ }
if (this.modo !== 'duelo' && this.modo !== 'treino') for (const [tm, B, A] of [['azul', P.azul, P.vermelho], ['vermelho', P.vermelho, P.azul]]) { if (sim.navios.some((q) => q.time === tm && q.C.id === 'parcel')) continue; coloca(tm, atras(B, A, -700, tm === 'azul' ? 1700 : -1700), A, [['ataque', 'parcel']]); } /* v1.2.42: PARCEL DAS PAREDES (apoio offshore, canhões d'água) começa em AMBOS os times */
      for (const n of sim.navios) if (n.C.mercante) { n.mercante = 1; n.rotaA = { x: n.x, z: n.z }; }
      this.jogadorId = sim.navios.findIndex((n) => n.papel === 'jogador'); }
    sim.navios.forEach((n) => { n.telAlvo = n.papel === 'jogador' ? 1 : 3; n.radarAtivo = 0; /* v1.2.2: EMCON na largada (a IA liga o radar ao ter contato; o jogador no botão RADAR) */ });
    if (this.modo !== 'treino') for (const q of sim.navios) if (!q.C.mercante) { /* v1.2.19 item 7: SPAWN IMEDIATO — todos os navios inimigos aparecem desde o 1º segundo (informe pré-missão em TODOS os modos, antes só na personalizada) */ const o = q.time === 'azul' ? 'vermelho' : 'azul'; sim.contatos[o].set(q.id, { t: 0, x: q.x, z: q.z, rumo: q.rumo, v: 0, fonte: 'intel', q: 2, t0: 0, conf: -99, vida: 90 }); if (!sim.vistos) sim.vistos = { azul: new Set(), vermelho: new Set() }; sim.vistos[o].add(q.id); } /* v1.2.18 item 11: INFORME DE INTELIGÊNCIA pré-missão na batalha personalizada — posição estimada de cada navio inimigo na largada (some em 90 s sem novo contato; o nome fica conhecido no placar) */
    return this;
  }
  /** Comandante (nome por nação), pintura variada e helicópteros dos bots. */
  opcBot(sim, time, tipo, nomes) { const C = CLASSES[tipo]; const lista = NOMES_BOT[C.nacao] || NOMES_BOT.BRA; let nome = lista[Math.floor(sim.rng.next() * lista.length)]; for (let k = 0; nomes.has(nome) && k < 12; k++) nome = lista[(lista.indexOf(nome) + 1) % lista.length]; nomes.add(nome); if (tipo === 'parcel') nome = 'Cmte. Kleber (PA)'; /* v1.2.42 */
    const helis = []; for (let i = 0; i < (C.heli || 0); i++) helis.push(ORDEM_HELIS[Math.floor(sim.rng.next() * ORDEM_HELIS.length)]);
    const ouro = C.premium && sim.rng.next() < 0.5; const nv = ouro ? 'ouro' : 'prata'; const cons = { kit: nv, controle: nv, bomba: sim.rng.next() < 0.6 ? nv : null, reparoHeli: C.heli ? nv : null, abastece: C.heli && sim.rng.next() < 0.5 ? nv : null }; // bots premium usam ouro às vezes
    return { comandante: nome, pintura: pinturaBot(sim.rng.int(999), sim.navios.length, tipo), helis, cons }; }
  passo(sim, dt) {
    if (sim.fim) return; this.tempo += dt; const c = this.centro;
    /* v1.2.30 item 12: espetáculo nuclear (>= 7 s de jogo) vale para TODO caminho de fim automático; o treino e o afundamento do jogador também esperam */
    const nkSegura = !!(sim.nkEspetaculoAte && this.tempo < sim.nkEspetaculoAte);
    if (this._afundPend && !nkSegura) { this._afundPend = 0; this.encerraAfundado(sim, true); return; }
    if (this.modo === 'treino') { const n = sim.navios[this.jogadorId]; if (n && !n.morto) { n.vls = Math.max(n.vls, 8); n.torp = Math.max(n.torp, 4); n.chaff = Math.max(n.chaff, 2); if (n.C.sam) { n.sam = n.C.sam; n.samUsadas && n.samUsadas.fill(0); } n.vida = Math.max(n.vida, n.C.vida * 0.3); } /* munição infinita; sem afundar no treino */
      for (const id of this.alvos) { const a = sim.navios[id]; if (a.morto) continue; if (a.alvoMovel) { a.telAlvo = 2; } else { a.telAlvo = 1; a.lemeCmd = 0; } }
      if (nkSegura) return; /* item 12: bomba recente — fim do teste drive só depois do espetáculo */
      if (this.alvos.every((id) => sim.navios[id].morto)) { sim.fim = { vencedor: 'azul', motivo: 'Teste drive: todos os alvos afundados', tempo: this.tempo, treino: 1 }; sim.evento({ t: 'fim', ...sim.fim }); }
      else if (this.tempo >= this.duracao) { sim.fim = { vencedor: null, motivo: 'Teste drive encerrado', tempo: this.tempo, treino: 1 }; sim.evento({ t: 'fim', ...sim.fim }); } return; }
    const vivos = { azul: 0, vermelho: 0 }, dentro = { azul: 0, vermelho: 0 }, vida = { azul: 0, vermelho: 0 };
    for (const n of sim.navios) { if (n.morto || n.C.mercante) continue; /* v1.2.11: mercantes não contam para aniquilação */ vivos[n.time]++; vida[n.time] += n.vida / n.C.vida; if (Math.hypot(n.x - c.x, n.z - c.z) < c.r) dentro[n.time]++; }
    // zona: só acumula quem está nela SEM inimigos contestando
    this.zona.disputada = dentro.azul > 0 && dentro.vermelho > 0 ? 1 : 0;
    if (!this.zona.disputada) for (const t of ['azul', 'vermelho']) if (dentro[t] > 0) { this.zona[t] = Math.min(1, this.zona[t] + dt / ZONA_TEMPO); this.zona.dono = t; }
    if (!dentro.azul && !dentro.vermelho) this.zona.dono = null;
    let fim = null;
    if (vivos.vermelho === 0 && vivos.azul === 0) fim = { vencedor: null, motivo: 'Frotas destruídas' };
    else if (vivos.vermelho === 0) fim = { vencedor: 'azul', motivo: 'Aniquilação da frota inimiga' };
    else if (vivos.azul === 0) fim = { vencedor: 'vermelho', motivo: 'Frota aliada destruída' };
    else if (this.zona.azul >= 1) fim = { vencedor: 'azul', motivo: 'Controle da zona central' };
    else if (this.zona.vermelho >= 1) fim = { vencedor: 'vermelho', motivo: 'Inimigo controlou a zona central' };
    else if (this.tempo >= this.duracao) { const pa = vida.azul + this.zona.azul + this.merc.azul * 0.6, pv = vida.vermelho + this.zona.vermelho + this.merc.vermelho * 0.6; /* v1.2.11: mercante afundado = pontos para quem afundou */ fim = Math.abs(pa - pv) < 0.05 ? { vencedor: null, motivo: 'Tempo esgotado: empate' } : { vencedor: pa > pv ? 'azul' : 'vermelho', motivo: 'Tempo esgotado: vence quem tem mais frota e zona' }; }
    if (fim) {
      /* v1.2.30 nuke1230: se bomba atômica acabou de detonar, segura o fim ~7 s para o jogador ver os efeitos */
      if (sim.nkEspetaculoAte && this.tempo < sim.nkEspetaculoAte) { sim._fimPendente = fim; return; }
      fim.tempo = this.tempo; sim.fim = fim; sim.evento({ t: 'fim', ...fim }); sim._fimPendente = null;
    } else if (sim._fimPendente && !(sim.nkEspetaculoAte && this.tempo < sim.nkEspetaculoAte)) {
      const f2 = sim._fimPendente; sim._fimPendente = null; f2.tempo = this.tempo; sim.fim = f2; sim.evento({ t: 'fim', ...f2 });
    }
  }
  /** v1.2.16 item 27: navio do jogador afundou → após a sequência de afundamento a partida termina com o placar do momento (frota + zona + mercantes, mesma regra do tempo esgotado). */
  encerraAfundado(sim, voluntario) { if (sim.fim) return; if (!voluntario && sim.nkEspetaculoAte && this.tempo < sim.nkEspetaculoAte) { this._afundPend = 1; return; } /* v1.2.30 item 12: fim automático por afundamento espera o espetáculo nuclear; clique do jogador (voluntário) não */ const vida = { azul: 0, vermelho: 0 }; for (const n of sim.navios) { if (n.morto || n.C.mercante) continue; vida[n.time] += n.vida / n.C.vida; } let fim; if (this.modo === 'treino') fim = { vencedor: null, motivo: 'Teste drive: seu navio afundou', treino: 1 }; else { const pa = vida.azul + this.zona.azul + this.merc.azul * 0.6, pv = vida.vermelho + this.zona.vermelho + this.merc.vermelho * 0.6; fim = Math.abs(pa - pv) < 0.05 ? { vencedor: null, motivo: 'Seu navio afundou: empate no placar' } : { vencedor: pa > pv ? 'azul' : 'vermelho', motivo: pa > pv ? 'Seu navio afundou, mas a frota vence no placar' : 'Seu navio afundou' }; } fim.tempo = this.tempo; fim.afundado = 1; sim.fim = fim; sim.evento({ t: 'fim', ...fim }); }
  restante() { return clamp(this.duracao - this.tempo, 0, this.duracao); }
}
