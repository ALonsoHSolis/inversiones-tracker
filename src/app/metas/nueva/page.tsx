import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MetaForm } from "@/components/MetaForm";
import { Logo } from "@/components/Logo";

export default async function NuevaMetaPage() {
  const supabase = await createClient();

  const { data: cuentas } = await supabase
    .from("cuentas")
    .select("id, nombre, plataforma")
    .eq("activa", true)
    .order("created_at");

  return (
    <main className="max-w-[560px] mx-auto px-6 pt-[26px] pb-16">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Logo />
        <Link href="/dashboard" className="text-[12.5px] text-[#8892A0] border-b border-white/[0.14]">
          ← volver al dashboard
        </Link>
      </div>

      <h1 className="text-[19px] font-semibold tracking-[-0.02em] mb-4 text-[#F2F5F9]">Agregar meta de ahorro</h1>
      <MetaForm cuentas={cuentas ?? []} />
    </main>
  );
}
