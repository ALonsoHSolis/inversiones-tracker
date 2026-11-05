import Link from "next/link";
import { FeedbackLink } from "@/components/FeedbackLink";
import { LogoMark } from "@/components/Logo";

// el blog todavia no tiene articulos publicados (ver content/blog/) -- se
// oculta el link para no invitar a una seccion vacia. reactivar poniendo
// esto en true en cuanto se publique el primer post.
const BLOG_HABILITADO = false;

// cierre de las paginas publicas: tarjeta navy redondeada con la marca,
// columnas de enlaces con encabezado dorado y la aclaracion legal.
export function PublicFooter() {
  const enlace = "inline-flex min-h-11 items-center text-[15px] text-fg-soft no-underline hover:text-fg";
  const encabezado = "text-small font-semibold text-accent-ink";
  return (
    <footer className="tema-navy mt-24 mb-6 rounded-[24px] px-6 pt-10 pb-8 sm:px-10">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark size={44} />
            <p className="text-[clamp(1.75rem,3vw,2.25rem)] font-normal tracking-[-0.03em] text-fg">Mi portafolio</p>
          </div>
          <p className="mt-4 max-w-[34ch] text-small text-fg-muted">Tu rendimiento real, consolidado en pesos.</p>
        </div>
        <nav aria-labelledby="pie-producto">
          <h2 id="pie-producto" className={encabezado}>Producto</h2>
          <ul className="mt-2">
            <li><Link href="/como-funciona" className={enlace}>Cómo funciona</Link></li>
            <li><Link href="/calculadora" className={enlace}>Calculadora</Link></li>
            {BLOG_HABILITADO && <li><Link href="/blog" className={enlace}>Blog</Link></li>}
            <li><Link href="/signup" className={enlace}>Crear cuenta</Link></li>
          </ul>
        </nav>
        <nav aria-labelledby="pie-legal">
          <h2 id="pie-legal" className={encabezado}>Legal</h2>
          <ul className="mt-2">
            <li><Link href="/terminos" className={enlace}>Términos</Link></li>
            <li><Link href="/privacidad" className={enlace}>Privacidad</Link></li>
            <li><Link href="/disclaimer" className={enlace}>Disclaimer</Link></li>
          </ul>
        </nav>
        <nav aria-labelledby="pie-contacto">
          <h2 id="pie-contacto" className={encabezado}>Contacto</h2>
          <ul className="mt-2">
            <li><FeedbackLink className={enlace} /></li>
            <li><Link href="/login" className={enlace}>Iniciar sesión</Link></li>
          </ul>
        </nav>
      </div>
      <p className="mt-10 border-t border-[var(--color-edge)] pt-6 text-small text-fg-subtle">
        Mi portafolio no es un banco, una corredora ni un asesor financiero: no mueve ni administra tu dinero y no
        recomienda inversiones.
      </p>
    </footer>
  );
}
