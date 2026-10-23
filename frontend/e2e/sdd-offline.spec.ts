import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// specs/04 CA-04.1 contra el build de producción (service worker real) y el backend real.
test.describe.configure({ mode: 'serial' })

const API = 'http://localhost:8001/api/v1'
const OPERARIA = { email: 'lia.offline@indufor.test', password: 'operaria9' }

async function ingresar(page: Page, u: { email: string; password: string }) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(u.email)
  await page.getByLabel('Contraseña').fill(u.password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
}

test('preparación: operaria y una unidad', async ({ page }) => {
  await ingresar(page, ADMIN)
  const crear = async (path: string, data: unknown) => {
    const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? ''
    const r = await page.request.post(`${API}${path}`, {
      data, headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(xsrf), Origin: 'http://localhost:5174', Referer: 'http://localhost:5174/' },
    })
    expect(r.ok(), `${path}: ${await r.text()}`).toBeTruthy()
    return (await r.json()).data
  }
  await crear('/users', { nombre: 'Lia', apellido: 'Offline', ...OPERARIA, roles: ['operario'] })
  const tipo = await crear('/machinery-types', { nombre: 'Harvester OFF', metrica: 'HOROMETRO' })
  await crear('/machinery', { nombre: 'HV-OFF', marca_modelo: 'Ponsse', id_tipo_maquinaria: tipo.id })
})

test('CA-04.1: con un borrador de lectura, la app se reabre sin señal con el formulario y el borrador', async ({ page, context }) => {
  await ingresar(page, OPERARIA)
  // El service worker queda instalado y controlando la página (primera visita con señal)
  // En texto: el tsconfig de e2e corre en Node y no trae los tipos del service worker
  await page.evaluate('navigator.serviceWorker.ready.then(() => true)')
  await page.reload()
  await expect.poll(() => page.evaluate('!!navigator.serviceWorker.controller')).toBe(true)

  await page.goto('/lecturas/nueva')
  await page.getByLabel('Unidad').selectOption({ label: 'HV-OFF · Harvester OFF' })
  await page.getByLabel('Horómetro (horas)').fill('777')

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByLabel('Horómetro (horas)')).toHaveValue('777')
  await expect(page.getByRole('button', { name: 'Sin conexión' })).toBeDisabled()
  await expect(page.getByText(/Sin conexión\. El borrador queda guardado en este equipo/)).toBeVisible()
  await context.setOffline(false)
})
