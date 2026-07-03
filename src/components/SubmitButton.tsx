"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  labelInactivo: string;
  labelActivo: string;
}

// useFormStatus solo funciona en un componente hijo del <form>, no en el
// mismo componente que renderiza el <form> -- por eso es un componente
// aparte en vez de leer el estado directo en login/page.tsx o signup/page.tsx.
export function SubmitButton({ labelInactivo, labelActivo }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded bg-gray-900 text-white text-sm py-2 disabled:opacity-50"
    >
      {pending ? labelActivo : labelInactivo}
    </button>
  );
}
