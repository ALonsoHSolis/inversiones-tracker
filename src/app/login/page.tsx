import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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
        <button
          type="submit"
          className="mt-2 w-full rounded bg-gray-900 text-white text-sm py-2"
        >
          entrar
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        no tienes cuenta?{" "}
        <Link href="/signup" className="text-gray-900 underline">
          crea una
        </Link>
      </p>
    </main>
  );
}
