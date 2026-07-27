import { Ayuda } from "@/components/Ayuda";
import { formatoFecha, formatoPct } from "@/lib/formato";

export interface AlertaSalud {
  cuentaId: string;
  nombre: string;
  diasSinActualizar: number | null;
  saltos: { fecha: string; pct: number }[];
  gaps: { diasGap: number; fechaFin: string }[];
}

interface DataHealthViewProps {
  alertas: AlertaSalud[];
}

// "vista de salud de datos": consolida en un solo lugar chequeos que hoy
// viven sueltos (aviso de cuenta antigua en AccountRow, umbral de rendimiento
// implausible en CargaRapida/SnapshotForm/HistorialForm) mas uno nuevo (gaps
// grandes entre registros consecutivos, no solo el gap hasta hoy). registros
// duplicados y fechas fuera de orden no se chequean aca a proposito: el
// primero es estructuralmente imposible (unique(cuenta_id, fecha) en la base)
// y el segundo no es un estado real que pueda darse con la forma en que se
// guardan los datos.
export function DataHealthView({ alertas }: DataHealthViewProps) {
  const cuentasConAlertas = alertas.filter((a) => a.diasSinActualizar != null || a.saltos.length > 0 || a.gaps.length > 0);

  return (
    <section className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-5 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[13.5px] font-semibold text-[#F2F5F9]">Salud de tus datos</p>
        <Ayuda>
          Revisa automáticamente tus cuentas en busca de cosas que valga la pena mirar dos veces:
          cuentas que llevan tiempo sin actualizarse, saltos de rendimiento poco plausibles en el
          historial (el mismo umbral que ya te avisa al guardar un valor), y períodos largos entre
          dos registros consecutivos de la misma cuenta.
        </Ayuda>
      </div>
      <p className="text-[11.5px] text-[#8892A0] mb-4">Cosas que vale la pena revisar</p>

      {cuentasConAlertas.length === 0 ? (
        <p className="text-[13px] text-[#8892A0]">Todo en orden — no hay nada que revisar por ahora.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {cuentasConAlertas.map((a) => (
            <div key={a.cuentaId} className="border border-white/[0.07] rounded-xl px-[15px] py-[13px]">
              <p className="text-[13.5px] font-semibold text-[#F2F5F9]">{a.nombre}</p>
              <ul className="mt-1.5 flex flex-col gap-1 text-[11.5px] text-[#8892A0]">
                {a.diasSinActualizar != null && (
                  <li>
                    sin actualizar hace{" "}
                    <span className="font-mono-tabular text-[#E8A857]">{Math.floor(a.diasSinActualizar)} días</span>
                  </li>
                )}
                {a.saltos.map((s, i) => (
                  <li key={`salto-${i}`}>
                    salto de{" "}
                    <span className="font-mono-tabular" style={{ color: s.pct >= 0 ? "var(--pos)" : "var(--neg)" }}>
                      {formatoPct(s.pct)}
                    </span>{" "}
                    el {formatoFecha(s.fecha)} — vale la pena confirmar que el valor esté bien
                  </li>
                ))}
                {a.gaps.map((g, i) => (
                  <li key={`gap-${i}`}>
                    <span className="font-mono-tabular text-[#E8A857]">{Math.floor(g.diasGap)} días</span> sin
                    registros antes del {formatoFecha(g.fechaFin)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
