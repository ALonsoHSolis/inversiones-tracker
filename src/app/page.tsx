import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PREGUNTAS } from "@/components/TrustFaq";
import { AccountRow } from "@/components/AccountRow";
import { MetricasSecundarias } from "@/components/MetricasSecundarias";
import { DistribucionDetalle } from "@/components/DistribucionCard";
import { MetasList } from "@/components/MetasList";
import { PatrimonioHero } from "@/components/PatrimonioHero";
import { CalculoVivo } from "@/components/landing/CalculoVivo";
import { Revelar } from "@/components/landing/Revelar";
import { serieEjemplo } from "@/lib/demo-landing";
import type { Cuenta, RendimientoActual } from "@/types/database";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Mi portafolio — todo tu patrimonio, una perspectiva más clara",
  description:
    "Consolida tus inversiones de distintas plataformas en pesos chilenos y descubre tu rendimiento real, sin confundir un aporte con una ganancia.",
  alternates: { canonical: "/" },
};

// datos estructurados para google: FAQPage (misma fuente que TrustFaq, sin
// duplicar contenido) habilita rich snippets de preguntas frecuentes en el
// buscador; SoftwareApplication describe el producto en si.
function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Mi portafolio",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "CLP" },
        description:
          "Consolida inversiones de distintas plataformas en pesos chilenos y calcula el rendimiento real, descontando aportes y retiros.",
      },
      {
        "@type": "FAQPage",
        mainEntity: PREGUNTAS.map((p) => ({
          "@type": "Question",
          name: p.pregunta,
          acceptedAnswer: { "@type": "Answer", text: p.respuesta },
        })),
      },
    ],
  };
}

// preguntas extra de la landing (ademas de las de privacidad de TrustFaq):
// lo que un visitante necesita saber antes de registrarse. sin promesas que
// el producto no cumpla.
const PREGUNTAS_LANDING = [
  {
    pregunta: "¿Es un banco o una corredora?",
    respuesta:
      "No. Mi portafolio no mueve, custodia ni administra tu dinero, y no recomienda inversiones. Es una herramienta para que tú lleves el registro y veas tu rendimiento real.",
  },
  {
    pregunta: "¿Funciona con dólares y UF?",
    respuesta:
      "Sí. Cada cuenta lleva su moneda (CLP, USD o UF) y el total se consolida en pesos con la tasa del Banco Central del día de cada registro, que se completa sola.",
  },
  ...PREGUNTAS,
  {
    pregunta: "¿Cuánto cuesta?",
    respuesta: "Crear una cuenta y usar la app es gratis.",
  },
];

// ---- fragmentos de la interfaz real con datos de EJEMPLO (rotulados) ----
const AHORA = Date.UTC(2026, 10, 2);
function cuentaEjemplo(id: string, nombre: string, plataforma: string, tipo: string, moneda: string): Cuenta {
  return { id, nombre, plataforma, tipo, moneda, activa: true, categoria: null, created_at: "2026-01-05T00:00:00Z", user_id: "ejemplo" };
}
function rendEjemplo(cuenta_id: string, valor: number, valor_clp: number, pct: number): RendimientoActual {
  return {
    cuenta_id, valor, valor_clp, rendimiento_pct: pct, aportes_netos: 0, nombre: null, moneda: null, fecha: "2026-10-30",
    valor_anterior: null, valor_clp_anterior: null, ganancia_real: null, tasa_cambio: null, tasa_cambio_anterior: null,
  };
}
const CUENTAS_EJEMPLO = [
  { c: cuentaEjemplo("e1", "Fondo conservador", "Corredora A", "fondo_mutuo", "CLP"), r: rendEjemplo("e1", 4_820_000, 4_820_000, 0.4), serie: [4.5, 4.55, 4.6, 4.58, 4.66, 4.7, 4.75, 4.82] },
  { c: cuentaEjemplo("e2", "Acciones EE.UU.", "Corredora B", "acciones", "USD"), r: rendEjemplo("e2", 3_910, 3_640_000, 1.7), serie: [3.1, 3.3, 3.2, 3.45, 3.4, 3.55, 3.5, 3.64] },
  { c: cuentaEjemplo("e3", "Depósito en UF", "Banco C", "deposito_plazo", "UF"), r: rendEjemplo("e3", 72.4, 2_760_000, 0.1), serie: [2.7, 2.71, 2.72, 2.73, 2.74, 2.75, 2.755, 2.76] },
];

const ENCABEZADO = "font-semibold tracking-[-0.035em] leading-[1.02] text-fg";

export default function LandingPage() {
  const serie = serieEjemplo();
  const ultimo = serie[serie.length - 1];

  return (
    <div className="landing min-h-dvh bg-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
      <SiteNav />

      <main id="contenido">
        {/* HERO: la frase es la composicion; la palabra "patrimonio" lleva al
            lado un fragmento vivo del producto (su linea real, en ejemplo). */}
        <section className="landing-marco flex min-h-[88svh] flex-col justify-center pt-16 pb-20" aria-labelledby="titulo-landing">
          <h1 id="titulo-landing" className={`landing-titular ${ENCABEZADO}`}>
            <span className="landing-linea">
              <span>
                Todo tu patrimonio.
                <span data-ui aria-hidden="true" className="landing-ventana">
                  <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                    <path d="M0 33 L20 33 L20 26 L52 26 L52 17 L86 17 L86 11 L120 11" fill="none" stroke="rgba(211,218,230,.55)" strokeWidth="1.6" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                    <path d="M0 31 L12 29 L20 24 L34 22 L46 20 L52 14 L66 12 L78 13 L86 8 L100 6 L120 3" fill="none" stroke="#e0bc78" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
                  </svg>
                </span>
              </span>
            </span>
            <span className="landing-linea">
              <span>Una perspectiva más clara.</span>
            </span>
          </h1>
          <div className="landing-sube mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <p className="max-w-[46ch] text-[clamp(1.0625rem,1.6vw,1.25rem)] leading-relaxed text-fg-soft">
              Sigue tus inversiones, comprende tu rentabilidad y visualiza cómo evoluciona tu dinero desde un solo lugar.
              Un aporte nunca se cuenta como ganancia.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/signup" className="boton-primario h-12 px-6 text-base no-underline">
                Crear cuenta gratis
              </Link>
              <Link href="/login" className="text-base font-medium text-fg-soft underline decoration-white/25 underline-offset-[6px] hover:text-fg">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>

        {/* LA PRUEBA: el producto en vivo, con datos de ejemplo */}
        <Revelar as="section" className="landing-marco landing-seccion" >
          <div data-revelar className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className={`max-w-[18ch] text-[clamp(2.25rem,5vw,4.25rem)] ${ENCABEZADO}`}>Tu patrimonio, día por día.</h2>
            <p className="max-w-[38ch] text-base text-fg-muted">
              Así se ve tu inicio. Recorre el gráfico con el dedo o el mouse: la cifra cambia a la de ese día.
              <span className="ml-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-small font-medium text-fg-soft">Datos de ejemplo</span>
            </p>
          </div>
          <div data-revelar data-ui className="landing-producto">
            <PatrimonioHero
              puntos={serie}
              valorTotal={ultimo.totalClp}
              capitalAportadoClp={ultimo.capitalClp}
              valorActualClp={ultimo.totalClp}
              sinCuentas={false}
              pie={null}
              claveSesion="landing-ejemplo"
              etiqueta="Patrimonio total (ejemplo)"
            />
          </div>
        </Revelar>

        {/* EL ARGUMENTO: un aporte no es ganancia, con el calculo vivo */}
        <Revelar as="section" className="landing-marco landing-seccion grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
          <div data-revelar>
            <h2 className={`text-[clamp(2.25rem,5vw,4.25rem)] ${ENCABEZADO}`}>Un aporte no es ganancia.</h2>
            <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-fg-soft">
              Si depositas un millón y tu saldo sube un millón, no ganaste nada. Tu banco te muestra el saldo; Mi
              portafolio te muestra lo que tu dinero produjo de verdad. Prueba con tus números.
            </p>
          </div>
          <div data-revelar>
            <CalculoVivo />
          </div>
        </Revelar>

        {/* COMO FUNCIONA: las tres etapas como una sola barra */}
        <Revelar as="section" className="landing-marco landing-seccion" >
          <h2 data-revelar className={`max-w-[16ch] text-[clamp(2.25rem,5vw,4.25rem)] ${ENCABEZADO}`}>Sin conectar tu banco.</h2>
          <div data-revelar className="landing-etapas mt-12">
            {[
              { tiempo: "Un minuto", texto: "Agregas una cuenta con su valor de hoy. Ese monto queda como capital aportado." },
              { tiempo: "Segundos", texto: "Cuando quieras, anotas el valor que ves en tu banco o corredora y marcas si hubo un aporte o retiro." },
              { tiempo: "Al instante", texto: "Ves tu patrimonio en pesos, tu ganancia real y cómo se compara con la UF y el mercado." },
            ].map((e) => (
              <div key={e.tiempo} className="landing-etapa">
                <p className="text-[clamp(1.25rem,2vw,1.875rem)] font-semibold tracking-[-0.02em] text-ink">{e.tiempo}</p>
                <p className="mt-auto max-w-[30ch] text-base leading-snug text-ink/80">{e.texto}</p>
              </div>
            ))}
          </div>
          <p data-revelar className="mt-6 max-w-[60ch] text-base text-fg-muted">
            Nunca te pedimos claves bancarias. Tú escribes los valores; la tasa del dólar y de la UF se completa sola con
            el dato del Banco Central.
          </p>
        </Revelar>

        {/* LO QUE VES: filas con fragmentos reales de la interfaz */}
        <section className="landing-marco landing-seccion" aria-labelledby="titulo-vista">
          <h2 id="titulo-vista" className={`landing-eje max-w-[14ch] text-[clamp(2.25rem,5vw,4.25rem)] ${ENCABEZADO}`}>
            Todo en un solo lugar.
          </h2>
          <div className="mt-16 flex flex-col gap-24">
            <Revelar className="landing-fila">
              <div data-revelar className="landing-eje">
                <h3 className="text-[clamp(1.5rem,2.6vw,2.5rem)] font-semibold tracking-[-0.025em] text-fg">Tus cuentas, en pesos</h3>
                <p className="mt-3 max-w-[38ch] text-base leading-relaxed text-fg-soft">
                  Fondos, acciones, depósitos y cripto de distintas plataformas, cada una en su moneda y consolidada en
                  pesos con la tasa de cada registro.
                </p>
              </div>
              <div data-revelar data-ui className="panel landing-fragmento px-4 py-2">
                <ul className="lista-filas">
                  {CUENTAS_EJEMPLO.map(({ c, r, serie: s }) => (
                    <AccountRow
                      key={c.id}
                      cuenta={c}
                      rendimiento={r}
                      valorActualFallback={r.valor}
                      valorClpFallback={r.valor_clp}
                      capitalAportadoFallback={null}
                      ultimaFechaFallback="2026-10-30"
                      ahoraMs={AHORA}
                      serie={s.map((v) => v * 1_000_000)}
                    />
                  ))}
                </ul>
              </div>
            </Revelar>
            <Revelar className="landing-fila">
              <div data-revelar className="landing-eje">
                <h3 className="text-[clamp(1.5rem,2.6vw,2.5rem)] font-semibold tracking-[-0.025em] text-fg">Rentabilidad que se explica</h3>
                <p className="mt-3 max-w-[38ch] text-base leading-relaxed text-fg-soft">
                  Rendimiento sin aportes (TWR), retorno anualizado (XIRR) y peor caída, cada uno con su nombre y su
                  explicación. Ninguno se presenta como si fuera el otro.
                </p>
              </div>
              <div data-revelar data-ui className="landing-fragmento">
                <MetricasSecundarias twr={6.2} xirr={7.4} drawdown={-3.1} />
              </div>
            </Revelar>
            <Revelar className="landing-fila">
              <div data-revelar className="landing-eje">
                <h3 className="text-[clamp(1.5rem,2.6vw,2.5rem)] font-semibold tracking-[-0.025em] text-fg">Dónde está tu dinero</h3>
                <p className="mt-3 max-w-[38ch] text-base leading-relaxed text-fg-soft">
                  Por plataforma, tipo de activo o categoría propia, con un aviso cuando una sola parte concentra más del
                  40 % de tu patrimonio.
                </p>
              </div>
              <div data-revelar data-ui className="panel landing-fragmento px-5 py-4">
                <DistribucionDetalle
                  vacio=""
                  grupos={[
                    { nombre: "Corredora A", capitalAportadoClp: 4_600_000, valorActualClp: 4_820_000 },
                    { nombre: "Corredora B", capitalAportadoClp: 3_300_000, valorActualClp: 3_640_000 },
                    { nombre: "Banco C", capitalAportadoClp: 2_700_000, valorActualClp: 2_760_000 },
                  ]}
                />
              </div>
            </Revelar>
            <Revelar className="landing-fila">
              <div data-revelar className="landing-eje">
                <h3 className="text-[clamp(1.5rem,2.6vw,2.5rem)] font-semibold tracking-[-0.025em] text-fg">Metas con progreso real</h3>
                <p className="mt-3 max-w-[38ch] text-base leading-relaxed text-fg-soft">
                  Asocia cuentas a una meta (el pie de un departamento, un fondo de emergencia) y ve cuánto te falta con su
                  valor actual.
                </p>
              </div>
              <div data-revelar data-ui className="panel landing-fragmento px-5 py-2">
                <MetasList
                  compacta
                  metas={[
                    { id: "m1", nombre: "Pie departamento", montoObjetivo: 20_000_000, montoActualClp: 8_460_000, fechaObjetivo: "2028-03-01", cuentasAsociadas: ["Fondo conservador", "Acciones EE.UU."] },
                    { id: "m2", nombre: "Fondo de emergencia", montoObjetivo: 2_500_000, montoActualClp: 2_760_000, fechaObjetivo: null, cuentasAsociadas: ["Depósito en UF"] },
                  ]}
                />
              </div>
            </Revelar>
          </div>
          <p className="landing-eje mt-12 text-small text-fg-muted">Los montos de estas pantallas son de ejemplo.</p>
        </section>

        {/* PREGUNTAS: todas abiertas, la pregunta grande y la respuesta al lado */}
        <section className="landing-marco landing-seccion" aria-labelledby="titulo-preguntas">
          <dl className="landing-preguntas">
            <div className="landing-pregunta">
              <dt>
                <h2 id="titulo-preguntas" className="text-fg-muted">Preguntas</h2>
              </dt>
              <dd />
            </div>
            {PREGUNTAS_LANDING.map((p) => (
              <div key={p.pregunta} className="landing-pregunta">
                <dt className="text-fg">{p.pregunta}</dt>
                <dd className="text-base leading-relaxed text-fg-soft">{p.respuesta}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* CIERRE: la pregunta en los dos bordes, la decision al centro */}
        <section className="landing-cierre landing-marco" aria-labelledby="titulo-cierre">
          <h2 id="titulo-cierre" className="sr-only">¿Cuánto ganaste de verdad?</h2>
          <p aria-hidden="true" className={`landing-cierre-linea ${ENCABEZADO}`}>¿Cuánto ganaste</p>
          <div className="landing-cierre-centro">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
              <Link href="/signup" className="boton-primario h-14 w-[min(72vw,240px)] text-lg no-underline">
                Crear cuenta gratis
              </Link>
              <span className="text-lg text-fg-muted">o</span>
              <Link href="/calculadora" className="boton-secundario h-14 w-[min(72vw,240px)] text-lg no-underline">
                Probar la calculadora
              </Link>
            </div>
            <p className="mt-4 text-center text-base text-fg-muted">Gratis, sin conectar tu banco. La calculadora no necesita cuenta.</p>
          </div>
          <p aria-hidden="true" className={`landing-cierre-linea ${ENCABEZADO}`}>de verdad?</p>
        </section>
      </main>

      <div className="landing-marco">
        <PublicFooter />
      </div>
    </div>
  );
}
