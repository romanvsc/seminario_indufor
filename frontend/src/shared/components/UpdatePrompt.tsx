import { useRegisterSW } from 'virtual:pwa-register/react'

/** Aviso de nueva versión: actualiza solo cuando el usuario lo pide, para no perder un formulario a medio cargar. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-elevated p-4 shadow-sm"
    >
      <span className="text-primary">Hay una nueva versión disponible.</span>
      <div className="flex gap-2">
        <button type="button" onClick={() => setNeedRefresh(false)} className="min-h-11 rounded-[var(--radius-input)] px-3 text-secondary">
          Más tarde
        </button>
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="min-h-11 rounded-[var(--radius-input)] bg-action px-4 font-medium text-action-text hover:bg-action-hover"
        >
          Actualizar
        </button>
      </div>
    </div>
  )
}
