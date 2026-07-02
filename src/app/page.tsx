import { createClient } from "@/lib/supabase/server";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { AccountRow } from "@/components/AccountRow";
import { SnapshotForm } from "@/components/SnapshotForm";
import type { Cuenta, RendimientoActual } from "@/types/database";
import { logout } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: cuentas },
    { data: rendimientos },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("cuentas").select("*").eq("activa", true).order("created_at"),
    supabase.from("rendimiento_actual").select("*"),
  ]);

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
      <div className="mt-8 flex flex-col gap-2">
        {cuentasConDatos.map(({ cuenta, rendimiento }) => (
          <AccountRow key={cuenta.id} cuenta={cuenta} rendimiento={rendimiento} />
        ))}
        {cuentasConDatos.length === 0 && (
          <p className="text-sm text-gray-500">
            todavia no hay cuentas. agregalas directo en supabase mientras armamos la pantalla de crud.
          </p>
        )}
      </div>
      <div className="mt-8">
        <SnapshotForm cuentas={cuentas ?? []} />
      </div>
    </main>
  );
}
