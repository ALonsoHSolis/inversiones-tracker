import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Cómo funciona — Mi portafolio",
  description: "Un ejemplo con números: por qué depositar plata no siempre significa que ganaste plata.",
};

export default function ComoFuncionaPage() {
  return (
    <main className="max-w-[1160px] mx-auto px-6 pt-[26px] pb-16">
      <header className="flex items-center justify-between gap-4 mb-10">
        <Logo href="/" />
        <Link href="/" className="text-[13px] font-medium text-[#40474F] no-underline">
          ← volver al inicio
        </Link>
      </header>

      <h1 className="text-[28px] font-semibold tracking-[-0.02em] max-w-[640px]">
        La regla más importante: un aporte nunca es ganancia
      </h1>
      <p className="mt-3 text-[14px] text-[#40474F] max-w-[640px]">
        Esta es la confusión más fácil de cometer al llevar tus inversiones: ver que tu cuenta subió
        de valor y asumir que eso es lo que ganaste. No siempre es así. Estos dos ejemplos muestran
        la diferencia.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 items-start">
        <div className="bg-white border border-[#E7E9EE] rounded-2xl p-6 shadow-[0_1px_2px_rgba(20,30,50,0.03)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#8A929E]">
            Escenario 1 · cuenta nueva
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-[13.5px] text-[#40474F]">
            <li>Lunes: creas la cuenta con $0</li>
            <li>
              Depositas <span className="font-mono-tabular font-semibold text-[#171a20]">$500.000</span>
            </li>
            <li>
              Viernes: tu cuenta muestra{" "}
              <span className="font-mono-tabular font-semibold text-[#171a20]">$505.000</span>
            </li>
          </ul>
          <div className="h-px bg-[#EEF0F4] my-4" />
          <p className="text-[13px] text-[#40474F]">
            ¿Ganaste <span className="font-mono-tabular font-semibold">$5.000</span>?{" "}
            <span className="font-semibold" style={{ color: "var(--pos)" }}>
              Sí.
            </span>{" "}
            Los $500.000 que depositaste no cuentan como ganancia — son tu aporte.
          </p>
        </div>

        <div className="bg-white border border-[#E7E9EE] rounded-2xl p-6 shadow-[0_1px_2px_rgba(20,30,50,0.03)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#8A929E]">
            Escenario 2 · cuenta con plata previa
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-[13.5px] text-[#40474F]">
            <li>
              Lunes: tu cuenta ya tiene{" "}
              <span className="font-mono-tabular font-semibold text-[#171a20]">$500.000</span>
            </li>
            <li>
              A mitad de semana depositas{" "}
              <span className="font-mono-tabular font-semibold text-[#171a20]">$500.000</span> más
            </li>
            <li>
              Viernes: tu cuenta salta a{" "}
              <span className="font-mono-tabular font-semibold text-[#171a20]">$1.005.000</span>
            </li>
          </ul>
          <div className="h-px bg-[#EEF0F4] my-4" />
          <p className="text-[13px] text-[#40474F]">
            ¿Ganaste <span className="font-mono-tabular font-semibold">$505.000</span>?{" "}
            <span className="font-semibold" style={{ color: "var(--neg)" }}>
              No.
            </span>{" "}
            Ganaste{" "}
            <span className="font-mono-tabular font-semibold" style={{ color: "var(--pos)" }}>
              $5.000
            </span>
            , igual que en el escenario 1 — la app resta el aporte antes de calcular tu rendimiento:
            <br />
            <span className="font-mono-tabular text-[12.5px] text-[#8A929E]">
              $1.005.000 (valor final) − $500.000 (valor inicial) − $500.000 (aporte) = $5.000
            </span>
          </p>
        </div>
      </div>

      <p className="mt-6 text-[13px] text-[#40474F] max-w-[640px]">
        Por eso el rendimiento que ves en tu dashboard nunca es solo &quot;cuánto subió tu
        cuenta&quot;: siempre le resta lo que depositaste o retiraste, para mostrarte la ganancia
        real — la única que importa.
      </p>

      <div className="flex items-center gap-3 mt-8">
        <Link
          href="/signup"
          className="inline-flex items-center h-11 px-6 rounded-[9px] bg-[var(--accent)] text-white text-[14px] font-semibold no-underline"
        >
          crear cuenta gratis
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center h-11 px-6 rounded-[9px] border border-[#E1E4EA] text-[14px] font-semibold text-[#171a20] no-underline"
        >
          iniciar sesión
        </Link>
      </div>

      <PublicFooter />
    </main>
  );
}
