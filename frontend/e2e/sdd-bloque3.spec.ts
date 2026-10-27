import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// SDD bloque 3 (specs/04 y specs/06) contra el backend real.
test.describe.configure({ mode: 'serial' })

const API = 'http://localhost:8001/api/v1'
const OPERARIA = { email: 'tina.sdd3@indufor.test', password: 'operaria8' }
const MANTENIMIENTO = { email: 'mario.sdd3@indufor.test', password: 'manteni8' }
const UNIDAD = 'HV-SDD3 · Harvester SDD3'

async function ingresar(page: Page, u: { email: string; password: string }) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(u.email)
  await page.getByLabel('Contraseña').fill(u.password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
}

test('preparación: operaria, mantenimiento y una unidad', async ({ page }) => {
  await ingresar(page, ADMIN)
  const crear = async (path: string, data: unknown) => {
    const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? ''
    const r = await page.request.post(`${API}${path}`, {
      data, headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(xsrf), Origin: 'http://localhost:5174', Referer: 'http://localhost:5174/' },
    })
    expect(r.ok(), `${path}: ${await r.text()}`).toBeTruthy()
    return (await r.json()).data
  }
  const operaria = await crear('/users', { nombre: 'Tina', apellido: 'SDD', ...OPERARIA, roles: ['operario'] })
  await crear('/users', { nombre: 'Mario', apellido: 'SDD', ...MANTENIMIENTO, roles: ['mantenimiento'] })
  const tipo = await crear('/machinery-types', { nombre: 'Harvester SDD3', metrica: 'HOROMETRO' })
  // La operaria es la responsable: puede cargarle lecturas y matafuegos (D28)
  await crear('/machinery', { nombre: 'HV-SDD3', marca_modelo: 'Ponsse', id_tipo_maquinaria: tipo.id, id_usuario: operaria.id })
})

test('CA-04.4: se pierde la respuesta del envío → "no sabemos si llegó"; reintentar no duplica', async ({ page }) => {
  await ingresar(page, OPERARIA)
  // La lectura llega al backend y se guarda, pero la respuesta no vuelve al equipo
  await page.route('**/api/v1/maintenance/readings', async (route) => {
    await route.fetch()
    await route.abort('connectionreset')
  })
  await page.goto('/lecturas/nueva')
  await page.getByLabel('Unidad').selectOption({ label: UNIDAD })
  await page.getByLabel('Horómetro (horas)').fill('500')
  await page.getByRole('button', { name: 'Enviar lectura' }).click()
  await expect(page.getByText(/No sabemos si llegó/)).toBeVisible()

  await page.unroute('**/api/v1/maintenance/readings')
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByText('Lectura guardada (ya había llegado).')).toBeVisible()
})

test('CA-06.1: la operaria carga un matafuego faltante sin vencimiento', async ({ page }) => {
  await ingresar(page, OPERARIA)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Matafuego' }).click()
  await page.getByLabel('Unidad').selectOption({ label: UNIDAD })
  await page.getByLabel('Faltante').check()
  await expect(page.getByLabel('Vence la carga')).toHaveCount(0)
  await page.getByRole('button', { name: 'Enviar control' }).click()
  await expect(page.getByText('Control guardado.')).toBeVisible()
})

test('CA-06.3: Mantenimiento lo ve como alerta en el panel', async ({ page }) => {
  await ingresar(page, MANTENIMIENTO)
  await page.goto('/mantenimiento')
  await expect(page.getByRole('row', { name: /HV-SDD3/ })).toContainText('⚠ Falta el matafuego')
})
