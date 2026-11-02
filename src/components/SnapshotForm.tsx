"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { obtenerTasaCambio } from "@/lib/mindicador";
import { Ayuda } from "@/components/Ayuda";
import { InputMonto } from "@/components/InputMonto";
import { formatoFecha } from "@/lib/formato";
import type { Cuenta, Moneda, TipoMovimiento } from "@/types/database";
import { fechaHoyChile } from "@/lib/fecha";
import { AlertTriangle, Check, Plus } from "lucide-react";
// mismas formulas y condiciones que la carga rapida (con tests en
// src/lib/registro.test.ts); antes habia una copia identica en este archivo.
import { advertenciaRegistro, calcularValorSugerido } from "@/lib/registro";

interface SnapshotFormProps {
  cuentas: Cuenta[];
  movimientosHoy: Record<string, { tipo: TipoMovimiento; monto: number }>;
  // valor_actual (moneda nativa) de capital_por_cuenta -- se usa para sugerir
  // el valor de hoy al marcar un aporte/retiro nuevo, y para advertir si el
  // valor no cambio pese a haber uno marcado.
  valorAnteriorPorCuenta: Record<string, number | null>;
}

interface FilaState {
  valor: string;
  tasaCambio: number | null;
  tasaFecha: string | null;
  cargandoTasa: boolean;
  errorTasa: string | null;
  incluyeMovimiento: boolean;
  movimientoTipo: TipoMovimiento;
  movimientoMonto: string;
  resultado: "ok" | string | null;
  // true si el usuario escribio directo en "valor" -- una vez en true, la
  // sugerencia automatica deja de tocar el campo (nunca pisa una edicion manual).
  valorEditadoManualmente: boolean;
  // true si esta fila ya tenia un aporte/retiro guardado al cargar la
  // pantalla (viene de movimientosHoy) -- la sugerencia automatica nunca se
  // activa en estos casos, porque "valor" probablemente ya lo refleja de un
  // guardado anterior y recalcularlo podria pisar un numero correcto.
  tieneMovimientoOriginal: boolean;
}

function filaInicial(seed?: { tipo: TipoMovimiento; monto: number }): FilaState {
  return {
    valor: "",
    tasaCambio: null,
    tasaFecha: null,
    cargandoTasa: false,
    errorTasa: null,
    incluyeMovimiento: !!seed,
    movimientoTipo: seed?.tipo ?? "aporte",
    movimientoMonto: seed ? String(seed.monto) : "",
    resultado: null,
    valorEditadoManualmente: false,
    tieneMovimientoOriginal: !!seed,
  };
}

export function SnapshotForm({ cuentas, movimientosHoy, valorAnteriorPorCuenta }: SnapshotFormProps) {
  const router = useRouter();
  const [filas, setFilas] = useState<Record<string, FilaState>>(() =>
    Object.fromEntries(cuentas.map((c) => [c.id, filaInicial(movimientosHoy[c.id])]))
  );
  const [guardando, setGuardando] = useState(false);
  const [resumen, setResumen] = useState<string | null>(null);
  // advertencias pendientes de confirmar (antes: un window.confirm por cuenta)
  const [advertencias, setAdvertencias] = useState<{ cuentaId: string; mensaje: string }[] | null>(null);
  const panelAdvertencias = useRef<HTMLDivElement>(null);

  function actualizarFila(cuentaId: string, patch: Partial<FilaState>) {
    setFilas((prev) => ({
      ...prev,
      [cuentaId]: { ...filaInicial(), ...prev[cuentaId], ...patch },
    }));
  }

  // la sugerencia solo aplica a un aporte/retiro NUEVO en esta edicion: si la
  // fila ya tenia un movimiento al cargar la pantalla, o el usuario ya edito
  // "valor" a mano, nunca se recalcula solo.
  function actualizarMovimiento(cuenta: Cuenta, patch: Partial<FilaState>) {
    const fila = filas[cuenta.id];
    const siguiente = { ...fila, ...patch };
    const debeSugerir =
      siguiente.incluyeMovimiento && !fila.tieneMovimientoOriginal && !fila.valorEditadoManualmente;
    if (debeSugerir) {
      patch.valor = calcularValorSugerido(
        valorAnteriorPorCuenta[cuenta.id] ?? null,
        siguiente.movimientoMonto,
        siguiente.movimientoTipo
      );
    }
    actualizarFila(cuenta.id, patch);
  }

  // mismo patron anti-condicion-de-carrera que CuentaForm.tsx (tasaRequestId),
  // pero un contador por cuenta_id en vez de uno solo, porque aca hay varias
  // filas independientes en vez de una sola moneda seleccionable.
  const tasaRequestIds = useRef<Record<string, number>>({});

  async function cargarTasa(cuenta: Cuenta) {
    if (cuenta.moneda === "CLP") return;
    const requestId = (tasaRequestIds.current[cuenta.id] = (tasaRequestIds.current[cuenta.id] ?? 0) + 1);
    actualizarFila(cuenta.id, { cargandoTasa: true, errorTasa: null });

    try {
      const { valor, fecha } = await obtenerTasaCambio(cuenta.moneda as Exclude<Moneda, "CLP">);
      if (tasaRequestIds.current[cuenta.id] !== requestId) return;
      actualizarFila(cuenta.id, { tasaCambio: valor, tasaFecha: fecha, cargandoTasa: false });
    } catch (err) {
      if (tasaRequestIds.current[cuenta.id] !== requestId) return;
      console.error(err);
      actualizarFila(cuenta.id, {
        tasaCambio: null,
        tasaFecha: null,
        cargandoTasa: false,
        errorTasa: "no se pudo obtener la tasa de cambio, revisa tu conexion e intenta de nuevo",
      });
    }
  }

  function editarTasaManualmente(cuentaId: string, valor: number | null) {
    tasaRequestIds.current[cuentaId] = (tasaRequestIds.current[cuentaId] ?? 0) + 1;
    actualizarFila(cuentaId, { tasaCambio: valor, cargandoTasa: false, errorTasa: null });
  }

  useEffect(() => {
    cuentas.forEach((cuenta) => {
      if (cuenta.moneda !== "CLP") cargarTasa(cuenta);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // confirmado: undefined = primer intento; "todo" = guardar igual las cuentas
  // con advertencia; "sin-avisos" = guardar solo las demas (como "Cancelar" en
  // el window.confirm de antes, que omitia esa cuenta y guardaba el resto).
  async function guardarSnapshots(confirmado?: "todo" | "sin-avisos") {
    setResumen(null);

    const pendientes = cuentas.filter((c) => (filas[c.id]?.valor ?? "").trim() !== "");

    if (pendientes.length === 0) return;

    // advertencias (no bloquean): valor sin cambio pese a un aporte/retiro
    // marcado, o un rendimiento implausible. mismas condiciones de antes, via
    // advertenciaRegistro; ahora se confirman en pantalla, no con window.confirm.
    const avisos = pendientes
      .map((cuenta) => {
        const fila = filas[cuenta.id];
        const mensaje = advertenciaRegistro({
          nombreCuenta: cuenta.nombre,
          valorAnterior: valorAnteriorPorCuenta[cuenta.id] ?? null,
          valorNuevo: Number(fila.valor),
          incluyeMovimiento: fila.incluyeMovimiento,
          tipo: fila.movimientoTipo,
          monto: fila.movimientoMonto,
        });
        return mensaje ? { cuentaId: cuenta.id, mensaje } : null;
      })
      .filter((a): a is { cuentaId: string; mensaje: string } => a !== null);

    if (avisos.length > 0 && !confirmado) {
      setAdvertencias(avisos);
      requestAnimationFrame(() => {
        panelAdvertencias.current?.focus({ preventScroll: true });
        panelAdvertencias.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
      return;
    }
    setAdvertencias(null);

    const conAviso = new Set(avisos.map((a) => a.cuentaId));
    const aGuardar = confirmado === "sin-avisos" ? pendientes.filter((c) => !conAviso.has(c.id)) : pendientes;
    if (confirmado === "sin-avisos") {
      conAviso.forEach((id) => actualizarFila(id, { resultado: "No guardado: revisa el valor" }));
    }

    if (aGuardar.length === 0) return;

    setGuardando(true);
    const supabase = createClient();
    const hoy = fechaHoyChile();

    const resultados = await Promise.allSettled(
      aGuardar.map(async (cuenta) => {
        const fila = filas[cuenta.id];

        if (Number(fila.valor) < 0) {
          throw new Error("el valor no puede ser negativo");
        }
        if (cuenta.moneda !== "CLP" && !(Number(fila.tasaCambio) > 0)) {
          throw new Error("falta la tasa de cambio");
        }
        if (fila.incluyeMovimiento && !(Number(fila.movimientoMonto) > 0)) {
          throw new Error("el monto del aporte/retiro debe ser mayor a cero");
        }

        const { error } = await supabase.rpc("guardar_snapshot_con_movimiento", {
          p_cuenta_id: cuenta.id,
          p_fecha: hoy,
          p_valor: Number(fila.valor),
          p_tasa_cambio: cuenta.moneda === "CLP" ? undefined : (fila.tasaCambio ?? undefined),
          p_movimiento_tipo: fila.incluyeMovimiento ? fila.movimientoTipo : undefined,
          p_movimiento_monto: fila.incluyeMovimiento ? Number(fila.movimientoMonto) : undefined,
          // la carga del dia a dia nunca debe poder borrar un aporte/retiro ya
          // registrado (por ejemplo, el aporte inicial de una cuenta creada
          // hoy mismo) -- desmarcar la casilla pensando "no estoy depositando
          // ahora" es un error muy facil de cometer. borrar uno existente
          // queda solo para el historial de la cuenta, una accion deliberada.
          p_permitir_quitar_movimiento: false,
        });

        if (error) throw new Error(error.message);
        return cuenta.id;
      })
    );

    let ok = 0;
    let fallidas = 0;

    resultados.forEach((res, i) => {
      const cuentaId = aGuardar[i].id;
      if (res.status === "fulfilled") {
        ok++;
        actualizarFila(cuentaId, { valor: "", incluyeMovimiento: false, movimientoMonto: "", resultado: "ok" });
      } else {
        fallidas++;
        actualizarFila(cuentaId, { resultado: res.reason?.message ?? "hubo un error al guardar" });
      }
    });

    setGuardando(false);
    setResumen(
      fallidas === 0
        ? `${ok} cuenta${ok === 1 ? "" : "s"} guardada${ok === 1 ? "" : "s"}`
        : `${ok} guardada${ok === 1 ? "" : "s"}, ${fallidas} con error`
    );
    // una sola vez, no por fila: si al menos una cuenta se guardo, refresca
    // el resto del dashboard (mismo motivo que en CargaRapida.tsx). se omite
    // si todo fallo, porque nada cambio del lado del servidor.
    if (ok > 0) router.refresh();
  }

  if (cuentas.length === 0) return null;

  const algunaCargandoTasa = Object.values(filas).some((f) => f.cargandoTasa);

  const CAMPO =
    "h-10 rounded-[10px] border border-control bg-white/[0.04] px-3 text-right text-small font-mono-tabular text-fg focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";
  const nombrePorId = new Map(cuentas.map((c) => [c.id, c.nombre]));
  const hayCuentasSinAviso =
    advertencias != null &&
    cuentas.some((c) => (filas[c.id]?.valor ?? "").trim() !== "" && !advertencias.some((a) => a.cuentaId === c.id));

  return (
    <section className="card p-5" aria-labelledby="varias-cuentas-titulo">
      <div className="flex items-center gap-1 mb-0.5">
        <h2 id="varias-cuentas-titulo" className="titulo-bloque">Actualizar valores de hoy</h2>
        <Ayuda etiqueta="Cómo actualizar varias cuentas">
          Escribe el valor de hoy de cada cuenta (lo que ves en el banco o corredora), o usa &quot;Sin
          cambios&quot; si sigue igual que el último registro. Si además depositaste o retiraste plata (no una
          variación de mercado), usa &quot;Añadir aporte o retiro&quot; para que ese monto no se cuente como
          ganancia. Solo se guardan las cuentas con un valor escrito.
        </Ayuda>
      </div>
      <p className="text-micro text-fg-muted mb-3">
        Fecha de hoy: <span className="font-mono-tabular">{formatoFecha(fechaHoyChile())}</span>
      </p>
      {/* una sola columna a proposito: este formulario tambien vive dentro
          del riel angosto del inicio, y un breakpoint de viewport no sabe el
          ancho del contenedor. */}
      <ul className="lista-filas">
        {cuentas.map((cuenta) => {
          const fila = filas[cuenta.id] ?? filaInicial();
          const anterior = valorAnteriorPorCuenta[cuenta.id];
          const idBase = `varias-${cuenta.id}`;
          return (
            <li key={cuenta.id} className="flex flex-col py-3.5">
              <div className="flex items-start justify-between gap-2">
                <label htmlFor={`${idBase}-valor`} className="min-w-0 break-words text-small font-semibold text-fg">
                  {cuenta.nombre}
                  <span className="ml-1.5 text-micro font-medium text-fg-subtle">{cuenta.moneda}</span>
                </label>
                {anterior != null && (
                  <button
                    type="button"
                    onClick={() =>
                      actualizarFila(cuenta.id, { valor: String(anterior), valorEditadoManualmente: true })
                    }
                    className="-my-1 min-h-8 shrink-0 rounded-md px-1.5 text-micro font-medium text-fg-muted underline decoration-white/20 underline-offset-4 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    Sin cambios
                  </button>
                )}
              </div>

              <InputMonto
                id={`${idBase}-valor`}
                placeholder="0"
                className={`mt-2 w-full ${CAMPO}`}
                value={fila.valor}
                onChange={(valor) => actualizarFila(cuenta.id, { valor, valorEditadoManualmente: true })}
              />

              {cuenta.moneda !== "CLP" && (
                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor={`${idBase}-tasa`} className="text-micro font-medium text-fg-muted">
                      Tasa {cuenta.moneda} en pesos
                    </label>
                    <input
                      id={`${idBase}-tasa`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      className={`w-32 ${CAMPO} h-9`}
                      value={fila.tasaCambio ?? ""}
                      onChange={(e) =>
                        editarTasaManualmente(cuenta.id, e.target.value ? Number(e.target.value) : null)
                      }
                    />
                  </div>
                  {fila.cargandoTasa && (
                    <span role="status" className="text-micro text-fg-muted text-right">Buscando tasa en mindicador.cl…</span>
                  )}
                  {!fila.cargandoTasa && fila.tasaFecha && (
                    <span className="text-micro text-fg-muted text-right">
                      Según Banco Central, {formatoFecha(fila.tasaFecha)}
                    </span>
                  )}
                  {fila.errorTasa && (
                    <span role="alert" className="text-micro text-neg flex flex-wrap items-center justify-end gap-x-2">
                      No se pudo obtener la tasa. Revisa tu conexión.
                      <button type="button" onClick={() => cargarTasa(cuenta)} className="min-h-8 underline shrink-0">
                        Reintentar
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* revelacion progresiva: el aporte/retiro empieza oculto, la
                  mayoria de los dias no hay movimiento que registrar. */}
              {!fila.incluyeMovimiento ? (
                <button
                  type="button"
                  onClick={() => actualizarMovimiento(cuenta, { incluyeMovimiento: true })}
                  className="mt-1.5 inline-flex min-h-9 items-center gap-1 self-start rounded-md text-micro font-semibold text-accent hover:text-accent-hi focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <Plus size={13} strokeWidth={2.4} aria-hidden="true" />
                  Añadir aporte o retiro
                </button>
              ) : (
                <fieldset className="mt-2 flex flex-col gap-2 rounded-[10px] bg-white/[0.03] p-2.5">
                  <legend className="sr-only">Aporte o retiro de {cuenta.nombre}</legend>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-micro font-medium text-fg-muted">
                      Incluye un aporte o retiro
                      {fila.tieneMovimientoOriginal && <span className="ml-1.5 text-fg-subtle">· ya registrado hoy</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => actualizarMovimiento(cuenta, { incluyeMovimiento: false })}
                      className="min-h-8 shrink-0 rounded-md px-1 text-micro text-fg-muted underline decoration-white/20 underline-offset-4 hover:text-fg"
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Tipo de movimiento de ${cuenta.nombre}`}
                      value={fila.movimientoTipo}
                      onChange={(e) =>
                        actualizarMovimiento(cuenta, { movimientoTipo: e.target.value as TipoMovimiento })
                      }
                      className="h-9 shrink-0 rounded-lg border border-control bg-surface-raised px-2 text-small text-fg focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <option value="aporte">Aporte</option>
                      <option value="retiro">Retiro</option>
                    </select>
                    <InputMonto
                      ariaLabel={`Monto del ${fila.movimientoTipo} en ${cuenta.moneda}`}
                      placeholder="Monto"
                      className={`min-w-0 flex-1 ${CAMPO} h-9`}
                      value={fila.movimientoMonto}
                      onChange={(movimientoMonto) => actualizarMovimiento(cuenta, { movimientoMonto })}
                    />
                  </div>
                  <p className="text-micro text-fg-subtle">No se cuenta como rendimiento.</p>
                </fieldset>
              )}

              {fila.resultado === "ok" && (
                <p className="mt-2 inline-flex items-center gap-1 text-micro font-semibold text-pos">
                  <Check size={14} strokeWidth={2.4} aria-hidden="true" />
                  Guardado
                </p>
              )}
              {fila.resultado && fila.resultado !== "ok" && (
                <p role="alert" className="mt-2 text-micro text-neg">{fila.resultado}</p>
              )}
            </li>
          );
        })}
      </ul>

      {advertencias && (
        <div
          ref={panelAdvertencias}
          tabIndex={-1}
          role="alertdialog"
          aria-label="Revisa antes de guardar"
          className="mt-3 scroll-mb-28 rounded-xl border border-warn/40 bg-warn/10 p-3.5 outline-none"
        >
          <p className="flex items-center gap-2 text-small font-semibold text-fg">
            <AlertTriangle size={16} aria-hidden="true" className="shrink-0 text-warn" />
            Revisa antes de guardar
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 text-micro leading-relaxed text-fg-soft">
            {advertencias.map((a) => (
              <li key={a.cuentaId}>
                <span className="font-semibold text-fg">{nombrePorId.get(a.cuentaId)}:</span> {a.mensaje}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 min-[480px]:flex-row min-[480px]:flex-wrap">
            <button type="button" onClick={() => setAdvertencias(null)} className="boton-secundario flex-1">
              Revisar los valores
            </button>
            {hayCuentasSinAviso && (
              <button type="button" onClick={() => guardarSnapshots("sin-avisos")} className="boton-secundario flex-1">
                Guardar solo las demás
              </button>
            )}
            <button type="button" onClick={() => guardarSnapshots("todo")} className="boton-primario flex-1">
              Guardar igual
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => guardarSnapshots()}
        disabled={guardando || algunaCargandoTasa}
        className="boton-primario mt-3 h-11 w-full disabled:opacity-50"
      >
        {guardando ? "Guardando…" : "Guardar registros"}
      </button>
      {resumen && (
        <p role="status" className="mt-2.5 text-center text-micro font-semibold text-fg-muted">
          {resumen}
        </p>
      )}
    </section>
  );
}
