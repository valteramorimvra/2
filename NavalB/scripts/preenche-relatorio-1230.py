#!/usr/bin/env python3
# Preenche "Causa / mudança", "Evidência / teste" e "Lacunas honestas" de cada item do relatório 1.2.30 (idempotente) e reescreve a seção final.
import re,sys,os
R='/workspace/NexoNavalStrike-1.2.30-relatorio.md'
FN='/workspace/fiscal/nukefumaca'; RL='/workspace/release-1230'; PF=RL+'/prints-final'
EXTRA=open(RL+'/relatorio-lacunas-final.md').read() if os.path.exists(RL+'/relatorio-lacunas-final.md') else ''
I={}
I['1']=("Atlas 4×4 de fumaça ligado sem seleção de célula + decodificação sRGB do cinza do atlas deixavam os quads da nuke quase pretos e opacos, sem cogumelo visível. FINAL-01 (plano B do Fiscal, `nuclearFx.js`): forma e alfa do puff passam a ser PROCEDURAIS no shader (queda radial suave + fbm 2D por puff, semente `vSd`), sem textura e sem RGB de fuligem escura; a cor vem da luz/ambiente (com compensação à noite).",
 f"Fiscal: grades pb5 de dia e de noite, a 3,2 km e a 7 km, sem quadrado preto e com draws iguais (`{FN}/capturas/grade-pb5c3200-dia.png`, `grade-pb5c3200-noite.png`, `grade-pb5c7000-dia.png`, `grade-pb5c7000-noite.png`; quadros T03/12/25/45/80 em `pb5c*-{{dia,noite}}-T*.png`); antes/depois em `capturas/antes-dia-T*` × `depois-dia-T*`. Architect: aplicado -p0 -F0 (sha 2efa2915…), APK contém o shader (`index-CUeGKC0H.js`); refeitos no build final os prints da nuke de dia e de noite em `{PF}/nuke/` (final-*-T*.png; base 1.2.29 de contraste `base1229-dia-T*.png`).",
 "Validado só em Chrome headless (SwiftShader), não em GPU móvel/WebView real; a aparência no aparelho (mediump, brilho) pode diferir. O FINAL-01 é o plano B (shader procedural), não o atlas do relatório antigo do Fiscal.")
I['2']=("`lancaNuclear`: o bombardeiro nascia em `deckY+1,6` (chapada: 16,6 m, 6 m ABAIXO do convés a 22,6 m). Agora nasce em `convoo.y+0,6`, como as aeronaves comuns (parte do FINAL-03).",
 f"Fiscal: spawn da chapada = 22,6 m = topo do convés (`{FN}/RELATORIO-nukefumaca.md`, item 2). UNIT final e `nuke7s-teste.mjs`/`convoo-teste.mjs` (itens 12) passam.",
 "Sem print do bombardeiro decolando no Chrome nesta rodada. FINAL-02 isolado ficou de fora (já contido no FINAL-03).")
I['3']=("O bombardeiro não herdava a trava de navio (`n.alvoId` → `q.alvo`), subia em órbita (erro de proa de 57–84° nos primeiros segundos, parecia 'fugir') e o botão TRAVAR do nuke era toggle e soltava a trava. FINAL-03: herda a trava, sobe em ROTA RETA e TRAVAR só trava (nunca solta); FINAL-03b: `nkTrava` na UI sem unlock acidental.",
 f"Fiscal: análise e testes headless `_fiscal_auto.mjs` em `{FN}/tests/` (AUTO solta ~50 s). UNIT final: ver resultados na seção de verificações (bomber1228 é falha pré-existente da 1.2.29).",
 "O comportamento exato desejado em 'Trava perdida' (evento do navio, não do bombardeiro) não foi alterado. Não há print/vídeo do voo reto no Chrome.")
I['4']=("Som da nuke quase mudo: atraso físico `d/343` de 16–19 s a 5–6 km, ganho baixo e possível `AudioContext` suspenso. FINAL-04b: atraso `ts=d/343` sem teto (som real); FINAL-04: `ctx.resume()` se não estiver rodando, categoria 'nk', prioridade máxima/anti-voice-steal, ganho nuclear mais alto e apito da bomba (`NavalAudio.js`, `bancoSom.js`).",
 f"Fiscal: arquivos OGG íntegros (picos −1,8…−2,7 dB); e2e do Architect `som.bufPeak` ≈ 0,7–0,8 (`{FN}/RELATORIO-nukefumaca.md`, item 4; `ENTREGA-1930.md`).",
 "Hipótese residual não reproduzida em headless: `decodeAudioData` de OGG 192 kHz no WebView / `ctx.state`. Áudio não é ouvido por teste automático; precisa de teste de ouvido no aparelho.")
I['5']=("Valores de câmera da 1.2.29 passaram a ser a MÉDIA exata entre 1.2.28 e 1.2.29 (popa a0 0,13; tresq 0,34; popaAlta 0,565; costado 0,2125; mira travada +0,09 / elMin 0,12 / hCam 0,10·L; altura perto 0,14875·L+5,225; longe 0,23·L+12; bombcam 49 m). Órbita 360° e distâncias externas intactas.",
 f"Tabela 1.2.28 / 1.2.29 / novo em `{FN}/RELATORIO-nukefumaca.md` (item 5). Diff de integração: `/workspace/NexoNavalStrike-1.2.29-para-1.2.30.diff`.",
 "Julgamento visual da câmera depende do Valter no jogo; sem print comparativo gerado.")
I['6']=("VLS com alvo travado atrás de montanha: `oculto`/`linhaLivre` zerava a trava e a prontidão. Agora o jogador com VLS não exige linha de visada (`vlsContorna`; canhão segue exigindo) e o míssil em contorno usa teto `hCrest`, look-ahead longo e pop-up só se ainda houver crista.",
 f"Fiscal: lote de 24 lançamentos ocluídos: cordilheira/vulcânico/arquipélago hit 18–20/24 (antes 0–24 não lançados), terra 1–2; LOS livre inalterado (hit 15 = original) (`ENTREGA-1930.md`, item 6; `/tmp/vls_bench.txt`).",
 "Mapas estreito/fiordes: 17–18/24. Medido pelo Fiscal; não refeito pelo Architect em headless além do UNIT.")
I['7']=("Recarga de VLS igual para jogador e bots por classe (destróier/cruzador 6 s, corveta/fragata 8 s, capitânia/PA 10 s), intra-salva 0,45 s, trava de míssil 1,6/2,4 s (FINAL-06/07/07b). FINAL-07c (Architect/Fiscal convoo): aeronaves que terminam no terreno.",
 f"Tabela em `{FN}/ENTREGA-1930.md` (item 7). 07c: `colisao-pos-07c.out` e as medições do item 15 (`fim terreno: míssil` 22 vs 1 conta como fim em terreno, não como falha).",
 "Valores de doutrina por classe vêm da proposta do Fiscal aprovada pelo Valter; balanceamento real só em jogo.")
I['8']=("Difícil acertar perto: depressão de torre limitada a −5°, convergência só além de 600 m e mínimo de VLS 1000 m. FINAL-06/08/08b: depressão −15° (<3 km), convergência de perto, ALC_MIN.vls=0, sem 'PERTO DEMAIS' no HUD, míssil de perto em voo plano com espoleta cedo; bots alinhados.",
 f"`ENTREGA-1930.md` (item 8) e UNIT final (Canhão: solução de tiro com elevação automática).",
 "Sem teste de pontaria de perto em Chrome; ajuste fino de depressão/convergência depende do jogo.")
I['9']=("Navio preso em ilha de rocha. O FINAL-09 antigo foi revertido (não despenetrava). FINAL-09b: colisão casco×rocha sem penetração (`colisaoTerreno.js`), ré para sair, bots desviando.",
 f"`colisaoTerreno-baseline.mjs` em 8 mapas: totAv 0 / totNav 0 (`{RL}/colisao-completo.out`; base 1.2.29: `colisao-base-completo.out`). msPerTick árvore × base na seção de verificações.",
 "Mede colisão de casco; o gameplay 'ré para sair' só foi validado pelo Fiscal.")
I['10']=("ADIADO PARA A 1.2.31. Aeronaves do convés como unidades reais, elevador animado e contador sempre visível (FINAL-10/10b/10c).",
 f"Patches existem em `/workspace/fiscal/convoo/` (FINAL-10, 10b, WIP-10c) e não foram aplicados.",
 "Motivo: FINAL-10/10c não foram aprovados pelo Fiscal a tempo para a 1.2.30 (o 10c ainda era WIP) e ficaram de fora por decisão do Fiscal/Valter (22:04); o motivo técnico detalhado não está registrado nos arquivos que li. Entra na 1.2.31 junto com os navios.")
I['11']=("Radar do jogador ligado: contatos inimigos com q≥2 dentro do alcance de radar do alvo passam a mostrar nome, vida e km no rótulo 3D sem precisar de trava (`modernNavalCombat3D.js`). Regra de 7 km/trava, `deteccao.js` e `PARAM.deteccao` intactos; furtivo respeitado.",
 f"`radar-teste.mjs`: 24 contatos avaliados, 19 identificados com radar ON sem trava, 0 falhas (`{RL}/radar-novo-completo.json`; radar OFF = 1.2.29). Prints: `{PF}/item11-novo/` (radar ligado/desligado) × `{PF}/item11-base1229/`.",
 "Print mostra o resultado em Chrome headless; o ganho para o jogador depende dos alcances de radar dos navios da partida.")
I['12']=("Nuke no fim da partida: 7 s em todos os caminhos de fim, fogo amigo no `danoLocal`, arrancamento parcial do convés com colisão de terreno (versão SEM-10 do patch).",
 f"`nuke7s-teste.mjs` e `convoo-teste.mjs`: OK (✔ tudo ok) no build final (`{RL}/item12-nuke7s-completo.txt`, `item12-convoo-completo.txt`; tabelas abaixo).",
 "Aeronaves reais no convés (item 10) ficaram fora.")
I['13']=("Dano e cadência de aeronaves: mísseis 5→2 s, torpedos 6→3 s, foguetes 3,2→1,5 s; dano por acerto elevado (míssil 12,9→25,8 %HP no T1); mg com dano ×2 (versão sem a2a).",
 f"Tabela antes/depois em `{RL}/item13/tabela.md`; testes `item13/dano-aereo-item13.mjs`; regressão `item13/roda-regressao.sh`. Medição de 24 corridas por lado no item 15.",
 "Não há teste headless automático dos itens 13/13b na UNIT; vale a medição de 24 corridas e o teste de interceptação desta rodada.")
I['13b']=("Multiplicador de dano de aeronave de BOT contra o jogador (`botDanoMulJog`) de 0,48 para 1 (decisão do Valter 20:21): dano igual nos dois sentidos; só aeronave usa o fator.",
 f"`{RL}/item13/item13b-teste.mjs`; medições de lado bot/jogador no item 15.",
 "Aumenta a letalidade das aeronaves inimigas; ajuste fino depende de jogo.")
I['15']=("Registro de dano aéreo: HUD '✈ dano' em partida (aliado/inimigo) e bloco 'Aeronaves' no fim da partida (por tipo: lançados, acertos, interceptados CIWS/SAM, dano HP, afundamentos).",
 f"Prints: `{PF}/item15-hud-aviao-dano-partida.png` (+`-zoom`), `{PF}/item15-fim-resultado-completo.png`, `{PF}/item15-fim-bloco-aeronaves.png`. Teste de interceptação 30 partidas T3/T4: `{PF}/interceptacao-30partidas-analisa*.txt`.",
 "Só conta (não altera o jogo). Sem teste unitário do bloco além dos prints.")
I['15b']=("Compensação de interceptação: o míssil de aeronave tem resistência (`resAr`) multiplicando a probabilidade de abate de CADA sistema de defesa (CIWS, SAM, laser, 30 mm) com o mesmo valor; AA forte derruba mais que fraca, nenhum fica imune; torpedo leve não é tocado.",
 f"Medição por tier (T1–T4) com `medida-aereo.mjs`/`analisa*.py`: 30 partidas em T3 e T4 em `{PF}/interceptacao-30partidas-analisa.txt` e `-analisa2.txt` (tabela no relatório, seção Lacunas/Verificações); agregado das 24 corridas: `{RL}/item16-agrega-final.txt`.",
 "Interceptação medida em headless com mapa florianopolis 5×5; mapas/seeds diferentes dão outros números.")
I['crit9']=("Menos travadas: rotores do heli de aeronaves fundidos em 1 malha por rotor, peças articuladas e luzes dos navios fundidas, luzes das aeronaves em 1 malha (estrobo à parte), via `mescla1230.js`. `modeloHeli()` do bombardeiro nuclear não muda.",
 f"Testes de equivalência geométrica sem Chrome (`/workspace/fiscal/crit9fix/tests/equiv1230*.mjs`); close-up do helicóptero base × novo em `{PF}/heli/` (base1229 × nova130final); msPerTick árvore × base na seção de verificações.",
 "Ganho de FPS no aparelho real não medido; o close-up serve para mostrar que o visual não mudou.")
I['14']=("ADIADO PARA A 1.2.31: som de aeronave (`item14-som-aereo.diff`).",f"Diff pronto em `{RL}/item14-som-aereo.diff`, não aplicado.","Motivo: fora da lista fechada da 1.2.30 por decisão do Fiscal/Valter (22:04); sem motivo técnico detalhado registrado.")
I['16']=("ADIADO PARA A 1.2.31: aéreo combativo (`item16-aereo-combativo.diff`).",f"Diff e medições em `{RL}/item16-aereo-combativo.diff`, `item16-agrega-final.txt` (aeronaves perdidas no terreno 27/44 no cenário morro).","Motivo: fora da lista fechada da 1.2.30 por decisão do Fiscal/Valter (22:04); fora da lista fechada; mexe no combate aéreo e fica para ser validado junto com o item 10 na 1.2.31 (esse agrupamento é minha leitura, não decisão registrada).")
s=open(R).read()
def sub(item,pre,txt):
    global s
    m=re.search(r'(### Item '+re.escape(item)+r' — .*?\n)(.*?)(?=\n### |\n<!-- IT12|\n## )',s,re.S)
    if not m: print('SEM item',item); return
    body=m.group(2)
    c,e,l=txt
    def rep(body,lab,val):
        return re.sub(r'- '+lab+r':.*',lambda _:'- '+lab+': '+val,body,count=1)
    body=rep(body,'Causa / mudança',c); body=rep(body,'Evidência / teste',e); body=rep(body,'Lacunas honestas',l)
    s=s[:m.start(2)]+body+s[m.end(2):]
for k,v in I.items():
    if k in('14','16'): continue
    sub(k,'',v)
# itens 14 e 16: seção extra antes de crit9 (se faltar)
if '### Item 14 ' not in s:
    ext=''
    for k in('14','16'):
        c,e,l=I[k]; ext+=f'### Item {k} — [ADIADO PARA A 1.2.31]\n- Causa / mudança: {c}\n- Evidência / teste: {e}\n- Lacunas honestas: {l}\n\n'
    s=s.replace('### Item crit9 ',ext+'### Item crit9 ',1)
s=re.sub(r'- Patch\(es\): _preencher \(automático na tabela de aplicação\)_','- Patch(es): ver "Aplicação dos patches" (tabela gerada)',s)
i=s.index('## Lacunas e pontos para decisão do Valter')
s=s[:i]+'## Lacunas e pontos para decisão do Valter\n'+EXTRA
open(R,'w').write(s)
print('ok')
