// metricas de portafolio completo (twr, drawdown, xirr), extraidas tal cual de
// src/app/(app)/analisis/page.tsx para compartirlas con el dashboard. NO se
// cambio ninguna formula: son las mismas llamadas a calcularRetornosPortafolio,
// calcularTWR, calcularMaxDrawdown y calcularXIRR (src/lib/rendimiento.ts) con
// el mismo armado de flujos. funciones puras: sin supabase ni react.
import {
  calcularMaxDrawdown,
  calcularRetornosPortafolio,
  calcularTWR,
  calcularXIRR,
  type FlujoCaja,
} from "./rendimiento.ts";

export interface PuntoEvolucionFila {
  valor_total_clp: number | null;
  capital_aportado_acumulado_clp: number | null;
}

export interface MovimientoFila {
  cuenta_id: string | null;
  fecha: string | null;
  tipo: string;
  monto: number;
  tasa_cambio: number | null;
}

export interface MetricasPortafolio {
  twr: number | null;
  drawdown: number | null;
  xirr: number | null;
}

export function calcularMetricasPortafolio(params: {
  evolucion: PuntoEvolucionFila[];
  movimientos: MovimientoFila[];
  // solo cuentas activas: mismo filtro que capital_por_cuenta/evolucion_portafolio
  cuentas: { id: string; moneda: string }[];
  valorActualClp: number;
  hoy: string; // yyyy-mm-dd
}): MetricasPortafolio {
  const { evolucion, movimientos, cuentas, valorActualClp, hoy } = params;

  const retornosPortafolio = calcularRetornosPortafolio(
    evolucion
      .filter((p) => p.valor_total_clp != null && p.capital_aportado_acumulado_clp != null)
      .map((p) => ({
        valorTotalClp: p.valor_total_clp!,
        capitalAportadoAcumuladoClp: p.capital_aportado_acumulado_clp!,
      }))
  );
  const twr = calcularTWR(retornosPortafolio);
  const drawdown = calcularMaxDrawdown(retornosPortafolio);

  // xirr del portafolio completo: flujos convertidos a clp con la tasa
  // historica propia de cada movimiento (igual criterio que capital_por_cuenta).
  const cuentaPorId = new Map(cuentas.map((c) => [c.id, c]));
  const flujosPortafolio: FlujoCaja[] = movimientos
    .filter(
      (m): m is MovimientoFila & { cuenta_id: string; fecha: string } =>
        !!m.cuenta_id && !!m.fecha && cuentaPorId.has(m.cuenta_id)
    )
    .map((m) => {
      const cuenta = cuentaPorId.get(m.cuenta_id)!;
      const montoClp = cuenta.moneda !== "CLP" ? m.monto * (m.tasa_cambio ?? 1) : m.monto;
      return { fecha: m.fecha, monto: m.tipo === "aporte" ? -montoClp : montoClp };
    });
  flujosPortafolio.push({ fecha: hoy, monto: valorActualClp });
  const xirr = calcularXIRR(flujosPortafolio);

  return { twr, drawdown, xirr };
}
