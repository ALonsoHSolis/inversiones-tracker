import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FeedbackLink } from "@/components/FeedbackLink";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Términos y condiciones — Mi portafolio",
  description: "Términos y condiciones de uso de Mi portafolio.",
};

const legalNavClass = "text-[12.5px] no-underline";

export default function TerminosPage() {
  return (
    <main className="max-w-[1160px] mx-auto px-6 pt-[26px] pb-16">
      <header className="flex items-center justify-between gap-4 mb-10">
        <Logo href="/" />
        <Link href="/" className="text-[13px] font-medium text-[#40474F] no-underline">
          ← volver al inicio
        </Link>
      </header>

      <div className="max-w-[720px]">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Términos y condiciones</h1>
        <p className="mt-1 text-[12px] text-[#8A929E]">última actualización: [completar antes de publicar]</p>

        <nav className="flex items-center gap-4 mt-4">
          <Link href="/terminos" className={`${legalNavClass} font-semibold text-[var(--accent)]`}>
            términos
          </Link>
          <Link href="/privacidad" className={`${legalNavClass} text-[#8A929E]`}>
            privacidad
          </Link>
          <Link href="/disclaimer" className={`${legalNavClass} text-[#8A929E]`}>
            disclaimer
          </Link>
        </nav>

        <p className="mt-6 text-[13.5px] text-[#40474F] leading-relaxed">
          Estos términos regulan el uso de Mi portafolio (la &quot;plataforma&quot;), una herramienta de
          seguimiento personal de inversiones operada por{" "}
          <strong>[nombre de la persona o empresa responsable]</strong> (&quot;nosotros&quot;). Al crear una
          cuenta, aceptas estos términos.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">1. Qué es Mi portafolio</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Mi portafolio te permite registrar manualmente el valor de tus cuentas de inversión en
          distintas plataformas y ver un resumen consolidado en pesos chilenos, incluyendo una
          estimación de tu rendimiento neto de aportes. No ejecuta transacciones, no tiene acceso a tus
          cuentas bancarias o de inversión reales, y no gestiona dinero: todos los valores los ingresas
          tú manualmente.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">2. Tu cuenta</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad
          realizada desde tu cuenta. Debes entregar un correo electrónico válido al que tengas acceso,
          ya que se usa para confirmar tu cuenta y para recuperar tu contraseña.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">3. Exactitud de los datos</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Todos los montos, saldos y movimientos que ves en la plataforma provienen de datos que tú
          mismo ingresas. Eres el único responsable de que esos datos sean correctos y estén
          actualizados. No verificamos ni podemos verificar la exactitud de la información que
          registras.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">4. El servicio se entrega &quot;tal cual&quot;</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Mi portafolio se entrega &quot;tal cual&quot; (as-is) y &quot;según disponibilidad&quot;, sin garantías de
          ningún tipo, explícitas o implícitas, incluyendo garantías de disponibilidad continua,
          ausencia de errores o idoneidad para un propósito particular. Consulta también nuestro{" "}
          <Link href="/disclaimer" className="text-gray-900 underline">
            disclaimer
          </Link>{" "}
          sobre el alcance de los cálculos de rendimiento.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">5. Terminación de cuentas</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Puedes dejar de usar la plataforma y solicitar el cierre de tu cuenta y la eliminación de tus
          datos en cualquier momento, escribiendo a{" "}
          <FeedbackLink className="text-gray-900 underline">alonso.hsolis@gmail.com</FeedbackLink>. Nos
          reservamos el derecho de suspender o cerrar cuentas que hagan un uso indebido del servicio.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">6. Cambios a estos términos</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Podemos actualizar estos términos en el futuro. Si hacemos cambios significativos,
          intentaremos avisarte por correo o mediante un aviso en la plataforma.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">7. Ley aplicable</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Estos términos se rigen por las leyes de <strong>[jurisdicción, ej. la República de Chile]</strong>.
          Cualquier disputa se resolverá ante los tribunales competentes de{" "}
          <strong>[ciudad / jurisdicción]</strong>.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">8. Contacto</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Si tienes preguntas sobre estos términos, escríbenos a{" "}
          <FeedbackLink className="text-gray-900 underline">alonso.hsolis@gmail.com</FeedbackLink>.
        </p>
      </div>

      <PublicFooter />
    </main>
  );
}
