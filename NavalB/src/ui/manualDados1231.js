// v1.2.31 — MANUAL organizado: TEXTOS num arquivo só (fácil de atualizar). Os NÚMEROS vêm do jogo em tempo de execução:
// escreva {{caminho}} e o manual troca pelo valor real (ex.: {{nuk.liberaApos}}); se o valor não existir, aparece a etiqueta PENDENTE.
// Caminhos disponíveis (ver manualConteudo1231.js › contexto): nuk, param, sam, torpedo, ciws, a30, laser, d (derivados: totalNavios, totalNacoes, totalPremium, bombardeiros…), h (hidroavião), n (navios novos).
// Tipos de bloco: { p } parágrafo · { h } subtítulo · { lista:[…] } · { nota } destaque · { pend } item PENDENTE (aparece com a etiqueta) ·
//   { gerar:'nome', arg } tabela/ficha montada a partir dos dados reais · { so:'novos.hidro' } (opcional, em qualquer bloco) só mostra se o caminho existir.
// Regras de conteúdo: nada religioso, de marca, demoníaco ou de azar; personagens amigáveis; sem números inventados (o que não existe fica PENDENTE).
export const CREDITO_DEV = 'Responsável pelo desenvolvimento do game: Valter Amorim';
export const VERSAO_MANUAL = '1.3.37'; /* v1.3.24: manual atualizado com a mira, a trava, o radar e as câmeras de 1.3.15–1.3.24 */
// Corte aprovado pelo Valter: o hidroavião fica para a 1.2.32. Tudo que tem `desde: '1.2.32'` (categoria, seção ou bloco) fica FORA
// do manual enquanto LIGAR_1232 for false. Para ligar depois: troque para true (e passe novos.hidro em fontesHidro1232.js).
export const LIGAR_1232 = false;

// ícones técnicos pequenos (viewBox 24, traço) — mesma linguagem do menu do jogo
const IC = {
  navios: '<path d="M3 16l9-3 9 3-2.5 3.5h-13z"/><path d="M12 13V5M9 8h6M7 16.5h10"/>',
  hidro: '<path d="M3 15l8-1 1-8 1 8 8 1-9 2-9-2z"/><path d="M3 20c3-2 6-2 9 0s6 2 9 0"/>',
  armas: '<circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5"/><circle cx="12" cy="12" r="1.2"/>',
  consumiveis: '<path d="M9 3.5h6M10 3.5v4l-4 9a2.5 2.5 0 0 0 2.3 3.5h7.4A2.5 2.5 0 0 0 18 16.5l-4-9v-4"/><path d="M8 14h8"/>',
  controles: '<circle cx="8" cy="12" r="4"/><circle cx="17.5" cy="8.5" r="2"/><circle cx="17.5" cy="16.5" r="2"/>',
  nuclear: '<circle cx="12" cy="12" r="2"/><path d="M12 4a8 8 0 0 1 6.9 4M19 15.9A8 8 0 0 1 12 20M5.1 15.9A8 8 0 0 1 5.1 8"/>',
};

export const CATEGORIAS = [
  { id: 'navios', titulo: 'Navios', icone: IC.navios, resumo: 'Classes, tiers, números reais, pinturas e os navios novos da 1.2.31', secoes: [
    { id: 'visao', titulo: 'Visão geral', blocos: [
      { p: 'A frota de combate tem <b>{{d.totalNavios}} classes</b> de <b>{{d.totalNacoes}} bandeiras</b>, em quatro níveis: <b>Tier I</b> (corvetas e patrulhas), <b>Tier II</b> (fragatas e destróieres), <b>Tier III</b> (cruzadores, couraçados e porta-aviões de escolta) e <b>Tier IV</b> (lendários). {{d.totalPremium}} das classes são <b>PREMIUM</b>. O Navio Mercante só aparece em comboios e não combate.' },
      { p: 'Cada navio tem <b>massa e inércia</b>: acelera, freia e aderna aos poucos, derrapa e perde velocidade nas curvas fechadas. O estabilizador reduz o balanço em velocidade. Águas rasas encalham, e ilhas bloqueiam radar, mísseis rasantes e até granadas.' },
      { nota: 'Todos os números das tabelas saem direto dos dados do jogo. Se um valor mudar numa versão nova, o manual muda junto.' },
      { h: 'Como ler as tabelas' },
      { lista: ['<b>Comp.</b>: comprimento em metros. <b>Vel.</b>: velocidade máxima em nós.', '<b>Vida</b>: pontos de vida do casco. <b>Canhão</b>: calibre, torres × canos.', '<b>VLS</b>: células de mísseis antinavio. <b>SAM</b>: células antiaéreas. <b>Torp.</b>: torpedos a bordo. <b>CIWS</b>: canhões de defesa de ponto.', '<b>Aer.</b>: aeronaves embarcadas (helicópteros, caças VTOL, drones e bombardeiros).'] },
    ] },
    { id: 'manobra', titulo: 'Manobra e detecção', blocos: [
      { p: '<b>Telégrafo</b> (esquerda): AR, PAR, 1/3, 2/3 e TF. <b>Leme</b>: arraste para bombordo (BB) ou boreste (BE). O navio é lento para virar: use o <b>pivô</b> ↺ ↻.' },
      { p: 'Inimigos ficam <b>ocultos</b> até serem detectados (o placar mostra <b>?</b>). Você sai em <b>radar PASSIVO</b>: vê pelos olhos (noite e chuva reduzem), óptica, sonar curto, drone e helicóptero, e recebe os contatos dos aliados. No <b>mar aberto</b> quem vê quem depende da distância, do tamanho, da furtividade, da camuflagem, da velocidade e da hora.' },
      { p: '<b>RADAR ativo</b> enxerga muito mais longe, mas a emissão <b>denuncia a sua posição</b> a todos os inimigos no alcance de escuta (alerta <b>DETECTADO</b>). O botão ATIVO/PASSIVO fica no canto superior, ao lado do radar.' },
      { p: '<b>Atrás de uma ilha ou montanha</b> ninguém tem visada. Só é possível ver (e travar para o tiro em arco) um navio escondido atrás da cobertura quando <b>o radar dele e o seu estão ligados</b>. Com qualquer um dos dois desligado, a cobertura protege — só aeronaves e drones enxergam por cima.' },
      { p: 'Navio furtivo, parado e sem atirar é mais difícil de ver. Contato perdido vira <b>?</b> na última posição por cerca de {{param.deteccao.perda}} s.' },
    ] },
    { id: 'tier1', titulo: 'Tier I', blocos: [{ gerar: 'tabelaNavios', arg: 1 }] },
    { id: 'tier2', titulo: 'Tier II', blocos: [{ gerar: 'tabelaNavios', arg: 2 }] },
    { id: 'tier3', titulo: 'Tier III', blocos: [{ gerar: 'tabelaNavios', arg: 3 }] },
    { id: 'tier4', titulo: 'Tier IV · Lendários', blocos: [{ gerar: 'tabelaNavios', arg: 4 }] },
    { id: 'novos', titulo: 'Novos na 1.2.31', blocos: [
      { p: 'Três navios lendários baseados em navios reais, com <b>casco, superestrutura, radares e posição de cada arma</b> fiéis, e um <b>míssil nuclear</b> lançado de um compartimento especial com escotilha.' },
      { gerar: 'novosNavios' },
      { h: 'Míssil nuclear dos navios lendários' },
      { p: 'Regras iguais às da bomba do jogador: libera aos <b>{{nuk.liberaApos}} s</b>, recarga de <b>{{nuk.tRecargaPouso}} s</b>, um por vez e estoque ilimitado. Mesmo efeito e dano da bomba atômica. O computador só usa com a opção <b>Bomba atômica do computador</b> ligada na partida personalizada.' },
    ] },
    { id: 'pinturas', titulo: 'Pinturas', blocos: [
      { p: 'Pinturas mudam o visual e, nas compráveis, dão um pequeno bônus. As <b>lendárias</b> e <b>heroicas</b> têm brilho e padrão especiais; as <b>nacionais</b> seguem a bandeira do navio.' },
      { gerar: 'pinturas' },
    ] },
  ] },

  { id: 'hidro', desde: '1.2.32', titulo: 'Hidroavião', icone: IC.hidro, resumo: 'Unidade jogável nova da 1.2.31: decola e pousa na água e solta a bomba atômica do alto', secoes: [
    { id: 'visao', titulo: 'Visão geral', blocos: [
      { gerar: 'hidroEstado' },
      { p: 'O <b>Albatroz</b> é um hidroavião de patrulha e ataque de duas turbinas. Aparece no menu de seleção, junto dos navios, numa categoria nova chamada <b>Hidroaviões</b>. Decola e pousa na água, sobe a grande altitude e ataca do alto.' },
      { pend: 'Disponível no jogo: depende da integração da 1.2.31 (módulos prontos em hidroaviao1231/, ainda não ligados ao jogo).' },
    ] },
    { id: 'dados', titulo: 'Dados do modelo', blocos: [
      { p: 'Dimensões, massas e desempenho seguem a aeronave real em que o modelo se baseia; o nome real não é exibido no jogo.' },
      { gerar: 'hidroDados' },
    ] },
    { id: 'armas', titulo: 'Armas', blocos: [
      { h: 'Bomba atômica do alto' },
      { p: 'Mesmas regras da bomba do jogador: libera aos <b>{{nuk.liberaApos}} s</b>, <b>{{nuk.bombasSurtida}} bombas</b> por surtida, recarga de <b>{{nuk.tRecargaPouso}} s</b>, se for abatido outro decola em <b>{{nuk.relancaAbatido}} s</b>, e o paiol é ilimitado. Mesmo efeito e dano da bomba atômica (versão 2).' },
      { h: 'Mísseis ar-superfície' },
      { p: 'Lançados do alto, com guiagem até o alvo travado.' },
      { pend: 'Alcance, velocidade, dano e quantidade dos mísseis: números ainda não definidos pelo módulo do hidroavião.' },
      { h: 'Torpedos aéreos' },
      { p: 'Caem do avião (paraquedas/retardo), entram na água com física, ativam e navegam até o inimigo.' },
      { pend: 'Velocidade, alcance, dano e quantidade dos torpedos aéreos: números ainda não definidos.' },
      { h: 'Modo AUTO' },
      { p: 'Com um alvo travado, o avião vai em direção a ele com física realista. Você reassume o comando quando quiser.' },
    ] },
    { id: 'controle', titulo: 'Controles', blocos: [
      { p: 'Controle no estilo dos jogos de combate aéreo: câmera de perseguição em 3ª pessoa, <b>manche virtual</b> (arrastar = subir/descer e inclinar, com auto-nivelamento suave), <b>acelerador</b>, botão de <b>bomba</b>, <b>retícula de impacto</b> prevista no chão/água e opção de <b>alvo travado</b>. O jogador pode reassumir ou soltar o comando a qualquer momento.' },
      { gerar: 'hidroBotoes' },
    ] },
    { id: 'resist', titulo: 'Resistência', blocos: [
      { p: 'O Albatroz é bem resistente à artilharia antiaérea (blindagem e vida altas, mais contramedidas), mas <b>não é invulnerável</b>.' },
      { gerar: 'hidroResistencia' },
    ] },
    { id: 'camo', titulo: 'Camuflagens', blocos: [
      { p: 'Recebe <b>todas</b> as camuflagens que já existem no jogo (as das aeronaves e as pinturas do estaleiro), pelo mesmo sistema de seleção. Nenhuma camuflagem nova foi criada nem alterada.' },
      { gerar: 'camoAereo' },
      { pend: 'Poder de cada camuflagem no hidroavião: adaptação em andamento (o efeito do navio vira o equivalente aéreo; os que não fazem sentido para avião ficam sem efeito).' },
    ] },
    { id: 'cons', titulo: 'Comandante e consumíveis', blocos: [
      { p: 'O comandante é atribuído como nos navios (mesmo sistema). Os consumíveis dos navios também valem para o hidroavião, com o efeito adaptado quando necessário.' },
      { pend: 'Lista final dos consumíveis adaptados e do efeito de cada um: pendente (hidroaviao1231/ainda não fechou esta etapa).' },
    ] },
  ] },

  { id: 'armas', titulo: 'Armas', icone: IC.armas, resumo: 'Canhões, mísseis, torpedos, defesa, granadas e aeronaves — números reais do jogo', secoes: [
    { id: 'mira', titulo: 'Mira e trava', blocos: [
      { p: '<b>Arraste</b> para mirar: a mira é <b>manual</b>. O botão <b>AUTO-MIRA</b> (desligado por padrão, fica salvo) procura o navio visível na tela e ajusta avanço e elevação; com ela ligada o <b>TRAVAR não trava</b>, porque a mira já é automática. O radar nunca liga a auto-mira. A câmera da auto-mira gira com velocidade limitada, sem trancos.' },
      { p: '<b>TRAVAR num ponto</b>: aponte para a proa, a popa, a ponte… e toque <b>TRAVAR</b> (o botão fica verde; o 2º toque solta). A mira, o quadro e a <b>óptica</b> passam a acompanhar <b>aquele ponto</b> do navio, que gira com o casco. Fora do casco, trava no centro do navio.' },
      { p: '<b>Cruzes da mira</b>: a cruz <b>vermelha meio apagada</b> marca o ponto travado já com o avanço (onde a granada encontra o alvo). Cada <b>canhão disponível</b> tem um símbolo cinza com o número da torre, que mostra para onde <b>ele</b> aponta agora e vem até a vermelha — cada torre gira, eleva e recarrega sozinha. Quando <b>todos os disponíveis</b> assentam no ponto, o centro fica <b>VERDE</b>: hora de atirar. Torre fora do setor ou com a boca obstruída na direção do alvo não tem símbolo (veja os ícones das torres no botão CANHÃO).' },
      { p: 'Pare a mira sobre um navio inimigo dentro do alcance e ele é <b>travado sozinho</b> em cerca de {{param.trava.tAtivo}}–{{param.trava.tPassivo}} s: colchete verde (travando) → vermelho (travado), com alarme e vibração curta. A trava resiste até {{param.trava.tFora}} s fora da mira.' },
      { p: 'A elipse na água mostra a dispersão e o ponto de queda; o losango âmbar mostra o <b>avanço</b>. Verde = solução travada, âmbar = limite de alcance, vermelho = fora/obstruído. A <b>MIRA LIVRE</b> manda o canhão ao ponto exato do retículo (mar ou casco), sem trava nem avanço.' },
      { nota: '<b>O avanço é calculado pelo sistema</b> (movimento do alvo e do seu navio). Não trave à frente da proa: o avanço seria contado duas vezes. Para mandar o tiro a um ponto fixo do mar, use a MIRA LIVRE.' },
      { nota: '<b>AUTO-FOGO é só de canhões.</b> No seu navio, mísseis, torpedos, foguetes e granadas nunca disparam sozinhos enquanto você comanda. A defesa (CIWS, SAM, 30 mm e laser) é automática. A auto-mira nunca dispara sozinha.' },
    ] },
    { id: 'canhao', titulo: 'Canhões', blocos: [
      { p: 'Granada explosiva (HE) com espoleta de impacto, tiro balístico com arrasto e dispersão por calibre. <b>Canhão não pode ser interceptado</b>: se acerta, causa dano (até o ricochete rasante arranca chapa). A recarga mínima segue o calibre.' },
      { p: 'A salva só sai com a <b>torre assentada</b> no ponto (giro e elevação). O toque rápido no CANHÃO dispara na hora, na direção em que o cano está — só acerta se a mira já estiver verde.' },
      { p: '<b>Depois de disparada, a granada não corrige o rumo</b>: cai no ponto do mapa calculado no disparo. Quem manobrar a tempo (guinar, parar, acelerar) pode escapar; quem estiver no ponto de queda é atingido, <b>mesmo escondido e não detectado</b> — inclusive num tiro às cegas.' },
      { p: '<b>Tiro em arco</b>: com a linha de tiro bloqueada por ilha/montanha, o canhão eleva (carga reduzida) e passa por cima do relevo. A <b>elevação máxima</b> de cada navio aparece na ficha (campo do canhão); hoje todos os navios fazem tiro em arco (reparos de 280–508 mm remodelados para 65°). O tiro em arco é menos preciso que o direto.' },
      { gerar: 'calibres' },
    ] },
    { id: 'missil', titulo: 'Mísseis VLS', blocos: [
      { p: 'Lançamento vertical (VLS), cruzeiro rasante e mergulho terminal guiado por radar. Com <b>trava</b>, o VLS dispara no alvo travado; sem trava o míssil sai na direção da mira. O anel no botão VLS mostra a solução de tiro. Mísseis travados só falham por ilha no caminho, CIWS/SAM, laser ou iscas.' },
      { gerar: 'misseis' },
    ] },
    { id: 'torpedo', titulo: 'Torpedos', blocos: [
      { p: 'Lançado pelo tubo do bordo voltado para o alvo; corre submerso, guiado até o alvo travado e com busca acústica no fim; detona sob o casco. Sem trava, corre reto na direção da mira. O botão <b>ACÚSTICO/RETO</b> troca o modo.' },
      { gerar: 'torpedo' },
    ] },
    { id: 'defesa', titulo: 'Defesa e iscas', blocos: [
      { p: 'Só <b>mísseis, torpedos e aeronaves</b> (drones, helicópteros) podem ser interceptados. Canhão, granadas e foguetes não têm defesa. O botão <b>SAM</b> liga/retém a defesa SAM automática do navio.' },
      { p: 'A defesa automática (CIWS, 30 mm, laser e SAM), os canhões secundários e automáticos e as armas das aeronaves <b>só atiram com visada livre</b>: nunca num alvo atrás de ilha ou montanha. Também nunca atiram através da própria estrutura do navio (cada arma tem o seu setor livre).' },
      { p: 'Inimigo <b>parcialmente coberto</b> por ilha ou montanha: os canhões automáticos (secundários e os do Amorim) atiram na <b>parte exposta</b>, mirando no meio do que está à vista — e acompanham conforme ele aparece. Totalmente exposto: miram no centro, como sempre; totalmente coberto: não atiram. Vale para todos os navios.' },
      { gerar: 'defesa' },
      { p: '<b>ISCA TÉRM.</b>: protege contra míssil travado (85% no padrão, 95% com ouro); cargas limitadas, com recarga. <b>REPARO</b>: apaga incêndio e estanca alagamento.' },
    ] },
    { id: 'granadas', titulo: 'Granadas e foguetes', blocos: [
      { p: 'Salva de foguetes-granada em arco, <b>não guiados</b>: saem com o avanço calculado no lançamento para o ponto travado e caem naquele ponto do mapa — o alvo que manobra a tempo escapa. Cada montagem gira, eleva e recarrega sozinha. O arco sobe o necessário para passar por cima do relevo. Explodem no casco ou sob a água. <b>Não podem ser interceptados.</b> Botão <b>GRANADA</b>.' },
      { gerar: 'foguetes' },
    ] },
    { id: 'aeronaves', titulo: 'Aeronaves embarcadas', blocos: [
      { p: 'Navios com hangar lançam helicópteros; os porta-aviões lançam esquadrilhas (botão <b>ESQUADRILHA</b>) que atacam navios e travam combate aéreo sem fogo amigo. O contador <b>✈ amigo/inimigo</b> no HUD mostra quantos estão no ar.' },
      { gerar: 'aeronaves' },
    ] },
  ] },

  { id: 'consumiveis', titulo: 'Consumíveis', icone: IC.consumiveis, resumo: 'Kits de reparo, controle de avarias, bomba de esgoto e apoio de helicóptero', secoes: [
    { id: 'tabela', titulo: 'Consumíveis do navio', blocos: [
      { p: 'Comprados no pré-batalha, com <b>prata</b> ou <b>ouro</b> (ouro: mais usos, recarga menor, efeito maior). Cada botão tem recarga própria. O comandante de <b>Controle de avarias</b> melhora recarga e efeito.' },
      { gerar: 'consumiveis' },
    ] },
    { id: 'outros', titulo: 'Iscas e reparo', blocos: [
      { p: '<b>ISCA TÉRM.</b> e <b>REPARO</b> ficam na barra de armas. Quantidade de iscas por navio: veja a coluna de defesa nas fichas do estaleiro.' },
      { lista: ['<b>ISCAS</b>: 85% (padrão) ou 95% (ouro) de chance de desviar cada míssil travado; cargas limitadas e recarga do lançador.', '<b>REPARO</b>: a equipe apaga o incêndio e estanca o alagamento (usos limitados por batalha, com recarga).'] },
    ] },
    { id: 'hidro', desde: '1.2.32', titulo: 'No hidroavião', blocos: [
      { p: 'O hidroavião aceita todos os consumíveis dos navios, com o efeito adaptado ao voo.' },
      { pend: 'Quais consumíveis valem e o efeito adaptado de cada um: lista pendente do módulo do hidroavião.' },
    ] },
  ] },

  { id: 'controles', titulo: 'Controles', icone: IC.controles, resumo: 'Movimento, mira, câmeras, botões do HUD, aeronaves e bombardeiro', secoes: [
    { id: 'mov', titulo: 'Movimento', blocos: [
      { p: '<b>Telégrafo</b> (esquerda, vertical): {{d.telegrafo}}. O navio pesa milhares de toneladas e responde aos poucos.' },
      { p: '<b>Leme</b>: arco do leme (trava nos detentes de 10°, 20° e 35°) ou barra fina; o botão <b>C</b> volta o leme ao centro. <b>Pivô</b> ↺ ↻ gira o navio no lugar em baixa velocidade.' },
      { p: 'Por padrão, tocar no radar define o rumo (piloto automático). Isso pode ser desligado em Ajustes.' },
    ] },
    { id: 'camera', titulo: 'Câmeras', blocos: [
      { p: 'Ao <b>sair da ÓPTICA</b>, a câmera volta a apontar exatamente para o ponto que estava na óptica e <b>fica ali</b> até você arrastar a tela — em <b>todas as câmeras</b>, num movimento <b>suave</b> (sem tremer); com um alvo travado, volta ao ponto travado e segue a trava. <b>Dentro da óptica</b>, com alvo travado, a vista acompanha o ponto travado do navio enquanto ele se move.' },
      { p: 'Toque em <b>CÂMERA</b> para abrir o leque de câmeras. Em todas: <b>sem zoom</b> (distância fixa), <b>órbita 360°</b> livre por arrasto, da altura da água até o céu (mira antiaérea), suave e sem atravessar água ou casco.' },
      { gerar: 'cameras' },
      { pend: 'Distâncias finais das câmeras externas e do bombardeiro: estão sendo ajustadas na 1.2.30; os números só entram aqui depois que fecharem.' },
    ] },
    { id: 'botoes', titulo: 'Botões do HUD', blocos: [
      { gerar: 'botoesHud' },
      { p: 'AUTO-MIRA, MIRA LIVRE, AUTO-FOGO e ACÚSTICO/RETO ficam numa coluna só, um embaixo do outro. O botão RADAR ATIVO/PASSIVO fica no canto superior, ao lado do radar; o NUCLEAR fica acima do TRAVAR.' },
      { p: '<b>Ajustes</b>: as vozes da batalha e as dicas do tutorial vêm desligadas (ligue em Ajustes, se quiser). A câmera padrão é a <b>FW</b>.' },
      { nota: 'Pausa → <b>EDITAR HUD</b> deixa você arrastar e redimensionar os botões. Nenhum botão fica sobre outro e nada fica no centro da tela.' },
    ] },
    { id: 'aero', titulo: 'Helicóptero e esquadrilha', blocos: [
      { p: '<b>HELI</b> assume o helicóptero: joystick de movimento, altitude pelos botões ▲/▼. Botões do heli: <b>ARMA</b>, <b>FLARE</b>, <b>POUSAR</b>, <b>NAVIO</b> (volta ao navio) e <b>HELI 2</b> (troca). Enquanto você voa, a IA comanda o navio e usa todas as armas.' },
      { p: 'Na tela de pilotagem, tocar na tela marca a <b>bolinha</b>; o <b>TRAVAR</b> pega o navio inimigo mais próximo dela. Aeronave com <b>torpedo</b>: o <b>LANÇAR/ARMA</b> dispara no alvo travado até 3,5 km (de longe aparece a distância). O <b>COMBATE</b> do hangar começa no ar, a 750 m.' },
      { p: '<b>Botões das aeronaves</b> (todas, estilo Modern Warships, em hexágono): à direita, o <b>LANÇAR</b> grande com o arco de armas em volta — <b>MÍSSIL</b>, <b>AR-AR</b>, <b>ESPERA</b> e <b>REPARO</b> (no helicóptero, <b>PORTA</b>); no alto, <b>BASE</b>, <b>TRAVAR</b> e <b>IA</b>; embaixo, no centro, <b>FLARE</b> e <b>EJETAR</b>. Contorno verde = pronto; o anel mostra a recarga. A esquadrilha continua no sistema do Urubu-rei: os alas seguem o líder, atacam o mesmo alvo e disparam em ondas.' },
      { p: '<b>Modo MANUAL</b> (IA desligada) dos aviões: <b>a câmera é o manche</b> — gire a tela e o avião vira para onde a câmera olha; olhe para baixo e ele <b>mergulha</b>, olhe para cima e ele sobe (o joystick, se usado, tem prioridade). O avião fica grande na parte de baixo da tela (cerca de metade da largura) e a câmera fica <b>presa ao avião</b>: acompanha cada movimento dele (rumo, arfagem e inclinação) — o avião fica firme na tela e o horizonte é que gira. Arrastar a tela dá a direção; o avião vira para lá e a câmera vai junto. Caças respondem rápido: rolagem até ~100°/s e curva até ~27°/s (o bombardeiro Urubu-rei continua mais pesado). <b>Alvo localizado</b>: o avião vai sozinho na direção exata dele (e desce até ele, sem passar dos 150 m); arraste a tela ou use o manche para pilotar você mesmo. Marcação de voo: escada de inclinação presa ao horizonte, <b>ALT</b> (m) à esquerda, <b>VEL</b> (km/h) à direita, mira no centro (para onde o avião vai) com a munição embaixo; no alvo travado, moldura verde com losango e a distância, e o aviso <b>PRONTO</b> (verde), <b>CARREGANDO</b> ou <b>FORA DO ALCANCE</b> (amarelo). A mira <b>trava sozinha</b> no navio inimigo que estiver <b>no centro da tela</b> (sem cone); sem navio na tela a trava solta. A bolinha marcada e o TRAVAR têm prioridade por alguns segundos. Altura mínima de voo: <b>150 m</b>; acima disso você escolhe a altura e desvia das montanhas — <b>se bater, a aeronave explode</b> e a câmera volta ao navio. Helicópteros e o modo <b>IA</b> continuam como eram.' },
      { p: '<b>Modo IA</b>: vai exatamente ao ponto marcado na tela (mar ou terra) e lança a bomba ao passar por ele; se não conseguir passar exatamente, lança no ponto mais próximo da passagem, até 500 m. Com um navio inimigo como alvo (o do piloto automático/radar), a IA faz a <b>salva de armas</b>: usa <b>uma vez cada arma</b> disponível contra ele — um lançamento de mísseis, uma bomba (atômica, se tiver), um torpedo/rajada da arma do helicóptero — e <b>volta ao navio</b> (se não conseguir em 2 min, volta mesmo assim). No caminho de volta se defende e luta com OUTROS inimigos que encontrar (ar-ar em aeronave próxima, míssil/arma em navio ao alcance, com visada). O que sobrou volta ao paiol.' },
      { p: 'Nos porta-aviões, <b>ESQUADRILHA</b> lança a ala aérea. O <b>DRONE</b> revela navios atrás das ilhas no radar da frota.' },
    ] },
    { id: 'bombardeiro', titulo: 'Bombardeiro nuclear', blocos: [
      { p: 'Com o bombardeiro no ar, toque em <b>PILOTAR</b>. Botões: <b>IA</b> liga/desliga o piloto automático; <b>TRAVAR</b> marca o alvo; <b>LANÇAR</b> solta a bomba quando o ponto de impacto calculado cobre o alvo; <b>ESPERA</b> deixa o bombardeiro orbitando e devolve o navio a você.' },
      { p: '<b>Manche</b> por toque (resposta suave, com inércia) e <b>acelerador</b> ▲/▼ (mínimo→máximo, sem estol abaixo do mínimo). Do alto, um toque curto no mar define a mira de solo. A câmera do bombardeiro orbita por arrasto, sem zoom.' },
    ] },
    { id: 'hidro', desde: '1.2.32', titulo: 'Hidroavião', blocos: [
      { p: 'Manche virtual (arrastar), acelerador ▲/▼, botões <b>BOMBA</b>, <b>TRAVAR</b>, <b>AUTO</b> e <b>ESPERA</b>, retícula de impacto prevista.' },
      { pend: 'Posição e ícones finais dos botões do hidroavião: dependem da integração da 1.2.31.' },
    ] },
  ] },

  { id: 'nuclear', titulo: 'Bomba atômica', icone: IC.nuclear, resumo: 'Regras, efeitos, defesa e quem pode usar', secoes: [
    { id: 'regras', titulo: 'Regras', blocos: [
      { gerar: 'nukeRegras' },
      { nota: 'O computador <b>não usa</b> bomba atômica no teste drive nem nas partidas normais. Na partida personalizada, a opção <b>Bomba atômica do computador</b> (desligada por padrão) dá a ele as mesmas regras.' },
    ] },
    { id: 'efeito', titulo: 'Efeito e dano', blocos: [
      { p: 'Clarão imediato; o estalo, o estrondo e o rolamento chegam atrasados pela velocidade do som ({{nuk.vChoque}} m/s). Bola de fogo, nuvem de condensação, choque na água e cogumelo. Navios em volta sentem a onda de choque, o balanço e o dano.' },
      { p: 'O dano <b>cai com a distância</b>, sem degrau, e a bomba tira no máximo <b>{{nuk.danoMaxFrac|pct}}% da vida</b> do navio por detonação. <b>Fogo amigo = 0.</b>' },
      { gerar: 'nukeRaios' },
    ] },
    { id: 'defesa', titulo: 'Defesa contra a bomba', blocos: [
      { p: 'A bomba e o bombardeiro são <b>praticamente imunes</b> à defesa aérea: chance de abate pelo SAM de cerca de {{nuk.samPk|pct1}}% por engajamento; CIWS e laser quase nulos; depois do paraquedas, nenhuma. O bombardeiro voa alto com escolta de caças.' },
    ] },
    { id: 'quem', titulo: 'Quem tem', blocos: [
      { gerar: 'nukeQuem' },
      { pend: 'Míssil nuclear dos 3 navios lendários: vale a partir da integração da 1.2.31 (mesmas regras, mesmo efeito).' },
      { desde: '1.2.32', pend: 'Bomba atômica do hidroavião: mesmas regras, entra com o hidroavião.' },
    ] },
  ] },
];

// Ficha de ajuda que aparece no fim do índice (nada é removido: o manual completo atual continua disponível).
export const LINK_MANUAL_ANTIGO = { rotulo: 'Manual completo (texto longo)', destino: 'comoJogar' };
