#!/usr/bin/env python3
# uso: relatorio-1230.py <rel.md> <ver> <vc> <apk> <checagens.txt> <tempos.tsv> <aplicados.tsv> <diff> <dir-release> [resultado-unit]
# Cria o esqueleto se não existir; a seção de VERIFICAÇÕES e a de APLICAÇÃO DOS PATCHES são regeneradas a cada execução (entre marcadores).
import sys, os, re, hashlib, time
rel, ver, vc, apk, chk, tempos, aplic, diff, R = sys.argv[1:10]; unit = sys.argv[10] if len(sys.argv) > 10 else None
ITENS = [('1','Fumaça da nuke em quadrados pretos, sem cogumelo'),('2','Bombardeiro nasce dentro do convés'),('3','Bombardeiro não vai até o alvo travado'),
 ('4','Nuke quase sem som'),('5','Câmeras alteradas na 1.2.29 → meio-termo entre 1.2.28 e 1.2.29 (bombcam ~49 m)'),('6','VLS com alvo travado atrás de montanha: míssil sobe e contorna o relevo'),
 ('7','Equilíbrio de recarga de mísseis (entra na 1.2.30 por pedido do Valter via Fiscal)'),('8','Dificuldade de acertar canhão e míssil a curta distância'),('9','Navio preso dentro de ilha de rocha: colisão casco×rocha sem penetração, ré para sair, bots desviando (entra por pedido do Valter, 19:13; versão final = FINAL-09b, o 09 antigo foi revertido por não despenetrar)'),('10','[FORA da 1.2.30 por decisão do Fiscal: FINAL-10/10c] Aeronaves no convés = unidades reais (nada nasce/some no convés), elevador animado, contador de aeronaves ativas sempre visível (pedido do Valter, 19:20)'),('11','Radar do jogador ligado: TODOS os navios detectados por radar mostram nome, barra de vida e km no rótulo 3D de longe, sem precisar de trava (decisão do Valter, 19:33)'),('12','Nuke: 7 s no fim da partida em todos os caminhos de fim, fogo amigo no danoLocal, arrancamento parcial do convés com colisão de terreno (item12-nuke7s-SEM10.diff)'),('13','Dano e cadência das aeronaves (item13-dano-aereo-SEM-a2a.diff)'),('13b','Multiplicador dos bots no combate aéreo (item13b-botmul-aereo.diff)'),('15','Registro de dano aéreo: HUD "✈ dano" e bloco Aeronaves no fim da partida (item15-registro-dano-aereo.diff)'),('15b','Compensação de interceptação (item15b-compensa-intercep.diff)'),('crit9','Otimização do crit9 ("não travar": FPS/picos)')]
reg = []
if os.path.exists(aplic):
    for l in open(aplic):
        p = l.rstrip('\n').split('\t')
        if len(p) >= 5: reg.append(p)
rev = {p[0] for p in reg if p[3] == 'revertido'}
def arquivos(path):
    fs = []
    try:
        for l in open(path, encoding='utf-8', errors='ignore'):
            if l.startswith('+++ '):
                f = l.split()[1]; f = re.sub(r'^(b|a|orig)/', '', f)
                if f != '/dev/null' and f not in fs: fs.append(f)
    except Exception: pass
    return fs
now = time.strftime('%F %T')
ESTADO = ('**ESTADO: build PRÉ-01 — todos os itens aprovados EXCETO o item 1 (cogumelo/FINAL-01, aguardando aprovação do Fiscal). APK: `%s`.** Gerado em %s BRT.' if os.environ.get('PRE01') == '1' else '**ESTADO: build FINAL (inclui o item 1). APK: `%s`.** Gerado em %s BRT.') % (apk, now)
ap = ['<!-- APLIC:INI -->', '## Aplicação dos patches (gerado em %s BRT)' % now, '', '| # | Item | Patch | sha256[:16] | Estado | Hora |', '|---|---|---|---|---|---|']
for i, (sha, item, f, est, h) in enumerate(reg, 1): ap.append('| %d | %s | `%s` | %s | %s | %s |' % (i, item, f, sha, est, h))
if not reg: ap.append('| – | – | (nenhum patch aplicado ainda) | – | – | – |')
ap.append('<!-- APLIC:FIM -->')
tm = []
if os.path.exists(tempos):
    for l in open(tempos):
        p = l.rstrip('\n').split('\t'); tm.append('| %s | %s |' % (p[0], (p[1] + ' s') if p[0] not in ('ERRO','UNIT') else p[1]))
def lê(n):
    f = os.path.join(R, n)
    return open(f, encoding='utf-8', errors='ignore').read().strip() if os.path.exists(f) else '(ainda não executado)'
_m = re.search(r'checagens-(\w+)\.txt', chk); sfx = _m.group(1) if _m else 'completo'
i12 = ['<!-- IT12:INI -->', '## Item 12 — tabelas dos testes (nuke7s-teste.mjs e convoo-teste.mjs)', '', '### nuke7s-teste.mjs (7 s em todos os caminhos de fim)', '```', lê('item12-nuke7s-%s.txt' % sfx), '```', '', '### convoo-teste.mjs (arrancamento parcial do convés)', '```', lê('item12-convoo-%s.txt' % sfx), '```', '<!-- IT12:FIM -->']
ver_ = ['<!-- VERIF:INI -->', '## Verificações (gerado em %s BRT)' % now, '', '```', open(chk).read().strip() if os.path.exists(chk) else '(sem checagens)', '```', '']
ver_ += ['**UNIT (`node tests/unit.mjs`, timeout 2400 s):** ' + (unit or 'ainda não executada'), '', 'Diff contra a base 1.2.29: `%s` (%d B)' % (diff, os.path.getsize(diff) if os.path.exists(diff) else 0), '',
         '| Fase | Tempo |', '|---|---|'] + tm + ['<!-- VERIF:FIM -->']
if not os.path.exists(rel):
    o = ['# Nexo Naval Strike 3D %s (vc%s) — relatório' % (ver, vc), '', 'Responsável pelo desenvolvimento do game: Valter Amorim', '', '<!-- ESTADO:INI -->', ESTADO, '<!-- ESTADO:FIM -->', '',
         'Base: 1.2.29 (vc32, sha 733a407f…dcd9). Pacote `br.com.valteramorim.nexonaval`, mesma chave (cert d0c31791…a599), só VIBRATE, sem INTERNET.',
         'Patches de autoria do Fiscal (`/workspace/fiscal/nukefumaca/patches/FINAL-*.diff`, `/workspace/fiscal/crit9fix/patches/`); integração/build/testes: Architect.', '',
         '## Itens (lista fechada)', '']
    for k, t in ITENS:
        o += ['### Item %s — %s' % (k, t), '- Patch(es): _preencher (automático na tabela de aplicação)_', '- Arquivos alterados: <!-- ARQ:%s -->_pendente_<!-- /ARQ -->' % k, '- Causa / mudança: _preencher a partir do relatório do Fiscal_',
              '- Evidência / teste: _preencher_', '- Lacunas honestas: _preencher_', '']
    o += ['## Novidades no jogo / manual', 'Seção "Novidades 1.2.30" inserida em `src/main.js` com o texto de `scripts/novidades-1.2.30.html` (revisar contra o que realmente entrou).', '', ap[0], ap[-1], '', ver_[0], ver_[-1], '',
          '## Lacunas e pontos para decisão do Valter', '_preencher_', '']
    open(rel, 'w', encoding='utf-8').write('\n'.join(o))
s = open(rel, encoding='utf-8').read()
def sub(s, ini, fim, bloco):
    m = re.search(re.escape(ini) + r'.*?' + re.escape(fim), s, re.S); b = '\n'.join(bloco)
    return s[:m.start()] + b + s[m.end():] if m else s + '\n' + b + '\n'
s = sub(s, '<!-- IT12:INI -->', '<!-- IT12:FIM -->', i12) if '<!-- IT12:INI -->' in s else s.replace('## Novidades no jogo / manual', '\n'.join(i12) + '\n\n## Novidades no jogo / manual', 1)
s = sub(s, '<!-- ESTADO:INI -->', '<!-- ESTADO:FIM -->', ['<!-- ESTADO:INI -->', ESTADO, '<!-- ESTADO:FIM -->'])
s = sub(s, '<!-- APLIC:INI -->', '<!-- APLIC:FIM -->', ap); s = sub(s, '<!-- VERIF:INI -->', '<!-- VERIF:FIM -->', ver_)
for k, t in ITENS:
    fs = []; ps = []
    for sha, item, f, est, h in reg:
        if k in item.split(',') and est != 'revertido' and sha not in rev:
            ps.append(os.path.basename(f))
            for a in arquivos(f):
                if a not in fs: fs.append(a)
    if fs: s = re.sub(r'<!-- ARQ:%s -->.*?<!-- /ARQ -->(?: \(patches: [^\n]*\))?' % re.escape(k), lambda m: '<!-- ARQ:%s -->%s<!-- /ARQ --> (patches: %s)' % (k, ', '.join('`%s`' % x for x in fs), ', '.join(ps)), s, flags=re.S)
open(rel, 'w', encoding='utf-8').write(s)
print('relatório:', rel)
