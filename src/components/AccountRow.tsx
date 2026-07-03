import Link from "next/link";
import type { Cuenta, RendimientoActual } from "@/types/database";

interface AccountRowProps {
  cuenta: Cuenta;
  rendimiento: RendimientoActual | null;
}

function formatoPesos(valor: number) {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

export function AccountRow({ cuenta, rendimiento }: AccountRowProps) {
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
            {/* valor viene de snapshots.valor, not null en la tabla; la vista solo lo tipa nullable */}
            {rendimiento ? formatoPesos(rendimiento.valor!) : "sin datos aun"}
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
            {formatoPesos(Math.abs(rendimiento.aportes_netos!))}
          </span>
          <span className="text-xs text-gray-500">esta parte no es rendimiento</span>
        </div>
      )}
    </div>
  );
}
