import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// Gate de Fase 2: flujo consolidado (Papel Misionero) e individual (Prusia) contra el backend real.
test.describe.configure({ mode: 'serial' })

const API = 'http://localhost:8001/api/v1'
const ENCARGADO = { email: 'enc.e2e@indufor.test', password: 'encargado1' }
const OPERARIO = { email: 'ope.e2e@indufor.test', password: 'operario1' }
const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })
// PNG de 1×1: alcanza para probar el adjunto
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

async function ingresar(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
}

/** Llamada a la API con la sesión del navegador (para preparar datos sin recorrer pantallas ya probadas en Fase 1). */
async function apiConSesion(page: Page, method: 'POST', path: string, data: unknown) {
  const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? ''
  const res = await page.request.fetch(`${API}${path}`, {
    method, data,
    headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(xsrf), Origin: 'http://localhost:5174', Referer: 'http://localhost:5174/' },
  })
  expect(res.ok(), `${path}: ${await res.text()}`).toBeTruthy()
  return (await res.json()).data
}

test('preparación: encargado en Papel Misionero, operario en Prusia y una máquina', async ({ page }) => {
  await ingresar(page, ADMIN.email, ADMIN.password)
  const frentes = await (await page.request.get(`${API}/fronts`, { headers: { Accept: 'application/json', Referer: 'http://localhost:5174/' } })).json()
  const idFrente = (n: string) => frentes.data.find((f: { nombre: string }) => f.nombre === n).id

  const enc = await apiConSesion(page, 'POST', '/users', { nombre: 'Elsa', apellido: 'Encargada', ...ENCARGADO, roles: ['encargado'] })
  const ope = await apiConSesion(page, 'POST', '/users', { nombre: 'Omar', apellido: 'Operario', ...OPERARIO, roles: ['operario'] })
  await apiConSesion(page, 'POST', '/front-assignments', { id_frente: idFrente('Papel Misionero'), id_usuario: enc.id, fecha_desde: hoy })
  await apiConSesion(page, 'POST', '/front-assignments', { id_frente: idFrente('Prusia'), id_usuario: ope.id, fecha_desde: hoy })
  const tipo = await apiConSesion(page, 'POST', '/machinery-types', { nombre: 'Harvester', metrica: 'HOROMETRO' })
  await apiConSesion(page, 'POST', '/machinery', { nombre: 'HV-01', marca_modelo: 'Ponsse', id_tipo_maquinaria: tipo.id, id_frente_actual: idFrente('Papel Misionero') })
})

test('el encargado carga un parte consolidado con foto en Papel Misionero', async ({ page }) => {
  await ingresar(page, ENCARGADO.email, ENCARGADO.password)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Producción' }).click()
  await page.getByRole('link', { name: 'Cargar parte' }).click()

  await expect(page.getByLabel('Frente')).toHaveValue(/\d+/)
  await expect(page.getByText('Carga consolidada del frente (encargado).')).toBeVisible()
  await page.getByLabel('Máquina').selectOption({ label: 'HV-01' })
  await page.getByLabel('pulpable').check()
  await page.getByLabel('Toneladas').fill('30,5')
  await page.getByLabel('Foto de la planilla o el monitor (opcional)').setInputFiles({ name: 'planilla.png', mimeType: 'image/png', buffer: PNG })
  await page.getByRole('button', { name: 'Enviar parte' }).click()

  await expect(page.getByText('Parte guardado.')).toBeVisible()
  await page.getByRole('link', { name: 'Ver mis partes' }).click()
  const fila = page.getByRole('row', { name: /Papel Misionero/ })
  await expect(fila).toContainText('30.50')
  await expect(fila).toContainText('pulpable')
  await expect(fila.getByRole('button', { name: 'Ver' })).toBeVisible()
})

test('el operario carga individual en Prusia, sin conexión no puede enviar y solo ve su frente', async ({ page, context }) => {
  await ingresar(page, OPERARIO.email, OPERARIO.password)
  await page.goto('/produccion/nuevo')
  await expect(page.getByText('Carga individual: quedás como operario productor.')).toBeVisible()
  await page.getByLabel('Máquina').selectOption({ label: 'HV-01' })
  await page.getByLabel('aserrable').check()
  await page.getByLabel('Metros cúbicos').fill('12')

  await context.setOffline(true)
  await expect(page.getByRole('button', { name: 'Sin conexión' })).toBeDisabled()
  await context.setOffline(false)
  await page.getByRole('button', { name: 'Enviar parte' }).click()

  await expect(page.getByText('Parte guardado.')).toBeVisible()
  await page.getByRole('link', { name: 'Ver mis partes' }).click()
  await expect(page.getByRole('row', { name: /Prusia/ })).toContainText('12.00')
  await expect(page.getByRole('row', { name: /Papel Misionero/ })).toHaveCount(0)
})

test('administración ve ambos partes y filtra por tipo de madera', async ({ page }) => {
  await ingresar(page, ADMIN.email, ADMIN.password)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Producción' }).click()
  await expect(page.getByRole('row', { name: /Papel Misionero|Prusia/ })).toHaveCount(2)
  await page.getByLabel('Madera').selectOption({ label: 'aserrable' })
  await expect(page.getByRole('row', { name: /Papel Misionero|Prusia/ })).toHaveCount(1)
  await expect(page.getByRole('row', { name: /Prusia/ })).toContainText('Operario')
})
