/// <reference lib="dom" />
import { mkdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// UIX-022: recorrido en celular (360 px, Android de gama baja como el del campo). Chequea desborde horizontal,
// objetivos táctiles de menos de 44 px y texto de menos de 12 px. Corre al final: usa los usuarios de las fases anteriores.
// Con RECORRIDO=<carpeta> además guarda capturas de página completa para revisarlas a mano.
const CARPETA = process.env.RECORRIDO
if (CARPETA) mkdirSync(CARPETA, { recursive: true })

test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })

type Usuario = { email: string; password: string }
const PANTALLAS: [string, Usuario, string[]][] = [
  ['administracion', ADMIN, ['/', '/produccion', '/produccion/nuevo', '/viajes', '/viajes/nuevo', '/correcciones', '/lecturas', '/lecturas/nueva',
    '/matafuegos/nuevo', '/mantenimiento', '/reportes', '/reportes?pestana=historico', '/reportes?pestana=mensual', '/reportes?pestana=consumos',
    '/reportes?pestana=operativo', '/reportes?pestana=integracion', '/usuarios', '/frentes', '/maquinaria']],
  ['gerencia', { email: 'gaby.e2e@indufor.test', password: 'gerencia6' }, ['/', '/reportes']],
  ['encargado', { email: 'enc.e2e@indufor.test', password: 'encargado1' }, ['/', '/produccion', '/produccion/nuevo', '/lecturas', '/lecturas/nueva', '/matafuegos/nuevo']],
  ['operaria', { email: 'olga.e2e@indufor.test', password: 'operaria1' }, ['/', '/produccion/nuevo', '/lecturas/nueva']],
  ['camionero', { email: 'teo.e2e@indufor.test', password: 'camion456' }, ['/', '/viajes', '/viajes/nuevo']],
  ['mantenimiento', { email: 'mara.e2e@indufor.test', password: 'manteni1' }, ['/', '/mantenimiento', '/lecturas']],
]

async function ingresar(page: Page, u: Usuario, tema: string) {
  await page.addInitScript((t) => localStorage.setItem('indufor:tema', t), tema)
  await page.goto('/login')
  await page.getByLabel('Email').fill(u.email)
  await page.getByLabel('Contraseña').fill(u.password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  // El login también tiene un h1: hay que esperar a salir de /login, no a ver un título
  await expect(page).not.toHaveURL(/\/login/)
}

/** Mide la pantalla visible: devuelve los problemas encontrados, cada uno con el elemento y la medida. */
async function medir(page: Page) {
  await page.evaluate('Promise.allSettled(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished)).then(() => null)')
  return page.evaluate(() => {
    const ancho = window.innerWidth
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('[aria-hidden="true"], .sr-only, [inert]')
    }
    const nombre = (el: Element) => {
      const t = (el.getAttribute('aria-label') ?? (el as HTMLElement).innerText ?? el.getAttribute('placeholder') ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${t}"`
    }
    // Dentro de un contenedor con scroll horizontal propio no desborda la página; si el contenedor
    // recorta (hidden o clip), lo que sobresale queda cortado y sí es un problema
    const enScroll = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX
        if (o === 'auto' || o === 'scroll') return true
      }
      return false
    }
    const problemas: string[] = []
    const fuera = [...document.querySelectorAll('body *')].filter((el) => visible(el) && !enScroll(el) && el.getBoundingClientRect().right > ancho + 1)
    if (fuera.length) {
      // Solo los más externos: si el padre ya sobresale, el hijo no agrega información
      const raiz = fuera.filter((el) => !fuera.includes(el.parentElement as Element))
      problemas.push(`desborde o recorte (página de ${document.documentElement.scrollWidth}px en ${ancho}px): ${raiz.slice(0, 4).map((el) => `${nombre(el)} hasta ${Math.round(el.getBoundingClientRect().right)}px`).join(' | ')}`)
    }
    const tocables = [...document.querySelectorAll('a[href], button, input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea, [role=tab], [role=combobox], [role=button]')]
    for (const el of tocables) {
      if (!visible(el) || (el as HTMLButtonElement).disabled) continue
      // Un link dentro de un párrafo es texto: WCAG 2.5.8 lo exceptúa
      if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p')) continue
      // Un checkbox o radio chico es válido si su etiqueta (el área que se toca) mide 44 px o más
      const etiqueta = el.closest('label') ?? (el.id ? document.querySelector(`label[for="${el.id}"]`) : null)
      if (/checkbox|radio/.test(el.getAttribute('role') ?? '') && etiqueta && etiqueta.getBoundingClientRect().height >= 44) continue
      const r = el.getBoundingClientRect()
      if (r.height < 44 || r.width < 44) problemas.push(`táctil chico: ${nombre(el)} ${Math.round(r.width)}×${Math.round(r.height)}`)
    }
    const chicos = new Set<string>()
    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())) continue
      const px = parseFloat(getComputedStyle(el).fontSize)
      if (px < 12) chicos.add(`texto de ${px}px: ${nombre(el)}`)
    }
    // Un campo con fuente de menos de 16 px hace que iOS agrande la página al enfocarlo
    for (const el of document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]), select, textarea')) {
      const px = parseFloat(getComputedStyle(el).fontSize)
      if (visible(el) && px < 16) chicos.add(`zoom en iOS (campo de ${px}px): ${nombre(el)}`)
    }
    return [...problemas, ...chicos]
  })
}

async function revisar(page: Page, rol: string, tema: string, ruta: string, etiqueta = '') {
  const problemas = await medir(page)
  if (CARPETA) {
    // Por tramos de pantalla, como se ve en el celular: la captura de página completa cose mal las barras fijas y el fondo
    const base = `${CARPETA}/${rol}-${tema}${ruta.replace(/[/?=]/g, '_')}${etiqueta}`
    const alto = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0, i = 1; y < alto && i <= 6; y += 640, i++) {
      await page.evaluate((top) => window.scrollTo(0, top), y)
      await page.screenshot({ path: `${base}-${i}.png` })
    }
    await page.evaluate(() => window.scrollTo(0, 0))
  }
  expect.soft(problemas, `${rol} ${tema} ${ruta}${etiqueta}`).toEqual([])
}

for (const [rol, usuario, rutas] of PANTALLAS) {
  test(`recorrido mobile: ${rol}`, async ({ page }) => {
    test.setTimeout(180_000)
    await ingresar(page, usuario, 'oscuro')
    for (const ruta of rutas) {
      await page.goto(ruta)
      await expect(page).not.toHaveURL(/\/login/)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByText(/^(Cargando|Consultando|Buscando)/)).toHaveCount(0)
      await revisar(page, rol, 'oscuro', ruta)
    }
    // Menú lateral abierto: en el celular es un panel que entra desde la izquierda
    await page.goto('/')
    await page.getByRole('button', { name: 'Menú' }).click()
    await revisar(page, rol, 'oscuro', '/', '-menu')
  })
}

// Diálogos de gestión (botón Cerrar, selects) y los extremos: celular chico de 320 px y celular en horizontal
const DIALOGOS: [string, string][] = [['/usuarios', 'Nuevo usuario'], ['/frentes', 'Nuevo frente'], ['/maquinaria', 'Nueva unidad'], ['/maquinaria', 'Tipos'], ['/viajes', 'Cargar remito']]
for (const [ancho, alto] of [[320, 640], [740, 360]]) {
  test(`recorrido mobile: administración a ${ancho}×${alto}, con diálogos`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: ancho, height: alto })
    await ingresar(page, ADMIN, 'oscuro')
    for (const ruta of ['/mantenimiento', '/reportes', '/usuarios', '/frentes', '/maquinaria', '/viajes']) {
      await page.goto(ruta)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByText(/^(Cargando|Consultando|Buscando)/)).toHaveCount(0)
      await revisar(page, 'administracion', `${ancho}`, ruta)
      for (const [, boton] of DIALOGOS.filter(([r]) => r === ruta)) {
        const abrir = page.getByRole('button', { name: boton }).first()
        if (!(await abrir.isVisible())) continue // sin viajes pendientes no hay remito que cargar
        await abrir.click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await revisar(page, 'administracion', `${ancho}`, ruta, `-${boton}`)
        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).toHaveCount(0)
      }
    }
  })
}

test('recorrido mobile: tema claro, login y validación de campo', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/login')
  await revisar(page, 'anonimo', 'oscuro', '/login')
  await ingresar(page, { email: 'enc.e2e@indufor.test', password: 'encargado1' }, 'claro')
  for (const ruta of ['/', '/produccion/nuevo', '/lecturas/nueva', '/matafuegos/nuevo']) {
    await page.goto(ruta)
    await expect(page.getByText(/^(Cargando|Consultando|Buscando)/)).toHaveCount(0)
    await revisar(page, 'encargado', 'claro', ruta)
  }
  // Formulario enviado vacío: los errores tienen que entrar sin romper la columna
  await page.goto('/produccion/nuevo')
  await page.getByRole('button', { name: 'Enviar parte' }).click()
  await expect(page.getByText('Elegí la máquina.')).toBeVisible()
  await revisar(page, 'encargado', 'claro', '/produccion/nuevo', '-errores')
})
