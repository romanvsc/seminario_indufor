import { Spinner } from '@/shared/components/ui/spinner'

/** Texto de carga con indicador. El anuncio al lector de pantalla lo da el texto, dentro del `role="status"` de quien lo usa. */
export function Cargando() {
  return <span className="inline-flex items-center gap-2"><Spinner />Cargando…</span>
}
