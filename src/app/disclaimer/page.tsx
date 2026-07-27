import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FeedbackLink } from "@/components/FeedbackLink";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Disclaimer financiero — Mi portafolio",
  description: "Mi portafolio no es asesoría financiera — el alcance real de sus cálculos.",
  alternates: { canonical: "/disclaimer" },
};

const legalNavClass = "text-[12.5px] no-underline";

export default function DisclaimerPage() {
  return (
    <main className="max-w-[1160px] mx-auto px-6 pt-[26px] pb-16">
      <header className="flex items-center justify-between gap-4 mb-10">
        <Logo href="/" />
        <Link href="/" className="text-[13px] font-medium text-[#97A2B4] no-underline">
          ← volver al inicio
        </Link>
      </header>

      <div className="max-w-[720px]">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[#F2F5F9]">Disclaimer financiero</h1>
        <p className="mt-1 text-[12px] text-[#5B6472]">última actualización: 25-07-2026</p>

        <nav className="flex items-center gap-4 mt-4">
          <Link href="/terminos" className={`${legalNavClass} text-[#8892A0]`}>
            términos
          </Link>
          <Link href="/privacidad" className={`${legalNavClass} text-[#8892A0]`}>
            privacidad
          </Link>
          <Link href="/disclaimer" className={`${legalNavClass} font-semibold text-[var(--accent)]`}>
            disclaimer
          </Link>
        </nav>

        <h2 className="text-[15px] font-semibold mt-6 mb-2">1. Esto no es asesoría financiera</h2>
        <p className="text-[13.5px] text-[#97A2B4] leading-relaxed">
          Mi portafolio es una herramienta de seguimiento personal, no un asesor financiero, un corredor
          de bolsa ni una entidad regulada. Nada de lo que muestra la plataforma constituye una
          recomendación de compra, venta o mantención de ningún instrumento financiero.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">2. Los cálculos son aproximaciones simples</h2>
        <p className="text-[13.5px] text-[#97A2B4] leading-relaxed">
          El rendimiento que ves se calcula restando tus aportes netos del cambio de valor de tu cuenta
          (ver{" "}
          <Link href="/como-funciona" className="text-[#C7CDD6] border-b border-white/[0.2]">
            cómo funciona
          </Link>{" "}
          para el detalle con ejemplos). Es una fórmula simple, pensada para uso personal — no usa
          métodos más precisos como el método Dietz modificado ni ajusta por el momento exacto dentro
          del período en que hiciste cada aporte. Para un seguimiento informal es una buena
          aproximación; no reemplaza un cálculo de rendimiento financiero formal.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">3. Los tipos de cambio son referenciales</h2>
        <p className="text-[13.5px] text-[#97A2B4] leading-relaxed">
          Para cuentas en USD o UF, la conversión usa la tasa publicada por el Banco Central de Chile (a
          través de mindicador.cl) correspondiente a la fecha que registras. Estas tasas pueden tener
          demoras de publicación o pequeñas diferencias con la tasa exacta de tu operación real.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">4. No garantizamos exactitud ni completitud</h2>
        <p className="text-[13.5px] text-[#97A2B4] leading-relaxed">
          Todos los valores que ves dependen de datos ingresados manualmente por ti; no verificamos su
          exactitud, y errores de digitación se reflejan directamente en tu rendimiento calculado.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">5. Consulta a un profesional</h2>
        <p className="text-[13.5px] text-[#97A2B4] leading-relaxed">
          Antes de tomar decisiones de inversión, consulta a un asesor financiero, agente de valores u
          otro profesional habilitado en <strong>Chile</strong>.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">6. Limitación de responsabilidad</h2>
        <p className="text-[13.5px] text-[#97A2B4] leading-relaxed">
          En la medida permitida por la ley, <strong>[nombre de la persona o empresa responsable]</strong>{" "}
          no será responsable por pérdidas financieras derivadas de decisiones tomadas con base en la
          información mostrada en la plataforma.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">7. Contacto</h2>
        <p className="text-[13.5px] text-[#97A2B4] leading-relaxed">
          Si tienes dudas sobre el alcance de estos cálculos, escríbenos a{" "}
          <FeedbackLink className="text-[#C7CDD6] border-b border-white/[0.2]">alonso.hsolis@gmail.com</FeedbackLink>.
        </p>
      </div>

      <PublicFooter />
    </main>
  );
}
