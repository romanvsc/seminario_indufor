// Aplica el tema antes de pintar, para evitar el destello. Es un archivo porque la CSP de deploy/nginx.conf bloquea scripts en línea.
// Claro por defecto: se lee al sol en el campo. El oscuro queda solo si el usuario lo eligió.
try {
  if (localStorage.getItem('indufor:tema') !== 'oscuro') document.documentElement.dataset.theme = 'light'
  else document.querySelector('meta[name="theme-color"]').content = '#111814'
} catch {
  // sin almacenamiento queda el claro
  document.documentElement.dataset.theme = 'light'
}
