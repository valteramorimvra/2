// v1.2.0 — COMANDANTES contratados com OURO (1 por navio, troca no estaleiro), com especialidade, nível e XP.
// Retratos: arte original criada para o jogo (public/retratos). Variações de nome reutilizam o retrato com filtro/espelho.
export const ESPECIALIDADES = {
  navegacao: { nome: 'Navegação', icone: '⎈', desc: (f) => `+${pc(0.05 * f)} velocidade, +${pc(0.12 * f)} giro e aceleração` },
  defesa: { nome: 'Defesa aérea', icone: '✣', desc: (f) => `+${pc(0.25 * f)} eficácia do CIWS, +${pc(0.1 * f)} SAM` },
  artilharia: { nome: 'Artilharia', icone: '◎', desc: (f) => `−${pc(0.18 * f)} dispersão, −${pc(0.1 * f)} recarga do canhão` },
  misseis: { nome: 'Mísseis', icone: '➶', desc: (f) => `+${Math.round(4 * f)} células VLS, mísseis ${pc(0.12 * f)} mais difíceis de abater` },
  antisub: { nome: 'Antissubmarino / torpedos', icone: '≋', desc: (f) => `+${pc(0.25 * f)} dano de torpedo` },
  avarias: { nome: 'Controle de avarias', icone: '✚', desc: (f) => `incêndio/alagamento −${pc(0.35 * f)}, reparo +${pc(0.04 * f)} casco e −${pc(0.25 * f)} recarga` },
  aviacao: { nome: 'Aviação embarcada', icone: '✈', desc: (f) => `+${pc(0.35 * f)} combustível e +25% munição dos helicópteros` },
  frota: { nome: 'Comando de frota', icone: '★', desc: (f) => `+${pc(0.1 * f)} radar, −${pc(0.04 * f)} recarga, +${pc(0.08 * f)} CIWS, avarias −${pc(0.1 * f)}` },
};
const pc = (x) => Math.round(x * 100) + '%';
// retrato, filtro (variação), espelhado
export const COMANDANTES = [
  { id: 'c01', nome: 'Cmte. Rui Vasconcelos', esp: 'navegacao', ret: 1, ouro: 2500, bio: 'Veterano de travessias oceânicas; tira o máximo do casco em qualquer mar.' },
  { id: 'c02', nome: 'Cmte. Helena Duarte', esp: 'defesa', ret: 2, ouro: 3000, bio: 'Especialista em guerra antiaérea e coordenação de defesa de ponto.' },
  { id: 'c03', nome: 'Cmte. Marcos Pereira', esp: 'artilharia', ret: 3, ouro: 3000, bio: 'Oficial de armas: direção de tiro, salvas enquadradas e recarga rápida.' },
  { id: 'c04', nome: 'Cmte. Davi Nogueira', esp: 'misseis', ret: 3, ouro: 3500, var: 'hue-rotate(-12deg) brightness(1.05)', esp2: 1, bio: 'Planejamento de ataques de saturação com mísseis antinavio.' },
  { id: 'c05', nome: 'Ten. Rafael Lima', esp: 'aviacao', ret: 4, ouro: 2500, bio: 'Piloto de helicóptero embarcado; mais horas de voo por surtida.' },
  { id: 'c06', nome: 'Cmte. Beatriz Moura', esp: 'avarias', ret: 5, ouro: 2500, bio: 'Chefe de controle de avarias: apaga incêndios e estanca alagamentos.' },
  { id: 'c07', nome: 'Alm. Otávio Sampaio', esp: 'frota', ret: 6, ouro: 6000, bio: 'Almirante de esquadra; ideal para capitânias e cruzadores.' },
  { id: 'c08', nome: 'Cmte. Jonas Freitas', esp: 'antisub', ret: 6, ouro: 2800, var: 'saturate(0.8) brightness(0.95)', espelho: 1, bio: 'Guerra antissubmarino e ataques de torpedo de curta distância.' },
  { id: 'c09', nome: 'Cmte. Paula Ramos', esp: 'defesa', ret: 2, ouro: 3200, var: 'sepia(0.15) brightness(1.04)', espelho: 1, bio: 'Defesa de frota; especialista em interceptação por SAM.' },
  { id: 'c10', nome: 'Cmte. Caio Brandão', esp: 'navegacao', ret: 1, ouro: 2600, var: 'saturate(0.85) contrast(1.05)', espelho: 1, bio: 'Manobras em águas restritas e canais entre ilhas.' },
  { id: 'c11', nome: 'Cmte. Lúcia Teixeira', esp: 'avarias', ret: 5, ouro: 2700, var: 'hue-rotate(8deg) brightness(1.03)', espelho: 1, bio: 'Engenheira naval: mantém motores e leme operando sob fogo.' },
  { id: 'c12', nome: 'Ten. Bruno Azevedo', esp: 'aviacao', ret: 4, ouro: 2700, var: 'brightness(0.95) contrast(1.06)', espelho: 1, bio: 'Instrutor de voo embarcado; pousos em convés com mar grosso.' },
];
export const retratoUrl = (c) => `retratos/cmd_naval_0${c.ret}.webp`;
export const retratoCss = (c) => `${c.var ? 'filter:' + c.var + ';' : ''}${c.espelho ? 'transform:scaleX(-1);' : ''}`;
export const NIVEL_MAX = 10;
export const xpPara = (nv) => Math.round(1000 * Math.pow(nv, 1.6)); // XP acumulado para chegar ao nível nv+1
/** Fator de eficácia 0,37 (nível 1) … 1,0 (nível 10). */
export const fatorNivel = (nv) => 0.3 + 0.07 * Math.min(NIVEL_MAX, Math.max(1, nv));
/** Aplica o bônus do comandante aos modificadores (mutável). */
export function aplicaComandante(m, esp, nivel) { const f = fatorNivel(nivel);
  switch (esp) {
    case 'navegacao': m.vmax *= 1 + 0.05 * f; m.giro *= 1 + 0.12 * f; m.acel *= 1 + 0.12 * f; break;
    case 'defesa': m.ciwsTaxa *= 1 + 0.25 * f; m.samPk *= 1 + 0.1 * f; break;
    case 'artilharia': m.disp *= 1 - 0.18 * f; m.cad *= 1 - 0.1 * f; break;
    case 'misseis': m.vlsMais += Math.round(4 * f); m.missilEf = { ...m.missilEf, pkCiws: m.missilEf.pkCiws * (1 - 0.12 * f) }; break;
    case 'antisub': m.torpDano *= 1 + 0.25 * f; break;
    case 'avarias': m.avarias *= 1 - 0.35 * f; m.reparo = { ...m.reparo, cura: m.reparo.cura + 0.04 * f, recarga: m.reparo.recarga * (1 - 0.25 * f) }; m.consCura = 0.04 * f; m.consRec = 1 - 0.25 * f; break; /* v1.2.21 item 19c: consumíveis seguem a MESMA regra da descrição (+4%·f casco, −25%·f recarga) */
    case 'aviacao': m.heliFuel *= 1 + 0.35 * f; m.heliMun = 1.25; break; /* v1.2.21 item 19c: +25% munição só do comandante de aviação (antes: qualquer heliFuel > 1, p.ex. pintura lendária) */
    case 'frota': m.radar *= 1 + 0.1 * f; m.cad *= 1 - 0.04 * f; m.ciwsTaxa *= 1 + 0.08 * f; m.avarias *= 1 - 0.1 * f; break;
  }
  return m; }
/** Nomes dos comandantes dos BOTS (por nação; genéricos e inventados). */
export const NOMES_BOT = {
  BRA: ['Alm. Barroso', 'Cmte. Silva', 'Cmte. Albuquerque', 'Cmte. Moreira', 'Cmte. Ribeiro', 'Cmte. Correia', 'Cmte. Prado', 'Cmte. Fontes'],
  EUA: ['Cdr. Hayes', 'Capt. Morgan', 'Cdr. Walsh', 'Capt. Bennett', 'Cdr. Reyes', 'Capt. Collins'],
  CHN: ['Cmte. Li Wei', 'Cmte. Zhang Hao', 'Cmte. Chen Bo', 'Cmte. Wang Lei', 'Cmte. Liu Yang'],
  RUS: ['Kap. Volkov', 'Kap. Sokolov', 'Kap. Orlov', 'Kap. Belov', 'Kap. Morozov'],
  UK: ['Cdr. Hartley', 'Capt. Ashford', 'Cdr. Pemberton', 'Capt. Whitmore', 'Cdr. Langley'],
};
export const NOME_JOGADOR = 'Cap. Amorim';

/** Ordem de exibição na tela de comandantes: os 6 rostos em sequência e depois as 6 variações (espelhadas) — o mesmo rosto
 * fica sempre 6 posições adiante, logo nunca na mesma linha com 2 a 6 colunas. */
export const ORDEM_TELA = ['c01', 'c02', 'c03', 'c05', 'c06', 'c07', 'c09', 'c04', 'c10', 'c11', 'c08', 'c12']; // rostos 1-6 e depois 2,3,1,5,6,4: nunca o mesmo rosto lado a lado (2 ou 3 colunas) nem na mesma coluna em linhas seguidas
export const COMANDANTES_TELA = () => ORDEM_TELA.map((id) => COMANDANTES.find((c) => c.id === id)).filter(Boolean).concat(COMANDANTES.filter((c) => !ORDEM_TELA.includes(c.id)));
