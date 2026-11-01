import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { PrivacyShell, PrivacyToggleButton } from "@/components/PrivacyShell";
import { TIPOS } from "@/lib/tipos-cuenta";
import { fechaHoyChile } from "@/lib/fecha";
import { formatoPct, formatoPesos, formatoPesosSigned } from "@/lib/formato";
import { calcularInformeMensual, esMesValido, mesesDisponibles } from "@/lib/informe";

export const metadata: Metadata = {
  title: "Informe mensual — Mi portafolio",
  robots: { index: false },
};

// "octubre de 2026" -> "Octubre de 2026" (solo la primera letra, no cada palabra)
const nombreMes = (mes: string) => {
  const texto = new Date(`${mes}-01T00:00:00Z`).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const colorSigno = (n: number) => (n >= 0 ? "var(--color-pos)" : "var(--color-neg)");

export default async function InformePage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes: mesPedido } = await searchParams;
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: evolucion },
    { data: capitalPorCuenta },
    { data: cuentas },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("evolucion_portafolio").select("*").order("fecha"),
    supabase.from("capital_por_cuenta").select("*"),
    supabase.from("cuentas").select("id, plataforma, tipo, moneda").eq("activa", true),
  ]);
  if (!user) redirect("/login");

  const puntos = (evolucion ?? [])
    .filter((p) => p.fecha != null && p.valor_total_clp != null && p.capital_aportado_acumulado_clp != null)
    .map((p) => ({
      fecha: p.fecha!,
      valorTotalClp: p.valor_total_clp!,
      capitalAportadoAcumuladoClp: p.capital_aportado_acumulado_clp!,
    }));

  const meses = mesesDisponibles(puntos);
  const mes = esMesValido(mesPedido) && meses.includes(mesPedido) ? mesPedido : meses[0];
  const informe = mes ? calcularInformeMensual(puntos, mes) : null;

  const cuentaPorId = new Map((cuentas ?? []).map((c) => [c.id, c]));
  const etiquetaTipo = new Map<string, string>(TIPOS.map((t) => [t.value, t.label]));
  const filas = (capitalPorCuenta ?? [])
    .filter((c) => c.cuenta_id && cuentaPorId.has(c.cuenta_id))
    .map((c) => {
      const cuenta = cuentaPorId.get(c.cuenta_id!)!;
      const capitalNativo = c.capital_aportado ?? 0;
      return {
        id: c.cuenta_id!,
        nombre: c.nombre ?? "",
        plataforma: cuenta.plataforma,
        tipo: etiquetaTipo.get(cuenta.tipo) ?? cuenta.tipo,
        moneda: cuenta.moneda,
        capitalClp: c.capital_aportado_clp ?? 0,
        valorClp: c.valor_actual_clp ?? 0,
        gananciaClp: (c.valor_actual_clp ?? 0) - (c.capital_aportado_clp ?? 0),
        // regla 5: el % por cuenta se calcula en moneda nativa (sin ruido cambiario)
        rendimientoNativoPct: capitalNativo > 0 ? (((c.valor_actual ?? 0) - capitalNativo) / capitalNativo) * 100 : null,
      };
    })
    .sort((a, b) => b.valorClp - a.valorClp);

  const totales = filas.reduce(
    (acc, f) => ({ capital: acc.capital + f.capitalClp, valor: acc.valor + f.valorClp }),
    { capital: 0, valor: 0 }
  );

  return (
    <PrivacyShell>
      <main className="max-w-[860px] mx-auto px-6 pt-[26px] pb-16">
        <div className="no-print flex items-center justify-between gap-3 flex-wrap mb-6">
          <Link href="/dashboard" className="text-small font-medium text-fg-muted hover:text-fg">
            ← Volver al dashboard
          </Link>
          <div className="flex items-center gap-2">
            <PrivacyToggleButton />
            <PrintButton className="h-[34px] px-3.5 rounded-full bg-[var(--accent)] text-ink text-small font-semibold transition-[transform,background-color] duration-150 hover:bg-accent-hi active:scale-[0.98]" />
          </div>
        </div>

        {!informe || !mes ? (
          <section className="card p-8 text-center">
            <p className="text-base font-semibold text-fg">Aún no hay datos para un informe</p>
            <p className="mt-2 text-small text-fg-muted">
              Cuando registres el valor de al menos una cuenta, aquí verás tu estado de cuenta mensual.
            </p>
          </section>
        ) : (
          <article className="card p-7 md:p-10 animate-fade-up">
            <header className="flex items-start justify-between gap-6 flex-wrap pb-6 border-b border-white/[0.08]">
              <Logo subtitle="Estado de cuenta" />
              <div className="sm:text-right">
                <p className="text-micro uppercase tracking-[0.14em] font-semibold text-accent">Informe mensual</p>
                <p className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-fg">{nombreMes(mes)}</p>
                <p className="mt-0.5 text-micro text-fg-muted">Emitido el {fechaHoyChile().split("-").reverse().join("-")}</p>
              </div>
            </header>

            <nav aria-label="Elegir mes" className="no-print flex flex-wrap gap-2 mt-5">
              {meses.slice(0, 12).map((m) => (
                <Link
                  key={m}
                  href={`/informe?mes=${m}`}
                  aria-current={m === mes ? "page" : undefined}
                  className={`px-3 py-1 rounded-full border text-micro font-medium ${
                    m === mes
                      ? "border-accent/60 bg-accent/15 text-accent-hi"
                      : "border-white/[0.1] text-fg-muted hover:border-white/[0.24]"
                  }`}
                >
                  {nombreMes(m)}
                </Link>
              ))}
            </nav>

            <section className="mt-8">
              <p className="text-micro uppercase tracking-[0.12em] font-semibold text-fg-muted">
                Ganancia real del mes
              </p>
              <p
                className="money-value mt-2 font-mono-tabular text-[40px] font-semibold leading-none tracking-[-0.02em]"
                style={{ color: colorSigno(informe.gananciaMesClp) }}
              >
                {formatoPesosSigned(informe.gananciaMesClp)}
                {informe.gananciaMesPct !== null && (
                  <span className="ml-2.5 text-[18px] font-medium">({formatoPct(informe.gananciaMesPct)})</span>
                )}
              </p>
              <p className="mt-2 text-small text-fg-muted max-w-[560px]">
                Es lo que tu dinero produjo en el mes, sin contar los aportes y retiros que hiciste.
              </p>

              <dl className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  ["Valor al inicio del mes", formatoPesos(informe.valorInicioClp)],
                  [
                    informe.aportesNetosClp >= 0 ? "Aportes netos del mes" : "Retiros netos del mes",
                    formatoPesosSigned(informe.aportesNetosClp),
                  ],
                  ["Valor al cierre", formatoPesos(informe.valorFinClp)],
                ].map(([k, v]) => (
                  <div key={k} className="border-t border-white/[0.08] pt-3">
                    <dt className="text-micro text-fg-muted">{k}</dt>
                    <dd className="money-value mt-1 font-mono-tabular text-[17px] font-semibold text-fg">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-9">
              <p className="text-micro uppercase tracking-[0.12em] font-semibold text-fg-muted">
                Acumulado al cierre del mes
              </p>
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="border-t border-white/[0.08] pt-3">
                  <dt className="text-micro text-fg-muted">Capital aportado</dt>
                  <dd className="money-value mt-1 font-mono-tabular text-[17px] font-semibold text-fg">
                    {formatoPesos(informe.capitalAcumuladoClp)}
                  </dd>
                </div>
                <div className="border-t border-white/[0.08] pt-3">
                  <dt className="text-micro text-fg-muted">Valor del portafolio</dt>
                  <dd className="money-value mt-1 font-mono-tabular text-[17px] font-semibold text-fg">
                    {formatoPesos(informe.valorFinClp)}
                  </dd>
                </div>
                <div className="border-t border-white/[0.08] pt-3">
                  <dt className="text-micro text-fg-muted">Ganancia total</dt>
                  <dd
                    className="money-value mt-1 font-mono-tabular text-[17px] font-semibold"
                    style={{ color: colorSigno(informe.gananciaAcumuladaClp) }}
                  >
                    {formatoPesosSigned(informe.gananciaAcumuladaClp)}
                    {informe.gananciaAcumuladaPct !== null && (
                      <span className="ml-1.5 text-small font-medium">({formatoPct(informe.gananciaAcumuladaPct)})</span>
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="mt-9">
              <p className="text-micro uppercase tracking-[0.12em] font-semibold text-fg-muted">
                Estado actual de tus cuentas
              </p>
              <div className="mt-4 hidden sm:block">
                <table className="w-full text-small border-collapse">
                  <thead>
                    <tr className="text-micro text-fg-muted text-left">
                      <th className="font-medium py-2 pr-3">Cuenta</th>
                      <th className="font-medium py-2 px-3 text-right">Capital aportado</th>
                      <th className="font-medium py-2 px-3 text-right">Valor actual</th>
                      <th className="font-medium py-2 px-3 text-right">Ganancia</th>
                      <th className="font-medium py-2 pl-3 text-right">Rend. (moneda nativa)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((f) => (
                      <tr key={f.id} className="border-t border-white/[0.07]">
                        <td className="py-3 pr-3">
                          <p className="font-semibold text-fg">{f.nombre}</p>
                          <p className="text-micro text-fg-muted">
                            {f.plataforma} · {f.tipo}
                            {f.moneda !== "CLP" ? ` · ${f.moneda}` : ""}
                          </p>
                        </td>
                        <td className="money-value py-3 px-3 text-right font-mono-tabular text-fg-soft">
                          {formatoPesos(f.capitalClp)}
                        </td>
                        <td className="money-value py-3 px-3 text-right font-mono-tabular text-fg">
                          {formatoPesos(f.valorClp)}
                        </td>
                        <td
                          className="money-value py-3 px-3 text-right font-mono-tabular"
                          style={{ color: colorSigno(f.gananciaClp) }}
                        >
                          {formatoPesosSigned(f.gananciaClp)}
                        </td>
                        <td
                          className="py-3 pl-3 text-right font-mono-tabular"
                          style={{ color: f.rendimientoNativoPct == null ? undefined : colorSigno(f.rendimientoNativoPct) }}
                        >
                          {f.rendimientoNativoPct == null ? "—" : formatoPct(f.rendimientoNativoPct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/[0.16]">
                      <td className="py-3 pr-3 font-semibold text-fg">Total</td>
                      <td className="money-value py-3 px-3 text-right font-mono-tabular font-semibold text-fg-soft">
                        {formatoPesos(totales.capital)}
                      </td>
                      <td className="money-value py-3 px-3 text-right font-mono-tabular font-semibold text-fg">
                        {formatoPesos(totales.valor)}
                      </td>
                      <td
                        className="money-value py-3 px-3 text-right font-mono-tabular font-semibold"
                        style={{ color: colorSigno(totales.valor - totales.capital) }}
                      >
                        {formatoPesosSigned(totales.valor - totales.capital)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              <ul className="mt-4 sm:hidden divide-y divide-white/[0.07] border-y border-white/[0.07]">
                {filas.map((f) => (
                  <li key={f.id} className="py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-small font-semibold text-fg">{f.nombre}</p>
                        <p className="text-micro text-fg-muted">
                          {f.plataforma} · {f.tipo}
                          {f.moneda !== "CLP" ? ` · ${f.moneda}` : ""}
                        </p>
                      </div>
                      <p className="money-value font-mono-tabular text-small font-semibold text-fg whitespace-nowrap">
                        {formatoPesos(f.valorClp)}
                      </p>
                    </div>
                    <div className="mt-2 flex justify-between gap-3 text-micro text-fg-muted">
                      <span>
                        Capital <span className="money-value font-mono-tabular text-fg-soft">{formatoPesos(f.capitalClp)}</span>
                      </span>
                      <span className="font-mono-tabular" style={{ color: colorSigno(f.gananciaClp) }}>
                        <span className="money-value">{formatoPesosSigned(f.gananciaClp)}</span>
                        {f.rendimientoNativoPct != null && <> · {formatoPct(f.rendimientoNativoPct)}</>}
                      </span>
                    </div>
                  </li>
                ))}
                <li className="py-3.5 flex justify-between gap-3 text-small font-semibold">
                  <span className="text-fg">Total</span>
                  <span className="money-value font-mono-tabular text-fg">{formatoPesos(totales.valor)}</span>
                </li>
              </ul>
            </section>

            <footer className="mt-9 pt-5 border-t border-white/[0.08] text-micro leading-relaxed text-fg-muted">
              Los aportes y retiros nunca se cuentan como ganancia. Los montos en pesos de cuentas en USD o UF usan
              la tasa de cambio del día de cada registro, no la de hoy. El rendimiento por cuenta se muestra en su
              moneda nativa; los totales, en pesos chilenos.
            </footer>
          </article>
        )}
      </main>
    </PrivacyShell>
  );
}
