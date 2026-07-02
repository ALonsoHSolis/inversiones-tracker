import { createClient } from "@/lib/supabase/server";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { CapitalSummary } from "@/components/CapitalSummary";
import { AccountRow } from "@/components/AccountRow";
import { SnapshotForm } from "@/components/SnapshotForm";
import type { Cuenta, RendimientoActual, TipoMovimiento } from "@/types/database";
import { logout } from "./actions";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [
    {
      data: { user },
    },
    { data: cuentas },
    { data: rendimientos },
    { data: snapshotsHoy },
    { data: capitalPorCuenta },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("cuentas").select("*").eq("activa", true).order("created_at"),
    supabase.from("rendimiento_actual").select("*"),
    supabase.from("snapshots").select("id, cuenta_id").eq("fecha", hoy),
    supabase.from("capital_por_cuenta").select("*"),
  ]);

  // caso mas comun: todavia no hay ningun snapshot guardado hoy (primera carga
  // del dia). en ese caso no hay que consultar movimientos en absoluto — evita
  // mandar un .in() con arreglo vacio.
  const snapshotIdsHoy = (snapshotsHoy ?? []).map((s) => s.id);
  const { data: movimientosHoyRaw } =
    snapshotIdsHoy.length > 0
      ? await supabase.from("movimientos").select("tipo, monto, snapshot_id").in("snapshot_id", snapshotIdsHoy)
      : { data: [] as { tipo: string; monto: number; snapshot_id: string | null }[] };

  const snapshotIdACuenta = new Map((snapshotsHoy ?? []).map((s) => [s.id, s.cuenta_id]));
  const movimientosHoy: Record<string, { tipo: TipoMovimiento; monto: number }> = {};
  (movimientosHoyRaw ?? []).forEach((m) => {
    const cuentaId = m.snapshot_id ? snapshotIdACuenta.get(m.snapshot_id) : undefined;
    if (cuentaId) movimientosHoy[cuentaId] = { tipo: m.tipo as TipoMovimiento, monto: m.monto };
  });

  const rendimientoPorCuenta = new Map<string, RendimientoActual>(
    (rendimientos ?? [])
      .filter((r): r is RendimientoActual & { cuenta_id: string } => r.cuenta_id !== null)
      .map((r) => [r.cuenta_id, r])
  );

  const cuentasConDatos = (cuentas ?? []).map((cuenta: Cuenta) => ({
    cuenta,
    rendimiento: rendimientoPorCuenta.get(cuenta.id) ?? null,
  }));

  // se suma valor_clp, no valor a secas: valor esta en la moneda nativa de
  // cada cuenta (usd, uf, clp), y no se pueden sumar monedas distintas sin
  // convertir primero. valor_clp ya viene convertido desde la vista sql.
  const valorTotal = cuentasConDatos.reduce((acc, c) => acc + (c.rendimiento?.valor_clp ?? 0), 0);
  const valorTotalAnterior = cuentasConDatos.reduce(
    (acc, c) => acc + (c.rendimiento?.valor_clp_anterior ?? c.rendimiento?.valor_clp ?? 0),
    0
  );

  // capital_aportado_clp y valor_actual_clp vienen de una vista, asi que el
  // tipo generado los marca nullable aunque el sql ya haga coalesce en el
  // primero — igual se defiende aca con ?? 0 antes de sumar (una cuenta sin
  // snapshots todavia trae valor_actual_clp null, y sumar null contamina
  // todo el total con NaN).
  const capitalAportadoClp = (capitalPorCuenta ?? []).reduce((acc, c) => acc + (c.capital_aportado_clp ?? 0), 0);
  const valorActualClp = (capitalPorCuenta ?? []).reduce((acc, c) => acc + (c.valor_actual_clp ?? 0), 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">Mi portafolio</h1>
        <form action={logout} className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{user?.email}</span>
          <button type="submit" className="text-xs text-gray-500 underline">
            cerrar sesion
          </button>
        </form>
      </div>
      <PortfolioSummary valorTotal={valorTotal} valorTotalAnterior={valorTotalAnterior} />
      <div className="mt-3">
        <CapitalSummary
          capitalAportadoClp={capitalAportadoClp}
          valorActualClp={valorActualClp}
          hayCuentas={cuentasConDatos.length > 0}
        />
      </div>
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm font-medium">tus cuentas</p>
        <Link href="/cuentas/nueva" className="text-sm text-gray-900 underline">
          + agregar cuenta
        </Link>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {cuentasConDatos.map(({ cuenta, rendimiento }) => (
          <AccountRow key={cuenta.id} cuenta={cuenta} rendimiento={rendimiento} />
        ))}
        {cuentasConDatos.length === 0 && (
          <p className="text-sm text-gray-500">todavia no hay cuentas.</p>
        )}
      </div>
      <div className="mt-8">
        <SnapshotForm cuentas={cuentas ?? []} movimientosHoy={movimientosHoy} />
      </div>
    </main>
  );
}
