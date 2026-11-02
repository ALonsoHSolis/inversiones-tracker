import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CuentasTabla } from "@/components/CuentasTabla";
import { EmptyAccountsState } from "@/components/EmptyAccountsState";
import { UMBRAL_DATO_ANTIGUO_DIAS_SALUD } from "@/lib/dashboard";
import { fechaHoyChile } from "@/lib/fecha";
import { calcularRendimientoAnualizado } from "@/lib/rendimiento";
import { createClient } from "@/lib/supabase/server";
import { TIPOS } from "@/lib/tipos-cuenta";
import type { FilaCuenta } from "@/lib/cuentas-tabla";
import type { RendimientoActual } from "@/types/database";

export const metadata: Metadata = { title: "Cuentas" };

const MS_DIA = 1000 * 60 * 60 * 24;

// listado de cuentas. los datos y los calculos por cuenta son los mismos que
// usa AccountRow en el dashboard (rendimiento_actual / capital_por_cuenta y
// calcularRendimientoAnualizado): aca solo se arman filas planas para que la
// tabla las ordene y filtre en el cliente.
export default async function CuentasPage() {
  const supabase = await createClient();
  const hoyMs = new Date(fechaHoyChile()).getTime();

  const [{ data: cuentas }, { data: rendimientos }, { data: capitalPorCuenta }, { count: inactivas }] =
    await Promise.all([
      supabase.from("cuentas").select("*").eq("activa", true).order("created_at"),
      supabase.from("rendimiento_actual").select("*"),
      supabase.from("capital_por_cuenta").select("*"),
      supabase.from("cuentas").select("id", { count: "exact", head: true }).eq("activa", false),
    ]);

  const rendimientoPorCuenta = new Map<string, RendimientoActual>(
    (rendimientos ?? [])
      .filter((r): r is RendimientoActual & { cuenta_id: string } => r.cuenta_id !== null)
      .map((r) => [r.cuenta_id, r])
  );
  const capitalPorCuentaMap = new Map(
    (capitalPorCuenta ?? [])
      .filter((c): c is typeof c & { cuenta_id: string } => c.cuenta_id !== null)
      .map((c) => [c.cuenta_id, c])
  );
  const etiquetaPorTipo = new Map<string, string>(TIPOS.map((t) => [t.value, t.label]));

  const filas: FilaCuenta[] = (cuentas ?? []).map((cuenta) => {
    const rend = rendimientoPorCuenta.get(cuenta.id) ?? null;
    const capital = capitalPorCuentaMap.get(cuenta.id);
    const valor = rend?.valor ?? capital?.valor_actual ?? null;
    const valorClp = rend?.valor_clp ?? capital?.valor_actual_clp ?? null;
    const diasTranscurridos = (hoyMs - new Date(cuenta.created_at).getTime()) / MS_DIA;
    const anualizado =
      valor != null && capital?.capital_aportado != null
        ? calcularRendimientoAnualizado(capital.capital_aportado, valor, diasTranscurridos)
        : null;
    const ultimaFecha = capital?.ultima_fecha ?? null;
    const dias = ultimaFecha ? (hoyMs - new Date(ultimaFecha).getTime()) / MS_DIA : null;

    return {
      id: cuenta.id,
      nombre: cuenta.nombre,
      plataforma: cuenta.plataforma,
      tipo: cuenta.tipo,
      tipoLabel: etiquetaPorTipo.get(cuenta.tipo) ?? cuenta.tipo,
      moneda: cuenta.moneda,
      valorClp,
      rendimientoPct: rend?.rendimiento_pct ?? null,
      anualizadoPct: anualizado,
      aporteNeto: rend?.aportes_netos ?? null,
      ultimaFecha,
      diasSinActualizar: dias,
      datoAntiguo: dias != null && dias > UMBRAL_DATO_ANTIGUO_DIAS_SALUD,
    };
  });

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-fg">Tus cuentas</h1>
          <p className="mt-1 max-w-[560px] text-small text-fg-muted">
            Cada cuenta con su valor en pesos y su rendimiento real, ya descontados los aportes y retiros.
          </p>
        </div>
        <Link
          href="/cuentas/nueva"
          className="boton-primario no-underline"
        >
          <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
          Agregar cuenta
        </Link>
      </div>

      {filas.length === 0 ? (
        <div className="card">
          <EmptyAccountsState />
        </div>
      ) : (
        <CuentasTabla filas={filas} />
      )}

      {(inactivas ?? 0) > 0 && (
        <Link
          href="/cuentas/inactivas"
          className="self-start text-small text-fg-muted underline underline-offset-2 hover:text-fg"
        >
          Ver cuentas dadas de baja
        </Link>
      )}
    </div>
  );
}
