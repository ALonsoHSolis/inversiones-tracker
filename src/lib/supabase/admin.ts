import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// solo para contextos sin sesion de usuario (cron jobs, tareas de servidor
// que corren sin un request de un usuario logueado): SUPABASE_SERVICE_ROLE_KEY
// bypassea rls por completo. nunca importar este archivo desde un componente
// cliente ni exponer la key con el prefijo NEXT_PUBLIC_.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
