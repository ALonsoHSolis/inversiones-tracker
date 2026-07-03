import { headers } from "next/headers";

// deriva el origin (protocolo + host) de la request actual, nunca un string
// fijo: asi el link de confirmacion de email apunta a donde sea que la app
// este corriendo (localhost en dev, el dominio real en produccion), sin
// depender del Site URL configurado en el dashboard de supabase.
export async function obtenerOrigin() {
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (origin) return origin;

  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
