import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// Gate de Fase 5: exportación automática visible en el historial e importación idempotente del consolidado.
test.describe.configure({ mode: 'serial' })

const API = 'http://localhost:8001/api/v1'
const OPERARIO = { email: 'iker.e2e@indufor.test', password: 'operario5' }
const local = (horasAtras: number) => new Date(Date.now() - horasAtras * 3_600_000).toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).slice(0, 16).replace(' ', 'T')

async function ingresar(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
}

async function post(page: Page, path: string, data: unknown) {
  const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? ''
  const res = await page.request.post(`${API}${path}`, {
    data, headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(xsrf), Origin: 'http://localhost:5174', Referer: 'http://localhost:5174/' },
  })
  expect(res.ok(), `${path}: ${await res.text()}`).toBeTruthy()
  return (await res.json()).data
}

let idUnidad = 0

test('preparación: operario y camioneta con patente', async ({ page }) => {
  await ingresar(page, ADMIN.email, ADMIN.password)
  const operario = await post(page, '/users', { nombre: 'Iker', apellido: 'E2E', ...OPERARIO, roles: ['operario'] })
  const tipo = await post(page, '/machinery-types', { nombre: 'Camioneta E2E', metrica: 'KILOMETRAJE' })
  // Sin frente: el operario la carga por ser su responsable (D28)
  idUnidad = (await post(page, '/machinery', { nombre: 'CT-E2E5', dominio_patente: 'AF555EE', marca_modelo: 'Hilux', id_tipo_maquinaria: tipo.id, id_usuario: operario.id })).id
})

test('preparación: el operario registra una lectura', async ({ page }) => {
  await ingresar(page, OPERARIO.email, OPERARIO.password)
  await post(page, '/maintenance/readings', { id_unidad: idUnidad, fecha_lectura: local(1), kilometraje_actual: 120500, tiene_falla: false })
})

test('la lectura se exportó sola; el consolidado simulado se importa una vez y un segundo intento no duplica', async ({ page }) => {
  await ingresar(page, ADMIN.email, ADMIN.password)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Integración' }).click()
  await expect(page.getByText('✓ No hay lecturas pendientes de envío')).toBeVisible()
  await expect(page.getByRole('row', { name: /Exportación de lectura/ }).first()).toContainText('✓ OK')

  await page.getByLabel('Período', { exact: true }).fill('2026-09')
  const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar archivo de prueba' }).click()])
  const ruta = await descarga.path()
  expect(await readFile(ruta, 'utf8')).toContain('2026-09,AF555EE,')

  await page.getByLabel('Archivo CSV').setInputFiles(ruta)
  await page.getByRole('button', { name: 'Importar' }).click()
  await expect(page.getByText('Consolidado 2026-09 importado', { exact: false })).toBeVisible()
  const fila = page.getByRole('row', { name: /CT-E2E5/ })
  await expect(fila).toContainText('(AF555EE)')
  await expect(page.getByRole('row', { name: /^Total/ })).toBeVisible()

  await page.getByLabel('Archivo CSV').setInputFiles(ruta)
  await page.getByRole('button', { name: 'Importar' }).click()
  await expect(page.getByText('Ese archivo ya estaba importado', { exact: false })).toBeVisible()
  await expect(page.getByRole('row', { name: /Importación 2026-09/ })).toHaveCount(1)
})

test('otro archivo del mismo período pide reemplazo con motivo; con filas inválidas no se aplica (D21) y sin errores reemplaza', async ({ page }) => {
  await ingresar(page, ADMIN.email, ADMIN.password)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Integración' }).click()
  await page.getByLabel('Período', { exact: true }).fill('2026-09')
  const conError = 'periodo,codigo_unidad,litros,costo_total,referencia_externa\n2026-09,AF555EE,100.00,135000.00,CORR-1\n2026-09,NOEXISTE,1.00,1.00,X\n'
  const corregido = 'periodo,codigo_unidad,litros,costo_total,referencia_externa\n2026-09,AF555EE,100.00,135000.00,CORR-2\n'
  const subir = async (nombre: string, csv: string) => {
    await page.getByLabel('Archivo CSV').setInputFiles({ name: nombre, mimeType: 'text/csv', buffer: Buffer.from(csv) })
    await page.getByRole('button', { name: 'Importar' }).click()
  }

  await subir('con-error.csv', conError)
  await expect(page.getByRole('alert')).toContainText('ya tiene un consolidado importado')
  await expect(page.getByLabel('Reemplazar el consolidado ya importado de este período')).toBeChecked()

  await page.getByLabel('Motivo del reemplazo').fill('Corrección enviada por el sistema externo')
  await subir('con-error.csv', conError)
  const alerta = page.getByRole('alert').filter({ hasText: 'Reemplazo no aplicado' })
  await expect(alerta).toContainText('El consolidado vigente no cambió')
  await expect(alerta).toContainText('Fila 3: La unidad «NOEXISTE» no existe')
  await expect(page.getByRole('row', { name: /con-error.csv/ })).toContainText('✕ Reemplazo rechazado')
  await expect(page.getByRole('row', { name: /CT-E2E5/ })).not.toContainText('100,00 L') // sigue el valor del simulador

  await page.getByLabel('Reemplazar el consolidado ya importado de este período').check()
  await page.getByLabel('Motivo del reemplazo').fill('Corrección enviada por el sistema externo')
  await subir('corregido.csv', corregido)
  await expect(page.getByText('Consolidado 2026-09 importado: 1 unidades.')).toBeVisible()
  await expect(page.getByRole('row', { name: /CT-E2E5/ })).toContainText('100,00 L')
  await expect(page.getByRole('row', { name: /Importación 2026-09/ }).filter({ hasText: '↺ Reemplazado' })).toHaveCount(1)
})
