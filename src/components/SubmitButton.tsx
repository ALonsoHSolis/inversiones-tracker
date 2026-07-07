"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  labelInactivo: string;
  labelActivo: string;
  variant?: "primary" | "secondary";
}

const ESTILOS = {
  primary:
    "mt-1 h-[46px] w-full rounded-[11px] bg-[var(--accent)] text-white text-[14.5px] font-semibold",
  secondary:
    "h-[42px] px-4 rounded-[10px] border border-[#DFE2E8] bg-white text-[13px] font-semibold text-[#40474F] whitespace-nowrap",
};

// useFormStatus solo funciona en un componente hijo del <form>, no en el
// mismo componente que renderiza el <form> -- por eso es un componente
// aparte en vez de leer el estado directo en login/page.tsx o signup/page.tsx.
export function SubmitButton({ labelInactivo, labelActivo, variant = "primary" }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${ESTILOS[variant]} transition-transform duration-150 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100`}
    >
      {pending ? labelActivo : labelInactivo}
    </button>
  );
}
