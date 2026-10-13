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
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-border bg-popover p-4 shadow-sm"
    >
      <span className="text-foreground">Hay una nueva versión disponible.</span>
      <div className="flex gap-2">
        <button type="button" onClick={() => setNeedRefresh(false)} className="min-h-11 rounded-md px-3 text-soft">
          Más tarde
        </button>
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="min-h-11 rounded-md bg-primary px-4 font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Actualizar
        </button>
      </div>
    </div>
  )
}
