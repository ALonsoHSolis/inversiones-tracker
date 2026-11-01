// marcas del eje X de los graficos de evolucion. antes cada punto semanal
// generaba su propia etiqueta de mes y se repetian ("may may jun jun jun...").
// funcion pura, sin dependencias, para poder probarla con `npm test`.

export interface EjeX {
  ticks: string[]; // fechas (YYYY-MM-DD) donde va una etiqueta
  porDia: boolean; // true: etiqueta "dd/mm" (rango corto); false: nombre del mes
}

const MS_DIA = 24 * 60 * 60 * 1000;

export function calcularEjeX(fechas: string[], maxEtiquetas = 8): EjeX {
  if (fechas.length === 0) return { ticks: [], porDia: false };
  const ordenadas = [...fechas].sort();
  const dias = (new Date(ordenadas[ordenadas.length - 1]).getTime() - new Date(ordenadas[0]).getTime()) / MS_DIA;

  // rango corto (1M, cuentas nuevas): etiquetas de dia repartidas parejo
  if (dias <= 75) {
    const n = Math.min(maxEtiquetas, ordenadas.length);
    const ticks = Array.from({ length: n }, (_, i) =>
      ordenadas[n === 1 ? 0 : Math.round((i * (ordenadas.length - 1)) / (n - 1))]
    );
    return { ticks: Array.from(new Set(ticks)), porDia: true };
  }

  // rango largo: una etiqueta por mes (la primera fecha de cada mes)
  const primeraDelMes = new Map<string, string>();
  ordenadas.forEach((f) => {
    const mes = f.slice(0, 7);
    if (!primeraDelMes.has(mes)) primeraDelMes.set(mes, f);
  });
  let ticks = Array.from(primeraDelMes.values());
  if (ticks.length > maxEtiquetas) {
    const paso = Math.ceil(ticks.length / maxEtiquetas);
    ticks = ticks.filter((_, i) => i % paso === 0);
  }
  return { ticks, porDia: false };
}
