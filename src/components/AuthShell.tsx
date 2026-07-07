import Link from "next/link";
import { Logo } from "@/components/Logo";

const FEATURES = [
  "Todo consolidado en pesos (CLP · UF · USD)",
  "Siempre descuenta tus aportes y retiros",
  "Benchmark contra S&P 500 y UF",
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[46%_54%]">
      <div className="hidden md:flex flex-col justify-between overflow-hidden relative bg-[var(--accent)] px-11 py-10">
        <Logo href="/" light />

        <div className="max-w-[380px]">
          <h2 className="text-white text-[30px] leading-[1.18] font-semibold tracking-[-0.02em]">
            Un aporte no es ganancia. Tu portafolio debería saber la diferencia.
          </h2>
          <div className="flex flex-col gap-3 mt-[26px]">
            {FEATURES.map((texto) => (
              <span key={texto} className="inline-flex items-center gap-2.5 text-[13.5px] text-white/90">
                <span className="w-[18px] h-[18px] rounded-md bg-white/16 inline-flex items-center justify-center text-[10px] text-white shrink-0">
                  ✓
                </span>
                {texto}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white/10 border border-white/14 rounded-2xl px-[18px] py-4">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-[0.09em] text-white/65 font-semibold">
              Valor total
            </span>
            <span className="font-mono-tabular text-[11px] font-semibold text-[#8FE3C0]">▲ +10,0%</span>
          </div>
          <p className="font-mono-tabular mt-1.5 text-[22px] font-semibold text-white">$17.491.080</p>
          <svg
            viewBox="0 0 300 70"
            width="100%"
            height="56"
            preserveAspectRatio="none"
            className="block mt-2.5 overflow-visible"
          >
            <path
              d="M0 54 L110 54 L110 46 L185 46 L185 38 L250 38 L250 31 L300 31 L300 70 L0 70 Z"
              fill="rgba(255,255,255,.14)"
            />
            <path
              d="M0 48 C40 45,70 41,100 40 C140 38,165 30,195 27 C235 22,270 18,300 14 L300 31 L250 31 L250 38 L185 38 L185 46 L110 46 L110 54 L0 54 Z"
              fill="rgba(143,227,192,.28)"
            />
            <path
              d="M0 48 C40 45,70 41,100 40 C140 38,165 30,195 27 C235 22,270 18,300 14"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="flex flex-col px-5 py-6 md:px-7 bg-[#F5F6F8] min-h-screen">
        <div>
          <Link
            href="/"
            className="inline-block px-1 py-2 text-[13px] font-medium text-[#8A929E] hover:text-[#40474F]"
          >
            ← Volver al inicio
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="w-full max-w-[384px] auth-fade-up">{children}</div>
        </div>
        <p className="text-center text-[11px] text-[#B4BAC3]">Mi portafolio · seguimiento de rendimiento real</p>
      </div>
    </div>
  );
}
