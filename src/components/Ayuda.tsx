import type { ReactNode } from "react";

interface AyudaProps {
  children: ReactNode;
}

// disclosure nativo de html (<details>/<summary>): no necesita "use client"
// ni estado de react, y funciona igual con click/tap en desktop y mobile
// (a diferencia de un tooltip por hover, que no sirve en touch).
export function Ayuda({ children }: AyudaProps) {
  return (
    <details className="mt-1 group">
      <summary className="list-none [&::-webkit-details-marker]:hidden inline-flex items-center justify-center w-4 h-4 rounded-full border border-white/[0.18] text-micro font-medium text-fg-muted cursor-pointer select-none group-hover:border-white/[0.32] group-hover:text-fg-soft">
        ?
      </summary>
      <p className="mt-1.5 text-micro leading-relaxed text-fg-muted">{children}</p>
    </details>
  );
}
