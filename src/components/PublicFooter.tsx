import Link from "next/link";
import { FeedbackLink } from "@/components/FeedbackLink";

// el blog todavia no tiene articulos publicados (ver content/blog/) -- se
// oculta el link para no invitar a una seccion vacia. reactivar poniendo
// esto en true en cuanto se publique el primer post.
const BLOG_HABILITADO = false;

// cierre de las paginas publicas: el nombre vuelve a tamano grande y los
// enlaces van en una fila legible (15 px). sin etiquetas en mayusculas
// espaciadas ni linea divisoria: separa el espacio.
export function PublicFooter() {
  const enlace = "text-[15px] text-fg-muted no-underline hover:text-fg";
  return (
    <footer className="mt-24 pb-10">
      <p className="text-[clamp(2.75rem,9vw,8rem)] font-semibold leading-none tracking-[-0.045em] text-fg/90">Mi portafolio</p>
      <nav aria-label="Pie de página" className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3">
        <Link href="/como-funciona" className={enlace}>
          Cómo funciona
        </Link>
        <Link href="/calculadora" className={enlace}>
          Calculadora
        </Link>
        {BLOG_HABILITADO && (
          <Link href="/blog" className={enlace}>
            Blog
          </Link>
        )}
        <Link href="/terminos" className={enlace}>
          Términos
        </Link>
        <Link href="/privacidad" className={enlace}>
          Privacidad
        </Link>
        <Link href="/disclaimer" className={enlace}>
          Disclaimer
        </Link>
        <FeedbackLink className={`${enlace} underline decoration-white/25 underline-offset-4`} />
      </nav>
      <p className="mt-6 max-w-[70ch] text-small text-fg-subtle">
        Mi portafolio no es un banco, una corredora ni un asesor financiero: no mueve ni administra tu dinero y no
        recomienda inversiones.
      </p>
    </footer>
  );
}
