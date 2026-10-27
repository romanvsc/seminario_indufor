import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// Auditoría 2026-10-27 (P0): "Salir" sin señal no puede fingir el cierre. La cookie de sesión seguiría viva
// y el próximo que abra la app en ese equipo entraría como el usuario anterior.

async function ingresar(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(ADMIN.email)
  await page.getByLabel('Contraseña').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
}

test('sin señal, "Salir" avisa que la sesión sigue abierta; con señal, el reintento cierra de verdad', async ({ page, context }) => {
  await ingresar(page)

  await context.setOffline(true)
  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page.getByRole('alert')).toContainText('No se pudo cerrar la sesión.')
  await expect(page.getByRole('alert')).toContainText('sigue abierta en este equipo')
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()

  await context.setOffline(false)
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page).toHaveURL(/\/login$/)

  // La sesión quedó cerrada también en el servidor: al recargar no vuelve a entrar sola
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
})

test('si la sesión ya había vencido en el servidor, "Salir" lleva al login', async ({ page, context }) => {
  await ingresar(page)
  await context.clearCookies() // simula la sesión vencida: el backend responde 401/419
  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
