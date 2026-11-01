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

// marca en codigo (no una imagen): escalones = capital aportado, curva =
// ganancia real por encima de el. misma geometria que src/app/icon.png.
export function LogoMark({ size = 48 }: { light?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="48" height="48" rx="11" fill="#12161e" />
      <rect x=".5" y=".5" width="47" height="47" rx="10.5" stroke="#cdae76" strokeOpacity=".35" />
      <path
        d="M10 36H19V32H27V28H37"
        stroke="#fff"
        strokeOpacity=".28"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 31C16 31 19 28 23 24S31 17 36 13" stroke="#dcc28f" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="37" cy="12.4" r="2.6" fill="#0b0d12" stroke="#dcc28f" strokeWidth="2.2" />
    </svg>
  );
}

export function Logo({
  subtitle = "Rendimiento real · consolidado en CLP",
  href,
  light,
  hideSubtitleOnMobile,
}: LogoProps) {
  const contenido = (
    <div className="flex items-center gap-3">
      <LogoMark />
      <div>
        <p className={`text-[15px] font-semibold tracking-[-0.01em] ${light ? "text-white" : "text-fg"}`}>
          Mi portafolio
        </p>
        <p
          className={`mt-0.5 text-xs ${hideSubtitleOnMobile ? "hidden sm:block" : ""} ${
            light ? "text-white/70" : "text-fg-muted"
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
