// reglas de validacion y advertencias de la carga rapida. funciones puras,
// probables con `npm test`. calcularValorSugerido y estimarRendimientoPct son
// las MISMAS formulas que ya tenia CargaRapida.tsx (espejo de
// rendimiento_semanal en schema.sql), movidas aca sin cambios; las condiciones
// de validacion y de advertencia tambien son las de antes, ahora sin
// window.confirm: el formulario las muestra en pantalla.
import type { TipoMovimiento } from "../types/database";

export function calcularValorSugerido(valorAnterior: number | null, monto: string, tipo: TipoMovimiento): string {
  const base = valorAnterior ?? 0;
  const montoNum = Number(monto) || 0;
  return String(tipo === "aporte" ? base + montoNum : base - montoNum);
}

export const UMBRAL_RENDIMIENTO_IMPLAUSIBLE = 80;

export function estimarRendimientoPct(
  valorAnterior: number | null,
  valorNuevo: number,
  incluyeMovimiento: boolean,
  tipo: TipoMovimiento,
  monto: string
): number | null {
  if (valorAnterior == null) return null;
  const aportesNetos = incluyeMovimiento ? (tipo === "aporte" ? Number(monto) || 0 : -(Number(monto) || 0)) : 0;
  const base = valorAnterior + aportesNetos;
  if (base <= 0) return null;
  const gananciaReal = valorNuevo - valorAnterior - aportesNetos;
  return (gananciaReal / base) * 100;
}

export interface EntradaRegistro {
  valor: string;
  esClp: boolean;
  tasaCambio: number | null;
  incluyeMovimiento: boolean;
  movimientoMonto: string;
}

export interface ErroresRegistro {
  valor?: string;
  tasa?: string;
  monto?: string;
}

// errores por campo (los que impiden guardar). cada campo muestra el suyo.
export function validarRegistro(e: EntradaRegistro): ErroresRegistro {
  const errores: ErroresRegistro = {};
  if (e.valor.trim() === "") errores.valor = "Escribe el valor actual de la cuenta.";
  else if (Number(e.valor) < 0) errores.valor = "El valor no puede ser negativo.";
  if (!e.esClp && !(Number(e.tasaCambio) > 0)) errores.tasa = "Falta la tasa de cambio.";
  if (e.incluyeMovimiento && !(Number(e.movimientoMonto) > 0)) {
    errores.monto = "El monto del aporte o retiro debe ser mayor a cero.";
  }
  return errores;
}

export interface EntradaAdvertencia {
  nombreCuenta: string;
  valorAnterior: number | null;
  valorNuevo: number;
  incluyeMovimiento: boolean;
  tipo: TipoMovimiento;
  monto: string;
}

// advertencias que piden confirmacion antes de guardar (no bloquean): valor
// igual al anterior pese a marcar un aporte/retiro, o un rendimiento
// implausible (>= 80 %) respecto al registro anterior.
export function advertenciaRegistro(e: EntradaAdvertencia): string | null {
  const valorSinCambio = e.incluyeMovimiento && e.valorAnterior != null && e.valorNuevo === e.valorAnterior;
  if (valorSinCambio) {
    return `El valor de "${e.nombreCuenta}" no cambió respecto al último registro, pero marcaste un aporte o retiro. ¿El valor ya incluye ese movimiento?`;
  }
  const pct = estimarRendimientoPct(e.valorAnterior, e.valorNuevo, e.incluyeMovimiento, e.tipo, e.monto);
  if (pct != null && Math.abs(pct) >= UMBRAL_RENDIMIENTO_IMPLAUSIBLE) {
    return `Con este valor, el rendimiento de "${e.nombreCuenta}" sería de ${pct.toFixed(1)}% respecto al registro anterior. ¿El valor es correcto?`;
  }
  return null;
}
