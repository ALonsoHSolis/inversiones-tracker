import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/Hero";
import { PlatformBreakdown } from "@/components/PlatformBreakdown";
import { AssetTypeBreakdown } from "@/components/AssetTypeBreakdown";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { PortfolioChart } from "@/components/PortfolioChart";
import { MarketBenchmark } from "@/components/MarketBenchmark";
import { Ayuda } from "@/components/Ayuda";
import { AccountRow } from "@/components/AccountRow";
import { CargaRapida } from "@/components/CargaRapida";
import { SnapshotForm } from "@/components/SnapshotForm";
import { ExportarDatos } from "@/components/ExportarDatos";
import { MenuCuenta, ITEM_MENU } from "@/components/MenuCuenta";
import { PrintButton } from "@/components/PrintButton";
import { PrivacyShell, PrivacyToggleButton } from "@/components/PrivacyShell";
import { AccountComparison, type CuentaComparacion } from "@/components/AccountComparison";
import { DataHealthView, type AlertaSalud } from "@/components/DataHealthView";
import { MetasList, type MetaConProgreso } from "@/components/MetasList";
import { CompositionChart, type DatosComposicion, type PuntoComposicion } from "@/components/CompositionChart";
import { TIPOS } from "@/lib/tipos-cuenta";
import type { Cuenta, RendimientoActual, TipoCuenta, TipoMovimiento } from "@/types/database";
import { obtenerCambioSp500, obtenerCambioUf } from "@/lib/mercado";
import {
  calcularMaxDrawdown,
  calcularRacha,
  calcularRendimientoAnualizado,
  calcularRetornosPortafolio,
  calcularTWR,
  calcularXIRR,
  type FlujoCaja,
} from "@/lib/rendimiento";
import { logout } from "../actions";
import { Logo } from "@/components/Logo";
import { FeedbackLink } from "@/components/FeedbackLink";
import { EmptyAccountsState } from "@/components/EmptyAccountsState";
import Link from "next/link";
import { fechaHoyChile } from "@/lib/fecha";
import {
  agruparCapital,
  calcularAlertasSalud,
  calcularMetasConProgreso,
  construirComposicion,
  nombreGrupoPorCuenta,
  porCategoria,
  porPlataforma,
  porTipo,
} from "@/lib/dashboard";

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
    {
      data: { user },
    },
    { data: cuentas },
    { data: rendimientos },
    { data: snapshotsHoy },
    { data: capitalPorCuenta },
    { data: evolucionPortafolio },
    { data: historialRendimientos },
    { data: movimientosTodos },
    { data: metas },
    { data: metaCuentas },
    { data: valorDiarioPorCuenta },
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
    // historial completo de rendimiento_semanal (no solo el ultimo registro
    // como rendimiento_actual) -- alimenta la racha, el twr y el drawdown por
    // cuenta, y los chequeos de la vista de salud de datos. una sola consulta
    // nueva para las tres cosas.
    supabase.from("rendimiento_semanal").select("cuenta_id, fecha, rendimiento_pct").order("fecha"),
    // historial completo de movimientos (no solo los de hoy, que ya se
    // consultan aparte mas abajo) -- alimenta el xirr por cuenta y del
    // portafolio completo (metrica adicional, no reemplaza el rendimiento
    // anualizado que ya se muestra en toda la app).
    supabase.from("movimientos").select("cuenta_id, fecha, tipo, monto, tasa_cambio").order("fecha"),
    // metas de ahorro (fase 3 del roadmap) -- el progreso se calcula aca
    // reusando capital_por_cuenta, ya consultado arriba, no vive en sql.
    supabase.from("metas").select("*").order("created_at"),
    supabase.from("meta_cuentas").select("meta_id, cuenta_id"),
    // valor clp diario por cuenta, ya forward-filled por la vista (fase 3 del
    // roadmap) -- alimenta el grafico de composicion historica, pivotado en
    // el cliente por plataforma o por tipo mas abajo.
    supabase.from("valor_diario_por_cuenta").select("fecha, cuenta_id, valor_clp").order("fecha"),
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

  const composicionPorPlataforma = construirComposicion(
    valorDiarioPorCuenta ?? [],
    nombreGrupoPorCuenta(cuentasActivas, porPlataforma)
  );
  const composicionPorTipo = construirComposicion(
    valorDiarioPorCuenta ?? [],
    nombreGrupoPorCuenta(cuentasActivas, porTipo(etiquetaPorTipo))
  );

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

  // agrupa el historial de rendimiento_semanal por cuenta -- ya viene
  // ordenado por fecha ascendente (ver consulta arriba), asi que sirve tal
  // cual para componer un twr y no necesita reordenarse para eso.
  const historialPorCuenta = new Map<string, { fecha: string; rendimientoPct: number | null }[]>();
  (historialRendimientos ?? []).forEach((r) => {
    if (!r.cuenta_id || !r.fecha) return;
    const lista = historialPorCuenta.get(r.cuenta_id) ?? [];
    lista.push({ fecha: r.fecha, rendimientoPct: r.rendimiento_pct });
    historialPorCuenta.set(r.cuenta_id, lista);
  });

  // agrupa todos los movimientos por cuenta (no solo los de hoy) -- alimenta
  // el xirr por cuenta, en moneda nativa (igual criterio que el % de
  // rendimiento: sin ruido cambiario).
  const movimientosPorCuenta = new Map<
    string,
    { fecha: string; tipo: string; monto: number; tasaCambio: number | null }[]
  >();
  (movimientosTodos ?? []).forEach((m) => {
    if (!m.cuenta_id || !m.fecha) return;
    const lista = movimientosPorCuenta.get(m.cuenta_id) ?? [];
    lista.push({ fecha: m.fecha, tipo: m.tipo, monto: m.monto, tasaCambio: m.tasa_cambio });
    movimientosPorCuenta.set(m.cuenta_id, lista);
  });
  const cuentaPorId = new Map((cuentas ?? []).map((c) => [c.id, c]));

  // reusa hoy (ya calculado arriba, mismo string de fecha que usa la
  // consulta de snapshotsHoy) en vez de un new Date()/Date.now() nuevo --
  // evita repetir el problema de pureza ya documentado en AccountRow.tsx,
  // que llama Date.now() directo dentro del render.
  const hoyMs = new Date(hoy).getTime();

  const comparacionCuentas: CuentaComparacion[] = (cuentas ?? []).map((cuenta) => {
    const datosCapital = capitalPorCuentaMap.get(cuenta.id);
    const historial = historialPorCuenta.get(cuenta.id) ?? [];
    const pctsAsc = historial.map((h) => h.rendimientoPct);

    const capitalAportado = datosCapital?.capital_aportado ?? null;
    const valorActual = datosCapital?.valor_actual ?? null;
    const diasTranscurridos = (hoyMs - new Date(cuenta.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const rendimientoAnualizado =
      capitalAportado != null && valorActual != null
        ? calcularRendimientoAnualizado(capitalAportado, valorActual, diasTranscurridos)
        : null;

    const gananciaClp =
      datosCapital?.valor_actual_clp != null && datosCapital?.capital_aportado_clp != null
        ? datosCapital.valor_actual_clp - datosCapital.capital_aportado_clp
        : null;

    // xirr de la cuenta: cada aporte es un flujo negativo (plata que sale
    // del bolsillo), cada retiro uno positivo, y el valor actual se trata
    // como un flujo positivo final (como si se vendiera todo hoy).
    const flujosCuenta: FlujoCaja[] = (movimientosPorCuenta.get(cuenta.id) ?? []).map((m) => ({
      fecha: m.fecha,
      monto: m.tipo === "aporte" ? -m.monto : m.monto,
    }));
    if (valorActual != null) flujosCuenta.push({ fecha: hoy, monto: valorActual });

    return {
      id: cuenta.id,
      nombre: cuenta.nombre,
      rendimientoAnualizado,
      racha: calcularRacha([...pctsAsc].reverse()),
      twr: calcularTWR(pctsAsc),
      xirr: calcularXIRR(flujosCuenta),
      gananciaClp,
    };
  });
  const gananciaTotalClp = comparacionCuentas.reduce((acc, c) => acc + (c.gananciaClp ?? 0), 0);

  const retornosPortafolio = calcularRetornosPortafolio(
    (evolucionPortafolio ?? [])
      .filter((p) => p.valor_total_clp != null && p.capital_aportado_acumulado_clp != null)
      .map((p) => ({
        valorTotalClp: p.valor_total_clp!,
        capitalAportadoAcumuladoClp: p.capital_aportado_acumulado_clp!,
      }))
  );
  const twrPortafolio = calcularTWR(retornosPortafolio);
  const drawdownPortafolio = calcularMaxDrawdown(retornosPortafolio);

  // xirr del portafolio completo: mismos flujos que arriba, pero convertidos
  // a clp con la tasa historica propia de cada movimiento (igual criterio
  // que capital_por_cuenta) -- solo cuentas activas, mismo filtro que ya
  // aplican capital_por_cuenta/evolucion_portafolio.
  const flujosPortafolio: FlujoCaja[] = (movimientosTodos ?? [])
    .filter((m): m is typeof m & { cuenta_id: string; fecha: string } => !!m.cuenta_id && !!m.fecha && cuentaPorId.has(m.cuenta_id))
    .map((m) => {
      const cuenta = cuentaPorId.get(m.cuenta_id)!;
      const montoClp = cuenta.moneda !== "CLP" ? m.monto * (m.tasa_cambio ?? 1) : m.monto;
      return { fecha: m.fecha, monto: m.tipo === "aporte" ? -montoClp : montoClp };
    });
  flujosPortafolio.push({ fecha: hoy, monto: valorActualClp });
  const xirrPortafolio = calcularXIRR(flujosPortafolio);

  const alertasSalud: AlertaSalud[] = calcularAlertasSalud(cuentas ?? [], capitalPorCuentaMap, historialPorCuenta, hoyMs);


  return (
    <PrivacyShell>
      <main className="max-w-[1160px] mx-auto px-6 pt-[26px] pb-16">
        <header className="flex items-center justify-between gap-4 mb-7 flex-wrap">
          <Logo />
          <div className="flex items-center gap-2 no-print">
            <PrivacyToggleButton />
            <MenuCuenta email={user?.email ?? ""}>
              <ExportarDatos className={ITEM_MENU} />
              <PrintButton className={ITEM_MENU} />
              <Link href="/perfil" role="menuitem" className={ITEM_MENU}>
                Perfil
              </Link>
              <FeedbackLink className={ITEM_MENU}>Escríbenos</FeedbackLink>
              <div className="h-px bg-white/[0.07] my-1.5" />
              <form action={logout}>
                <button type="submit" role="menuitem" className={ITEM_MENU}>
                  Cerrar sesión
                </button>
              </form>
            </MenuCuenta>
          </div>
        </header>

        <Hero
          valorTotal={valorTotal}
          valorTotalAnterior={valorTotalAnterior}
          capitalAportadoClp={capitalAportadoClp}
          valorActualClp={valorActualClp}
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

        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mt-4 items-start">
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

          <div className="no-print lg:sticky lg:top-5 flex flex-col gap-4">
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

        <section className="card p-5 mt-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <PlatformBreakdown plataformas={plataformas} />
          <AssetTypeBreakdown tipos={tipos} />
          <CategoryBreakdown categorias={categorias} />
        </div>


        <details className="group mt-6">
          <summary className="no-print card flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:border-white/[0.16] focus-visible:outline-2 focus-visible:outline-accent">
            <span>
              <span className="block text-small font-semibold text-fg">Análisis avanzado</span>
              <span className="block mt-0.5 text-micro text-fg-muted">
                Composición histórica, comparación de cuentas (TWR, XIRR, drawdown) y salud de los datos
              </span>
            </span>
            <span aria-hidden="true" className="text-fg-muted transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="mt-4 flex flex-col gap-4 print:block">
        <div>
          <CompositionChart porPlataforma={composicionPorPlataforma} porTipo={composicionPorTipo} />
        </div>

            {cuentasConDatos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <AccountComparison
                  cuentas={comparacionCuentas}
                  gananciaTotalClp={gananciaTotalClp}
                  twrPortafolio={twrPortafolio}
                  drawdownPortafolio={drawdownPortafolio}
                  xirrPortafolio={xirrPortafolio}
                />
                <DataHealthView alertas={alertasSalud} />
              </div>
            )}
          </div>
        </details>

        <p className="mt-6 text-micro text-fg-subtle text-center">
          El % real aparece cuando hay al menos dos registros para comparar
        </p>
      </main>
    </PrivacyShell>
  );
}
