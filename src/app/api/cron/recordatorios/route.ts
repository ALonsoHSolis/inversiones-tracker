import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerOrigin } from "@/lib/origin";

function construirCorreo(origin: string) {
  const linkCarga = `${origin}/dashboard#carga-rapida`;
  const linkPerfil = `${origin}/perfil`;
  return `
    <div style="font-family: sans-serif; font-size: 14px; color: #171A20; line-height: 1.6;">
      <p>Hola,</p>
      <p>Van unos días desde tu última actualización. Registra el valor de hoy de tus cuentas
      para que tu rendimiento real siga siendo preciso.</p>
      <p><a href="${linkCarga}" style="color: #2A5F94; font-weight: 600;">Actualizar ahora →</a></p>
      <p style="margin-top: 24px; font-size: 12px; color: #8A929E;">
        Si no quieres recibir este recordatorio, puedes desactivarlo desde
        <a href="${linkPerfil}" style="color: #8A929E;">tu perfil</a>.
      </p>
    </div>
  `;
}

// disparado por el cron semanal configurado en vercel.json. protegido con
// CRON_SECRET: vercel manda "Authorization: Bearer <CRON_SECRET>" en cada
// invocacion programada -- sin el secreto configurado, cualquiera podria
// llamar este endpoint publico y spamear a todos los usuarios.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const origin = await obtenerOrigin();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const remitente = process.env.RESEND_FROM_EMAIL ?? "Mi portafolio <onboarding@resend.dev>";

  const { data: cuentas, error: errorCuentas } = await supabase
    .from("cuentas")
    .select("user_id")
    .eq("activa", true);

  if (errorCuentas) {
    return NextResponse.json({ error: errorCuentas.message }, { status: 500 });
  }

  const userIds = [...new Set((cuentas ?? []).map((c) => c.user_id))];
  const correo = construirCorreo(origin);

  let enviados = 0;
  let omitidos = 0;

  for (const userId of userIds) {
    const { data, error: errorUser } = await supabase.auth.admin.getUserById(userId);
    const usuario = data?.user;

    if (errorUser) {
      console.error(`recordatorios: getUserById fallo para ${userId}:`, errorUser.message);
      omitidos++;
      continue;
    }
    if (!usuario?.email) {
      console.error(`recordatorios: usuario ${userId} sin email`);
      omitidos++;
      continue;
    }
    if (usuario.user_metadata?.recordatorios_activos === false) {
      console.log(`recordatorios: ${userId} hizo opt-out, se omite`);
      omitidos++;
      continue;
    }

    const { error: errorEnvio } = await resend.emails.send({
      from: remitente,
      to: usuario.email,
      subject: "Actualiza tus cuentas de esta semana",
      html: correo,
    });

    if (errorEnvio) {
      console.error(`recordatorios: resend fallo para ${usuario.email}:`, errorEnvio.message);
      omitidos++;
      continue;
    }

    await supabase.from("recordatorios_enviados").insert({ user_id: userId });
    enviados++;
  }

  return NextResponse.json({ enviados, omitidos });
}
