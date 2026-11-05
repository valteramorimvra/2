# v1.2.33 — mudanças sobre a v1.2.32

O arquivo `index-HCW9E8Kr.js` desta pasta já está com tudo aplicado. Ele substitui o
arquivo de mesmo nome dentro de `assets/` do jogo (o nome não mudou, então o
`index.html` continua funcionando).

O script `patch-v1.2.33.js` reaplica tudo sobre o bundle original da v1.2.32:

```
node patch-v1.2.33.js index-original.js index-HCW9E8Kr.js
```

Se o bundle for recompilado a partir do código-fonte, os trechos mudam e o script para
avisando qual troca não encontrou. Nesse caso as mudanças precisam ser levadas para o
código-fonte.

## Bombardeiros nucleares (Urubu-rei)
- Os 3 voam em **fila**, cada um 37 m atrás do anterior (27 m de avião + ~10 m de folga).
  O 1º (líder) fica mais abaixo, o 2º 10 m acima e o 3º mais 10 m acima.
- A **câmera** fica atrás do último da fila, a 40 m (antes eram 49 m atrás do líder).
- **Lançamento**: o líder solta no comando do jogador; o 2º solta 4 s depois e o 3º 8 s
  depois. As próximas bombas ficam prontas **10 s depois da última da salva**.
- **Fumaça de jato** contínua: verde (1º), azul (2º) e amarela (3º).
- **Pintura metálica** sem textura de desgaste: verde, azul e dourado, com reflexo do céu.
- **Motor** mais baixo e mais grave (três aviões juntos sem saturar). O assobio da bomba em
  queda também ficou mais baixo.

## Míssil nuclear dos navios (Sejong, Nanchang, Nakhimov)
- O próximo lançamento libera **8 s depois do anterior**, mesmo com o anterior ainda em voo.
  Os mísseis em voo são simulados e desenhados juntos. Navios da IA mantêm a regra antiga.

## Navios
- **Almirante Nakhimov**: 100 km/h na velocidade máxima, com teto mesmo com melhorias.
- **Curvas mais suaves** conforme o porte (deslocamento) e o tipo: corvetas viram mais
  rápido; cruzadores e porta-aviões têm mais inércia de guinada.

## Aeronaves
- Helicópteros e aviões **mais agressivos**: rearmam mais rápido (míssil 2→1,4 s,
  torpedo 3→2,4 s, foguete 1,5→1 s), atacam mais perto, caçam aeronaves de mais longe
  (2,2→3,2 km) e o combate ar-ar ficou mais forte.

## Som
- Ganho por categoria aplicado em todos os caminhos de áudio (mixer, pool nativo e síntese):
  bomba atômica ×0,74, canhões ×0,8, antiaérea ×0,6.
- **Antiaérea** mais suave: rajada do CIWS, 30 mm e o zumbido contínuo (menos distorção,
  filtro mais baixo).
- **Granadas**: som novo e realista (estalo da onda de choque, baque grave, coluna d'água e
  gotas caindo), com pico controlado.
- **Helicópteros**: camada nova com as pás batendo no ar (17,5 Hz), o rotor de cauda (100 Hz)
  e o assobio da turbina.
- **Não estourar / não travar**: mestre com mais folga antes do limitador (1,35→1,2,
  limitador −1,5→−2,5 dB), menos vozes simultâneas por categoria e intervalo mínimo um
  pouco maior entre repetições do mesmo som.

## Antiaérea
- Traçantes do 30 mm em **ritmo constante** (sem engasgos), com a mesma potência.
- **Raios laser finos** nos reparos de número par (2º, 4º...) de CIWS e de 30 mm, enquanto
  disparam.

## Novidades
- Seção "Novidades 1.2.33" adicionada às notas do jogo, com tudo acima.
