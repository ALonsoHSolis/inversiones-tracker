"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Cuenta } from "@/types/database";

interface CuentasInactivasProps {
  cuentas: Cuenta[];
}

export function CuentasInactivas({ cuentas }: CuentasInactivasProps) {
  const router = useRouter();
  const [reactivandoId, setReactivandoId] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function reactivar(cuenta: Cuenta) {
    setErrores((prev) => ({ ...prev, [cuenta.id]: "" }));
    setReactivandoId(cuenta.id);
    const supabase = createClient();

    const { error } = await supabase.from("cuentas").update({ activa: true }).eq("id", cuenta.id);

    if (error) {
      setReactivandoId(null);
      setErrores((prev) => ({ ...prev, [cuenta.id]: error.message }));
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (cuentas.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">no tienes cuentas dadas de baja.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {cuentas.map((cuenta) => (
        <div key={cuenta.id} className="rounded-lg border border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{cuenta.nombre}</p>
              <p className="text-xs text-gray-500">{cuenta.plataforma}</p>
            </div>
            <button
              type="button"
              onClick={() => reactivar(cuenta)}
              disabled={reactivandoId === cuenta.id}
              className="text-xs text-gray-900 underline disabled:opacity-50 shrink-0"
            >
              {reactivandoId === cuenta.id ? "reactivando..." : "reactivar"}
            </button>
          </div>
          {errores[cuenta.id] && <p className="mt-2 text-xs text-red-700">{errores[cuenta.id]}</p>}
        </div>
      ))}
    </div>
  );
}
