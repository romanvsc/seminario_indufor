import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// Spec 03 (T-03.4) contra el backend real: el autor corrige su parte con motivo (D25); otro encargado del frente no puede.
test.describe.configure({ mode: 'serial' })

const API = 'http://localhost:8001/api/v1'
const AUTOR = { email: 'eva.corr@indufor.test', password: 'encargado8' }
const OTRO = { email: 'ivan.corr@indufor.test', password: 'encargado9' }
const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })

async function ingresar(page: Page, u: { email: string; password: string }) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(u.email)
  await page.getByLabel('Contraseña').fill(u.password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
}

async function crear(page: Page, path: string, data: unknown) {
  const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? ''
  const r = await page.request.post(`${API}${path}`, {
    data, headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(xsrf), Origin: 'http://localhost:5174', Referer: 'http://localhost:5174/' },
  })
  expect(r.ok(), `${path}: ${await r.text()}`).toBeTruthy()
  return (await r.json()).data
}

const leer = async (page: Page, path: string) =>
  (await (await page.request.get(`${API}${path}`, { headers: { Accept: 'application/json', Referer: 'http://localhost:5174/' } })).json()).data

test('preparación: dos encargados de Bosques del Plata, una máquina y un parte de 32,50 t', async ({ page }) => {
  await ingresar(page, ADMIN)
  const frente = (await leer(page, '/fronts')).find((f: { nombre: string }) => f.nombre === 'Bosques del Plata')
  for (const [u, nombre] of [[AUTOR, 'Eva'], [OTRO, 'Iván']] as const) {
    const usuario = await crear(page, '/users', { nombre, apellido: 'Corr', ...u, roles: ['encargado'] })
    await crear(page, '/front-assignments', { id_frente: frente.id, id_usuario: usuario.id, fecha_desde: '2026-10-01' })
  }
  const tipo = await crear(page, '/machinery-types', { nombre: 'Skidder Corr', metrica: 'HOROMETRO' })
  const unidad = await crear(page, '/machinery', { nombre: 'SK-CORR', marca_modelo: 'Tigercat', id_tipo_maquinaria: tipo.id, id_frente_actual: frente.id })

  await ingresar(page, AUTOR)
  const madera = (await leer(page, '/wood-types'))[0]
  await crear(page, '/production', { id_frente: frente.id, id_unidad: unidad.id, tipo_madera: madera.id, fecha_registro: hoy, cantidad_toneladas: 32.5 })
})

test('CA-03.1: el autor corrige 32,50 t a 30,00 t con motivo y el listado muestra el valor nuevo', async ({ page }) => {
  await ingresar(page, AUTOR)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Producción' }).click()
  const fila = page.getByRole('row', { name: /SK-CORR/ })
  await expect(fila).toContainText('32.50')
  await fila.getByRole('button', { name: /Corregir el parte/ }).click()

  const dialogo = page.getByRole('dialog')
  await dialogo.getByRole('button', { name: 'Guardar corrección' }).click()
  await expect(dialogo.getByText(/Contá en pocas palabras por qué corregís/)).toBeVisible()

  await dialogo.getByLabel('Toneladas').fill('30,00')
  await dialogo.getByLabel('Motivo de la corrección').fill('Toneladas mal transcriptas de la planilla')
  await dialogo.getByRole('button', { name: 'Guardar corrección' }).click()
  await expect(page.getByText('Corrección guardada.')).toBeVisible()
  await expect(dialogo).toBeHidden()
  await expect(fila).toContainText('30.00')
})

test('CA-03.2: otro encargado del frente ve el parte pero no puede corregirlo', async ({ page }) => {
  await ingresar(page, OTRO)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Producción' }).click()
  const fila = page.getByRole('row', { name: /SK-CORR/ })
  await expect(fila).toContainText('30.00')
  await expect(fila.getByRole('button', { name: /Corregir/ })).toHaveCount(0)
})
