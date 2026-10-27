import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// SDD bloque 1 (specs/02 y specs/05) contra el backend real.
test.describe.configure({ mode: 'serial' })

const API = 'http://localhost:8001/api/v1'
const OPERARIA = { email: 'nora.sdd@indufor.test', password: 'operaria7' }
const ENCARGADO = { email: 'eloy.sdd@indufor.test', password: 'encargado7' }
let idUnidad = 0
let idPapel = 0

async function ingresar(page: Page, u: { email: string; password: string }) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(u.email)
  await page.getByLabel('Contraseña').fill(u.password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
}

async function post(page: Page, path: string, data: unknown, headers: Record<string, string> = {}) {
  const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? ''
  return page.request.post(`${API}${path}`, {
    data, headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(xsrf), Origin: 'http://localhost:5174', Referer: 'http://localhost:5174/', ...headers },
  })
}

test('preparación: operaria, encargado asignado y una forestal', async ({ page }) => {
  await ingresar(page, ADMIN)
  const crear = async (path: string, data: unknown) => {
    const r = await post(page, path, data)
    expect(r.ok(), `${path}: ${await r.text()}`).toBeTruthy()
    return (await r.json()).data
  }
  const frentes = await (await page.request.get(`${API}/fronts`, { headers: { Accept: 'application/json', Referer: 'http://localhost:5174/' } })).json()
  idPapel = frentes.data.find((f: { nombre: string }) => f.nombre === 'Papel Misionero').id
  const operaria = await crear('/users', { nombre: 'Nora', apellido: 'SDD', ...OPERARIA, roles: ['operario'] })
  const enc = await crear('/users', { nombre: 'Eloy', apellido: 'SDD', ...ENCARGADO, roles: ['encargado'] })
  await crear('/front-assignments', { id_frente: idPapel, id_usuario: enc.id, fecha_desde: '2026-10-01' })
  const tipo = await crear('/machinery-types', { nombre: 'Harvester SDD', metrica: 'HOROMETRO' })
  // La operaria es la responsable: puede cargarle lecturas (D28)
  idUnidad = (await crear('/machinery', { nombre: 'HV-SDD', marca_modelo: 'Ponsse', id_tipo_maquinaria: tipo.id, id_usuario: operaria.id })).id
})

test('preparación: la operaria carga 100 h el lunes y 120 h el miércoles', async ({ page }) => {
  await ingresar(page, OPERARIA)
  for (const [fecha, h] of [['2026-10-12T08:00', 100], ['2026-10-14T08:00', 120]] as const) {
    const r = await post(page, '/maintenance/readings', { id_unidad: idUnidad, fecha_lectura: fecha, horometro_actual: h, tiene_falla: false })
    expect(r.status()).toBe(201)
  }
})

test('caso obligatorio: la lectura de 110 h del martes se acepta desde la pantalla y la de 130 h se bloquea', async ({ page }) => {
  await ingresar(page, OPERARIA)
  await page.goto('/lecturas/nueva')
  await page.getByLabel('Unidad').selectOption({ label: 'HV-SDD · Harvester SDD' })
  await page.getByLabel('Fecha y hora de la lectura').fill('2026-10-13T08:00')
  await expect(page.getByText('Lectura anterior a esa fecha:')).toContainText('100.00 h')
  await expect(page.getByText('Lectura posterior:')).toContainText('120.00 h')

  await page.getByLabel('Horómetro (horas)').fill('130')
  await expect(page.getByText(/Ya hay una lectura posterior de 120.00 h/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enviar lectura' })).toBeDisabled()

  await page.getByLabel('Horómetro (horas)').fill('110')
  await expect(page.getByText(/Ya hay una lectura posterior/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Enviar lectura' }).click()
  await expect(page.getByText('Lectura guardada.')).toBeVisible()
})

test('dos envíos simultáneos con la misma clave crean un solo parte; con otros datos responde 409', async ({ page }) => {
  await ingresar(page, ENCARGADO)
  const wood = await (await page.request.get(`${API}/wood-types`, { headers: { Accept: 'application/json', Referer: 'http://localhost:5174/' } })).json()
  const parte = { id_frente: idPapel, id_unidad: idUnidad, tipo_madera: wood.data[0].id, fecha_registro: '2026-10-13', cantidad_toneladas: 21.5 }
  const clave = { 'Idempotency-Key': 'sdd-concurrente-1' }

  const [a, b] = await Promise.all([post(page, '/production', parte, clave), post(page, '/production', parte, clave)])
  expect([a.status(), b.status()].sort()).toEqual([200, 201])
  expect((await a.json()).data.id).toBe((await b.json()).data.id)

  const distinto = await post(page, '/production', { ...parte, cantidad_toneladas: 22 }, clave)
  expect(distinto.status()).toBe(409)
  expect((await distinto.json()).error.code).toBe('CLAVE_REUTILIZADA')
})
