# Hallazgos del rediseño "Midnight Portfolio"

Problemas **previos** al rediseño detectados durante la auditoría. Ninguno se corrigió: el brief prohíbe tocar la lógica financiera, y se documentan aquí para decidirlos aparte.

## 1. Progreso de metas calculado en dos lugares

- `src/app/(app)/metas/page.tsx` calcula el progreso de cada meta en línea.
- `calcularMetasConProgreso` (`src/lib/dashboard.ts`) hace lo mismo para el dashboard.
- Hoy ambas dan el mismo resultado (suman `valor_actual_clp` de `capital_por_cuenta`; una cuenta sin valor o dada de baja cuenta 0). Si una cambia y la otra no, el dashboard y `/metas` mostrarán montos distintos.
- **Prueba que fija el comportamiento actual:** `src/lib/dashboard.test.ts` ("calcularMetasConProgreso suma valor_actual_clp…" y "meta sin cuentas asociadas queda en 0").
- Sugerencia: que `/metas` use la función de `lib`.

## 2. `SnapshotForm` (multi-cuenta) duplica fórmulas y usa `window.confirm`

- Conserva su propia copia de `calcularValorSugerido` / `estimarRendimientoPct`; son idénticas a las de `src/lib/registro.ts` (que sí tiene tests), pero pueden divergir.
- Usa `window.confirm` para las advertencias, mientras que `CargaRapida` ya usa un panel en pantalla accesible.
- Sugerencia: unificar en una iteración aparte.

## 3. Total del Hero vs. valor actual de `capital_por_cuenta` (no verificado)

- El Hero toma el total de `rendimiento_actual` (última fila de `rendimiento_semanal` por cuenta) y la tarjeta de capital usa `capital_por_cuenta` (último snapshot + suma de movimientos).
- Ambas vistas deberían coincidir en el valor actual, pero salen de consultas distintas (`capital_por_cuenta` filtra `activa = true`). **No se pudo comprobar con datos reales**: se probó solo contra un Supabase simulado.
- Sugerencia: comparar ambos totales en la base real antes de mergear.

## 4. XIRR con valor final "viejo"

- El XIRR usa como valor final el valor actual del portafolio, aunque el último registro de alguna cuenta sea antiguo. La convención es la de la versión anterior y se mantuvo tal cual; conviene tenerla presente al interpretar la cifra.

## Lo que NO se pudo verificar

- RLS y vistas SQL con datos reales y con dos usuarios simultáneos (no se tocó ninguna vista, policy ni función).
- Flujo de confirmación por correo de Supabase Auth.
- Consulta en vivo a mindicador.cl (no es accesible desde el entorno de desarrollo).
- Datos de producción reales.
