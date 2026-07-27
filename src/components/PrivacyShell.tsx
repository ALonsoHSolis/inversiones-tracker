"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PrivacyContextValue {
  oculto: boolean;
  toggle: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

// el toggle de privacidad vive en un client component que envuelve todo el
// dashboard (server component), pero el difuminado en si es puro css: basta
// con agregar/quitar .privacy-on aca arriba y marcar cada monto con
// .money-value (ver globals.css) -- asi ningun componente de servidor
// necesita saber si la privacidad esta activa.
export function PrivacyShell({ children }: { children: ReactNode }) {
  const [oculto, setOculto] = useState(false);
  return (
    <PrivacyContext.Provider value={{ oculto, toggle: () => setOculto((v) => !v) }}>
      <div className={oculto ? "privacy-on" : undefined}>{children}</div>
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy debe usarse dentro de <PrivacyShell>");
  return ctx;
}

export function PrivacyToggleButton() {
  const { oculto, toggle } = usePrivacy();
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-[9px] border border-white/[0.1] bg-white/[0.03] text-[13px] font-medium text-[#C7CDD6] hover:border-white/[0.2]"
    >
      <span className="w-[7px] h-[7px] rounded-full bg-[var(--accent)]" />
      {oculto ? "Mostrar" : "Ocultar"}
    </button>
  );
}
