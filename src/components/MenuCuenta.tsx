"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

// menu desplegable de la barra superior (patron "disclosure": un boton que
// muestra/oculta una lista de enlaces y acciones, sin role="menu"). reemplaza la fila de 6 enlaces y
// botones sueltos: lo que se usa a diario (ocultar montos) queda afuera y
// visible; lo ocasional (exportar, perfil, soporte, cerrar sesion) vive aca.
// los hijos llegan ya renderizados desde el server component (asi el form de
// cerrar sesion conserva su server action).
export function MenuCuenta({ email, children }: { email: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const idMenu = useId();

  useEffect(() => {
    if (!abierto) return;
    function alClickFuera(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    }
    function alTecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", alClickFuera);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClickFuera);
      document.removeEventListener("keydown", alTecla);
    };
  }, [abierto]);

  const inicial = (email.trim()[0] ?? "?").toUpperCase();

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls={idMenu}
        className="inline-flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-full border border-white/[0.1] bg-white/[0.03] text-small font-medium text-fg-soft hover:border-white/[0.2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span
          aria-hidden="true"
          className="grid place-items-center w-6 h-6 rounded-full bg-accent/20 text-accent text-micro font-semibold"
        >
          {inicial}
        </span>
        Cuenta
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform duration-150 motion-reduce:transition-none ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <div
          id={idMenu}
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[240px] card p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]"
          onClick={(e) => {
            // cierra al elegir un enlace; los botones de accion manejan su propio estado
            if ((e.target as HTMLElement).closest("a")) setAbierto(false);
          }}
        >
          <p className="px-3 pt-2 pb-2.5 text-micro text-fg-muted truncate border-b border-white/[0.07] mb-1.5">
            {email}
          </p>
          <div className="flex flex-col">{children}</div>
        </div>
      )}
    </div>
  );
}

// clase comun de cada fila del menu, para que enlaces, botones y el form de
// cerrar sesion se vean identicos.
export const ITEM_MENU =
  "w-full text-left px-3 py-2 rounded-lg text-small text-fg-soft hover:bg-white/[0.06] hover:text-fg focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50";
