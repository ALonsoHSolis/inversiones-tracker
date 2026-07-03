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
    <main className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-xl font-medium mb-1">cuentas dadas de baja</h1>
      <p className="text-sm text-gray-500 mb-6">
        no aparecen en tu portafolio, pero su historial sigue guardado. reactívalas cuando quieras.
      </p>
      <CuentasInactivas cuentas={cuentas ?? []} />
    </main>
  );
}
