import { useSearchParams } from 'react-router'

type Valor = string | number

/**
 * Filtros de un listado guardados en la URL (?desde=…&page=2): sobreviven a la navegación, al "Atrás" y se pueden
 * compartir (spec 08, T-08.6). Los valores por defecto no se escriben, para que la URL quede limpia.
 */
export function useFiltrosUrl<T extends Record<string, Valor>>(porDefecto: T): [T, (nuevos: T) => void] {
  const [params, setParams] = useSearchParams()
  const filtros = Object.fromEntries(
    Object.entries(porDefecto).map(([k, def]) => {
      const v = params.get(k)
      if (v === null) return [k, def]
      return [k, typeof def === 'number' ? Number(v) || def : v]
    }),
  ) as T
  const setFiltros = (nuevos: T) => {
    const limpio = Object.entries(nuevos).filter(([k, v]) => v !== porDefecto[k] && v !== '')
    setParams(new URLSearchParams(limpio.map(([k, v]) => [k, String(v)])), { replace: true })
  }
  return [filtros, setFiltros]
}
