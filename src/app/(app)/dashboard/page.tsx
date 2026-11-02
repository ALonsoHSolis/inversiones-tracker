import { createClient } from "@/lib/supabase/server";
import { PatrimonioHero } from "@/components/PatrimonioHero";
import { formatoFecha, formatoPct, formatoPesos, formatoPesosSigned } from "@/lib/formato";
import { DistribucionDetalle } from "@/components/DistribucionCard";
import { PestanasDistribucion, type PanelDistribucion } from "@/components/PestanasDistribucion";
import { ArrowRight, ChevronDown, Plus } from "lucide-react";
import { MarketBenchmark } from "@/components/MarketBenchmark";
import { MetricasSecundarias } from "@/components/MetricasSecundarias";
import { calcularMetricasPortafolio } from "@/lib/metricas-portafolio";
import { Ayuda } from "@/components/Ayuda";
import { AccountRow } from "@/components/AccountRow";
import { CargaRapida } from "@/components/CargaRapida";
import { SnapshotForm } from "@/components/SnapshotForm";
import { AccionesRapidas } from "@/components/AccionesRapidas";
import { ActividadReciente } from "@/components/ActividadReciente";
import { construirActividad } from "@/lib/actividad";
import { MetasList, type MetaConProgreso } from "@/components/MetasList";
import { TIPOS } from "@/lib/tipos-cuenta";
import type { Cuenta, RendimientoActual, TipoCuenta, TipoMovimiento } from "@/types/database";
import { obtenerCambioSp500, obtenerCambioUf } from "@/lib/mercado";
import { EmptyAccountsState } from "@/components/EmptyAccountsState";
import Link from "next/link";
import { fechaChileHaceDias, fechaHoyChile } from "@/lib/fecha";
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
    { data: valorDiario },
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
    // mini-grafico de cada cuenta: misma vista que usa /analisis, ultimos 120 dias
    supabase
      .from("valor_diario_por_cuenta")
      .select("fecha, cuenta_id, valor_clp")
      .gte("fecha", fechaChileHaceDias(120))
      .order("fecha"),
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




  const hayCuentas = cuentasActivas.length > 0;
  const paneles: PanelDistribucion[] = [
    {
      id: "plataforma",
      etiqueta: "Plataforma",
      ayuda:
        "Agrupa tus cuentas por banco o corredora para ver cuánto tienes en cada una, sumando el capital aportado y el valor actual de las cuentas de esa plataforma.",
      contenido: <DistribucionDetalle grupos={plataformas} vacio="Todavía no hay cuentas con valor." />,
    },
    {
      id: "tipo",
      etiqueta: "Tipo de activo",
      etiquetaCorta: "Tipo",
      ayuda:
        "Agrupa tus cuentas por tipo (fondo mutuo, acciones, depósito a plazo, etc.) para ver cómo está repartido tu portafolio, sumando el capital aportado y el valor actual de las cuentas de ese tipo.",
      contenido: <DistribucionDetalle grupos={tipos} vacio="Todavía no hay cuentas con valor." />,
    },
    {
      id: "categoria",
      etiqueta: "Categoría",
      ayuda:
        'Agrupa tus cuentas por la categoría personalizada que les asignaste (ej. "jubilación", "fondo de emergencia"). Las cuentas sin categoría no aparecen aquí.',
      contenido: (
        <DistribucionDetalle
          grupos={categorias}
          vacio="Ninguna cuenta tiene categoría todavía. Puedes asignarla al editar una cuenta."
        />
      ),
    },
  ];

  const seriePorCuenta = new Map<string, number[]>();
  (valorDiario ?? []).forEach((v) => {
    if (!v.cuenta_id || v.valor_clp == null) return;
    const lista = seriePorCuenta.get(v.cuenta_id) ?? [];
    lista.push(v.valor_clp);
    seriePorCuenta.set(v.cuenta_id, lista);
  });

  const puntosPatrimonio = (evolucionPortafolio ?? [])
    .filter((d) => d.fecha !== null && d.valor_total_clp !== null && d.capital_aportado_acumulado_clp !== null)
    .map((d) => ({ fecha: d.fecha!, totalClp: d.valor_total_clp!, capitalClp: d.capital_aportado_acumulado_clp! }));

  const cambioNominal = valorTotal - valorTotalAnterior;
  const cambioNominalPct = valorTotalAnterior > 0 ? (cambioNominal / valorTotalAnterior) * 100 : 0;
  const hayMonedaExtranjera = cuentasActivas.some((c) => c.moneda !== "CLP");

  const pieHero = hayCuentas ? (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--color-edge)] pt-5 sm:flex sm:flex-wrap sm:gap-x-10">
      <div className="min-w-0">
        <dt className="text-micro text-fg-muted">Capital aportado</dt>
        <dd className="money-value mt-1 font-mono-tabular text-[15px] font-semibold text-fg">{formatoPesos(capitalAportadoClp)}</dd>
      </div>
      <div className="min-w-0">
        <dt className="flex items-center gap-0.5 text-micro text-fg-muted">
          Vs. registro anterior
          <Ayuda etiqueta="Qué es el cambio desde el registro anterior">
            Cambio nominal del valor total desde el registro anterior de cada cuenta. Incluye aportes y retiros, así
            que no es ganancia: la ganancia real es la cifra de arriba.
          </Ayuda>
        </dt>
        <dd className="mt-1 font-mono-tabular text-[15px] font-semibold text-fg-soft">
          <span className="money-value">{formatoPesosSigned(cambioNominal)}</span>{" "}
          <span className="text-micro font-medium text-fg-muted">({formatoPct(cambioNominalPct)}, incluye aportes)</span>
        </dd>
      </div>
      {ultimaActualizacion && (
        <div className="min-w-0">
          <dt className="text-micro text-fg-muted">Último registro</dt>
          <dd className="mt-1 font-mono-tabular text-[15px] font-semibold text-fg-soft">{formatoFecha(ultimaActualizacion)}</dd>
        </div>
      )}
      <div className="col-span-2 min-w-0 sm:col-span-1">
        <dt className="text-micro text-fg-muted">Moneda</dt>
        <dd className="mt-1 text-small text-fg-soft">
          Pesos (CLP){hayMonedaExtranjera && <span className="text-fg-muted"> · USD y UF a la tasa de cada registro</span>}
        </dd>
      </div>
    </dl>
  ) : null;

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <h1 className="sr-only">Resumen del portafolio</h1>

      <PatrimonioHero
        puntos={puntosPatrimonio}
        valorTotal={valorTotal}
        capitalAportadoClp={capitalAportadoClp}
        valorActualClp={valorActualClp}
        sinCuentas={!hayCuentas}
        pie={pieHero}
      />

      <div className="lg:hidden">
        <AccionesRapidas />
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-8 lg:gap-10">
          {hayCuentas && (
            <section aria-labelledby="desempeno-titulo" className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h2 id="desempeno-titulo" className="titulo-seccion">
                  Desempeño
                </h2>
                <Link
                  href="/analisis"
                  className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap text-small font-semibold text-accent no-underline hover:text-accent-hi focus-visible:outline-2 focus-visible:outline-accent rounded"
                >
                  Ver análisis
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
              <MetricasSecundarias
                twr={metricasPortafolio.twr}
                xirr={metricasPortafolio.xirr}
                drawdown={metricasPortafolio.drawdown}
              />
              <div className="panel px-5 py-4">
                <MarketBenchmark
                  sp500={benchmarkSp500}
                  uf={benchmarkUf}
                />
              </div>
            </section>
          )}

          <section aria-labelledby="cuentas-titulo" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <div className="flex items-center gap-1">
                <h2 id="cuentas-titulo" tabIndex={-1} className="titulo-seccion scroll-mt-24 outline-none">
                  Cuentas
                </h2>
                <Ayuda etiqueta="Cómo leer el rendimiento de cada cuenta">
                  El % &quot;real&quot; compara los dos últimos registros de la cuenta, en su propia moneda, ya
                  descontando cualquier aporte o retiro. Aparece cuando hay al menos dos registros. La línea pequeña
                  muestra el valor en pesos de los últimos meses (incluye aportes, por eso no va en verde ni rojo).
                </Ayuda>
              </div>
              <div className="no-print flex items-center gap-1">
                {hayCuentas && (
                  <Link
                    href="/cuentas"
                    className="inline-flex min-h-11 items-center rounded-lg px-2 text-small font-semibold text-fg-soft no-underline hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    Ver tabla
                  </Link>
                )}
                <Link
                  href="/cuentas/nueva"
                  className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-small font-semibold text-accent no-underline hover:text-accent-hi focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <Plus size={15} strokeWidth={2.2} aria-hidden="true" />
                  Agregar
                </Link>
              </div>
            </div>
            {cuentasConDatos.length > 0 ? (
              <div className="panel px-4 py-2 sm:px-5">
                <ul className="lista-filas">
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
                      serie={seriePorCuenta.get(cuenta.id)}
                    />
                  ))}
                </ul>
              </div>
            ) : (
              <div className="panel px-5">
                <EmptyAccountsState />
              </div>
            )}
            {(cuentasInactivasCount ?? 0) > 0 && (
              <Link
                href="/cuentas/inactivas"
                className="inline-flex min-h-11 items-center self-start text-micro text-fg-muted underline decoration-white/20 underline-offset-4 hover:text-fg-soft"
              >
                Ver cuentas dadas de baja
              </Link>
            )}
          </section>

          {hayCuentas && <PestanasDistribucion paneles={paneles} />}
        </div>

        <aside className="flex min-w-0 flex-col gap-8 lg:gap-10" aria-label="Registro, metas y actividad">
          {hayCuentas && (
            <div className="no-print hidden xl:flex flex-col gap-3">
              <CargaRapida
                cuentas={cuentas ?? []}
                movimientosHoy={movimientosHoy}
                valorAnteriorPorCuenta={valorAnteriorPorCuenta}
                ultimaFechaPorCuenta={Object.fromEntries(
                  (cuentas ?? []).map((c) => [c.id, capitalPorCuentaMap.get(c.id)?.ultima_fecha ?? null])
                )}
              />
              <details className="group">
                <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg px-1 text-small font-semibold text-accent hover:text-accent-hi [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-accent">
                  <ChevronDown size={15} aria-hidden="true" className="transition-transform duration-200 group-open:rotate-180" />
                  Actualizar varias cuentas a la vez
                </summary>
                <div className="mt-2">
                  <SnapshotForm
                    cuentas={cuentas ?? []}
                    movimientosHoy={movimientosHoy}
                    valorAnteriorPorCuenta={valorAnteriorPorCuenta}
                  />
                </div>
              </details>
            </div>
          )}

          <section aria-labelledby="metas-titulo" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="metas-titulo" className="titulo-seccion">
                Metas
              </h2>
              <Link
                href={metasConProgreso.length > 0 ? "/metas" : "/metas/nueva"}
                className="no-print inline-flex min-h-11 items-center text-small font-semibold text-accent no-underline hover:text-accent-hi focus-visible:outline-2 focus-visible:outline-accent"
              >
                {metasConProgreso.length > 0 ? "Gestionar" : "Crear"}
              </Link>
            </div>
            <div className={metasConProgreso.length > 0 ? "panel px-5 py-2" : ""}>
              <MetasList metas={metasConProgreso} compacta />
            </div>
          </section>

          <ActividadReciente
            grupos={construirActividad({
              movimientos: movimientosTodos ?? [],
              cuentas: cuentasActivas.map((c) => ({ id: c.id, nombre: c.nombre, moneda: c.moneda })),
              hoy,
            })}
          />
        </aside>
      </div>
    </div>
  );
}
