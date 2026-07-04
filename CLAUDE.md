# inversiones tracker

Tracker personal de rendimiento de inversiones repartidas en varias plataformas (Chile). El objetivo central: nunca confundir plata que el usuario deposito con ganancia real.

## Contexto

El schema y el scaffold ya existen en este repo. No los reconstruyas desde cero, extiendelos. Antes de tocar nada, lee `supabase/schema.sql` completo — tiene comentarios explicando cada decision — y `README.md`.

## Reglas de negocio ya fijadas (no las reinterpretes ni las cambies sin preguntar)

1. **Rendimiento neto de aportes.** Un deposito a mitad de semana nunca debe aparecer como ganancia. La vista `rendimiento_semanal` ya resuelve esto restando `aportes_netos` del cambio de valor. Si agregas cualquier pantalla que muestre "cuanto gane", usa esta vista o el mismo calculo, no restes valores de snapshots directamente.

2. **Toda cuenta nueva se crea con el RPC `crear_cuenta_con_aporte_inicial`.** Inserta la cuenta, su primer snapshot y su aporte inicial en una sola transaccion. Nunca insertes directo en la tabla `cuentas` desde el frontend — si lo haces, el monto inicial no queda contabilizado como capital aportado y la metrica de "capital total vs. ganancia total" queda mal desde el dia uno.

3. **Cuentas en USD o UF llevan `tasa_cambio` en cada snapshot y movimiento.** Es un trigger de base de datos, no una convencion: si intentas insertar un snapshot o movimiento de una cuenta no-CLP sin `tasa_cambio`, la base de datos lo rechaza. Para cuentas CLP, `tasa_cambio` debe ser null (tambien forzado por trigger).

4. **El total consolidado del portafolio se calcula en pesos usando la tasa historica de cada snapshot/aporte, no la tasa de hoy.** Esto es intencional: si el dolar subio, ese es un efecto real que el usuario experimenta en pesos, no ruido a esconder. Las vistas `rendimiento_semanal`, `rendimiento_actual` y `capital_por_cuenta` ya hacen esta conversion — usa sus columnas `*_clp`, no recalcules esto en el cliente.

5. **Rendimiento por cuenta se muestra en moneda nativa; el total del portafolio se muestra en CLP.** El % de una cuenta en dolares refleja su desempeno en dolares (sin ruido cambiario). El total consolidado si incluye el efecto cambiario. No mezcles estos dos criterios.

## Como conseguir la tasa de cambio

API publica y gratuita del Banco Central de Chile: `https://mindicador.cl/api/{uf|dolar}/{dd-mm-yyyy}`. Uselo para autocompletar `tasa_cambio` cuando el usuario carga un valor en una cuenta USD o UF — nunca se lo pidas manualmente, es justamente lo que se definio evitar.

## Que construir, en este orden

1. **Auth**: login/signup con email y password de Supabase Auth (`@supabase/ssr`, ya esta instalado). Pagina protegida, redirect si no hay sesion. El middleware en `src/lib/supabase/middleware.ts` ya refresca la sesion, falta la UI y el guard de rutas.

2. **Pantalla "agregar cuenta"**: formulario con nombre, plataforma, tipo, moneda, monto inicial. Si moneda != CLP, buscar la tasa de cambio automaticamente en mindicador.cl en vez de pedirsela al usuario (mostrarla, pero prellenada). Al guardar, llamar al RPC `crear_cuenta_con_aporte_inicial`, no insertar directo.

3. **Extender `src/components/SnapshotForm.tsx`**: hoy solo guarda `{cuenta_id, fecha, valor}`. Necesita: (a) tasa de cambio automatica desde mindicador.cl para cuentas no-CLP antes de guardar, (b) un toggle opcional "esto incluye un aporte o retiro" que, si se marca, tambien inserte una fila en `movimientos` con la misma fecha y tasa.

4. **Nueva metrica en el dashboard**: capital total invertido vs. valor actual vs. ganancia total, todo en CLP, usando la vista `capital_por_cuenta`. Es distinta del rendimiento semanal que ya esta en `src/components/PortfolioSummary.tsx` — esta es acumulada desde que se creo cada cuenta, no semana a semana. Sumar las filas de `capital_por_cuenta` da el total del portafolio.

5. **Regenerar tipos reales**: `src/types/database.ts` esta escrito a mano. Una vez creado el proyecto en supabase.com y corrido `schema.sql`, correr `npx supabase gen types typescript` y reemplazar.

## Fuera de alcance para esta iteracion (no lo construyas todavia, no preguntes por esto)

- Carga de historial pasado o importacion masiva — el usuario parte desde hoy en adelante.
- Compartir el portafolio con otra persona — es de un solo usuario.
- Notificaciones o recordatorios semanales.
- Metodo Dietz modificado u otro ajuste por timing exacto del aporte dentro del periodo — la formula simple ya definida es suficiente para esta version.

## Verificacion

Corre `npm run build` despues de cada paso antes de seguir al siguiente. Si algo en las reglas de negocio de arriba no calza con lo que estas por construir, para y pregunta antes de improvisar una solucion distinta.

Cualquier cambio que toque RLS, policies o vistas debe probarse con **al menos dos usuarios de prueba con datos simultaneos** en la base, no uno a la vez. Una fuga de datos entre usuarios es invisible si en el momento de probar solo hay un usuario con filas — asi paso con `rendimiento_semanal`, `rendimiento_actual` y `capital_por_cuenta`: las tres vistas fueron creadas por el rol `postgres` sin `security_invoker = true`, lo que hacia que row level security se evaluara como el dueño de la vista (que hace bypass de rls) y no como el usuario autenticado, filtrando cuentas de todos los usuarios a cualquiera. El bug paso inadvertido en varias verificaciones porque cada prueba limpiaba sus datos antes de crear el siguiente usuario de prueba.

**Incidente con `guardar_snapshot_con_movimiento` (dos perdidas de datos reales + un overload fantasma).** Esta funcion RPC (usada por `SnapshotForm.tsx` para la carga diaria y por `HistorialForm.tsx` para corregir historial) borraba aportes reales del usuario en produccion, dos veces en la misma sesion: la logica original buscaba "el movimiento de esta fecha" de forma demasiado amplia y lo borraba cada vez que el checkbox de aporte/retiro se guardaba desmarcado — incluyendo cuando el usuario solo estaba actualizando un valor, sin intencion de borrar nada. El fix agrego el parametro `p_permitir_quitar_movimiento` (`SnapshotForm.tsx` siempre pasa `false`, `HistorialForm.tsx` pasa `true` porque ahi borrar es una correccion deliberada). Una tercera consecuencia aparecio despues: `create or replace function` en Postgres **no reemplaza** una funcion cuando cambia su lista de parametros — crea un overload nuevo y deja el viejo vivo y llamable. La version de 6 parametros (equivalente a "siempre true", el comportamiento que causo el bug) quedo viva en paralelo en la base real hasta que se detecto y se dropeo explicitamente.

**Regla derivada: cualquier cambio a la firma de una funcion ya existente en `schema.sql` necesita un `drop function if exists (firma vieja exacta)` explicito antes del `create or replace`.** Despues de aplicarlo en la base real, confirmar con `select proname, pg_get_function_arguments(oid) from pg_proc where proname = '...'` que solo queda un overload, y correr `npx supabase gen types typescript` — un tipo union en la seccion `Functions` de `src/types/database.ts` es la señal de que quedo un overload viejo sin dropear.
