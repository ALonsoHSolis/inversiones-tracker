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
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-medium mb-3">algo salio mal</h1>
      <p className="text-sm text-gray-500 mb-6">no se pudo cargar la pagina. intenta de nuevo.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="w-full rounded bg-gray-900 text-white text-sm py-2"
      >
        reintentar
      </button>
    </main>
  );
}
