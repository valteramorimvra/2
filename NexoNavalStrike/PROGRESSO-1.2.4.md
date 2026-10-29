# PROGRESSO 1.2.4
Base 1.2.3. versionCode 7. Itens: 1 alcance 305 mm (<30 m a 3/5/8 km), 2 míssil/torpedo maiores na tela, 3 fogo no inimigo forte (pool, sem PointLight, sem programa novo).
## Feito
- Item 1 FEITO: causa = (a) tabela balística com grade de 4 mrad: no tiro tenso (305 mm a 2.808 m/s) a interpolação punha a granada 0,5–1,4 m fora da altura visada → grade fina 0,1 mrad em −30…+60 mrad + busca binária (tabela 85 ms, feita na criação do navio); (b) elevação por CANO (altura/distância reais da boca; antes torre 1, y+2); (c) granada a ~45 m/passo atravessava casco de través com 2 amostras → amostragem ≤4 m perto de navios. Teste novo (lib-dispersao: semCasco, alcance onde a granada desce à altura visada): 305 mm 3 km −3.9 m, 5 km −11.6 m, 8 km −25.2 m; lateral −0.1/−0.1/−0.2 m.
- Itens 2/3 FEITOS: escTela() = escala mínima na tela (míssil 14 px, torpedo 12 px por 6 m, até 8×; colisão inalterada); chama do motor alongada + chamaMotor() (núcleo e halo aditivos); trilha mais grossa (4.6–6.5 m ×k) e longa (trilhaMissil 6→10 s); torpedo rente à superfície + esteiraTorpedo() (rastro branco 7–10 s) e bolhas maiores; incendio(): chamas aditivas grandes, clarão, fumaça preta densa subindo 7–13 m/s por 9–15 s, ∝ dano e nº de focos, emitida também de longe. Pools fumaça/brilho maiores (900/1400/2000 e 600/1000/1400), sem PointLight, sem programa novo.
- Câmera MÍSSIL: perseguição 3/4 lateral e presa ao míssil (antes ficava ~680 m atrás pelo amortecimento). Capturas 124 (1–6) revisadas.
- RELEASE: unit 67/67, e2e 20:9 OK, estresse 17/17; APK 1.2.4 sha256 3266218b…0f8c, 7137373 bytes; relatório /workspace/NexoNavalStrike-1.2.4-relatorio.md.
- 1.2.4b (mesma versão): fumaça de incêndio limitada a ~15% da altura da tela (optFumaca: tamanho final ≤ 0,15·altura·d/600); no NOSSO navio com câmera < 900 m: opacidade ≤ 0,35, menor (×0,45), subida mais lenta e deitada para ré (velocidade do navio + 4 m/s), cap 10% da tela.

## Correção 1.2.4b (fumaça) — mesma versão 1.2.4 / versionCode 7
- Nosso navio com câmera perto: fumaça do incêndio com alfa ≤ 0,10 por partícula (sobreposição ≤ ~0,35), 25% da emissão, vida 50%, tamanho limitado a 6% da altura da tela, deriva para ré com vento + velocidade; fumacaPreta de impacto perto: 3 partículas, alfa 0,12. Centro da tela livre (captura 7).
- Inimigo: coluna mantida, tamanho de partícula limitado a ~15% da altura da tela (capturas 5 e 6).
- Capturas: o teste agora avança 10 s de efeitos (30 q/s) antes da foto, porque o SwiftShader roda a poucos quadros/s.
- Estresse rápido 20x9: 17/17. APK: sha256 447b6dbcaa32b8f21994ae2849010529339d0129cd6e4f90c00e51e8d7f88874, 7.137.751 bytes, cert SHA-256 d0c31791…a599, só VIBRATE.
