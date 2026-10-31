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
      aria-pressed={oculto}
      title={oculto ? "Mostrar los montos" : "Ocultar los montos (modo privado)"}
      className={`inline-flex items-center gap-2 h-[34px] px-3.5 rounded-full border text-small font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        oculto
          ? "border-accent/60 bg-accent/15 text-accent-hi"
          : "border-white/[0.1] bg-white/[0.03] text-fg-soft hover:border-white/[0.2]"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {oculto && <path d="M3 3l18 18" />}
      </svg>
      {oculto ? "Montos ocultos" : "Ocultar montos"}
    </button>
  );
}
