"use server";

import { redirect } from "next/navigation";
import { track } from "@vercel/analytics/server";
import { createClient } from "@/lib/supabase/server";
import { obtenerOrigin } from "@/lib/origin";

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const origin = await obtenerOrigin();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("la contraseña debe tener al menos 8 caracteres")}`);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // se registra en cuanto signUp tiene exito, sin esperar a que confirme el
  // email -- desde la perspectiva de "activacion" el usuario ya completo el
  // paso de registro, confirme o no el correo despues.
  await track("signup_completado");

  // sin data.session: el proyecto exige confirmar el email antes de dejar entrar.
  if (!data.session) {
    redirect(`/signup?mensaje=${encodeURIComponent("revisa tu correo para confirmar la cuenta")}`);
  }

  redirect("/dashboard");
}
