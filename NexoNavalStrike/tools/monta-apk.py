#!/usr/bin/env python3
"""v1.2.33 — Monta o APK do jogo SEM o Android SDK, a partir de um APK base já compilado.

Uso:
  python3 tools/monta-apk.py <apk-base> <dist/> <saida-nao-assinada.apk> [versionName] [versionCode]

O que faz:
  1. copia todas as entradas do APK base (mesmo método de compressão, bytes crus),
     tirando a assinatura antiga (META-INF/*.SF|*.RSA|*.DSA|*.EC|MANIFEST.MF) e a pasta assets/public/;
  2. coloca o conteúdo de dist/ (saída do `npm run build`) em assets/public/;
  3. troca versionName/versionCode no AndroidManifest.xml binário (opcional);
  4. alinha as entradas STORED em 4 bytes (resources.arsc etc., exigência do Android 11+).
Depois assine com jarsigner (v1) + tools/assina-apk-v2.py (v2). Ver tools/LEIA-APK.md.
"""
import os
import struct
import sys
import zipfile
import zlib

SEM_COMPRIMIR = ('.ogg', '.mp3', '.webp', '.png', '.jpg', '.jpeg', '.mp4', '.webm', '.woff2', '.gz', '.zip')
ASSINATURA = ('.SF', '.RSA', '.DSA', '.EC')


def troca_versao(axml: bytes, nome: str, codigo: int) -> bytes:
    """Troca versionName (mesmo tamanho) e versionCode no AndroidManifest binário (AXML)."""
    b = bytearray(axml)
    # string pool: logo após o cabeçalho de 8 bytes do arquivo
    sp = 8
    tipo, hsz, csz, nstr, nsty, flags, ini_str, ini_sty = struct.unpack_from('<HHIIIIII', b, sp)
    assert tipo == 0x0001, 'string pool não encontrado'
    utf8 = bool(flags & (1 << 8))
    offs = struct.unpack_from('<%dI' % nstr, b, sp + hsz)
    base = sp + ini_str

    def le(i):
        p = base + offs[i]
        if utf8:
            n = b[p]; p += 1
            if n & 0x80: p += 1
            m = b[p]; p += 1
            if m & 0x80: m = ((m & 0x7F) << 8) | b[p]; p += 1
            return p, bytes(b[p:p + m]).decode('utf-8'), 1
        n = struct.unpack_from('<H', b, p)[0]; p += 2
        return p, bytes(b[p:p + 2 * n]).decode('utf-16le'), 2

    idx_code = None
    idx_nome = None
    idx_nome_val = None
    for i in range(nstr):
        p, s, w = le(i)
        if s == 'versionCode':
            idx_code = i
        if s == 'versionName':
            idx_nome = i
    # atributos: procura (nameIdx = versionCode, tipo int) e (nameIdx = versionName, tipo string)
    p = sp + csz
    while p < len(b):
        t, hs, cs = struct.unpack_from('<HHI', b, p)
        if t == 0x0102:  # START_ELEMENT
            ns, nm, a_ini, a_tam, a_n = struct.unpack_from('<IIHHH', b, p + 16)
            a0 = p + 16 + a_ini
            for k in range(a_n):
                q = a0 + k * a_tam
                a_ns, a_nome, a_raw, sz, r0, dtyp, dado = struct.unpack_from('<IIIHBBI', b, q)
                if a_nome == idx_code and dtyp == 0x10:
                    struct.pack_into('<I', b, q + 16, codigo)
                if a_nome == idx_nome and dtyp == 0x03:
                    idx_nome_val = dado
        p += cs
    if idx_nome_val is not None:
        p, s, w = le(idx_nome_val)
        assert len(s) == len(nome), f'versionName precisa ter o mesmo tamanho ({s!r} → {nome!r})'
        b[p:p + len(s) * w] = nome.encode('utf-8' if w == 1 else 'utf-16le')
    return bytes(b)


def entrada_crua(z: zipfile.ZipFile, info: zipfile.ZipInfo) -> bytes:
    """Bytes comprimidos exatamente como estão no APK base."""
    f = z.fp
    f.seek(info.header_offset)
    h = f.read(30)
    nlen, xlen = struct.unpack('<HH', h[26:30])
    f.seek(info.header_offset + 30 + nlen + xlen)
    return f.read(info.compress_size)


def main():
    base, dist, saida = sys.argv[1:4]
    vnome = sys.argv[4] if len(sys.argv) > 4 else None
    vcod = int(sys.argv[5]) if len(sys.argv) > 5 else None
    zb = zipfile.ZipFile(base)
    itens = []  # (nome, metodo, crc, tam, dados_comprimidos)
    for info in zb.infolist():
        n = info.filename
        if n.startswith('assets/public/'):
            continue
        if n.startswith('META-INF/') and (n.endswith(ASSINATURA) or n == 'META-INF/MANIFEST.MF'):
            continue
        if n == 'AndroidManifest.xml' and vnome:
            dados = troca_versao(zb.read(n), vnome, vcod)
            c = zlib.compressobj(9, zlib.DEFLATED, -15)
            comp = c.compress(dados) + c.flush()
            itens.append((n, 8, zlib.crc32(dados), len(dados), comp))
            continue
        itens.append((n, info.compress_type, info.CRC, info.file_size, entrada_crua(zb, info)))
    for raiz, _, arqs in os.walk(dist):
        for a in sorted(arqs):
            caminho = os.path.join(raiz, a)
            rel = os.path.relpath(caminho, dist).replace(os.sep, '/')
            dados = open(caminho, 'rb').read()
            if a.lower().endswith(SEM_COMPRIMIR):
                itens.append(('assets/public/' + rel, 0, zlib.crc32(dados), len(dados), dados))
            else:
                c = zlib.compressobj(9, zlib.DEFLATED, -15)
                comp = c.compress(dados) + c.flush()
                itens.append(('assets/public/' + rel, 8, zlib.crc32(dados), len(dados), comp))
    escreve(itens, saida)
    print(f'{len(itens)} entradas → {saida}')


def escreve(itens, saida):
    """Zip com entradas STORED alinhadas em 4 bytes (campo extra de preenchimento)."""
    out = open(saida, 'wb')
    central = []
    for nome, met, crc, tam, comp in itens:
        nb = nome.encode('utf-8')
        off = out.tell()
        extra = b''
        if met == 0:
            ini = off + 30 + len(nb)
            pad = (-ini) % 4
            extra = b'\x00' * pad
        flag = 0x0800 if any(ord(ch) > 127 for ch in nome) else 0
        out.write(struct.pack('<IHHHHHIIIHH', 0x04034b50, 20, flag, met, 0, 0x21, crc & 0xFFFFFFFF, len(comp), tam, len(nb), len(extra)))
        out.write(nb); out.write(extra); out.write(comp)
        central.append(struct.pack('<IHHHHHHIIIHHHHHII', 0x02014b50, 20, 20, flag, met, 0, 0x21, crc & 0xFFFFFFFF, len(comp), tam, len(nb), 0, 0, 0, 0, 0, off) + nb)
    cd = out.tell()
    for c in central:
        out.write(c)
    fim = out.tell()
    out.write(struct.pack('<IHHHHIIH', 0x06054b50, 0, 0, len(central), len(central), fim - cd, cd, 0))
    out.close()


if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == '--realinha':
        # realinha um APK já assinado em v1 (jarsigner reescreve o zip sem alinhar)
        z = zipfile.ZipFile(sys.argv[2])
        escreve([(i.filename, i.compress_type, i.CRC, i.file_size, entrada_crua(z, i)) for i in z.infolist()], sys.argv[3])
    else:
        main()
