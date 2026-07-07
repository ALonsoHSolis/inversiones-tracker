import Link from "next/link";

interface LogoProps {
  subtitle?: string;
  href?: string;
  light?: boolean;
}

export function Logo({ subtitle = "Rendimiento real · consolidado en CLP", href, light }: LogoProps) {
  const contenido = (
    <div className="flex items-center gap-3">
      <img src="/logo-icon.png" alt="" className="w-10 h-10 object-contain" />
      <div>
        <p className={`text-[15px] font-semibold tracking-[-0.01em] ${light ? "text-white" : ""}`}>
          Mi portafolio
        </p>
        <p className={`mt-0.5 text-xs ${light ? "text-white/70" : "text-[#8A929E]"}`}>{subtitle}</p>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="no-underline">
      {contenido}
    </Link>
  ) : (
    contenido
  );
}
