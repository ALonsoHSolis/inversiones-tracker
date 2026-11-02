# Hallazgos del rediseño "Midnight Portfolio"

Problemas **previos** al rediseño detectados durante la auditoría. Ninguno se corrigió: el brief prohíbe tocar la lógica financiera, y se documentan aquí para decidirlos aparte.

## 1. Progreso de metas calculado en dos lugares — RESUELTO (iteración 2)

`/metas` ahora usa `calcularMetasConProgreso`; mismo cálculo, sin duplicado.

- `src/app/(app)/metas/page.tsx` calcula el progreso de cada meta en línea.
- `calcularMetasConProgreso` (`src/lib/dashboard.ts`) hace lo mismo para el dashboard.
- Hoy ambas dan el mismo resultado (suman `valor_actual_clp` de `capital_por_cuenta`; una cuenta sin valor o dada de baja cuenta 0). Si una cambia y la otra no, el dashboard y `/metas` mostrarán montos distintos.
- **Prueba que fija el comportamiento actual:** `src/lib/dashboard.test.ts` ("calcularMetasConProgreso suma valor_actual_clp…" y "meta sin cuentas asociadas queda en 0").
- Sugerencia: que `/metas` use la función de `lib`.

## 2. `SnapshotForm` (multi-cuenta) duplica fórmulas y usa `window.confirm` — RESUELTO (iteración 2)

Usa `calcularValorSugerido` y `advertenciaRegistro` de `src/lib/registro.ts` y confirma en un panel en pantalla
("Revisar", "Guardar solo las demás", "Guardar igual"; esta última conserva la opción de omitir solo las cuentas
dudosas, como el "Cancelar" de antes). Verificado contra el RPC simulado: `p_permitir_quitar_movimiento: false`.

- Conserva su propia copia de `calcularValorSugerido` / `estimarRendimientoPct`; son idénticas a las de `src/lib/registro.ts` (que sí tiene tests), pero pueden divergir.
- Usa `window.confirm` para las advertencias, mientras que `CargaRapida` ya usa un panel en pantalla accesible.
- Sugerencia: unificar en una iteración aparte.

## 3. Total del Hero vs. valor actual de `capital_por_cuenta` (no verificado)

- El Hero toma el total de `rendimiento_actual` (última fila de `rendimiento_semanal` por cuenta) y la tarjeta de capital usa `capital_por_cuenta` (último snapshot + suma de movimientos).
- Ambas vistas deberían coincidir en el valor actual, pero salen de consultas distintas (`capital_por_cuenta` filtra `activa = true`). **No se pudo comprobar con datos reales**: se probó solo contra un Supabase simulado.
- Sugerencia: comparar ambos totales en la base real antes de mergear.

## 4. XIRR con valor final "viejo"

- El XIRR usa como valor final el valor actual del portafolio, aunque el último registro de alguna cuenta sea antiguo. La convención es la de la versión anterior y se mantuvo tal cual; conviene tenerla presente al interpretar la cifra.

## 3b. Análisis estático del hallazgo 3 (iteración 2)

Para cuentas activas, `rendimiento_actual.valor_clp` y `capital_por_cuenta.valor_actual_clp` salen del mismo dato
(último snapshot × su propia tasa) y `unique(cuenta_id, fecha)` impide empates. El Hero ya filtra cuentas activas.
Deberían coincidir exactamente; falta confirmarlo con una consulta en la base real.

## 5. XIRR sin horizonte temporal devuelve ~450 % (no corregido)

- `calcularXIRR` (`src/lib/rendimiento.ts`): si todos los flujos caen el mismo día (cuenta creada hoy, valor igual
  al aporte), el VPN es 0 para cualquier tasa y la bisección devuelve el punto medio del rango (−0,9999 + 10) / 2.
- Efecto visible: `/analisis` muestra "XIRR +450,0%" en una cuenta recién creada.
- **Prueba que lo reproduce:** `src/lib/rendimiento.test.ts`, marcada `todo` (no rompe la suite).
- Sugerencia: devolver `null` cuando no hay al menos dos fechas distintas. Es lógica financiera: requiere tu OK.

## 6. Campo de monto inflaba montos escritos con coma decimal — CORREGIDO, revisar antes de mergear

- `InputMonto` descartaba todo lo que no fuera dígito o punto: "1234,5" se guardaba como **12345** y "1.234.567"
  quedaba como `NaN` (pasaba la validación y llegaba al RPC).
- Ahora `normalizarMontoIngresado` (`src/lib/formato.ts`, con tests): con coma, la coma es decimal y los puntos son
  miles; sin coma y con 2+ puntos, los puntos son miles; un solo punto sigue siendo decimal, igual que antes.
- No cambia ninguna fórmula: solo cómo se interpreta lo que se escribe. Lo marco porque toca la entrada de montos.

## 7. Pendientes menores detectados

- `HistorialForm` (2) y `EditarCuentaForm` (1) aún usan `window.confirm`. No se cambiaron: el historial usa
  `p_permitir_quitar_movimiento: true` y conviene tocarlo con cuidado y pruebas propias.
- El historial tenía 86 campos sin etiqueta accesible (axe, con 43 registros): corregido.
- Los selectores de `CompositionChart` no anunciaban el estado activo (`aria-pressed`): corregido.

## Lo que NO se pudo verificar

- RLS y vistas SQL con datos reales y con dos usuarios simultáneos (no se tocó ninguna vista, policy ni función).
- Flujo de confirmación por correo de Supabase Auth.
- Consulta en vivo a mindicador.cl (no es accesible desde el entorno de desarrollo).
- Datos de producción reales.
