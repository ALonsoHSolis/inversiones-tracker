import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CuentasInactivas } from "@/components/CuentasInactivas";
import { Logo } from "@/components/Logo";

export default async function CuentasInactivasPage() {
  const supabase = await createClient();

  const { data: cuentas } = await supabase
    .from("cuentas")
    .select("*")
    .eq("activa", false)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-[560px] mx-auto px-6 pt-[26px] pb-16">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Logo />
        <Link href="/dashboard" className="text-[12.5px] text-[#8A929E] border-b border-[#DADEE4]">
          ← volver al dashboard
        </Link>
      </div>

      <h1 className="text-[19px] font-semibold tracking-[-0.02em] mb-1">Cuentas dadas de baja</h1>
      <p className="text-[13px] text-[#8A929E] mb-6">
        no aparecen en tu portafolio, pero su historial sigue guardado. Reactívalas cuando quieras.
      </p>
      <CuentasInactivas cuentas={cuentas ?? []} />
    </main>
  );
}
