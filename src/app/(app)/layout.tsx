import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ExportarDatos } from "@/components/ExportarDatos";
import { FeedbackLink } from "@/components/FeedbackLink";
import { ITEM_MENU } from "@/components/MenuCuenta";
import { PrintButton } from "@/components/PrintButton";
import { PrivacyShell } from "@/components/PrivacyShell";
import { logout } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

// layout de toda la parte autenticada: guard de sesion (el middleware ya
// refresca la cookie; aca se exige que exista un usuario) + shell con sidebar,
// barra superior y navegacion inferior en celular. el modo privado envuelve
// todo el shell, asi el toggle de la barra superior difumina los montos de
// cualquier pagina.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <PrivacyShell>
      <AppShell
        email={user.email ?? ""}
        acciones={
          <>
            <ExportarDatos className={ITEM_MENU} />
            <PrintButton className={ITEM_MENU} />
            <FeedbackLink className={ITEM_MENU}>Escríbenos</FeedbackLink>
            <div className="h-px bg-white/[0.07] my-1.5" />
            <form action={logout}>
              <button type="submit" className={ITEM_MENU}>
                Cerrar sesión
              </button>
            </form>
          </>
        }
      >
        {children}
      </AppShell>
    </PrivacyShell>
  );
}
