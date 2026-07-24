import type { NextConfig } from "next";

// CSP sin nonce por request: un nonce forzaria headers() en cada render,
// lo que a su vez obliga a next a tratar toda la app como dinamica --
// incluida la landing y las paginas legales, que hoy se sirven estaticas
// desde el edge (ver "npm run build": "/" es "○ Static"). Se prefiere
// mantener esas paginas estaticas y aceptar 'unsafe-inline' en script/style
// -- el resto de las directivas (frame-ancestors, object-src, base-uri,
// connect-src acotado) ya cubren clickjacking, plugins legacy y exfiltracion
// de datos hacia origenes no autorizados, que son los riesgos reales de esta
// app (no hay dangerouslySetInnerHTML ni SQL dinamico en el codebase).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // supabase (auth + rpc desde el navegador) y mindicador.cl (tasa de
  // cambio, tambien llamado desde el navegador en CuentaForm/SnapshotForm)
  "connect-src 'self' https://*.supabase.co https://mindicador.cl",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
