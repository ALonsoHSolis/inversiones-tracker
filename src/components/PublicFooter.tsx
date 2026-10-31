import Link from "next/link";
import { FeedbackLink } from "@/components/FeedbackLink";

// el blog todavia no tiene articulos publicados (ver content/blog/) -- se
// oculta el link para no invitar a una seccion vacia. reactivar poniendo
// esto en true en cuanto se publique el primer post.
const BLOG_HABILITADO = false;

export function PublicFooter() {
  return (
    <footer className="mt-10 pt-8 border-t border-white/[0.07]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <p className="text-micro font-semibold uppercase tracking-[0.07em] text-fg-subtle">Producto</p>
          <div className="mt-2.5 flex flex-col gap-2">
            <Link href="/como-funciona" className="text-micro text-fg-muted no-underline">
              Cómo funciona
            </Link>
            <Link href="/calculadora" className="text-micro text-fg-muted no-underline">
              Calculadora
            </Link>
            {BLOG_HABILITADO && (
              <Link href="/blog" className="text-micro text-fg-muted no-underline">
                Blog
              </Link>
            )}
          </div>
        </div>

        <div>
          <p className="text-micro font-semibold uppercase tracking-[0.07em] text-fg-subtle">Legal</p>
          <div className="mt-2.5 flex flex-col gap-2">
            <Link href="/terminos" className="text-micro text-fg-muted no-underline">
              Términos
            </Link>
            <Link href="/privacidad" className="text-micro text-fg-muted no-underline">
              Privacidad
            </Link>
            <Link href="/disclaimer" className="text-micro text-fg-muted no-underline">
              Disclaimer
            </Link>
          </div>
        </div>

        <div>
          <p className="text-micro font-semibold uppercase tracking-[0.07em] text-fg-subtle">Contacto</p>
          <div className="mt-2.5">
            <FeedbackLink className="text-micro text-fg-muted border-b border-white/[0.14]" />
          </div>
        </div>
      </div>

      <p className="mt-8 text-micro text-fg-subtle">Mi portafolio</p>
    </footer>
  );
}
