"use client";

import { useState } from "react";

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

  if (puntos <= 1) return { ancho: "33%", color: "#D64545", etiqueta: "débil" };
  if (puntos <= 3) return { ancho: "66%", color: "#C98A1B", etiqueta: "media" };
  return { ancho: "100%", color: "#0B7A54", etiqueta: "fuerte" };
}

export function PasswordInput({ name, placeholder, minLength, mostrarFortaleza }: PasswordInputProps) {
  const [mostrar, setMostrar] = useState(false);
  const [valor, setValor] = useState("");
  const fortaleza = mostrarFortaleza ? calcularFortaleza(valor) : null;

  return (
    <label className="flex flex-col gap-[7px]">
      <span className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-[#6B7280]">Contraseña</span>
        <button
          type="button"
          onClick={() => setMostrar((v) => !v)}
          className="text-xs font-medium text-[var(--accent)]"
        >
          {mostrar ? "Ocultar" : "Mostrar"}
        </button>
      </span>
      <input
        type={mostrar ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        required
        minLength={minLength}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="h-11 px-[13px] border border-[#DFE2E8] rounded-[10px] text-sm text-[#171A20] bg-white focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(20,80,140,0.1)]"
      />
      {fortaleza && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-[#E7E9EE] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: fortaleza.ancho, background: fortaleza.color }} />
          </div>
          <span className="text-[11px] font-medium" style={{ color: fortaleza.color }}>
            {fortaleza.etiqueta}
          </span>
        </div>
      )}
    </label>
  );
}
