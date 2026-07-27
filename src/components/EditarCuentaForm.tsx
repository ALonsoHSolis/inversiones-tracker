"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TIPOS } from "@/lib/tipos-cuenta";
import type { Cuenta, TipoCuenta } from "@/types/database";

interface EditarCuentaFormProps {
  cuenta: Cuenta;
}

const inputClass =
  "h-11 px-3 rounded-[10px] border border-white/[0.14] text-[14px] text-[#F2F5F9] bg-white/[0.04] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";
const labelClass = "text-[11px] font-semibold text-[#8892A0]";

// mismo criterio que CuentaForm: nunca mostrar error.message crudo de
// postgres/supabase al usuario.
function mensajeErrorAmigable(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("fetch") || m.includes("network") || m.includes("failed to fetch")) {
    return "no se pudo conectar — revisa tu conexión e intenta de nuevo";
  }
  return "no se pudo guardar el cambio. Intenta de nuevo o escríbenos si el problema persiste";
}

export function EditarCuentaForm({ cuenta }: EditarCuentaFormProps) {
  const router = useRouter();

  const [nombre, setNombre] = useState(cuenta.nombre);
  const [plataforma, setPlataforma] = useState(cuenta.plataforma);
  const [tipo, setTipo] = useState<TipoCuenta>(cuenta.tipo as TipoCuenta);
  const [categoria, setCategoria] = useState(cuenta.categoria ?? "");

  // accion separada por boton (en vez de un solo "guardando" compartido): con
  // un solo booleano, dar de baja hacia que el boton de "guardar cambios"
  // mostrara "guardando..." aunque esa no fuera la accion en curso.
  const [accion, setAccion] = useState<"guardar" | "baja" | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [bajaConfirm, setBajaConfirm] = useState(false);

  async function guardarCambios() {
    setErrorGuardado(null);
    setAccion("guardar");
    const supabase = createClient();

    const { error } = await supabase
      .from("cuentas")
      .update({ nombre, plataforma, tipo, categoria: categoria.trim() || null })
      .eq("id", cuenta.id);

    if (error) {
      console.error("actualizar cuenta:", error.message);
      setAccion(null);
      setErrorGuardado(mensajeErrorAmigable(error.message));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function darDeBaja() {
    setErrorGuardado(null);
    setAccion("baja");
    const supabase = createClient();

    const { error } = await supabase.from("cuentas").update({ activa: false }).eq("id", cuenta.id);

    if (error) {
      console.error("dar de baja cuenta:", error.message);
      setAccion(null);
      setBajaConfirm(false);
      setErrorGuardado(mensajeErrorAmigable(error.message));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-6 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col gap-[15px]">
        <label className="flex flex-col gap-[7px]">
          <span className={labelClass}>nombre</span>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-[7px]">
          <span className={labelClass}>plataforma</span>
          <input
            type="text"
            required
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-[7px]">
          <span className={labelClass}>tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCuenta)}
            className={inputClass}
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-[7px]">
          <span className={labelClass}>categoría (opcional)</span>
          <input
            type="text"
            placeholder="ej. jubilación, fondo de emergencia"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="flex flex-col gap-[7px]">
          <span className={labelClass}>moneda</span>
          <p className="h-11 px-3 rounded-[10px] border border-white/[0.08] bg-white/[0.02] flex items-center text-[14px] text-[#8892A0]">
            {cuenta.moneda}
          </p>
          <span className="text-[11.5px] text-[#5B6472]">
            no se puede cambiar: los valores ya guardados quedarían mal interpretados
          </span>
        </div>

        {errorGuardado && <p className="text-[12.5px] text-[var(--neg)]">{errorGuardado}</p>}

        <button
          type="button"
          onClick={guardarCambios}
          disabled={accion !== null}
          className="mt-2 h-11 w-full rounded-[10px] bg-[var(--accent)] text-[#0A0D13] text-[14px] font-semibold disabled:opacity-50"
        >
          {accion === "guardar" ? "guardando..." : "guardar cambios"}
        </button>

        {!bajaConfirm ? (
          <button
            type="button"
            onClick={() => setBajaConfirm(true)}
            disabled={accion !== null}
            className="text-[12.5px] text-[var(--neg)] underline text-left disabled:opacity-50"
          >
            dar de baja esta cuenta
          </button>
        ) : (
          <div className="bg-[rgba(255,107,107,0.08)] border border-[rgba(255,107,107,0.25)] rounded-[10px] px-3.5 py-3">
            <p className="text-[12.5px] text-[#F2A6A6] leading-relaxed mb-2.5">
              ¿Dar de baja esta cuenta? No se borra el historial, pero dejará de aparecer en el portafolio.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={darDeBaja}
                disabled={accion !== null}
                className="h-[34px] px-3.5 rounded-lg bg-[var(--neg)] text-[#1A0A0A] text-[12.5px] font-bold disabled:opacity-50"
              >
                {accion === "baja" ? "dando de baja..." : "confirmar"}
              </button>
              <button
                type="button"
                onClick={() => setBajaConfirm(false)}
                disabled={accion !== null}
                className="h-[34px] px-3.5 rounded-lg border border-white/[0.14] text-[#C7CDD6] text-[12.5px] font-semibold disabled:opacity-50"
              >
                cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
