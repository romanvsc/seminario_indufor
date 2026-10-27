import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// Gate de Fase 6: Gerencia consulta dashboard y reportes sobre los datos que cargaron las fases 2 a 5;
// un rol sin permiso no accede a lo financiero ni por API.
test.describe.configure({ mode: 'serial' })

const API = 'http://localhost:8001/api/v1'
const GERENCIA = { email: 'gaby.e2e@indufor.test', password: 'gerencia6' }
const ENCARGADO = { email: 'enc.e2e@indufor.test', password: 'encargado1' } // creado en fase2.spec.ts

async function ingresar(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
}

test('preparación: usuario de Gerencia', async ({ page }) => {
  await ingresar(page, ADMIN.email, ADMIN.password)
  const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? ''
  const res = await page.request.post(`${API}/users`, {
    data: { nombre: 'Gaby', apellido: 'Gerencia', ...GERENCIA, roles: ['gerencia'] },
    headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(xsrf), Origin: 'http://localhost:5174', Referer: 'http://localhost:5174/' },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
})

test('Gerencia ve el dashboard con la producción de la quincena, separada por madera', async ({ page }) => {
  await ingresar(page, GERENCIA.email, GERENCIA.password)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard gerencial' })).toBeVisible()
  await expect(page.getByText('Producción pulpable (quincena)')).toBeVisible()
  await expect(page.getByText('Viajes validados (quincena)')).toBeVisible()
  await expect(page.getByRole('row', { name: /Papel Misionero pulpable/ })).toContainText('30,50 t')
  await expect(page.getByRole('row', { name: /Prusia aserrable/ })).toContainText('12,00 m³')
})

test('reportes: quincenal, consolidado mensual con consumos importados y consumos sin desglose inventado', async ({ page }) => {
  await ingresar(page, GERENCIA.email, GERENCIA.password)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Reportes' }).click()
  await expect(page.getByRole('tab', { name: 'Quincenal' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('row', { name: /^Total pulpable/ })).toBeVisible()

  await page.getByRole('tab', { name: 'Consolidado mensual' }).click()
  await page.getByLabel('Período').fill('2026-09') // importado en fase5.spec.ts
  // D21: se informa el lote vigente, nunca "completo"
  await expect(page.getByText('✓ Importado sin errores', { exact: false })).toBeVisible()
  await expect(page.getByText(/completo/i)).toHaveCount(0)
  await expect(page.getByRole('row', { name: /CT-E2E5/ })).toBeVisible()

  await page.getByRole('tab', { name: 'Consumos' }).click()
  await expect(page.getByText('Por frente y por operario: no disponible.', { exact: false })).toBeVisible()
})

test('un encargado no ve reportes ni accede a lo financiero por API (RNF03)', async ({ page }) => {
  await ingresar(page, ENCARGADO.email, ENCARGADO.password)
  await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Reportes' })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Dashboard' })).toHaveCount(0)
  const estados = await page.evaluate(async () => Promise.all(['/reports/monthly', '/reports/consumption?desde=2026-09&hasta=2026-09', '/dashboard'].map((u) =>
    fetch(`http://localhost:8001/api/v1${u}`, { credentials: 'include', headers: { Accept: 'application/json' } }).then((r) => r.status))))
  expect(estados).toEqual([403, 403, 403])
})
