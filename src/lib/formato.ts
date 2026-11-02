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

// porcentajes con coma decimal (es-CL), igual que el resto de las cifras:
// antes "+3.3%" convivia con "$17.751.007" y el punto se prestaba a leerse
// como separador de miles. solo presentacion; el redondeo (1 decimal) no cambia.
export function formatoPorcentaje(valor: number, decimales = 1) {
  return `${Math.abs(valor).toLocaleString("es-CL", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })}%`;
}

export function formatoPct(valor: number) {
  return `${valor >= 0 ? "+" : "−"}${formatoPorcentaje(valor)}`;
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

// antes duplicada identica en HistorialForm, CuentaForm, CargaRapida y
// SnapshotForm -- consolidada aca para que un cambio futuro (ej. formato
// distinto) no dependa de acordarse de tocar los 4 archivos.
export function formatoFecha(fechaIso: string) {
  return new Date(fechaIso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

// etiqueta corta para ejes de graficos: "$12,6 M" (millones) o "$850 mil".
// solo presentacion; no participa de ningun calculo.
export function formatoPesosCompacto(valor: number): string {
  const abs = Math.abs(valor);
  const signo = valor < 0 ? "−" : "";
  if (abs >= 1_000_000) {
    return `${signo}$${(abs / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })} M`;
  }
  if (abs >= 1_000) {
    return `${signo}$${Math.round(abs / 1_000).toLocaleString("es-CL")} mil`;
  }
  return `${signo}$${Math.round(abs).toLocaleString("es-CL")}`;
}

// monto en la moneda nativa de la cuenta, sin signo de ganancia.
export function formatoMontoNativo(monto: number, moneda: string): string {
  if (moneda === "USD") {
    return monto.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  }
  if (moneda === "UF") return `${monto.toLocaleString("es-CL", { maximumFractionDigits: 2 })} UF`;
  return monto.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

// normaliza lo que el usuario escribe en un campo de monto al formato crudo
// que espera Number(...) (punto decimal, sin separador de miles). antes el
// campo solo descartaba lo que no fuera digito o punto: "1234,5" (coma
// decimal chilena) se convertia en "12345" -- diez veces el monto -- y
// "1.234.567" (puntos de miles) quedaba como NaN. reglas:
//   - con coma: la coma es el decimal y los puntos son miles ("1.234,56" -> "1234.56")
//   - sin coma y con 2+ puntos: los puntos son miles ("1.234.567" -> "1234567")
//   - un solo punto: se mantiene como decimal, igual que antes ("37.5" -> "37.5")
export function normalizarMontoIngresado(texto: string): string {
  const limpio = texto.replace(/[^\d.,]/g, "");
  if (limpio.includes(",")) {
    const [entero, ...resto] = limpio.replace(/\./g, "").split(",");
    return resto.length > 0 ? `${entero}.${resto.join("")}` : entero;
  }
  const puntos = (limpio.match(/\./g) ?? []).length;
  return puntos >= 2 ? limpio.replace(/\./g, "") : limpio;
}
