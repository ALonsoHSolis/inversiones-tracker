"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // sin data.session: el proyecto exige confirmar el email antes de dejar entrar.
  if (!data.session) {
    redirect(`/signup?mensaje=${encodeURIComponent("revisa tu correo para confirmar la cuenta")}`);
  }

  redirect("/");
}
