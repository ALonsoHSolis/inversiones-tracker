"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="max-w-[420px] mx-auto px-6 py-16">
      <div className="card p-6 text-center">
        <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-fg">algo salió mal</h1>
        <p className="mt-2 text-small text-fg-muted">no se pudo cargar la página. Intenta de nuevo.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 h-11 w-full rounded-[10px] bg-[var(--accent)] text-ink text-[14px] font-semibold"
        >
          reintentar
        </button>
      </div>
    </main>
  );
}
