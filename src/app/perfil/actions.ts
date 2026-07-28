"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function actualizarPreferenciaRecordatorios(formData: FormData) {
  const activar = formData.get("activar") === "true";
  const supabase = await createClient();

  await supabase.auth.updateUser({ data: { recordatorios_activos: activar } });

  revalidatePath("/perfil");
}

// preferencia separada de recordatorios_activos: son dos intenciones
// distintas (un empujón para que actualices datos vs. un resumen de
// resultados), alguien podria querer una sin la otra.
export async function actualizarPreferenciaReporteMensual(formData: FormData) {
  const activar = formData.get("activar") === "true";
  const supabase = await createClient();

  await supabase.auth.updateUser({ data: { reporte_mensual_activo: activar } });

  revalidatePath("/perfil");
}
