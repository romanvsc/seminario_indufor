// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs'
const css = readFileSync('src/index.css', 'utf8')
const bloque = (selector: string) => css.split(`${selector} {`)[1].split('}')[0]
const tokens = (selector: string) => Object.fromEntries([...bloque(selector).matchAll(/(--color-[\w-]+):\s*(#[\da-fA-F]{6})/g)].map((m) => [m[1], m[2]]))
const contraste = (a: string, b: string) => {
  const luminancia = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((n) => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4)
    .reduce((s, n, i) => s + n * [0.2126, 0.7152, 0.0722][i], 0)
  const [menor, mayor] = [luminancia(a), luminancia(b)].sort((x, y) => x - y)
  return (mayor + 0.05) / (menor + 0.05)
}

describe.each([':root', ':root[data-theme="light"]'])('contraste de tokens %s', (selector) => {
  const t = tokens(selector)
  it.each(['--color-text-primary', '--color-text-secondary', '--color-text-muted', '--color-state-success', '--color-state-warning', '--color-state-danger', '--color-state-info'])('%s es legible sobre la superficie', (color) => {
    expect(contraste(t[color], t['--color-bg-surface'])).toBeGreaterThanOrEqual(4.5)
  })
  it('mantiene contraste de acción, borde y foco', () => {
    expect(contraste(t['--color-action-primary-text'], t['--color-action-primary'])).toBeGreaterThanOrEqual(4.5)
    expect(contraste(t['--color-action-primary-text'], t['--color-action-primary-hover'])).toBeGreaterThanOrEqual(4.5)
    expect(contraste(t['--color-text-inverse'], t['--color-state-danger'])).toBeGreaterThanOrEqual(4.5) // botón destructivo
    expect(contraste(t['--color-border-strong'], t['--color-bg-surface'])).toBeGreaterThanOrEqual(3)
    expect(contraste(t['--color-focus-ring'], t['--color-bg-surface'])).toBeGreaterThanOrEqual(3)
  })
  it.each(['--color-bg-canvas', '--color-bg-surface', '--color-bg-elevated', '--color-bg-subtle'])('contrasta texto, estados y controles sobre %s', (fondo) => {
    for (const color of ['--color-text-primary', '--color-text-secondary', '--color-text-muted', '--color-state-success', '--color-state-warning', '--color-state-danger', '--color-state-info']) {
      expect(contraste(t[color], t[fondo]), `${color} sobre ${fondo}`).toBeGreaterThanOrEqual(4.5)
    }
    for (const color of ['--color-border-strong', '--color-focus-ring']) {
      expect(contraste(t[color], t[fondo]), `${color} sobre ${fondo}`).toBeGreaterThanOrEqual(3)
    }
  })
  it('la pestaña activa de la sidebar se distingue y su texto se lee', () => {
    const sidebar = bloque(selector).match(/--sidebar:\s*(#[\da-fA-F]{6})/)![1]
    const texto = bloque(selector).match(/--sidebar-foreground:\s*(#[\da-fA-F]{6})/)![1]
    expect(contraste(sidebar, t['--color-bg-canvas'])).toBeGreaterThanOrEqual(1.3) // el activo toma el canvas
    expect(contraste(texto, sidebar)).toBeGreaterThanOrEqual(4.5)
  })
  it.each(['--color-chart-pulpable', '--color-chart-aserrable'])('%s se distingue en el fondo del gráfico', (color) => {
    expect(contraste(t[color], t['--color-bg-surface'])).toBeGreaterThanOrEqual(3)
  })
})
