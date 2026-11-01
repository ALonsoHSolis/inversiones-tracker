// calculo del informe mensual ("estado de cuenta"). funciones puras, sin
// supabase ni react, para poder probarlas con `npm test`.
//
// regla de negocio 1 (CLAUDE.md): un aporte nunca es ganancia. la ganancia
// del mes es el cambio de valor MENOS los aportes netos del mismo periodo --
// el mismo calculo de rendimiento_semanal y del correo mensual
// (api/cron/reporte-mensual). sale de evolucion_portafolio, que ya viene en
// clp con la tasa historica de cada snapshot/aporte (regla 4): no se recalcula
// ninguna conversion en el cliente.

export interface PuntoEvolucion {
  fecha: string; // YYYY-MM-DD
  valorTotalClp: number;
  capitalAportadoAcumuladoClp: number;
}

export interface InformeMensual {
  mes: string; // YYYY-MM
  primerDia: string;
  ultimoDia: string;
  valorInicioClp: number;
  valorFinClp: number;
  aportesNetosClp: number; // aportes positivos, retiros negativos
  gananciaMesClp: number;
  gananciaMesPct: number | null;
  capitalAcumuladoClp: number;
  gananciaAcumuladaClp: number;
  gananciaAcumuladaPct: number | null;
}

const MES_VALIDO = /^\d{4}-(0[1-9]|1[0-2])$/;

export function esMesValido(mes: string | undefined): mes is string {
  return !!mes && MES_VALIDO.test(mes);
}

function ultimoDiaDelMes(mes: string): string {
  const [anio, m] = mes.split("-").map(Number);
  const dia = new Date(Date.UTC(anio, m, 0)).getUTCDate(); // dia 0 del mes siguiente
  return `${mes}-${String(dia).padStart(2, "0")}`;
}

// meses (YYYY-MM) en los que hay datos, del mas reciente al mas antiguo.
export function mesesDisponibles(puntos: PuntoEvolucion[]): string[] {
  const meses = new Set(puntos.map((p) => p.fecha.slice(0, 7)));
  return Array.from(meses).sort().reverse();
}

// `puntos` puede venir en cualquier orden. devuelve null si no hay ningun
// dato dentro del mes pedido (no se inventa un informe vacio).
export function calcularInformeMensual(puntos: PuntoEvolucion[], mes: string): InformeMensual | null {
  if (!esMesValido(mes)) return null;
  const primerDia = `${mes}-01`;
  const ultimoDia = ultimoDiaDelMes(mes);
  const ordenados = [...puntos].sort((a, b) => a.fecha.localeCompare(b.fecha));

  const dentro = ordenados.filter((p) => p.fecha >= primerDia && p.fecha <= ultimoDia);
  if (dentro.length === 0) return null;
  const fin = dentro[dentro.length - 1];
  const antes = ordenados.filter((p) => p.fecha < primerDia);
  // sin dato anterior (cuenta creada dentro del mes): parte en 0, y su aporte
  // inicial queda contado como aporte del mes -- no como ganancia.
  const inicio = antes.length > 0 ? antes[antes.length - 1] : null;

  const valorInicioClp = inicio?.valorTotalClp ?? 0;
  const capitalInicioClp = inicio?.capitalAportadoAcumuladoClp ?? 0;
  const aportesNetosClp = fin.capitalAportadoAcumuladoClp - capitalInicioClp;
  const gananciaMesClp = fin.valorTotalClp - valorInicioClp - aportesNetosClp;
  const baseMes = valorInicioClp + aportesNetosClp;
  const gananciaAcumuladaClp = fin.valorTotalClp - fin.capitalAportadoAcumuladoClp;

  return {
    mes,
    primerDia,
    ultimoDia,
    valorInicioClp,
    valorFinClp: fin.valorTotalClp,
    aportesNetosClp,
    gananciaMesClp,
    gananciaMesPct: baseMes > 0 ? (gananciaMesClp / baseMes) * 100 : null,
    capitalAcumuladoClp: fin.capitalAportadoAcumuladoClp,
    gananciaAcumuladaClp,
    gananciaAcumuladaPct:
      fin.capitalAportadoAcumuladoClp > 0 ? (gananciaAcumuladaClp / fin.capitalAportadoAcumuladoClp) * 100 : null,
  };
}
