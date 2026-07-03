import Link from "next/link";
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

export function AccountRow({ cuenta, rendimiento, valorActualFallback }: AccountRowProps) {
  const valor = rendimiento?.valor ?? valorActualFallback;
  const tieneAporte = (rendimiento?.aportes_netos ?? 0) !== 0;
  const esPositivo = (rendimiento?.rendimiento_pct ?? 0) >= 0;

  return (
    <div className="rounded-lg border border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{cuenta.nombre}</p>
          <p className="text-xs text-gray-500">
            {cuenta.plataforma}
            {" · "}
            <Link href={`/cuentas/${cuenta.id}/editar`} className="underline">
              editar
            </Link>
            {" · "}
            <Link href={`/cuentas/${cuenta.id}/historial`} className="underline">
              historial
            </Link>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {valor != null ? formatoValor(valor, cuenta.moneda as Moneda) : "sin datos aun"}
          </p>
          {rendimiento?.rendimiento_pct != null && (
            <p className={`text-xs mt-0.5 ${esPositivo ? "text-green-700" : "text-red-700"}`}>
              {esPositivo ? "+" : ""}
              {rendimiento.rendimiento_pct.toFixed(1)}% real
            </p>
          )}
        </div>
      </div>
      {tieneAporte && rendimiento && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
            {/* aportes_netos siempre cae a 0 via coalesce en la vista sql, nunca null */}
            {rendimiento.aportes_netos! > 0 ? "+ aporte" : "- retiro"}{" "}
            {formatoValor(Math.abs(rendimiento.aportes_netos!), cuenta.moneda as Moneda)}
          </span>
          <span className="text-xs text-gray-500">esta parte no es rendimiento</span>
        </div>
      )}
    </div>
  );
}
