/**
 * Estados de un formulario de campo (specs/04): borrador conservado o no, sin conexión, envío en curso y resultado
 * incierto. "Guardado" nunca se muestra acá: solo después de la respuesta del backend.
 */
export function EstadoEnvio({ online, enviando, borradorOk, incierto }: { online: boolean; enviando: boolean; borradorOk: boolean; incierto: boolean }) {
  return (
    <div aria-live="polite" className="grid gap-2">
      {incierto && !enviando && (
        <p role="alert" className="rounded-md border border-warning p-3">
          ? No sabemos si llegó: se cortó la conexión mientras se enviaba. Tocá «Reintentar»: si ya se guardó, no se va a duplicar.
        </p>
      )}
      {!borradorOk && (
        <p role="alert" className="rounded-md border border-danger p-3 text-danger">
          ⚠ No se pudo guardar el borrador en este equipo. No cierres la app hasta enviarlo.
        </p>
      )}
      {!online && <p className="rounded-md border border-warning p-3">⚠ Sin conexión. El borrador queda guardado en este equipo; enviá cuando vuelva la señal.</p>}
      {online && enviando && <p role="status">↻ Enviando…</p>}
      {online && !enviando && !incierto && borradorOk && <p className="text-sm text-soft">○ Borrador guardado en este equipo, todavía sin enviar.</p>}
    </div>
  )
}
