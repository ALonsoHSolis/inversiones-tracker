import { headers } from "next/headers";

// deriva el origin (protocolo + host) de la request actual, nunca un string
// fijo: asi el link de confirmacion de email apunta a donde sea que la app
// este corriendo (localhost en dev, el dominio real en produccion), sin
// depender del Site URL configurado en el dashboard de supabase.
export async function obtenerOrigin() {
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (origin) return origin;

  // en produccion, preferir el dominio fijo que vercel expone via variable de
  // entorno (no depende de nada que venga en la request) antes que
  // x-forwarded-host/host: esos headers en teoria los puede fijar quien
  // origina el request, y este valor termina en el link de confirmacion que
  // se manda por correo. si VERCEL_PROJECT_PRODUCTION_URL no esta seteada
  // (dev local), se cae al header como antes.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
