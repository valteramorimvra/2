# Naval B v1.3.03 — gera src/render/vtolDados.js com os caças VTOL do Valter (Acauã e Uiraçu, LOD de JOGO ≤ 8000 tris).
# Uso: python3 tools/vtol/gera.py
# Forma/cores/peças do OBJ, sem mudança. Cada ESTAÇÃO de arma (míssil/torpedo/nuke + aletas) vira um grupo próprio 'estNN' (o pilone
# fica no casco): o jogo esconde a estação disparada (pilone vazio) e mostra de novo ao rearmar. Posição Int16 (1/256 m), normal Int8.
import json, base64, struct, os, collections
AQUI = os.path.dirname(os.path.abspath(__file__))
ESC = 256.0
def mclasse(m):
    hx = m.split('_')[-1]
    if 'vidro_fume' in m: return 'vidroFume', hx
    if 'vidro' in m: return 'vidro', hx
    if 'viseira' in m: return 'ouro', hx
    if '_luz_' in m: return 'luz_' + hx, hx
    if 'lente_laser' in m: return 'laser', hx
    if any(k in m for k in ('preto_fosco', 'pneu', 'macacao', 'cinto', 'almofada', 'luva', 'pele', 'mascara', 'interior')): return 'fosco', hx
    return 'metal', hx
def le(nome):
    V, N, F = [], [], collections.defaultdict(list); o = m = None
    for ln in open(os.path.join(AQUI, nome + '.obj')):
        if ln.startswith('v '): V.append(tuple(map(float, ln.split()[1:4])))
        elif ln.startswith('vn '): N.append(tuple(map(float, ln.split()[1:4])))
        elif ln.startswith('o '): o = ln[2:].strip()
        elif ln.startswith('usemtl '): m = ln[7:].strip()
        elif ln.startswith('f '):
            ix = []
            for t in ln.split()[1:]:
                p = t.split('/'); ix.append((int(p[0]) - 1, int(p[2]) - 1 if len(p) > 2 and p[2] else -1))
            for k in range(1, len(ix) - 1): F[(o, m)].append((ix[0], ix[k], ix[k + 1]))
    return V, N, F
def pack(V, N, G):
    out = []
    for (m, c), fs in sorted(G.items()):
        P, Q = [], []
        for f in fs:
            for vi, ni in f:
                P += [max(-32768, min(32767, int(round(v * ESC)))) for v in V[vi]]
                n = N[ni] if ni >= 0 else (0, 1, 0); Q += [int(round(x * 127)) for x in n]
        out.append({'m': m, 'c': '#' + c, 'p': base64.b64encode(struct.pack('<%dh' % len(P), *P)).decode(), 'n': base64.b64encode(struct.pack('<%db' % len(Q), *Q)).decode()})
    return out
S = {'esc': ESC}
for nome, idv in (('Acaua-jogo', 'acaua'), ('Uiracu-jogo', 'uiracu')):
    V, N, F = le(nome); M = json.load(open(os.path.join(AQUI, idv + '-meta-jogo.json')))
    est = {e['id'].split('_')[0]: e for e in M['estacoes']}
    G = collections.defaultdict(lambda: collections.defaultdict(list))
    for (o, m), fs in F.items():
        g = 'base'; p = o.split('_')[0]
        if p in est and not o.endswith('pilone'): g = p
        G[g][mclasse(m)] += fs
    ordem = sorted([e for e in M['estacoes'] if e['tipo'] in ('aam', 'asm')], key=lambda e: (0 if e['tipo'] == 'aam' else 1, e['ordem_disparo']))
    S[idv] = {'base': pack(V, N, G['base']), 'est': {k: pack(V, N, G[k]) for k in G if k != 'base'}, 'ordem': [e['id'].split('_')[0] for e in ordem], 'tipos': {k: est[k]['tipo'] for k in est},
              'fumaca': [{'p': e['p'], 'cor': e['cor']} for e in M['fumaca']['emissores']], 'dim': M['dim'], 'tri': M['triangulos']}
js = '// GERADO por tools/vtol/gera.py a partir dos caças do Valter (Acauã e Uiraçu, LOD de jogo). Não editar à mão.\nexport const VTOL_GEO = ' + json.dumps(S, separators=(',', ':')) + ';\n'
open(os.path.join(AQUI, '..', '..', 'src', 'render', 'vtolDados.js'), 'w').write(js)
print(json.dumps({k: {'est': len(v['est']), 'ordem': v['ordem'], 'tri': v['tri'], 'fumaca': v['fumaca']} for k, v in S.items() if k != 'esc'}, ensure_ascii=False), round(len(js) / 1024), 'KB')
