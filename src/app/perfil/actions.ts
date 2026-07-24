"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function actualizarPreferenciaRecordatorios(formData: FormData) {
  const activar = formData.get("activar") === "true";
  const supabase = await createClient();

  await supabase.auth.updateUser({ data: { recordatorios_activos: activar } });

  revalidatePath("/perfil");
}
