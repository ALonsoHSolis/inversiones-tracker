import Link from "next/link";
import { ChevronDown, Clock3, History, Pencil, SquarePen } from "lucide-react";
import { calcularEfectoTipoCambio, calcularRendimientoAnualizado } from "@/lib/rendimiento";
import { formatoPct, formatoPesos } from "@/lib/formato";
import { TIPOS } from "@/lib/tipos-cuenta";
import type { Cuenta, Moneda, RendimientoActual } from "@/types/database";

interface AccountRowProps {
  cuenta: Cuenta;
  rendimiento: RendimientoActual | null;
  // valor_actual de capital_por_cuenta (moneda nativa, no clp): esa vista
  // muestra dato desde el primer snapshot que exista, a diferencia de
  // rendimiento_actual que exige un segundo snapshot en otra fecha para
  // poder comparar. se usa como respaldo para no mostrar "sin datos aun" en
  // una cuenta que sí tiene un valor, solo que todavía no tiene con qué
  // compararlo.
  valorActualFallback: number | null;
  // valor_actual_clp de capital_por_cuenta -- ya convertido con la tasa
  // historica correspondiente (regla de negocio: nunca recalcular esto en
  // el cliente con la tasa de hoy). se usa para mostrar el valor de la fila
  // siempre en CLP, igual que el resto del portafolio -- el % de rendimiento
  // mas abajo sigue en moneda nativa, esa es la unica excepcion permitida.
  valorClpFallback: number | null;
  // capital_aportado de capital_por_cuenta (moneda nativa): junto con
  // cuenta.created_at, permite estimar el rendimiento anualizado acumulado.
  capitalAportadoFallback: number | null;
  // ultima_fecha de capital_por_cuenta (fecha del snapshot mas reciente).
  // se toma de capital_por_cuenta y no de rendimiento a proposito: cubre
  // tambien cuentas con un solo snapshot, que rendimiento_actual excluye.
  ultimaFechaFallback: string | null;
  // "ahora" calculado una sola vez en dashboard/page.tsx (mismo hoyMs que ya
  // usa esa pagina) y pasado como prop -- llamar Date.now() directo aca
  // adentro violaria la regla de pureza del render (react-hooks/purity).
  ahoraMs: number;
}

// el símbolo de moneda importa: rendimiento.valor y aportes_netos vienen en
// la moneda nativa de la cuenta (nunca convertidos a clp, por regla de
// negocio — el % de una cuenta en dólares debe reflejar su desempeño en
// dólares), así que formatear todo como CLP mostraría "$" sobre un monto que
// en realidad es USD o UF.
function formatoValor(valor: number, moneda: Moneda) {
  if (moneda === "USD") {
    return valor.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  }
  if (moneda === "UF") {
    return `${valor.toLocaleString("es-CL", { maximumFractionDigits: 2 })} UF`;
  }
  return valor.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

const UMBRAL_DATO_ANTIGUO_DIAS = 14;

export function AccountRow({
  cuenta,
  rendimiento,
  valorActualFallback,
  valorClpFallback,
  capitalAportadoFallback,
  ultimaFechaFallback,
  ahoraMs,
}: AccountRowProps) {
  const valor = rendimiento?.valor ?? valorActualFallback;
  const valorClp = rendimiento?.valor_clp ?? valorClpFallback;
  const tieneAporte = (rendimiento?.aportes_netos ?? 0) !== 0;

  // >14 dias (dos semanas) sin actualizar, no >=, para no marcar como
  // antigua una cuenta actualizada exactamente hace dos semanas justas.
  const diasDesdeUltimoDato = ultimaFechaFallback
    ? (ahoraMs - new Date(ultimaFechaFallback).getTime()) / (1000 * 60 * 60 * 24)
    : null;
  const esDatoAntiguo = diasDesdeUltimoDato != null && diasDesdeUltimoDato > UMBRAL_DATO_ANTIGUO_DIAS;

  const diasTranscurridos = (ahoraMs - new Date(cuenta.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const rendimientoAnualizado =
    valor != null && capitalAportadoFallback != null
      ? calcularRendimientoAnualizado(capitalAportadoFallback, valor, diasTranscurridos)
      : null;

  // solo tiene sentido para cuentas no-clp, y solo cuando ya hay una tasa
  // anterior con la que comparar (cuenta con un solo snapshot -> null, se
  // oculta el desglose en vez de mostrar un efecto calculado sobre nada).
  const efectoTipoCambio =
    cuenta.moneda !== "CLP"
      ? calcularEfectoTipoCambio(rendimiento?.tasa_cambio ?? null, rendimiento?.tasa_cambio_anterior ?? null)
      : null;

  const tipoLabel = TIPOS.find((t) => t.value === cuenta.tipo)?.label ?? cuenta.tipo;
  const pct = rendimiento?.rendimiento_pct ?? null;
  const hayDetalle = rendimientoAnualizado != null || efectoTipoCambio != null;

  return (
    <li className="py-3">
      <details className="group">
        <summary className="list-none [&::-webkit-details-marker]:hidden grid cursor-pointer grid-cols-[minmax(0,1fr)_auto_24px] items-start gap-x-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <span className="min-w-0">
            <span className="block break-words text-small font-semibold leading-snug text-fg">{cuenta.nombre}</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-micro text-fg-muted">
              <span>{cuenta.plataforma}</span>
              <span aria-hidden="true" className="text-fg-subtle">·</span>
              <span>{tipoLabel}</span>
              {esDatoAntiguo && (
                <>
                  <span aria-hidden="true" className="text-fg-subtle">·</span>
                  <span className="inline-flex items-center gap-1 text-warn">
                    <Clock3 size={12} strokeWidth={2} aria-hidden="true" />
                    hace {Math.floor(diasDesdeUltimoDato!)} días
                  </span>
                </>
              )}
            </span>
          </span>
          <span className="text-right">
            <span className="money-value block whitespace-nowrap font-mono-tabular text-small font-semibold text-fg">
              {valorClp != null ? formatoPesos(valorClp) : "Sin datos aún"}
            </span>
            {pct != null ? (
              <span
                className="mt-0.5 block whitespace-nowrap font-mono-tabular text-micro font-semibold"
                style={{ color: pct >= 0 ? "var(--color-pos)" : "var(--color-neg)" }}
              >
                {formatoPct(pct)}
                <span className="ml-1 font-medium text-fg-subtle">
                  real{cuenta.moneda !== "CLP" ? ` en ${cuenta.moneda}` : ""}
                </span>
              </span>
            ) : (
              <span className="mt-0.5 block text-micro text-fg-subtle">Sin comparación aún</span>
            )}
          </span>
          <span className="grid h-6 w-6 place-items-center rounded-full text-fg-subtle transition-colors group-hover:text-fg-soft">
            <ChevronDown size={16} aria-hidden="true" className="transition-transform duration-200 group-open:rotate-180" />
            <span className="sr-only">Ver detalle y acciones de {cuenta.nombre}</span>
          </span>
        </summary>

        <div className="mt-3 rounded-xl bg-white/[0.025] p-3 shadow-[inset_0_0_0_1px_var(--color-edge)]">
          {hayDetalle && (
            <dl className="grid grid-cols-1 gap-2 text-micro sm:grid-cols-2">
              {rendimientoAnualizado != null && (
                <div>
                  <dt className="text-fg-muted">Rendimiento anualizado (aprox.)</dt>
                  <dd className="font-mono-tabular font-semibold" style={{ color: rendimientoAnualizado >= 0 ? "var(--color-pos)" : "var(--color-neg)" }}>
                    {formatoPct(rendimientoAnualizado)}
                  </dd>
                </div>
              )}
              {efectoTipoCambio != null && (
                <div>
                  <dt className="text-fg-muted">Efecto tipo de cambio (en pesos)</dt>
                  <dd className="font-mono-tabular font-semibold" style={{ color: efectoTipoCambio >= 0 ? "var(--color-pos)" : "var(--color-neg)" }}>
                    {formatoPct(efectoTipoCambio)}
                  </dd>
                </div>
              )}
            </dl>
          )}
          <div className={`flex flex-wrap gap-2 ${hayDetalle ? "mt-3" : ""}`}>
            <Link href={`/registrar?cuenta=${cuenta.id}`} className="boton-secundario min-h-9 px-3 no-underline">
              <SquarePen size={14} aria-hidden="true" />
              Registrar
            </Link>
            <Link href={`/cuentas/${cuenta.id}/historial`} className="boton-secundario min-h-9 px-3 no-underline">
              <History size={14} aria-hidden="true" />
              Historial
            </Link>
            <Link href={`/cuentas/${cuenta.id}/editar`} className="boton-secundario min-h-9 px-3 no-underline">
              <Pencil size={14} aria-hidden="true" />
              Editar
            </Link>
          </div>
        </div>
      </details>
      {tieneAporte && rendimiento && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-micro text-fg-muted">
          <span className="money-value rounded-md bg-accent/12 px-1.5 py-0.5 font-mono-tabular font-semibold text-accent-hi">
            {/* aportes_netos siempre cae a 0 via coalesce en la vista sql, nunca null */}
            {rendimiento.aportes_netos! > 0 ? "Aporte " : "Retiro −"}
            {formatoValor(Math.abs(rendimiento.aportes_netos!), cuenta.moneda as Moneda)}
          </span>
          no cuenta como rendimiento
        </p>
      )}
    </li>
  );
}
