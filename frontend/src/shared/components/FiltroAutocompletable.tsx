import { Children, isValidElement, useState, type ReactNode } from 'react'
import { CheckIcon, ChevronDown } from 'lucide-react'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'

type Opcion = { valor: string; texto: string }

function textoDe(nodo: ReactNode): string {
  if (typeof nodo === 'string' || typeof nodo === 'number') return String(nodo)
  if (Array.isArray(nodo)) return nodo.map(textoDe).join('')
  return ''
}

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase()

/** Filtro con búsqueda (Popover + Command de shadcn). Recibe `<option>`, igual que un select nativo. */
export function FiltroAutocompletable({ id, value, onChange, children, className = 'h-10', cargando, error }: {
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
  const visibles = opciones.filter((o) => normalizar(o.texto).includes(normalizar(busqueda)))
  const cambiarAbierto = (a: boolean) => {
    setAbierto(a)
    if (!a) setBusqueda('')
  }

  return (
    <Popover open={abierto} onOpenChange={cambiarAbierto}>
      <PopoverTrigger id={id} role="combobox" type="button"
        className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-left text-base outline-none md:text-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${className}`}>
        <span className="truncate">{actual}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-soft" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-56 p-0">
        {/* El filtro es propio porque ignora tildes */}
        <Command shouldFilter={false}>
          <CommandInput aria-label="Buscar opciones" placeholder="Buscar…" value={busqueda} onValueChange={setBusqueda} />
          <CommandList>
            <CommandGroup>
              {visibles.map((o) => (
                <CommandItem key={o.valor} value={`${o.valor}-${o.texto}`} className="min-h-10" onSelect={() => { onChange(o.valor); cambiarAbierto(false) }}>
                  <span className="truncate">{o.texto}</span>
                  {o.valor === String(value) && <CheckIcon aria-hidden="true" className="ml-auto" />}
                </CommandItem>
              ))}
            </CommandGroup>
            {cargando ? <p role="status" className="px-3 py-2 text-sm text-soft">Cargando opciones…</p>
              : error ? <p role="status" className="px-3 py-2 text-sm text-danger">No se pudieron cargar las opciones.</p>
                : visibles.length === 0 && <p role="status" className="px-3 py-2 text-sm text-soft">Sin opciones coincidentes</p>}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
