/** v1.2.74: comandantes da aviação. Bônus só na aeronave independente; as alas copiam. */
export const CMD_AEREO = [
  { id: 'valter', nome: 'Cmte. Valter Vencedor', esp: 'Superioridade aérea', aa: 1.22, aaDano: 1.35, aaCd: 0.7 },
  { id: 'ronaldo', nome: 'Ronaldo Misterioso', esp: 'Furtividade', rcs: 0.62 },
  { id: 'rodolfo', nome: 'Rodolfo Combatente', esp: 'Dogfight', giro: 1.18 },
  { id: 'klevton', nome: 'Klevton Inteligente', esp: 'Guerra eletrônica', radar: 1.25, flare: 0.62 },
  { id: 'kelly', nome: 'Cmte. Kelly', esp: 'Ataque', dano: 1.18, alc: 1.12 },
  { id: 'ana', nome: 'Ana Nery', esp: 'Sobrevivência', vida: 1.2, regen: 0.012, rtbVel: 1.28, rtbRec: 0.55 },
  { id: 'laiane', nome: 'Laiane', esp: 'Helicóptero', porta: 1.25, portaDano: 1.45 },
];
export const cmdAereoDe = (id) => CMD_AEREO.find((c) => c.id === id) || null;
/** v1.2.74: fumaça de cauda opcional (vazio = cores da esquadrilha). */
export const FUM_AERO = [
  { id: '', nome: 'Cores da esquadrilha' },
  { id: 'branco', nome: 'Branca' },
  { id: 'azul', nome: 'Azul' },
  { id: 'amarelo', nome: 'Amarela' },
  { id: 'verde', nome: 'Verde' },
];
