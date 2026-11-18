/** D28: el usuario no es responsable de ninguna unidad ni está asignado a un frente en la fecha elegida. */
export function SinUnidades() {
  return (
    <p className="rounded-md border border-warning p-3 text-sm">
      ⚠ No tenés unidades a cargo ni estabas asignado a un frente en esa fecha. Revisá la fecha o pedí a Administración que te asigne.
    </p>
  )
}
