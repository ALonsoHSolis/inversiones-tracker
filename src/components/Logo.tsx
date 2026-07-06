import Link from "next/link";

interface LogoProps {
  subtitle?: string;
  href?: string;
}

export function Logo({ subtitle = "Rendimiento real · consolidado en CLP", href }: LogoProps) {
  const contenido = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-end justify-center gap-[3px] px-[9px] py-2.5">
        <span className="w-1 h-2 bg-white/55 rounded-[1px]" />
        <span className="w-1 h-[13px] bg-white/80 rounded-[1px]" />
        <span className="w-1 h-[18px] bg-white rounded-[1px]" />
      </div>
      <div>
        <p className="text-[15px] font-semibold tracking-[-0.01em]">Mi portafolio</p>
        <p className="mt-0.5 text-xs text-[#8A929E]">{subtitle}</p>
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
