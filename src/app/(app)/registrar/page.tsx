import type { Metadata } from "next";
import Link from "next/link";
import { CargaRapida } from "@/components/CargaRapida";
import { EmptyAccountsState } from "@/components/EmptyAccountsState";
import { SnapshotForm } from "@/components/SnapshotForm";
import { cargarDatosRegistro } from "@/lib/datos-registro";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Registrar valores" };

export default async function RegistrarPage() {
  const supabase = await createClient();
  const { cuentas, movimientosHoy, valorAnteriorPorCuenta } = await cargarDatosRegistro(supabase);

  return (
    <div className="mx-auto max-w-[640px] flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">Registrar valores</h1>
        <p className="mt-1 text-small text-fg-muted">
          Anota cuánto vale hoy cada cuenta. Si además depositaste o retiraste, márcalo: así ese movimiento no se
          cuenta como ganancia.
        </p>
      </div>

      {cuentas.length === 0 ? (
        <EmptyAccountsState />
      ) : (
        <>
          <CargaRapida cuentas={cuentas} movimientosHoy={movimientosHoy} valorAnteriorPorCuenta={valorAnteriorPorCuenta} />
          <details className="group card p-5">
            <summary className="cursor-pointer list-none text-small font-semibold text-fg [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded">
              Actualizar varias cuentas de una vez
            </summary>
            <div className="mt-4">
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
