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
      <h1 className="text-[25px] font-semibold tracking-[-0.02em] text-[#F2F5F9]">¿Olvidaste tu contraseña?</h1>
      <p className="mt-2.5 text-[13.5px] text-[#8892A0] leading-relaxed">
        Ingresa tu correo y, si tienes una cuenta, te enviaremos un link para crear una contraseña nueva.
      </p>

      <form action={recuperarPassword} className="flex flex-col gap-[15px] mt-6">
        <label className="flex flex-col gap-[7px]">
          <span className="text-[12.5px] font-semibold text-[#8892A0]">Email</span>
          <input
            type="email"
            name="email"
            placeholder="tucorreo@ejemplo.cl"
            required
            className="h-11 px-[13px] border border-white/[0.14] rounded-[10px] text-sm text-[#F2F5F9] bg-white/[0.04] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
          />
        </label>
        {mensaje && <p className="text-xs text-[#8892A0]">{mensaje}</p>}
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
