import { createClient } from "@/lib/supabase/server";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { CapitalSummary } from "@/components/CapitalSummary";
import { PlatformBreakdown } from "@/components/PlatformBreakdown";
import { AssetTypeBreakdown } from "@/components/AssetTypeBreakdown";
import { PortfolioChart } from "@/components/PortfolioChart";
import { MarketBenchmark } from "@/components/MarketBenchmark";
import { Ayuda } from "@/components/Ayuda";
import { AccountRow } from "@/components/AccountRow";
import { SnapshotForm } from "@/components/SnapshotForm";
import { ExportarDatos } from "@/components/ExportarDatos";
import { TIPOS } from "@/lib/tipos-cuenta";
import type { Cuenta, RendimientoActual, TipoCuenta, TipoMovimiento } from "@/types/database";
import { obtenerCambioSp500, obtenerCambioUf } from "@/lib/mercado";
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
    { data: evolucionPortafolio },
    { count: cuentasInactivasCount },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("cuentas").select("*").eq("activa", true).order("created_at"),
    supabase.from("rendimiento_actual").select("*"),
    supabase.from("snapshots").select("id, cuenta_id").eq("fecha", hoy),
    supabase.from("capital_por_cuenta").select("*"),
    supabase.from("evolucion_portafolio").select("*"),
    supabase.from("cuentas").select("id", { count: "exact", head: true }).eq("activa", false),
  ]);

  // fuera del Promise.all a proposito: son servicios externos opcionales, no
  // datos del usuario -- si yahoo o mindicador.cl estan lentos o caidos,
  // nunca deben bloquear ni romper la carga del resto del dashboard (ambas
  // funciones ya nunca lanzan, el catch de aca es la segunda red de seguridad).
  const [benchmarkSp500, benchmarkUf] = await Promise.all([
    obtenerCambioSp500().catch(() => null),
    obtenerCambioUf().catch(() => null),
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

  // capital_por_cuenta trae el valor actual desde el primer snapshot que
  // exista (no exige dos, a diferencia de rendimiento_actual) — se usa como
  // respaldo para que "valor total del portafolio" no quede en $0 el primer
  // dia de una cuenta.
  const capitalPorCuentaMap = new Map(
    (capitalPorCuenta ?? [])
      .filter((c): c is typeof c & { cuenta_id: string } => c.cuenta_id !== null)
      .map((c) => [c.cuenta_id, c])
  );

  const cuentasConDatos = (cuentas ?? []).map((cuenta: Cuenta) => ({
    cuenta,
    rendimiento: rendimientoPorCuenta.get(cuenta.id) ?? null,
  }));

  // se suma valor_clp, no valor a secas: valor esta en la moneda nativa de
  // cada cuenta (usd, uf, clp), y no se pueden sumar monedas distintas sin
  // convertir primero. valor_clp ya viene convertido desde la vista sql.
  //
  // si una cuenta todavia no tiene fila en rendimiento_actual (le falta un
  // segundo snapshot en otra fecha para poder comparar semana contra semana),
  // se usa valor_actual_clp de capital_por_cuenta como respaldo para el total
  // — y ESE MISMO valor se usa tambien como "anterior" para esa cuenta, para
  // que su aporte de capital no aparezca como ganancia de la semana (regla de
  // negocio: nunca confundir un aporte con rendimiento).
  const valorTotal = cuentasConDatos.reduce((acc, c) => {
    const valorClp = c.rendimiento?.valor_clp ?? capitalPorCuentaMap.get(c.cuenta.id)?.valor_actual_clp ?? 0;
    return acc + valorClp;
  }, 0);
  const valorTotalAnterior = cuentasConDatos.reduce((acc, c) => {
    const valorAnteriorClp =
      c.rendimiento?.valor_clp_anterior ??
      c.rendimiento?.valor_clp ??
      capitalPorCuentaMap.get(c.cuenta.id)?.valor_actual_clp ??
      0;
    return acc + valorAnteriorClp;
  }, 0);

  // capital_aportado_clp y valor_actual_clp vienen de una vista, asi que el
  // tipo generado los marca nullable aunque el sql ya haga coalesce en el
  // primero — igual se defiende aca con ?? 0 antes de sumar (una cuenta sin
  // snapshots todavia trae valor_actual_clp null, y sumar null contamina
  // todo el total con NaN).
  const capitalAportadoClp = (capitalPorCuenta ?? []).reduce((acc, c) => acc + (c.capital_aportado_clp ?? 0), 0);
  const valorActualClp = (capitalPorCuenta ?? []).reduce((acc, c) => acc + (c.valor_actual_clp ?? 0), 0);

  // agrupa por plataforma (texto libre, no enum) para ver cuanto hay en cada
  // banco/corredora. la clave se normaliza (trim + minusculas) para que un
  // despiste de tipeo no genere dos grupos separados, pero el nombre que se
  // muestra usa el texto tal cual lo escribio el usuario la primera vez.
  const plataformasMap = new Map<
    string,
    { nombre: string; capitalAportadoClp: number; valorActualClp: number }
  >();
  (cuentas ?? []).forEach((cuenta) => {
    const clave = cuenta.plataforma.trim().toLowerCase();
    const datos = capitalPorCuentaMap.get(cuenta.id);
    const grupo = plataformasMap.get(clave) ?? {
      nombre: cuenta.plataforma.trim(),
      capitalAportadoClp: 0,
      valorActualClp: 0,
    };
    grupo.capitalAportadoClp += datos?.capital_aportado_clp ?? 0;
    grupo.valorActualClp += datos?.valor_actual_clp ?? 0;
    plataformasMap.set(clave, grupo);
  });
  const plataformas = Array.from(plataformasMap.values()).sort((a, b) => b.valorActualClp - a.valorActualClp);

  // agrupa por tipo de activo (fondo_mutuo, acciones, etc. -- un enum fijo,
  // no texto libre como plataforma, asi que no hace falta normalizar la
  // clave). TIPOS ya trae la etiqueta legible de cada valor, reusada de
  // CuentaForm.tsx en vez de duplicar la lista de nombres una tercera vez.
  const etiquetaPorTipo = new Map(TIPOS.map((t) => [t.value, t.label]));
  const tiposMap = new Map<string, { nombre: string; capitalAportadoClp: number; valorActualClp: number }>();
  (cuentas ?? []).forEach((cuenta) => {
    const datos = capitalPorCuentaMap.get(cuenta.id);
    const grupo = tiposMap.get(cuenta.tipo) ?? {
      nombre: etiquetaPorTipo.get(cuenta.tipo as TipoCuenta) ?? cuenta.tipo,
      capitalAportadoClp: 0,
      valorActualClp: 0,
    };
    grupo.capitalAportadoClp += datos?.capital_aportado_clp ?? 0;
    grupo.valorActualClp += datos?.valor_actual_clp ?? 0;
    tiposMap.set(cuenta.tipo, grupo);
  });
  const tipos = Array.from(tiposMap.values()).sort((a, b) => b.valorActualClp - a.valorActualClp);

  // valor_actual (moneda nativa, no clp) de capital_por_cuenta -- el ultimo
  // valor conocido de cada cuenta, usado por SnapshotForm para sugerir el
  // valor de hoy al marcar un aporte/retiro y para advertir si no cambio.
  const valorAnteriorPorCuenta: Record<string, number | null> = {};
  (cuentas ?? []).forEach((cuenta) => {
    valorAnteriorPorCuenta[cuenta.id] = capitalPorCuentaMap.get(cuenta.id)?.valor_actual ?? null;
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">Mi portafolio</h1>
        <div className="flex flex-col items-end gap-1">
          <form action={logout} className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{user?.email}</span>
            <button type="submit" className="text-xs text-gray-500 underline">
              cerrar sesion
            </button>
          </form>
          <ExportarDatos />
        </div>
      </div>
      <PortfolioSummary valorTotal={valorTotal} valorTotalAnterior={valorTotalAnterior} />
      <MarketBenchmark sp500={benchmarkSp500} uf={benchmarkUf} />
      <div className="mt-3">
        <CapitalSummary
          capitalAportadoClp={capitalAportadoClp}
          valorActualClp={valorActualClp}
          hayCuentas={cuentasConDatos.length > 0}
        />
      </div>
      <div className="mt-3">
        <PlatformBreakdown plataformas={plataformas} />
      </div>
      <div className="mt-3">
        <AssetTypeBreakdown tipos={tipos} />
      </div>
      <div className="mt-3">
        <PortfolioChart datos={evolucionPortafolio ?? []} />
      </div>
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">tus cuentas</p>
          <Link href="/cuentas/nueva" className="text-sm text-gray-900 underline">
            + agregar cuenta
          </Link>
        </div>
        <Ayuda>
          Cada cuenta muestra su valor más reciente. El % aparece una vez que haya al menos dos
          registros para comparar, y ya viene descontando cualquier aporte o retiro — no es
          ganancia hasta que no se compare registro contra registro.
        </Ayuda>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {cuentasConDatos.map(({ cuenta, rendimiento }) => (
          <AccountRow
            key={cuenta.id}
            cuenta={cuenta}
            rendimiento={rendimiento}
            valorActualFallback={capitalPorCuentaMap.get(cuenta.id)?.valor_actual ?? null}
          />
        ))}
        {cuentasConDatos.length === 0 && (
          <p className="text-sm text-gray-500">todavia no hay cuentas.</p>
        )}
      </div>
      {(cuentasInactivasCount ?? 0) > 0 && (
        <div className="mt-2">
          <Link href="/cuentas/inactivas" className="text-xs text-gray-500 underline">
            ver cuentas dadas de baja
          </Link>
        </div>
      )}
      <div className="mt-8">
        <SnapshotForm
          cuentas={cuentas ?? []}
          movimientosHoy={movimientosHoy}
          valorAnteriorPorCuenta={valorAnteriorPorCuenta}
        />
      </div>
    </main>
  );
}
