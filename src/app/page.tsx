import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Mi portafolio — rendimiento real de tus inversiones",
  description:
    "Consolida tus inversiones de distintas plataformas en pesos chilenos y descubre tu rendimiento real, sin confundir un aporte con una ganancia.",
};

const BENEFICIOS = [
  {
    titulo: "Todas tus plataformas, un solo lugar",
    texto: "Fondos mutuos, acciones, ahorro — sin importar en qué banco o corredora estén, todo se ve junto.",
    iconBg: "#EAF1F8",
    iconStroke: "#2A5F94",
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
    iconBg: "#EAF1F8",
    iconStroke: "#2A5F94",
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
    iconBg: "#E9F3EE",
    iconStroke: "#0B7A54",
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
    iconBg: "#EAF1F8",
    iconStroke: "#2A5F94",
    icon: (
      <>
        <path d="M3 17l5-6 4 3 4-7 5 6" />
        <path d="M3 21h18" />
      </>
    ),
  },
];

export default function LandingPage() {
  return (
    <>
      <nav className="sticky top-0 z-20 bg-[#F5F6F8]/[0.82] backdrop-blur-[10px] border-b border-[#E7E9EE]">
        <div className="max-w-[1160px] mx-auto px-6 py-[13px] flex items-center justify-between gap-4 flex-wrap">
          <Logo
            href="/"
            subtitle="Rendimiento real, no aportes disfrazados de ganancia"
            hideSubtitleOnMobile
          />
          <div className="flex items-center gap-1.5">
            <Link
              href="/como-funciona"
              className="h-9 px-3 inline-flex items-center text-[13px] font-medium text-[#40474F] no-underline"
            >
              Cómo funciona
            </Link>
            <Link
              href="/login"
              className="h-9 px-3.5 inline-flex items-center text-[13px] font-medium text-[#40474F] no-underline"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="h-9 px-[15px] inline-flex items-center rounded-[9px] bg-[var(--accent)] text-white text-[13px] font-semibold no-underline"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1160px] mx-auto px-6 pt-9 pb-16">
        <section className="grid grid-cols-1 md:grid-cols-[1.04fr_1fr] gap-8 md:gap-[52px] items-center py-9">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-[7px] px-3 py-1.5 rounded-full bg-[#EAF1F8] text-[#2A5F94] text-[12.5px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2A5F94]" />
              Hecho para inversionistas en Chile
            </span>
            <h1 className="mt-5 font-semibold text-[40px] md:text-[46px] leading-[1.08] tracking-[-0.028em] max-w-[540px]">
              Un aporte no es ganancia. Tu portafolio debería saber{" "}
              <span className="text-[var(--accent)]">la diferencia</span>.
            </h1>
            <p className="mt-5 text-[15px] md:text-base leading-[1.58] text-[#40474F] max-w-[500px]">
              Mi portafolio junta tus cuentas de distintas plataformas, las consolida en pesos chilenos
              y calcula tu rendimiento real — descontando siempre lo que depositaste o retiraste, para
              que nunca confundas un aporte con una ganancia.
            </p>
            <div className="flex items-center gap-3 mt-7">
              <Link
                href="/signup"
                className="inline-flex items-center h-12 px-[22px] rounded-[11px] bg-[var(--accent)] text-white text-[15px] font-semibold no-underline"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center h-12 px-5 rounded-[11px] border border-[#E1E4EA] bg-white text-[15px] font-semibold text-[#171a20] no-underline"
              >
                Ya tengo cuenta
              </Link>
            </div>
            <Link
              href="/como-funciona"
              className="inline-block mt-5 text-[12.5px] text-[#8A929E] border-b border-[#DADEE4]"
            >
              Ver un ejemplo de cómo se calcula →
            </Link>
          </div>

          <div className="relative animate-fade-up">
            <div className="bg-white border border-[#E7E9EE] rounded-[20px] p-[22px] shadow-[0_24px_60px_-22px_rgba(20,40,80,0.26),0_2px_6px_rgba(20,30,50,0.05)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.09em] font-semibold text-[#8A929E]">
                    Valor total del portafolio
                  </p>
                  <p className="font-mono-tabular mt-[7px] font-semibold text-[30px] tracking-[-0.02em]">
                    $17.491.080
                  </p>
                </div>
                <span className="font-mono-tabular inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E9F3EE] text-[#0B7A54] text-xs font-semibold">
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
                <line x1="0" y1="40" x2="300" y2="40" stroke="#EFF1F5" strokeWidth="1" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="#EFF1F5" strokeWidth="1" />
                <path
                  d="M0 92 L110 92 L110 80 L185 80 L185 66 L250 66 L250 54 L300 54 L300 120 L0 120 Z"
                  fill="#E4E8EF"
                />
                <path
                  d="M0 84 C40 80,70 74,100 72 C140 69,165 58,195 52 C235 44,270 38,300 30 L300 54 L250 54 L250 66 L185 66 L185 80 L110 80 L110 92 L0 92 Z"
                  fill="rgba(11,122,84,.15)"
                />
                <path
                  d="M0 92 L110 92 L110 80 L185 80 L185 66 L250 66 L250 54 L300 54"
                  fill="none"
                  stroke="#C3CBD6"
                  strokeWidth="1.4"
                />
                <path
                  d="M0 84 C40 80,70 74,100 72 C140 69,165 58,195 52 C235 44,270 38,300 30"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx="300" cy="30" r="4" fill="#fff" stroke="var(--accent)" strokeWidth="2.2" />
              </svg>
              <div className="flex gap-4 mt-3.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#6B7280] font-medium">
                  <span className="w-[9px] h-[9px] rounded-[3px] bg-[#E4E8EF] border border-[#C3CBD6]" />
                  Capital aportado
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#6B7280] font-medium">
                  <span className="w-[9px] h-[9px] rounded-[3px] bg-[rgba(11,122,84,0.3)]" />
                  Ganancia real
                </span>
              </div>
            </div>
            <div className="absolute -bottom-[18px] -left-5 bg-[#171A20] text-white rounded-[13px] px-[15px] py-[11px] shadow-[0_14px_32px_-12px_rgba(20,30,50,0.5)]">
              <p className="text-[10.5px] text-[#AEB5C0]">Ganancia real (no aportes)</p>
              <p className="font-mono-tabular mt-[3px] text-[15px] font-semibold text-[#46C99A]">+$1.591.080</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {BENEFICIOS.map((b) => (
            <div
              key={b.titulo}
              className="bg-white border border-[#E7E9EE] rounded-2xl p-[22px] shadow-[0_1px_2px_rgba(20,30,50,0.03)]"
            >
              <div
                className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-3.5"
                style={{ background: b.iconBg }}
              >
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={b.iconStroke} strokeWidth="1.8">
                  {b.icon}
                </svg>
              </div>
              <p className="text-[14.5px] font-semibold">{b.titulo}</p>
              <p className="mt-2 text-[13px] text-[#6B7280] leading-relaxed">{b.texto}</p>
            </div>
          ))}
        </div>

        <section className="mt-10">
          <div className="bg-[#171A20] rounded-[20px] p-10 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h2 className="text-white text-[26px] font-semibold tracking-[-0.02em]">
                Empieza a medir lo que de verdad ganas.
              </h2>
              <p className="mt-2 text-[#AEB5C0] text-sm">
                Gratis, sin conectar tu banco. Tú registras, nosotros calculamos.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center h-12 px-6 rounded-[11px] bg-white text-[#171A20] text-[15px] font-semibold no-underline whitespace-nowrap"
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
