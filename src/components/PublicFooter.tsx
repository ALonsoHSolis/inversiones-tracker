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
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#5B6472]">Producto</p>
          <div className="mt-2.5 flex flex-col gap-2">
            <Link href="/como-funciona" className="text-[12.5px] text-[#97A2B4] no-underline">
              Cómo funciona
            </Link>
            <Link href="/calculadora" className="text-[12.5px] text-[#97A2B4] no-underline">
              Calculadora
            </Link>
            {BLOG_HABILITADO && (
              <Link href="/blog" className="text-[12.5px] text-[#97A2B4] no-underline">
                Blog
              </Link>
            )}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#5B6472]">Legal</p>
          <div className="mt-2.5 flex flex-col gap-2">
            <Link href="/terminos" className="text-[12.5px] text-[#97A2B4] no-underline">
              Términos
            </Link>
            <Link href="/privacidad" className="text-[12.5px] text-[#97A2B4] no-underline">
              Privacidad
            </Link>
            <Link href="/disclaimer" className="text-[12.5px] text-[#97A2B4] no-underline">
              Disclaimer
            </Link>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#5B6472]">Contacto</p>
          <div className="mt-2.5">
            <FeedbackLink className="text-[12.5px] text-[#97A2B4] border-b border-white/[0.14]" />
          </div>
        </div>
      </div>

      <p className="mt-8 text-[11.5px] text-[#3E4650]">Mi portafolio</p>
    </footer>
  );
}
