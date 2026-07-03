import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditarCuentaForm } from "@/components/EditarCuentaForm";

export default async function EditarCuentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // si la cuenta no existe o es de otro usuario, rls la esconde igual —
  // no hay forma de distinguir "no existe" de "no es tuya" desde afuera,
  // y esta bien que sea asi: no confirmamos ni negamos cuentas ajenas.
  const { data: cuenta } = await supabase.from("cuentas").select("*").eq("id", id).single();

  if (!cuenta) notFound();

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-xl font-medium mb-6">editar cuenta</h1>
      <EditarCuentaForm cuenta={cuenta} />
    </main>
  );
}
