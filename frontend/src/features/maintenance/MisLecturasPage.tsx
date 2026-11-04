import { useState } from 'react'
import { Link } from 'react-router'
import { usePermiso } from '@/features/auth/api'
import { Button } from '@/shared/components/ui/button'
import { useLecturas } from './api'
import { TablaLecturas } from './TablaLecturas'
import { PageHeader } from '@/shared/components/PageHeader'

/** H-07.3: últimas lecturas visibles para el usuario (las suyas y las de sus frentes; el backend decide el alcance). */
export function MisLecturasPage() {
  const [pagina, setPagina] = useState(1)
  const lecturas = useLecturas({ page: pagina })
  const puedeCargar = usePermiso('maintenance.reading.create')
  return (
    <section className="grid gap-6">
      <PageHeader eyebrow="Operación / Lecturas" titulo="Lecturas" descripcion="Horómetros y kilometrajes cargados, propios y de tus frentes"
        accion={puedeCargar && <Button asChild className="h-11"><Link to="/lecturas/nueva">Cargar lectura</Link></Button>} />
      <TablaLecturas q={lecturas} onPagina={setPagina} conUnidad />
    </section>
  )
}
