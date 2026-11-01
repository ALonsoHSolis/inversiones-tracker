import Link from "next/link";
import { login, reenviarConfirmacion } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordInput } from "@/components/PasswordInput";
import { AuthShell } from "@/components/AuthShell";

const inputClass =
  "h-11 px-[13px] border border-white/[0.14] rounded-[10px] text-sm text-fg bg-white/[0.04] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(216,186,124,0.15)]";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; confirmError?: string; confirmMensaje?: string }>;
}) {
  const { error, confirmError, confirmMensaje } = await searchParams;

  return (
    <AuthShell>
      <h1 className="text-[25px] font-semibold tracking-[-0.02em] text-fg">Iniciar sesión</h1>
      <p className="mt-2 text-small text-fg-muted">Entra para ver el rendimiento real de tu portafolio.</p>

      <form action={login} className="flex flex-col gap-[15px] mt-[26px]">
        <label className="flex flex-col gap-[7px]">
          <span className="text-micro font-semibold text-fg-muted">Email</span>
          <input type="email" name="email" placeholder="tucorreo@ejemplo.cl" required className={inputClass} />
        </label>
        <PasswordInput name="password" placeholder="••••••••" />
        {error && <p className="text-xs text-[var(--neg)]">{error}</p>}
        <SubmitButton labelInactivo="Entrar" labelActivo="Entrando..." />
      </form>

      <div className="flex flex-col items-start gap-2.5 mt-5">
        <p className="text-small text-fg-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="font-semibold text-[var(--accent)]">
            Crear cuenta gratis
          </Link>
        </p>
        <Link href="/recuperar-password" className="text-small text-fg-muted border-b border-white/[0.14]">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <details className="mt-[22px] border-t border-white/[0.07] pt-4 group" open={Boolean(confirmError || confirmMensaje)}>
        <summary className="flex items-center gap-2 text-micro text-fg-muted cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span className="inline-block transition-transform duration-200 group-open:rotate-90">▸</span>
          ¿No recibiste el correo de confirmación?
        </summary>
        <form action={reenviarConfirmacion} className="flex gap-2 mt-3">
          <input
            type="email"
            name="email"
            placeholder="tucorreo@ejemplo.cl"
            required
            className={`flex-1 ${inputClass} h-[42px] text-small`}
          />
          <SubmitButton labelInactivo="Reenviar" labelActivo="Enviando..." variant="secondary" />
        </form>
        {confirmError && <p className="mt-2 text-xs text-[var(--neg)]">{confirmError}</p>}
        {confirmMensaje && <p className="mt-2 text-xs text-fg-muted">{confirmMensaje}</p>}
      </details>
    </AuthShell>
  );
}
