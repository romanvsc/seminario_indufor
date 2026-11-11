// Verifica el build de producción de la PWA (correr después de `npm run build`).
// Falla si falta el manifest, los íconos o el service worker, o si el SW cachea la API:
// un dato de campo servido desde caché podría mostrarse como confirmado sin que el backend lo haya visto.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import assert from 'node:assert/strict'

const dist = new URL('../dist/', import.meta.url)
const leer = (f) => readFileSync(new URL(f, dist), 'utf8')

const manifest = JSON.parse(leer('manifest.webmanifest'))
assert.ok(manifest.name?.includes('INDUFOR'), 'el manifest debe nombrar a INDUFOR')
assert.equal(manifest.display, 'standalone', 'la PWA se instala como app')
assert.ok(manifest.start_url, 'falta start_url')
for (const tam of ['192x192', '512x512']) {
  const icono = manifest.icons?.find((i) => i.sizes === tam)
  assert.ok(icono, `falta el ícono ${tam}`)
  assert.ok(existsSync(new URL(icono.src.replace(/^\//, ''), dist)), `no existe ${icono.src}`)
}

const sw = leer('sw.js')
assert.ok(sw.includes('precacheAndRoute'), 'el SW debe precachear el shell de la app')
assert.ok(!/registerRoute\([^)]*api/.test(sw), 'el SW no debe cachear respuestas de la API')
assert.ok(sw.includes('api') && sw.includes('sanctum'), 'la API y sanctum deben estar excluidos del fallback de navegación')
assert.ok(leer('index.html').includes('manifest.webmanifest'), 'index.html debe enlazar el manifest')
for (const familia of ['space-grotesk', 'plus-jakarta-sans', 'jetbrains-mono']) {
  const fuente = readdirSync(new URL('assets/', dist)).find((f) => f.startsWith(familia) && f.endsWith('.woff2'))
  assert.ok(fuente, `falta la fuente local ${familia}`)
  assert.ok(sw.includes(fuente), `la fuente ${familia} debe estar en el precache`)
  assert.ok(existsSync(new URL(`font-licenses/${familia}.txt`, dist)), `falta la licencia de ${familia}`)
}

console.log('PWA OK: manifest, íconos, service worker y API fuera de la caché')
