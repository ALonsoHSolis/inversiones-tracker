import type { ReactNode } from "react";

interface AyudaProps {
  children: ReactNode;
}

// disclosure nativo de html (<details>/<summary>): no necesita "use client"
// ni estado de react, y funciona igual con click/tap en desktop y mobile
// (a diferencia de un tooltip por hover, que no sirve en touch).
export function Ayuda({ children }: AyudaProps) {
  return (
    <details className="mt-1">
      <summary className="list-none [&::-webkit-details-marker]:hidden inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-[10px] text-gray-500 cursor-pointer select-none">
        ?
      </summary>
      <p className="mt-1 text-xs text-gray-500">{children}</p>
    </details>
  );
}
