import type { MetadataRoute } from "next";

const BASE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/perfil", "/cuentas", "/api", "/auth", "/actualizar-password", "/recuperar-password"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
