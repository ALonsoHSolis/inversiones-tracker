// formato compartido de pesos chilenos -- antes duplicado identico en
// PortfolioSummary, CapitalSummary, PlatformBreakdown, AssetTypeBreakdown y
// PortfolioChart; consolidado aca de paso al retocar todos esos archivos
// para el rediseño.
export function formatoPesos(valor: number) {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

export function formatoPesosSigned(valor: number) {
  const texto = formatoPesos(Math.abs(valor));
  return valor >= 0 ? `+${texto}` : `−${texto}`;
}

export function formatoPct(valor: number) {
  return `${valor >= 0 ? "+" : "−"}${Math.abs(valor).toFixed(1)}%`;
}

// usado por InputMonto (src/components/InputMonto.tsx) para mostrar un monto
// con separador de miles cuando el campo no esta enfocado -- el valor crudo
// que guarda el estado (lo que espera Number(...) y el rpc) nunca cambia,
// solo la representacion visual. maximumFractionDigits: 2 porque snapshots y
// movimientos son numeric(14,2) en la base -- una cuenta en uf puede tener
// decimales, y esto evita ruido de punto flotante al mostrarlos.
export function formatoMiles(valorCrudo: string): string {
  if (valorCrudo === "") return "";
  const numero = Number(valorCrudo);
  if (Number.isNaN(numero)) return valorCrudo;
  return numero.toLocaleString("es-CL", { maximumFractionDigits: 2 });
}
