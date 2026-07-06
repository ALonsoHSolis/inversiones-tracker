import Link from "next/link";
import { login, reenviarConfirmacion } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; confirmError?: string; confirmMensaje?: string }>;
}) {
  const { error, confirmError, confirmMensaje } = await searchParams;

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-medium mb-6">iniciar sesion</h1>
      <form action={login} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">email</span>
          <input
            type="email"
            name="email"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">contrasena</span>
          <input
            type="password"
            name="password"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        {error && <p className="text-xs text-red-700">{error}</p>}
        <SubmitButton labelInactivo="entrar" labelActivo="entrando..." />
      </form>
      <p className="text-sm text-gray-500 mt-4">
        no tienes cuenta?{" "}
        <Link href="/signup" className="text-gray-900 underline">
          crea una
        </Link>
      </p>
      <p className="text-sm text-gray-500 mt-1">
        <Link href="/recuperar-password" className="text-gray-900 underline">
          olvidaste tu contrasena?
        </Link>
      </p>

      <details className="mt-4 text-sm text-gray-500" open={Boolean(confirmError || confirmMensaje)}>
        <summary className="cursor-pointer">no recibiste el correo de confirmacion?</summary>
        <form action={reenviarConfirmacion} className="flex flex-col gap-2 mt-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">email</span>
            <input
              type="email"
              name="email"
              required
              className="rounded border border-gray-300 px-3 py-2"
            />
          </label>
          {confirmError && <p className="text-xs text-red-700">{confirmError}</p>}
          {confirmMensaje && <p className="text-xs text-gray-600">{confirmMensaje}</p>}
          <SubmitButton labelInactivo="reenviar confirmacion" labelActivo="reenviando..." />
        </form>
      </details>
    </main>
  );
}
