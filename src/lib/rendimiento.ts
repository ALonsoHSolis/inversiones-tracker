import type { TipoMovimiento } from "@/types/database";

export interface MovimientoSimple {
  tipo: TipoMovimiento;
  monto: number;
}

export interface ResultadoRendimiento {
  gananciaReal: number;
  aportesNetos: number;
  rendimientoPct: number | null;
}

// espejo en typescript de la logica de la vista rendimiento_semanal en schema.sql.
// util para calculos en el cliente (ej. previsualizar antes de guardar un snapshot).
// la fuente de verdad para el dashboard es la vista sql, no esta funcion.
export function calcularRendimiento(
  valorInicial: number,
  valorFinal: number,
  movimientos: MovimientoSimple[]
): ResultadoRendimiento {
  const aportesNetos = movimientos.reduce((acc, m) => {
    return acc + (m.tipo === "aporte" ? m.monto : -m.monto);
  }, 0);

  const gananciaReal = valorFinal - valorInicial - aportesNetos;
  const base = valorInicial + aportesNetos;
  const rendimientoPct = base > 0 ? (gananciaReal / base) * 100 : null;

  return { gananciaReal, aportesNetos, rendimientoPct };
}
