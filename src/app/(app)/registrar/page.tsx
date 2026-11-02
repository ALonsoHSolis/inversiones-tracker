import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { CargaRapida } from "@/components/CargaRapida";
import { EmptyAccountsState } from "@/components/EmptyAccountsState";
import { SnapshotForm } from "@/components/SnapshotForm";
import { cargarDatosRegistro } from "@/lib/datos-registro";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Registrar valores" };

export default async function RegistrarPage({
  searchParams,
}: {
  searchParams: Promise<{ cuenta?: string }>;
}) {
  const { cuenta: cuentaInicialId } = await searchParams;
  const supabase = await createClient();
  const { cuentas, movimientosHoy, valorAnteriorPorCuenta } = await cargarDatosRegistro(supabase);

  return (
    <div className="mx-auto max-w-[640px] flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-fg">Registrar valores</h1>
        <p className="mt-1 text-small text-fg-muted">
          Anota cuánto vale hoy cada cuenta. Si además depositaste o retiraste, márcalo: así ese movimiento no se
          cuenta como ganancia.
        </p>
      </div>

      {cuentas.length === 0 ? (
        <EmptyAccountsState />
      ) : (
        <>
          <CargaRapida
            cuentas={cuentas}
            movimientosHoy={movimientosHoy}
            valorAnteriorPorCuenta={valorAnteriorPorCuenta}
            cuentaInicialId={cuentaInicialId}
          />
          <details className="group">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-4 text-small font-semibold text-fg shadow-[inset_0_0_0_1px_var(--color-edge)] hover:bg-white/[0.05] [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              Actualizar varias cuentas de una vez
              <ChevronDown size={16} aria-hidden="true" className="text-fg-muted transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="mt-3">
              <SnapshotForm
                cuentas={cuentas}
                movimientosHoy={movimientosHoy}
                valorAnteriorPorCuenta={valorAnteriorPorCuenta}
              />
            </div>
          </details>
          <p className="text-micro text-fg-muted">
            ¿Corregir un registro antiguo? Entra a una cuenta desde{" "}
            <Link href="/cuentas" className="text-accent underline underline-offset-2">
              Cuentas
            </Link>{" "}
            y abre su historial.
          </p>
        </>
      )}
    </div>
  );
}
