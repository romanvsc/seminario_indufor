import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'

/** Indicador online/offline siempre visible (Context.md §3). Texto + punto: no depende solo del color. */
export function ConnectionBadge() {
  const online = useOnlineStatus()
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
        online ? 'border-success text-success' : 'border-warning text-warning'
      }`}
    >
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${online ? 'bg-success' : 'bg-warning'}`} />
      {online ? 'En línea' : 'Sin conexión'}
    </span>
  )
}
