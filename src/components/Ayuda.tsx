import type { ReactNode } from "react";

interface AyudaProps {
  children: ReactNode;
  // nombre accesible del boton; por defecto describe el gesto, no el contenido
  etiqueta?: string;
}

// disclosure nativo de html (<details>/<summary>): no necesita "use client"
// ni estado de react, y funciona igual con click/tap en desktop y mobile
// (a diferencia de un tooltip por hover, que no sirve en touch). el summary
// lleva aria-label porque su texto visible es solo "?".
export function Ayuda({ children, etiqueta = "Qué significa esto" }: AyudaProps) {
  return (
    <details className="mt-1 group">
      <summary
        aria-label={etiqueta}
        className="list-none [&::-webkit-details-marker]:hidden inline-flex items-center justify-center w-5 h-5 rounded-full border border-white/[0.18] text-micro font-medium text-fg-muted cursor-pointer select-none group-hover:border-white/[0.32] group-hover:text-fg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        ?
      </summary>
      <p className="mt-1.5 text-micro leading-relaxed text-fg-muted">{children}</p>
    </details>
  );
}
