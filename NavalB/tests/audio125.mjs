// v1.2.5 — mapa GATILHO → ARQUIVO de áudio (public/audio). Confere que cada arquivo existe e que o código o referencia. Uso: node tests/audio125.mjs
import fs from 'node:fs';
const src = ['src/NavalAudio.js', 'src/NavalAudioManager.js', 'src/modernNavalCombat3D.js', 'src/render/aereo3d.js', 'src/main.js'].map((f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8')).join('\n');
const MAPA = [
  ['motor a 1/3 e 2/3 (loop)', 'motor_diesel_loop'], ['motor em toda força (crossfade)', 'turbina_loop'], ['canhão leve / 30–76 mm / granadas', 'canhao_rapido'], ['canhão médio 100–130 mm', 'canhao_medio'],
  ['canhão grande 152 mm+', 'canhao_grande'], ['canhão distante', 'canhao_longe'], ['lançamento VLS', 'vls_lancamento'], ['CIWS', 'ciws'], ['alarme de trava', 'alarme_trava'], ['flares/iscas', 'flares'],
  ['torpedo correndo', 'torpedo_corrida'], ['bolhas/esteira do torpedo (loop)', 'bolhas_loop'], ['respingo de granada', 'respingo'], ['respingo grande / geiser', 'respingo_grande'], ['impacto no metal', 'impacto_metal'],
  ['explosão perto', 'explosao_perto'], ['explosão média', 'explosao_media'], ['explosão grande / afundamento', 'explosao_grande'], ['explosão longe / camada grave do disparo', 'explosao_longe'], ['incêndio (loop)', 'incendio_loop'], ['alagamento (loop)', 'alagamento_loop'],
  ['rádio', 'radio_estatica'], ['música do menu', 'musica_menu'], ['música da batalha', 'musica_batalha']];
let falta = 0; const out = [];
for (const [g, a] of MAPA) { const ex = fs.existsSync(new URL(`../public/audio/${a}.ogg`, import.meta.url)); const ref = src.includes(`'${a}'`) || src.includes(`"${a}"`) || src.includes(a); if (!ex || !ref) falta++; out.push(`${ex && ref ? '✔' : '✘'} ${g.padEnd(42)} → ${a}.ogg${ex ? '' : ' (ARQUIVO AUSENTE)'}${ref ? '' : ' (não referenciado no código)'}`); }
console.log(out.join('\n')); console.log(`\n${MAPA.length - falta}/${MAPA.length} gatilhos com arquivo e referência`); process.exit(falta ? 1 : 0);
