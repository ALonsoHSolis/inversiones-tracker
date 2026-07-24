// si una celda empieza con uno de estos caracteres, excel/sheets puede
// interpretarla como formula al abrir el archivo ("csv injection") -- nombre
// y plataforma son texto libre del usuario, asi que se neutraliza anteponiendo
// un apostrofe, que fuerza a tratar la celda como texto literal.
const CARACTERES_FORMULA = ["=", "+", "-", "@", "\t", "\r"];

function neutralizarFormula(valor: string): string {
  return valor.length > 0 && CARACTERES_FORMULA.includes(valor[0]) ? `'${valor}` : valor;
}

// escapa una celda para csv: si contiene coma, comilla o salto de linea, se
// envuelve en comillas dobles y las comillas internas se duplican (regla
// estandar de csv, no una convencion propia).
function escaparCelda(valor: string): string {
  const neutralizado = neutralizarFormula(valor);
  if (/["\r\n,]/.test(neutralizado)) {
    return `"${neutralizado.replace(/"/g, '""')}"`;
  }
  return neutralizado;
}

export function filasACsv(encabezado: string[], filas: string[][]): string {
  const lineas = [encabezado, ...filas].map((fila) => fila.map(escaparCelda).join(","));
  return lineas.join("\r\n");
}

export function descargarCsv(contenido: string, nombreArchivo: string) {
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
