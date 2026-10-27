import { expect, test, type Page } from '@playwright/test'
import { ADMIN } from '../playwright.config.ts'

// Flujo crítico de Fase 1 sobre una base recién sembrada. Los tests dependen entre sí: corren en orden.
test.describe.configure({ mode: 'serial' })

const CAMIONERO = { nombre: 'Camila', apellido: 'Prueba', email: 'camila.e2e@indufor.test', password: 'camion123' }
const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })

async function ingresar(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
}

test('credenciales inválidas muestran el error del backend; las válidas entran', async ({ page }) => {
  await ingresar(page, ADMIN.email, 'incorrecta-1')
  await expect(page.getByRole('alert')).toContainText('El email o la contraseña no son correctos.')

  await ingresar(page, ADMIN.email, ADMIN.password)
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
})

test('administración da de alta un camionero', async ({ page }) => {
  await ingresar(page, ADMIN.email, ADMIN.password)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Usuarios' }).click()
  await page.getByRole('button', { name: 'Nuevo usuario' }).click()

  const dialogo = page.getByRole('dialog')
  await dialogo.getByLabel('Nombre').fill(CAMIONERO.nombre)
  await dialogo.getByLabel('Apellido').fill(CAMIONERO.apellido)
  await dialogo.getByLabel('Email').fill(CAMIONERO.email)
  await dialogo.getByLabel('Contraseña').fill(CAMIONERO.password)
  await dialogo.getByLabel('Camionero').check()
  await dialogo.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.getByText('Usuario creado.')).toBeVisible()
  await expect(page.getByRole('row', { name: /Prueba, Camila/ })).toContainText('Camionero')
})

test('asigna el camionero a Prusia y finaliza la asignación (historial)', async ({ page }) => {
  await ingresar(page, ADMIN.email, ADMIN.password)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Frentes' }).click()
  await expect(page.getByRole('row', { name: /Prusia/ })).toContainText('Individual')
  await page.getByRole('row', { name: /Prusia/ }).getByRole('button', { name: 'Asignaciones' }).click()

  const dialogo = page.getByRole('dialog')
  await dialogo.getByLabel('Usuario').selectOption({ label: 'Prueba, Camila' })
  await dialogo.getByRole('button', { name: 'Asignar' }).click()
  await expect(page.getByText('Usuario asignado.')).toBeVisible()
  const fila = dialogo.getByRole('row', { name: /Prueba, Camila/ })
  await expect(fila).toContainText('Sin fecha de fin')

  // Una segunda asignación superpuesta la rechaza el backend (D17)
  await dialogo.getByLabel('Usuario').selectOption({ label: 'Prueba, Camila' })
  await dialogo.getByRole('button', { name: 'Asignar' }).click()
  await expect(page.getByText('El usuario ya está asignado a este frente en esas fechas.')).toBeVisible()

  await fila.getByRole('button', { name: 'Finalizar' }).click()
  await fila.getByRole('button', { name: 'Confirmar' }).click()
  await expect(fila).toContainText(hoy.split('-').reverse().join('/'))
  await expect(fila).not.toContainText('Sin fecha de fin')
})

test('administración carga un tipo de maquinaria y una unidad', async ({ page }) => {
  await ingresar(page, ADMIN.email, ADMIN.password)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Maquinaria' }).click()

  await page.getByRole('button', { name: 'Tipos' }).click()
  const tipos = page.getByRole('dialog')
  await tipos.getByLabel('Nombre').fill('Camión')
  await tipos.getByLabel('Métrica').selectOption({ label: 'Kilometraje' })
  await tipos.getByRole('button', { name: 'Agregar' }).click()
  await expect(tipos.getByRole('row', { name: /Camión/ })).toContainText('Kilometraje')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Nueva unidad' }).click()
  const unidad = page.getByRole('dialog')
  await unidad.getByLabel('Nombre / número interno').fill('Camión 1')
  await unidad.getByLabel('Patente (opcional)').fill('ab 123 cd')
  await unidad.getByLabel('Marca y modelo').fill('Scania R450')
  await unidad.getByLabel('Tipo').selectOption({ label: 'Camión (Kilometraje)' })
  await unidad.getByLabel('Frente actual (opcional)').selectOption({ label: 'Prusia' })
  await unidad.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.getByText('Unidad creada.')).toBeVisible()
  await expect(page.getByRole('row', { name: /Camión 1/ })).toContainText('AB123CD')
})

test('el camionero no ve ni puede usar la gestión de usuarios, tampoco por API', async ({ page }) => {
  await ingresar(page, CAMIONERO.email, CAMIONERO.password)
  await expect(page.getByRole('heading', { name: 'Hola, Camila' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Usuarios' })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Frentes' })).toBeVisible()

  await page.goto('/usuarios')
  await expect(page.getByText('No tenés permiso para ver esta sección.')).toBeVisible()

  // La seguridad está en el backend: con su sesión, la API responde 403
  const estado = await page.evaluate(() =>
    fetch('http://localhost:8001/api/v1/users', { credentials: 'include', headers: { Accept: 'application/json' } }).then((r) => r.status),
  )
  expect(estado).toBe(403)

  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
