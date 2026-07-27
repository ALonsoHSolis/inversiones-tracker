import Link from "next/link";
import { signup } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordInput } from "@/components/PasswordInput";
import { AuthShell } from "@/components/AuthShell";

const inputClass =
  "h-11 px-[13px] border border-white/[0.14] rounded-[10px] text-sm text-[#F2F5F9] bg-white/[0.04] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mensaje?: string }>;
}) {
  const { error, mensaje } = await searchParams;

  return (
    <AuthShell>
      <h1 className="text-[25px] font-semibold tracking-[-0.02em] text-[#F2F5F9]">Crear cuenta</h1>
      <p className="mt-2 text-[13.5px] text-[#8892A0]">
        Gratis, sin conectar tu banco. Tú registras, nosotros calculamos.
      </p>

      <form action={signup} className="flex flex-col gap-[15px] mt-[26px]">
        <label className="flex flex-col gap-[7px]">
          <span className="text-[12.5px] font-semibold text-[#8892A0]">Email</span>
          <input type="email" name="email" placeholder="tucorreo@ejemplo.cl" required className={inputClass} />
        </label>
        <PasswordInput name="password" placeholder="Mínimo 8 caracteres" minLength={8} mostrarFortaleza />
        <label className="flex items-start gap-2.5 mt-0.5 cursor-pointer">
          <input
            type="checkbox"
            name="aceptaTerminos"
            required
            className="w-[17px] h-[17px] mt-px accent-[var(--accent)] shrink-0"
          />
          <span className="text-[12.5px] text-[#8892A0] leading-relaxed">
            Acepto los{" "}
            <Link href="/terminos" target="_blank" rel="noopener noreferrer" className="text-[#C7CDD6] border-b border-white/[0.14]">
              Términos
            </Link>{" "}
            y la{" "}
            <Link
              href="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C7CDD6] border-b border-white/[0.14]"
            >
              política de privacidad
            </Link>
          </span>
        </label>
        {error && <p className="text-xs text-[var(--neg)]">{error}</p>}
        {mensaje && <p className="text-xs text-[#8892A0]">{mensaje}</p>}
        <SubmitButton labelInactivo="Crear cuenta" labelActivo="Creando cuenta..." />
      </form>

      <p className="mt-4 text-[13px] text-[#8892A0]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-[var(--accent)]">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
