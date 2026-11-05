import { Children, isValidElement, useEffect, useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'

type Opcion = { valor: string; texto: string }

function textoDe(nodo: ReactNode): string {
  if (typeof nodo === 'string' || typeof nodo === 'number') return String(nodo)
  if (Array.isArray(nodo)) return nodo.map(textoDe).join('')
  return ''
}

export function FiltroAutocompletable({ id, value, onChange, children, className, cargando, error }: {
  id: string
  value: string | number
  onChange: (valor: string) => void
  children: ReactNode
  className?: string
  cargando?: boolean
  error?: boolean
}) {
  const opciones: Opcion[] = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode }>(child) || child.type !== 'option') return []
    return [{ valor: String(child.props.value ?? ''), texto: textoDe(child.props.children) }]
  })
  const actual = opciones.find((o) => o.valor === String(value))?.texto ?? String(value)
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [indice, setIndice] = useState(-1)
  const listaId = useId()
  const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
  const visibles = opciones.filter((o) => normalizar(o.texto).includes(normalizar(busqueda)))
  const elegir = (opcion: Opcion) => { onChange(opcion.valor); setAbierto(false); setBusqueda(''); setIndice(-1) }
  useEffect(() => {
    if (abierto && indice >= 0) document.getElementById(`${listaId}-${indice}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [abierto, indice, listaId])

  return <div className="relative min-w-0">
    <Input id={id} role="combobox" aria-autocomplete="list" aria-expanded={abierto} aria-controls={abierto ? listaId : undefined}
      aria-activedescendant={abierto && indice >= 0 && visibles[indice] ? `${listaId}-${indice}` : undefined}
      autoComplete="off" className={`bg-card pr-9 ${className ?? 'h-10'}`} value={abierto ? busqueda : actual}
      onFocus={(e) => { setBusqueda(''); setIndice(-1); setAbierto(true); e.currentTarget.select() }}
      onClick={() => { if (!abierto) { setBusqueda(''); setAbierto(true) } }}
      onChange={(e) => { setBusqueda(e.target.value); setIndice(-1); setAbierto(true) }}
      onBlur={() => { setAbierto(false); setBusqueda(''); setIndice(-1) }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault(); setAbierto(true)
          setIndice((i) => e.key === 'ArrowDown' ? Math.min(i + 1, visibles.length - 1) : Math.max(i - 1, 0))
        } else if (e.key === 'Enter' && abierto && indice >= 0 && visibles[indice]) {
          e.preventDefault(); elegir(visibles[indice])
        } else if (e.key === 'Escape' && abierto) {
          e.preventDefault(); setAbierto(false); setBusqueda(''); setIndice(-1)
        }
      }} />
    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-soft" />
    {abierto && <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-card p-1 shadow-md">
      <ul id={listaId} role="listbox">
        {visibles.map((opcion, i) => <li key={opcion.valor} id={`${listaId}-${i}`} role="option" aria-selected={opcion.valor === String(value)}
          className={`min-h-10 cursor-pointer rounded-sm px-3 py-2 text-sm ${i === indice ? 'bg-brand/10' : ''}`}
          onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(opcion)} onMouseMove={() => setIndice(i)}>{opcion.texto}</li>)}
      </ul>
      {cargando ? <p role="status" className="px-3 py-2 text-sm text-soft">Cargando opciones…</p>
        : error ? <p role="status" className="px-3 py-2 text-sm text-danger">No se pudieron cargar las opciones.</p>
          : visibles.length === 0 && <p role="status" className="px-3 py-2 text-sm text-soft">Sin opciones coincidentes</p>}
    </div>}
  </div>
}
