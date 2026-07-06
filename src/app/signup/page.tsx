import Link from "next/link";
import { signup } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mensaje?: string }>;
}) {
  const { error, mensaje } = await searchParams;

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-medium mb-6">crear cuenta</h1>
      <form action={signup} className="flex flex-col gap-3">
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
            minLength={6}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-gray-500">
          <input type="checkbox" name="aceptaTerminos" required className="mt-0.5" />
          <span>
            acepto los{" "}
            <Link
              href="/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 underline"
            >
              terminos
            </Link>{" "}
            y la{" "}
            <Link
              href="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 underline"
            >
              politica de privacidad
            </Link>
          </span>
        </label>
        {error && <p className="text-xs text-red-700">{error}</p>}
        {mensaje && <p className="text-xs text-gray-600">{mensaje}</p>}
        <SubmitButton labelInactivo="crear cuenta" labelActivo="creando cuenta..." />
      </form>
      <p className="text-sm text-gray-500 mt-4">
        ya tienes cuenta?{" "}
        <Link href="/login" className="text-gray-900 underline">
          inicia sesion
        </Link>
      </p>
    </main>
  );
}
