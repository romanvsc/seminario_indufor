// Aplica el tema guardado antes de pintar, para evitar el destello. Es un archivo porque la CSP de deploy/nginx.conf bloquea scripts en línea.
try {
  if (localStorage.getItem('indufor:tema') === 'claro') {
    document.documentElement.dataset.theme = 'light'
    document.querySelector('meta[name="theme-color"]').content = '#F4F7F4'
  }
} catch {
  // sin almacenamiento queda el tema oscuro
}
