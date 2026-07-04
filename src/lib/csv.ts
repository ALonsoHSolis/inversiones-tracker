// escapa una celda para csv: si contiene coma, comilla o salto de linea, se
// envuelve en comillas dobles y las comillas internas se duplican (regla
// estandar de csv, no una convencion propia).
function escaparCelda(valor: string): string {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
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
