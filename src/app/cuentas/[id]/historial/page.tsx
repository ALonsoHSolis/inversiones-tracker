import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HistorialForm } from "@/components/HistorialForm";
import { Logo } from "@/components/Logo";
import type { TipoMovimiento } from "@/types/database";

export default async function HistorialCuentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cuenta } = await supabase.from("cuentas").select("*").eq("id", id).single();
  if (!cuenta) notFound();

  const [{ data: snapshots }, { data: movimientos }] = await Promise.all([
    supabase.from("snapshots").select("*").eq("cuenta_id", id).order("fecha", { ascending: false }),
    supabase.from("movimientos").select("*").eq("cuenta_id", id),
  ]);

  // por snapshot, el movimiento asociado: ligado por snapshot_id, o huerfano
  // (snapshot_id null, caso del aporte inicial de crear_cuenta_con_aporte_inicial)
  // en la misma fecha -- mismo criterio que ahora usa guardar_snapshot_con_movimiento,
  // para que el formulario prellene exactamente lo que la funcion "adoptaria" al guardar.
  const movimientoPorSnapshotId = new Map(
    (movimientos ?? []).filter((m) => m.snapshot_id).map((m) => [m.snapshot_id as string, m])
  );
  const movimientoHuerfanoPorFecha = new Map(
    (movimientos ?? []).filter((m) => !m.snapshot_id).map((m) => [m.fecha, m])
  );

  const filas = (snapshots ?? []).map((snapshot) => {
    const movimiento = movimientoPorSnapshotId.get(snapshot.id) ?? movimientoHuerfanoPorFecha.get(snapshot.fecha) ?? null;
    return {
      snapshotId: snapshot.id,
      fecha: snapshot.fecha,
      valor: snapshot.valor,
      tasaCambio: snapshot.tasa_cambio,
      movimiento: movimiento ? { tipo: movimiento.tipo as TipoMovimiento, monto: movimiento.monto } : null,
    };
  });

  return (
    <main className="max-w-[560px] mx-auto px-6 pt-[26px] pb-16">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Logo />
        <Link href="/dashboard" className="text-[12.5px] text-[#8A929E] border-b border-[#DADEE4]">
          ← volver al dashboard
        </Link>
      </div>

      <h1 className="text-[19px] font-semibold tracking-[-0.02em] mb-1">Historial</h1>
      <p className="text-[13px] text-[#8A929E] mb-6">{cuenta.nombre}</p>
      <HistorialForm cuenta={cuenta} filas={filas} />
    </main>
  );
}
