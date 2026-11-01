# Naval B v1.3.00 — gera src/render/amorimDados.js a partir do modelo final do Valter (Navio-Amorim.html → pecas.json).
# Uso: python3 tools/amorim/gera.py
# Faz SÓ o que o jogo precisa, sem mexer na forma/cores/peças do modelo:
#  · separa as 2 torres de 3 canos (giro), o pivô de elevação e os 3 canos (recuo);
#  · separa os 3 radares e calcula o eixo de giro pelo PEDESTAL logo abaixo (antes giravam "fora de órbita");
#  · separa os 2 CIWS do teto do hangar e os 2 canhões automáticos pretos de ré (giram para mirar);
#  · tira o "tremor" (z-fighting) das camadas quase coplanares do heliponto de popa e da placa preta do teto do hangar;
#  · compacta posições em Int16 (passo 1/256 m = 4 mm) em base64.
import json, base64, struct, math, collections, os
AQUI = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(os.path.join(AQUI, 'pecas.json')))
ESC = 256.0

def tris(k):
    a = base64.b64decode(P[k]); f = struct.unpack('<%df' % (len(a) // 4), a)
    return [list(f[i:i + 9]) for i in range(0, len(f), 9)]

def componentes(T):
    n = len(T); par = list(range(n))
    def find(i):
        while par[i] != i: par[i] = par[par[i]]; i = par[i]
        return i
    vm = {}
    for t in range(n):
        for v in range(3):
            key = tuple(round(T[t][v * 3 + c], 3) for c in range(3))
            if key in vm:
                a, b = find(t), find(vm[key])
                if a != b: par[a] = b
            else: vm[key] = t
    G = collections.defaultdict(list)
    for t in range(n): G[find(t)].append(t)
    out = []
    for ts in G.values():
        xs = [T[t][v * 3] for t in ts for v in range(3)]; ys = [T[t][v * 3 + 1] for t in ts for v in range(3)]; zs = [T[t][v * 3 + 2] for t in ts for v in range(3)]
        out.append((ts, (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs))))
    return out

# ---------- torres (medidas no modelo) ----------
T1 = dict(zc=-64.27, yb=7.77, ypiv=10.21, zpiv=-67.90)   # torre de vante
T2 = dict(zc=-46.16, yb=10.22, ypiv=12.85, zpiv=-49.86)  # torre elevada (com o lança-granadas no teto)

def classifica(k, bb):
    x0, x1, y0, y1, z0, z1 = bb; cx = (x0 + x1) / 2; cz = (z0 + z1) / 2; w = x1 - x0
    if k.startswith('radar'): return k.split('_')[0]
    # canos (tubos finos à frente da casa da torre)
    if abs(cx) < 2.1 and w < 1.0:
        if z1 <= T1['zpiv'] + 0.1 and 9.6 < y0 and y1 < 10.8: return 'c1'
        if z1 <= T2['zpiv'] + 0.1 and 12.3 < y0 and y1 < 13.4: return 'c2'
    if w <= 10.2 and abs(cx) < 3.2:
        if -79.5 < cz < -59.0 and y0 >= 7.7 and y1 <= 12.9 and not (y0 >= 12.4 and cz > -61.0): return 't1'
        if -61.0 < cz < -40.4 and y0 >= 10.2 and y1 <= 17.5: return 't2'
    # CIWS do teto do hangar (domo + canos), x ≈ ±1,7, z 43–46
    if 42.9 < z0 and z1 < 46.2 and 9.55 < y0 and 0.9 < abs(cx) < 2.5 and k.startswith('mat_8'): return 'ciws0' if cx < 0 else 'ciws1'
    # canhões automáticos pretos de ré (z ≈ 33,6–37,3)
    if k.startswith('canhao_auto_preto') and 33.4 < z0 and z1 < 37.4: return 'a30_0' if cx < 0 else 'a30_1'
    return 'base'

# ---------- correções de z-fighting (só deslocamentos verticais de milímetros a centímetros) ----------
def corrige(k, t):
    ys = (t[1], t[4], t[7]); plano = max(ys) - min(ys) < 0.002; zc = (t[2] + t[5] + t[8]) / 3; xc = (t[0] + t[3] + t[6]) / 3
    dy = 0.0
    if 50.0 < zc < 72.0 and abs(xc) < 9.0 and plano:  # heliponto de popa: convés vermelho < preto < sinal
        if k.startswith('heliponto_sinal'): dy = 0.14
        elif k.startswith('heliponto_preto') and ys[0] < 5.40: dy = 0.08
        elif k.startswith('c02_5c2927') and abs(ys[0] - 5.283) < 0.004: dy = -0.07
    if k.startswith('mat_14_1b1e21') and 42.2 < zc < 49.9 and abs(xc) < 3.1 and 9.40 < min(ys) and max(ys) < 10.30: dy = 0.06  # placa preta do teto do hangar
    if k.startswith('c04_444d56') and 26.0 < zc < 27.4 and abs(xc) > 7.5: dy = 0.02
    if k.startswith('c05_1e2328') and -68.0 < zc < -64.2 and abs(ys[0] - 7.773) < 0.003 and plano: dy = 0.03
    if dy:
        for v in range(3): t[v * 3 + 1] += dy

# ---------- material por peça (mesmos parâmetros do HTML do Valter) ----------
GF = {'444d56': 'c4cad0', '454e55': 'b9c0c7'}
def material(k):
    if k == 'amarelo_VRA': return 'vra', 'ffd400'
    if k == 'laser_esfera': return 'laser', 'dfe6ea'
    hx = k.split('_')[-1]; hx = GF.get(hx, hx)
    if k.startswith('vls_nuclear_ouro'): return 'ouro', 'd4af37'
    if k.startswith('heliponto_sinal'): return 'sinal', hx
    if k.startswith('heliponto_preto') or k.startswith('vls_preto'): return 'fosco', hx
    if hx in ('0d1a24', '0a2630'): return 'vidro', hx
    if hx in ('ff1a1a', '1aff4a', 'fffbe8'): return 'luz_' + hx, hx
    return 'metal', hx

grupos = collections.defaultdict(lambda: collections.defaultdict(list))  # grupo -> (mat,cor) -> [tri]
for k in P:
    T = tris(k)
    for t in T: corrige(k, t)
    for ts, bb in componentes(T):
        g = classifica(k, bb); mat, cor = material(k)
        for i in ts: grupos[g][(mat, cor)].append(T[i])

# canos: separar os 3 canos de cada torre pelo x
def separa_canos(tag):
    out = collections.defaultdict(lambda: collections.defaultdict(list))
    for mc, L in grupos.pop(tag, {}).items():
        for t in L:
            cx = (t[0] + t[3] + t[6]) / 3
            nome = 'cano' if cx < -0.7 else ('cano2' if cx < 0.7 else 'cano3')
            out[nome][mc].append(t)
    return out
canos1, canos2 = separa_canos('c1'), separa_canos('c2')

# eixo dos radares = centro do pedestal (geometria de outras peças até 1,2 m abaixo da antena, num raio de 2,5 m)
todos = [(k, t) for k in P for t in tris(k)]
def eixo_radar(nome):
    L = [t for mc in grupos[nome].values() for t in mc]
    xs = [t[i] for t in L for i in (0, 3, 6)]; ys = [t[i] for t in L for i in (1, 4, 7)]; zs = [t[i] for t in L for i in (2, 5, 8)]
    cx, cz, y0 = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2, min(ys)
    px = []; pz = []
    for k, t in todos:
        if k.startswith('radar'): continue
        for v in range(3):
            x, y, z = t[v * 3], t[v * 3 + 1], t[v * 3 + 2]
            if y0 - 1.2 < y <= y0 + 0.05 and math.hypot(x - cx, z - cz) < 2.5: px.append(x); pz.append(z)
    if px: return ((min(px) + max(px)) / 2, y0, (min(pz) + max(pz)) / 2)
    return (cx, y0, cz)

def b64(L, o):
    a = []
    for t in L:
        for v in range(3):
            for c in range(3):
                q = int(round((t[v * 3 + c] - o[c]) * ESC)); a.append(max(-32768, min(32767, q)))
    return base64.b64encode(struct.pack('<%dh' % len(a), *a)).decode()

def malhas(D, o):
    return [{'m': m, 'c': '#' + c, 'p': b64(L, o)} for (m, c), L in sorted(D.items()) if L]

saida = {'esc': ESC, 'base': malhas(grupos['base'], (0, 0, 0))}
def torre(T, D, C):
    o = (0, T['yb'], T['zc']); piv = (0, T['ypiv'], T['zpiv'])
    return {'pos': o, 'malhas': malhas(D, o), 'piv': [piv[i] - o[i] for i in range(3)], 'canos': {n: malhas(Dc, piv) for n, Dc in C.items()}}
saida['torres'] = [torre(T1, grupos['t1'], canos1), torre(T2, grupos['t2'], canos2)]
saida['radares'] = {}
for nm in ('radar1', 'radar2', 'radar3'):
    e = eixo_radar(nm); saida['radares'][nm] = {'pos': e, 'malhas': malhas(grupos[nm], e)}
def piv_de(nome):
    L = [t for mc in grupos[nome].values() for t in mc]
    xs = [t[i] for t in L for i in (0, 3, 6)]; ys = [t[i] for t in L for i in (1, 4, 7)]; zs = [t[i] for t in L for i in (2, 5, 8)]
    return ((min(xs) + max(xs)) / 2, min(ys), (min(zs) + max(zs)) / 2)
saida['giram'] = {}
for nm in ('ciws0', 'ciws1', 'a30_0', 'a30_1'):
    e = piv_de(nm); saida['giram'][nm] = {'pos': e, 'malhas': malhas(grupos[nm], e)}

js = '// GERADO por tools/amorim/gera.py a partir do modelo final do Valter (não editar à mão).\nexport const AMORIM_GEO = ' + json.dumps(saida, separators=(',', ':')) + ';\n'
dst = os.path.join(AQUI, '..', '..', 'src', 'render', 'amorimDados.js'); open(dst, 'w').write(js)
info = {'torres': [{'pos': t['pos'], 'piv': t['piv']} for t in saida['torres']], 'radares': {k: v['pos'] for k, v in saida['radares'].items()}, 'giram': {k: v['pos'] for k, v in saida['giram'].items()},
        'tri': {g: sum(len(L) for L in D.values()) for g, D in grupos.items()}, 'canos': {n: sum(len(L) for L in D.values()) for n, D in list(canos1.items()) + list(canos2.items())}, 'kb': round(len(js) / 1024)}
print(json.dumps(info, indent=1))
