# Plan de rediseño premium-financiero

Objetivo: que el tracker se sienta premium y cómodo para alguien a quien le encantan las inversiones, **sin tocar las reglas de negocio** de `CLAUDE.md` (rendimiento neto de aportes, RPC de cuentas, tasas históricas, totales en CLP).

## Decisiones tomadas

- Acento **champán** (`#cdae76`), **solo tema oscuro**.
- Verde y rojo reservados **únicamente** para ganancia y pérdida; nunca como color decorativo ni de categoría.
- La **ganancia real** (valor actual − capital aportado) es la protagonista del dashboard; el cambio nominal semanal es secundario.
- Tokens de diseño en `src/app/globals.css` (`@theme static`), tarjetas con la clase `.card`, escala tipográfica `text-micro` (12 px) y `text-small` (13 px).
- Correos con colores en hex literal (los clientes de correo no soportan variables CSS) y fondo claro.

## Fases

| # | Fase | Contenido |
|---|------|-----------|
| 1 | Base técnica | Fecha de Chile (`src/lib/fecha.ts`), tests con `npm test`, limpieza de git |
| 2 | Sistema de diseño | Paleta champán, tema oscuro, tarjetas planas, escala tipográfica, contraste AA |
| 3 | Dashboard premium | Hero con ganancia real, menú de cuenta, toggle de privacidad visible, análisis avanzado colapsado, lógica en `src/lib/dashboard.ts` |
| 4 | Marca | Manifest, imagen OG, correos, `theme-color` |
| 5 | Landing e informe | Landing con ritmo, logo en SVG, informe mensual `/informe` (PDF por impresión), conteo animado, entrada escalonada |
| 6 | Pantallas internas | Ejes de gráficos, formularios, estado vacío, móvil |
| 7 | Móvil y plan | Pasada móvil de la landing, este documento |

Cada fase vive en su propia rama `claude/fase-N-*` y su PR. Las ramas están apiladas: al mergear una a `main`, la siguiente se reapunta.

## Pendiente

- Probar de punta a punta el flujo de confirmación por correo (registro → correo → login) con Supabase real.
- Revisar con datos reales las pantallas de historial, editar cuenta y perfil (solo se ajustaron textos).
- Habilitar el análisis de `.sql` en graphify (`graphifyy[sql]`) y regenerar el grafo.
- Opcional: informe mensual con el estado de cada cuenta al cierre del mes (hoy muestra el estado actual).

## Verificación antes de mergear

`npx tsc --noEmit`, `npm run lint`, `npm test`. El `npm run build` completo lo valida el deployment de Vercel. Cualquier cambio a vistas, RLS o firmas de funciones SQL sigue las reglas de `CLAUDE.md` (dos usuarios de prueba, `drop function if exists` previo).
