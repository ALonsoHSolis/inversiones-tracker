import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { TrustFaq, PREGUNTAS } from "@/components/TrustFaq";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Mi portafolio — todas tus inversiones, con tu rendimiento real",
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

const BENEFICIOS = [
  {
    titulo: "Todas tus plataformas, un solo lugar",
    texto:
      "Fondos mutuos, acciones, ahorro, cripto — sin importar en qué banco o corredora estén, todo se ve junto y consolidado en pesos.",
    ancho: true,
    icon: (
      <>
        <rect x="3" y="4" width="18" height="4" rx="1.5" />
        <rect x="3" y="10" width="18" height="4" rx="1.5" />
        <rect x="3" y="16" width="18" height="4" rx="1.5" />
      </>
    ),
  },
  {
    titulo: "Con la tasa de cada día",
    texto: "Cuentas en USD o UF se convierten a CLP con la tasa real del día de cada aporte, no la de hoy.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9.3 9.2h3.4a1.9 1.9 0 010 3.8H9.8h3.2a1.9 1.9 0 010 3.8H9.3" />
      </>
    ),
  },
  {
    titulo: "Rendimiento que descuenta tus aportes",
    texto: "Cada depósito o retiro se resta antes de calcular, y nunca se confunde con ganancia.",
    icon: (
      <>
        <path d="M4 15l5-5 4 4 7-8" />
        <path d="M4 20h16" />
      </>
    ),
  },
  {
    titulo: "Benchmark contra S&P 500 y UF",
    texto:
      "Compara tu rendimiento contra el mercado y contra la inflación, para saber si de verdad le estás ganando o perdiendo.",
    ancho: true,
    icon: (
      <>
        <path d="M3 17l5-6 4 3 4-7 5 6" />
        <path d="M3 21h18" />
      </>
    ),
  },
];

const PASOS = [
  { titulo: "Agrega tus cuentas", texto: "Con su valor actual. Es lo único que necesitamos para partir." },
  { titulo: "Actualiza cuando quieras", texto: "Anota el valor que ves en tu plataforma, y si hiciste un aporte o retiro." },
  { titulo: "Mira tu ganancia real", texto: "Contra tu capital aportado y contra el mercado, sin espejismos." },
];

const retraso = (ms: number) => ({ animationDelay: `${ms}ms` });

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
      <SiteNav />

      <main className="max-w-[1160px] mx-auto px-6 pt-9 pb-16">
        {/* hero */}
        <section className="relative grid grid-cols-1 md:grid-cols-[1fr_1.02fr] gap-10 md:gap-[56px] items-center py-10 md:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-0 w-[560px] h-[560px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(205,174,118,0.10), transparent 65%)" }}
          />
          <div className="relative animate-fade-up">
            <span className="inline-flex items-center gap-[7px] px-3 py-1.5 rounded-full border border-accent/25 bg-accent/10 text-accent-hi text-micro font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-hi" />
              Hecho para inversionistas en Chile
            </span>
            <h1 className="mt-6 font-semibold text-[38px] md:text-[48px] leading-[1.06] tracking-[-0.03em] max-w-[560px] text-fg">
              Todas tus inversiones en un solo lugar, con{" "}
              <span className="text-[var(--accent)]">tu ganancia real</span> — no con espejismos.
            </h1>
            <p className="mt-4 text-[14px] font-semibold text-fg-soft max-w-[500px]">
              Un aporte no es ganancia. Tu portafolio debería saber la diferencia.
            </p>
            <p className="mt-3 text-[15px] md:text-base leading-[1.6] text-fg-muted max-w-[500px]">
              Mi portafolio junta tus cuentas de distintas plataformas, las consolida en pesos chilenos y calcula tu
              rendimiento real — descontando siempre lo que depositaste o retiraste, para que nunca confundas un
              aporte con una ganancia.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center whitespace-nowrap h-12 px-6 w-full sm:w-auto rounded-[11px] bg-[var(--accent)] text-ink text-[15px] font-semibold no-underline transition-[transform,background-color] duration-150 hover:bg-accent-hi active:scale-[0.98]"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center whitespace-nowrap h-12 px-5 w-full sm:w-auto rounded-[11px] border border-white/[0.14] text-[15px] font-semibold text-fg no-underline transition-[transform,border-color] duration-150 hover:border-white/[0.28] active:scale-[0.98]"
              >
                Ya tengo cuenta
              </Link>
            </div>
            <p className="mt-5 text-micro text-fg-subtle">
              Gratis · sin conectar tu banco ·{" "}
              <Link href="/como-funciona" className="text-fg-muted border-b border-white/[0.14]">
                ver cómo se calcula
              </Link>
            </p>
          </div>

          <div className="relative animate-fade-up" style={retraso(120)}>
            <div className="card p-6 md:p-7 shadow-[0_60px_120px_-40px_rgba(205,174,118,0.16),0_30px_70px_-30px_rgba(0,0,0,0.75)]">
              <p className="text-micro uppercase tracking-[0.12em] font-semibold text-fg-subtle">
                Valor total del portafolio
              </p>
              <p className="font-mono-tabular mt-2.5 font-medium text-[38px] leading-none tracking-[-0.025em] text-fg">
                $17.491.080
              </p>

              <div className="mt-5 pt-5 border-t border-white/[0.07]">
                <p className="text-micro uppercase tracking-[0.12em] font-semibold text-fg-muted">Ganancia real</p>
                <p className="font-mono-tabular mt-1.5 text-[24px] font-semibold leading-tight text-pos">
                  +$1.591.080 <span className="text-small font-medium">(+10,0%)</span>
                </p>
                <div className="mt-3 h-2 rounded-full bg-white/[0.06] overflow-hidden flex">
                  <div className="h-full bg-accent/70" style={{ width: "90.9%" }} />
                  <div className="h-full bg-pos" style={{ width: "9.1%" }} />
                </div>
                <div className="mt-3 flex justify-between gap-3 text-micro text-fg-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-accent/70" />
                    Capital aportado <span className="font-mono-tabular text-fg-soft">$15.900.000</span>
                  </span>
                </div>
              </div>

              <svg
                viewBox="0 0 300 100"
                width="100%"
                height="104"
                preserveAspectRatio="none"
                className="block mt-5 overflow-visible"
                aria-hidden="true"
              >
                <line x1="0" y1="33" x2="300" y2="33" stroke="rgba(255,255,255,.05)" />
                <line x1="0" y1="66" x2="300" y2="66" stroke="rgba(255,255,255,.05)" />
                <path
                  d="M0 78 L110 78 L110 68 L185 68 L185 56 L250 56 L250 46 L300 46 L300 100 L0 100 Z"
                  fill="rgba(255,255,255,.04)"
                />
                <path
                  d="M0 70 C40 67,70 62,100 60 C140 57,165 48,195 43 C235 36,270 31,300 24 L300 46 L250 46 L250 56 L185 56 L185 68 L110 68 L110 78 L0 78 Z"
                  fill="rgba(62,217,163,.12)"
                />
                <path
                  d="M0 78 L110 78 L110 68 L185 68 L185 56 L250 56 L250 46 L300 46"
                  fill="none"
                  stroke="rgba(255,255,255,.26)"
                  strokeWidth="1.4"
                />
                <path
                  d="M0 70 C40 67,70 62,100 60 C140 57,165 48,195 43 C235 36,270 31,300 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  pathLength="1"
                  className="hero-line-draw"
                />
                <circle
                  cx="300"
                  cy="24"
                  r="4"
                  fill="var(--color-surface-raised)"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                  className="hero-line-dot"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* el problema: el mismo deposito, dos lecturas */}
        <section className="mt-12 md:mt-16">
          <div className="max-w-[640px]">
            <p className="text-micro uppercase tracking-[0.14em] font-semibold text-accent">El problema</p>
            <h2 className="mt-3 text-[28px] md:text-[34px] font-semibold leading-[1.12] tracking-[-0.025em] text-fg">
              Depositaste $1.000.000.
              <br />
              ¿Ganaste $1.000.000?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
              Si solo miras cuánto valen tus inversiones, un depósito se ve igual que una ganancia. Así se ven las
              dos lecturas de la misma semana:
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-6 md:p-7 opacity-90">
              <p className="text-micro uppercase tracking-[0.12em] font-semibold text-fg-subtle">
                Mirando solo el valor
              </p>
              <dl className="mt-5 space-y-3 text-small">
                <div className="flex justify-between gap-4">
                  <dt className="text-fg-muted">Valor semana pasada</dt>
                  <dd className="font-mono-tabular text-fg-soft">$10.000.000</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-fg-muted">Valor hoy</dt>
                  <dd className="font-mono-tabular text-fg-soft">$11.000.000</dd>
                </div>
              </dl>
              <div className="mt-5 pt-5 border-t border-white/[0.07]">
                <p className="text-micro text-fg-muted">“Ganancia” de la semana</p>
                <p className="font-mono-tabular mt-1 text-[22px] sm:text-[28px] font-semibold text-warn">+$1.000.000 (+10%)</p>
                <p className="mt-2 text-micro text-fg-muted">Parece ganancia, pero es tu propio depósito.</p>
              </div>
            </div>

            <div className="card p-6 md:p-7 border-accent/40 shadow-[0_40px_90px_-40px_rgba(205,174,118,0.25)]">
              <p className="text-micro uppercase tracking-[0.12em] font-semibold text-accent">
                Con Mi portafolio
              </p>
              <dl className="mt-5 space-y-3 text-small">
                <div className="flex justify-between gap-4">
                  <dt className="text-fg-muted">Cambio de valor</dt>
                  <dd className="font-mono-tabular text-fg-soft">+$1.000.000</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-fg-muted">Menos tu aporte</dt>
                  <dd className="font-mono-tabular text-accent-hi">−$1.000.000</dd>
                </div>
              </dl>
              <div className="mt-5 pt-5 border-t border-white/[0.07]">
                <p className="text-micro text-fg-muted">Ganancia real de la semana</p>
                <p className="font-mono-tabular mt-1 text-[22px] sm:text-[28px] font-semibold text-fg">$0 (0,0%)</p>
                <p className="mt-2 text-micro text-fg-muted">Lo que tu dinero produjo, sin contar lo que pusiste.</p>
              </div>
            </div>
          </div>
        </section>

        {/* beneficios: bento asimetrico */}
        <section className="mt-16 md:mt-24">
          <h2 className="text-[28px] md:text-[34px] font-semibold leading-[1.12] tracking-[-0.025em] text-fg max-w-[560px]">
            Todo lo que necesitas para medir bien.
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {BENEFICIOS.map((b) => (
              <div
                key={b.titulo}
                className={`card p-6 md:p-7 transition-colors duration-200 hover:border-white/[0.16] ${
                  b.ancho ? "md:col-span-2" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-[11px] bg-accent/12 flex items-center justify-center mb-5">
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-accent-hi)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {b.icon}
                  </svg>
                </div>
                <h3 className="text-[16px] font-semibold text-fg">{b.titulo}</h3>
                <p className="mt-2 text-small text-fg-muted leading-relaxed max-w-[460px]">{b.texto}</p>
              </div>
            ))}
          </div>
          <p className="mt-6">
            <Link href="/calculadora" className="text-small font-medium text-fg-muted border-b border-white/[0.14]">
              Prueba la calculadora sin crear cuenta →
            </Link>
          </p>
        </section>

        {/* como empezar */}
        <section className="mt-16 md:mt-24">
          <h2 className="text-[28px] md:text-[34px] font-semibold leading-[1.12] tracking-[-0.025em] text-fg">
            Tres pasos, sin conectar nada.
          </h2>
          <ol className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
            {PASOS.map((paso, i) => (
              <li key={paso.titulo} className="relative pt-6 border-t border-white/[0.1]">
                <span
                  aria-hidden="true"
                  className="absolute -top-px left-0 h-px w-16 bg-accent"
                />
                <p className="font-mono-tabular text-[44px] font-medium leading-none text-accent/60">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-[16px] font-semibold text-fg">{paso.titulo}</h3>
                <p className="mt-2 text-small text-fg-muted leading-relaxed">{paso.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* confianza + preguntas */}
        <section className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-10 md:gap-14 items-start">
          <div>
            <p className="text-micro uppercase tracking-[0.14em] font-semibold text-accent">Tu información</p>
            <h2 className="mt-3 text-[28px] md:text-[34px] font-semibold leading-[1.12] tracking-[-0.025em] text-fg">
              Tú registras, nosotros calculamos.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
              No nos conectamos a ningún banco ni corredora. Funciona igual con un banco, un fondo mutuo, una
              corredora o una cuenta cripto: cualquier plataforma donde tengas plata invertida.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
              Guardamos solo los valores y fechas que tú ingresas. Nunca te pedimos claves bancarias: no hay
              scraping ni acceso automático a ninguna cuenta.
            </p>
          </div>
          <TrustFaq />
        </section>

        {/* cierre */}
        <section className="mt-16 md:mt-24">
          <div className="relative overflow-hidden rounded-[22px] border border-accent/25 bg-surface px-6 py-10 md:px-12 md:py-14 flex items-center justify-between gap-8 flex-wrap">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-32 w-[420px] h-[420px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(205,174,118,0.16), transparent 68%)" }}
            />
            <div className="relative">
              <h2 className="text-fg text-[28px] md:text-[34px] font-semibold tracking-[-0.025em] leading-[1.12]">
                Empieza a medir lo que
                <br className="hidden md:block" /> de verdad ganas.
              </h2>
              <p className="mt-3 text-fg-muted text-[15px]">Gratis, sin conectar tu banco.</p>
            </div>
            <Link
              href="/signup"
              className="relative inline-flex items-center justify-center h-12 px-7 w-full sm:w-auto rounded-[11px] bg-[var(--accent)] text-ink text-[15px] font-semibold no-underline whitespace-nowrap transition-[transform,background-color] duration-150 hover:bg-accent-hi active:scale-[0.98]"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </section>

        <PublicFooter />
      </main>
    </>
  );
}
