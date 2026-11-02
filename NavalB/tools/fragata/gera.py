# Naval B v1.3.02 — gera src/render/fragataAmorimDados.js a partir do modelo do Valter (Fragata-Amorim.obj v5.1 + META.json).
# Uso: python3 tools/fragata/gera.py
# Não muda forma, cores nem peças: só separa as peças móveis (2 torres 127 mm com pivô/cano, 2 CIWS, 2 canhões automáticos 30 mm,
# 3 radares), troca as bandeiras de popa e de proa por planos 'flamula'/'flamulaProa' (o jogo aplica a bandeira escolhida) e compacta:
# posição Int16 (1/256 m) + normal Int8 (as normais do OBJ: chaminés lisas), 1 malha por material/cor.
import json, base64, struct, os, collections
AQUI = os.path.dirname(os.path.abspath(__file__))
META = json.load(open(os.path.join(AQUI, 'META.json')))
ESC = 256.0
V, N = [], []
obj = None; mat = None
FACES = collections.defaultdict(list)  # (obj, mat) -> [(vi,ni)*3]
for ln in open(os.path.join(AQUI, 'Fragata-Amorim.obj')):
    if ln.startswith('v '): V.append(tuple(map(float, ln.split()[1:4])))
    elif ln.startswith('vn '): N.append(tuple(map(float, ln.split()[1:4])))
    elif ln.startswith('o '): obj = ln[2:].strip()
    elif ln.startswith('usemtl '): mat = ln[7:].strip()
    elif ln.startswith('f '):
        idx = []
        for t in ln.split()[1:]:
            p = t.split('/'); vi = int(p[0]) - 1; ni = int(p[2]) - 1 if len(p) > 2 and p[2] else -1; idx.append((vi, ni))
        for k in range(1, len(idx) - 1): FACES[(obj, mat)].append((idx[0], idx[k], idx[k + 1]))

def classe_mat(m):
    hx = m.split('_')[-1]
    if 'vidro' in m: return 'vidro', hx
    if '_luz_' in m: return 'luz_' + hx, hx
    if 'esfera_laser' in m: return 'laser', hx
    if 'heliponto_preto' in m or 'bandeira' in m: return 'fosco', hx
    if 'heliponto_amarelo' in m or 'letras' in m or 'marca_calado' in m: return 'sinal', hx
    return 'metal', hx

T = META['armas']; t1, t2 = T['canhao_principal_127mm_1'], T['canhao_principal_127mm_2']
def grupo_de(o):
    for i, t in ((0, t1), (1, t2)):
        p = 'canhao_principal_127mm_%d_' % (i + 1)
        if o.startswith(p):
            r = o[len(p):]
            if r == 'cano': return 'cano%d' % i
            if r in ('torre', 'base', 'detalhes'): return 'torre%d' % i
            return 'base'  # barbeta e porta da barbeta: fixas
    if o == 'ciws_proa': return 'ciws0'
    if o == 'ciws_popa': return 'ciws1'
    if o.startswith('canhao_automatico_30mm_bombordo_') and not o.endswith('pedestal'): return 'auto0'
    if o.startswith('canhao_automatico_30mm_boreste_') and not o.endswith('pedestal'): return 'auto1'
    if o in ('radar_busca', 'radar_navegacao', 'radar_controle_tiro'): return 'radar:' + o
    if o.startswith('bandeira_Brasil_'): return 'flamula'
    if o.startswith('bandeira_proa_'): return 'flamulaProa'
    return 'base'

G = collections.defaultdict(lambda: collections.defaultdict(list))
for (o, m), fs in FACES.items(): G[grupo_de(o)][classe_mat(m)] += fs

def bbox(g):
    xs, ys, zs = [], [], []
    for fs in G[g].values():
        for f in fs:
            for vi, _ in f: x, y, z = V[vi]; xs.append(x); ys.append(y); zs.append(z)
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)

def malhas(g, o):
    out = []
    for (m, c), fs in sorted(G[g].items()):
        P, Q = [], []
        for f in fs:
            for vi, ni in f:
                x, y, z = V[vi]; P += [max(-32768, min(32767, int(round((x - o[0]) * ESC)))), max(-32768, min(32767, int(round((y - o[1]) * ESC)))), max(-32768, min(32767, int(round((z - o[2]) * ESC))))]
                nx, ny, nz = N[ni] if ni >= 0 else (0, 1, 0); Q += [int(round(nx * 127)), int(round(ny * 127)), int(round(nz * 127))]
        out.append({'m': m, 'c': '#' + c, 'p': base64.b64encode(struct.pack('<%dh' % len(P), *P)).decode(), 'n': base64.b64encode(struct.pack('<%db' % len(Q), *Q)).decode()})
    return out

S = {'esc': ESC, 'base': malhas('base', (0, 0, 0)), 'torres': [], 'giram': {}, 'radares': {}}
for i, t in enumerate((t1, t2)):
    o = t['torre_origem']; pv = [o[0] + t['pivo_local'][0], o[1] + t['pivo_local'][1], o[2] + t['pivo_local'][2]]
    S['torres'].append({'pos': o, 'piv': t['pivo_local'], 'malhas': malhas('torre%d' % i, o), 'cano': malhas('cano%d' % i, pv)})
for nm, pos in (('ciws0', T['ciws_proa']['pos']), ('ciws1', T['ciws_popa']['pos'])):
    b = bbox(nm); o = [pos[0], b[2], pos[2]]; S['giram'][nm] = {'pos': o, 'malhas': malhas(nm, o)}
for nm, k in (('auto0', 'canhao_automatico_30mm_bombordo'), ('auto1', 'canhao_automatico_30mm_boreste')):
    o = T[k]['cab_pivo']; S['giram'][nm] = {'pos': o, 'malhas': malhas(nm, o), 'yaw': T[k]['yaw_graus']}
for r in META['radares']:
    g = 'radar:' + r['nome']; b = bbox(g); o = [r['x'], b[2], r['z']]; S['radares'][r['nome']] = {'pos': o, 'w': r['w'], 'malhas': malhas(g, o)}
for g in ('flamula', 'flamulaProa'):
    b = bbox(g); S[g] = {'c': [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2, (b[4] + b[5]) / 2], 'l': b[5] - b[4], 'a': b[3] - b[2]}
S['chamines'] = [[c['x'], c['y'], c['z']] for c in META['chamines']]
js = '// GERADO por tools/fragata/gera.py a partir do modelo do Valter (Fragata Amorim v5.1). Não editar à mão.\nexport const FRAGATA_GEO = ' + json.dumps(S, separators=(',', ':')) + ';\n'
dst = os.path.join(AQUI, '..', '..', 'src', 'render', 'fragataAmorimDados.js'); open(dst, 'w').write(js)
tri = {g: sum(len(f) for f in d.values()) for g, d in G.items()}
print(json.dumps({'tri': tri, 'total': sum(tri.values()), 'kb': round(len(js) / 1024), 'flamula': S['flamula'], 'flamulaProa': S['flamulaProa'], 'giram': {k: v['pos'] for k, v in S['giram'].items()}, 'radares': {k: v['pos'] for k, v in S['radares'].items()}}, indent=1))
