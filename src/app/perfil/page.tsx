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
        <Link href="/dashboard" className="text-[12.5px] text-[#8A929E] border-b border-[#DADEE4]">
          ← volver al dashboard
        </Link>
      </div>

      <section className="bg-white border border-[#E7E9EE] rounded-2xl p-6">
        <h1 className="text-[19px] font-semibold tracking-[-0.02em]">Perfil</h1>
        <p className="mt-1 text-[13px] text-[#8A929E]">{user.email}</p>

        <div className="mt-6 pt-6 border-t border-[#E7E9EE] flex items-center justify-between gap-4">
          <div>
            <p className="text-[13.5px] font-semibold">Recordatorios semanales</p>
            <p className="mt-1 text-[12.5px] text-[#8A929E] max-w-[320px]">
              Un correo semanal para recordarte actualizar el valor de tus cuentas.
            </p>
          </div>
          <form action={actualizarPreferenciaRecordatorios}>
            <input type="hidden" name="activar" value={(!recordatoriosActivos).toString()} />
            <button
              type="submit"
              className={
                recordatoriosActivos
                  ? "h-9 px-4 rounded-[9px] border border-[#E1E4EA] bg-white text-[12.5px] font-semibold text-[#171a20] whitespace-nowrap"
                  : "h-9 px-4 rounded-[9px] bg-[var(--accent)] text-white text-[12.5px] font-semibold whitespace-nowrap"
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
