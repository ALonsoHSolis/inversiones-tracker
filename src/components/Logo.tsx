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
      <img src="/logo-icon.png" alt="" className="w-10 h-10 object-contain" />
      <div>
        <p className={`text-[15px] font-semibold tracking-[-0.01em] ${light ? "text-white" : ""}`}>
          Mi portafolio
        </p>
        <p
          className={`mt-0.5 text-xs ${hideSubtitleOnMobile ? "hidden sm:block" : ""} ${
            light ? "text-white/70" : "text-[#8A929E]"
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
