import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MetasList, type MetaConProgreso } from "@/components/MetasList";
import { Logo } from "@/components/Logo";

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
    <main className="max-w-[560px] mx-auto px-6 pt-[26px] pb-16">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Logo />
        <Link href="/dashboard" className="text-[12.5px] text-[#8892A0] border-b border-white/[0.14]">
          ← volver al dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-[#F2F5F9]">Tus metas de ahorro</h1>
        <Link
          href="/metas/nueva"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--accent)] no-underline"
        >
          + agregar meta
        </Link>
      </div>
      <p className="text-[13px] text-[#8892A0] mb-6">
        El progreso suma el valor actual (en CLP) de las cuentas que asociaste a cada meta.
      </p>
      <MetasList metas={metasConProgreso} />
    </main>
  );
}
