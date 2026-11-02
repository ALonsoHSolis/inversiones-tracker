# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Hoy:** el dueño del proyecto, un inversionista chileno con su dinero repartido en varias plataformas
  (bancos, corredoras, fondos mutuos, depósitos a plazo, acciones, cripto) y en tres monedas: CLP, USD y UF.
- **Pronto:** la app se abrirá a otras personas con el mismo perfil. El registro abierto, la landing y el blog
  ya existen. Cada usuario ve solo su propio portafolio; nunca se comparte entre personas.
- **Trabajo que hacen:** saber cuánto pusieron, cuánto vale hoy su portafolio y cuánto ganaron o perdieron de
  verdad, sin depender de una planilla.

Fuera de público objetivo: asesores que gestionan carteras de terceros, portafolios compartidos, trading
intradía, recomendaciones de compra/venta y contabilidad tributaria.

## Product Purpose

Consolidar inversiones repartidas en varias plataformas y monedas, y mostrar el rendimiento real del portafolio
separando tres causas que las plataformas mezclan: rendimiento de mercado, aportes/retiros del usuario y efecto del
tipo de cambio. El éxito es que el usuario nunca confunda plata depositada con ganancia y pueda decidir con esa
lectura limpia.

## Positioning

"Tu portafolio real, sin humo: cuánto pusiste, cuánto vale hoy y cuánto ganaste de verdad." Ninguna plataforma
individual entrega una mirada consolidada en pesos que descuente aportes y retiros; esta app es esa capa de verdad
financiera, con registro manual (sin conexiones bancarias) y privacidad por diseño.

## Operating Context

- **Registro rápido desde el celular:** el usuario abre la app del banco o la corredora, mira el saldo y anota el
  valor de una cuenta, marcando si incluye un aporte o retiro.
- **Revisión en el computador:** se sienta a revisar el portafolio completo, el análisis (TWR, XIRR, peor caída,
  composición, salud de los datos), las metas y el informe mensual (PDF por impresión).
- Recordatorio semanal y reporte mensual por correo (Resend). La tasa de cambio USD/UF se autocompleta desde
  mindicador.cl (Banco Central); nunca se pide a mano.

## Capabilities and Constraints

Reglas de negocio fijadas en `CLAUDE.md` (no se reinterpretan sin preguntar):

1. Un aporte nunca es ganancia: rendimiento neto de aportes (`rendimiento_semanal`, `rendimiento_actual`,
   `capital_por_cuenta`, columnas `*_clp`). No se restan snapshots a mano en el cliente.
2. Toda cuenta nueva se crea con el RPC `crear_cuenta_con_aporte_inicial`.
3. Cuentas USD/UF llevan `tasa_cambio` en cada snapshot y movimiento (forzado por trigger).
4. El total consolidado se calcula en pesos con la tasa histórica de cada registro, no la de hoy.
5. Rendimiento por cuenta en moneda nativa; total del portafolio en CLP con efecto cambiario.

Además:

- Cambios de lógica financiera, esquema, RLS o auth requieren aprobación explícita; cambios de firma SQL llevan
  `drop function if exists`; cambios de vistas/RLS se prueban con dos usuarios con datos simultáneos.
- Montos en notación chilena: coma decimal, punto de miles.
- Stack: Next.js 16, React 19, Tailwind 4, Supabase (`@supabase/ssr`), Recharts, Resend, Vercel. `main`
  despliega a producción: nada se mergea ni despliega sin autorización.
- Sin conexiones bancarias simuladas, sin datos ni cifras inventadas.
- Fuera de alcance actual: importación de historial, compartir portafolio, Dietz modificado.

## Brand Commitments

- Nombre: **Mi portafolio**. Español de Chile, directo, sin jerga innecesaria; los términos técnicos (TWR, XIRR)
  siempre con explicación al lado.
- Verde y rojo significan ganancia y pérdida, y nada más. Un aporte nunca se muestra como ganancia (ni en verde
  ni con "+").

## Evidence on Hand

- Sin testimonios reales. `src/components/TestimonialsSection.tsx` contiene marcadores "TODO" y no se usa en
  ninguna página: no mostrar testimonios ni inventarlos.
- Sin usuarios externos, métricas de uso, clientes ni prensa todavía.
- Cifras de ejemplo solo si están rotuladas como ilustrativas; nunca presentadas como datos reales.
- Documentación de producto: `PROYECTO.md`, `CLAUDE.md`, `PLAN.md`, `docs/hallazgos-rediseno.md`.

## Product Principles

1. **La verdad antes que el entusiasmo.** Ninguna pantalla puede hacer que un depósito parezca ganancia ni que un
   retiro parezca pérdida.
2. **Rápido en el celular, profundo en el computador.** Registrar un valor debe tomar segundos; el análisis puede
   ser denso.
3. **Explicar cada métrica.** Las metodologías distintas (real, TWR, XIRR, anualizado) se rotulan y explican, nunca
   se presentan como equivalentes.
4. **Privado y manual por diseño.** El usuario controla sus datos; nada se conecta ni se comparte solo.
5. **Preparado para abrirse.** Lo que se construye para un usuario debe funcionar para muchos, cada uno aislado
   (RLS probado con varios usuarios).

## Accessibility & Inclusion

WCAG 2.2 AA en todas las rutas (verificado con axe en anchos de 320 a 1440 px). Ganancia y pérdida nunca se
comunican solo con color (signo, ícono o texto). Respeta `prefers-reduced-motion`.
