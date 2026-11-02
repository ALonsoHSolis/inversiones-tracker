"use client";

import { useState } from "react";
import { formatoMiles, normalizarMontoIngresado } from "@/lib/formato";

interface InputMontoProps {
  // valor crudo tal como lo espera Number(...) (punto decimal, sin
  // separadores de miles) -- nunca cambia de formato, solo su representacion.
  value: string;
  onChange: (valorCrudo: string) => void;
  placeholder?: string;
  className?: string;
  // accesibilidad: permite asociar etiqueta y mensaje de error al campo
  id?: string;
  invalido?: boolean;
  describedBy?: string;
  // nombre accesible cuando no hay un <label for> visible (ej. filas de SnapshotForm)
  ariaLabel?: string;
}

// mientras el campo esta enfocado se ve y edita el numero crudo (igual que
// un <input type="number">, decimales incluidos); al perder el foco se
// reformatea con separador de miles. evita mostrar un monto grande como
// "25978403" sin separadores, que se lee como un numero roto -- pero sin
// arriesgar romper el punto decimal de una cuenta en uf mientras se escribe,
// que es lo que pasaba al intentar formatear en cada tecla.
export function InputMonto({ value, onChange, placeholder, className, id, invalido, describedBy, ariaLabel }: InputMontoProps) {
  const [enfocado, setEnfocado] = useState(false);

  return (
    <input
      id={id}
      aria-invalid={invalido || undefined}
      aria-describedby={describedBy}
      aria-label={ariaLabel}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      className={className}
      value={enfocado ? value : formatoMiles(value)}
      onFocus={() => setEnfocado(true)}
      onBlur={() => setEnfocado(false)}
      onChange={(e) => onChange(normalizarMontoIngresado(e.target.value))}
    />
  );
}
