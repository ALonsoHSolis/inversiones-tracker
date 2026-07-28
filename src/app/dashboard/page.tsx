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

// paleta ciclica para el grafico de composicion historica -- la cantidad de
// grupos (plataformas o tipos) es dinamica, no fija, asi que no alcanza con
// 2-3 colores nombrados como en otros graficos de esta app.
const PALETA_COMPOSICION = ["#8B5CF6", "#3ED9A3", "#E8A857", "#8FA3BF", "#FF6B6B", "#B9A6F7", "#7EE8C4", "#F0BD7E"];

// pivotea valor_diario_por_cuenta (una fila por fecha+cuenta) agrupando por
// el nombre de grupo que le corresponda a cada cuenta -- reusada para las
// dos dimensiones del grafico (plataforma y tipo), mismo dato crudo para
// ambas, cada una con su propio mapa cuenta -> nombre de grupo.
function construirComposicion(
  filas: { fecha: string | null; cuenta_id: string | null; valor_clp: number | null }[],
  nombrePorCuenta: Map<string, string>
): DatosComposicion {
  const validas = filas.filter(
    (f): f is { fecha: string; cuenta_id: string; valor_clp: number } =>
      f.fecha !== null && f.cuenta_id !== null && f.valor_clp !== null
  );

  const totalPorGrupo = new Map<string, number>();
  validas.forEach((f) => {
    const nombre = nombrePorCuenta.get(f.cuenta_id) ?? "otro";
    totalPorGrupo.set(nombre, (totalPorGrupo.get(nombre) ?? 0) + f.valor_clp);
  });
  const nombresOrdenados = Array.from(totalPorGrupo.keys()).sort(
    (a, b) => (totalPorGrupo.get(b) ?? 0) - (totalPorGrupo.get(a) ?? 0)
  );
  const grupos = nombresOrdenados.map((nombre, i) => ({
    nombre,
    color: PALETA_COMPOSICION[i % PALETA_COMPOSICION.length],
  }));

  const porFecha = new Map<string, PuntoComposicion>();
  validas.forEach((f) => {
    const nombre = nombrePorCuenta.get(f.cuenta_id) ?? "otro";
    const punto = porFecha.get(f.fecha) ?? { fecha: f.fecha };
    punto[nombre] = (Number(punto[nombre]) || 0) + f.valor_clp;
    porFecha.set(f.fecha, punto);
  });

  const puntos = Array.from(porFecha.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  // cada punto necesita un valor explicito por grupo (no undefined) para que
  // el area apilada de recharts no deje huecos en fechas donde ese grupo en
  // particular no tenia datos.
  puntos.forEach((p) => {
    grupos.forEach((g) => {
      if (!(g.nombre in p)) p[g.nombre] = 0;
    });
  });

  return { puntos, grupos };
}

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

  // agrupa por categoria personalizada (fase 3 del roadmap) -- texto libre
  // igual que plataforma, asi que se normaliza la clave igual (trim +
  // minusculas). cuentas sin categoria (el caso mas comun, es un campo
  // opcional) simplemente no entran a este mapa -- CategoryBreakdown ya
  // devuelve null si queda vacio.
  const categoriasMap = new Map<
    string,
    { nombre: string; capitalAportadoClp: number; valorActualClp: number }
  >();
  (cuentas ?? []).forEach((cuenta) => {
    const categoriaCruda = cuenta.categoria?.trim();
    if (!categoriaCruda) return;
    const clave = categoriaCruda.toLowerCase();
    const datos = capitalPorCuentaMap.get(cuenta.id);
    const grupo = categoriasMap.get(clave) ?? {
      nombre: categoriaCruda,
      capitalAportadoClp: 0,
      valorActualClp: 0,
    };
    grupo.capitalAportadoClp += datos?.capital_aportado_clp ?? 0;
    grupo.valorActualClp += datos?.valor_actual_clp ?? 0;
    categoriasMap.set(clave, grupo);
  });
  const categorias = Array.from(categoriasMap.values()).sort((a, b) => b.valorActualClp - a.valorActualClp);

  // composicion historica (fase 3 del roadmap): mismo dato crudo
  // (valor_diario_por_cuenta) agrupado por plataforma o por tipo -- el
  // toggle dentro de CompositionChart decide cual de los dos mostrar, no
  // vuelve a pedir datos. la clave de plataforma se normaliza igual que en
  // plataformasMap (trim + minusculas) para no separar un mismo banco en dos
  // grupos por un despiste de tipeo.
  const nombreCanonicoPorClavePlataforma = new Map<string, string>();
  (cuentas ?? []).forEach((cuenta) => {
    const clave = cuenta.plataforma.trim().toLowerCase();
    if (!nombreCanonicoPorClavePlataforma.has(clave)) {
      nombreCanonicoPorClavePlataforma.set(clave, cuenta.plataforma.trim());
    }
  });
  const nombrePlataformaPorCuenta = new Map(
    (cuentas ?? []).map((c) => [
      c.id,
      nombreCanonicoPorClavePlataforma.get(c.plataforma.trim().toLowerCase()) ?? c.plataforma,
    ])
  );
  const nombreTipoPorCuenta = new Map(
    (cuentas ?? []).map((c) => [c.id, etiquetaPorTipo.get(c.tipo as TipoCuenta) ?? c.tipo])
  );
  const composicionPorPlataforma = construirComposicion(valorDiarioPorCuenta ?? [], nombrePlataformaPorCuenta);
  const composicionPorTipo = construirComposicion(valorDiarioPorCuenta ?? [], nombreTipoPorCuenta);

  // metas de ahorro (fase 3 del roadmap): el progreso de cada meta suma
  // valor_actual_clp (de capital_por_cuenta, ya consultado arriba) de las
  // cuentas asociadas via meta_cuentas -- si una cuenta asociada se da de
  // baja, capital_por_cuenta ya la excluye (where activa = true), asi que su
  // aporte a la meta simplemente deja de contar, mismo criterio que el resto
  // del dashboard aplica a cuentas inactivas.
  const nombrePorCuentaId = new Map((cuentas ?? []).map((c) => [c.id, c.nombre]));
  const cuentaIdsPorMeta = new Map<string, string[]>();
  (metaCuentas ?? []).forEach((mc) => {
    const lista = cuentaIdsPorMeta.get(mc.meta_id) ?? [];
    lista.push(mc.cuenta_id);
    cuentaIdsPorMeta.set(mc.meta_id, lista);
  });
  const metasConProgreso: MetaConProgreso[] = (metas ?? []).map((meta) => {
    const cuentaIds = cuentaIdsPorMeta.get(meta.id) ?? [];
    return {
      id: meta.id,
      nombre: meta.nombre,
      montoObjetivo: meta.monto_objetivo,
      montoActualClp: cuentaIds.reduce(
        (acc, id) => acc + (capitalPorCuentaMap.get(id)?.valor_actual_clp ?? 0),
        0
      ),
      fechaObjetivo: meta.fecha_objetivo,
      cuentasAsociadas: cuentaIds.map((id) => nombrePorCuentaId.get(id)).filter((n): n is string => !!n),
    };
  });

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

  // umbrales propios de la vista de salud (no se comparten con
  // CargaRapida/SnapshotForm/HistorialForm a proposito -- misma convencion ya
  // establecida en el proyecto de no compartir estos umbrales chicos entre
  // archivos distintos).
  const UMBRAL_RENDIMIENTO_IMPLAUSIBLE_SALUD = 80;
  const UMBRAL_GAP_DIAS = 45;
  const UMBRAL_DATO_ANTIGUO_DIAS_SALUD = 14;

  const alertasSalud: AlertaSalud[] = (cuentas ?? []).map((cuenta) => {
    const datosCapital = capitalPorCuentaMap.get(cuenta.id);
    const historial = historialPorCuenta.get(cuenta.id) ?? [];

    const ultimaFecha = datosCapital?.ultima_fecha;
    const diasSinActualizarCrudo = ultimaFecha ? (hoyMs - new Date(ultimaFecha).getTime()) / (1000 * 60 * 60 * 24) : null;
    const diasSinActualizar =
      diasSinActualizarCrudo != null && diasSinActualizarCrudo > UMBRAL_DATO_ANTIGUO_DIAS_SALUD
        ? diasSinActualizarCrudo
        : null;

    const saltos = historial
      .filter((h) => h.rendimientoPct != null && Math.abs(h.rendimientoPct) >= UMBRAL_RENDIMIENTO_IMPLAUSIBLE_SALUD)
      .map((h) => ({ fecha: h.fecha, pct: h.rendimientoPct! }));

    const gaps = historial.slice(1).flatMap((h, i) => {
      const diasGap = (new Date(h.fecha).getTime() - new Date(historial[i].fecha).getTime()) / (1000 * 60 * 60 * 24);
      return diasGap > UMBRAL_GAP_DIAS ? [{ diasGap, fechaFin: h.fecha }] : [];
    });

    return { cuentaId: cuenta.id, nombre: cuenta.nombre, diasSinActualizar, saltos, gaps };
  });

  return (
    <PrivacyShell>
      <main className="max-w-[1160px] mx-auto px-6 pt-[26px] pb-16">
        <header className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <Logo />
          <div className="flex items-center gap-2 flex-wrap justify-end no-print">
            <PrivacyToggleButton />
            <ExportarDatos />
            <PrintButton />
            <div className="w-px h-[22px] bg-white/[0.1] mx-1" />
            <FeedbackLink className="text-[11.5px] text-[#8892A0] border-b border-white/[0.14]">
              escríbenos
            </FeedbackLink>
            <div className="w-px h-[22px] bg-white/[0.1] mx-1" />
            <Link href="/perfil" className="text-[11.5px] text-[#8892A0] border-b border-white/[0.14]">
              perfil
            </Link>
            <div className="w-px h-[22px] bg-white/[0.1] mx-1" />
            <div className="text-right leading-tight">
              <p className="text-[12.5px] font-medium text-[#C7CDD6]">{user?.email}</p>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-[11.5px] text-[#8892A0] border-b border-white/[0.14]"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <PlatformBreakdown plataformas={plataformas} />
          <AssetTypeBreakdown tipos={tipos} />
          <CategoryBreakdown categorias={categorias} />
        </div>

        <div className="mt-4">
          <CompositionChart porPlataforma={composicionPorPlataforma} porTipo={composicionPorTipo} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mt-4 items-start">
          <section className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-5 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[13.5px] font-semibold text-[#F2F5F9]">Tus cuentas</p>
              <Link
                href="/cuentas/nueva"
                className="no-print inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--accent)] no-underline"
              >
                + agregar cuenta
              </Link>
            </div>
            <div className="flex items-center gap-1.5 mb-3.5">
              <p className="text-[11.5px] text-[#8892A0]">
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
                className="inline-block mt-3 text-[11.5px] text-[#8892A0] border-b border-white/[0.14]"
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

        <section className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-5 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)] mt-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[13.5px] font-semibold text-[#F2F5F9]">Tus metas</p>
            <Link
              href="/metas/nueva"
              className="no-print inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--accent)] no-underline"
            >
              + agregar meta
            </Link>
          </div>
          <p className="text-[11.5px] text-[#8892A0] mb-3.5">
            El progreso suma el valor actual (en CLP) de las cuentas que asociaste a cada meta
          </p>
          <MetasList metas={metasConProgreso} />
        </section>

        {cuentasConDatos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-start">
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

        <p className="mt-6 text-[11px] text-[#5B6472] text-center">
          El % real aparece cuando hay al menos dos registros para comparar
        </p>
      </main>
    </PrivacyShell>
  );
}
