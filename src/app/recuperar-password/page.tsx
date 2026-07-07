import Link from "next/link";
import { recuperarPassword } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthShell } from "@/components/AuthShell";

export default async function RecuperarPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ mensaje?: string }>;
}) {
  const { mensaje } = await searchParams;

  return (
    <AuthShell>
      <h1 className="text-[25px] font-semibold tracking-[-0.02em]">¿Olvidaste tu contraseña?</h1>
      <p className="mt-2.5 text-[13.5px] text-[#8A929E] leading-relaxed">
        Ingresa tu correo y, si tienes una cuenta, te enviaremos un link para crear una contraseña nueva.
      </p>

      <form action={recuperarPassword} className="flex flex-col gap-[15px] mt-6">
        <label className="flex flex-col gap-[7px]">
          <span className="text-[12.5px] font-semibold text-[#6B7280]">Email</span>
          <input
            type="email"
            name="email"
            placeholder="tucorreo@ejemplo.cl"
            required
            className="h-11 px-[13px] border border-[#DFE2E8] rounded-[10px] text-sm text-[#171A20] bg-white focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(20,80,140,0.1)]"
          />
        </label>
        {mensaje && <p className="text-xs text-gray-600">{mensaje}</p>}
        <SubmitButton labelInactivo="Enviar link" labelActivo="Enviando..." />
      </form>

      <p className="mt-[18px] text-[13px]">
        <Link href="/login" className="font-semibold text-[var(--accent)]">
          ← Volver a iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
