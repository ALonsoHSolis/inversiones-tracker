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

## Rediseño "Midnight Portfolio"

Ramas apiladas `claude/midnight-N-*` (cada PR apunta a la anterior).

| # | Fase | Estado |
|---|------|--------|
| 1 | Tokens, tipografía Geist, íconos Lucide, contraste AA | PR #11 |
| 2 | Layout, sidebar colapsable, barra superior, navegación móvil | PR #12 |
| 3 | Dashboard (hero, gráfico, comparadores, métricas secundarias) | PR #13 |
| 4 | Cuentas e instituciones (filas compactas, tabla ordenable/filtrable) | PR #14 |
| 5 | Registro, formularios, metas, análisis | esta rama |
| 6 | QA responsive (320–1440), accesibilidad, hallazgos financieros previos | pendiente |

### Decisiones de la fase 2

- Rutas autenticadas en el grupo `src/app/(app)/` con un `layout.tsx` que exige sesión y envuelve todo en `PrivacyShell` + `AppShell`. Las URLs no cambian.
- Rutas nuevas: `/cuentas` (listado), `/registrar` (carga diaria; en móvil es el botón central de la barra inferior) y `/analisis` (todo el análisis avanzado que antes colgaba del dashboard, con los mismos cálculos movidos tal cual).
- "Informes" (`/informe`) se mantiene en el menú aunque el brief no lo listaba: no se quitan funciones.
- La lógica de navegación (sección activa, título, "volver") está en `src/lib/navegacion.ts` con tests.
- Estado del sidebar en `localStorage` (`sidebar:colapsado`) vía `useSyncExternalStore`; sin storage simplemente no persiste.
- Hoja "Más" en móvil con `<dialog>` nativo (foco, Escape y aislamiento del navegador).

### Hallazgos

- **Corregido (regresión propia de la fase 5):** `Hero` (servidor) pasaba una función a `CountUp` (cliente); en la app real Next lo rechaza al serializar y el dashboard caía al error boundary. Los fixtures anteriores no lo detectaban porque renderizaban `Hero` desde un componente cliente. Ahora `CountUp` recibe el formato por nombre (`"pesos"` / `"pesosSigned"`).
- **Previo, sin tocar:** `src/app/(app)/metas/page.tsx` calcula el progreso de metas inline, duplicando `calcularMetasConProgreso` de `src/lib/dashboard.ts`. No cambia números hoy, pero puede divergir.
- Verificación visual con un Supabase simulado local (datos de prueba en CLP/USD/UF, sin tocar la base real); no cubre RLS ni las vistas SQL.

### Decisiones de la fase 3

- Hero: valor total protagonista, ganancia real en bloque propio (separada del cambio nominal semanal), capital aportado / valor actual, nota de moneda (CLP; conversión a tasa histórica solo si hay cuentas USD/UF) y "Último registro" tomado de `capital_por_cuenta.ultima_fecha` (solo si existe).
- Gráfico a todo el ancho con eje Y compacto (`$12,6 M`), sin interpolación (escalones), períodos 1M/3M/6M/1A/Máx con `aria-pressed`, resumen para lectores de pantalla y aviso cuando el período pedido no tiene historial suficiente.
- Comparadores en tarjetas cuyo texto envuelve (nunca se recorta); sin datos de UF/S&P se muestra "No disponible" en vez de ocultarlos.
- Métricas secundarias: TWR, XIRR y peor caída, cada una con su propio nombre y ayuda; no se presentan como equivalentes. Los cálculos viven en `src/lib/metricas-portafolio.ts` (movidos tal cual desde `/analisis`, con tests); `/analisis` y el dashboard usan el mismo módulo.
- `Ayuda` ahora tiene nombre accesible y foco visible.

### Decisiones de la fase 4

- `/cuentas`: tabla en escritorio (cabeceras ordenables con `aria-sort`, búsqueda sin tildes, filtros por tipo/plataforma/moneda, agrupar por plataforma con subtotales, total de lo mostrado) y filas compactas en móvil (nombre → historial, lápiz → editar, 44 px de objetivo táctil, selector de orden). Lógica pura en `src/lib/cuentas-tabla.ts` con tests; los valores faltantes siempre van al final.
- Las cifras de cada fila son las mismas que usaba `AccountRow` (`rendimiento_actual` / `capital_por_cuenta`): valor en CLP, rendimiento en moneda nativa (con la moneda a la vista), anualizado simple. Un chip "+ aporte / − retiro" avisa que hubo un movimiento que no cuenta como rendimiento.
- Distribuciones: `DistribucionCard` reemplaza a `PlatformBreakdown`, `AssetTypeBreakdown` y `CategoryBreakdown` (eran copias). Barra apilada con colores categóricos (sin verde ni rojo), fila por grupo con su color, % del total, ganancia % y detalle desplegable; aviso de concentración ≥ 40 % igual que antes.

### Decisiones de la fase 5

- **Carga rápida** (`CargaRapida`): selector de cuenta con búsqueda accesible (`SelectorCuenta`, patrón combobox + listbox con flechas/Enter/Escape; antes un `<select>` con opciones `display:none` que no filtraba en celulares), errores por campo con `aria-invalid`/`aria-describedby`, y las advertencias ("valor sin cambio con movimiento", "rendimiento ≥ 80 %") en un panel en pantalla con "Revisar el valor" / "Guardar igual" en lugar de `window.confirm`. Las reglas viven en `src/lib/registro.ts` (con tests); las condiciones y fórmulas son las de antes. El guardado sigue llamando a `guardar_snapshot_con_movimiento` con `p_permitir_quitar_movimiento: false` (verificado contra un RPC simulado).
- La fecha de la carga rápida sigue siendo "hoy" (solo lectura): corregir fechas pasadas es el historial de cada cuenta, no se cambió ese comportamiento.
- `/registrar?cuenta=<id>` preselecciona la cuenta; desde `/cuentas` cada fila tiene "Registrar". En móvil `/registrar` es la pantalla dedicada; el multi-cuenta (`SnapshotForm`) se mantiene.
- **Metas:** estado vacío con "Crear primera meta", barra de progreso con `role="progressbar"`, botón eliminar con objetivo táctil de 40 px.
- **Análisis:** navegación interna por secciones (sticky) y una tarjeta "Cómo leer las métricas" que explica rendimiento real, ganancia real total, TWR, XIRR, anualizado y peor caída.

### Pendiente / hallazgos de esta fase

- `SnapshotForm` (multi-cuenta) conserva su propia copia de `calcularValorSugerido`/`estimarRendimientoPct` y sus `window.confirm`; las fórmulas son idénticas a las movidas a `lib/registro.ts`, pero conviene unificarlas en una iteración aparte.
