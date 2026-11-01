import { createClient } from "@/lib/supabase/server";
import { CuentasInactivas } from "@/components/CuentasInactivas";

export default async function CuentasInactivasPage() {
  const supabase = await createClient();

  const { data: cuentas } = await supabase
    .from("cuentas")
    .select("*")
    .eq("activa", false)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-[560px]">

      <h1 className="text-[19px] font-semibold tracking-[-0.02em] mb-1 text-fg">Cuentas dadas de baja</h1>
      <p className="text-small text-fg-muted mb-6">
        no aparecen en tu portafolio, pero su historial sigue guardado. Reactívalas cuando quieras.
      </p>
      <CuentasInactivas cuentas={cuentas ?? []} />
    </div>
  );
}
