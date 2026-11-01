#!/usr/bin/env python3
"""v1.2.33 — Assinatura APK Signature Scheme v2 (Android 7+) em Python puro + `cryptography`, sem Android SDK.

Uso:
  python3 tools/assina-apk-v2.py <entrada.apk> <saida.apk> <chave.p12> <senha>

A entrada já deve estar ALINHADA e, se quiser compatibilidade com Android 5/6, assinada em v1 (jarsigner).
Algoritmo: RSA PKCS#1 v1.5 + SHA-256 (id 0x0103), blocos de 1 MiB, conforme
https://source.android.com/docs/security/features/apksigning/v2
"""
import hashlib
import struct
import sys

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import pkcs12

ALG = 0x0103  # RSASSA-PKCS1-v1_5 com SHA2-256
V2_ID = 0x7109871A
MAGIC = b'APK Sig Block 42'
BLOCO = 1024 * 1024


def lp(b: bytes) -> bytes:
    return struct.pack('<I', len(b)) + b


def eocd(d: bytes):
    i = d.rfind(b'PK\x05\x06')
    assert i >= 0, 'EOCD não encontrado'
    cd_tam, cd_off = struct.unpack_from('<II', d, i + 12)
    return i, cd_off, cd_tam


def resumo(partes):
    chunks = []
    for p in partes:
        for i in range(0, len(p), BLOCO):
            c = p[i:i + BLOCO]
            chunks.append(hashlib.sha256(b'\xa5' + struct.pack('<I', len(c)) + c).digest())
    return hashlib.sha256(b'\x5a' + struct.pack('<I', len(chunks)) + b''.join(chunks)).digest()


def main():
    ent, sai, p12, senha = sys.argv[1:5]
    d = open(ent, 'rb').read()
    ie, cd_off, cd_tam = eocd(d)
    assert d[cd_off - 16:cd_off] != MAGIC, 'APK já tem bloco de assinatura v2'
    chave, cert, _ = pkcs12.load_key_and_certificates(open(p12, 'rb').read(), senha.encode())
    cert_der = cert.public_bytes(serialization.Encoding.DER)
    pub_der = chave.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)

    entradas, central, fim = d[:cd_off], d[cd_off:cd_off + cd_tam], d[ie:]
    dig = resumo([entradas, central, fim])  # EOCD aponta para cd_off = início do bloco que será inserido ali
    digests = lp(lp(struct.pack('<I', ALG) + lp(dig)))
    certs = lp(lp(cert_der))
    signed = lp(digests + certs + lp(b''))[4:]  # signed data = digests + certificates + additional attributes
    sig = chave.sign(signed, padding.PKCS1v15(), hashes.SHA256())
    signer = lp(signed) + lp(lp(struct.pack('<I', ALG) + lp(sig))) + lp(pub_der)
    valor = lp(lp(signer))
    par = struct.pack('<QI', 4 + len(valor), V2_ID) + valor
    tam = len(par) + 8 + 16
    bloco = struct.pack('<Q', tam) + par + struct.pack('<Q', tam) + MAGIC

    novo_fim = bytearray(fim)
    struct.pack_into('<I', novo_fim, 16, cd_off + len(bloco))
    open(sai, 'wb').write(entradas + bloco + central + bytes(novo_fim))
    print(f'v2 assinado → {sai} (bloco {len(bloco)} bytes)')


if __name__ == '__main__':
    main()
