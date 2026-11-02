"use client";

import { useEffect, useRef, type ReactNode } from "react";

// entrada de las partes de una seccion cuando aparece en pantalla (una sola
// vez). el contenido es visible por defecto: la clase que lo oculta solo se
// pone con js y se quita al entrar, asi que sin js (o si el observer falla)
// nada queda escondido. los hijos con [data-revelar] suben 24 px con opacidad,
// escalonados 70 ms; con prefers-reduced-motion solo hay un fundido.
export function Revelar({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    el.classList.add("revelar-pendiente");
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          el.classList.remove("revelar-pendiente");
          el.classList.add("revelar-visto");
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
