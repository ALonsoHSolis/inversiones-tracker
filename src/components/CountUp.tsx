"use client";

import { useLayoutEffect, useRef } from "react";
import { formatoPesos, formatoPesosSigned } from "@/lib/formato";

// el formateo se elige por nombre, no por funcion: un server component no puede
// pasarle una funcion a un client component (next lo rechaza al serializar).
const FORMATOS = { pesos: formatoPesos, pesosSigned: formatoPesosSigned } as const;
export type FormatoCountUp = keyof typeof FORMATOS;

// cifra que "cobra vida" una vez por sesion: sube de 0 al valor real en ~0,9 s
// con ease-out. decisiones deliberadas:
// - el html del servidor ya trae el valor final (sin js, o con
//   prefers-reduced-motion, se ve el numero correcto y nada se anima);
// - solo anima la primera carga de la sesion, no en cada recarga ni
//   navegacion -- una cifra que cuenta cada vez se vuelve molestia;
// - useLayoutEffect para arrancar en 0 antes del primer pintado y evitar el
//   parpadeo "valor final -> 0 -> valor final".
// se escribe directo en el nodo de texto (sin setState por frame): evita 50
// re-renders por animacion y la regla react-hooks/set-state-in-effect.
export function CountUp({
  valor,
  formato,
  claveSesion,
  duracionMs = 900,
}: {
  valor: number;
  formato: FormatoCountUp;
  claveSesion: string;
  duracionMs?: number;
}) {
  const el = useRef<HTMLSpanElement>(null);
  const formatear = FORMATOS[formato];

  useLayoutEffect(() => {
    let yaAnimado = false;
    try {
      yaAnimado = sessionStorage.getItem(`countup:${claveSesion}`) === "1";
    } catch {
      yaAnimado = true; // sin storage: mejor no animar que animar siempre
    }
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (yaAnimado || sinMovimiento || !Number.isFinite(valor) || valor === 0) return;
    try {
      sessionStorage.setItem(`countup:${claveSesion}`, "1");
    } catch {
      /* ignorar */
    }

    const nodo = el.current?.firstChild;
    if (!nodo) return;
    nodo.nodeValue = formatear(0);
    let raf = 0;
    const inicio = performance.now();
    const paso = (ahora: number) => {
      const t = Math.min((ahora - inicio) / duracionMs, 1);
      const suave = 1 - Math.pow(1 - t, 3); // ease-out cubico
      nodo.nodeValue = formatear(Math.round(valor * suave));
      if (t < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => {
      cancelAnimationFrame(raf);
      nodo.nodeValue = formatear(valor); // nunca dejar una cifra a medio camino
    };
  }, [valor, formatear, claveSesion, duracionMs]);

  return <span ref={el}>{formatear(valor)}</span>;
}
