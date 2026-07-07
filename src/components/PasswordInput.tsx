"use client";

import { useState } from "react";

interface PasswordInputProps {
  name: string;
  placeholder: string;
  minLength?: number;
}

export function PasswordInput({ name, placeholder, minLength }: PasswordInputProps) {
  const [mostrar, setMostrar] = useState(false);

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
        className="h-11 px-[13px] border border-[#DFE2E8] rounded-[10px] text-sm text-[#171A20] bg-white focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(20,80,140,0.1)]"
      />
    </label>
  );
}
