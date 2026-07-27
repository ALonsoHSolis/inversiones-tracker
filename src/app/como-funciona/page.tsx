import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Cómo funciona — Mi portafolio",
  description: "Un ejemplo con números: por qué depositar plata no siempre significa que ganaste plata.",
  alternates: { canonical: "/como-funciona" },
};

export default function ComoFuncionaPage() {
  return (
    <>
      <SiteNav />

      <main className="max-w-[1160px] mx-auto px-6 pt-9 pb-16">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] max-w-[640px] text-[#F2F5F9]">
          La regla más importante: un aporte nunca es ganancia
        </h1>
        <p className="mt-3 text-[14px] text-[#97A2B4] max-w-[640px] leading-[1.55] text-pretty">
          Esta es la confusión más fácil de cometer al llevar tus inversiones: ver que tu cuenta subió
          de valor y asumir que eso es lo que ganaste. No siempre es así. Estos dos ejemplos muestran
          la diferencia.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 items-start">
          <div className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#5B6472]">
              Escenario 1 · cuenta nueva
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-[13.5px] text-[#97A2B4]">
              <li>Lunes: creas la cuenta con $0</li>
              <li>
                Depositas <span className="font-mono-tabular font-semibold text-[#F2F5F9]">$500.000</span>
              </li>
              <li>
                Viernes: tu cuenta muestra{" "}
                <span className="font-mono-tabular font-semibold text-[#F2F5F9]">$505.000</span>
              </li>
            </ul>
            <div className="h-px bg-white/[0.07] my-4" />
            <p className="text-[13px] text-[#97A2B4]">
              ¿Ganaste <span className="font-mono-tabular font-semibold text-[#F2F5F9]">$5.000</span>?{" "}
              <span className="font-semibold text-[#3ED9A3]">Sí.</span>{" "}
              Los $500.000 que depositaste no cuentan como ganancia — son tu aporte.
            </p>
          </div>

          <div className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#5B6472]">
              Escenario 2 · cuenta con plata previa
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-[13.5px] text-[#97A2B4]">
              <li>
                Lunes: tu cuenta ya tiene{" "}
                <span className="font-mono-tabular font-semibold text-[#F2F5F9]">$500.000</span>
              </li>
              <li>
                A mitad de semana depositas{" "}
                <span className="font-mono-tabular font-semibold text-[#F2F5F9]">$500.000</span> más
              </li>
              <li>
                Viernes: tu cuenta salta a{" "}
                <span className="font-mono-tabular font-semibold text-[#F2F5F9]">$1.005.000</span>
              </li>
            </ul>
            <div className="h-px bg-white/[0.07] my-4" />
            <p className="text-[13px] text-[#97A2B4]">
              ¿Ganaste <span className="font-mono-tabular font-semibold text-[#F2F5F9]">$505.000</span>?{" "}
              <span className="font-semibold text-[#FF6B6B]">No.</span>{" "}
              Ganaste{" "}
              <span className="font-mono-tabular font-semibold text-[#3ED9A3]">$5.000</span>
              , igual que en el escenario 1 — la app resta el aporte antes de calcular tu rendimiento:
              <br />
              <span className="font-mono-tabular text-[12px] text-[#5B6472]">
                $1.005.000 (valor final) − $500.000 (valor inicial) − $500.000 (aporte) = $5.000
              </span>
            </p>
          </div>
        </div>

        <p className="mt-6 text-[13px] text-[#97A2B4] max-w-[640px] leading-[1.55] text-pretty">
          Por eso el rendimiento que ves en tu dashboard nunca es solo &quot;cuánto subió tu
          cuenta&quot;: siempre le resta lo que depositaste o retiraste, para mostrarte la ganancia
          real — la única que importa.
        </p>

        <div className="flex items-center gap-3 mt-8">
          <Link
            href="/signup"
            className="inline-flex items-center h-11 px-6 rounded-[11px] bg-[var(--accent)] text-[#0A0D13] text-[14px] font-bold no-underline"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center h-11 px-6 rounded-[11px] border border-white/[0.14] text-[14px] font-semibold text-[#F2F5F9] no-underline"
          >
            Iniciar sesión
          </Link>
        </div>

        <PublicFooter />
      </main>
    </>
  );
}
