# inversiones tracker

seguimiento de rendimiento real (sin contar aportes) de inversiones repartidas en varias plataformas, con total consolidado en pesos.

**si vas a seguir este proyecto en Claude Code, lee `CLAUDE.md` primero** — tiene las reglas de negocio ya decididas y el orden de construccion. Claude Code lo carga automaticamente al abrir esta carpeta.

## que incluye este scaffold

- schema completo de supabase (`supabase/schema.sql`): tablas `cuentas`, `snapshots`, `movimientos`, triggers de integridad para el tipo de cambio, una funcion (`crear_cuenta_con_aporte_inicial`) para crear cuentas de forma atomica, y tres vistas: `rendimiento_semanal`, `rendimiento_actual` y `capital_por_cuenta`.
- clientes de supabase para browser, server y middleware (`src/lib/supabase/`), con el patron actual de `@supabase/ssr`.
- logica de calculo de rendimiento en typescript (`src/lib/rendimiento.ts`), espejo de la vista sql, util para calculos en el cliente.
- dashboard basico (`src/app/page.tsx`) con resumen del portafolio consolidado en clp, detalle por cuenta y formulario de carga rapida.

## decisiones de diseno ya tomadas

- el monto inicial de una cuenta nueva cuenta como aporte de capital (para poder ver capital total invertido vs. ganancia total, no solo semanal).
- cuentas en usd o uf se consolidan en clp usando la tasa de cambio del dia de cada snapshot o aporte (historica), no la tasa de hoy. asi el efecto cambiario queda reflejado en la ganancia total, que es lo que realmente experimenta un inversionista en pesos.
- rendimiento por cuenta se muestra en su moneda nativa (sin ruido cambiario); el total del portafolio se muestra consolidado en clp (con efecto cambiario incluido). son dos cosas distintas a proposito.
- sin carga de historial pasado en esta version: se parte desde hoy en adelante.

el detalle completo de que construir con esto esta en `CLAUDE.md`.

## como migrar esto a claude code

1. descomprime este zip en una carpeta.
2. abre claude code apuntando a esa carpeta (va a leer `CLAUDE.md` automaticamente).
3. corre `npm install`.
4. pidele que te ayude a crear el proyecto en supabase, pegar las env vars, y correr `supabase/schema.sql`.
5. `npm run dev` y sigan iterando desde ahi, siguiendo el orden de `CLAUDE.md`.

## sobre las claves de supabase

supabase esta migrando de "anon key" a "publishable key" (mismo proposito, nombre nuevo). si tu dashboard todavia muestra "anon key", es el mismo valor, usalo en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## formula de rendimiento semanal

```
rendimiento% = (valor_final - valor_inicial - aportes_netos) / (valor_inicial + aportes_netos) * 100
```

version simple: no pesa por el dia exacto del aporte dentro del periodo, como si hace el metodo dietz modificado. para esta version no hace falta esa complejidad (ver `CLAUDE.md`, fuera de alcance a proposito).
