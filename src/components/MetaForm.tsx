"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { InputMonto } from "@/components/InputMonto";

interface CuentaOpcion {
  id: string;
  nombre: string;
  plataforma: string;
}

interface MetaFormProps {
  cuentas: CuentaOpcion[];
}

const inputClass =
  "h-11 px-3 rounded-[10px] border border-white/[0.14] text-[14px] text-[#F2F5F9] bg-white/[0.04] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";
const labelClass = "text-[11px] font-semibold text-[#8892A0]";

// mismo criterio que CuentaForm/EditarCuentaForm: nunca error.message crudo.
function mensajeErrorAmigable(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("monto_objetivo") || (m.includes("monto") && m.includes("check"))) {
    return "el monto objetivo debe ser mayor a cero";
  }
  if (m.includes("fetch") || m.includes("network") || m.includes("failed to fetch")) {
    return "no se pudo conectar — revisa tu conexión e intenta de nuevo";
  }
  return "no se pudo crear la meta. Intenta de nuevo o escríbenos si el problema persiste";
}

// crear una meta es un insert directo (no una rpc, a diferencia de
// crear_cuenta_con_aporte_inicial): no hay ninguna regla de capital que
// proteger aca. son 2 inserts secuenciales (metas, despues meta_cuentas) --
// si el segundo fallara, la meta queda creada sin cuentas asociadas, un
// estado benigno (no hay flujo de "editar meta" todavia en esta version, asi
// que se le pide al usuario borrarla y reintentar en vez de corregirla).
export function MetaForm({ cuentas }: MetaFormProps) {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [montoObjetivo, setMontoObjetivo] = useState("");
  const [fechaObjetivo, setFechaObjetivo] = useState("");
  const [cuentaIds, setCuentaIds] = useState<string[]>([]);

  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  function alternarCuenta(id: string) {
    setCuentaIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function guardarMeta() {
    setErrorGuardado(null);

    if (!nombre.trim()) {
      setErrorGuardado("ponle un nombre a la meta");
      return;
    }
    if (!(Number(montoObjetivo) > 0)) {
      setErrorGuardado("el monto objetivo debe ser mayor a cero");
      return;
    }

    setGuardando(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("metas")
      .insert({
        nombre,
        monto_objetivo: Number(montoObjetivo),
        fecha_objetivo: fechaObjetivo || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("crear meta:", error?.message);
      setGuardando(false);
      setErrorGuardado(mensajeErrorAmigable(error?.message ?? ""));
      return;
    }

    if (cuentaIds.length > 0) {
      const { error: errorAsociar } = await supabase
        .from("meta_cuentas")
        .insert(cuentaIds.map((cuenta_id) => ({ meta_id: data.id, cuenta_id })));

      if (errorAsociar) {
        console.error("asociar cuentas a meta:", errorAsociar.message);
        setGuardando(false);
        setErrorGuardado(
          "la meta se creó, pero no se pudieron asociar las cuentas. Puedes borrarla e intentar de nuevo."
        );
        return;
      }
    }

    setGuardando(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-6 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col gap-[15px]">
        <label className="flex flex-col gap-[7px]">
          <span className={labelClass}>nombre de la meta</span>
          <input
            type="text"
            required
            placeholder="ej. fondo de emergencia"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-[7px]">
          <span className={labelClass}>monto objetivo</span>
          <InputMonto
            value={montoObjetivo}
            onChange={setMontoObjetivo}
            placeholder="0"
            className={`${inputClass} text-right font-mono-tabular`}
          />
        </label>

        <label className="flex flex-col gap-[7px]">
          <span className={labelClass}>fecha objetivo (opcional)</span>
          <input
            type="date"
            value={fechaObjetivo}
            onChange={(e) => setFechaObjetivo(e.target.value)}
            className={inputClass}
          />
        </label>

        {cuentas.length > 0 && (
          <div className="flex flex-col gap-[7px]">
            <span className={labelClass}>cuentas que aportan a esta meta (opcional)</span>
            <div className="flex flex-col gap-1.5 rounded-[10px] border border-white/[0.14] bg-white/[0.02] p-2.5">
              {cuentas.map((c) => (
                <label key={c.id} className="flex items-center gap-2.5 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cuentaIds.includes(c.id)}
                    onChange={() => alternarCuenta(c.id)}
                    className="w-[15px] h-[15px] accent-[var(--accent)]"
                  />
                  <span className="text-[13px] text-[#F2F5F9]">{c.nombre}</span>
                  <span className="text-[11px] text-[#8892A0]">{c.plataforma}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {errorGuardado && <p className="text-[12.5px] text-[var(--neg)]">{errorGuardado}</p>}

        <button
          type="button"
          onClick={guardarMeta}
          disabled={guardando}
          className="mt-2 h-11 w-full rounded-[10px] bg-[var(--accent)] text-[#0A0D13] text-[14px] font-semibold disabled:opacity-50"
        >
          {guardando ? "creando..." : "crear meta"}
        </button>
      </div>
    </div>
  );
}
