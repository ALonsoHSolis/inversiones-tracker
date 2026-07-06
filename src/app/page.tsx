import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/Hero";
import { PlatformBreakdown } from "@/components/PlatformBreakdown";
import { AssetTypeBreakdown } from "@/components/AssetTypeBreakdown";
import { PortfolioChart } from "@/components/PortfolioChart";
import { MarketBenchmark } from "@/components/MarketBenchmark";
import { Ayuda } from "@/components/Ayuda";
import { AccountRow } from "@/components/AccountRow";
import { CargaRapida } from "@/components/CargaRapida";
import { SnapshotForm } from "@/components/SnapshotForm";
import { ExportarDatos } from "@/components/ExportarDatos";
import { PrivacyShell, PrivacyToggleButton } from "@/components/PrivacyShell";
import { TIPOS } from "@/lib/tipos-cuenta";
import type { Cuenta, RendimientoActual, TipoCuenta, TipoMovimiento } from "@/types/database";
import { obtenerCambioSp500, obtenerCambioUf } from "@/lib/mercado";
import { logout } from "./actions";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  // benchmarkSp500/benchmarkUf van en el mismo Promise.all que las consultas
  // a supabase (no en uno aparte despues): son servicios externos opcionales,
  // pero si se esperan en un batch separado y posterior, su latencia se SUMA
  // a la del resto en vez de superponerse -- confirmado como parte de la
  // demora reportada en el login (redirect -> dashboard). Van al final del
  // arreglo (no antes) solo por prolijidad de lectura, el orden no afecta el
  // paralelismo. Best-effort de todas formas: ambas funciones ya nunca
  // lanzan, el catch de aca es la segunda red de seguridad.
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
    benchmarkSp500,
    benchmarkUf,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("cuentas").select("*").eq("activa", true).order("created_at"),
    supabase.from("rendimiento_actual").select("*"),
    supabase.from("snapshots").select("id, cuenta_id").eq("fecha", hoy),
    supabase.from("capital_por_cuenta").select("*"),
    supabase.from("evolucion_portafolio").select("*").order("fecha"),
    supabase.from("cuentas").select("id", { count: "exact", head: true }).eq("activa", false),
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
    <PrivacyShell>
      <main className="max-w-[1160px] mx-auto px-6 pt-[26px] pb-16">
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-end justify-center gap-[3px] px-[9px] py-2.5">
              <span className="w-1 h-2 bg-white/55 rounded-[1px]" />
              <span className="w-1 h-[13px] bg-white/80 rounded-[1px]" />
              <span className="w-1 h-[18px] bg-white rounded-[1px]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.01em]">Mi portafolio</p>
              <p className="mt-0.5 text-xs text-[#8A929E]">Rendimiento real · consolidado en CLP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PrivacyToggleButton />
            <ExportarDatos />
            <div className="w-px h-[22px] bg-[#E1E4EA] mx-1" />
            <div className="text-right leading-tight">
              <p className="text-[12.5px] font-medium text-[#40474F]">{user?.email}</p>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-[11.5px] text-[#8A929E] border-b border-[#DADEE4]"
                >
                  cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </header>

        <Hero
          valorTotal={valorTotal}
          valorTotalAnterior={valorTotalAnterior}
          capitalAportadoClp={capitalAportadoClp}
          valorActualClp={valorActualClp}
          chart={<PortfolioChart datos={evolucionPortafolio ?? []} />}
          benchmark={<MarketBenchmark sp500={benchmarkSp500} uf={benchmarkUf} />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <PlatformBreakdown plataformas={plataformas} />
          <AssetTypeBreakdown tipos={tipos} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mt-4 items-start">
          <section className="bg-white border border-[#E7E9EE] rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,30,50,0.03)]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[13.5px] font-semibold">Tus cuentas</p>
              <Link
                href="/cuentas/nueva"
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--accent)] no-underline"
              >
                + agregar cuenta
              </Link>
            </div>
            <div className="flex items-center gap-1.5 mb-3.5">
              <p className="text-[11.5px] text-[#A0A7B2]">
                Rendimiento en moneda nativa · ya descuenta aportes y retiros
              </p>
              <Ayuda>
                El % &quot;real&quot; aparece una vez que haya al menos dos registros para comparar, y ya
                viene descontando cualquier aporte o retiro — no es ganancia hasta que no se compare
                registro contra registro. El % &quot;anualizado&quot; proyecta la ganancia acumulada desde
                que se creó la cuenta a una tasa equivalente por año (aparece desde el mes de
                antigüedad) — es una aproximación simple, no ajusta por el momento exacto de cada
                aporte dentro del período.
              </Ayuda>
            </div>
            <div className="flex flex-col gap-[9px]">
              {cuentasConDatos.map(({ cuenta, rendimiento }) => (
                <AccountRow
                  key={cuenta.id}
                  cuenta={cuenta}
                  rendimiento={rendimiento}
                  valorActualFallback={capitalPorCuentaMap.get(cuenta.id)?.valor_actual ?? null}
                  capitalAportadoFallback={capitalPorCuentaMap.get(cuenta.id)?.capital_aportado ?? null}
                  ultimaFechaFallback={capitalPorCuentaMap.get(cuenta.id)?.ultima_fecha ?? null}
                />
              ))}
              {cuentasConDatos.length === 0 && (
                <p className="text-[13px] text-[#A0A7B2]">todavía no hay cuentas.</p>
              )}
            </div>
            {(cuentasInactivasCount ?? 0) > 0 && (
              <Link
                href="/cuentas/inactivas"
                className="inline-block mt-3 text-[11.5px] text-[#A0A7B2] border-b border-[#E2E5EA]"
              >
                ver cuentas dadas de baja
              </Link>
            )}
          </section>

          <div className="lg:sticky lg:top-5 flex flex-col gap-4">
            <CargaRapida
              cuentas={cuentas ?? []}
              movimientosHoy={movimientosHoy}
              valorAnteriorPorCuenta={valorAnteriorPorCuenta}
            />
            <details className="group">
              <summary className="text-[12.5px] font-semibold text-[var(--accent)] cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                actualizar varias cuentas de una vez
              </summary>
              <div className="mt-3">
                <SnapshotForm
                  cuentas={cuentas ?? []}
                  movimientosHoy={movimientosHoy}
                  valorAnteriorPorCuenta={valorAnteriorPorCuenta}
                />
              </div>
            </details>
          </div>
        </div>

        <p className="mt-6 text-[11px] text-[#B4BAC3] text-center">
          El % real aparece cuando hay al menos dos registros para comparar
        </p>
      </main>
    </PrivacyShell>
  );
}
