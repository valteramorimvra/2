# Gerar o APK sem Android SDK (v1.2.33)

Use quando o SDK do Android não estiver disponível. A parte nativa (Capacitor) vem de um APK base
já compilado; só o jogo (assets/public) é trocado.

```
npm ci && npm run build
python3 tools/monta-apk.py <apk-base.apk> dist saida-nao-assinada.apk 1.2.33 36
cp saida-nao-assinada.apk v1.apk
jarsigner -keystore <chave.p12> -storetype PKCS12 -sigalg SHA256withRSA -digestalg SHA-256 v1.apk <alias>
python3 tools/monta-apk.py --realinha v1.apk v1a.apk
python3 tools/assina-apk-v2.py v1a.apk NexoNavalStrike-1.2.33.apk <chave.p12> <senha>   # precisa do pacote 'cryptography'
```

- `versionName` só pode trocar por outro do mesmo tamanho (ex.: 1.2.31 → 1.2.33).
- Atualizações do app instalado precisam da MESMA chave. Guarde a chave e a senha.
- Com o Android SDK disponível, o caminho normal continua valendo: `npx cap sync android && cd android && ./gradlew assembleRelease`.
