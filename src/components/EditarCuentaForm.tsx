"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TIPOS } from "@/lib/tipos-cuenta";
import type { Cuenta, TipoCuenta } from "@/types/database";

interface EditarCuentaFormProps {
  cuenta: Cuenta;
}

export function EditarCuentaForm({ cuenta }: EditarCuentaFormProps) {
  const router = useRouter();

  const [nombre, setNombre] = useState(cuenta.nombre);
  const [plataforma, setPlataforma] = useState(cuenta.plataforma);
  const [tipo, setTipo] = useState<TipoCuenta>(cuenta.tipo as TipoCuenta);

  // accion separada por boton (en vez de un solo "guardando" compartido): con
  // un solo booleano, dar de baja hacia que el boton de "guardar cambios"
  // mostrara "guardando..." aunque esa no fuera la accion en curso.
  const [accion, setAccion] = useState<"guardar" | "baja" | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  async function guardarCambios() {
    setErrorGuardado(null);
    setAccion("guardar");
    const supabase = createClient();

    const { error } = await supabase
      .from("cuentas")
      .update({ nombre, plataforma, tipo })
      .eq("id", cuenta.id);

    if (error) {
      setAccion(null);
      setErrorGuardado(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function darDeBaja() {
    const confirmado = window.confirm(
      "¿Dar de baja esta cuenta? No se borra el historial, pero dejará de aparecer en el portafolio."
    );
    if (!confirmado) return;

    setErrorGuardado(null);
    setAccion("baja");
    const supabase = createClient();

    const { error } = await supabase.from("cuentas").update({ activa: false }).eq("id", cuenta.id);

    if (error) {
      setAccion(null);
      setErrorGuardado(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">nombre</span>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">plataforma</span>
          <input
            type="text"
            required
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCuenta)}
            className="rounded border border-gray-300 px-3 py-2 bg-white"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">moneda</span>
          <p className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500">{cuenta.moneda}</p>
          <span className="text-xs text-gray-500">
            no se puede cambiar: los valores ya guardados quedarian mal interpretados
          </span>
        </div>

        {errorGuardado && <p className="text-xs text-red-700">{errorGuardado}</p>}

        <button
          type="button"
          onClick={guardarCambios}
          disabled={accion !== null}
          className="mt-2 w-full rounded bg-gray-900 text-white text-sm py-2 disabled:opacity-50"
        >
          {accion === "guardar" ? "guardando..." : "guardar cambios"}
        </button>

        <button
          type="button"
          onClick={darDeBaja}
          disabled={accion !== null}
          className="text-xs text-red-700 underline disabled:opacity-50"
        >
          {accion === "baja" ? "dando de baja..." : "dar de baja esta cuenta"}
        </button>
      </div>
    </div>
  );
}
