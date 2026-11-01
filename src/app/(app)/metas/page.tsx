import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MetasList, type MetaConProgreso } from "@/components/MetasList";

export default async function MetasPage() {
  const supabase = await createClient();

  const [{ data: metas }, { data: metaCuentas }, { data: cuentas }, { data: capitalPorCuenta }] = await Promise.all([
    supabase.from("metas").select("*").order("created_at"),
    supabase.from("meta_cuentas").select("meta_id, cuenta_id"),
    supabase.from("cuentas").select("id, nombre").eq("activa", true),
    supabase.from("capital_por_cuenta").select("cuenta_id, valor_actual_clp"),
  ]);

  const nombrePorCuentaId = new Map((cuentas ?? []).map((c) => [c.id, c.nombre]));
  const valorClpPorCuentaId = new Map(
    (capitalPorCuenta ?? [])
      .filter((c): c is typeof c & { cuenta_id: string } => c.cuenta_id !== null)
      .map((c) => [c.cuenta_id, c.valor_actual_clp ?? 0])
  );

  const cuentaIdsPorMeta = new Map<string, string[]>();
  (metaCuentas ?? []).forEach((mc) => {
    const lista = cuentaIdsPorMeta.get(mc.meta_id) ?? [];
    lista.push(mc.cuenta_id);
    cuentaIdsPorMeta.set(mc.meta_id, lista);
  });

  const metasConProgreso: MetaConProgreso[] = (metas ?? []).map((meta) => {
    const cuentaIds = cuentaIdsPorMeta.get(meta.id) ?? [];
    return {
      id: meta.id,
      nombre: meta.nombre,
      montoObjetivo: meta.monto_objetivo,
      montoActualClp: cuentaIds.reduce((acc, id) => acc + (valorClpPorCuentaId.get(id) ?? 0), 0),
      fechaObjetivo: meta.fecha_objetivo,
      cuentasAsociadas: cuentaIds.map((id) => nombrePorCuentaId.get(id)).filter((n): n is string => !!n),
    };
  });

  return (
    <div className="mx-auto max-w-[640px]">

      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">Tus metas de ahorro</h1>
        <Link
          href="/metas/nueva"
          className="inline-flex h-10 items-center gap-1 rounded-full border border-accent/40 px-4 text-small font-semibold text-accent no-underline hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          + Agregar meta
        </Link>
      </div>
      <p className="text-small text-fg-muted mb-6">
        El progreso suma el valor actual (en CLP) de las cuentas que asociaste a cada meta.
      </p>
      <MetasList metas={metasConProgreso} />
    </div>
  );
}
