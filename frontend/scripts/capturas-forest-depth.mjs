// Uso (desde frontend/, con front y back levantados): node scripts/capturas-forest-depth.mjs <carpeta>. Capturas reales con el usuario de demo Ana.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const out = process.argv[2]; mkdirSync(out, { recursive: true })
const ANCHOS = [1440, 1024, 768, 390]
const RUTAS = [['login', '/login'], ['inicio', '/'], ['produccion', '/produccion'], ['viajes', '/viajes']]
const b = await chromium.launch()
for (const w of ANCHOS) {
  const ctx = await b.newContext({ locale: 'es-AR', viewport: { width: w, height: 900 }, reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  await p.goto('http://localhost:5173/login'); await p.waitForTimeout(1200)
  await p.screenshot({ path: `${out}/login-${w}.jpg`, type: 'jpeg', quality: 75 })
  await p.getByLabel('Email').fill('ana.adm@indufor.demo')
  await p.getByLabel('Contraseña').fill('demo1234')
  await p.getByRole('button', { name: 'Ingresar' }).click()
  await p.waitForURL((u) => !u.pathname.includes('login'))
  for (const [n, r] of RUTAS.slice(1)) {
    await p.goto('http://localhost:5173' + r)
    await p.getByRole('heading', { level: 1 }).waitFor()
    await p.waitForLoadState('networkidle'); await p.waitForTimeout(900)
    await p.screenshot({ fullPage: true }) // la primera fullPage de Chromium dibuja mal la sidebar fija; se descarta
    await p.screenshot({ path: `${out}/${n}-${w}.jpg`, type: 'jpeg', quality: 75, fullPage: true })
  }
  await ctx.close()
}
await b.close()
console.log('ok', out)
