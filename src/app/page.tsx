import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FeedbackLink } from "@/components/FeedbackLink";

export const metadata: Metadata = {
  title: "Mi portafolio — rendimiento real de tus inversiones",
  description:
    "Consolida tus inversiones de distintas plataformas en pesos chilenos y descubre tu rendimiento real, sin confundir un aporte con una ganancia.",
};

const BENEFICIOS = [
  {
    titulo: "Todas tus plataformas, un solo lugar",
    texto: "Fondos mutuos, acciones, ahorro — sin importar en qué banco o corredora estén, todo se ve junto.",
  },
  {
    titulo: "Consolidado en pesos, con la tasa de cada día",
    texto: "Cuentas en USD o UF se convierten a CLP con la tasa de cambio real del día de cada aporte, no la de hoy.",
  },
  {
    titulo: "Rendimiento que descuenta tus aportes",
    texto:
      "Si depositas plata a mitad de semana, no aparece como ganancia: siempre se resta el aporte antes de calcular tu rendimiento real.",
  },
  {
    titulo: "Benchmark contra S&P 500 y UF",
    texto: "Compara tu rendimiento semana a semana contra el mercado, para saber si le estás ganando o perdiendo.",
  },
];

export default function LandingPage() {
  return (
    <main className="max-w-[1160px] mx-auto px-6 pt-[26px] pb-16">
      <header className="flex items-center justify-between gap-4 mb-14">
        <Logo href="/" subtitle="Rendimiento real, no aportes disfrazados de ganancia" />
        <nav className="flex items-center gap-5">
          <Link href="/como-funciona" className="text-[13px] font-medium text-[#40474F] no-underline">
            cómo funciona
          </Link>
          <Link href="/login" className="text-[13px] font-medium text-[#40474F] no-underline">
            iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center h-9 px-4 rounded-[9px] bg-[var(--accent)] text-white text-[13px] font-semibold no-underline"
          >
            crear cuenta
          </Link>
        </nav>
      </header>

      <section className="bg-white border border-[#E7E9EE] rounded-2xl px-7 py-12 shadow-[0_1px_2px_rgba(20,30,50,0.03)] animate-fade-up text-center">
        <h1 className="max-w-[720px] mx-auto font-semibold text-[40px] leading-[1.1] tracking-[-0.02em]">
          Un aporte no es ganancia. Tu portafolio debería saber la diferencia.
        </h1>
        <p className="max-w-[560px] mx-auto mt-5 text-[15px] text-[#40474F]">
          Mi portafolio junta tus cuentas de distintas plataformas, las consolida en pesos chilenos
          y calcula tu rendimiento real — descontando siempre lo que depositaste o retiraste, para
          que nunca confundas un aporte con una ganancia.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            href="/signup"
            className="inline-flex items-center h-11 px-6 rounded-[9px] bg-[var(--accent)] text-white text-[14px] font-semibold no-underline"
          >
            crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center h-11 px-6 rounded-[9px] border border-[#E1E4EA] text-[14px] font-semibold text-[#171a20] no-underline"
          >
            ya tengo cuenta
          </Link>
        </div>
        <Link
          href="/como-funciona"
          className="inline-block mt-6 text-[12.5px] text-[#8A929E] border-b border-[#DADEE4]"
        >
          ver un ejemplo de cómo se calcula →
        </Link>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {BENEFICIOS.map((b) => (
          <div
            key={b.titulo}
            className="bg-white border border-[#E7E9EE] rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,30,50,0.03)]"
          >
            <p className="text-[13.5px] font-semibold">{b.titulo}</p>
            <p className="mt-1.5 text-[12.5px] text-[#8A929E] leading-relaxed">{b.texto}</p>
          </div>
        ))}
      </div>

      <footer className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-[#E7E9EE]">
        <p className="text-[11.5px] text-[#B4BAC3]">Mi portafolio</p>
        <FeedbackLink className="text-[12.5px] text-[#8A929E] border-b border-[#DADEE4]" />
      </footer>
    </main>
  );
}
