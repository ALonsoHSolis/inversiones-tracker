import Link from "next/link";
import { Landmark, LineChart, Plus, SquarePen } from "lucide-react";

// estado vacio que ensena el producto en tres pasos. no muestra cifras de
// ejemplo: antes habia un "+$251.500" ilustrativo que podia leerse como dato.
const PASOS = [
  { Icono: Landmark, titulo: "Agrega una cuenta", texto: "Con su valor de hoy. Ese monto cuenta como capital aportado." },
  { Icono: SquarePen, titulo: "Registra su valor", texto: "Cada semana o cuando quieras, marcando si hubo aportes o retiros." },
  { Icono: LineChart, titulo: "Ve tu ganancia real", texto: "Lo que produjo tu dinero, siempre separado de lo que depositaste." },
];

export function EmptyAccountsState() {
  return (
    <div className="py-6">
      <p className="text-[17px] font-semibold tracking-[-0.01em] text-fg">Empieza con tu primera cuenta</p>
      <p className="mt-1 max-w-[460px] text-small leading-relaxed text-fg-muted">
        Una cuenta es cualquier inversión que quieras seguir: un fondo mutuo, acciones, un depósito a plazo o cripto.
      </p>
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {PASOS.map(({ Icono, titulo, texto }, i) => (
          <li key={titulo} className="rounded-xl bg-white/[0.025] p-4 shadow-[inset_0_0_0_1px_var(--color-edge)]">
            <span className="flex items-center gap-2 text-small font-semibold text-fg">
              <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-accent/12 text-accent-hi">
                <Icono size={15} strokeWidth={2} />
              </span>
              <span>
                <span className="sr-only">Paso {i + 1}: </span>
                {titulo}
              </span>
            </span>
            <span className="mt-2 block text-micro leading-relaxed text-fg-muted">{texto}</span>
          </li>
        ))}
      </ol>
      <Link href="/cuentas/nueva" className="boton-primario mt-5 h-11 rounded-full px-5 no-underline">
        <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
        Agregar tu primera cuenta
      </Link>
    </div>
  );
}
