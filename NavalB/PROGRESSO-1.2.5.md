# Progresso 1.2.5 (a partir da 1.2.4, versionCode 8) — modo econômico
- 04:31 início; backup do src 1.2.4 em /tmp/src124bak.
- 04:32 pedido extra: mísseis/torpedos +30–40% de velocidade, flares e míssil com menos brilho (corpo visível, chama pequena, rastro cinza claro).
- 04:55 mísseis/torpedos: bancada tests/acerto125.mjs (antes 7,5% / 59%; agora 78,5% / 89%, 0 erros não explicados). Defesas limitadas, iscas de bot 20–30 s/4 cargas/20%, velocidades +35%, trava/prontidão VLS-TORP, raspar na costa, teste drive, cenário, texturas. Próximo: HUD estilo de referência + lança-granadas.

## 05:40 BRT — testes, capturas e build final
- Unit 67/67; bancada mísseis 155/200 (77,5%) e torpedos 88/100 (88%), todos os erros explicados (CIWS/SAM, isca, ilha); áudio 24/24 gatilhos.
- Stress 20:9 17/17, 0 programas WebGL novos; e2e 20:9 (hud+fx) sem erros de console.
- Capturas em /workspace/nexo-naval-shots/125/ (20x9 e 16x9).
- Ajustes finais: faixa "TESTE DRIVE" na entrada do treino; chaves AUTO-MIRA/AUTO-FOGO/ACÚSTICO afastadas do slider em 16:9.
- O box não tinha JDK: instalei o Temurin 17 em /workspace/jdk17 (só para o build).
- Build único: /workspace/NexoNavalStrike-1.2.5.apk.
