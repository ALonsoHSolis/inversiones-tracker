"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Ayuda } from "@/components/Ayuda";

export interface PanelDistribucion {
  id: string;
  etiqueta: string;
  ayuda: ReactNode;
  contenido: ReactNode;
}

// una sola tarjeta con pestañas en vez de tres tarjetas apiladas (plataforma,
// tipo, categoria): el inicio se acorta y el usuario compara cortes del mismo
// patrimonio sin recorrer la pagina. patron ARIA de pestañas: flechas,
// Inicio/Fin, y solo la pestaña activa en el orden de tabulacion. los paneles
// inactivos quedan en el html con `hidden` (impresion y sin js siguen
// teniendo el contenido del primero).
export function PestanasDistribucion({ paneles }: { paneles: PanelDistribucion[] }) {
  const base = useId();
  const [activo, setActivo] = useState(paneles[0]?.id);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  if (paneles.length === 0) return null;
  const actual = paneles.find((p) => p.id === activo) ?? paneles[0];

  function teclado(e: KeyboardEvent, i: number) {
    let siguiente: number | null = null;
    if (e.key === "ArrowRight") siguiente = (i + 1) % paneles.length;
    if (e.key === "ArrowLeft") siguiente = (i - 1 + paneles.length) % paneles.length;
    if (e.key === "Home") siguiente = 0;
    if (e.key === "End") siguiente = paneles.length - 1;
    if (siguiente == null) return;
    e.preventDefault();
    setActivo(paneles[siguiente].id);
    refs.current[siguiente]?.focus();
  }

  return (
    <section className="card p-5" aria-labelledby={`${base}-titulo`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex items-center gap-1">
          <h2 id={`${base}-titulo`} className="titulo-bloque">
            Distribución del patrimonio
          </h2>
          <Ayuda etiqueta={`Qué muestra la distribución por ${actual.etiqueta.toLowerCase()}`}>{actual.ayuda}</Ayuda>
        </div>
        {paneles.length > 1 && (
          <div role="tablist" aria-label="Agrupar por" className="segmentado no-print">
            {paneles.map((p, i) => (
              <button
                key={p.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                id={`${base}-tab-${p.id}`}
                type="button"
                role="tab"
                aria-selected={p.id === actual.id}
                aria-controls={`${base}-panel-${p.id}`}
                tabIndex={p.id === actual.id ? 0 : -1}
                onClick={() => setActivo(p.id)}
                onKeyDown={(e) => teclado(e, i)}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>
        )}
      </div>
      {paneles.map((p) => (
        <div
          key={p.id}
          id={`${base}-panel-${p.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${p.id}`}
          hidden={p.id !== actual.id}
          className="mt-4"
        >
          {p.contenido}
        </div>
      ))}
    </section>
  );
}
