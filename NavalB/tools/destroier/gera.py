# Naval B v1.3.03 — gera src/render/destroierAmorimDados.js a partir do modelo do Valter (Destroier-Amorim.obj + META.json).
# Uso: python3 tools/destroier/gera.py
# Não muda forma, cores nem peças: separa as peças móveis (3 torres 2×155 mm com pivô e 2 canos, 4 CIWS, 4 canhões automáticos 30 mm,
# 3 radares), tira do casco as bandeiras de popa/proa (viram planos 'flamula'/'flamulaProa' que recebem a bandeira escolhida) e os
# 2 emblemas texturizados (viram planos com o PNG do emblema). Peças móveis voltadas para trás/de lado no OBJ são "desgiradas" para a
# proa (−z) no próprio pivô — o jogo gira o grupo pelo azimute da simulação (sem isso a arma apareceria girada a mais).
# Compacta: posição Int16 (1/256 m) + normal Int8, 1 malha por material/cor.
import json, base64, struct, os, collections, math
AQUI = os.path.dirname(os.path.abspath(__file__))
META = json.load(open(os.path.join(AQUI, 'META.json')))
ESC = 256.0
V, N = [], []
obj = None; mat = None
FACES = collections.defaultdict(list)
for ln in open(os.path.join(AQUI, 'Destroier-Amorim.obj')):
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
    if 'heliponto_amarelo' in m or 'letras' in m or 'marca_calado' in m or 'heliponto_sinal' in m: return 'sinal', hx
    return 'metal', hx

A = META['armas']; TT = A['canhao_principal_155mm']['torres']
AUT = [('proa_bombordo', 0), ('proa_boreste', 1), ('popa_bombordo', 2), ('popa_boreste', 3)]
CIW = [('proa_bombordo', 0), ('proa_boreste', 1), ('popa_bombordo', 2), ('popa_boreste', 3)]
def grupo_de(o):
    for i in range(3):
        p = 'canhao_principal_155mm_%d_' % (i + 1)
        if o.startswith(p):
            r = o[len(p):]
            if r in ('cano', 'cano_furo'): return 'canos%d' % i
            if r in ('torre', 'base', 'berco', 'detalhes'): return 'torre%d' % i
            return 'base'
    for nm, k in CIW:
        if o in ('ciws_%s_cabeca' % nm, 'ciws_%s_cano' % nm, 'ciws_%s_cano_furo' % nm): return 'ciws%d' % k
    for nm, k in AUT:
        p = 'canhao_automatico_30mm_%s_' % nm
        if o.startswith(p) and not o.endswith('pedestal'): return 'auto%d' % k
    if o in ('radar_busca', 'radar_navegacao', 'radar_controle_tiro'): return 'radar:' + o
    if o.startswith('bandeira_Brasil_'): return 'flamula'
    if o.startswith('bandeira_proa_'): return 'flamulaProa'
    if o.startswith('emblema_marinha_'): return 'emblema'
    return 'base'

G = collections.defaultdict(lambda: collections.defaultdict(list))
for (o, m), fs in FACES.items(): G[grupo_de(o)][classe_mat(m)] += fs

def bbox(g):
    xs, ys, zs = [], [], []
    for fs in G[g].values():
        for f in fs:
            for vi, _ in f: x, y, z = V[vi]; xs.append(x); ys.append(y); zs.append(z)
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)

def rotY(x, z, th):  # rotação de three.js (rotation.y = th)
    c, s = math.cos(th), math.sin(th); return x * c + z * s, -x * s + z * c

def malhas(g, o, yaw=0.0, filtro=None):
    th = -math.radians(yaw); out = []
    for (m, c), fs in sorted(G[g].items()):
        P, Q = [], []
        for f in fs:
            if filtro and not filtro(f): continue
            for vi, ni in f:
                x, y, z = V[vi]; x, z = x - o[0], z - o[2]
                if yaw: x, z = rotY(x, z, th)
                P += [max(-32768, min(32767, int(round(v * ESC)))) for v in (x, y - o[1], z)]
                nx, ny, nz = N[ni] if ni >= 0 else (0, 1, 0)
                if yaw: nx, nz = rotY(nx, nz, th)
                Q += [int(round(nx * 127)), int(round(ny * 127)), int(round(nz * 127))]
        if P: out.append({'m': m, 'c': '#' + c, 'p': base64.b64encode(struct.pack('<%dh' % len(P), *P)).decode(), 'n': base64.b64encode(struct.pack('<%db' % len(Q), *Q)).decode()})
    return out

S = {'esc': ESC, 'base': malhas('base', (0, 0, 0)), 'torres': [], 'giram': {}, 'radares': {}}
for i, t in enumerate(TT):
    o = t['torre_origem']; yaw = t.get('yaw_graus', 0.0); pl = t['pivo_local']
    pw = [o[0], o[1] + pl[1], o[2]]  # pivô no mundo (antes de desgirar, a parte x/z do pivô gira com a torre)
    px, pz = rotY(pl[0], pl[2], math.radians(yaw)); pw = [o[0] + px, o[1] + pl[1], o[2] + pz]
    lado = lambda f, s: (sum(V[vi][0] for vi, _ in f) / 3 - o[0]) * (1 if abs(yaw) < 90 else -1) * s > 0
    S['torres'].append({'pos': o, 'piv': pl, 'malhas': malhas('torre%d' % i, o, yaw), 'cano': malhas('canos%d' % i, pw, yaw, lambda f: lado(f, -1)), 'cano2': malhas('canos%d' % i, pw, yaw, lambda f: lado(f, 1))})
for nm, k in CIW:
    a = A['ciws_' + nm]; b = bbox('ciws%d' % k); o = [a['pos'][0], b[2], a['pos'][2]]; S['giram']['ciws%d' % k] = {'pos': o, 'malhas': malhas('ciws%d' % k, o, a.get('yaw_graus', 0.0))}
for nm, k in AUT:
    a = A['canhao_automatico_30mm_' + nm]; o = a['cab_pivo']; S['giram']['auto%d' % k] = {'pos': o, 'malhas': malhas('auto%d' % k, o, a.get('yaw_graus', 0.0))}
for r in META['radares']:
    g = 'radar:' + r['nome']; b = bbox(g); o = [r['x'], b[2], r['z']]; S['radares'][r['nome']] = {'pos': o, 'w': r['w'], 'malhas': malhas(g, o)}
for g in ('flamula', 'flamulaProa'):
    b = bbox(g); S[g] = {'c': [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2, (b[4] + b[5]) / 2], 'l': b[5] - b[4], 'a': b[3] - b[2]}
S['emblemas'] = [{'c': e['centro'], 'n': e['normal'], 'ex': e['ex'], 'ey': e['ey'], 'r': e['raio']} for e in META['emblemas']]
S['chamines'] = [[c['x'], c['y'], c['z']] for c in META['chamines']]
js = '// GERADO por tools/destroier/gera.py a partir do modelo do Valter (Destróier Amorim D-01). Não editar à mão.\nexport const DESTROIER_GEO = ' + json.dumps(S, separators=(',', ':')) + ';\n'
dst = os.path.join(AQUI, '..', '..', 'src', 'render', 'destroierAmorimDados.js'); open(dst, 'w').write(js)
tri = {g: sum(len(f) for f in d.values()) for g, d in G.items()}
print(json.dumps({'tri': tri, 'total': sum(tri.values()), 'kb': round(len(js) / 1024), 'giram': {k: v['pos'] for k, v in S['giram'].items()}, 'radares': {k: v['pos'] for k, v in S['radares'].items()}, 'flamula': S['flamula'], 'flamulaProa': S['flamulaProa'], 'canos': [(len(t['cano']), len(t['cano2'])) for t in S['torres']]}, indent=0))
