import Link from "next/link";
import { recuperarPassword } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function RecuperarPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ mensaje?: string }>;
}) {
  const { mensaje } = await searchParams;

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-medium mb-6">olvidaste tu contrasena?</h1>
      <p className="text-sm text-gray-500 mb-4">
        ingresa tu correo y, si tienes una cuenta, te enviaremos un link para crear una contrasena
        nueva.
      </p>
      <form action={recuperarPassword} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">email</span>
          <input
            type="email"
            name="email"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        {mensaje && <p className="text-xs text-gray-600">{mensaje}</p>}
        <SubmitButton labelInactivo="enviar link" labelActivo="enviando..." />
      </form>
      <p className="text-sm text-gray-500 mt-4">
        <Link href="/login" className="text-gray-900 underline">
          volver a iniciar sesion
        </Link>
      </p>
    </main>
  );
}
