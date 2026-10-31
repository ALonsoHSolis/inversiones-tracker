"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Cuenta } from "@/types/database";

interface CuentasInactivasProps {
  cuentas: Cuenta[];
}

function mensajeErrorAmigable(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("fetch") || m.includes("network") || m.includes("failed to fetch")) {
    return "no se pudo conectar — revisa tu conexión e intenta de nuevo";
  }
  return "no se pudo reactivar la cuenta. Intenta de nuevo o escríbenos si el problema persiste";
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
      console.error("reactivar cuenta:", error.message);
      setReactivandoId(null);
      setErrores((prev) => ({ ...prev, [cuenta.id]: mensajeErrorAmigable(error.message) }));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (cuentas.length === 0) {
    return (
      <div className="card p-6">
        <p className="text-small text-fg-muted">no tienes cuentas dadas de baja.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {cuentas.map((cuenta) => (
        <div
          key={cuenta.id}
          className="card px-5 py-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-small font-semibold text-fg">{cuenta.nombre}</p>
              <p className="text-micro text-fg-muted">{cuenta.plataforma}</p>
            </div>
            <button
              type="button"
              onClick={() => reactivar(cuenta)}
              disabled={reactivandoId === cuenta.id}
              className="text-micro font-semibold text-[var(--accent)] underline disabled:opacity-50 shrink-0"
            >
              {reactivandoId === cuenta.id ? "reactivando..." : "reactivar"}
            </button>
          </div>
          {errores[cuenta.id] && <p className="mt-2 text-micro text-[var(--neg)]">{errores[cuenta.id]}</p>}
        </div>
      ))}
    </div>
  );
}
