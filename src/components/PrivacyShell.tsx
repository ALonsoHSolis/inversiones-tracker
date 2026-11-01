"use client";

import { Eye, EyeOff } from "lucide-react";
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

export function PrivacyToggleButton({ compact = false }: { compact?: boolean }) {
  const { oculto, toggle } = usePrivacy();
  const Icono = oculto ? EyeOff : Eye;
  const titulo = oculto ? "Mostrar los montos" : "Ocultar los montos (modo privado)";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={oculto}
      aria-label={compact ? (oculto ? "Mostrar montos" : "Ocultar montos") : undefined}
      title={titulo}
      className={`inline-flex items-center justify-center gap-2 h-10 rounded-full border text-small font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        compact ? "w-10" : "px-3.5"
      } ${
        oculto
          ? "border-accent/60 bg-accent/15 text-accent-hi"
          : "border-white/[0.1] bg-white/[0.03] text-fg-soft hover:border-white/[0.2]"
      }`}
    >
      <Icono size={16} strokeWidth={1.8} aria-hidden="true" />
      {!compact && (oculto ? "Montos ocultos" : "Ocultar montos")}
    </button>
  );
}
