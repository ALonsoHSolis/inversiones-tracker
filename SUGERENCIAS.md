# Sugerencias — cambios NO aplicados en la sesión autónoma

Cosas que requieren una decisión del usuario, una dependencia con costo, o un cambio riesgoso/no verificable en este entorno (sin credenciales reales de Supabase). Formato: qué, por qué, opciones.

## `next/image` en vez de `<img>` (Logo.tsx)

**Qué:** el menú de esta sesión sugiere usar `next/image` para mejorar performance percibida (LCP). `Logo.tsx` usa `<img>` plano y `npm run lint` lo marca con un warning (`@next/next/no-img-element`).

**Por qué NO se aplicó:** es una decisión ya tomada deliberadamente en una sesión anterior de seguridad. `next/image` activa la API de Image Optimization de Next.js, que depende de `sharp` — y `sharp` tiene una vulnerabilidad conocida sin parche disponible (CVEs de libvips, ver `npm audit`). Mientras el proyecto no use `next/image` en ningún lado, esa vulnerabilidad es código muerto/inalcanzable. Activarla ahora solo por el logo reintroduce esa superficie de ataque para una ganancia de performance mínima (es un logo pequeño, no una imagen grande above-the-fold).

**Opciones:**
1. Dejarlo como está (recomendado) — el warning de lint es cosmético, no bloquea el build.
2. Si se decide usar `next/image` de todas formas, primero conviene resolver/monitorear el estado de la vulnerabilidad de `sharp` (revisar si ya salió parche en `npm audit`).

## Contraste insuficiente del gris secundario `#8A929E`

**Qué:** este color se usa extensivamente en todo el sitio para texto secundario (fechas, subtítulos, texto de ayuda, placeholders de estado) — decenas de ocurrencias en prácticamente todos los componentes.

**Por qué NO se aplicó directamente:** calculé el contraste real contra fondo blanco (fórmula WCAG): `#8A929E` sobre `#FFFFFF` da un ratio de **~3.3:1**. WCAG AA exige **4.5:1** para texto normal (solo pasa para texto grande, ≥18pt o ≥14pt bold). Es decir, texto pequeño en ese color (la mayoría de sus usos son 11-13px) no cumple el estándar de accesibilidad para personas con baja visión.

Como comparación, `#6B7280` (ya usado en el sitio para labels) da **~4.93:1** — sí cumple.

Esto calza exactamente en la categoría de "reformateo global" que la regla 10 de esta sesión pide evitar: tocar este color afecta visualmente casi todas las páginas del sitio a la vez, y no puedo verificarlo visualmente en este entorno (sin credenciales reales para levantar el dev server).

**Opciones:**
1. Reemplazar `#8A929E` por `#6B7280` (o un tono intermedio ~`#7A8189` si `#6B7280` se ve demasiado oscuro comparado con el resto de la paleta) en una pasada dedicada, revisando visualmente antes de pushear — no como parte de una sesión "conservadora" de fixes puntuales.
2. Mantenerlo como está si el criterio de diseño prioriza el look más sutil por sobre el cumplimiento estricto de AA (WCAG AA no es un requisito legal para este tipo de sitio, es una buena práctica).
