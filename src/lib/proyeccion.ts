// simulador de proyeccion a futuro -- a diferencia de rendimiento.ts (que
// calcula ganancia REAL a partir de datos que ya ocurrieron), esto es
// matematica puramente hipotetica: "si aporto X hoy y agrego Y cada mes a
// una tasa esperada Z%, cuanto tendria en N años". vive en un archivo
// separado a proposito, para no mezclar el calculo de ganancia real (la
// regla central del proyecto) con una proyeccion especulativa a futuro.

export interface EscenarioProyeccion {
  tasaAnual: number;
  valorFinal: number;
  totalAportado: number;
  gananciaProyectada: number;
}

export interface ResultadoProyeccion {
  conservador: EscenarioProyeccion;
  base: EscenarioProyeccion;
  optimista: EscenarioProyeccion;
}

// puntos porcentuales de diferencia entre escenarios, alrededor de la tasa
// base que ingresa el usuario -- simple y transparente (se muestra la tasa
// exacta de cada escenario en la ui) en vez de inventar una formula de
// "volatilidad esperada" por tipo de activo, que seria mas precisa pero
// tambien mas dificil de justificar sin datos reales de mercado.
const OFFSET_ESCENARIO_PCT = 3;

function proyectarEscenario(
  montoInicial: number,
  aportePeriodicoMensual: number,
  meses: number,
  tasaAnualPct: number
): EscenarioProyeccion {
  const tasaMensual = tasaAnualPct / 100 / 12;
  const totalAportado = montoInicial + aportePeriodicoMensual * meses;

  // tasa ~0: la formula de anualidad divide por tasaMensual, indefinido en
  // el limite -- con tasa cero el valor final es simplemente la suma de lo
  // aportado, sin necesidad de la formula compuesta.
  if (Math.abs(tasaMensual) < 1e-9) {
    return { tasaAnual: tasaAnualPct, valorFinal: totalAportado, totalAportado, gananciaProyectada: 0 };
  }

  const factor = Math.pow(1 + tasaMensual, meses);
  const valorFinal = montoInicial * factor + aportePeriodicoMensual * ((factor - 1) / tasaMensual);

  return { tasaAnual: tasaAnualPct, valorFinal, totalAportado, gananciaProyectada: valorFinal - totalAportado };
}

// proyecta 3 escenarios (conservador/base/optimista) a partir de una tasa
// anual esperada unica que ingresa el usuario. el aporte periodico se asume
// mensual y constante durante todo el horizonte -- simplificacion deliberada,
// no ajusta aportes crecientes ni pausas.
export function calcularProyeccion(
  montoInicial: number,
  aportePeriodicoMensual: number,
  horizonteAnios: number,
  tasaAnualBasePct: number
): ResultadoProyeccion {
  const meses = Math.max(0, Math.round(horizonteAnios * 12));
  return {
    conservador: proyectarEscenario(montoInicial, aportePeriodicoMensual, meses, tasaAnualBasePct - OFFSET_ESCENARIO_PCT),
    base: proyectarEscenario(montoInicial, aportePeriodicoMensual, meses, tasaAnualBasePct),
    optimista: proyectarEscenario(montoInicial, aportePeriodicoMensual, meses, tasaAnualBasePct + OFFSET_ESCENARIO_PCT),
  };
}
