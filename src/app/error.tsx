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
      <div className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-6 text-center">
        <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-[#F2F5F9]">algo salió mal</h1>
        <p className="mt-2 text-[13.5px] text-[#8892A0]">no se pudo cargar la página. Intenta de nuevo.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 h-11 w-full rounded-[10px] bg-[var(--accent)] text-[#0A0D13] text-[14px] font-semibold"
        >
          reintentar
        </button>
      </div>
    </main>
  );
}
