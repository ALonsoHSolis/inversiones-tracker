import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FeedbackLink } from "@/components/FeedbackLink";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Política de privacidad — Mi portafolio",
  description: "Qué datos recopila Mi portafolio y cómo los protege.",
};

const legalNavClass = "text-[12.5px] no-underline";

export default function PrivacidadPage() {
  return (
    <main className="max-w-[1160px] mx-auto px-6 pt-[26px] pb-16">
      <header className="flex items-center justify-between gap-4 mb-10">
        <Logo href="/" />
        <Link href="/" className="text-[13px] font-medium text-[#40474F] no-underline">
          ← volver al inicio
        </Link>
      </header>

      <div className="max-w-[720px]">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Política de privacidad</h1>
        <p className="mt-1 text-[12px] text-[#8A929E]">última actualización: [completar antes de publicar]</p>

        <nav className="flex items-center gap-4 mt-4">
          <Link href="/terminos" className={`${legalNavClass} text-[#8A929E]`}>
            términos
          </Link>
          <Link href="/privacidad" className={`${legalNavClass} font-semibold text-[var(--accent)]`}>
            privacidad
          </Link>
          <Link href="/disclaimer" className={`${legalNavClass} text-[#8A929E]`}>
            disclaimer
          </Link>
        </nav>

        <h2 className="text-[15px] font-semibold mt-6 mb-2">1. Qué datos recopilamos</h2>
        <ul className="mt-2 flex flex-col gap-1.5 text-[13.5px] text-[#40474F] leading-relaxed list-disc pl-5">
          <li>
            <strong>Datos de cuenta:</strong> tu correo electrónico y tu contraseña, gestionados por
            Supabase Auth. Tu contraseña nunca se guarda en texto plano.
          </li>
          <li>
            <strong>Datos de tus inversiones:</strong> los nombres de las cuentas o plataformas que
            registras, el tipo de instrumento, la moneda, los saldos y su historial, y los aportes o
            retiros que registras. Todo esto lo ingresas tú manualmente — no nos conectamos a bancos ni
            corredoras.
          </li>
        </ul>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">2. Para qué usamos tus datos</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Para mostrarte tu portafolio consolidado y tu rendimiento estimado, para autenticarte y
          mantener tu sesión iniciada, y para responder tus consultas de soporte.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">3. Cómo protegemos tus datos</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Cada fila de datos de inversión está protegida con seguridad a nivel de fila (row level
          security) en la base de datos: solo tú, como dueño de esos datos, puedes leerlos o
          modificarlos. Ningún otro usuario registrado en la plataforma puede ver tus cuentas, saldos o
          movimientos.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">4. Con quién compartimos tus datos</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          No vendemos ni compartimos tus datos con terceros con fines comerciales o publicitarios.
          Usamos proveedores de infraestructura (actualmente Supabase, para autenticación y base de
          datos) que procesan los datos en nuestro nombre bajo sus propias políticas de seguridad,
          únicamente para operar el servicio.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">5. Cuánto tiempo conservamos tus datos</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Conservamos tus datos mientras tu cuenta esté activa. Si solicitas el cierre de tu cuenta,
          eliminamos tus datos de inversión y tu cuenta de autenticación en un plazo de{" "}
          <strong>[plazo, ej. 30 días]</strong>.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">6. Tus derechos</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Puedes solicitar acceso, corrección o eliminación de tus datos, o el cierre completo de tu
          cuenta, en cualquier momento escribiendo a{" "}
          <FeedbackLink className="text-gray-900 underline">alonso.hsolis@gmail.com</FeedbackLink>.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">7. Cookies y sesión</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Usamos cookies estrictamente necesarias para mantener tu sesión iniciada, gestionadas por
          Supabase Auth. No usamos cookies de publicidad ni de rastreo de terceros.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">8. Cambios a esta política</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Podemos actualizar esta política en el futuro. Si hacemos cambios significativos,
          intentaremos avisarte por correo o mediante un aviso en la plataforma.
        </p>

        <h2 className="text-[15px] font-semibold mt-8 mb-2">9. Contacto</h2>
        <p className="text-[13.5px] text-[#40474F] leading-relaxed">
          Si tienes preguntas sobre esta política, escríbenos a{" "}
          <FeedbackLink className="text-gray-900 underline">alonso.hsolis@gmail.com</FeedbackLink>.
        </p>
      </div>

      <PublicFooter />
    </main>
  );
}
