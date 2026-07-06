import { actualizarPassword } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function ActualizarPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-medium mb-6">crear nueva contrasena</h1>
      <form action={actualizarPassword} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">contrasena nueva</span>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">confirma la contrasena nueva</span>
          <input
            type="password"
            name="passwordConfirmacion"
            required
            minLength={6}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        {error && <p className="text-xs text-red-700">{error}</p>}
        <SubmitButton labelInactivo="guardar contrasena" labelActivo="guardando..." />
      </form>
    </main>
  );
}
