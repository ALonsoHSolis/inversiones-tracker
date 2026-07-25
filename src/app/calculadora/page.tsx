import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PublicFooter } from "@/components/PublicFooter";
import { CalculadoraForm } from "@/components/CalculadoraForm";

export const metadata: Metadata = {
  title: "Calculadora de rendimiento real de inversiones — Mi portafolio",
  description:
    "Calcula gratis cuánto ganaste realmente en una inversión, descontando los aportes y retiros que hiciste. Sin registro, sin conectar tu banco.",
};

export default function CalculadoraPage() {
  return (
    <main className="max-w-[820px] mx-auto px-6 pt-[26px] pb-16">
      <header className="flex items-center justify-between gap-4 mb-10">
        <Logo href="/" />
        <Link href="/" className="text-[13px] font-medium text-[#40474F] no-underline">
          ← volver al inicio
        </Link>
      </header>

      <h1 className="text-[28px] font-semibold tracking-[-0.02em] max-w-[560px]">
        Calculadora de rendimiento real de tus inversiones
      </h1>
      <p className="mt-3 text-[14px] text-[#40474F] max-w-[560px]">
        Si depositaste o retiraste plata de una cuenta, el cambio de valor que ves no es lo que
        realmente ganaste. Ingresa tus números y compáralo tú mismo — gratis, sin registrarte ni
        conectar tu banco.
      </p>

      <div className="mt-6">
        <CalculadoraForm />
      </div>

      <div className="mt-10 max-w-[640px]">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]">
          ¿Por qué el cambio de valor no es tu ganancia?
        </h2>
        <p className="mt-2.5 text-[13.5px] text-[#40474F] leading-relaxed">
          Cuando revisas una cuenta de inversión y ves que subió de valor, es fácil asumir que eso
          es lo que ganaste. Pero si en el medio depositaste plata nueva, parte de ese aumento es
          simplemente el aporte que hiciste — no una ganancia. Lo mismo al revés: si retiraste
          plata, el valor puede bajar sin que eso signifique que perdiste dinero.
        </p>
        <p className="mt-2.5 text-[13.5px] text-[#40474F] leading-relaxed">
          La ganancia real es siempre: valor final, menos valor inicial, menos los aportes o
          retiros netos que hiciste en el medio. Esa es la única cifra que refleja cómo se
          desempeñó tu plata, sin importar cuánto le agregaste o le sacaste durante el período.
        </p>

        <h2 className="mt-6 text-[17px] font-semibold tracking-[-0.01em]">
          ¿Y si tengo varias cuentas en distintas plataformas?
        </h2>
        <p className="mt-2.5 text-[13.5px] text-[#40474F] leading-relaxed">
          Esta calculadora sirve para una cuenta a la vez. Si tienes inversiones repartidas en
          varios bancos, corredoras o fondos, hacer este cálculo a mano cada semana se vuelve
          tedioso rápido — y es exactamente el problema que resuelve Mi portafolio: consolida
          todas tus cuentas en un solo lugar y hace este cálculo automáticamente por ti.
        </p>
      </div>

      <PublicFooter />
    </main>
  );
}
