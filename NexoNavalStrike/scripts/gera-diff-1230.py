#!/usr/bin/env python3
# uso: gera-diff-1230.py <base> <arvore> <saida.diff> — diff unificado (a/ = base 1.2.29, b/ = árvore atual), só fonte.
import os, sys, subprocess, filecmp
base, tree, out = sys.argv[1:4]
EXC_PREF = ['node_modules','dist','android/.gradle','android/build','android/app/build','android/capacitor-cordova-android-plugins/build',
            'android/app/src/main/assets/public','android/app/src/main/assets/capacitor.config.json','android/app/src/main/assets/capacitor.plugins.json','scripts']
def excl(rel):
    top = rel.split('/')[0]
    if top.startswith('capturas'): return True
    return any(rel == e or rel.startswith(e + '/') for e in EXC_PREF)
def lista(root):
    r = set()
    for d, ds, fs in os.walk(root):
        rd = os.path.relpath(d, root); rd = '' if rd == '.' else rd
        ds[:] = [x for x in ds if not excl((rd + '/' + x).lstrip('/'))]
        for f in fs:
            rel = (rd + '/' + f).lstrip('/')
            if not excl(rel): r.add(rel)
    return r
A, B = lista(base), lista(tree); n = 0; bin_ = 0
with open(out, 'wb') as o:
    for rel in sorted(A | B):
        a = os.path.join(base, rel) if rel in A else '/dev/null'; b = os.path.join(tree, rel) if rel in B else '/dev/null'
        if rel in A and rel in B and filecmp.cmp(a, b, shallow=False): continue
        r = subprocess.run(['diff', '-u', '--label', 'a/' + rel if rel in A else '/dev/null', '--label', 'b/' + rel if rel in B else '/dev/null', a, b], capture_output=True)
        if r.stdout.startswith(b'Binary'): o.write(('Binary files a/%s e b/%s diferem\n' % (rel, rel)).encode()); bin_ += 1
        else: o.write(r.stdout)
        n += 1
print(f'diff: {n} arquivos diferentes ({bin_} binários) -> {out} ({os.path.getsize(out)} B)')
