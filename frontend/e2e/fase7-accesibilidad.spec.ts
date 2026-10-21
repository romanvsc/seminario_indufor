import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// Fase 7 (design QA): WCAG 2.1 A/AA sin violaciones graves en las pantallas principales.
// Corre al final: usa los usuarios que crearon las fases anteriores.
const PANTALLAS: [string, { email: string; password: string }, string[]][] = [
  ['administración', ADMIN, ['/', '/usuarios', '/frentes', '/maquinaria', '/viajes', '/correcciones', '/integracion', '/produccion']],
  ['gerencia', { email: 'gaby.e2e@indufor.test', password: 'gerencia6' }, ['/dashboard', '/reportes']],
  ['encargado (campo)', { email: 'enc.e2e@indufor.test', password: 'encargado1' }, ['/produccion/nuevo', '/lecturas/nueva', '/matafuegos/nuevo']],
  ['camionero (campo)', { email: 'teo.e2e@indufor.test', password: 'camion456' }, ['/viajes/nuevo']],
  ['mantenimiento', { email: 'mara.e2e@indufor.test', password: 'manteni1' }, ['/mantenimiento']],
]

async function sinViolacionesGraves(page: Page, ruta: string) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(graves.map((v) => `${ruta}: ${v.id} — ${v.help} (${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')})`)).toEqual([])
}

test('login', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible()
  await sinViolacionesGraves(page, '/login')
})

for (const [rol, usuario, rutas] of PANTALLAS) {
  test(`pantallas de ${rol}`, async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(usuario.email)
    await page.getByLabel('Contraseña').fill(usuario.password)
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
    for (const ruta of rutas) {
      await page.goto(ruta)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByText('Cargando…')).toHaveCount(0)
      await sinViolacionesGraves(page, ruta)
    }
  })
}
