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

// referencia mas relevante que el s&p 500 para un inversionista chileno: le
// gano a la inflacion (uf), no solo al mercado de ee.uu. mindicador.cl (la
// misma api que ya usa src/lib/mindicador.ts para las cuentas uf) devuelve
// varias semanas de historial en un solo llamado -- a diferencia del ipsa,
// que solo trae el valor actual (ver comentario arriba). "best effort" igual
// que obtenerCambioSp500: cualquier fallo devuelve null, nunca rompe el
// dashboard.
export async function obtenerCambioUf(): Promise<CambioIndice | null> {
  try {
    const res = await fetch("https://mindicador.cl/api/uf");
    if (!res.ok) return null;

    const data = await res.json();
    const serie: { fecha: string; valor: number }[] = data?.serie ?? [];
    if (serie.length < 5) return null;

    const ultimo = serie[0];
    const anterior = serie[4]; // serie viene de mas reciente a mas antigua
    if (typeof ultimo?.valor !== "number" || typeof anterior?.valor !== "number" || anterior.valor === 0) {
      return null;
    }

    return {
      pct: ((ultimo.valor - anterior.valor) / anterior.valor) * 100,
      fechaInicio: anterior.fecha.slice(0, 10),
      fechaFin: ultimo.fecha.slice(0, 10),
    };
  } catch {
    return null;
  }
}
