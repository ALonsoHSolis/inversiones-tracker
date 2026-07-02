"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Cuenta } from "@/types/database";

interface SnapshotFormProps {
  cuentas: Cuenta[];
}

export function SnapshotForm({ cuentas }: SnapshotFormProps) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function guardarSnapshots() {
    setGuardando(true);
    setMensaje(null);
    const supabase = createClient();
    const hoy = new Date().toISOString().slice(0, 10);

    const filas = Object.entries(valores)
      .filter(([, valor]) => valor.trim() !== "")
      .map(([cuenta_id, valor]) => ({
        cuenta_id,
        fecha: hoy,
        valor: Number(valor),
      }));

    if (filas.length === 0) {
      setGuardando(false);
      return;
    }

    const { error } = await supabase
      .from("snapshots")
      .upsert(filas, { onConflict: "cuenta_id,fecha" });

    setGuardando(false);
    setMensaje(error ? "hubo un error al guardar" : "valores guardados");
    if (!error) setValores({});
  }

  if (cuentas.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-medium mb-3">actualizar valores de hoy</p>
      <div className="flex flex-col gap-2">
        {cuentas.map((cuenta) => (
          <label key={cuenta.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-600">{cuenta.nombre}</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              className="w-32 rounded border border-gray-300 px-2 py-1 text-right"
              value={valores[cuenta.id] ?? ""}
              onChange={(e) =>
                setValores((prev) => ({ ...prev, [cuenta.id]: e.target.value }))
              }
            />
          </label>
        ))}
      </div>
      <button
        onClick={guardarSnapshots}
        disabled={guardando}
        className="mt-4 w-full rounded bg-gray-900 text-white text-sm py-2 disabled:opacity-50"
      >
        {guardando ? "guardando..." : "guardar"}
      </button>
      {mensaje && <p className="text-xs text-gray-500 mt-2">{mensaje}</p>}
    </div>
  );
}
