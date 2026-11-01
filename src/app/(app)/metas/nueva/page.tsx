import { createClient } from "@/lib/supabase/server";
import { MetaForm } from "@/components/MetaForm";

export default async function NuevaMetaPage() {
  const supabase = await createClient();

  const { data: cuentas } = await supabase
    .from("cuentas")
    .select("id, nombre, plataforma")
    .eq("activa", true)
    .order("created_at");

  return (
    <div className="mx-auto max-w-[560px]">

      <h1 className="text-[19px] font-semibold tracking-[-0.02em] mb-4 text-fg">Agregar meta de ahorro</h1>
      <MetaForm cuentas={cuentas ?? []} />
    </div>
  );
}
