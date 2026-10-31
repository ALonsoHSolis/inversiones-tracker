// fecha "de hoy" en hora de Chile, no en UTC.
//
// new Date().toISOString().slice(0, 10) devuelve la fecha UTC: en Chile (UTC-3
// en verano, UTC-4 en invierno) eso adelanta el dia desde ~20:00-21:00 locales,
// y un snapshot guardado de noche quedaba con la fecha de mañana. Intl con
// timeZone explicita da la fecha calendario correcta tanto en el servidor
// (Vercel corre en UTC) como en el navegador (cualquier zona del usuario).
const ZONA_CHILE = "America/Santiago";

const formateadorFecha = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_CHILE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// "YYYY-MM-DD" del instante dado, visto desde Chile.
export function fechaChile(instante: Date): string {
  return formateadorFecha.format(instante);
}

export function fechaHoyChile(ahora: Date = new Date()): string {
  return fechaChile(ahora);
}

// fecha de hace `dias` dias (calendario de Chile). se resta en milisegundos
// sobre el instante, no sobre el string, para no depender del parseo de fechas.
export function fechaChileHaceDias(dias: number, ahora: Date = new Date()): string {
  return fechaChile(new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000));
}
