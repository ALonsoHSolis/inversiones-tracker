"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { filtrarCuentas, FILTROS_VACIOS, type FilaCuenta } from "@/lib/cuentas-tabla";

export interface OpcionCuenta {
  id: string;
  nombre: string;
  plataforma: string;
  moneda: string;
}

interface SelectorCuentaProps {
  cuentas: OpcionCuenta[];
  valor: string;
  onChange: (id: string) => void;
  etiqueta?: string;
}

// selector con busqueda (patron "combobox con listbox"): un boton muestra la
// cuenta elegida; al abrirlo aparece un campo de busqueda y la lista filtrada,
// navegable con flechas, Enter y Escape. reemplaza al <select> nativo con
// opciones display:none, que en celulares no filtraba nada.
export function SelectorCuenta({ cuentas, valor, onChange, etiqueta = "Cuenta" }: SelectorCuentaProps) {
  const idBase = useId();
  const idLista = `${idBase}-lista`;
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [activa, setActiva] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  const seleccionada = cuentas.find((c) => c.id === valor) ?? null;

  const visibles = useMemo(() => {
    // se reutiliza la misma busqueda (sin tildes) de la tabla de cuentas
    const filas = cuentas.map(
      (c) =>
        ({ id: c.id, nombre: c.nombre, plataforma: c.plataforma, tipoLabel: "", tipo: "", moneda: c.moneda }) as FilaCuenta
    );
    const ids = new Set(filtrarCuentas(filas, { ...FILTROS_VACIOS, texto }).map((f) => f.id));
    return cuentas.filter((c) => ids.has(c.id));
  }, [cuentas, texto]);

  useEffect(() => {
    if (!abierto) return;
    campo.current?.focus();
    function fuera(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) cerrar(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, [abierto]);

  function abrir() {
    setTexto("");
    setActiva(Math.max(0, cuentas.findIndex((c) => c.id === valor)));
    setAbierto(true);
  }
  function cerrar(devolverFoco: boolean) {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  }
  function elegir(id: string) {
    onChange(id);
    cerrar(true);
  }
  function alTecla(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiva((i) => Math.min(i + 1, visibles.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiva((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = visibles[activa];
      if (c) elegir(c.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cerrar(true);
    } else if (e.key === "Tab") {
      cerrar(false);
    }
  }

  return (
    <div ref={raiz} className="relative">
      <span id={`${idBase}-etiqueta`} className="text-micro font-semibold text-fg-muted">
        {etiqueta}
      </span>
      <button
        ref={boton}
        type="button"
        onClick={() => (abierto ? cerrar(false) : abrir())}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-labelledby={`${idBase}-etiqueta ${idBase}-valor`}
        className="mt-1 flex h-11 w-full items-center justify-between gap-2 rounded-[10px] border border-control bg-surface-raised px-3 text-left text-small text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span id={`${idBase}-valor`} className="min-w-0 truncate">
          {seleccionada ? (
            <>
              {seleccionada.nombre} <span className="text-fg-muted">· {seleccionada.plataforma}</span>
            </>
          ) : (
            "Elige una cuenta"
          )}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-fg-muted transition-transform duration-150 ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-[var(--line)] bg-surface-raised shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]">
          <div className="relative border-b border-[var(--line)]">
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 text-fg-muted" />
            <input
              ref={campo}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={idLista}
              aria-activedescendant={visibles[activa] ? `${idBase}-op-${visibles[activa].id}` : undefined}
              aria-label="Buscar cuenta por nombre o plataforma"
              placeholder="Buscar por nombre o plataforma…"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setActiva(0);
              }}
              onKeyDown={alTecla}
              className="h-11 w-full bg-transparent pl-9 pr-3 text-small text-fg placeholder:text-fg-subtle focus:outline-none"
            />
          </div>
          <ul id={idLista} role="listbox" aria-labelledby={`${idBase}-etiqueta`} className="max-h-[260px] overflow-y-auto py-1">
            {visibles.length === 0 && <li className="px-3 py-3 text-small text-fg-muted">Ninguna cuenta coincide.</li>}
            {visibles.map((c, i) => {
              const esSeleccionada = c.id === valor;
              return (
                <li
                  key={c.id}
                  id={`${idBase}-op-${c.id}`}
                  role="option"
                  aria-selected={esSeleccionada}
                  onMouseEnter={() => setActiva(i)}
                  onClick={() => elegir(c.id)}
                  className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2 text-small ${
                    i === activa ? "bg-white/[0.07]" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-fg">{c.nombre}</span>
                    <span className="block truncate text-micro text-fg-muted">
                      {c.plataforma} · {c.moneda}
                    </span>
                  </span>
                  {esSeleccionada && <Check size={16} aria-hidden="true" className="shrink-0 text-accent" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
