"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { obtenerTasaCambio } from "@/lib/mindicador";
import { Ayuda } from "@/components/Ayuda";
import { InputMonto } from "@/components/InputMonto";
import { SelectorCuenta } from "@/components/SelectorCuenta";
import { formatoFecha, formatoMontoNativo } from "@/lib/formato";
import { advertenciaRegistro, calcularValorSugerido, validarRegistro, type ErroresRegistro } from "@/lib/registro";
import type { Cuenta, Moneda, TipoMovimiento } from "@/types/database";
import { fechaHoyChile } from "@/lib/fecha";

interface CargaRapidaProps {
  cuentas: Cuenta[];
  movimientosHoy: Record<string, { tipo: TipoMovimiento; monto: number }>;
  // valor_actual (moneda nativa) de capital_por_cuenta -- mismo dato que ya
  // usa SnapshotForm para sugerir el valor y advertir si no cambio.
  valorAnteriorPorCuenta: Record<string, number | null>;
  // cuenta preseleccionada (ej. al llegar desde /registrar?cuenta=...)
  cuentaInicialId?: string;
}

const CAMPO =
  "h-11 px-3 rounded-[10px] border bg-surface-raised text-fg text-right text-small font-mono-tabular focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const borde = (invalido: boolean) => (invalido ? "border-[var(--neg)]" : "border-control");

// version de una sola cuenta de SnapshotForm: para cuando actualizar TODAS
// las cuentas de una vez (el grid completo) es mas friccion de la que hace
// falta ese dia -- el caso comun es actualizar una o dos cuentas, no todas.
// misma logica de guardado, guardrails y rpc que SnapshotForm, solo que
// aplicada a una cuenta elegida en un desplegable en vez de a todas a la vez.
export function CargaRapida({ cuentas, movimientosHoy, valorAnteriorPorCuenta, cuentaInicialId }: CargaRapidaProps) {
  const [cuentaId, setCuentaId] = useState(
    cuentas.some((c) => c.id === cuentaInicialId) ? (cuentaInicialId as string) : (cuentas[0]?.id ?? "")
  );
  const cuenta = cuentas.find((c) => c.id === cuentaId) ?? null;

  if (cuentas.length === 0) return null;

  return (
    <section id="carga-rapida" aria-labelledby="carga-rapida-titulo" className="card p-5 scroll-mt-6">
      <div className="flex items-center gap-1.5 mb-1">
        <h2 id="carga-rapida-titulo" className="text-small font-semibold text-fg">
          Carga rápida
        </h2>
        <Ayuda>
          Registra el valor de hoy de una sola cuenta. Para actualizar varias cuentas a la vez, usa
          &quot;actualizar varias cuentas de una vez&quot;.
        </Ayuda>
      </div>
      <p className="text-micro text-fg-muted mb-4">Registra el valor de hoy de una cuenta</p>

      <SelectorCuenta cuentas={cuentas} valor={cuentaId} onChange={setCuentaId} />

      {cuenta && (
        <FormularioCargaRapida
          key={cuenta.id}
          cuenta={cuenta}
          movimientoSemilla={movimientosHoy[cuenta.id]}
          valorAnterior={valorAnteriorPorCuenta[cuenta.id] ?? null}
        />
      )}
    </section>
  );
}

interface FormularioCargaRapidaProps {
  cuenta: Cuenta;
  movimientoSemilla: { tipo: TipoMovimiento; monto: number } | undefined;
  valorAnterior: number | null;
}

// formulario de la cuenta elegida, montado con key={cuenta.id} desde
// CargaRapida -- cambiar de cuenta reinicia todo este estado via remount en
// vez de un efecto que llama varios setState seguidos para "resetear el
// formulario" (el patron que react recomienda para esto: computar el estado
// inicial a partir de las props en vez de resetearlo en un effect). el unico
// effect que queda aca es el legitimo: buscar la tasa de cambio al montar.
function FormularioCargaRapida({ cuenta, movimientoSemilla, valorAnterior }: FormularioCargaRapidaProps) {
  const router = useRouter();

  const [valor, setValor] = useState("");
  const [valorEditadoManualmente, setValorEditadoManualmente] = useState(false);
  const [tasaCambio, setTasaCambio] = useState<number | null>(null);
  const [tasaFecha, setTasaFecha] = useState<string | null>(null);
  // arranca en true cuando la cuenta no es clp -- ya se sabe en el primer
  // render que el effect de mas abajo va a disparar un fetch de inmediato.
  const [cargandoTasa, setCargandoTasa] = useState(cuenta.moneda !== "CLP");
  const [errorTasa, setErrorTasa] = useState<string | null>(null);
  const [incluyeMovimiento, setIncluyeMovimiento] = useState(!!movimientoSemilla);
  const [movimientoTipo, setMovimientoTipo] = useState<TipoMovimiento>(movimientoSemilla?.tipo ?? "aporte");
  const [movimientoMonto, setMovimientoMonto] = useState(
    movimientoSemilla ? String(movimientoSemilla.monto) : ""
  );
  const [guardando, setGuardando] = useState(false);
  // "ok" tras guardar; un mensaje si el servidor rechazo el guardado
  const [resultado, setResultado] = useState<"ok" | string | null>(null);
  // lo que se acaba de guardar, para mostrarlo como comprobante (solo
  // presentacion: son los mismos valores que se enviaron al rpc)
  const [comprobante, setComprobante] = useState<{
    fecha: string;
    valor: number;
    movimiento: { tipo: TipoMovimiento; monto: number } | null;
  } | null>(null);
  // errores por campo (impiden guardar) y advertencia que pide confirmar
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [advertencia, setAdvertencia] = useState<string | null>(null);

  const tieneMovimientoOriginal = !!movimientoSemilla;
  const tasaRequestId = useRef(0);
  const panelAdvertencia = useRef<HTMLDivElement>(null);

  // al aparecer la advertencia, se enfoca (y por lo tanto se hace visible) para
  // que no quede escondida bajo el teclado o la barra inferior del celular.
  useEffect(() => {
    if (advertencia) panelAdvertencia.current?.focus();
  }, [advertencia]);

  // usada por el boton reintentar (un event handler, sin restricciones de
  // pureza) -- el effect de mas abajo NO llama esta funcion: el lint marca
  // como "setState sincrono dentro de un effect" cualquier llamado a una
  // funcion local que en algun punto de su cuerpo termine llamando setState,
  // sea antes o despues de un await, asi que el fetch inicial se escribe
  // aparte, en linea, dentro del effect mismo.
  async function cargarTasa(c: Cuenta) {
    const requestId = ++tasaRequestId.current;
    setCargandoTasa(true);
    setErrorTasa(null);
    try {
      const { valor: v, fecha } = await obtenerTasaCambio(c.moneda as Exclude<Moneda, "CLP">);
      if (tasaRequestId.current !== requestId) return;
      setTasaCambio(v);
      setTasaFecha(fecha);
      setCargandoTasa(false);
    } catch (err) {
      if (tasaRequestId.current !== requestId) return;
      console.error(err);
      setTasaCambio(null);
      setTasaFecha(null);
      setCargandoTasa(false);
      setErrorTasa("no se pudo obtener la tasa de cambio, revisa tu conexion e intenta de nuevo");
    }
  }

  function editarTasaManualmente(v: number | null) {
    tasaRequestId.current++;
    setTasaCambio(v);
    setCargandoTasa(false);
    setErrorTasa(null);
  }

  // busca la tasa de cambio al montar, solo si la cuenta no es clp -- el
  // remount por key={cuenta.id} ya se encargo de dejar el formulario en su
  // estado inicial (cargandoTasa ya arranca en true arriba). fetch en linea
  // con .then()/.catch(), no una llamada a cargarTasa: el patron que el
  // propio mensaje de la regla del lint recomienda ("callback... cuando
  // cambia el estado externo"), en vez de una funcion nombrada que dispara
  // el aviso de "setState sincrono dentro de un effect".
  useEffect(() => {
    if (cuenta.moneda === "CLP") return;
    const requestId = ++tasaRequestId.current;
    let cancelado = false;
    obtenerTasaCambio(cuenta.moneda as Exclude<Moneda, "CLP">)
      .then(({ valor: v, fecha }) => {
        if (cancelado || tasaRequestId.current !== requestId) return;
        setTasaCambio(v);
        setTasaFecha(fecha);
        setCargandoTasa(false);
      })
      .catch((err) => {
        if (cancelado || tasaRequestId.current !== requestId) return;
        console.error(err);
        setTasaCambio(null);
        setTasaFecha(null);
        setCargandoTasa(false);
        setErrorTasa("no se pudo obtener la tasa de cambio, revisa tu conexion e intenta de nuevo");
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cambiarMovimiento(patch: {
    incluyeMovimiento?: boolean;
    movimientoTipo?: TipoMovimiento;
    movimientoMonto?: string;
  }) {
    const siguienteIncluye = patch.incluyeMovimiento ?? incluyeMovimiento;
    const siguienteTipo = patch.movimientoTipo ?? movimientoTipo;
    const siguienteMonto = patch.movimientoMonto ?? movimientoMonto;

    if (patch.incluyeMovimiento !== undefined) setIncluyeMovimiento(patch.incluyeMovimiento);
    if (patch.movimientoTipo !== undefined) setMovimientoTipo(patch.movimientoTipo);
    if (patch.movimientoMonto !== undefined) setMovimientoMonto(patch.movimientoMonto);

    const debeSugerir = siguienteIncluye && !tieneMovimientoOriginal && !valorEditadoManualmente;
    if (debeSugerir) {
      setValor(calcularValorSugerido(valorAnterior, siguienteMonto, siguienteTipo));
    }
  }

  // forzar=true: el usuario ya vio la advertencia y eligio guardar igual.
  async function guardar(forzar = false) {
    setResultado(null);
    setComprobante(null);

    const erroresNuevos = validarRegistro({
      valor,
      esClp: cuenta.moneda === "CLP",
      tasaCambio,
      incluyeMovimiento,
      movimientoMonto,
    });
    setErrores(erroresNuevos);
    if (Object.keys(erroresNuevos).length > 0) {
      setAdvertencia(null);
      return;
    }

    if (!forzar) {
      const aviso = advertenciaRegistro({
        nombreCuenta: cuenta.nombre,
        valorAnterior,
        valorNuevo: Number(valor),
        incluyeMovimiento,
        tipo: movimientoTipo,
        monto: movimientoMonto,
      });
      if (aviso) {
        setAdvertencia(aviso);
        return;
      }
    }
    setAdvertencia(null);

    setGuardando(true);
    const supabase = createClient();
    const hoy = fechaHoyChile();

    const { error } = await supabase.rpc("guardar_snapshot_con_movimiento", {
      p_cuenta_id: cuenta.id,
      p_fecha: hoy,
      p_valor: Number(valor),
      p_tasa_cambio: cuenta.moneda === "CLP" ? undefined : (tasaCambio ?? undefined),
      p_movimiento_tipo: incluyeMovimiento ? movimientoTipo : undefined,
      p_movimiento_monto: incluyeMovimiento ? Number(movimientoMonto) : undefined,
      // misma regla que SnapshotForm: la carga del dia a dia nunca borra un
      // aporte/retiro ya registrado -- borrar uno a proposito queda solo en
      // el historial de la cuenta.
      p_permitir_quitar_movimiento: false,
    });

    setGuardando(false);
    if (error) {
      setResultado(error.message);
      return;
    }
    setComprobante({
      fecha: hoy,
      valor: Number(valor),
      movimiento: incluyeMovimiento ? { tipo: movimientoTipo, monto: Number(movimientoMonto) } : null,
    });
    setValor("");
    setErrores({});
    setValorEditadoManualmente(false);
    setIncluyeMovimiento(false);
    setMovimientoMonto("");
    setResultado("ok");
    // refresca el arbol de server components de "/" (hero, tus cuentas,
    // desgloses, grafico) para que reflejen el guardado sin recargar la
    // pagina -- sin esto, guardar aca solo actualizaba el estado local de
    // esta card, dejando el resto del dashboard con numeros viejos hasta F5.
    router.refresh();
  }

  const idValor = "cr-valor";
  const idTasa = "cr-tasa";
  const idMonto = "cr-monto";

  return (
    <>
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 mt-4">
        <div>
          <span className="text-micro font-semibold text-fg-muted">Fecha</span>
          <p className="mt-1 h-11 px-3 rounded-[10px] bg-white/[0.03] flex items-center text-small text-fg-muted font-mono-tabular">
            Hoy · {formatoFecha(fechaHoyChile())}
          </p>
        </div>
        <div>
          <span className="flex items-center gap-1">
            <label htmlFor={idValor} className="text-micro font-semibold text-fg-muted">
              Valor actual
            </label>
            <Ayuda>
              Mientras más seguido registres el valor, más preciso es tu rendimiento semanal — los
              saltos largos entre registros diluyen la comparación semana a semana.
            </Ayuda>
          </span>
          <InputMonto
            id={idValor}
            placeholder="0"
            invalido={!!errores.valor}
            describedBy={errores.valor ? `${idValor}-error` : undefined}
            className={`mt-1 w-full ${CAMPO} ${borde(!!errores.valor)}`}
            value={valor}
            onChange={(v) => {
              setValor(v);
              setValorEditadoManualmente(true);
              setAdvertencia(null);
              if (errores.valor) setErrores((e) => ({ ...e, valor: undefined }));
            }}
          />
          {errores.valor && (
            <p id={`${idValor}-error`} role="alert" className="mt-1 text-micro font-medium text-[var(--neg)]">
              {errores.valor}
            </p>
          )}
        </div>
      </div>

      {cuenta.moneda !== "CLP" && (
        <div className="mt-3 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={idTasa} className="text-micro font-semibold text-fg-muted">
              Tasa de cambio ({cuenta.moneda})
            </label>
            <input
              id={idTasa}
              type="number"
              inputMode="decimal"
              step="0.01"
              aria-invalid={errores.tasa ? true : undefined}
              aria-describedby={errores.tasa ? `${idTasa}-error` : undefined}
              className={`w-32 ${CAMPO} ${borde(!!errores.tasa)}`}
              value={tasaCambio ?? ""}
              onChange={(e) => {
                editarTasaManualmente(e.target.value ? Number(e.target.value) : null);
                if (errores.tasa) setErrores((er) => ({ ...er, tasa: undefined }));
              }}
            />
          </div>
          {cargandoTasa && (
            <span role="status" className="text-micro text-fg-muted text-right block">
              Buscando la tasa en mindicador.cl…
            </span>
          )}
          {!cargandoTasa && tasaFecha && (
            <span className="text-micro text-fg-muted text-right block">
              Según el Banco Central, {formatoFecha(tasaFecha)}. Puedes corregirla si hace falta.
            </span>
          )}
          {errorTasa && (
            <span role="alert" className="text-micro text-[var(--neg)] flex items-center justify-end gap-2">
              No se pudo obtener la tasa de cambio. Revisa tu conexión o escríbela a mano.
              <button type="button" onClick={() => cargarTasa(cuenta)} className="min-h-8 underline shrink-0">
                Reintentar
              </button>
            </span>
          )}
          {errores.tasa && (
            <p id={`${idTasa}-error`} role="alert" className="text-right text-micro font-medium text-[var(--neg)]">
              {errores.tasa}
            </p>
          )}
        </div>
      )}

      {!incluyeMovimiento ? (
        <button
          type="button"
          onClick={() => cambiarMovimiento({ incluyeMovimiento: true })}
          className="mt-3 min-h-10 text-small font-semibold text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded"
        >
          + Añadir aporte o retiro
        </button>
      ) : (
        <fieldset className="mt-3 rounded-[10px] bg-white/[0.03] p-3 flex flex-col gap-2">
          <legend className="sr-only">Aporte o retiro</legend>
          <div className="flex items-center justify-between gap-2">
            <span className="text-micro font-medium text-fg-muted">Esto incluye un aporte o retiro</span>
            <button
              type="button"
              onClick={() => cambiarMovimiento({ incluyeMovimiento: false })}
              className="min-h-8 text-micro text-fg-muted underline shrink-0"
            >
              Quitar
            </button>
          </div>
          {tieneMovimientoOriginal && (
            <span className="self-start text-micro font-medium text-fg-muted bg-white/[0.04] border border-white/[0.12] rounded px-1.5 py-px">
              ya registrado hoy
            </span>
          )}
          <div className="flex items-center gap-2">
            <select
              aria-label="Tipo de movimiento"
              value={movimientoTipo}
              onChange={(e) => cambiarMovimiento({ movimientoTipo: e.target.value as TipoMovimiento })}
              className="h-11 px-2 rounded-lg border border-control text-small bg-surface-raised text-fg shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <option value="aporte">Aporte</option>
              <option value="retiro">Retiro</option>
            </select>
            <InputMonto
              id={idMonto}
              placeholder="Monto"
              invalido={!!errores.monto}
              describedBy={errores.monto ? `${idMonto}-error` : undefined}
              className={`flex-1 min-w-0 ${CAMPO} ${borde(!!errores.monto)}`}
              value={movimientoMonto}
              onChange={(m) => {
                cambiarMovimiento({ movimientoMonto: m });
                setAdvertencia(null);
                if (errores.monto) setErrores((e) => ({ ...e, monto: undefined }));
              }}
            />
          </div>
          {errores.monto && (
            <p id={`${idMonto}-error`} role="alert" className="text-micro font-medium text-[var(--neg)]">
              {errores.monto}
            </p>
          )}
          <p className="text-micro text-fg-muted">Este movimiento no se cuenta como rendimiento.</p>
        </fieldset>
      )}

      {advertencia ? (
        <div ref={panelAdvertencia} tabIndex={-1} role="alertdialog" aria-label="Confirma el registro" className="mt-4 scroll-mb-24 outline-none rounded-[12px] border border-warn/50 bg-warn/10 p-3.5">
          <p className="flex gap-2 text-small leading-snug text-fg">
            <AlertTriangle size={18} aria-hidden="true" className="mt-px shrink-0 text-warn" />
            <span>{advertencia}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAdvertencia(null)}
              className="h-11 flex-1 min-w-[140px] rounded-[10px] border border-control text-small font-semibold text-fg hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Revisar el valor
            </button>
            <button
              type="button"
              onClick={() => guardar(true)}
              disabled={guardando}
              className="h-11 flex-1 min-w-[140px] rounded-[10px] bg-[var(--accent)] text-small font-semibold text-ink disabled:opacity-50 hover:brightness-[1.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {guardando ? "Guardando…" : "Guardar igual"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => guardar()}
          disabled={guardando || cargandoTasa}
          className="w-full h-12 mt-4 rounded-[11px] bg-[var(--accent)] text-ink text-small font-semibold transition-[transform,filter] duration-150 active:scale-[0.99] disabled:opacity-50 hover:brightness-[1.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {guardando ? "Guardando…" : cargandoTasa ? "Buscando la tasa…" : "Guardar registro"}
        </button>
      )}

      <div aria-live="polite">
        {resultado === "ok" && (
          <div className="animate-fade-up mt-4 rounded-2xl border border-dashed border-white/[0.18] bg-white/[0.03] px-4 py-4">
            <p className="flex items-center gap-2 text-small font-semibold text-[var(--pos)]">
              <CheckCircle2 size={18} aria-hidden="true" />
              Registro guardado
            </p>
            {comprobante && (
              <dl className="mt-3 flex flex-col gap-2 border-t border-dashed border-white/[0.14] pt-3 text-small">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-fg-muted">Cuenta</dt>
                  <dd className="min-w-0 truncate text-right font-medium text-fg">{cuenta.nombre}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-fg-muted">Fecha</dt>
                  <dd className="font-mono-tabular text-fg">{formatoFecha(comprobante.fecha)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-fg-muted">Valor registrado</dt>
                  <dd className="money-value font-mono-tabular font-semibold text-fg">
                    {formatoMontoNativo(comprobante.valor, cuenta.moneda)}
                  </dd>
                </div>
                {comprobante.movimiento && (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-fg-muted">
                      {comprobante.movimiento.tipo === "aporte" ? "Aporte" : "Retiro"}
                    </dt>
                    <dd className="money-value font-mono-tabular text-fg">
                      {formatoMontoNativo(comprobante.movimiento.monto, cuenta.moneda)}
                    </dd>
                  </div>
                )}
              </dl>
            )}
            {comprobante?.movimiento && (
              <p className="mt-3 text-micro text-fg-muted">
                El {comprobante.movimiento.tipo === "aporte" ? "aporte" : "retiro"} no cuenta como ganancia: se descuenta del rendimiento.
              </p>
            )}
          </div>
        )}
        {resultado && resultado !== "ok" && (
          <p role="alert" className="mt-3 text-center text-small font-medium text-[var(--neg)]">
            No se pudo guardar: {resultado}
          </p>
        )}
      </div>
    </>
  );
}
