import * as React from "react"

const MOBILE_BREAKPOINT = 768

function suscribir(avisar: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", avisar)
  return () => mql.removeEventListener("change", avisar)
}

export function useIsMobile() {
  return React.useSyncExternalStore(suscribir, () => window.innerWidth < MOBILE_BREAKPOINT)
}
