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
    expect(contraste(t['--color-border-strong'], t['--color-bg-surface'])).toBeGreaterThanOrEqual(3)
    expect(contraste(t['--color-focus-ring'], t['--color-bg-surface'])).toBeGreaterThanOrEqual(3)
  })
})
