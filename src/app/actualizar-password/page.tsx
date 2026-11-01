import { actualizarPassword } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthShell } from "@/components/AuthShell";

const inputClass =
  "h-11 px-[13px] border border-white/[0.14] rounded-[10px] text-sm text-fg bg-white/[0.04] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(216,186,124,0.15)]";

export default async function ActualizarPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell>
      <h1 className="text-[25px] font-semibold tracking-[-0.02em] text-fg">Crear nueva contraseña</h1>
      <p className="mt-2 text-small text-fg-muted">
        Este paso normalmente se abre desde el link que te enviamos por correo.
      </p>
      <form action={actualizarPassword} className="flex flex-col gap-[15px] mt-[26px]">
        <label className="flex flex-col gap-[7px]">
          <span className="text-micro font-semibold text-fg-muted">Contraseña nueva</span>
          <input type="password" name="password" required minLength={6} className={inputClass} />
        </label>
        <label className="flex flex-col gap-[7px]">
          <span className="text-micro font-semibold text-fg-muted">Confirma la contraseña nueva</span>
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
