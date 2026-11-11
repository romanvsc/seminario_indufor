import { Alert, AlertDescription } from '@/shared/components/ui/alert'

/**
 * Estados de un formulario de campo (specs/04): borrador conservado o no, sin conexión, envío en curso y resultado
 * incierto. "Guardado" nunca se muestra acá: solo después de la respuesta del backend.
 */
export function EstadoEnvio({ online, enviando, borradorOk, incierto }: { online: boolean; enviando: boolean; borradorOk: boolean; incierto: boolean }) {
  return (
    <div aria-live="polite" className="grid gap-2">
      {incierto && !enviando && (
        <Alert variant="warning"><AlertDescription>? No sabemos si llegó: se cortó la conexión mientras se enviaba. Tocá «Reintentar»: si ya se guardó, no se va a duplicar.</AlertDescription></Alert>
      )}
      {!borradorOk && (
        <Alert variant="destructive"><AlertDescription>⚠ No se pudo guardar el borrador en este equipo. No cierres la app hasta enviarlo.</AlertDescription></Alert>
      )}
      {!online && <Alert variant="warning" role="status"><AlertDescription>⚠ Sin conexión. El borrador queda guardado en este equipo; enviá cuando vuelva la señal.</AlertDescription></Alert>}
      {online && enviando && <p role="status">↻ Enviando…</p>}
      {online && !enviando && !incierto && borradorOk && <p className="text-base text-soft">○ Borrador guardado en este equipo, todavía sin enviar.</p>}
    </div>
  )
}
