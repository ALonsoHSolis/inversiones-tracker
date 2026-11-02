"use client";

import { useId, useState } from "react";

interface PasswordInputProps {
  name: string;
  placeholder: string;
  minLength?: number;
  mostrarFortaleza?: boolean;
}

function calcularFortaleza(password: string) {
  if (!password) return null;
  let puntos = 0;
  if (password.length >= 8) puntos++;
  if (password.length >= 12) puntos++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) puntos++;
  if (/\d/.test(password)) puntos++;
  if (/[^a-zA-Z0-9]/.test(password)) puntos++;

  if (puntos <= 1) return { ancho: "33%", color: "var(--color-neg)", etiqueta: "débil" };
  if (puntos <= 3) return { ancho: "66%", color: "var(--color-warn)", etiqueta: "media" };
  return { ancho: "100%", color: "var(--color-pos)", etiqueta: "fuerte" };
}

export function PasswordInput({ name, placeholder, minLength, mostrarFortaleza }: PasswordInputProps) {
  const idCampo = useId();
  const [mostrar, setMostrar] = useState(false);
  const [valor, setValor] = useState("");
  const fortaleza = mostrarFortaleza ? calcularFortaleza(valor) : null;

  // la etiqueta apunta al campo con htmlFor: antes el <label> envolvia
  // primero el boton "Mostrar", y por regla de html un label se asocia al
  // PRIMER control que contiene -- "Contraseña" etiquetaba al boton, no al
  // campo (audit: WCAG 1.3.1 / 4.1.2).
  return (
    <div className="flex flex-col gap-[7px]">
      <span className="flex items-center justify-between">
        <label htmlFor={idCampo} className="text-micro font-semibold text-fg-muted">
          Contraseña
        </label>
        <button
          type="button"
          onClick={() => setMostrar((v) => !v)}
          aria-controls={idCampo}
          aria-pressed={mostrar}
          className="min-h-8 rounded px-1 text-micro font-medium text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-accent"
        >
          {mostrar ? "Ocultar" : "Mostrar"}
        </button>
      </span>
      <input
        id={idCampo}
        type={mostrar ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        required
        minLength={minLength}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="h-11 px-[13px] border border-control rounded-[10px] text-base text-fg bg-white/[0.04] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(224,188,120,0.15)]"
      />
      {fortaleza && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-white/[0.1] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: fortaleza.ancho, background: fortaleza.color }} />
          </div>
          <span className="text-micro font-medium" style={{ color: fortaleza.color }}>
            {fortaleza.etiqueta}
          </span>
        </div>
      )}
    </div>
  );
}
