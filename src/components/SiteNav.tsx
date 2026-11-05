import Link from "next/link";
import { Logo } from "@/components/Logo";

const LINK_CLASS = "h-10 px-3 inline-flex items-center rounded-lg text-[14px] font-normal text-fg-soft no-underline hover:text-fg focus-visible:outline-2 focus-visible:outline-accent-ink";

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
    // barra navy flotante dentro de un marco de vidrio, separada del borde
    <nav className="sticky top-0 z-30 pt-3">
      <div className="landing-marco">
      <div className="nav-marco">
      <div className="tema-navy flex h-[58px] items-center justify-between gap-4 rounded-[15px] pl-3 pr-2">
        <Logo href="/" subtitle="" light />

        <div className="hidden md:flex items-center gap-1.5">
          <Link href="/como-funciona" className={LINK_CLASS}>
            Cómo funciona
          </Link>
          <Link href="/calculadora" className={LINK_CLASS}>
            Calculadora
          </Link>
          <Link href="/login" className={`${LINK_CLASS} !text-accent-ink`}>
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="boton-primario ml-2 no-underline"
          >
            Crear cuenta gratis
          </Link>
        </div>

        {/* menu movil: popover nativo -- Escape y tocar fuera lo cierran sin
            js propio (antes un <details> que no se cerraba). */}
        <button
          type="button"
          popoverTarget="menu-publico"
          aria-label="Abrir menú"
          className="md:hidden grid h-11 w-11 place-items-center rounded-[10px] bg-tint/[0.08] text-fg focus-visible:outline-2 focus-visible:outline-accent-ink"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div
          id="menu-publico"
          popover="auto"
          className="menu-publico m-0 w-[min(280px,calc(100vw-32px))] rounded-2xl bg-surface-raised p-2 text-fg shadow-[0_18px_40px_-12px_rgba(21,34,56,0.16)]"
        >
          <nav aria-label="Menú" className="flex flex-col">
            <Link href="/como-funciona" className="flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium text-fg-soft no-underline hover:bg-tint/[0.05] focus-visible:outline-2 focus-visible:outline-accent-ink">
              Cómo funciona
            </Link>
            <Link href="/calculadora" className="flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium text-fg-soft no-underline hover:bg-tint/[0.05] focus-visible:outline-2 focus-visible:outline-accent-ink">
              Calculadora
            </Link>
            <Link href="/login" className="flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium text-fg-soft no-underline hover:bg-tint/[0.05] focus-visible:outline-2 focus-visible:outline-accent-ink">
              Iniciar sesión
            </Link>
            <Link href="/signup" className="boton-primario mt-1 h-11 no-underline">
              Crear cuenta gratis
            </Link>
          </nav>
        </div>
      </div>
      </div>
      </div>
    </nav>
  );
}
