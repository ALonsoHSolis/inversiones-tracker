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
