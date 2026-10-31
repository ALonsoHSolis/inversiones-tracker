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
        <p className="text-[14px] font-semibold text-fg">todavía no tienes cuentas cargadas</p>
        <p className="mt-1 text-micro text-fg-muted max-w-[300px] mx-auto">
          agrega tu primera cuenta para empezar a ver tu rendimiento real, siempre separado de lo
          que depositas.
        </p>
      </div>
      <Link
        href="/cuentas/nueva"
        className="inline-flex items-center gap-1.5 mt-1 h-9 px-4 rounded-[9px] bg-[var(--accent)] text-ink text-small font-semibold no-underline"
      >
        + agregar tu primera cuenta
      </Link>

      <div className="mt-2 w-full max-w-[280px] text-left bg-white/[0.03] border border-white/[0.08] rounded-xl p-3.5">
        <p className="text-micro uppercase tracking-[0.08em] font-semibold text-fg-subtle text-center mb-2.5">
          así se ve un portafolio con datos (ejemplo)
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-micro uppercase tracking-[0.07em] font-semibold text-fg-muted">Valor total</p>
            <p className="font-mono-tabular mt-1 font-semibold text-[17px] text-fg">$4.320.500</p>
          </div>
          <span className="font-mono-tabular inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(62,217,163,0.15)] text-pos text-micro font-semibold">
            +6,2%
          </span>
        </div>
        <svg viewBox="0 0 120 32" width="100%" height="32" preserveAspectRatio="none" className="block mt-2.5">
          <path
            d="M0 26 C15 25,25 22,35 21 C50 19,60 15,75 13 C90 11,105 9,120 4"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
