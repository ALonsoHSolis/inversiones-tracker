import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/Hero";
import { PlatformBreakdown } from "@/components/PlatformBreakdown";
import { AssetTypeBreakdown } from "@/components/AssetTypeBreakdown";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { PortfolioChart } from "@/components/PortfolioChart";
import { MarketBenchmark } from "@/components/MarketBenchmark";
import { MetricasSecundarias } from "@/components/MetricasSecundarias";
import { calcularMetricasPortafolio } from "@/lib/metricas-portafolio";
import { Ayuda } from "@/components/Ayuda";
import { AccountRow } from "@/components/AccountRow";
import { CargaRapida } from "@/components/CargaRapida";
import { SnapshotForm } from "@/components/SnapshotForm";
import { MetasList, type MetaConProgreso } from "@/components/MetasList";
import { TIPOS } from "@/lib/tipos-cuenta";
import type { Cuenta, RendimientoActual, TipoCuenta, TipoMovimiento } from "@/types/database";
import { obtenerCambioSp500, obtenerCambioUf } from "@/lib/mercado";
import { EmptyAccountsState } from "@/components/EmptyAccountsState";
import Link from "next/link";
import { fechaHoyChile } from "@/lib/fecha";
import { agruparCapital, calcularMetasConProgreso, porCategoria, porPlataforma, porTipo } from "@/lib/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const hoy = fechaHoyChile();

  // benchmarkSp500/benchmarkUf van en el mismo Promise.all que las consultas
  // a supabase (no en uno aparte despues): son servicios externos opcionales,
  // pero si se esperan en un batch separado y posterior, su latencia se SUMA
  // a la del resto en vez de superponerse -- confirmado como parte de la
  // demora reportada en el login (redirect -> dashboard). Van al final del
  // arreglo (no antes) solo por prolijidad de lectura, el orden no afecta el
  // paralelismo. Best-effort de todas formas: ambas funciones ya nunca
  // lanzan, el catch de aca es la segunda red de seguridad.
  const [
    { data: cuentas },
    { data: rendimientos },
    { data: snapshotsHoy },
    { data: capitalPorCuenta },
    { data: evolucionPortafolio },
    { data: movimientosTodos },
    { data: metas },
    { data: metaCuentas },
    { count: cuentasInactivasCount },
    benchmarkSp500,
    benchmarkUf,
  ] = await Promise.all([
    supabase.from("cuentas").select("*").eq("activa", true).order("created_at"),
    supabase.from("rendimiento_actual").select("*"),
    supabase.from("snapshots").select("id, cuenta_id").eq("fecha", hoy),
    supabase.from("capital_por_cuenta").select("*"),
    supabase.from("evolucion_portafolio").select("*").order("fecha"),
    // metas de ahorro (fase 3 del roadmap) -- el progreso se calcula aca
    // reusando capital_por_cuenta, ya consultado arriba, no vive en sql.
    supabase.from("movimientos").select("cuenta_id, fecha, tipo, monto, tasa_cambio").order("fecha"),
    supabase.from("metas").select("*").order("created_at"),
    supabase.from("meta_cuentas").select("meta_id, cuenta_id"),
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

  // agrupaciones de capital y valor actual (ya en CLP) para los desgloses y la composicion historica.
  const etiquetaPorTipo = new Map<string, string>(TIPOS.map((t) => [t.value, t.label]));
  const cuentasActivas = cuentas ?? [];
  const plataformas = agruparCapital(cuentasActivas, capitalPorCuentaMap, porPlataforma);
  const tipos = agruparCapital(cuentasActivas, capitalPorCuentaMap, porTipo(etiquetaPorTipo));
  const categorias = agruparCapital(cuentasActivas, capitalPorCuentaMap, porCategoria);

  const hoyMs = new Date(hoy).getTime();

  // metas de ahorro: el progreso suma valor_actual_clp de las cuentas asociadas.
  const nombrePorCuentaId = new Map((cuentas ?? []).map((c) => [c.id, c.nombre]));
  const metasConProgreso: MetaConProgreso[] = calcularMetasConProgreso(
    metas ?? [],
    metaCuentas ?? [],
    capitalPorCuentaMap,
    nombrePorCuentaId
  );

  // valor_actual (moneda nativa, no clp) de capital_por_cuenta -- el ultimo
  // valor conocido de cada cuenta, usado por SnapshotForm para sugerir el
  // valor de hoy al marcar un aporte/retiro y para advertir si no cambio.
  const valorAnteriorPorCuenta: Record<string, number | null> = {};
  (cuentas ?? []).forEach((cuenta) => {
    valorAnteriorPorCuenta[cuenta.id] = capitalPorCuentaMap.get(cuenta.id)?.valor_actual ?? null;
  });

  // fecha del registro mas reciente entre todas las cuentas (dato real de
  // capital_por_cuenta.ultima_fecha); null si ninguna cuenta tiene registros.
  const ultimaActualizacion = (capitalPorCuenta ?? []).reduce<string | null>(
    (max, c) => (c.ultima_fecha && (!max || c.ultima_fecha > max) ? c.ultima_fecha : max),
    null
  );

  // twr / xirr / drawdown del portafolio: mismas formulas que /analisis.
  const metricasPortafolio = calcularMetricasPortafolio({
    evolucion: evolucionPortafolio ?? [],
    movimientos: movimientosTodos ?? [],
    cuentas: cuentasActivas,
    valorActualClp,
    hoy,
  });




  return (
    <div className="flex flex-col gap-4">
    <h1 className="sr-only">Resumen del portafolio</h1>
    <Hero
      valorTotal={valorTotal}
      valorTotalAnterior={valorTotalAnterior}
      capitalAportadoClp={capitalAportadoClp}
      valorActualClp={valorActualClp}
      ultimaActualizacion={ultimaActualizacion}
      hayMonedaExtranjera={cuentasActivas.some((c) => c.moneda !== "CLP")}
      chart={<PortfolioChart datos={evolucionPortafolio ?? []} />}
      benchmark={
        <MarketBenchmark
          sp500={benchmarkSp500}
          uf={benchmarkUf}
          rendimientoRealPct={
            capitalAportadoClp > 0 ? ((valorActualClp - capitalAportadoClp) / capitalAportadoClp) * 100 : null
          }
        />
      }
    />

    {cuentasActivas.length > 0 && (
      <MetricasSecundarias
        twr={metricasPortafolio.twr}
        xirr={metricasPortafolio.xirr}
        drawdown={metricasPortafolio.drawdown}
      />
    )}

    <div className="animate-fade-up grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4  items-start" style={{ "--i": 1 } as React.CSSProperties}>
      <section className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-small font-semibold text-fg">Estado de tus cuentas</p>
          <Link
            href="/cuentas/nueva"
            className="no-print inline-flex items-center gap-1 text-micro font-semibold text-[var(--accent)] no-underline"
          >
            + agregar cuenta
          </Link>
        </div>
        <div className="flex items-center gap-1.5 mb-3.5">
          <p className="text-micro text-fg-muted">
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
              valorClpFallback={capitalPorCuentaMap.get(cuenta.id)?.valor_actual_clp ?? null}
              capitalAportadoFallback={capitalPorCuentaMap.get(cuenta.id)?.capital_aportado ?? null}
              ultimaFechaFallback={capitalPorCuentaMap.get(cuenta.id)?.ultima_fecha ?? null}
              ahoraMs={hoyMs}
            />
          ))}
          {cuentasConDatos.length === 0 && <EmptyAccountsState />}
        </div>
        {(cuentasInactivasCount ?? 0) > 0 && (
          <Link
            href="/cuentas/inactivas"
            className="inline-block mt-3 text-micro text-fg-muted border-b border-white/[0.14]"
          >
            ver cuentas dadas de baja
          </Link>
        )}
      </section>

      <div className="no-print hidden lg:flex lg:sticky lg:top-24 flex-col gap-4">
        <CargaRapida
          cuentas={cuentas ?? []}
          movimientosHoy={movimientosHoy}
          valorAnteriorPorCuenta={valorAnteriorPorCuenta}
        />
        <details className="group">
          <summary className="text-micro font-semibold text-[var(--accent)] cursor-pointer list-none [&::-webkit-details-marker]:hidden">
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

    <section className="animate-fade-up card p-5" style={{ "--i": 2 } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-small font-semibold text-fg">Tus metas</p>
        <Link
          href="/metas/nueva"
          className="no-print inline-flex items-center gap-1 text-micro font-semibold text-[var(--accent)] no-underline"
        >
          + agregar meta
        </Link>
      </div>
      <p className="text-micro text-fg-muted mb-3.5">
        El progreso suma el valor actual (en CLP) de las cuentas que asociaste a cada meta
      </p>
      <MetasList metas={metasConProgreso} />
    </section>

    <div className="animate-fade-up grid grid-cols-1 md:grid-cols-2 gap-4" style={{ "--i": 3 } as React.CSSProperties}>
      <PlatformBreakdown plataformas={plataformas} />
      <AssetTypeBreakdown tipos={tipos} />
      <CategoryBreakdown categorias={categorias} />
    </div>



      <Link
        href="/analisis"
        className="animate-fade-up card flex items-center justify-between gap-3 px-5 py-4 transition-colors duration-200 hover:border-white/[0.2] focus-visible:outline-2 focus-visible:outline-accent"
        style={{ "--i": 4 } as React.CSSProperties}
      >
        <span>
          <span className="block text-small font-semibold text-fg">Análisis avanzado</span>
          <span className="block mt-0.5 text-micro text-fg-muted">
            Composición histórica, comparación de cuentas (TWR, XIRR, drawdown) y salud de los datos
          </span>
        </span>
        <span aria-hidden="true" className="text-fg-muted">→</span>
      </Link>
    </div>
  );
}
