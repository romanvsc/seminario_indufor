import { expect, test, type Page } from '@playwright/test'

const usuario = {
  id: 1,
  nombre: 'Ana',
  apellido: 'Gerencia',
  email: 'ana@indufor.test',
  roles: [{ codigo: 'gerencia', nombre: 'Gerencia' }],
  permisos: ['dashboard.management', 'logistics.remito.create'],
}

const frenteEnMetrosCubicos = 'Frente de la reserva forestal con producción en metros cúbicos y un nombre suficientemente largo para ocupar más de una línea en la hoja impresa'

function dashboard(conDatos: boolean) {
  const porFrente = Array.from({ length: 36 }, (_, i) => ({
    id_frente: i + 1,
    frente: `Frente ${i + 1}`,
    tipo_madera: 'pulpable',
    toneladas: '12.50',
    metros_cubicos: null,
    partes: 1,
  }))

  return {
    hoy: '2026-11-18',
    quincena: {
      periodo: '2026-11', numero: 2, desde: '2026-11-16', hasta: '2026-11-30',
      por_frente: conDatos ? [...porFrente, {
        id_frente: 37,
        frente: frenteEnMetrosCubicos,
        tipo_madera: 'aserrable',
        toneladas: null,
        metros_cubicos: '18.75',
        partes: 1,
      }] : [],
    },
    viajes_quincena: [],
    operativo: {
      lecturas: 0, fallas_reportadas: 0, fallas_abiertas: 0, solicitudes_abiertas: 0,
      unidades_activas: 0, unidades_sin_lectura_semana: 0, matafuegos_vencidos: 0,
    },
    consumos_vencido: { periodo: '2026-10', fecha_limite: '2026-11-15', lote_vigente: null, litros: '0', costo_total: '0', unidades: 0 },
    tramo_anterior: { desde: '2026-11-01', hasta: '2026-11-03', por_frente: [], viajes: [] },
    serie_30_dias: {
      desde: '2026-10-20', hasta: '2026-11-18',
      filas: conDatos ? [
        { fecha: '2026-11-17', tipo_madera: 'pulpable', toneladas: '12.50', metros_cubicos: null },
        { fecha: '2026-11-17', tipo_madera: 'aserrable', toneladas: '4.25', metros_cubicos: null },
      ] : [],
    },
  }
}

async function abrirInicio(page: Page, tema: 'claro' | 'oscuro', conDatos: boolean) {
  await page.addInitScript((valor) => localStorage.setItem('indufor:tema', valor), tema)
  const respuestas: Record<string, unknown> = {
    '/api/v1/auth/me': { data: usuario },
    '/api/v1/me/pending': { data: {}, meta: { generado_at: '2026-11-18 17:26:00' } },
    '/api/v1/me/activity': { data: [] },
    '/api/v1/dashboard': { data: dashboard(conDatos) },
  }
  await page.route('**/api/v1/**', async (route) => {
    const solicitud = route.request()
    const headers = {
      'access-control-allow-origin': new URL(page.url()).origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'x-xsrf-token',
      'access-control-allow-methods': 'GET, OPTIONS',
    }
    if (solicitud.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers })
      return
    }

    const respuesta = respuestas[new URL(solicitud.url()).pathname]
    await route.fulfill({ status: respuesta ? 200 : 404, headers, json: respuesta ?? {} })
  })
  await page.goto('/')
}

for (const tema of ['claro', 'oscuro'] as const) {
  test(`imprime el resumen quincenal en tema ${tema} sin el resto de Inicio`, async ({ page }, testInfo) => {
    await page.addInitScript(`window.impresiones = 0; window.print = () => { window.impresiones += 1 }`)
    await abrirInicio(page, tema, true)

    const resumen = page.locator('[data-resumen-impresion]')
    const titulo = resumen.getByText('INDUFOR · Resumen quincenal', { exact: true })
    const principal = page.getByRole('navigation', { name: 'Principal' })
    const grano = page.getByTestId('fondo-grainient')
    const imprimir = resumen.getByRole('button', { name: 'Imprimir', exact: true })

    if (tema === 'claro') await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    else await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light')
    await expect(principal).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pendientes y alertas' })).toBeVisible()
    await expect(titulo).toBeHidden()
    await imprimir.click()
    expect(await page.evaluate('window.impresiones')).toBe(1)

    await page.emulateMedia({ media: 'print' })

    await expect(titulo).toBeVisible()
    await expect(resumen.getByText(/16\/11\/2026 al 18\/11\/2026/)).toBeVisible()
    await expect(principal).toBeHidden()
    await expect(grano).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Centro de operaciones' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Pendientes y alertas' })).toBeHidden()
    await expect(page.getByRole('navigation', { name: 'Accesos rápidos' })).toBeHidden()
    await expect(imprimir).toBeHidden()

    const tabla = resumen.getByRole('table')
    await expect(tabla.getByRole('columnheader', { name: 'Pulpable' })).toBeVisible()
    await expect(tabla.getByRole('row', { name: /16\/11.*12,50.*4,25/ })).toBeVisible()
    await expect(resumen.getByText(frenteEnMetrosCubicos)).toBeVisible()
    await expect(resumen.getByText('18,75 m³', { exact: true })).toBeVisible()

    await page.pdf({ path: testInfo.outputPath(`resumen-${tema}.pdf`), preferCSSPageSize: true, printBackground: false })
    await page.emulateMedia({ media: 'screen' })

    await expect(principal).toBeVisible()
    await expect(imprimir).toBeVisible()
    await expect(titulo).toBeHidden()
    await imprimir.click()
    expect(await page.evaluate('window.impresiones')).toBe(2)
  })
}

test('el resumen impreso conserva los estados sin producción ni consumos', async ({ page }, testInfo) => {
  await abrirInicio(page, 'oscuro', false)
  await page.emulateMedia({ media: 'print' })

  const resumen = page.locator('[data-resumen-impresion]')
  await expect(resumen.getByRole('heading', { name: /^INDUFOR · Resumen quincenal/ })).toBeVisible()
  await expect(resumen.getByText(/Sin importar/)).toBeVisible()
  await expect(resumen.getByRole('table').getByText('Sin partes en los últimos 30 días.', { exact: true })).toBeVisible()
  await expect(resumen.getByText('Todavía no hay partes en esta quincena.', { exact: true })).toBeVisible()
  await page.pdf({ path: testInfo.outputPath('resumen-vacio.pdf'), preferCSSPageSize: true, printBackground: false })
})
