# PROGRESSO 1.2.11
- 18:22 início; backup /tmp/src1210bak e /tmp/public1210bak; versionCode 14 / 1.2.11
- 18:35 item 5: boca do cano agora inclui banda/caimento/velocidade do casco (mundoInc idêntico ao grupo 3D); auditoria com banda 6° → máx 0,18 m (amostra) — tests/boca1211.mjs
- 18:50 itens 6/7: foguetes LG-4/LF-12 em ARCO semiguiado (420 m/s, pico 10% da distância, acompanha o alvo travado), dano LG 24→30 / LF 19→26, recarga 15→14 / 14→13 s; acerto a 2,5 km 59% (antes 56%), no máx. 5,4 km 50% (antes 38%)
- 19:10 itens 1-4 (câmeras): míssil que VAI acertar (sem isca/SAM, alvo vivo), abatido/iscado → volta; impacto com clarão contido + estrondo + tremor; vento + som de viagem; menu de câmeras no toque longo (8 ícones: externa, óptica, aérea, convés, canhão, míssil, foguete, projétil); câmera CANHÃO atrás da torre com arrasto girando a mira; CONVÉS no passadiço; câmeras de FOGUETE e PROJÉTIL seguem 1 objeto com modelo real (ogiva/cinta/corpo; foguete com aletas), 1,2 s no impacto e volta; item 8 brilho +~10% (traçante, chama de míssil, foguete)
- 19:25 itens 14-16: modo desenvolvedor (Configurações, padrão ligado) libera todos os navios; 8×8 (COMPOSICAO8, linha 330 m, pools ×2); batalhas de 10 min; bases já a 8–12 km (spawns opostos); toggle Vozes
- 19:45 itens 9-12 (código): classes volkhar/baluarte/kordao/estrelar/colosso (lendário, tier 4, ouro), horizonte (porta-aviões); MISSEIS hiper/rasante/cruzeiro alternados; 4 torres no layout; convés de voo + ilha; LASER (sim defesa.js passoLaser + feixe pool 16); CIWS em rajadas; antiAereo; jato VTOL (HELIS.jato + modelo). Falta: UI lendário roxo, opção porta-aviões pré-batalha
- 20:05 itens 13 e 18 (código): opção Porta-aviões no pré-batalha (1 'horizonte' por frota, ala de caças VTOL); 2 mercantes por lado (porta-contêineres, IA de comboio, batedores inimigos os caçam), pontos no desempate + troféu 'Bloqueio Naval'; lendário roxo no estaleiro (tier IV)
- 20:20 smoke 8×8 (tests/smoke1211.mjs): 22 navios c/ porta-aviões+mercantes, sem NaN, caças voam, laser engaja, mercantes afundam
- 20:25 item 17: comandante removível (botão REMOVER / tocar no atual), único por navio (transferência automática, rótulo 'em <navio>'); teste unitário
- 20:35 item 19: mapas novos 'Costa da Cordilheira' (costa continental, serras ridged até 912 m, praias, 7 ilhas com relevo) e 'Arquipélago Vulcânico' (10 cones com cratera e sulcos, até 639 m), 14 km, bases 11,2 km
- 19:07 item 20: Piper (pip piper-tts, venv /workspace/tts1211) + voz pt_BR-faber-medium (dataset CC0, repo MIT, afinado do lessac) → 16 frases OGG (~200 KB) em public/audio/voz; NavalAudio.fala() com fila/limites; toggle 'Vozes da batalha'; créditos + licencas-terceiros.txt. (obs.: horários anteriores deste arquivo estavam adiantados; relógio real agora)
- 19:14 boca do cano 36 classes (incl. lendários e porta-aviões): máx 0,34 m OK (nexo-naval-shots/1211/boca.txt)
19:24 placar 8x8 (9 ícones, sem mercantes), LOD distante (det >2 km, CIWS/a30/lança-granadas/radares >4,5 km)
19:30 servo do leme por tamanho; HUD 20:9/16:9 OK (0 sobreposições, placar 8+8, menu câmeras 8 ícones dentro da tela)
19:42 unit 76/76 (teste do drone mede a órbita após a revelação), câmera de projétil: traçantes vizinhos ocultos
20:00 retomado; câmera de projétil: traçantes irmãos ocultos pela distância ao projétil seguido (não à câmera)
20:00 build assinado 1.2.11 (vc 14), mesma chave d0c317…a599, 7.330.127 B, sha256 0d50ca7a…ee3d; cópia em attachments
20:13 build final (com câmera de projétil corrigida): sha256 7380a26600699614ce223fa62f173962a0ab785cd9bf2e7f6f199931b88de65b, 7330123 B; capturas finais OK (0 programas novos, 0 erros); relatório com checklist 1-21
