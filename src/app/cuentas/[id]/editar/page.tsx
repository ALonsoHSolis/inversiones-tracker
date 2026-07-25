import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EditarCuentaForm } from "@/components/EditarCuentaForm";
import { Logo } from "@/components/Logo";

export default async function EditarCuentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // si la cuenta no existe o es de otro usuario, rls la esconde igual —
  // no hay forma de distinguir "no existe" de "no es tuya" desde afuera,
  // y esta bien que sea asi: no confirmamos ni negamos cuentas ajenas.
  const { data: cuenta } = await supabase.from("cuentas").select("*").eq("id", id).single();

  if (!cuenta) notFound();

  return (
    <main className="max-w-[560px] mx-auto px-6 pt-[26px] pb-16">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Logo />
        <Link href="/dashboard" className="text-[12.5px] text-[#8A929E] border-b border-[#DADEE4]">
          ← volver al dashboard
        </Link>
      </div>

      <h1 className="text-[19px] font-semibold tracking-[-0.02em] mb-4">Editar cuenta</h1>
      <EditarCuentaForm cuenta={cuenta} />
    </main>
  );
}
