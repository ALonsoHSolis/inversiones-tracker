import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarPreferenciaRecordatorios, actualizarPreferenciaReporteMensual } from "./actions";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const recordatoriosActivos = user.user_metadata?.recordatorios_activos !== false;
  const reporteMensualActivo = user.user_metadata?.reporte_mensual_activo !== false;

  return (
    <div className="mx-auto max-w-[560px]">

      <section className="card p-6">
        <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-fg">Perfil</h1>
        <p className="mt-1 text-small text-fg-muted">{user.email}</p>

        <div className="mt-6 pt-6 border-t border-white/[0.07] flex items-center justify-between gap-4">
          <div>
            <p className="text-small font-semibold text-fg">Recordatorios semanales</p>
            <p className="mt-1 text-micro text-fg-muted max-w-[320px]">
              Un correo semanal para recordarte actualizar el valor de tus cuentas.
            </p>
          </div>
          <form action={actualizarPreferenciaRecordatorios}>
            <input type="hidden" name="activar" value={(!recordatoriosActivos).toString()} />
            <button
              type="submit"
              className={
                recordatoriosActivos
                  ? "h-9 px-4 rounded-[9px] border border-white/[0.14] bg-white/[0.04] text-micro font-semibold text-fg whitespace-nowrap"
                  : "h-9 px-4 rounded-[9px] bg-[var(--accent)] text-ink text-micro font-semibold whitespace-nowrap"
              }
            >
              {recordatoriosActivos ? "Desactivar" : "Activar"}
            </button>
          </form>
        </div>

        <div className="mt-4 pt-4 border-t border-white/[0.07] flex items-center justify-between gap-4">
          <div>
            <p className="text-small font-semibold text-fg">Reporte mensual de rendimiento</p>
            <p className="mt-1 text-micro text-fg-muted max-w-[320px]">
              Un correo a fin de mes con tu valor total, capital aportado, ganancia y cómo te fue en
              el mes.
            </p>
          </div>
          <form action={actualizarPreferenciaReporteMensual}>
            <input type="hidden" name="activar" value={(!reporteMensualActivo).toString()} />
            <button
              type="submit"
              className={
                reporteMensualActivo
                  ? "h-9 px-4 rounded-[9px] border border-white/[0.14] bg-white/[0.04] text-micro font-semibold text-fg whitespace-nowrap"
                  : "h-9 px-4 rounded-[9px] bg-[var(--accent)] text-ink text-micro font-semibold whitespace-nowrap"
              }
            >
              {reporteMensualActivo ? "Desactivar" : "Activar"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
