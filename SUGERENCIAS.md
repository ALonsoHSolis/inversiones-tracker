# Sugerencias — cambios NO aplicados en la sesión autónoma

Cosas que requieren una decisión del usuario, una dependencia con costo, o un cambio riesgoso/no verificable en este entorno (sin credenciales reales de Supabase). Formato: qué, por qué, opciones.

## `next/image` en vez de `<img>` (Logo.tsx)

**Qué:** el menú de esta sesión sugiere usar `next/image` para mejorar performance percibida (LCP). `Logo.tsx` usa `<img>` plano y `npm run lint` lo marca con un warning (`@next/next/no-img-element`).

**Por qué NO se aplicó:** es una decisión ya tomada deliberadamente en una sesión anterior de seguridad. `next/image` activa la API de Image Optimization de Next.js, que depende de `sharp` — y `sharp` tiene una vulnerabilidad conocida sin parche disponible (CVEs de libvips, ver `npm audit`). Mientras el proyecto no use `next/image` en ningún lado, esa vulnerabilidad es código muerto/inalcanzable. Activarla ahora solo por el logo reintroduce esa superficie de ataque para una ganancia de performance mínima (es un logo pequeño, no una imagen grande above-the-fold).

**Opciones:**
1. Dejarlo como está (recomendado) — el warning de lint es cosmético, no bloquea el build.
2. Si se decide usar `next/image` de todas formas, primero conviene resolver/monitorear el estado de la vulnerabilidad de `sharp` (revisar si ya salió parche en `npm audit`).
