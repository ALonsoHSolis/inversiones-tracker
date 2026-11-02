import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MetasList, type MetaConProgreso } from "@/components/MetasList";
import { calcularMetasConProgreso } from "@/lib/dashboard";
import { Plus } from "lucide-react";

export default async function MetasPage() {
  const supabase = await createClient();

  const [{ data: metas }, { data: metaCuentas }, { data: cuentas }, { data: capitalPorCuenta }] = await Promise.all([
    supabase.from("metas").select("*").order("created_at"),
    supabase.from("meta_cuentas").select("meta_id, cuenta_id"),
    supabase.from("cuentas").select("id, nombre").eq("activa", true),
    supabase.from("capital_por_cuenta").select("cuenta_id, capital_aportado_clp, valor_actual_clp"),
  ]);

  // mismo calculo que el dashboard (src/lib/dashboard.ts, con tests): antes
  // estaba duplicado aca en linea (hallazgo 1 de docs/hallazgos-rediseno.md).
  const nombrePorCuentaId = new Map((cuentas ?? []).map((c) => [c.id, c.nombre]));
  const capitalPorCuentaId = new Map(
    (capitalPorCuenta ?? [])
      .filter((c): c is typeof c & { cuenta_id: string } => c.cuenta_id !== null)
      .map((c) => [c.cuenta_id, c])
  );
  const metasConProgreso: MetaConProgreso[] = calcularMetasConProgreso(
    metas ?? [],
    metaCuentas ?? [],
    capitalPorCuentaId,
    nombrePorCuentaId
  );

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-fg">Metas de ahorro</h1>
          <p className="mt-1 text-small text-fg-muted">
            El progreso suma el valor actual (en CLP) de las cuentas que asociaste a cada meta.
          </p>
        </div>
        {metasConProgreso.length > 0 && (
          <Link href="/metas/nueva" className="boton-primario no-underline">
            <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
            Agregar meta
          </Link>
        )}
      </div>
      {metasConProgreso.length > 0 ? (
        <section className="card px-5 py-3">
          <MetasList metas={metasConProgreso} />
        </section>
      ) : (
        <MetasList metas={metasConProgreso} />
      )}
    </div>
  );
}
