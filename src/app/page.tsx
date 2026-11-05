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
import { TelefonoApp } from "@/components/landing/TelefonoApp";

export const metadata: Metadata = {
  title: "Mi portafolio — ¿cuánto ganaste de verdad?",
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

// titulares en peso regular con la palabra clave destacada (dorado legible
// sobre claro con --color-accent-ink; sobre navy el mismo token es dorado claro)
const ENCABEZADO = "font-normal tracking-[-0.03em] leading-[1.05] text-fg";
const CLAVE = "font-semibold text-accent-ink";

const PILDORAS = ["Pesos, dólares y UF", "Sin conectar tu banco", "Gratis"];

export default function LandingPage() {
  const serie = serieEjemplo();
  const ultimo = serie[serie.length - 1];

  return (
    <div className="landing min-h-dvh bg-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
      <SiteNav />

      <main id="contenido">
        {/* HERO: banda navy con el titular, pildoras de vidrio y la app real
            (con datos de ejemplo) dentro de un celular */}
        <section className="tema-navy landing-hero" aria-labelledby="titulo-landing">
          <div className="landing-marco grid items-center gap-14 pt-36 pb-0 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:pt-44">
            <div className="text-center lg:text-left">
              <h1 id="titulo-landing" className={`landing-titular ${ENCABEZADO}`}>
                <span className="landing-linea">
                  <span>¿Cuánto ganaste</span>
                </span>
                <span className="landing-linea">
                  <span>
                    <strong className={CLAVE}>de verdad</strong>?
                  </span>
                </span>
              </h1>
              <ul className="landing-sube mt-8 flex flex-wrap justify-center gap-2.5 lg:justify-start" aria-label="En resumen">
                {PILDORAS.map((p) => (
                  <li key={p} className="vidrio pildora-vidrio">
                    {p}
                  </li>
                ))}
              </ul>
              <p className="landing-sube mx-auto mt-7 max-w-[46ch] text-[clamp(1.0625rem,1.6vw,1.25rem)] leading-relaxed text-fg-soft lg:mx-0">
                Sigue tus inversiones de distintas plataformas, comprende tu rentabilidad y mira cómo evoluciona tu
                dinero desde un solo lugar. Un aporte nunca se cuenta como ganancia.
              </p>
              <div className="landing-sube mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link href="/signup" className="boton-primario h-12 px-6 text-base no-underline">
                  Crear cuenta gratis
                </Link>
                <Link href="/login" className="vidrio boton-vidrio h-12 px-6 text-base no-underline">
                  Ya tengo cuenta
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[340px] lg:max-w-[360px]">
              <TelefonoApp puntos={serie} className="flotar" />
              <p className="mt-3 pb-10 text-center text-micro text-fg-muted">Datos de ejemplo</p>
            </div>
          </div>
        </section>

        {/* LA PRUEBA: el inicio real, interactivo, con datos de ejemplo */}
        <Revelar as="section" className="landing-marco landing-seccion">
          <div data-revelar className="mb-10 text-center">
            <p className="text-small font-semibold text-accent-ink">Tu inicio</p>
            <h2 className={`mx-auto mt-3 max-w-[20ch] text-[clamp(2.25rem,4.6vw,3.5rem)] ${ENCABEZADO}`}>
              Tu patrimonio, <strong className={CLAVE}>día por día</strong>.
            </h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-base text-fg-muted">
              Recorre el gráfico con el dedo o el mouse: la cifra cambia a la de ese día y cada aporte queda marcado.
              <span className="ml-1 whitespace-nowrap rounded-full bg-tint/[0.06] px-2 py-0.5 text-small font-medium text-fg-soft">Datos de ejemplo</span>
            </p>
          </div>
          <div data-revelar data-ui>
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

        {/* EL ARGUMENTO: banda navy con el calculo vivo */}
        <section className="tema-navy landing-banda" aria-labelledby="titulo-aporte">
          <Revelar className="landing-marco grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
            <div data-revelar>
              <p className="text-small font-semibold text-accent-ink">La diferencia</p>
              <h2 id="titulo-aporte" className={`mt-3 text-[clamp(2.25rem,4.6vw,3.5rem)] ${ENCABEZADO}`}>
                Un aporte <strong className={CLAVE}>no es ganancia</strong>.
              </h2>
              <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-fg-soft">
                Si depositas un millón y tu saldo sube un millón, no ganaste nada. Tu banco te muestra el saldo; Mi
                portafolio te muestra lo que tu dinero produjo de verdad. Prueba con tus números.
              </p>
            </div>
            <div data-revelar className="tema-claro rounded-[24px] p-4 sm:p-6">
              <CalculoVivo />
            </div>
          </Revelar>
        </section>

        {/* COMO FUNCIONA: tres pasos en tarjetas */}
        <Revelar as="section" className="landing-marco landing-seccion">
          <div data-revelar className="text-center">
            <p className="text-small font-semibold text-accent-ink">Cómo funciona</p>
            <h2 className={`mx-auto mt-3 max-w-[18ch] text-[clamp(2.25rem,4.6vw,3.5rem)] ${ENCABEZADO}`}>
              Sin <strong className={CLAVE}>conectar tu banco</strong>.
            </h2>
          </div>
          <ol data-revelar className="landing-etapas mt-12">
            {[
              { tiempo: "Un minuto", texto: "Agregas una cuenta con su valor de hoy. Ese monto queda como capital aportado." },
              { tiempo: "Segundos", texto: "Cuando quieras, anotas el valor que ves en tu banco o corredora y marcas si hubo un aporte o retiro." },
              { tiempo: "Al instante", texto: "Ves tu patrimonio en pesos, tu ganancia real y cómo se compara con la UF y el mercado." },
            ].map((e, i) => (
              <li key={e.tiempo} className="landing-etapa">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-small font-semibold text-on-accent">{i + 1}</span>
                <p className="text-[clamp(1.25rem,2vw,1.75rem)] font-normal tracking-[-0.02em]">{e.tiempo}</p>
                <p className="mt-auto max-w-[30ch] text-base leading-snug opacity-90">{e.texto}</p>
              </li>
            ))}
          </ol>
          <p data-revelar className="mx-auto mt-8 max-w-[60ch] text-center text-base text-fg-muted">
            Nunca te pedimos claves bancarias. Tú escribes los valores; la tasa del dólar y de la UF se completa sola con
            el dato del Banco Central.
          </p>
        </Revelar>

        {/* LO QUE VES: filas que alternan texto y fragmento real de la interfaz */}
        <section className="landing-marco landing-seccion" aria-labelledby="titulo-vista">
          <div className="text-center">
            <p className="text-small font-semibold text-accent-ink">La app</p>
            <h2 id="titulo-vista" className={`mx-auto mt-3 max-w-[16ch] text-[clamp(2.25rem,4.6vw,3.5rem)] ${ENCABEZADO}`}>
              Todo en <strong className={CLAVE}>un solo lugar</strong>.
            </h2>
          </div>
          <div className="mt-16 flex flex-col gap-6">
            <Revelar className="landing-fila">
              <div data-revelar className="landing-texto">
                <h3 className="text-[clamp(1.5rem,2.4vw,2.25rem)] font-normal tracking-[-0.025em] text-fg">Tus cuentas, en pesos</h3>
                <p className="mt-3 max-w-[38ch] text-base leading-relaxed text-fg-soft">
                  Fondos, acciones, depósitos y cripto de distintas plataformas, cada una en su moneda y consolidada en
                  pesos con la tasa de cada registro.
                </p>
              </div>
              <div data-revelar data-ui className="panel landing-fragmento px-4 py-2">
                <ul className="lista-filas">
                  {CUENTAS_EJEMPLO.map(({ c, r, serie: s }, i) => (
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
                      color={["var(--color-slate)", "var(--color-copper)", "var(--color-mauve)"][i]}
                    />
                  ))}
                </ul>
              </div>
            </Revelar>
            <Revelar className="landing-fila landing-fila-navy tema-navy">
              <div data-revelar className="landing-texto">
                <h3 className="text-[clamp(1.5rem,2.4vw,2.25rem)] font-normal tracking-[-0.025em] text-fg">Rentabilidad que se explica</h3>
                <p className="mt-3 max-w-[38ch] text-base leading-relaxed text-fg-soft">
                  Rendimiento sin aportes (TWR), retorno anualizado (XIRR) y peor caída, cada uno con su nombre y su
                  explicación. Ninguno se presenta como si fuera el otro.
                </p>
              </div>
              <div data-revelar data-ui className="tema-claro landing-fragmento rounded-[18px] p-1">
                <MetricasSecundarias twr={6.2} xirr={7.4} drawdown={-3.1} />
              </div>
            </Revelar>
            <Revelar className="landing-fila">
              <div data-revelar className="landing-texto">
                <h3 className="text-[clamp(1.5rem,2.4vw,2.25rem)] font-normal tracking-[-0.025em] text-fg">Dónde está tu dinero</h3>
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
            <Revelar className="landing-fila landing-fila-navy tema-navy">
              <div data-revelar className="landing-texto">
                <h3 className="text-[clamp(1.5rem,2.4vw,2.25rem)] font-normal tracking-[-0.025em] text-fg">Metas con progreso real</h3>
                <p className="mt-3 max-w-[38ch] text-base leading-relaxed text-fg-soft">
                  Asocia cuentas a una meta (el pie de un departamento, un fondo de emergencia) y ve cuánto te falta con su
                  valor actual.
                </p>
              </div>
              <div data-revelar data-ui className="tema-claro landing-fragmento rounded-[18px] px-5 py-2">
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
          <p className="mt-8 text-center text-small text-fg-muted">Los montos de estas pantallas son de ejemplo.</p>
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

        {/* CIERRE: tarjeta navy con degradado, titular y boton de vidrio */}
        <div className="landing-marco">
          <section className="tema-navy landing-cierre px-6" aria-labelledby="titulo-cierre">
            <h2 id="titulo-cierre" className={`landing-cierre-titular ${ENCABEZADO}`}>
              Empieza a medirlo <strong className={CLAVE}>hoy</strong>.
            </h2>
            <div className="flex flex-col items-center gap-5">
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/signup" className="boton-primario h-14 px-8 text-lg no-underline">
                  Crear cuenta gratis
                </Link>
                <Link href="/calculadora" className="vidrio boton-vidrio h-14 px-7 text-lg no-underline">
                  Probar la calculadora
                </Link>
              </div>
              <p className="text-center text-base text-fg-muted">Gratis y sin conectar tu banco. La calculadora no pide cuenta.</p>
            </div>
          </section>
        </div>
      </main>

      <div className="landing-marco">
        <PublicFooter />
      </div>
    </div>
  );
}
