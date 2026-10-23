import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { hayFotoPendiente } from '@/shared/pendientes'

/** Aviso de nueva versión: actualiza solo cuando el usuario lo pide, para no perder un formulario a medio cargar. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  // La foto elegida no entra en el borrador: si hay una sin enviar, se avisa antes de recargar (specs/04 T-04.8)
  const [avisoFoto, setAvisoFoto] = useState(false)

  if (!needRefresh) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-border bg-popover p-4 shadow-sm"
    >
      <span className="text-foreground">
        {avisoFoto ? 'Tenés una foto elegida sin enviar: si actualizás ahora se pierde. Lo demás del formulario queda guardado.' : 'Hay una nueva versión disponible.'}
      </span>
      <div className="flex gap-2">
        <button type="button" onClick={() => setNeedRefresh(false)} className="min-h-11 rounded-md px-3 text-soft">
          Más tarde
        </button>
        <button
          type="button"
          onClick={() => (!avisoFoto && hayFotoPendiente() ? setAvisoFoto(true) : updateServiceWorker(true))}
          className="min-h-11 rounded-md bg-primary px-4 font-medium text-primary-foreground hover:bg-primary-hover"
        >
          {avisoFoto ? 'Actualizar igual' : 'Actualizar'}
        </button>
      </div>
    </div>
  )
}
