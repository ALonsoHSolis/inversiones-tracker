import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AccountRow } from "@/components/AccountRow";
import { EmptyAccountsState } from "@/components/EmptyAccountsState";
import { fechaHoyChile } from "@/lib/fecha";
import { createClient } from "@/lib/supabase/server";
import type { Cuenta, RendimientoActual } from "@/types/database";

export const metadata: Metadata = { title: "Cuentas" };

// fase 2: listado simple que reutiliza AccountRow (mismos datos y calculos que
// tenia el dashboard). la tabla ordenable/filtrable llega en la fase 4.
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

  return (
    <div className="mx-auto max-w-[760px] flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">Tus cuentas</h1>
          <p className="mt-1 text-small text-fg-muted">
            El % de cada cuenta está en su moneda; los montos de la fila, en pesos.
          </p>
        </div>
        <Link
          href="/cuentas/nueva"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[var(--accent)] text-ink text-small font-semibold no-underline transition-[transform,background-color] duration-150 hover:bg-accent-hi active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
          Agregar cuenta
        </Link>
      </div>

      <div className="flex flex-col gap-[9px]">
        {(cuentas ?? []).map((cuenta: Cuenta) => (
          <AccountRow
            key={cuenta.id}
            cuenta={cuenta}
            rendimiento={rendimientoPorCuenta.get(cuenta.id) ?? null}
            valorActualFallback={capitalPorCuentaMap.get(cuenta.id)?.valor_actual ?? null}
            valorClpFallback={capitalPorCuentaMap.get(cuenta.id)?.valor_actual_clp ?? null}
            capitalAportadoFallback={capitalPorCuentaMap.get(cuenta.id)?.capital_aportado ?? null}
            ultimaFechaFallback={capitalPorCuentaMap.get(cuenta.id)?.ultima_fecha ?? null}
            ahoraMs={hoyMs}
          />
        ))}
        {(cuentas ?? []).length === 0 && <EmptyAccountsState />}
      </div>

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
