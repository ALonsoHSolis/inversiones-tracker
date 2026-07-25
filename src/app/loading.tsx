// fallback generico para cualquier ruta que no tenga su propio loading.tsx
// (el dashboard tiene el suyo, con forma de dashboard, en
// src/app/dashboard/loading.tsx -- antes vivia aca en la raiz y por eso se
// veia brevemente al navegar a otras paginas como /cuentas/[id]/editar).
export default function Loading() {
  return (
    <main className="max-w-[560px] mx-auto px-6 pt-[26px] pb-16">
      <div className="flex flex-col gap-3">
        <div className="skeleton h-9 w-40" />
        <div className="skeleton h-[200px] w-full rounded-2xl" />
      </div>
    </main>
  );
}
