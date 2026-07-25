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
      <div className="bg-white border border-[#E7E9EE] rounded-2xl p-6 text-center">
        <h1 className="text-[19px] font-semibold tracking-[-0.02em]">algo salió mal</h1>
        <p className="mt-2 text-[13.5px] text-[#8A929E]">no se pudo cargar la página. Intenta de nuevo.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 h-11 w-full rounded-[10px] bg-[var(--accent)] text-white text-[14px] font-semibold"
        >
          reintentar
        </button>
      </div>
    </main>
  );
}
