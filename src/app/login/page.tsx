import Link from "next/link";
import { login, reenviarConfirmacion } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordInput } from "@/components/PasswordInput";
import { AuthShell } from "@/components/AuthShell";

const inputClass =
  "h-11 px-[13px] border border-[#DFE2E8] rounded-[10px] text-sm text-[#171A20] bg-white focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(20,80,140,0.1)]";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; confirmError?: string; confirmMensaje?: string }>;
}) {
  const { error, confirmError, confirmMensaje } = await searchParams;

  return (
    <AuthShell>
      <h1 className="text-[25px] font-semibold tracking-[-0.02em]">Iniciar sesión</h1>
      <p className="mt-2 text-[13.5px] text-[#8A929E]">Entra para ver el rendimiento real de tu portafolio.</p>

      <form action={login} className="flex flex-col gap-[15px] mt-[26px]">
        <label className="flex flex-col gap-[7px]">
          <span className="text-[12.5px] font-semibold text-[#6B7280]">Email</span>
          <input type="email" name="email" placeholder="tucorreo@ejemplo.cl" required className={inputClass} />
        </label>
        <PasswordInput name="password" placeholder="••••••••" />
        {error && <p className="text-xs text-red-700">{error}</p>}
        <SubmitButton labelInactivo="Entrar" labelActivo="Entrando..." />
      </form>

      <div className="flex items-center justify-between mt-4">
        <p className="text-[13px] text-[#8A929E]">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="font-semibold text-[var(--accent)]">
            Crea una
          </Link>
        </p>
        <Link href="/recuperar-password" className="text-[13px] text-[#8A929E] border-b border-[#DADEE4]">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <details className="mt-[22px] border-t border-[#E7E9EE] pt-4 group" open={Boolean(confirmError || confirmMensaje)}>
        <summary className="flex items-center gap-2 text-[12.5px] text-[#8A929E] cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span className="inline-block transition-transform duration-200 group-open:rotate-90">▸</span>
          ¿No recibiste el correo de confirmación?
        </summary>
        <form action={reenviarConfirmacion} className="flex gap-2 mt-3">
          <input
            type="email"
            name="email"
            placeholder="tucorreo@ejemplo.cl"
            required
            className={`flex-1 ${inputClass} h-[42px] text-[13.5px]`}
          />
          <SubmitButton labelInactivo="Reenviar" labelActivo="Enviando..." variant="secondary" />
        </form>
        {confirmError && <p className="mt-2 text-xs text-red-700">{confirmError}</p>}
        {confirmMensaje && <p className="mt-2 text-xs text-gray-600">{confirmMensaje}</p>}
      </details>
    </AuthShell>
  );
}
