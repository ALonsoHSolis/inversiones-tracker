import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { actualizarPreferenciaRecordatorios } from "./actions";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const recordatoriosActivos = user.user_metadata?.recordatorios_activos !== false;

  return (
    <main className="max-w-[560px] mx-auto px-6 pt-[26px] pb-16">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Logo />
        <Link href="/dashboard" className="text-[12.5px] text-[#8892A0] border-b border-white/[0.14]">
          ← volver al dashboard
        </Link>
      </div>

      <section className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-6 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]">
        <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-[#F2F5F9]">Perfil</h1>
        <p className="mt-1 text-[13px] text-[#8892A0]">{user.email}</p>

        <div className="mt-6 pt-6 border-t border-white/[0.07] flex items-center justify-between gap-4">
          <div>
            <p className="text-[13.5px] font-semibold text-[#F2F5F9]">Recordatorios semanales</p>
            <p className="mt-1 text-[12.5px] text-[#8892A0] max-w-[320px]">
              Un correo semanal para recordarte actualizar el valor de tus cuentas.
            </p>
          </div>
          <form action={actualizarPreferenciaRecordatorios}>
            <input type="hidden" name="activar" value={(!recordatoriosActivos).toString()} />
            <button
              type="submit"
              className={
                recordatoriosActivos
                  ? "h-9 px-4 rounded-[9px] border border-white/[0.14] bg-white/[0.04] text-[12.5px] font-semibold text-[#F2F5F9] whitespace-nowrap"
                  : "h-9 px-4 rounded-[9px] bg-[var(--accent)] text-[#0A0D13] text-[12.5px] font-semibold whitespace-nowrap"
              }
            >
              {recordatoriosActivos ? "Desactivar" : "Activar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
