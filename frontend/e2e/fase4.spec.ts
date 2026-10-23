import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// Gate de Fase 4: RNF05 (incluida la carga concurrente), falla de punta a punta y control mensual de matafuegos.
test.describe.configure({ mode: 'serial' })

const API = 'http://localhost:8001/api/v1'
const OPERARIO = { email: 'olga.e2e@indufor.test', password: 'operaria1' }
const MANTENIMIENTO = { email: 'mara.e2e@indufor.test', password: 'manteni1' }
const UNIDAD = 'HV-E2E4 · Harvester E2E'
// Hora argentina explícita: el runner de CI está en UTC y el backend interpreta la fecha en America/Argentina/Buenos_Aires
const local = (horasAtras: number) => new Date(Date.now() - horasAtras * 3_600_000).toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).slice(0, 16).replace(' ', 'T')
let idUnidad = 0

async function ingresar(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
}

async function post(page: Page, path: string, data: unknown) {
  const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? ''
  return page.request.post(`${API}${path}`, {
    data, headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(xsrf), Origin: 'http://localhost:5174', Referer: 'http://localhost:5174/' },
  })
}

test('preparación: operaria, mantenimiento y una forestal por horómetro', async ({ page }) => {
  await ingresar(page, ADMIN.email, ADMIN.password)
  for (const [u, rol] of [[OPERARIO, 'operario'], [MANTENIMIENTO, 'mantenimiento']] as const) {
    expect((await post(page, '/users', { nombre: rol, apellido: 'E2E', ...u, roles: [rol] })).ok()).toBeTruthy()
  }
  const tipo = await (await post(page, '/machinery-types', { nombre: 'Harvester E2E', metrica: 'HOROMETRO' })).json()
  idUnidad = (await (await post(page, '/machinery', { nombre: 'HV-E2E4', marca_modelo: 'John Deere', id_tipo_maquinaria: tipo.data.id })).json()).data.id
})

test('lectura válida; una menor se bloquea en pantalla con la anterior a la vista', async ({ page }) => {
  await ingresar(page, OPERARIO.email, OPERARIO.password)
  await page.getByRole('link', { name: 'Cargar lectura' }).click()
  await page.getByLabel('Unidad').selectOption({ label: UNIDAD })
  await expect(page.getByText('No hay lecturas anteriores a esa fecha.')).toBeVisible()
  await page.getByLabel('Fecha y hora de la lectura').fill(local(48))
  await page.getByLabel('Horómetro (horas)').fill('1000')
  await page.getByRole('button', { name: 'Enviar lectura' }).click()
  await expect(page.getByText('Lectura guardada.')).toBeVisible()

  await page.goto('/lecturas/nueva')
  await page.getByLabel('Unidad').selectOption({ label: UNIDAD })
  await expect(page.getByText('1000.00 h')).toBeVisible()
  await page.getByLabel('Horómetro (horas)').fill('0100')
  await expect(page.getByText(/Es menor que la lectura anterior \(1000.00 h/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enviar lectura' })).toBeDisabled()
})

test('dos cargas simultáneas: solo pasa la que no deja a la otra en regresión (RNF05 con bloqueo)', async ({ page }) => {
  await ingresar(page, OPERARIO.email, OPERARIO.password)
  // A (más vieja, 1200) y B (más nueva, 1100): sean en el orden que sean, una de las dos rompe la no regresión
  const [a, b] = await Promise.all([
    post(page, '/maintenance/readings', { id_unidad: idUnidad, fecha_lectura: local(3), horometro_actual: 1200, tiene_falla: false }),
    post(page, '/maintenance/readings', { id_unidad: idUnidad, fecha_lectura: local(2), horometro_actual: 1100, tiene_falla: false }),
  ])
  expect([a.status(), b.status()].sort()).toEqual([201, 422])
  const rechazada = a.status() === 422 ? a : b
  expect((await rechazada.json()).error.code).toBe('LECTURA_REGRESIVA')
})

test('falla de punta a punta: la operaria la reporta, Mantenimiento la ve con contador y la atiende', async ({ page }) => {
  await ingresar(page, OPERARIO.email, OPERARIO.password)
  await page.goto('/lecturas/nueva')
  await page.getByLabel('Unidad').selectOption({ label: UNIDAD })
  await page.getByLabel('Hay una falla en el instrumento o la máquina').check()
  await page.getByLabel('¿Qué falla?').fill('El display del horómetro no enciende')
  await page.getByRole('button', { name: 'Enviar lectura' }).click()
  await expect(page.getByText('La falla quedó avisada a Mantenimiento.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Salir' }).click()

  await ingresar(page, MANTENIMIENTO.email, MANTENIMIENTO.password)
  await expect(page.getByRole('link', { name: 'Mantenimiento, 1 fallas abiertas' })).toBeVisible()
  await page.getByRole('link', { name: /Mantenimiento/ }).click()
  const falla = page.getByRole('listitem').filter({ hasText: 'El display del horómetro no enciende' })
  await expect(falla).toContainText('Reportó E2E, operario')
  await falla.getByRole('button', { name: 'Marcar atendida' }).click()
  await falla.getByLabel('Qué se hizo').fill('Se reemplazó el display')
  await falla.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByText('✓ No hay fallas abiertas.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mantenimiento', exact: true })).toBeVisible()
})

test('control mensual de matafuego: la operaria lo carga y Mantenimiento ve el vencimiento', async ({ page }) => {
  await ingresar(page, OPERARIO.email, OPERARIO.password)
  await page.getByRole('link', { name: 'Matafuego' }).click()
  await page.getByLabel('Unidad').selectOption({ label: UNIDAD })
  await page.getByLabel('Descargado').check()
  const vence = new Date(Date.now() + 10 * 86_400_000).toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })
  await page.getByLabel('Vence la carga').fill(vence)
  await page.getByRole('button', { name: 'Enviar control' }).click()
  await expect(page.getByText('Control guardado.')).toBeVisible()
  await page.getByRole('button', { name: 'Salir' }).click()

  await ingresar(page, MANTENIMIENTO.email, MANTENIMIENTO.password)
  await page.getByRole('link', { name: /Mantenimiento/ }).click()
  const fila = page.getByRole('row', { name: /HV-E2E4/ })
  await expect(fila).toContainText('Descargado')
  await expect(fila).toContainText(`⚠ Vence el ${vence.split('-').reverse().join('/')}`)
  await expect(fila).toContainText('✓ Leída esta semana')
})
