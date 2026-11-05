# v1.2.19 item 10: gera as 5 arenas REAIS novas (grade 256x256, 14 km) a partir de Terrain Tiles (Mapzen/Tilezen, AWS Open Data:
# SRTM/USGS, ETOPO1/NOAA, GMTED — domínio público). Rodado UMA vez na máquina de build; o app não baixa nada.
# Água: profundidade real, com plataforma mínima navegável (jogo) que cresce com a distância da costa — o mesmo critério "aprox." das arenas antigas.
import math, os, sys, json, urllib.request, io
from PIL import Image
import numpy as np
CACHE = '/workspace/tiles-cache'; Z = 13
MAPAS = {
  'florianopolis': (-27.600, -48.585), 'salvador': (-12.975, -38.555), 'gibraltar': (36.105, -5.385),
  'saofrancisco': (37.812, -122.470), 'noronha': (-3.858, -32.428) }
def tile(x, y):
  p = f'{CACHE}/{Z}_{x}_{y}.png'
  if not os.path.exists(p):
    urllib.request.urlretrieve(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png', p)
  a = np.asarray(Image.open(p).convert('RGB')).astype(np.float64)
  return a[:, :, 0] * 256 + a[:, :, 1] + a[:, :, 2] / 256 - 32768
TC = {}
def elev(lat, lon):
  n = 2 ** Z; fx = (lon + 180) / 360 * n; la = math.radians(lat); fy = (1 - math.log(math.tan(la) + 1 / math.cos(la)) / math.pi) / 2 * n
  px, py = fx * 256 - 0.5, fy * 256 - 0.5; x0, y0 = math.floor(px), math.floor(py); tx, ty = px - x0, py - y0
  def g(X, Y):
    k = (X // 256, Y // 256)
    if k not in TC: TC[k] = tile(*k)
    return TC[k][Y % 256, X % 256]
  return (g(x0, y0) * (1 - tx) * (1 - ty) + g(x0 + 1, y0) * tx * (1 - ty) + g(x0, y0 + 1) * (1 - tx) * ty + g(x0 + 1, y0 + 1) * tx * ty)
def mascaraOSM(id, lat0, lon0, tam, N, H):
  """Linha de costa OSM (natural=coastline; terra à ESQUERDA do sentido do caminho) rasterizada a 4x e preenchida por inundação."""
  from PIL import ImageDraw
  from collections import deque
  f = f'/tmp/cl_{id}.json'
  if not os.path.exists(f): return H > 0.5
  d = json.load(open(f)); R = N * 4; k = R / tam; cl = math.cos(math.radians(lat0))
  def px(la, lo): return (((lo - lon0) * 111320 * cl) + tam / 2) * k, ((-(la - lat0) * 111320) + tam / 2) * k
  im = Image.new('L', (R, R), 0); dr = ImageDraw.Draw(im); seeds = []
  for e in d['elements']:
    g = [px(p['lat'], p['lon']) for p in e.get('geometry', [])]
    if len(g) < 2: continue
    dr.line(g, fill=1, width=2)
    for (x1, y1), (x2, y2) in zip(g, g[1:]):
      L = math.hypot(x2 - x1, y2 - y1)
      if L < 1e-6: continue
      nx, ny = (y2 - y1) / L, -(x2 - x1) / L  # esquerda do sentido em tela (y para baixo) = (dy, -dx)
      for t in (0.5,) if L < 8 else (0.25, 0.5, 0.75):
        mx, my = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t
        seeds.append((mx + nx * 2.5, my + ny * 2.5, 2)); seeds.append((mx - nx * 2.5, my - ny * 2.5, 3))
  B = np.asarray(im).astype(np.int8).copy(); Lb = np.zeros((R, R), np.int32); nc = 0
  for j0 in range(R):
    for i0 in np.nonzero((Lb[j0] == 0) & (B[j0] == 0))[0]:
      if Lb[j0, i0]: continue
      nc += 1; Lb[j0, i0] = nc; q = deque([(j0, i0)])
      while q:
        j, i = q.popleft()
        for dj, di in ((1,0),(-1,0),(0,1),(0,-1)):
          jj, ii = j + dj, i + di
          if 0 <= jj < R and 0 <= ii < R and B[jj, ii] == 0 and Lb[jj, ii] == 0: Lb[jj, ii] = nc; q.append((jj, ii))
  vt = np.zeros((nc + 1, 2))
  for x, y, v in seeds:
    i, j = int(x), int(y)
    if 0 <= i < R and 0 <= j < R and Lb[j, i]: vt[Lb[j, i], v - 2] += 1
  Hf0 = np.kron(H, np.ones((4, 4)))
  ter = np.zeros(nc + 1, bool)
  dem = np.bincount(Lb.ravel(), weights=(Hf0 > 1.0).ravel(), minlength=nc + 1) / np.maximum(1, np.bincount(Lb.ravel(), minlength=nc + 1))
  for c in range(1, nc + 1):
    ter[c] = vt[c, 0] > vt[c, 1] if vt[c].sum() >= 3 else dem[c] > 0.5
  M = np.where(B == 1, 2, np.where(ter[Lb], 2, 3)).astype(np.int8)
  Hf = np.kron(H, np.ones((4, 4)))
  frac = (M == 2).reshape(N, 4, N, 4).mean(axis=(1, 3))
  return frac >= 0.5
def gera(id, lat0, lon0, N=256, km=14):
  tam = km * 1000; cel = tam / N; H = np.zeros((N, N))
  for j in range(N):
    for i in range(N):
      x = (i + 0.5) * cel - tam / 2; z = (j + 0.5) * cel - tam / 2
      H[j, i] = elev(lat0 - z / 111320, lon0 + x / (111320 * math.cos(math.radians(lat0))))
  H = np.clip(H, -400, 3000); terra = mascaraOSM(id, lat0, lon0, tam, N, H)
  # distância à terra (BFS 4-viz em células)
  from collections import deque
  D = np.full((N, N), 1e9); q = deque()
  for j, i in zip(*np.nonzero(terra)): D[j, i] = 0; q.append((j, i))
  while q:
    j, i = q.popleft()
    for dj, di in ((1,0),(-1,0),(0,1),(0,-1)):
      jj, ii = j + dj, i + di
      if 0 <= jj < N and 0 <= ii < N and D[jj, ii] > D[j, i] + 1: D[jj, ii] = D[j, i] + 1; q.append((jj, ii))
  dm = D * cel
  agua = ~terra
  H[terra] = np.maximum(H[terra], 1.2 + np.minimum(dm[terra], 0) )
  plat = -(3.0 + np.minimum(dm, 2500) * 0.045 + np.maximum(0, dm - 2500) * 0.01)  # plataforma mínima: 12 m a 200 m da costa, 30 m a 600 m
  H[agua] = np.minimum(np.minimum(H[agua], -0.6), plat[agua])
  return H, tam
def codifica(H):
  q = np.where(H < 0, np.clip(64 + np.round(H / 2.4), 0, 63), np.clip(64 + np.round(np.sqrt(np.maximum(H, 0) * 36)), 64, 255))
  q[(H > 0) & (q == 64)] = 65
  return bytes(q.astype(np.uint8).flatten())
if __name__ == '__main__':
  import base64
  out = {}
  for id, (la, lo) in MAPAS.items():
    if len(sys.argv) > 1 and id not in sys.argv[1:]: continue
    H, tam = gera(id, la, lo)
    b = codifica(H); out[id] = {'lat': la, 'lon': lo, 'km': 14, 'n': 256, 'b64': base64.b64encode(b).decode()}
    # prévia
    v = np.clip((H + 60) / 400, 0, 1); img = np.zeros((256, 256, 3), np.uint8)
    img[..., 2] = np.where(H < 0, 120 + np.clip(H, -150, 0) * 0.6, 0); img[..., 1] = np.where(H >= 0, 80 + v * 170, 40); img[..., 0] = np.where(H >= 0, v * 200, 10)
    Image.fromarray(img).resize((512, 512), Image.NEAREST).save(f'/tmp/prev_{id}_{os.getpid()}.png')
    print(id, 'terra %.1f%%' % (100 * (H > 0).mean()), 'max %.0f' % H.max(), 'min %.0f' % H.min(), file=sys.stderr)
  json.dump(out, open('/tmp/arenas_novas.json', 'w'))
