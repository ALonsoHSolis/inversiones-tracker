import Link from "next/link";

export function EmptyAccountsState() {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-10 px-4">
      <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-end justify-center gap-[3px] px-[11px] py-3">
        <span className="w-1 h-2 bg-accent/60 rounded-[1px]" />
        <span className="w-1 h-[14px] bg-accent/85 rounded-[1px]" />
        <span className="w-1 h-[20px] bg-accent-hi rounded-[1px]" />
      </div>
      <div>
        <p className="text-[17px] font-semibold tracking-[-0.01em] text-fg">Empieza con tu primera cuenta</p>
        <p className="mt-1.5 text-small text-fg-muted max-w-[320px] mx-auto leading-relaxed">
          Agrégala con su valor actual y te mostraremos tu rendimiento real, siempre separado de lo que depositas.
        </p>
      </div>
      <Link
        href="/cuentas/nueva"
        className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[10px] bg-[var(--accent)] text-ink text-small font-semibold no-underline transition-[transform,background-color] duration-150 hover:bg-accent-hi active:scale-[0.98]"
      >
        + Agregar tu primera cuenta
      </Link>

      <div className="mt-3 w-full max-w-[300px] text-left bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
        <p className="text-micro uppercase tracking-[0.1em] font-semibold text-fg-subtle text-center mb-3">
          Así se ve con datos (ejemplo)
        </p>
        <p className="text-micro uppercase tracking-[0.1em] font-semibold text-fg-muted">Ganancia real</p>
        <p className="font-mono-tabular mt-1 font-semibold text-[20px] text-pos">
          +$251.500 <span className="text-micro font-medium">(+6,2%)</span>
        </p>
        <svg viewBox="0 0 120 32" width="100%" height="32" preserveAspectRatio="none" className="block mt-2.5" aria-hidden="true">
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
