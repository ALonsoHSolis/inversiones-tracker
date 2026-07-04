# INVERSIONES-TRACKER

Documento de referencia para entender de que trata este proyecto, que problema resuelve, como se usa, como esta construido y que decisiones importantes ya fueron tomadas.

La idea de este archivo es que cualquier persona pueda entrar al repositorio y entender el proyecto sin tener que leer todo el codigo primero.

## Resumen ejecutivo

INVERSIONES-TRACKER es una aplicacion web para seguimiento personal de inversiones. Esta pensada para personas que tienen dinero repartido en varias plataformas, instrumentos y monedas, especialmente en el contexto chileno: pesos chilenos, dolares y UF.

La promesa central del producto es:

> Saber cuanto dinero puso el usuario, cuanto vale hoy su portafolio y cuanto gano o perdio realmente, sin confundir aportes con rendimiento.

Esto es importante porque muchos inversionistas miran el valor total de sus cuentas y creen que ese cambio representa ganancia o perdida. Pero si durante el periodo hicieron un aporte o retiro, la lectura queda distorsionada. Esta app existe para separar esas cosas de forma clara.

## Objetivo del proyecto

El objetivo es construir una herramienta simple, confiable y privada para controlar el rendimiento real de un portafolio personal.

El proyecto busca responder preguntas como:

- Cuanto tengo invertido hoy en total?
- Cuanto capital he aportado realmente?
- Cuanto he ganado o perdido descontando aportes y retiros?
- En que plataformas esta distribuido mi dinero?
- Que parte de mi portafolio esta en CLP, USD o UF?
- Que cuentas estan rindiendo bien y cuales no?
- Como ha evolucionado mi patrimonio invertido en el tiempo?

El foco no es recomendar en que invertir. El foco es dar claridad, trazabilidad y control.

## Problema que resuelve

Una persona puede tener inversiones en:

- bancos,
- corredoras,
- fondos mutuos,
- depositos a plazo,
- acciones,
- cripto,
- cuentas en dolares,
- instrumentos ligados a UF.

Normalmente esos datos quedan repartidos entre distintas plataformas. Cada una muestra su propio saldo, pero ninguna entrega una mirada consolidada y limpia del rendimiento real.

El problema principal es que una subida del portafolio puede deberse a tres causas distintas:

- rendimiento de mercado,
- un nuevo aporte del usuario,
- efecto del tipo de cambio.

Y una bajada puede deberse a:

- perdida de mercado,
- un retiro,
- variacion cambiaria.

Si no se separan esas fuentes, el usuario puede tomar malas decisiones. Por ejemplo, puede creer que gano mucho cuando solo deposito mas plata, o puede creer que perdio cuando en realidad retiro parte del capital.

## Propuesta de valor

La propuesta de valor recomendada para este producto es:

> Tu portafolio real, sin humo: cuanto pusiste, cuanto vale hoy y cuanto ganaste de verdad.

Version mas formal:

> Control patrimonial personal para inversionistas chilenos que tienen su dinero repartido en varias plataformas y monedas.

Version de producto:

> Una capa de verdad financiera que consolida inversiones, separa aportes de ganancias y muestra el rendimiento real del portafolio.

## Para quien es

El usuario ideal es una persona que:

- ya invierte o esta empezando a invertir,
- tiene mas de una cuenta o plataforma,
- quiere controlar su patrimonio sin depender de Excel,
- le importa saber si realmente esta ganando,
- necesita una lectura consolidada en pesos chilenos,
- quiere mantener control manual y privacidad sobre sus datos.

No esta pensado inicialmente para:

- asesores financieros que gestionan carteras de terceros,
- portafolios compartidos entre varios usuarios,
- trading intradia,
- recomendaciones automaticas de compra o venta,
- contabilidad tributaria completa.

## Como sirve la aplicacion

La aplicacion ayuda al usuario a registrar sus cuentas de inversion, actualizar su valor periodicamente y ver metricas que separan capital aportado, valor actual y ganancia real.

### Flujo principal

1. El usuario crea una cuenta o inicia sesion.
2. Agrega una cuenta de inversion con nombre, plataforma, tipo, moneda y monto inicial.
3. La app registra ese monto inicial como capital aportado, no como ganancia.
4. Periodicamente, el usuario actualiza el valor actual de cada cuenta.
5. Si ese valor incluye un aporte o retiro, lo marca en el formulario.
6. El sistema calcula rendimiento real descontando esos movimientos.
7. El dashboard muestra el portafolio consolidado y la evolucion en el tiempo.

### Ejemplo simple

Si una cuenta tenia $1.000.000 y hoy vale $1.500.000, podria parecer que gano $500.000.

Pero si durante el periodo el usuario deposito $400.000, la ganancia real no es $500.000. Es:

```text
ganancia real = valor final - valor inicial - aportes netos
ganancia real = 1.500.000 - 1.000.000 - 400.000
ganancia real = 100.000
```

Ese es el tipo de confusion que la app busca evitar.

## Estructura a nivel de producto

El producto esta organizado alrededor de cuatro conceptos:

### 1. Cuentas

Cada cuenta representa una inversion o una posicion que el usuario quiere seguir.

Ejemplos:

- Fondo mutuo en BancoEstado.
- Acciones en una corredora.
- Deposito a plazo.
- Cuenta en dolares.
- Cripto.
- Otro instrumento.

Campos relevantes:

- nombre,
- plataforma,
- tipo de cuenta,
- moneda,
- estado activa/inactiva,
- usuario propietario.

### 2. Snapshots

Un snapshot es el valor de una cuenta en una fecha determinada.

La app no intenta conectarse automaticamente a todos los bancos. En esta version, el usuario registra manualmente el valor que ve en su banco, corredora o plataforma.

Esto tiene una ventaja: la herramienta puede partir simple y confiable, sin depender de integraciones bancarias complejas.

### 3. Movimientos

Los movimientos son aportes y retiros.

Son fundamentales porque permiten separar:

- cambio de valor por mercado,
- cambio de valor porque el usuario agrego o saco dinero.

Sin movimientos, el rendimiento real queda contaminado.

### 4. Dashboard

El dashboard resume la situacion del portafolio.

Actualmente muestra o esta preparado para mostrar:

- valor total del portafolio en CLP,
- cambio nominal reciente,
- capital aportado vs. valor actual,
- ganancia total acumulada,
- desglose por plataforma,
- desglose por tipo de activo,
- evolucion historica del portafolio,
- rendimiento real por cuenta,
- rendimiento anualizado estimado,
- comparacion contra referencias como UF y S&P 500,
- exportacion de datos a CSV.

## Reglas de negocio principales

Estas reglas son el corazon del proyecto. No deberian cambiarse sin discutirlo antes.

### 1. Un aporte no es ganancia

Todo calculo de rendimiento debe descontar aportes y retiros.

Formula base:

```text
rendimiento % = (valor_final - valor_inicial - aportes_netos) / (valor_inicial + aportes_netos) * 100
```

Esta formula es simple y suficiente para la version actual. No usa metodo Dietz modificado ni pondera por el dia exacto del aporte.

### 2. El monto inicial cuenta como aporte

Cuando se crea una cuenta, el monto inicial debe quedar registrado como capital aportado. Por eso no se debe insertar una cuenta directamente desde el frontend.

La cuenta se crea con el RPC:

```text
crear_cuenta_con_aporte_inicial
```

Ese RPC crea en una sola transaccion:

- la cuenta,
- el primer snapshot,
- el aporte inicial.

### 3. USD y UF necesitan tasa de cambio

Las cuentas en USD o UF deben guardar `tasa_cambio` en cada snapshot y movimiento.

La base de datos lo exige con triggers. No es solo una regla del frontend.

Para cuentas en CLP, `tasa_cambio` debe ser `null`.

### 4. El total consolidado usa tasas historicas

El total del portafolio se calcula en CLP usando la tasa de cambio historica de cada snapshot o movimiento.

No se usa la tasa de hoy para recalcular todo el pasado.

Esto es intencional: si el dolar subio o bajo, ese efecto cambiario forma parte de la experiencia real del usuario medido en pesos.

### 5. Cuenta individual vs. portafolio total

El rendimiento por cuenta se muestra en la moneda nativa de esa cuenta.

El portafolio total se muestra consolidado en CLP.

Esto evita mezclar preguntas distintas:

- "Como rindio esta cuenta en su moneda?"
- "Cuanto vale todo mi patrimonio invertido en pesos?"

## Estructura tecnica

El proyecto esta construido como una aplicacion web moderna con Next.js y Supabase.

### Stack principal

- Next.js 16.
- React 19.
- TypeScript.
- Tailwind CSS 4.
- Supabase:
  - Postgres,
  - Supabase Auth,
  - Row Level Security,
  - RPC functions,
  - SQL views.
- Recharts para graficos.

### Scripts principales

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Nota: en Windows puede ser necesario usar `npm.cmd` si PowerShell bloquea `npm.ps1`.

## Estructura de carpetas

```text
supabase/schema.sql
src/app/
src/components/
src/lib/
src/lib/supabase/
src/types/
```

### `supabase/schema.sql`

Contiene la definicion de base de datos:

- tablas,
- indices,
- triggers,
- policies de RLS,
- funciones RPC,
- vistas SQL.

Es uno de los archivos mas importantes del proyecto. Muchas reglas de negocio viven aqui.

### `src/app/`

Contiene las rutas de la aplicacion usando App Router de Next.js.

Rutas principales:

- `/`: dashboard principal.
- `/login`: inicio de sesion.
- `/signup`: crear usuario.
- `/auth/confirm`: confirmacion de email.
- `/cuentas/nueva`: agregar cuenta.
- `/cuentas/[id]/editar`: editar cuenta.
- `/cuentas/[id]/historial`: revisar y corregir historial.
- `/cuentas/inactivas`: ver cuentas dadas de baja.

### `src/components/`

Contiene piezas reutilizables de interfaz.

Componentes relevantes:

- `SnapshotForm.tsx`: formulario para actualizar valores de cuentas.
- `CuentaForm.tsx`: formulario para crear una cuenta.
- `HistorialForm.tsx`: edicion de snapshots y movimientos pasados.
- `PortfolioSummary.tsx`: resumen del portafolio.
- `CapitalSummary.tsx`: capital aportado vs. valor actual.
- `PlatformBreakdown.tsx`: desglose por plataforma.
- `AssetTypeBreakdown.tsx`: desglose por tipo de activo.
- `PortfolioChart.tsx`: grafico de evolucion.
- `MarketBenchmark.tsx`: referencias externas como UF y S&P 500.
- `AccountRow.tsx`: fila de cada cuenta individual.
- `ExportarDatos.tsx`: exportacion de informacion a CSV.
- `Ayuda.tsx`: ayudas contextuales para explicar metricas.

### `src/lib/`

Contiene logica compartida e integraciones.

Archivos relevantes:

- `mindicador.ts`: obtiene tasas de USD y UF desde mindicador.cl.
- `mercado.ts`: obtiene benchmarks externos.
- `rendimiento.ts`: espejo TypeScript del calculo de rendimiento.
- `csv.ts`: utilidades para exportar datos.
- `tipos-cuenta.ts`: catalogo de tipos de cuenta.
- `origin.ts`: ayuda a construir URLs correctas para auth.

### `src/lib/supabase/`

Contiene los clientes Supabase:

- `client.ts`: cliente para navegador.
- `server.ts`: cliente para Server Components y Server Actions.
- `middleware.ts`: refresco de sesion y proteccion de rutas.

### `src/types/database.ts`

Contiene los tipos TypeScript derivados o mantenidos para Supabase.

Importante: si cambia el schema real de Supabase, este archivo debe regenerarse para evitar inconsistencias.

## Modelo de datos

### Tabla `cuentas`

Representa las cuentas de inversion.

Campos principales:

- `id`,
- `user_id`,
- `nombre`,
- `plataforma`,
- `tipo`,
- `moneda`,
- `activa`,
- `created_at`.

### Tabla `snapshots`

Representa el valor de una cuenta en una fecha.

Campos principales:

- `id`,
- `cuenta_id`,
- `fecha`,
- `valor`,
- `tasa_cambio`,
- `created_at`.

Tiene una restriccion unica por cuenta y fecha:

```text
unique (cuenta_id, fecha)
```

Esto permite actualizar el snapshot de un dia sin duplicarlo.

### Tabla `movimientos`

Representa aportes y retiros.

Campos principales:

- `id`,
- `cuenta_id`,
- `snapshot_id`,
- `fecha`,
- `tipo`,
- `monto`,
- `tasa_cambio`,
- `nota`,
- `created_at`.

Los movimientos son la pieza que permite calcular ganancia real.

## Vistas SQL importantes

### `rendimiento_semanal`

Calcula el rendimiento entre cada snapshot y el snapshot anterior de la misma cuenta.

Descuenta aportes y retiros del periodo.

### `rendimiento_actual`

Devuelve el rendimiento mas reciente por cuenta.

Es una vista practica para el dashboard.

### `capital_por_cuenta`

Calcula capital aportado, valor actual y conversion a CLP por cuenta.

Sirve para responder:

- cuanto capital he puesto,
- cuanto vale hoy,
- cuanto gane o perdi desde el inicio.

### `evolucion_portafolio`

Calcula el valor total del portafolio en CLP a traves del tiempo.

Usa el ultimo valor conocido de cada cuenta cuando no existe snapshot exacto para una fecha. Esto evita que el total del portafolio baje artificialmente solo porque una cuenta no fue actualizada ese dia.

## Funciones RPC importantes

### `crear_cuenta_con_aporte_inicial`

Crea una cuenta, su primer snapshot y su aporte inicial en una sola transaccion.

Debe usarse siempre para crear cuentas nuevas.

### `guardar_snapshot_con_movimiento`

Guarda o actualiza un snapshot y, opcionalmente, un movimiento asociado.

Se usa en:

- carga diaria de valores,
- correccion de historial.

Tiene un parametro importante:

```text
p_permitir_quitar_movimiento
```

En la carga diaria debe ir en `false`, para evitar que el usuario borre accidentalmente un aporte real.

En el historial puede ir en `true`, porque ahi la eliminacion de un movimiento es una correccion deliberada.

## Seguridad

La seguridad se apoya principalmente en Supabase Auth y Row Level Security.

Principios:

- Cada usuario solo ve sus propias cuentas.
- Cada snapshot pertenece a una cuenta del usuario.
- Cada movimiento pertenece a una cuenta del usuario.
- Las vistas SQL usan `security_invoker = true`.

Esto ultimo es muy importante. Sin `security_invoker = true`, una vista puede ejecutarse con permisos del dueno de la vista y saltarse RLS, exponiendo datos de otros usuarios.

Regla de verificacion:

> Cualquier cambio que toque RLS, policies o vistas debe probarse con al menos dos usuarios de prueba con datos simultaneos.

Probar con un solo usuario puede esconder fugas de datos.

## Integraciones externas

### mindicador.cl

Se usa para obtener:

- dolar,
- UF.

Esto permite autocompletar tasas de cambio sin pedirle al usuario que las busque manualmente.

### Yahoo Finance

Se usa como fuente best-effort para benchmark del S&P 500.

Si el servicio externo falla, el dashboard no deberia romperse. Los benchmarks son informacion complementaria, no datos criticos del usuario.

## Decisiones de producto importantes

### No se automatiza todo al principio

La app parte con ingreso manual de valores. Esto reduce complejidad y evita depender de integraciones bancarias dificiles o fragiles.

### Se prioriza precision conceptual

El objetivo no es mostrar muchos graficos, sino mostrar pocos numeros confiables.

El numero mas importante es la ganancia real neta de aportes.

### Se evita dar asesoria financiera directa

La app puede mostrar informacion, alertas e insights, pero no deberia posicionarse como una herramienta que recomienda comprar o vender activos.

Eso ayuda a mantener el producto enfocado y reduce riesgos regulatorios.

### El usuario conserva control

El usuario puede:

- crear cuentas,
- actualizar valores,
- registrar aportes y retiros,
- corregir historial,
- dar de baja cuentas sin borrar datos,
- exportar informacion.

## Estado actual del trabajo

El proyecto ya tiene una base funcional con:

- autenticacion con Supabase,
- dashboard protegido,
- creacion de cuentas,
- carga de snapshots,
- registro de aportes y retiros,
- calculos SQL de rendimiento,
- capital aportado vs. valor actual,
- evolucion historica del portafolio,
- cuentas inactivas,
- edicion de historial,
- benchmarks externos,
- desglose por plataforma,
- desglose por tipo de activo,
- exportacion CSV,
- ayudas contextuales para explicar metricas.

Tambien hay reglas importantes documentadas en `CLAUDE.md` sobre errores reales encontrados durante el desarrollo:

- riesgo de borrar aportes por accidente desde la carga diaria,
- necesidad de diferenciar carga diaria vs. correccion de historial,
- cuidado con overloads viejos de funciones Postgres,
- cuidado con vistas SQL sin `security_invoker`.

## Trabajo pendiente recomendado

### Corto plazo

- Mantener `PROYECTO.md`, `README.md` y `CLAUDE.md` alineados.
- Regenerar tipos reales de Supabase cuando cambie el schema.
- Verificar que `npm run build` y `npm run lint` funcionen de forma estable.
- Revisar el calculo de fecha local para Chile si se usa `toISOString()`, porque puede tomar fecha UTC.
- Seguir probando flujos criticos con mas de un usuario.

### Producto

- Metas financieras por usuario.
- Resumen mensual automatico.
- Alertas de concentracion por plataforma, moneda o tipo de activo.
- Mejor explicacion del efecto cambiario.
- Exportaciones mas completas.
- Vista anual o acumulada mas clara.

### Futuro posible

- Importacion historica desde CSV.
- Integraciones automaticas con instituciones financieras.
- Reportes descargables.
- Version mobile empaquetada.
- Planes premium con insights avanzados.

## Fuera de alcance por ahora

Estas cosas no forman parte de la version actual:

- carga masiva de historial pasado,
- gestion de portafolios de terceros,
- compartir portafolio entre usuarios,
- notificaciones automaticas,
- metodo Dietz modificado,
- recomendaciones de inversion,
- integraciones bancarias automaticas,
- app nativa en tiendas.

## Archivos clave para nuevos colaboradores

Leer en este orden:

1. `PROYECTO.md`: vision general del proyecto.
2. `README.md`: setup e informacion base.
3. `CLAUDE.md`: reglas de negocio y advertencias importantes.
4. `supabase/schema.sql`: fuente de verdad de datos y calculos.
5. `src/app/page.tsx`: composicion principal del dashboard.
6. `src/components/SnapshotForm.tsx`: flujo critico de actualizacion de valores.
7. `src/components/HistorialForm.tsx`: flujo critico de correccion.
8. `src/types/database.ts`: tipos usados por el frontend.

## Glosario

### Capital aportado

Dinero que el usuario puso en una cuenta, descontando retiros.

### Valor actual

Valor mas reciente de una cuenta o del portafolio completo.

### Ganancia real

Diferencia entre valor actual y capital aportado, descontando aportes y retiros.

### Snapshot

Registro del valor de una cuenta en una fecha especifica.

### Movimiento

Aporte o retiro de dinero.

### Tasa de cambio historica

Valor de USD o UF en CLP en la fecha del snapshot o movimiento.

### RLS

Row Level Security. Mecanismo de Supabase/Postgres para asegurar que cada usuario solo acceda a sus propias filas.

## Mensaje final del proyecto

INVERSIONES-TRACKER no intenta decirle al usuario en que invertir.

Su valor es mas basico y mas importante:

> Darle una lectura honesta de su dinero invertido.

Si el usuario sabe cuanto puso, cuanto vale hoy y cuanto gano realmente, puede tomar mejores decisiones con menos ansiedad y menos confusion.
