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
  subtitulo,
  valor,
  color,
  vacio,
  ayuda,
}: {
  titulo: string;
  subtitulo: string;
  valor: string | null;
  color: string;
  vacio: string;
  ayuda: string;
}) {
  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-small font-medium leading-snug text-fg-soft">{titulo}</p>
        <Ayuda etiqueta={`Cómo se calcula: ${titulo}`}>{ayuda}</Ayuda>
      </div>
      <p className="money-value mt-2 font-mono-tabular text-[22px] font-semibold leading-none" style={{ color: valor ? color : "var(--color-fg-muted)" }}>
        {valor ?? "—"}
      </p>
      <p className="mt-2 text-micro leading-snug text-fg-muted">{valor ? subtitulo : vacio}</p>
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
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-small font-semibold text-fg">Métricas de rendimiento</h2>
        <Link
          href="/analisis"
          className="inline-flex items-center gap-1 text-micro font-semibold text-accent no-underline hover:text-accent-hi focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded"
        >
          Ver análisis completo
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tarjeta
          titulo="Rendimiento sin aportes (TWR)"
          subtitulo="Qué tan bien rindió tu plata, sin importar cuánto agregaste o sacaste."
          valor={twr != null ? formatoPct(twr) : null}
          color={colorPorSigno(twr)}
          vacio="Aún no hay historial suficiente."
          ayuda="El TWR (time-weighted return) encadena el rendimiento de cada período del portafolio completo, ya descontando aportes y retiros. Mide el desempeño de la inversión, no el de tus depósitos. Es un acumulado, no una tasa anual."
        />
        <Tarjeta
          titulo="Retorno anualizado (XIRR)"
          subtitulo="Tasa por año que considera la fecha exacta de cada aporte y retiro."
          valor={xirr != null ? formatoPct(xirr) : null}
          color={colorPorSigno(xirr)}
          vacio="Necesita al menos un aporte y un valor actual."
          ayuda="El XIRR es la tasa anual que hace que tus aportes, retiros y el valor de hoy cuadren a cero, respetando cuándo ocurrió cada uno. No es comparable directamente con el TWR: responde otra pregunta (cuánto rindió TU dinero, según cuándo lo pusiste). Con poco tiempo de historial puede ser muy alto o muy bajo."
        />
        <Tarjeta
          titulo="Peor caída registrada"
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
