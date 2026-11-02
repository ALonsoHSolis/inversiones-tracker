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
  // "compacta": version del riel del dashboard (sin acciones de borrado)
  compacta?: boolean;
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
export function MetasList({ metas, compacta = false }: MetasListProps) {
  const router = useRouter();
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  // confirmacion en pantalla (antes window.confirm): el primer toque pide
  // confirmar en la misma fila, el segundo elimina.
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  async function eliminarMeta(meta: MetaConProgreso) {
    setConfirmandoId(null);
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
      <div className="rounded-2xl bg-white/[0.025] px-5 py-8 text-center shadow-[inset_0_0_0_1px_var(--color-edge)]">
        <span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent/12 text-accent-hi">
          <Target size={22} strokeWidth={1.8} />
        </span>
        <p className="mt-4 text-base font-semibold text-fg">Todavía no tienes metas</p>
        <p className="mx-auto mt-1.5 max-w-[340px] text-small leading-relaxed text-fg-muted">
          Una meta te muestra cuánto te falta para llegar a un monto (el pie de un departamento, un fondo de
          emergencia), sumando el valor actual de las cuentas que le asocies.
        </p>
        <Link href="/metas/nueva" className="boton-primario mt-5 h-11 rounded-full px-5 no-underline">
          Crear primera meta
        </Link>
      </div>
    );
  }

  return (
    <ul className="lista-filas">
      {metas.map((meta) => {
        const pct = meta.montoObjetivo > 0 ? (meta.montoActualClp / meta.montoObjetivo) * 100 : 0;
        const pctVisual = Math.min(100, Math.max(0, pct));
        const faltante = meta.montoObjetivo - meta.montoActualClp;
        const cumplida = faltante <= 0;
        const confirmando = confirmandoId === meta.id;

        return (
          <li key={meta.id} className="py-3.5 first:pt-1 last:pb-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-small font-semibold text-fg">{meta.nombre}</p>
                <p className="mt-0.5 text-micro text-fg-muted">
                  Objetivo <span className="money-value font-mono-tabular text-fg-soft">{formatoPesos(meta.montoObjetivo)}</span>
                  {meta.fechaObjetivo && (
                    <>
                      {" · "}para el <span className="font-mono-tabular">{formatoFecha(meta.fechaObjetivo)}</span>
                    </>
                  )}
                </p>
              </div>
              <p
                className="shrink-0 font-mono-tabular text-base font-semibold"
                style={{ color: cumplida ? "var(--color-pos)" : "var(--color-fg)" }}
              >
                {Math.floor(pct)}%
              </p>
            </div>

            <div
              role="progressbar"
              aria-label={`Progreso de ${meta.nombre}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pctVisual)}
              aria-valuetext={`${Math.floor(pct)}% alcanzado${cumplida ? ", meta cumplida" : ""}`}
              className="my-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${pctVisual}%`, background: cumplida ? "var(--color-pos)" : "var(--color-accent)" }}
              />
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-micro">
              <span className="money-value font-mono-tabular font-semibold text-fg-soft">
                {formatoPesos(meta.montoActualClp)}
              </span>
              <span className="font-mono-tabular font-medium" style={{ color: cumplida ? "var(--color-pos)" : "var(--color-fg-muted)" }}>
                {cumplida ? "Cumplida" : <><span className="money-value">{formatoPesos(faltante)}</span> por llegar</>}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            {meta.cuentasAsociadas.length > 0 ? (
              <p className="min-w-0 flex-1 text-micro leading-relaxed text-fg-subtle">Suma: {meta.cuentasAsociadas.join(", ")}</p>
            ) : (
              <p className="min-w-0 flex-1 text-micro text-fg-subtle">Sin cuentas asociadas</p>
            )}

            {!compacta && (
              <div className="-my-1 ml-auto flex flex-wrap items-center justify-end gap-2" aria-live="polite">
                {confirmando ? (
                  <>
                    <span className="text-micro text-fg-muted">¿Eliminar esta meta? Tus cuentas no cambian.</span>
                    <button type="button" onClick={() => setConfirmandoId(null)} className="boton-secundario min-h-9 px-3">
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarMeta(meta)}
                      className="boton-secundario min-h-9 px-3 !text-neg"
                    >
                      Sí, eliminar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmandoId(meta.id)}
                    disabled={eliminandoId === meta.id}
                    aria-label={`Eliminar la meta ${meta.nombre}`}
                    className="min-h-10 rounded-lg px-2 text-small font-medium text-fg-muted hover:bg-white/[0.06] hover:text-fg disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {eliminandoId === meta.id ? "Eliminando…" : "Eliminar"}
                  </button>
                )}
              </div>
            )}
            </div>

            {errores[meta.id] && <p className="mt-2 text-micro text-neg" role="alert">{errores[meta.id]}</p>}
          </li>
        );
      })}
    </ul>
  );
}
