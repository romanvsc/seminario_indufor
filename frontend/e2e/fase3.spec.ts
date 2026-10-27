import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// Gate de Fase 3: declaración → remito → cotejo exacto → corrección y recotejo, contra el backend real.
test.describe.configure({ mode: 'serial' })

const API = 'http://localhost:8001/api/v1'
const CAMIONERO = { email: 'teo.e2e@indufor.test', password: 'camion456' }

async function ingresar(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
}

async function apiConSesion(page: Page, path: string, data: unknown) {
  const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? ''
  const res = await page.request.post(`${API}${path}`, {
    data, headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(xsrf), Origin: 'http://localhost:5174', Referer: 'http://localhost:5174/' },
  })
  expect(res.ok(), `${path}: ${await res.text()}`).toBeTruthy()
  return (await res.json()).data
}

async function declarar(page: Page, origen: string, destino: string, madera: string, toneladas: string) {
  await page.goto('/viajes/nuevo')
  await page.getByLabel('Origen').selectOption({ label: origen })
  await page.getByLabel('Destino').fill(destino)
  await page.getByLabel('Camión').selectOption({ label: 'CM-E2E · AA000AA' })
  await page.getByLabel(madera).check()
  await page.getByLabel('Toneladas').fill(toneladas)
  await page.getByRole('button', { name: 'Declarar viaje' }).click()
  await expect(page.getByText('Viaje declarado.', { exact: false })).toBeVisible()
  // CA-07.5: la constancia queda en pantalla; el listado se abre a pedido
  await page.getByRole('link', { name: 'Ver mis viajes' }).click()
}

async function cargarRemito(page: Page, destino: string, numero: string, madera: string, toneladas: string) {
  await page.getByRole('row', { name: new RegExp(destino) }).getByRole('button', { name: 'Cargar remito' }).click()
  const d = page.getByRole('dialog')
  await d.getByLabel('Número de remito').fill(numero)
  await d.getByLabel('Transportista según el remito').selectOption({ label: 'Camionero, Teo' })
  await d.getByLabel('Tipo de madera').selectOption({ label: madera })
  await d.getByLabel('Toneladas').fill(toneladas)
  await d.getByRole('button', { name: 'Cargar y cotejar' }).click()
}

test('preparación: camionero y camión', async ({ page }) => {
  await ingresar(page, ADMIN.email, ADMIN.password)
  await apiConSesion(page, '/users', { nombre: 'Teo', apellido: 'Camionero', ...CAMIONERO, roles: ['camionero'] })
  const tipo = await apiConSesion(page, '/machinery-types', { nombre: 'Camión forestal', metrica: 'KILOMETRAJE' })
  await apiConSesion(page, '/machinery', { nombre: 'CM-E2E', dominio_patente: 'AA000AA', marca_modelo: 'Mercedes', id_tipo_maquinaria: tipo.id })
})

test('el camionero declara dos viajes y quedan pendientes; Bosques del Plata no es origen', async ({ page }) => {
  await ingresar(page, CAMIONERO.email, CAMIONERO.password)
  await page.goto('/viajes/nuevo')
  await expect(page.getByLabel('Origen').getByRole('option', { name: 'Bosques del Plata' })).toHaveCount(0)

  await declarar(page, 'Papel Misionero', 'Planta Norte E2E', 'pulpable', '25')
  await declarar(page, 'Prusia', 'Aserradero Sur E2E', 'aserrable', '18,5')
  await expect(page.getByRole('row', { name: /E2E/ })).toHaveCount(2)
  await expect(page.getByRole('row', { name: /Planta Norte E2E/ })).toContainText('○ Pendiente de remito')
})

test('remito idéntico valida; remito con diferencia abre corrección; corregir y recotejar valida', async ({ page }) => {
  await ingresar(page, ADMIN.email, ADMIN.password)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Viajes' }).click()

  await cargarRemito(page, 'Planta Norte E2E', 'E2E-0001', 'pulpable', '25,00')
  await expect(page.getByText('Viaje validado.', { exact: false })).toBeVisible()
  await expect(page.getByRole('row', { name: /Planta Norte E2E/ })).toContainText('✓ Validado')

  await cargarRemito(page, 'Aserradero Sur E2E', 'E2E-0002', 'aserrable', '1,85')
  await expect(page.getByText('Se abrió una solicitud de corrección', { exact: false })).toBeVisible()
  const fila = page.getByRole('row', { name: /Aserradero Sur E2E/ })
  await expect(fila).toContainText('⚠ Corrección solicitada')
  await expect(fila).toContainText('Volumen: declarado 18.50 t, remito 1.85 t.')

  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Correcciones' }).click()
  const solicitud = page.getByRole('listitem').filter({ hasText: 'Aserradero Sur E2E' })
  await solicitud.getByRole('button', { name: 'Tomar' }).click()
  await expect(solicitud).toContainText('↻ En revisión')
  await solicitud.getByRole('button', { name: 'Corregir' }).click()
  const d = page.getByRole('dialog')
  await d.getByLabel('Toneladas del remito').fill('18.50')
  await d.getByLabel('Motivo de la corrección').fill('Error de tipeo al cargar el remito')
  await d.getByRole('button', { name: 'Corregir y recotejar' }).click()
  await expect(page.getByText('quedó validado', { exact: false })).toBeVisible()
  await expect(page.getByText('No hay solicitudes abiertas.')).toBeVisible()

  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Viajes' }).click()
  await expect(page.getByRole('row', { name: /Aserradero Sur E2E/ })).toContainText('✓ Validado')
})

test('el camionero ve sus viajes validados y no accede a correcciones', async ({ page }) => {
  await ingresar(page, CAMIONERO.email, CAMIONERO.password)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Viajes' }).click()
  await expect(page.getByRole('row', { name: /E2E/ })).toHaveCount(2)
  await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Correcciones' })).toHaveCount(0)
  const estado = await page.evaluate(() => fetch('http://localhost:8001/api/v1/logistics/corrections', { credentials: 'include', headers: { Accept: 'application/json' } }).then((r) => r.status))
  expect(estado).toBe(403)
})
