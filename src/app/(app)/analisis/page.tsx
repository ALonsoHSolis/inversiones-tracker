import { createClient } from "@/lib/supabase/server";
import { AccountComparison, type CuentaComparacion } from "@/components/AccountComparison";
import { DataHealthView, type AlertaSalud } from "@/components/DataHealthView";
import { CompositionChart } from "@/components/CompositionChart";
import { TIPOS } from "@/lib/tipos-cuenta";
import {
  calcularRacha,
  calcularRendimientoAnualizado,
  calcularTWR,
  calcularXIRR,
  type FlujoCaja,
} from "@/lib/rendimiento";
import { calcularMetricasPortafolio } from "@/lib/metricas-portafolio";
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

  // twr, drawdown y xirr del portafolio: mismas formulas de siempre, ahora en
  // src/lib/metricas-portafolio.ts (compartidas con el dashboard).
  const {
    twr: twrPortafolio,
    drawdown: drawdownPortafolio,
    xirr: xirrPortafolio,
  } = calcularMetricasPortafolio({
    evolucion: evolucionPortafolio ?? [],
    movimientos: movimientosTodos ?? [],
    cuentas: cuentas ?? [],
    valorActualClp,
    hoy,
  });

  const alertasSalud: AlertaSalud[] = calcularAlertasSalud(cuentas ?? [], capitalPorCuentaMap, historialPorCuenta, hoyMs);

  const secciones = [
    { id: "composicion", etiqueta: "Composición" },
    ...(cuentasActivas.length > 0
      ? [
          { id: "comparacion", etiqueta: "Comparación de cuentas" },
          { id: "salud", etiqueta: "Salud de los datos" },
        ]
      : []),
    { id: "metodologia", etiqueta: "Cómo leer las métricas" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1160px]">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-fg">Análisis</h1>
      <p className="mt-1 text-small text-fg-muted max-w-[640px]">
        Composición histórica, comparación entre cuentas y calidad de tus datos. Cada métrica usa una metodología
        distinta; la ayuda de cada bloque explica cuál.
      </p>

      <nav
        aria-label="Secciones del análisis"
        className="no-print sticky top-14 lg:top-16 z-10 -mx-4 sm:-mx-6 lg:-mx-8 mt-5 border-b border-[var(--color-edge)] bg-ink/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md"
      >
        <ul className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
          {secciones.map((sec) => (
            <li key={sec.id} className="shrink-0">
              <a
                href={`#${sec.id}`}
                className="inline-flex h-10 items-center rounded-full px-3.5 text-small font-medium text-fg-muted no-underline transition-colors duration-150 hover:bg-white/[0.06] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                {sec.etiqueta}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 flex flex-col gap-6">
        <div id="composicion" className="scroll-mt-32">
          <CompositionChart porPlataforma={composicionPorPlataforma} porTipo={composicionPorTipo} />
        </div>
        {cuentasActivas.length > 0 && (
          <div id="comparacion" className="scroll-mt-32">
            <AccountComparison
              cuentas={comparacionCuentas}
              gananciaTotalClp={gananciaTotalClp}
              twrPortafolio={twrPortafolio}
              drawdownPortafolio={drawdownPortafolio}
              xirrPortafolio={xirrPortafolio}
            />
          </div>
        )}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {cuentasActivas.length > 0 && (
          <div id="salud" className="scroll-mt-32">
            <DataHealthView alertas={alertasSalud} />
          </div>
        )}

        <section id="metodologia" aria-labelledby="metodologia-titulo" className="card scroll-mt-32 p-5">
          <h2 id="metodologia-titulo" className="titulo-bloque">
            Cómo leer las métricas
          </h2>
          <p className="mt-1 text-micro text-fg-muted">
            Ninguna reemplaza a otra: cada una responde una pregunta distinta.
          </p>
          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {[
              ["Rendimiento real", "Cambio de valor de una cuenta menos los aportes y retiros del período. Un depósito nunca cuenta como ganancia. Se muestra en la moneda de cada cuenta."],
              ["Ganancia real total", "Valor actual menos capital aportado, todo en pesos con la tasa de cada registro. Incluye el efecto del tipo de cambio en tus cuentas en USD o UF."],
              ["TWR", "Encadena el rendimiento de cada período del portafolio, sin importar cuánto aportaste o retiraste. Mide qué tan bien rindió la inversión. Es un acumulado, no anual."],
              ["XIRR", "Tasa anual que respeta la fecha exacta de cada aporte y retiro. Mide cuánto rindió tu dinero según cuándo lo pusiste. Con poca historia puede ser extrema."],
              ["Anualizado", "Aproximación simple: lleva la ganancia acumulada a una tasa por año. No ajusta por el momento de cada aporte (eso lo hace el XIRR)."],
              ["Peor caída", "La mayor baja desde un máximo hasta el mínimo posterior, medida sobre la serie del TWR. Solo ve lo que capturaron tus registros."],
            ].map(([termino, definicion]) => (
              <div key={termino}>
                <dt className="text-small font-semibold text-fg-soft">{termino}</dt>
                <dd className="mt-1 text-micro leading-relaxed text-fg-muted">{definicion}</dd>
              </div>
            ))}
          </dl>
        </section>
        </div>
      </div>
    </div>
  );
}
