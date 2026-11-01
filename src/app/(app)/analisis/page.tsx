import { createClient } from "@/lib/supabase/server";
import { AccountComparison, type CuentaComparacion } from "@/components/AccountComparison";
import { DataHealthView, type AlertaSalud } from "@/components/DataHealthView";
import { CompositionChart } from "@/components/CompositionChart";
import { TIPOS } from "@/lib/tipos-cuenta";
import {
  calcularMaxDrawdown,
  calcularRacha,
  calcularRendimientoAnualizado,
  calcularRetornosPortafolio,
  calcularTWR,
  calcularXIRR,
  type FlujoCaja,
} from "@/lib/rendimiento";
import { fechaHoyChile } from "@/lib/fecha";
import {
  calcularAlertasSalud,
  construirComposicion,
  nombreGrupoPorCuenta,
  porPlataforma,
  porTipo,
} from "@/lib/dashboard";

// la logica de abajo se movio tal cual desde dashboard/page.tsx: mismas
// consultas, mismas formulas (twr, xirr, drawdown, salud de datos). solo
// cambio de lugar -- el dashboard ya no carga el analisis avanzado.
export default async function AnalisisPage() {
  const supabase = await createClient();
  const hoy = fechaHoyChile();

  const [
    { data: cuentas },
    { data: capitalPorCuenta },
    { data: evolucionPortafolio },
    { data: historialRendimientos },
    { data: movimientosTodos },
    { data: valorDiarioPorCuenta },
  ] = await Promise.all([
    supabase.from("cuentas").select("*").eq("activa", true).order("created_at"),
    supabase.from("capital_por_cuenta").select("*"),
    supabase.from("evolucion_portafolio").select("*").order("fecha"),
    supabase.from("rendimiento_semanal").select("cuenta_id, fecha, rendimiento_pct").order("fecha"),
    supabase.from("movimientos").select("cuenta_id, fecha, tipo, monto, tasa_cambio").order("fecha"),
    supabase.from("valor_diario_por_cuenta").select("fecha, cuenta_id, valor_clp").order("fecha"),
  ]);

  const capitalPorCuentaMap = new Map(
    (capitalPorCuenta ?? [])
      .filter((c): c is typeof c & { cuenta_id: string } => c.cuenta_id !== null)
      .map((c) => [c.cuenta_id, c])
  );
  const valorActualClp = (capitalPorCuenta ?? []).reduce((acc, c) => acc + (c.valor_actual_clp ?? 0), 0);
  const etiquetaPorTipo = new Map<string, string>(TIPOS.map((t) => [t.value, t.label]));
  const cuentasActivas = cuentas ?? [];

  const composicionPorPlataforma = construirComposicion(
    valorDiarioPorCuenta ?? [],
    nombreGrupoPorCuenta(cuentasActivas, porPlataforma)
  );
  const composicionPorTipo = construirComposicion(
    valorDiarioPorCuenta ?? [],
    nombreGrupoPorCuenta(cuentasActivas, porTipo(etiquetaPorTipo))
  );


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
    <div className="mx-auto w-full max-w-[1160px]">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">Análisis</h1>
      <p className="mt-1 text-small text-fg-muted max-w-[640px]">
        Composición histórica, comparación entre cuentas y calidad de tus datos. Cada métrica usa una metodología
        distinta; la ayuda de cada bloque explica cuál.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <CompositionChart porPlataforma={composicionPorPlataforma} porTipo={composicionPorTipo} />
        {cuentasActivas.length > 0 && (
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
    </div>
  );
}
