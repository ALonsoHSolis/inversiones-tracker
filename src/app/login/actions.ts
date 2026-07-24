"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function reenviarConfirmacion(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resend({ type: "signup", email });

  // deliberado: mismo mensaje generico exista o no la cuenta, este confirmada
  // o no, o falle el reenvio por otro motivo -- no distinguir el error real
  // evita que alguien enumere que correos estan registrados (mismo criterio
  // que recuperarPassword en src/app/recuperar-password/actions.ts).
  if (error) {
    console.error("resend signup error:", error.message);
  }

  redirect(
    `/login?confirmMensaje=${encodeURIComponent(
      "si tu cuenta existe y no esta confirmada, te reenviamos el correo"
    )}`
  );
}
