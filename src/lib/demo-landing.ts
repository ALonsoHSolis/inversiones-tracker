// datos de EJEMPLO para mostrar la interfaz real en la landing publica. no son
// datos de ningun usuario ni cifras del negocio; la landing los rotula como
// ejemplo. series deterministas (sin Math.random) para que el html del
// servidor y el del cliente coincidan.
import type { PuntoPatrimonio } from "./grafico-patrimonio.ts";

export function serieEjemplo(): PuntoPatrimonio[] {
  const puntos: PuntoPatrimonio[] = [];
  const inicio = Date.UTC(2026, 0, 5);
  let capital = 6_000_000;
  let valor = 6_000_000;
  for (let semana = 0; semana < 44; semana++) {
    // aportes en semanas concretas: el capital sube en escalones
    if (semana === 9 || semana === 22 || semana === 35) {
      capital += 1_500_000;
      valor += 1_500_000;
    }
    // rendimiento de mercado: deriva suave con vaivenes deterministas
    valor = valor * (1 + 0.0024 + Math.sin(semana * 1.3) * 0.006);
    puntos.push({
      fecha: new Date(inicio + semana * 7 * 86_400_000).toISOString().slice(0, 10),
      totalClp: Math.round(valor),
      capitalClp: capital,
    });
  }
  return puntos;
}
