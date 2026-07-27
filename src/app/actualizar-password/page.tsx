import { actualizarPassword } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthShell } from "@/components/AuthShell";

const inputClass =
  "h-11 px-[13px] border border-white/[0.14] rounded-[10px] text-sm text-[#F2F5F9] bg-white/[0.04] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]";

export default async function ActualizarPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell>
      <h1 className="text-[25px] font-semibold tracking-[-0.02em] text-[#F2F5F9]">Crear nueva contraseña</h1>
      <p className="mt-2 text-[13.5px] text-[#8892A0]">
        Este paso normalmente se abre desde el link que te enviamos por correo.
      </p>
      <form action={actualizarPassword} className="flex flex-col gap-[15px] mt-[26px]">
        <label className="flex flex-col gap-[7px]">
          <span className="text-[12.5px] font-semibold text-[#8892A0]">Contraseña nueva</span>
          <input type="password" name="password" required minLength={6} className={inputClass} />
        </label>
        <label className="flex flex-col gap-[7px]">
          <span className="text-[12.5px] font-semibold text-[#8892A0]">Confirma la contraseña nueva</span>
          <input
            type="password"
            name="passwordConfirmacion"
            required
            minLength={6}
            className={inputClass}
          />
        </label>
        {error && <p className="text-xs text-[var(--neg)]">{error}</p>}
        <SubmitButton labelInactivo="Guardar contraseña" labelActivo="Guardando..." />
      </form>
    </AuthShell>
  );
}
