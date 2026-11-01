"use client";

import { useState } from "react";
import Link from "next/link";
import { Target } from "lucide-react";
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
      <div className="rounded-xl border border-dashed border-white/[0.16] px-5 py-8 text-center">
        <span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-accent/30 bg-accent/15 text-accent">
          <Target size={22} strokeWidth={1.8} />
        </span>
        <p className="mt-4 text-base font-semibold text-fg">Todavía no tienes metas</p>
        <p className="mx-auto mt-1.5 max-w-[340px] text-small leading-relaxed text-fg-muted">
          Una meta te muestra cuánto te falta para llegar a un monto, sumando el valor de las cuentas que le asocies.
        </p>
        <Link
          href="/metas/nueva"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-5 text-small font-semibold text-ink no-underline transition-[transform,background-color] duration-150 hover:bg-accent-hi active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Crear primera meta
        </Link>
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
          <div key={meta.id} className="border border-[var(--line)] rounded-xl px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-small font-semibold text-fg">{meta.nombre}</p>
                {meta.fechaObjetivo && (
                  <p className="mt-0.5 text-micro text-fg-muted font-mono-tabular">
                    meta: {formatoFecha(meta.fechaObjetivo)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => eliminarMeta(meta)}
                disabled={eliminandoId === meta.id}
                aria-label={`Eliminar la meta ${meta.nombre}`}
                className="min-h-10 rounded-lg px-2 text-small font-medium text-fg-muted hover:bg-white/[0.06] hover:text-fg shrink-0 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent"
              >
                {eliminandoId === meta.id ? "Eliminando…" : "Eliminar"}
              </button>
            </div>

            <div
              role="progressbar"
              aria-label={`Progreso de ${meta.nombre}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pctVisual)}
              className="h-2 rounded bg-white/[0.08] my-2.5 overflow-hidden"
            >
              <div
                className="h-full rounded"
                style={{ width: `${pctVisual}%`, background: cumplida ? "var(--pos)" : "var(--accent)" }}
              />
            </div>

            <div className="flex items-baseline justify-between">
              <span className="money-value font-mono-tabular text-micro font-semibold text-fg">
                {formatoPesos(meta.montoActualClp)}{" "}
                <span className="text-fg-muted font-normal">de {formatoPesos(meta.montoObjetivo)}</span>
              </span>
              <span className="font-mono-tabular text-micro font-semibold" style={{ color: cumplida ? "var(--pos)" : "var(--color-fg-muted)" }}>
                {cumplida ? "cumplida" : `${formatoPesos(faltante)} restante`}
              </span>
            </div>

            {meta.cuentasAsociadas.length > 0 && (
              <p className="mt-1.5 text-micro text-fg-muted">aporta: {meta.cuentasAsociadas.join(", ")}</p>
            )}

            {errores[meta.id] && <p className="mt-2 text-micro text-[var(--neg)]">{errores[meta.id]}</p>}
          </div>
        );
      })}
    </div>
  );
}
