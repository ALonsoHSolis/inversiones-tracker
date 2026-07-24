import Link from "next/link";
import { signup } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordInput } from "@/components/PasswordInput";
import { AuthShell } from "@/components/AuthShell";

const inputClass =
  "h-11 px-[13px] border border-[#DFE2E8] rounded-[10px] text-sm text-[#171A20] bg-white focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(20,80,140,0.1)]";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mensaje?: string }>;
}) {
  const { error, mensaje } = await searchParams;

  return (
    <AuthShell>
      <h1 className="text-[25px] font-semibold tracking-[-0.02em]">Crear cuenta</h1>
      <p className="mt-2 text-[13.5px] text-[#8A929E]">
        Gratis, sin conectar tu banco. Tú registras, nosotros calculamos.
      </p>

      <form action={signup} className="flex flex-col gap-[15px] mt-[26px]">
        <label className="flex flex-col gap-[7px]">
          <span className="text-[12.5px] font-semibold text-[#6B7280]">Email</span>
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
          <span className="text-[12.5px] text-[#6B7280] leading-relaxed">
            Acepto los{" "}
            <Link href="/terminos" target="_blank" rel="noopener noreferrer" className="text-[#171A20] border-b border-[#DADEE4]">
              Términos
            </Link>{" "}
            y la{" "}
            <Link
              href="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#171A20] border-b border-[#DADEE4]"
            >
              política de privacidad
            </Link>
          </span>
        </label>
        {error && <p className="text-xs text-red-700">{error}</p>}
        {mensaje && <p className="text-xs text-gray-600">{mensaje}</p>}
        <SubmitButton labelInactivo="Crear cuenta" labelActivo="Creando cuenta..." />
      </form>

      <p className="mt-4 text-[13px] text-[#8A929E]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-[var(--accent)]">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
