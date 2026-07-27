import Link from "next/link";
import { Logo } from "@/components/Logo";

const LINK_CLASS = "h-9 px-3 inline-flex items-center text-[13px] font-medium text-[#97A2B4] no-underline";

// nav publico compartido por /, /como-funciona, /calculadora y /blog -- antes
// cada pagina tenia su propia copia (o una version simplificada), lo que
// permitio que el texto de "iniciar sesion" quedara desincronizado entre
// paginas. centralizarlo aca evita que ese tipo de drift se repita.
//
// el menu mobile usa <details>/<summary> nativo (mismo patron que Ayuda.tsx
// y TrustFaq.tsx) en vez de useState -- no necesita "use client", y al
// navegar a otra pagina el componente se vuelve a montar limpio (cerrado).
export function SiteNav() {
  return (
    <nav className="sticky top-0 z-20 bg-[#0A0D13]/[0.78] backdrop-blur-[14px] border-b border-white/[0.07]">
      <div className="max-w-[1160px] mx-auto px-6 py-[13px] flex items-center justify-between gap-4">
        <Logo
          href="/"
          subtitle="Rendimiento real, no aportes disfrazados de ganancia"
          hideSubtitleOnMobile
        />

        <div className="hidden md:flex items-center gap-1.5">
          <Link href="/como-funciona" className={LINK_CLASS}>
            Cómo funciona
          </Link>
          <Link href="/calculadora" className={LINK_CLASS}>
            Calculadora
          </Link>
          <Link href="/login" className="h-9 px-3.5 inline-flex items-center text-[13px] font-medium text-[#97A2B4] no-underline">
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="h-9 px-[15px] inline-flex items-center rounded-[9px] bg-[var(--accent)] text-[#0A0D13] text-[13px] font-semibold no-underline"
          >
            Crear cuenta gratis
          </Link>
        </div>

        <details className="md:hidden group relative">
          <summary
            aria-label="Abrir menú"
            className="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-9 h-9 flex items-center justify-center rounded-[9px] border border-white/[0.14] bg-white/[0.04]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2F5F9" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-2 w-[230px] bg-[#12161F] border border-white/[0.1] rounded-[12px] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] p-2 flex flex-col gap-1">
            <Link
              href="/como-funciona"
              className="px-3 py-2.5 rounded-[8px] text-[13.5px] font-medium text-[#97A2B4] no-underline"
            >
              Cómo funciona
            </Link>
            <Link
              href="/calculadora"
              className="px-3 py-2.5 rounded-[8px] text-[13.5px] font-medium text-[#97A2B4] no-underline"
            >
              Calculadora
            </Link>
            <Link
              href="/login"
              className="px-3 py-2.5 rounded-[8px] text-[13.5px] font-medium text-[#97A2B4] no-underline"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="mt-1 px-3 py-2.5 rounded-[8px] bg-[var(--accent)] text-[#0A0D13] text-[13.5px] font-semibold no-underline text-center"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </details>
      </div>
    </nav>
  );
}
