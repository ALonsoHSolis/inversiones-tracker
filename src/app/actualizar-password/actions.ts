"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function actualizarPassword(formData: FormData) {
  const password = formData.get("password") as string;
  const passwordConfirmacion = formData.get("passwordConfirmacion") as string;

  if (password !== passwordConfirmacion) {
    redirect(`/actualizar-password?error=${encodeURIComponent("las contrasenas no coinciden")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/actualizar-password?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
