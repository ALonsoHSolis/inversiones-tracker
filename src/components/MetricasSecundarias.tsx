import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Ayuda } from "@/components/Ayuda";
import { formatoPct } from "@/lib/formato";

interface MetricasSecundariasProps {
  twr: number | null;
  xirr: number | null;
  drawdown: number | null;
}

function Tarjeta({
  titulo,
  tituloCorto,
  subtitulo,
  valor,
  color,
  vacio,
  ayuda,
}: {
  titulo: string;
  tituloCorto: string;
  subtitulo: string;
  valor: string | null;
  color: string;
  vacio: string;
  ayuda: string;
}) {
  return (
    <li className="min-w-0 px-3 py-4 sm:px-5 sm:py-5">
      <div className="flex items-start justify-between gap-1">
        <p className="etiqueta">
          <span className="sm:hidden">{tituloCorto}</span>
          <span className="hidden sm:inline">{titulo}</span>
        </p>
        <Ayuda etiqueta={`Cómo se calcula: ${titulo}`}>{ayuda}</Ayuda>
      </div>
      <p
        className="money-value mt-1.5 font-mono-tabular text-xl sm:text-2xl font-semibold leading-none tracking-[-0.02em]"
        style={{ color: valor ? color : "var(--color-fg-muted)" }}
      >
        {valor ?? "—"}
      </p>
      <p className="mt-2 hidden text-micro leading-snug text-fg-muted sm:block">{valor ? subtitulo : vacio}</p>
    </li>
  );
}

const colorPorSigno = (n: number | null) =>
  n == null ? "var(--color-fg)" : n >= 0 ? "var(--color-pos)" : "var(--color-neg)";

// metricas secundarias del dashboard. cada una mide algo DISTINTO y se rotula
// asi (nunca "rendimiento" a secas): el TWR ignora cuando y cuanto aportaste,
// el XIRR si lo considera y anualiza. los valores vienen de
// src/lib/metricas-portafolio.ts; aca solo se presentan.
export function MetricasSecundarias({ twr, xirr, drawdown }: MetricasSecundariasProps) {
  const hayCaida = drawdown != null && drawdown < 0;
  return (
    <section aria-label="Métricas de rendimiento" className="animate-fade-up">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="titulo-bloque">Métricas de rendimiento</h2>
        <Link
          href="/analisis"
          className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap text-small font-semibold text-accent no-underline hover:text-accent-hi focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded"
        >
          Ver análisis
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <ul className="card grid grid-cols-3 divide-x divide-[var(--color-edge)]">
        <Tarjeta
          titulo="Rendimiento sin aportes (TWR)"
          tituloCorto="TWR"
          subtitulo="Qué tan bien rindió tu plata, sin importar cuánto agregaste o sacaste."
          valor={twr != null ? formatoPct(twr) : null}
          color={colorPorSigno(twr)}
          vacio="Aún no hay historial suficiente."
          ayuda="El TWR (time-weighted return) encadena el rendimiento de cada período del portafolio completo, ya descontando aportes y retiros. Mide el desempeño de la inversión, no el de tus depósitos. Es un acumulado, no una tasa anual."
        />
        <Tarjeta
          titulo="Retorno anualizado (XIRR)"
          tituloCorto="XIRR anual"
          subtitulo="Tasa por año que considera la fecha exacta de cada aporte y retiro."
          valor={xirr != null ? formatoPct(xirr) : null}
          color={colorPorSigno(xirr)}
          vacio="Necesita al menos un aporte y un valor actual."
          ayuda="El XIRR es la tasa anual que hace que tus aportes, retiros y el valor de hoy cuadren a cero, respetando cuándo ocurrió cada uno. No es comparable directamente con el TWR: responde otra pregunta (cuánto rindió TU dinero, según cuándo lo pusiste). Con poco tiempo de historial puede ser muy alto o muy bajo."
        />
        <Tarjeta
          titulo="Peor caída registrada"
          tituloCorto="Peor caída"
          subtitulo="La mayor baja desde un máximo hasta el mínimo posterior."
          valor={drawdown == null ? null : hayCaida ? formatoPct(drawdown) : "Sin caídas"}
          color={hayCaida ? "var(--color-neg)" : "var(--color-fg)"}
          vacio="Aún no hay historial suficiente."
          ayuda="Se calcula sobre la misma serie del TWR (nunca sobre el valor bruto), para que un retiro no parezca una caída de mercado. Solo ve lo que capturaron tus registros: si el mercado cayó y se recuperó entre dos actualizaciones tuyas, no aparece."
        />
      </ul>
    </section>
  );
}
