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
      <summary className="list-none [&::-webkit-details-marker]:hidden inline-flex items-center justify-center w-4 h-4 rounded-full border border-white/[0.18] text-[10px] font-medium text-[#8892A0] cursor-pointer select-none group-hover:border-white/[0.32] group-hover:text-[#C7CDD6]">
        ?
      </summary>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#97A2B4]">{children}</p>
    </details>
  );
}
