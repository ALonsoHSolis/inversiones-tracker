"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerOrigin } from "@/lib/origin";

export async function recuperarPassword(formData: FormData) {
  const supabase = await createClient();
  const origin = await obtenerOrigin();
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/actualizar-password`,
  });

  // deliberado: mismo mensaje generico exista o no el correo, y tambien si
  // resetPasswordForEmail falla por otro motivo -- no distinguir "no existe"
  // de "error" evita que alguien enumere que correos estan registrados.
  if (error) {
    console.error("resetPasswordForEmail error:", error.message);
  }

  redirect(
    `/recuperar-password?mensaje=${encodeURIComponent(
      "si el correo existe en nuestro sistema, te llegara un link para crear una contrasena nueva"
    )}`
  );
}
