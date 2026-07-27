import Link from "next/link";

interface LogoProps {
  subtitle?: string;
  href?: string;
  light?: boolean;
  // oculta el subtitulo en pantallas angostas -- para usos como una barra de
  // nav donde el subtitulo largo se envuelve en varias lineas y empuja otros
  // elementos (ej. links) de forma desprolija. El titulo "Mi portafolio"
  // siempre queda visible.
  hideSubtitleOnMobile?: boolean;
}

export function Logo({
  subtitle = "Rendimiento real · consolidado en CLP",
  href,
  light,
  hideSubtitleOnMobile,
}: LogoProps) {
  const contenido = (
    <div className="flex items-center gap-3">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          light ? "bg-white/[0.14] border border-white/[0.24]" : "bg-white/[0.07] border border-white/[0.12]"
        }`}
      >
        <img src="/logo-icon.png" alt="" className="w-8 h-8 object-contain" />
      </div>
      <div>
        <p className={`text-[15px] font-semibold tracking-[-0.01em] ${light ? "text-white" : "text-[#F2F5F9]"}`}>
          Mi portafolio
        </p>
        <p
          className={`mt-0.5 text-xs ${hideSubtitleOnMobile ? "hidden sm:block" : ""} ${
            light ? "text-white/70" : "text-[#97A2B4]"
          }`}
        >
          {subtitle}
        </p>
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
