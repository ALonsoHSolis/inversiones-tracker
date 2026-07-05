import Link from "next/link";
import { calcularEfectoTipoCambio, calcularRendimientoAnualizado } from "@/lib/rendimiento";
import { formatoPct } from "@/lib/formato";
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
  // capital_aportado de capital_por_cuenta (moneda nativa): junto con
  // cuenta.created_at, permite estimar el rendimiento anualizado acumulado.
  capitalAportadoFallback: number | null;
  // ultima_fecha de capital_por_cuenta (fecha del snapshot mas reciente).
  // se toma de capital_por_cuenta y no de rendimiento a proposito: cubre
  // tambien cuentas con un solo snapshot, que rendimiento_actual excluye.
  ultimaFechaFallback: string | null;
}

const CHIP_COLORES: Record<string, { bg: string; fg: string }> = {
  fondo_mutuo: { bg: "#EAF1F8", fg: "#2A5F94" },
  acciones: { bg: "#EDEBF7", fg: "#4B3E92" },
  cripto: { bg: "#FBEFE6", fg: "#9A5A22" },
  deposito_plazo: { bg: "#E9F3EE", fg: "#1F7A54" },
};
const CHIP_DEFAULT = { bg: "#F0F1F4", fg: "#5B6472" };

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
  capitalAportadoFallback,
  ultimaFechaFallback,
}: AccountRowProps) {
  const valor = rendimiento?.valor ?? valorActualFallback;
  const tieneAporte = (rendimiento?.aportes_netos ?? 0) !== 0;

  // >14 dias (dos semanas) sin actualizar, no >=, para no marcar como
  // antigua una cuenta actualizada exactamente hace dos semanas justas.
  const diasDesdeUltimoDato = ultimaFechaFallback
    ? (Date.now() - new Date(ultimaFechaFallback).getTime()) / (1000 * 60 * 60 * 24)
    : null;
  const esDatoAntiguo = diasDesdeUltimoDato != null && diasDesdeUltimoDato > UMBRAL_DATO_ANTIGUO_DIAS;

  const diasTranscurridos = (Date.now() - new Date(cuenta.created_at).getTime()) / (1000 * 60 * 60 * 24);
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

  const chip = CHIP_COLORES[cuenta.tipo] ?? CHIP_DEFAULT;
  const tipoLabel = TIPOS.find((t) => t.value === cuenta.tipo)?.label ?? cuenta.tipo;

  return (
    <div className="acct-row border border-[#ECEEF2] rounded-xl px-[15px] py-[13px] transition-colors hover:border-[#DCE0E7] hover:bg-[#FCFCFD]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold">{cuenta.nombre}</span>
            <span
              className="text-[10.5px] font-semibold px-[7px] py-0.5 rounded-md"
              style={{ background: chip.bg, color: chip.fg }}
            >
              {tipoLabel}
            </span>
          </div>
          <p className="mt-1 text-[11.5px] text-[#98A0AB]">
            {cuenta.plataforma}
            {" · "}
            <Link href={`/cuentas/${cuenta.id}/editar`} className="text-[#98A0AB] no-underline border-b border-[#E2E5EA]">
              editar
            </Link>
            {" · "}
            <Link
              href={`/cuentas/${cuenta.id}/historial`}
              className="text-[#98A0AB] no-underline border-b border-[#E2E5EA]"
            >
              historial
            </Link>
            {esDatoAntiguo && (
              <>
                {" · "}
                <span
                  className="px-[6px] py-[1px] rounded-md text-[10.5px] font-medium"
                  style={{ background: CHIP_DEFAULT.bg, color: CHIP_DEFAULT.fg }}
                >
                  hace {Math.floor(diasDesdeUltimoDato!)} días
                </span>
              </>
            )}
          </p>
        </div>
        <div className="text-right whitespace-nowrap">
          <p className="money-value font-mono-tabular text-sm font-semibold">
            {valor != null ? formatoValor(valor, cuenta.moneda as Moneda) : "sin datos aún"}
          </p>
          {rendimiento?.rendimiento_pct != null && (
            <p
              className="mt-[3px] text-[11.5px] font-semibold"
              style={{ color: rendimiento.rendimiento_pct >= 0 ? "var(--pos)" : "var(--neg)" }}
            >
              {formatoPct(rendimiento.rendimiento_pct)} <span className="text-[#B4BAC3] font-medium">real</span>
            </p>
          )}
          {(rendimientoAnualizado != null || efectoTipoCambio != null) && (
            <details className="mt-[3px] group">
              <summary className="list-none [&::-webkit-details-marker]:hidden inline-flex items-center justify-center w-4 h-4 rounded-full border border-[#DADEE4] text-[10px] font-medium text-[#A0A7B2] cursor-pointer select-none ml-auto group-hover:border-[#C9CDD5] group-hover:text-[#6B7280]">
                ▾
              </summary>
              <div className="mt-1.5 flex flex-col gap-1 text-left max-w-[190px] ml-auto">
                {rendimientoAnualizado != null && (
                  <p className="text-[11px] leading-relaxed text-[#98A0AB] whitespace-normal">
                    Rendimiento anualizado:{" "}
                    <strong style={{ color: rendimientoAnualizado >= 0 ? "var(--pos)" : "var(--neg)" }}>
                      {formatoPct(rendimientoAnualizado)}
                    </strong>
                  </p>
                )}
                {efectoTipoCambio != null && (
                  <p className="text-[11px] leading-relaxed text-[#98A0AB] whitespace-normal">
                    Rendimiento del activo:{" "}
                    <strong style={{ color: (rendimiento?.rendimiento_pct ?? 0) >= 0 ? "var(--pos)" : "var(--neg)" }}>
                      {rendimiento?.rendimiento_pct != null ? formatoPct(rendimiento.rendimiento_pct) : "—"}
                    </strong>
                    {" · "}
                    Efecto tipo de cambio:{" "}
                    <strong style={{ color: efectoTipoCambio >= 0 ? "var(--pos)" : "var(--neg)" }}>
                      {formatoPct(efectoTipoCambio)}
                    </strong>
                  </p>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
      {tieneAporte && rendimiento && (
        <div className="mt-2.5 pt-2.5 border-t border-[#F0F1F4] flex items-center gap-2 flex-wrap">
          <span className="money-value text-[11px] font-semibold bg-[#FBF3E4] text-[#9A6B12] px-2 py-[3px] rounded-md">
            {/* aportes_netos siempre cae a 0 via coalesce en la vista sql, nunca null */}
            {rendimiento.aportes_netos! > 0 ? "+ aporte " : "− retiro "}
            {formatoValor(Math.abs(rendimiento.aportes_netos!), cuenta.moneda as Moneda)}
          </span>
          <span className="text-[11px] text-[#A0A7B2]">esta parte no es rendimiento</span>
        </div>
      )}
    </div>
  );
}
