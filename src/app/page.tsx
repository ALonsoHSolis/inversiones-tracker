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
    texto: "Fondos mutuos, acciones, ahorro — sin importar en qué banco o corredora estén, todo se ve junto.",
    iconBg: "rgba(139,92,246,.14)",
    iconStroke: "#B9A6F7",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="4" rx="1.5" />
        <rect x="3" y="10" width="18" height="4" rx="1.5" />
        <rect x="3" y="16" width="18" height="4" rx="1.5" />
      </>
    ),
  },
  {
    titulo: "Consolidado en pesos, con la tasa de cada día",
    texto: "Cuentas en USD o UF se convierten a CLP con la tasa de cambio real del día de cada aporte, no la de hoy.",
    iconBg: "rgba(139,92,246,.14)",
    iconStroke: "#B9A6F7",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9.3 9.2h3.4a1.9 1.9 0 010 3.8H9.8h3.2a1.9 1.9 0 010 3.8H9.3" />
      </>
    ),
  },
  {
    titulo: "Rendimiento que descuenta tus aportes",
    texto:
      "Si depositas plata a mitad de semana, no aparece como ganancia: siempre se resta el aporte antes de calcular tu rendimiento real.",
    iconBg: "rgba(62,217,163,.14)",
    iconStroke: "#3ED9A3",
    icon: (
      <>
        <path d="M4 15l5-5 4 4 7-8" />
        <path d="M4 20h16" />
      </>
    ),
  },
  {
    titulo: "Benchmark contra S&P 500 y UF",
    texto: "Compara tu rendimiento semana a semana contra el mercado, para saber si le estás ganando o perdiendo.",
    iconBg: "rgba(139,92,246,.14)",
    iconStroke: "#B9A6F7",
    icon: (
      <>
        <path d="M3 17l5-6 4 3 4-7 5 6" />
        <path d="M3 21h18" />
      </>
    ),
  },
];

const PASOS = [
  {
    titulo: "Agrega tus cuentas y su valor actual",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
  },
  {
    titulo: "Actualiza el valor cuando quieras",
    icon: (
      <>
        <path d="M4 20h4l10-10-4-4L4 16v4z" />
        <path d="M13 7l4 4" />
      </>
    ),
  },
  {
    titulo: "Mira tu ganancia real vs. el mercado",
    icon: (
      <>
        <path d="M4 17l4-5 3 3 6-8" />
        <path d="M4 21h16" />
      </>
    ),
  },
];

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
      <SiteNav />

      <main className="max-w-[1160px] mx-auto px-6 pt-9 pb-16">
        <section className="grid grid-cols-1 md:grid-cols-[1.04fr_1fr] gap-8 md:gap-[52px] items-center py-9">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-[7px] px-3 py-1.5 rounded-full bg-[rgba(139,92,246,0.14)] text-[#C4B5FD] text-[12.5px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4B5FD]" />
              Hecho para inversionistas en Chile
            </span>
            <h1 className="mt-5 font-semibold text-[40px] md:text-[46px] leading-[1.08] tracking-[-0.028em] max-w-[540px] text-[#F2F5F9]">
              Todas tus inversiones en un solo lugar, con{" "}
              <span className="text-[var(--accent)]">tu ganancia real</span> — no con espejismos.
            </h1>
            <p className="mt-3 text-[14px] font-semibold text-[#8892A0] max-w-[500px]">
              Un aporte no es ganancia. Tu portafolio debería saber la diferencia.
            </p>
            <p className="mt-3 text-[15px] md:text-base leading-[1.58] text-[#97A2B4] max-w-[500px]">
              Mi portafolio junta tus cuentas de distintas plataformas, las consolida en pesos chilenos
              y calcula tu rendimiento real — descontando siempre lo que depositaste o retiraste, para
              que nunca confundas un aporte con una ganancia.
            </p>
            <div className="flex items-center gap-3 mt-7">
              <Link
                href="/signup"
                className="inline-flex items-center h-12 px-[22px] rounded-[11px] bg-[var(--accent)] text-[#0A0D13] text-[15px] font-semibold no-underline"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center h-12 px-5 rounded-[11px] border border-white/[0.14] text-[15px] font-semibold text-[#F2F5F9] no-underline"
              >
                Ya tengo cuenta
              </Link>
            </div>
            <Link
              href="/como-funciona"
              className="inline-block mt-5 text-[12.5px] font-medium text-[#5B6472] border-b border-white/[0.14]"
            >
              Ver un ejemplo de cómo se calcula →
            </Link>
          </div>

          <div className="relative animate-fade-up">
            <div className="bg-[rgba(22,27,38,0.6)] backdrop-blur-[28px] border border-white/[0.09] rounded-[20px] p-[22px] shadow-[0_50px_110px_-30px_rgba(139,92,246,0.28),0_30px_70px_-30px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.09em] font-semibold text-[#7C8798]">
                    Valor total del portafolio
                  </p>
                  <p className="font-mono-tabular mt-[7px] font-semibold text-[30px] tracking-[-0.02em] text-[#F2F5F9]">
                    $17.491.080
                  </p>
                </div>
                <span className="font-mono-tabular inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(62,217,163,0.15)] text-[#3ED9A3] text-xs font-semibold">
                  <span className="text-[9px]">▲</span> +10,0%
                </span>
              </div>
              <svg
                viewBox="0 0 300 120"
                width="100%"
                height="128"
                preserveAspectRatio="none"
                className="block mt-4 overflow-visible"
              >
                <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(255,255,255,.06)" strokeWidth="1" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,.06)" strokeWidth="1" />
                <path
                  d="M0 92 L110 92 L110 80 L185 80 L185 66 L250 66 L250 54 L300 54 L300 120 L0 120 Z"
                  fill="rgba(255,255,255,.05)"
                />
                <path
                  d="M0 84 C40 80,70 74,100 72 C140 69,165 58,195 52 C235 44,270 38,300 30 L300 54 L250 54 L250 66 L185 66 L185 80 L110 80 L110 92 L0 92 Z"
                  fill="rgba(62,217,163,.14)"
                />
                <path
                  d="M0 92 L110 92 L110 80 L185 80 L185 66 L250 66 L250 54 L300 54"
                  fill="none"
                  stroke="rgba(255,255,255,.28)"
                  strokeWidth="1.4"
                />
                <path
                  d="M0 84 C40 80,70 74,100 72 C140 69,165 58,195 52 C235 44,270 38,300 30"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  pathLength="1"
                  className="hero-line-draw"
                />
                <circle
                  cx="300"
                  cy="30"
                  r="4"
                  fill="#12161F"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                  className="hero-line-dot"
                />
              </svg>
              <div className="flex items-center justify-between gap-3 mt-3.5 flex-wrap">
                <div className="flex gap-4">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-[#8892A0] font-medium">
                    <span className="w-[9px] h-[9px] rounded-[3px] bg-white/[0.08] border border-white/[0.28]" />
                    Capital aportado
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-[#8892A0] font-medium">
                    <span className="w-[9px] h-[9px] rounded-[3px] bg-[rgba(62,217,163,0.3)]" />
                    Ganancia real
                  </span>
                </div>
                <div className="bg-[rgba(10,13,19,0.94)] border border-[rgba(62,217,163,0.3)] rounded-[10px] px-3 py-1.5 text-right">
                  <p className="text-[9.5px] text-[#8892A0] leading-none">Ganancia real (no aportes)</p>
                  <p className="font-mono-tabular mt-[3px] text-[13px] font-semibold text-[#3ED9A3] leading-none">
                    +$1.591.080
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TrustFaq />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {BENEFICIOS.map((b) => (
            <div
              key={b.titulo}
              className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] border-t-[3px] border-t-[#3ED9A3] rounded-2xl p-[22px] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)]"
            >
              <div
                className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-3.5"
                style={{ background: b.iconBg }}
              >
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={b.iconStroke} strokeWidth="1.8">
                  {b.icon}
                </svg>
              </div>
              <h3 className="text-[14.5px] font-semibold text-[#F2F5F9]">{b.titulo}</h3>
              <p className="mt-2 text-[13px] text-[#97A2B4] leading-relaxed">{b.texto}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-5">
          <Link
            href="/calculadora"
            className="text-[13px] font-medium text-[#97A2B4] border-b border-white/[0.14]"
          >
            Prueba la calculadora sin crear cuenta →
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-center text-[#F2F5F9]">Cómo empezar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {PASOS.map((paso, i) => (
              <div
                key={paso.titulo}
                className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-5"
              >
                <p className="font-mono-tabular text-[36px] font-bold text-white/[0.09] leading-none">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <div className="mt-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[9px] bg-[rgba(139,92,246,0.14)] flex items-center justify-center shrink-0">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B9A6F7" strokeWidth="1.8">
                      {paso.icon}
                    </svg>
                  </div>
                  <p className="text-[13.5px] font-semibold text-[#F2F5F9]">{paso.titulo}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-[22px]">
            <p className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[#5B6472]">
              Funciona con tus cuentas donde sea que estén
            </p>
            <p className="mt-2.5 text-[13.5px] text-[#97A2B4] leading-relaxed">
              No nos conectamos a ningún banco ni corredora — tú registras el valor que ves en tu
              cuenta y nosotros calculamos. Por eso funciona igual con un banco, una corredora, un
              fondo mutuo o una cuenta cripto: cualquier plataforma donde tengas plata invertida.
            </p>
          </div>
          <div className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-[22px]">
            <p className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[#5B6472]">
              Qué guardamos (y qué no)
            </p>
            <p className="mt-2.5 text-[13.5px] text-[#97A2B4] leading-relaxed">
              Guardamos los valores y fechas que tú ingresas manualmente. Nunca te pedimos tus
              claves bancarias ni nos conectamos a tu banco: no hay scraping ni acceso automático a
              ninguna cuenta.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="bg-white/[0.03] border border-[rgba(139,92,246,0.22)] rounded-[20px] p-10 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h2 className="text-[#F2F5F9] text-[26px] font-semibold tracking-[-0.02em]">
                Empieza a medir lo que de verdad ganas.
              </h2>
              <p className="mt-2 text-[#97A2B4] text-sm">
                Gratis, sin conectar tu banco. Tú registras, nosotros calculamos.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center h-12 px-6 rounded-[11px] bg-white text-[#0A0D13] text-[15px] font-semibold no-underline whitespace-nowrap"
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
