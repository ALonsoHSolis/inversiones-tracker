"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { formatoFecha, formatoPct, formatoPesos } from "@/lib/formato";
import {
  agruparPorPlataforma,
  FILTROS_VACIOS,
  filtrarCuentas,
  hayFiltrosActivos,
  opcionesPlataforma,
  ordenarCuentas,
  totalClp,
  type ClaveOrden,
  type Direccion,
  type FilaCuenta,
  type Filtros,
} from "@/lib/cuentas-tabla";

const FOCO = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const CAMPO =
  "h-10 rounded-[10px] border border-control bg-surface-raised px-3 text-small text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const OPCIONES_ORDEN: { clave: ClaveOrden; etiqueta: string }[] = [
  { clave: "valor", etiqueta: "Valor" },
  { clave: "rendimiento", etiqueta: "Rendimiento real" },
  { clave: "nombre", etiqueta: "Nombre" },
  { clave: "plataforma", etiqueta: "Plataforma" },
  { clave: "actualizacion", etiqueta: "Último registro" },
];

// la direccion natural de cada columna al elegirla por primera vez
const DIRECCION_INICIAL: Record<ClaveOrden, Direccion> = {
  nombre: "asc",
  plataforma: "asc",
  valor: "desc",
  rendimiento: "desc",
  actualizacion: "desc",
};

function Rendimiento({ fila }: { fila: FilaCuenta }) {
  if (fila.rendimientoPct == null) return <span className="text-fg-subtle">—</span>;
  return (
    <span
      className="font-mono-tabular font-semibold"
      style={{ color: fila.rendimientoPct >= 0 ? "var(--color-pos)" : "var(--color-neg)" }}
    >
      {formatoPct(fila.rendimientoPct)}
      {fila.moneda !== "CLP" && <span className="ml-1 text-micro font-medium text-fg-muted">{fila.moneda}</span>}
    </span>
  );
}

function Antiguo({ fila }: { fila: FilaCuenta }) {
  if (!fila.datoAntiguo || fila.diasSinActualizar == null) return null;
  return (
    <span className="rounded-md bg-white/[0.08] px-1.5 py-px text-micro font-medium text-fg-soft">
      hace {Math.floor(fila.diasSinActualizar)} días
    </span>
  );
}

// la vista ya descuenta el aporte/retiro del rendimiento; este chip solo avisa
// que lo hubo, para que nadie lo lea como ganancia.
function ChipMovimiento({ fila }: { fila: FilaCuenta }) {
  if (!fila.aporteNeto) return null;
  const esAporte = fila.aporteNeto > 0;
  return (
    <span
      title="Hubo un movimiento de capital en el último período; no se cuenta como rendimiento."
      className="rounded-md bg-accent/15 px-1.5 py-px text-micro font-semibold text-accent"
    >
      {esAporte ? "+ aporte" : "− retiro"}
    </span>
  );
}

function Acciones({ fila }: { fila: FilaCuenta }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/cuentas/${fila.id}/historial`}
        className={`rounded-lg px-2.5 py-2 text-small font-medium text-fg-soft no-underline hover:bg-white/[0.06] hover:text-fg ${FOCO}`}
      >
        Historial
      </Link>
      <Link
        href={`/cuentas/${fila.id}/editar`}
        className={`rounded-lg px-2.5 py-2 text-small font-medium text-fg-soft no-underline hover:bg-white/[0.06] hover:text-fg ${FOCO}`}
      >
        Editar
      </Link>
    </div>
  );
}

function CabeceraOrdenable({
  clave,
  etiqueta,
  alineada,
  orden,
  direccion,
  alOrdenar,
}: {
  clave: ClaveOrden;
  etiqueta: string;
  alineada?: "right";
  orden: ClaveOrden;
  direccion: Direccion;
  alOrdenar: (c: ClaveOrden) => void;
}) {
  const activa = orden === clave;
  const Icono = !activa ? ArrowUpDown : direccion === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={activa ? (direccion === "asc" ? "ascending" : "descending") : "none"}
      className={`px-3 py-2 font-medium ${alineada === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={() => alOrdenar(clave)}
        className={`inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-micro font-semibold uppercase tracking-[0.08em] transition-colors duration-150 hover:text-fg ${FOCO} ${
          activa ? "text-fg" : "text-fg-muted"
        }`}
      >
        {etiqueta}
        <Icono size={13} aria-hidden="true" className={activa ? "" : "opacity-60"} />
      </button>
    </th>
  );
}

function FilaEscritorio({ fila }: { fila: FilaCuenta }) {
  return (
    <tr className="border-t border-[var(--line)] transition-colors duration-150 hover:bg-white/[0.03]">
      <td className="px-3 py-3">
        <p className="flex flex-wrap items-center gap-2 text-small font-semibold text-fg">
          {fila.nombre}
          <ChipMovimiento fila={fila} />
        </p>
        <p className="mt-0.5 text-micro text-fg-muted">
          {fila.plataforma} · {fila.tipoLabel}
        </p>
      </td>
      <td className="px-3 py-3 text-right">
        <span className="money-value font-mono-tabular text-small font-semibold text-fg">
          {fila.valorClp != null ? formatoPesos(fila.valorClp) : "sin datos aún"}
        </span>
      </td>
      <td className="px-3 py-3 text-right text-small">
        <Rendimiento fila={fila} />
      </td>
      <td className="px-3 py-3 text-right text-small">
        {fila.anualizadoPct != null ? (
          <span className="font-mono-tabular text-fg-soft">{formatoPct(fila.anualizadoPct)}</span>
        ) : (
          <span className="text-fg-subtle">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-small text-fg-soft">
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {fila.ultimaFecha ? formatoFecha(fila.ultimaFecha) : <span className="text-fg-subtle">—</span>}
          <Antiguo fila={fila} />
        </span>
      </td>
      <td className="px-2 py-2">
        <Acciones fila={fila} />
      </td>
    </tr>
  );
}

function FilaMovil({ fila }: { fila: FilaCuenta }) {
  return (
    <li className="flex items-stretch gap-1 border-t border-[var(--line)] first:border-t-0">
      <Link
        href={`/cuentas/${fila.id}/historial`}
        aria-label={`${fila.nombre}: ver historial`}
        className={`min-w-0 flex-1 rounded-lg px-1 py-3 no-underline ${FOCO}`}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-small font-semibold text-fg">{fila.nombre}</span>
          <span className="money-value shrink-0 font-mono-tabular text-small font-semibold text-fg">
            {fila.valorClp != null ? formatoPesos(fila.valorClp) : "sin datos"}
          </span>
        </span>
        <span className="mt-1 flex items-center justify-between gap-3 text-micro text-fg-muted">
          <span className="min-w-0 truncate">
            {fila.plataforma} · {fila.tipoLabel}
          </span>
          <span className="shrink-0 text-small">
            <Rendimiento fila={fila} />
          </span>
        </span>
        {(fila.datoAntiguo || !!fila.aporteNeto) && (
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <ChipMovimiento fila={fila} />
            <Antiguo fila={fila} />
          </span>
        )}
      </Link>
      <Link
        href={`/cuentas/${fila.id}/editar`}
        aria-label={`Editar ${fila.nombre}`}
        className={`grid w-11 shrink-0 place-items-center self-center rounded-lg text-fg-muted hover:bg-white/[0.06] hover:text-fg ${FOCO}`}
        style={{ minHeight: 44 }}
      >
        <Pencil size={16} aria-hidden="true" />
      </Link>
    </li>
  );
}

export function CuentasTabla({ filas }: { filas: FilaCuenta[] }) {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [orden, setOrden] = useState<ClaveOrden>("valor");
  const [direccion, setDireccion] = useState<Direccion>("desc");
  const [agrupar, setAgrupar] = useState(false);

  const plataformas = useMemo(() => opcionesPlataforma(filas), [filas]);
  const tipos = useMemo(
    () => Array.from(new Map(filas.map((f) => [f.tipo, f.tipoLabel]))).map(([valor, etiqueta]) => ({ valor, etiqueta })),
    [filas]
  );
  const monedas = useMemo(() => Array.from(new Set(filas.map((f) => f.moneda))), [filas]);

  const visibles = useMemo(
    () => ordenarCuentas(filtrarCuentas(filas, filtros), orden, direccion),
    [filas, filtros, orden, direccion]
  );
  const grupos = useMemo(() => (agrupar ? agruparPorPlataforma(visibles) : []), [agrupar, visibles]);

  function alOrdenar(clave: ClaveOrden) {
    if (clave === orden) {
      setDireccion((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setOrden(clave);
      setDireccion(DIRECCION_INICIAL[clave]);
    }
  }
  const cambiar = (parcial: Partial<Filtros>) => setFiltros((f) => ({ ...f, ...parcial }));
  const activos = hayFiltrosActivos(filtros);

  const cabeceraProps = { orden, direccion, alOrdenar };

  return (
    <div className="flex flex-col gap-4">
      <div role="search" aria-label="Buscar y filtrar cuentas" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[220px] flex-1">
            <label htmlFor="buscar-cuentas" className="sr-only">
              Buscar por nombre, plataforma o tipo
            </label>
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-fg-muted" />
            <input
              id="buscar-cuentas"
              type="search"
              value={filtros.texto}
              onChange={(e) => cambiar({ texto: e.target.value })}
              placeholder="Buscar cuenta, plataforma o tipo"
              className={`${CAMPO} w-full pl-9`}
            />
          </div>

          <label className="flex flex-col gap-1 text-micro font-medium text-fg-muted">
            Tipo
            <select value={filtros.tipo} onChange={(e) => cambiar({ tipo: e.target.value })} className={CAMPO}>
              <option value="todos">Todos</option>
              {tipos.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-micro font-medium text-fg-muted">
            Plataforma
            <select value={filtros.plataforma} onChange={(e) => cambiar({ plataforma: e.target.value })} className={CAMPO}>
              <option value="todas">Todas</option>
              {plataformas.map((p) => (
                <option key={p.clave} value={p.clave}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>

          {monedas.length > 1 && (
            <label className="flex flex-col gap-1 text-micro font-medium text-fg-muted">
              Moneda
              <select value={filtros.moneda} onChange={(e) => cambiar({ moneda: e.target.value })} className={CAMPO}>
                <option value="todas">Todas</option>
                {monedas.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* en escritorio se ordena desde las cabeceras; en celular, con este selector */}
          <label className="flex flex-col gap-1 text-micro font-medium text-fg-muted md:hidden">
            Ordenar por
            <span className="flex gap-2">
              <select value={orden} onChange={(e) => alOrdenar(e.target.value as ClaveOrden)} className={`${CAMPO} flex-1`}>
                {OPCIONES_ORDEN.map((o) => (
                  <option key={o.clave} value={o.clave}>
                    {o.etiqueta}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setDireccion((d) => (d === "asc" ? "desc" : "asc"))}
                aria-label={direccion === "asc" ? "Orden ascendente, cambiar a descendente" : "Orden descendente, cambiar a ascendente"}
                className={`grid h-10 w-10 place-items-center rounded-[10px] border border-control bg-surface-raised text-fg ${FOCO}`}
              >
                {direccion === "asc" ? <ArrowUp size={16} aria-hidden="true" /> : <ArrowDown size={16} aria-hidden="true" />}
              </button>
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-small text-fg-soft">
            <input
              type="checkbox"
              checked={agrupar}
              onChange={(e) => setAgrupar(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Agrupar por plataforma
          </label>
          <div className="flex items-center gap-3">
            <p role="status" className="text-small text-fg-muted">
              {visibles.length === filas.length
                ? `${filas.length} ${filas.length === 1 ? "cuenta" : "cuentas"}`
                : `${visibles.length} de ${filas.length} cuentas`}
            </p>
            {activos && (
              <button
                type="button"
                onClick={() => setFiltros(FILTROS_VACIOS)}
                className={`inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-small font-medium text-accent hover:text-accent-hi ${FOCO}`}
              >
                <X size={14} aria-hidden="true" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-base font-semibold text-fg">Ninguna cuenta coincide</p>
          <p className="mt-1.5 text-small text-fg-muted">Prueba con otra búsqueda o quita algún filtro.</p>
          <button
            type="button"
            onClick={() => setFiltros(FILTROS_VACIOS)}
            className={`mt-4 h-10 rounded-full border border-control px-4 text-small font-semibold text-fg hover:bg-white/[0.05] ${FOCO}`}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          {/* escritorio: tabla */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] border-collapse">
              <caption className="sr-only">
                Cuentas con su valor en pesos y rendimiento en la moneda de cada cuenta
              </caption>
              <thead>
                <tr>
                  <CabeceraOrdenable clave="nombre" etiqueta="Cuenta" {...cabeceraProps} />
                  <CabeceraOrdenable clave="valor" etiqueta="Valor (CLP)" alineada="right" {...cabeceraProps} />
                  <CabeceraOrdenable clave="rendimiento" etiqueta="Rend. real" alineada="right" {...cabeceraProps} />
                  <th scope="col" className="px-3 py-2 text-right text-micro font-semibold uppercase tracking-[0.08em] text-fg-muted">
                    Anualizado
                  </th>
                  <CabeceraOrdenable clave="actualizacion" etiqueta="Último registro" {...cabeceraProps} />
                  <th scope="col" className="px-3 py-2">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              {agrupar ? (
                grupos.map((g) => (
                  <tbody key={g.clave}>
                    <tr className="border-t border-[var(--line)] bg-white/[0.025]">
                      <th scope="rowgroup" colSpan={1} className="px-3 py-2 text-left text-small font-semibold text-fg">
                        {g.plataforma}
                        <span className="ml-2 text-micro font-medium text-fg-muted">
                          {g.filas.length} {g.filas.length === 1 ? "cuenta" : "cuentas"}
                        </span>
                      </th>
                      <td className="px-3 py-2 text-right">
                        <span className="money-value font-mono-tabular text-small font-semibold text-fg-soft">
                          {formatoPesos(g.totalClp)}
                        </span>
                      </td>
                      <td colSpan={4} />
                    </tr>
                    {g.filas.map((f) => (
                      <FilaEscritorio key={f.id} fila={f} />
                    ))}
                  </tbody>
                ))
              ) : (
                <tbody>
                  {visibles.map((f) => (
                    <FilaEscritorio key={f.id} fila={f} />
                  ))}
                </tbody>
              )}
              <tfoot>
                <tr className="border-t border-[var(--line)]">
                  <th scope="row" className="px-3 py-3 text-left text-small font-semibold text-fg">
                    Total {activos ? "de las cuentas mostradas" : "del portafolio"}
                  </th>
                  <td className="px-3 py-3 text-right">
                    <span className="money-value font-mono-tabular text-small font-semibold text-fg">
                      {formatoPesos(totalClp(visibles))}
                    </span>
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* celular: filas compactas */}
          <div className="md:hidden">
            {agrupar ? (
              <div className="flex flex-col gap-4">
                {grupos.map((g) => (
                  <section key={g.clave} className="card px-4 pb-1 pt-3" aria-label={g.plataforma}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="text-small font-semibold text-fg">{g.plataforma}</h2>
                      <span className="money-value font-mono-tabular text-small font-semibold text-fg-soft">
                        {formatoPesos(g.totalClp)}
                      </span>
                    </div>
                    <ul className="mt-1">
                      {g.filas.map((f) => (
                        <FilaMovil key={f.id} fila={f} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <ul className="card px-4">
                {visibles.map((f) => (
                  <FilaMovil key={f.id} fila={f} />
                ))}
              </ul>
            )}
            <p className="mt-3 flex items-baseline justify-between gap-3 px-1 text-small">
              <span className="font-semibold text-fg">Total {activos ? "mostrado" : "del portafolio"}</span>
              <span className="money-value font-mono-tabular font-semibold text-fg">{formatoPesos(totalClp(visibles))}</span>
            </p>
          </div>

          <p className="text-micro leading-relaxed text-fg-muted">
            El valor está en pesos (tasa histórica de cada registro). El rendimiento de cada cuenta se muestra en su
            propia moneda y ya descuenta aportes y retiros; el anualizado es una aproximación simple.
          </p>
        </>
      )}
    </div>
  );
}
