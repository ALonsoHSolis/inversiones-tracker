import Link from "next/link";

export function EmptyAccountsState() {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-9 px-4">
      <div className="w-11 h-11 rounded-xl bg-[var(--accent)] flex items-end justify-center gap-[3px] px-[9px] py-2.5">
        <span className="w-1 h-2 bg-white/55 rounded-[1px]" />
        <span className="w-1 h-[13px] bg-white/80 rounded-[1px]" />
        <span className="w-1 h-[18px] bg-white rounded-[1px]" />
      </div>
      <div>
        <p className="text-[14px] font-semibold">todavía no tienes cuentas cargadas</p>
        <p className="mt-1 text-[12.5px] text-[#8A929E] max-w-[300px] mx-auto">
          agrega tu primera cuenta para empezar a ver tu rendimiento real, siempre separado de lo
          que depositas.
        </p>
      </div>
      <Link
        href="/cuentas/nueva"
        className="inline-flex items-center gap-1.5 mt-1 h-9 px-4 rounded-[9px] bg-[var(--accent)] text-white text-[13px] font-semibold no-underline"
      >
        + agregar tu primera cuenta
      </Link>
    </div>
  );
}
