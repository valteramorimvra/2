# Árvore tecnológica — documento de game design (Naval B 1.3.00)

Este documento é a proposta de design da progressão. **Não muda nada no jogo sozinho.**

Hoje a árvore do Naval B tem 4 níveis, mais Lendário e Super lendário. Ela já está organizada por equipes e classes, com rolagem horizontal e nós brilhantes (entregue na 1.3.00). Aqui ficam a progressão completa em 10 tiers e as regras de pesquisa, para o Valter aprovar antes de qualquer mudança na economia.

---

## 1. Tiers 1–10 e curvas de custo

Cada navio exige duas coisas para avançar:

- **XP de pesquisa**, ganho nas batalhas com o navio anterior da linha. O XP livre pode completar até 30%.
- **Créditos (prata)**, para comprar depois de pesquisar.

**Fórmulas** (t = tier, t ≥ 2):

- XP do navio(t) = 1.200 × 1,68^(t−2), arredondado a 50
- Créditos(t) = 60.000 × 1,74^(t−2), arredondado a 1.000
- XP de cada módulo(t) = 22% do XP do navio(t). São 3 módulos por navio: motor, casco e armamento.

Os créditos crescem um pouco mais rápido que o XP. Assim a manutenção (reparo e munição) dos tiers altos pesa, e os navios de tier médio continuam úteis para juntar prata.

| Tier | XP p/ pesquisar o navio | Créditos p/ comprar | XP de cada módulo (motor/casco/armamento) | XP acumulado da linha |
|---|---|---|---|---|
| 1 | 0 | 0 | 0 | 0 |
| 2 | 1.200 | 60.000 | 260 | 1.980 |
| 3 | 2.000 | 104.000 | 440 | 5.300 |
| 4 | 3.400 | 182.000 | 750 | 10.950 |
| 5 | 5.700 | 316.000 | 1.250 | 20.400 |
| 6 | 9.550 | 550.000 | 2.100 | 36.250 |
| 7 | 16.050 | 957.000 | 3.530 | 62.890 |
| 8 | 27.000 | 1.665.000 | 5.940 | 107.710 |
| 9 | 45.350 | 2.897.000 | 9.980 | 183.000 |
| 10 | 76.150 | 5.041.000 | 16.750 | 309.400 |

**Ritmo-alvo.** Uma batalha 5x5 média dá ~700 XP no tier 1 e ~2.400 XP no tier 9, já com o multiplicador de tier.

- Tier 1 → 5: ~2 a 3 horas de jogo.
- Tier 5 → 8: ~15 horas.
- Tier 8 → 10: ~30 horas.

**XP de batalha** = base do resultado (vitória 1,0 · derrota 0,6) × (dano causado ÷ vida de referência do tier + 0,3 × abates + 0,15 × detecções) × multiplicador do tier (1,0 + 0,12 × (t−1)).

Navios **Premium, Lendários e Super lendários** ficam fora das linhas. Eles não precisam de pesquisa e ganham bônus de prata (`BONUS_PREMIUM`).

---

## 2. Ramos

Quatro ramos por equipe. Cada ramo tem 10 tiers e uma bifurcação no tier 5 (variante de canhões × variante de mísseis).

| Ramo | Sigla | Papel | Tiers iniciais (já existem no jogo) | Destaque nos tiers altos |
|---|---|---|---|---|
| Contratorpedeiros | **DD** | torpedos, furtividade, caça a submarinos e lanchas | corveta → fragata → destróier | furtivo, salva de torpedos, ocultação |
| Cruzadores | **CA** | equilíbrio entre canhões, VLS e defesa aérea | cruzador → capitânia leve | VLS grandes, laser, radar de longo alcance |
| Encouraçados | **BB** | artilharia pesada e blindagem | capitânia → encouraçado | canhões de grosso calibre, cinturão blindado |
| Porta-aviões | **CV** | esquadrilhas, sem canhão principal | porta-helicópteros → porta-aviões | 3 esquadrilhas controladas |

**Esquadrilhas do CV** (aeronaves do hangar atual):

- **Ataque**: caças com foguetes, para atacar navios.
- **Torpedeiros**: helicópteros ASW com torpedo leve.
- **Bombardeiros**: bombardeio em mergulho.

O jogador controla uma esquadrilha por vez e as outras ficam em órbita do porta-aviões.

- Cada esquadrilha tem de 3 a 6 aeronaves, conforme o tier.
- A aeronave abatida volta ao convés para ser reposta, com tempo de reposição por tier: 30 s no tier 4 e 55 s no tier 10.
- A defesa aérea inimiga (CIWS, SAM, laser) atua igual sobre todas.

---

## 3. Pesquisa de módulos (desbloqueia o próximo tier)

Cada navio tem 3 módulos pesquisáveis, sempre na mesma ordem lógica:

1. **Motor**: +6% de velocidade máxima, +10% de aceleração.
2. **Casco**: +8% de vida, +5% de blindagem.
3. **Armamento**: +7% de cadência ou +1 míssil na salva (na variante de mísseis).

**Regra de desbloqueio.** O próximo navio da linha só aparece como *pesquisável* depois dos **3 módulos** do navio atual. A barra de XP do nó mostra o progresso combinado.

**Nós bifurcados (tier 5).** Pesquisar os módulos libera as duas variantes. O jogador escolhe a ordem, e o XP de uma não serve para a outra.

**Retorno.** Vender um navio devolve 50% dos créditos e nada de XP, e os módulos continuam pesquisados.

---

## 4. Interface (horizontal, nós brilhantes, ícones 2D)

**Disposição na tela, de cima para baixo:**

- **Menu de equipe fixo**: uma faixa de abas presa ao topo, com as equipes e a moeda do jogador. A pedido do Valter, a árvore é por **equipes e classes**, não por país. A bandeira só aparece como marca no nó.
- **Grade horizontal**: uma linha por ramo (DD, CA, BB, CV, mais Apoio e Hidroaviões). As colunas são os tiers 1 → 10, mais Lendário e Super, com rolagem horizontal e encaixe por coluna.
- **Nós**: cartões de 104 × 68 dp, com uma linha dourada ligando os tiers.

**Estados dos nós:**

| Estado | Visual |
|---|---|
| Na frota | brilho verde fixo |
| Pesquisável | pulso azul (2,4 s) |
| Premium ou lendário | brilho roxo |
| Super lendário | brilho dourado pulsante |
| Bloqueado | cinza e foto dessaturada |

**Painel do navio.** Tocar num nó abre a ficha com:

- foto 3D giratória (arrastar para girar);
- dados completos, barras de atributos e todas as armas;
- botões **Comprar / Pesquisar**, **Teste drive** e **Estaleiro**;
- o botão de voltar sempre retorna à árvore, na mesma posição de rolagem.

**Ícones 2D apenas.** Os nós usam a foto pré-renderizada (`fotos/navios/*.webp`, 480 × 270) e ícones SVG de tipo. Nenhum 3D é instanciado por nó. O único 3D da tela é o navio do fundo, que reaproveita a vitrine.

---

## 5. Zero coleta de lixo (zero GC)

- A grade é montada **uma vez** em HTML estático, ao abrir a tela.
- Rolagem e brilho são só CSS (`box-shadow` e `animation`), sem JavaScript por quadro.
- Os estados mudam por **troca de classe** (`st-possui`, `st-pesq`, …), sem recriar nós.
- As fotos são arquivos estáticos com cache do navegador, sem `canvas.toDataURL` por nó. As miniaturas de aeronaves também são arquivos fixos (`fotos/aero/*.jpg`).
- As contas da economia (custos e XP) usam tabelas pré-calculadas (`Float64Array` por tier) e nenhum objeto temporário em laço.
- Na batalha (já em vigor na 1.3.00), as armas novas do Amorim reaproveitam os pools existentes (mísseis, granadas 150–224) e vetores de trabalho fixos. Nenhum `new` dentro de laço de simulação ou de render.

---

## 6. Migração proposta (quando o Valter aprovar)

1. Mapear os navios atuais nos tiers 1–4 de cada ramo, sem trocar nenhum dado de combate.
2. Os tiers 5–10 entram aos poucos, um ramo por versão, sempre com modelo realista.
3. O XP já ganho pelo jogador é convertido 1:1 e os navios comprados continuam na frota.
