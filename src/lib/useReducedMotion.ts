"use client";

import { useSyncExternalStore } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

function suscribir(avisar: () => void) {
  const mql = window.matchMedia(CONSULTA);
  mql.addEventListener("change", avisar);
  return () => mql.removeEventListener("change", avisar);
}

// true si la persona pidio menos movimiento. en el servidor y durante la
// hidratacion vale false (la animacion de los graficos solo corre en el
// cliente), y se corrige de inmediato al montar.
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(CONSULTA).matches,
    () => false
  );
}
