"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatoPesos, formatoFecha } from "@/lib/formato";

export interface MetaConProgreso {
  id: string;
  nombre: string;
  montoObjetivo: number;
  montoActualClp: number;
  fechaObjetivo: string | null;
  cuentasAsociadas: string[];
}

interface MetasListProps {
  metas: MetaConProgreso[];
}

function mensajeErrorAmigable(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("fetch") || m.includes("network") || m.includes("failed to fetch")) {
    return "no se pudo conectar — revisa tu conexión e intenta de nuevo";
  }
  return "no se pudo eliminar la meta. Intenta de nuevo o escríbenos si el problema persiste";
}

// progreso siempre calculado aca (cliente), reusando capital_por_cuenta que
// el llamador ya trae -- misma convencion ya establecida en el proyecto ("la
// resta/suma simple de columnas ya correctas no necesita vivir en sql").
export function MetasList({ metas }: MetasListProps) {
  const router = useRouter();
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function eliminarMeta(meta: MetaConProgreso) {
    const confirmado = window.confirm(`¿Eliminar la meta "${meta.nombre}"? Esto no afecta tus cuentas ni su historial.`);
    if (!confirmado) return;

    setErrores((prev) => ({ ...prev, [meta.id]: "" }));
    setEliminandoId(meta.id);
    const supabase = createClient();

    const { error } = await supabase.from("metas").delete().eq("id", meta.id);

    if (error) {
      console.error("eliminar meta:", error.message);
      setEliminandoId(null);
      setErrores((prev) => ({ ...prev, [meta.id]: mensajeErrorAmigable(error.message) }));
      return;
    }

    router.refresh();
  }

  if (metas.length === 0) {
    return (
      <div className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-6">
        <p className="text-[13.5px] text-[#8892A0]">todavía no tienes metas de ahorro.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {metas.map((meta) => {
        const pct = meta.montoObjetivo > 0 ? (meta.montoActualClp / meta.montoObjetivo) * 100 : 0;
        const pctVisual = Math.min(100, Math.max(0, pct));
        const faltante = meta.montoObjetivo - meta.montoActualClp;
        const cumplida = faltante <= 0;

        return (
          <div key={meta.id} className="border border-white/[0.07] rounded-xl px-[15px] py-[13px]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-[#F2F5F9]">{meta.nombre}</p>
                {meta.fechaObjetivo && (
                  <p className="mt-0.5 text-[11px] text-[#8892A0] font-mono-tabular">
                    meta: {formatoFecha(meta.fechaObjetivo)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => eliminarMeta(meta)}
                disabled={eliminandoId === meta.id}
                className="text-[11px] text-[#6B7684] border-b border-white/[0.12] shrink-0 disabled:opacity-50"
              >
                {eliminandoId === meta.id ? "eliminando..." : "eliminar"}
              </button>
            </div>

            <div className="h-2 rounded bg-white/[0.08] my-2.5 overflow-hidden">
              <div
                className="h-full rounded"
                style={{ width: `${pctVisual}%`, background: cumplida ? "var(--pos)" : "var(--accent)" }}
              />
            </div>

            <div className="flex items-baseline justify-between">
              <span className="font-mono-tabular text-[12.5px] font-semibold text-[#F2F5F9]">
                {formatoPesos(meta.montoActualClp)}{" "}
                <span className="text-[#8892A0] font-normal">de {formatoPesos(meta.montoObjetivo)}</span>
              </span>
              <span className="font-mono-tabular text-[11.5px] font-semibold" style={{ color: cumplida ? "var(--pos)" : "#8892A0" }}>
                {cumplida ? "cumplida" : `${formatoPesos(faltante)} restante`}
              </span>
            </div>

            {meta.cuentasAsociadas.length > 0 && (
              <p className="mt-1.5 text-[11px] text-[#8892A0]">aporta: {meta.cuentasAsociadas.join(", ")}</p>
            )}

            {errores[meta.id] && <p className="mt-2 text-[12px] text-[var(--neg)]">{errores[meta.id]}</p>}
          </div>
        );
      })}
    </div>
  );
}
