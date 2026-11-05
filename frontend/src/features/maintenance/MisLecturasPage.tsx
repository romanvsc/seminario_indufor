import { FiltroAutocompletable } from '@/shared/components/FiltroAutocompletable'
import { Link } from 'react-router'
import { usePermiso } from '@/features/auth/api'
import { useFrentes } from '@/features/fronts/api'
import { useUnidadesTodas } from '@/features/machinery/api'
import { FilterPanel } from '@/shared/components/FilterPanel'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useFiltrosUrl } from '@/shared/hooks/useFiltrosUrl'
import { useLecturas, type FiltrosLecturas } from './api'
import { TablaLecturas } from './TablaLecturas'

const VACIOS: FiltrosLecturas = { desde: '', hasta: '', unidad: '', frente: '', falla: '', page: 1 }

/** H-07.3: registro de lecturas visibles para el usuario (las suyas y las de sus frentes; el backend decide el alcance). */
export function MisLecturasPage() {
  const [filtros, setFiltros] = useFiltrosUrl<FiltrosLecturas>(VACIOS)
  const lecturas = useLecturas(filtros)
  const unidades = useUnidadesTodas()
  const frentes = useFrentes('todos')
  const puedeCargar = usePermiso('maintenance.reading.create')
  const filtrar = (c: Partial<FiltrosLecturas>) => setFiltros({ ...filtros, ...c, page: 1 })
  const conFiltros = Object.entries(filtros).some(([k, v]) => k !== 'page' && v !== '')
  return (
    <section className="grid gap-6">
      <PageHeader eyebrow="Operación / Lecturas" titulo="Lecturas" descripcion="Horómetros y kilometrajes cargados, propios y de tus frentes"
        accion={puedeCargar && <Button asChild className="h-11"><Link viewTransition to="/lecturas/nueva">Cargar lectura</Link></Button>} />

      <FilterPanel limpiable={conFiltros} onLimpiar={() => setFiltros(VACIOS)} columnas="grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <div className="grid gap-1.5">
          <Label htmlFor="desde">Desde</Label>
          <Input id="desde" type="date" className="h-10" value={filtros.desde} onChange={(e) => filtrar({ desde: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="hasta">Hasta</Label>
          <Input id="hasta" type="date" className="h-10" min={filtros.desde || undefined} value={filtros.hasta} onChange={(e) => filtrar({ hasta: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="unidad">Unidad</Label>
          <FiltroAutocompletable id="unidad" cargando={unidades.isLoading} error={unidades.isError} className="h-10" value={filtros.unidad} onChange={(valor) => filtrar({ unidad: valor })}>
            <option value="">Todas</option>
            {unidades.data?.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </FiltroAutocompletable>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="frente">Frente de la unidad</Label>
          <FiltroAutocompletable id="frente" cargando={frentes.isLoading} error={frentes.isError} className="h-10" value={filtros.frente} onChange={(valor) => filtrar({ frente: valor })}>
            <option value="">Todos</option>
            {frentes.data?.data.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </FiltroAutocompletable>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="falla">Estado</Label>
          <FiltroAutocompletable id="falla" className="h-10" value={filtros.falla} onChange={(valor) => filtrar({ falla: valor as FiltrosLecturas['falla'] })}>
            <option value="">Todos</option>
            <option value="sin">Sin falla</option>
            <option value="abierta">Falla abierta</option>
            <option value="atendida">Falla atendida</option>
          </FiltroAutocompletable>
        </div>
      </FilterPanel>

      <TablaLecturas q={lecturas} onPagina={(page) => setFiltros({ ...filtros, page })} conUnidad vacio={conFiltros ? 'No hay lecturas con esos filtros.' : undefined} />
    </section>
  )
}
