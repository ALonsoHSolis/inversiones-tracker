export interface CambioIndice {
  pct: number;
  fechaInicio: string;
  fechaFin: string;
}

// fetch server-side: el endpoint de yahoo no manda Access-Control-Allow-Origin,
// asi que un fetch directo desde el navegador (como hace mindicador.ts con
// mindicador.cl) fallaria por CORS. "best effort": cualquier fallo devuelve
// null en vez de lanzar, para que un problema de este servicio externo
// opcional nunca rompa la carga del dashboard.
//
// se usa el S&P 500 (^GSPC) y no el IPSA: el mismo endpoint de yahoo solo
// devuelve el valor actual del IPSA, nunca historial (verificado con varios
// rangos y fechas explicitas), mientras que ^GSPC si sirve historial completo.
export async function obtenerCambioSp500(): Promise<CambioIndice | null> {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=5d&interval=1d",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const closes: number[] = result?.indicators?.quote?.[0]?.close ?? [];
    if (timestamps.length < 2 || closes.length < 2) return null;

    const primero = closes[0];
    const ultimo = closes[closes.length - 1];
    if (typeof primero !== "number" || typeof ultimo !== "number" || primero === 0) return null;

    return {
      pct: ((ultimo - primero) / primero) * 100,
      fechaInicio: new Date(timestamps[0] * 1000).toISOString().slice(0, 10),
      fechaFin: new Date(timestamps[timestamps.length - 1] * 1000).toISOString().slice(0, 10),
    };
  } catch {
    return null;
  }
}
