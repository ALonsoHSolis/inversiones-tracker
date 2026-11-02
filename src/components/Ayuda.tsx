"use client";

import { CircleHelp } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";

interface AyudaProps {
  children: ReactNode;
  // nombre accesible del boton; por defecto describe el gesto, no el contenido
  etiqueta?: string;
}

// ayuda contextual con la Popover API nativa: el navegador maneja Escape,
// cierre al tocar fuera y la capa superior (no la recorta ningun overflow).
// antes era un <details> que desplegaba el texto dentro del flujo y empujaba
// el layout de la tarjeta. funciona igual con tap y teclado (no depende de
// hover, que no existe en celulares).
export function Ayuda({ children, etiqueta = "Qué significa esto" }: AyudaProps) {
  const id = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // posiciona el panel bajo el boton, sin salirse del viewport (16 px de margen)
  function ubicar() {
    const b = boton.current?.getBoundingClientRect();
    const p = panel.current;
    if (!b || !p) return;
    const ancho = Math.min(320, window.innerWidth - 32);
    const izquierda = Math.min(Math.max(16, b.left + b.width / 2 - ancho / 2), window.innerWidth - ancho - 16);
    const abajo = b.bottom + 8;
    const cabeAbajo = abajo + p.offsetHeight + 16 < window.innerHeight;
    p.style.width = `${ancho}px`;
    p.style.left = `${izquierda}px`;
    p.style.top = cabeAbajo ? `${abajo}px` : `${Math.max(16, b.top - 8 - p.offsetHeight)}px`;
  }

  return (
    <>
      <button
        ref={boton}
        type="button"
        popoverTarget={id}
        aria-label={etiqueta}
        className="no-print inline-grid h-6 w-6 shrink-0 place-items-center rounded-full text-fg-subtle transition-colors duration-150 hover:bg-white/[0.06] hover:text-fg-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
      >
        <CircleHelp size={15} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <div
        ref={panel}
        id={id}
        popover="auto"
        role="note"
        onToggle={(e) => {
          if ((e as unknown as ToggleEvent).newState === "open") ubicar();
        }}
        className="ayuda-panel m-0 rounded-xl bg-surface-raised p-3.5 text-small leading-relaxed text-fg-soft shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(148,170,200,0.16)]"
      >
        {children}
      </div>
    </>
  );
}
