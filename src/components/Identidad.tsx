// piezas visuales de identidad de una cuenta: monograma de la institucion y
// mini-grafico de su valor. solo presentacion.

const COLORES = [
  { bg: "rgba(224,188,120,0.16)", fg: "#ead3a2" },
  { bg: "rgba(159,176,200,0.16)", fg: "#c3cfdf" },
  { bg: "rgba(211,154,106,0.16)", fg: "#e2b48e" },
  { bg: "rgba(169,155,192,0.18)", fg: "#cbbfe0" },
  { bg: "rgba(127,147,174,0.18)", fg: "#aebdd2" },
  { bg: "rgba(185,139,115,0.18)", fg: "#d7b09c" },
];

// color estable por institucion (el mismo nombre siempre da el mismo tono);
// paleta categorica sin verde ni rojo, que quedan para ganancia/perdida.
function colorDe(texto: string) {
  let h = 0;
  for (const c of texto.toLowerCase().trim()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES[h % COLORES.length];
}

export function iniciales(texto: string): string {
  const palabras = texto.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return "?";
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

export function Monograma({ institucion, tamano = 40 }: { institucion: string; tamano?: number }) {
  const { bg, fg } = colorDe(institucion);
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full text-[13px] font-semibold tracking-[0.02em]"
      style={{ width: tamano, height: tamano, background: bg, color: fg, boxShadow: `inset 0 0 0 1px ${fg}22` }}
    >
      {iniciales(institucion)}
    </span>
  );
}

// mini-grafico del VALOR de la cuenta (en pesos), no de su rendimiento: incluye
// aportes y retiros, por eso va en un tono neutro y nunca en verde o rojo.
export function MiniGrafico({ valores, ancho = 72, alto = 28 }: { valores: number[]; ancho?: number; alto?: number }) {
  if (valores.length < 2) return <span aria-hidden="true" style={{ width: ancho }} className="shrink-0" />;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;
  const d = valores
    .map((v, i) => {
      const x = (i / (valores.length - 1)) * ancho;
      const y = alto - 2 - ((v - min) / rango) * (alto - 4);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" className="shrink-0 overflow-visible">
      <path d={d} fill="none" stroke="rgba(195,207,223,0.55)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
