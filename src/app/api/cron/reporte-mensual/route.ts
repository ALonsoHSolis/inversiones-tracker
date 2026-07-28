import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerOrigin } from "@/lib/origin";
import { formatoPesos, formatoPesosSigned, formatoPct } from "@/lib/formato";

interface TotalesUsuario {
  valorActualClp: number;
  capitalAportadoClp: number;
  // "hace un mes": suma del ultimo valor conocido de cada cuenta a esa fecha
  // (0 si la cuenta ni existia -- su aporte inicial ya queda contado como
  // aporte del mes mas abajo, asi que no duplica ni esconde nada).
  valorHaceUnMesClp: number;
  // aportes netos (aporte positivo, retiro negativo) del ultimo mes, en clp.
  aportesMesClp: number;
}

function construirCorreo(
  origin: string,
  t: {
    valorActualClp: number;
    capitalAportadoClp: number;
    gananciaTotalClp: number;
    gananciaTotalPct: number | null;
    gananciaMesClp: number;
    gananciaMesPct: number | null;
  }
) {
  const linkDashboard = `${origin}/dashboard`;
  const linkPerfil = `${origin}/perfil`;

  return `
    <div style="font-family: sans-serif; font-size: 14px; color: #171A20; line-height: 1.6;">
      <p>Hola,</p>
      <p>Este es tu resumen del mes en Mi portafolio.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #8A929E;">Valor total actual</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatoPesos(t.valorActualClp)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8A929E;">Capital aportado</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatoPesos(t.capitalAportadoClp)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8A929E;">Ganancia total</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatoPesosSigned(t.gananciaTotalClp)}${
            t.gananciaTotalPct != null ? ` (${formatoPct(t.gananciaTotalPct)})` : ""
          }</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8A929E; border-top: 1px solid #E5E8EC;">Cambio este mes</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; border-top: 1px solid #E5E8EC;">${formatoPesosSigned(t.gananciaMesClp)}${
            t.gananciaMesPct != null ? ` (${formatoPct(t.gananciaMesPct)})` : ""
          }</td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #8A929E;">
        "Cambio este mes" y "ganancia total" ya descuentan los aportes y retiros que hiciste — nunca
        confunden un depósito con una ganancia.
      </p>
      <p><a href="${linkDashboard}" style="color: #2A5F94; font-weight: 600;">Ver el detalle en tu dashboard →</a></p>
      <p style="margin-top: 24px; font-size: 12px; color: #8A929E;">
        Si no quieres recibir este reporte, puedes desactivarlo desde
        <a href="${linkPerfil}" style="color: #8A929E;">tu perfil</a>.
      </p>
    </div>
  `;
}

// disparado por el cron mensual configurado en vercel.json. protegido con
// CRON_SECRET, mismo patron que /api/cron/recordatorios.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const origin = await obtenerOrigin();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const remitente = process.env.RESEND_FROM_EMAIL ?? "Mi portafolio <onboarding@resend.dev>";

  const hoy = new Date().toISOString().slice(0, 10);
  const haceUnMes = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const primerDiaDelMes = `${hoy.slice(0, 7)}-01`;

  const { data: cuentas, error: errorCuentas } = await supabase
    .from("cuentas")
    .select("id, user_id, moneda")
    .eq("activa", true);
  if (errorCuentas) return NextResponse.json({ error: errorCuentas.message }, { status: 500 });

  const cuentaPorId = new Map((cuentas ?? []).map((c) => [c.id, c]));
  const cuentaIds = (cuentas ?? []).map((c) => c.id);
  if (cuentaIds.length === 0) return NextResponse.json({ enviados: 0, omitidos: 0 });

  const [{ data: capitalPorCuenta, error: errorCapital }, { data: snapshotsViejos, error: errorSnap }, { data: movimientosMes, error: errorMov }] =
    await Promise.all([
      supabase.from("capital_por_cuenta").select("cuenta_id, capital_aportado_clp, valor_actual_clp"),
      // el ultimo snapshot conocido de cada cuenta a la fecha de corte (hace un
      // mes) -- ordenado desc para poder quedarse solo con el primero por
      // cuenta_id, mismo patron de forward-fill que ya usan las vistas sql.
      supabase
        .from("snapshots")
        .select("cuenta_id, valor, tasa_cambio")
        .in("cuenta_id", cuentaIds)
        .lte("fecha", haceUnMes)
        .order("fecha", { ascending: false }),
      supabase
        .from("movimientos")
        .select("cuenta_id, tipo, monto, tasa_cambio")
        .in("cuenta_id", cuentaIds)
        .gt("fecha", haceUnMes)
        .lte("fecha", hoy),
    ]);
  if (errorCapital) return NextResponse.json({ error: errorCapital.message }, { status: 500 });
  if (errorSnap) return NextResponse.json({ error: errorSnap.message }, { status: 500 });
  if (errorMov) return NextResponse.json({ error: errorMov.message }, { status: 500 });

  const valorHaceUnMesPorCuenta = new Map<string, number>();
  (snapshotsViejos ?? []).forEach((s) => {
    if (!s.cuenta_id || valorHaceUnMesPorCuenta.has(s.cuenta_id)) return;
    const cuenta = cuentaPorId.get(s.cuenta_id);
    if (!cuenta) return;
    const valorClp = cuenta.moneda === "CLP" ? s.valor : s.valor * (s.tasa_cambio ?? 1);
    valorHaceUnMesPorCuenta.set(s.cuenta_id, valorClp);
  });

  const aportesMesPorCuenta = new Map<string, number>();
  (movimientosMes ?? []).forEach((m) => {
    if (!m.cuenta_id) return;
    const cuenta = cuentaPorId.get(m.cuenta_id);
    if (!cuenta) return;
    const montoClp = cuenta.moneda === "CLP" ? m.monto : m.monto * (m.tasa_cambio ?? 1);
    const signo = m.tipo === "aporte" ? 1 : -1;
    aportesMesPorCuenta.set(m.cuenta_id, (aportesMesPorCuenta.get(m.cuenta_id) ?? 0) + signo * montoClp);
  });

  const totalesPorUsuario = new Map<string, TotalesUsuario>();
  (capitalPorCuenta ?? []).forEach((c) => {
    if (!c.cuenta_id) return;
    const cuenta = cuentaPorId.get(c.cuenta_id);
    if (!cuenta) return;
    const t = totalesPorUsuario.get(cuenta.user_id) ?? {
      valorActualClp: 0,
      capitalAportadoClp: 0,
      valorHaceUnMesClp: 0,
      aportesMesClp: 0,
    };
    t.valorActualClp += c.valor_actual_clp ?? 0;
    t.capitalAportadoClp += c.capital_aportado_clp ?? 0;
    t.valorHaceUnMesClp += valorHaceUnMesPorCuenta.get(c.cuenta_id) ?? 0;
    t.aportesMesClp += aportesMesPorCuenta.get(c.cuenta_id) ?? 0;
    totalesPorUsuario.set(cuenta.user_id, t);
  });

  let enviados = 0;
  let omitidos = 0;

  for (const [userId, t] of totalesPorUsuario) {
    const { data: dataUser, error: errorUser } = await supabase.auth.admin.getUserById(userId);
    const usuario = dataUser?.user;

    if (errorUser) {
      console.error(`reporte-mensual: getUserById fallo para ${userId}:`, errorUser.message);
      omitidos++;
      continue;
    }
    if (!usuario?.email) {
      console.error(`reporte-mensual: usuario ${userId} sin email`);
      omitidos++;
      continue;
    }
    if (usuario.user_metadata?.reporte_mensual_activo === false) {
      omitidos++;
      continue;
    }

    // guardia contra un doble envio en el mismo mes (ej. si el cron se
    // dispara dos veces) -- un reporte mensual duplicado es mas notorio que
    // un recordatorio semanal repetido.
    const { data: yaEnviado, error: errorYaEnviado } = await supabase
      .from("reportes_mensuales_enviados")
      .select("id")
      .eq("user_id", userId)
      .gte("fecha_envio", `${primerDiaDelMes}T00:00:00Z`)
      .limit(1);
    if (errorYaEnviado) {
      console.error(`reporte-mensual: chequeo de duplicado fallo para ${userId}:`, errorYaEnviado.message);
      omitidos++;
      continue;
    }
    if ((yaEnviado ?? []).length > 0) {
      omitidos++;
      continue;
    }

    const gananciaTotalClp = t.valorActualClp - t.capitalAportadoClp;
    const gananciaTotalPct = t.capitalAportadoClp > 0 ? (gananciaTotalClp / t.capitalAportadoClp) * 100 : null;

    const baseMes = t.valorHaceUnMesClp + t.aportesMesClp;
    const gananciaMesClp = t.valorActualClp - t.valorHaceUnMesClp - t.aportesMesClp;
    const gananciaMesPct = baseMes > 0 ? (gananciaMesClp / baseMes) * 100 : null;

    const correo = construirCorreo(origin, {
      valorActualClp: t.valorActualClp,
      capitalAportadoClp: t.capitalAportadoClp,
      gananciaTotalClp,
      gananciaTotalPct,
      gananciaMesClp,
      gananciaMesPct,
    });

    const { error: errorEnvio } = await resend.emails.send({
      from: remitente,
      to: usuario.email,
      subject: "Tu resumen del mes en Mi portafolio",
      html: correo,
    });

    if (errorEnvio) {
      console.error(`reporte-mensual: resend fallo para ${usuario.email}:`, errorEnvio.message);
      omitidos++;
      continue;
    }

    await supabase.from("reportes_mensuales_enviados").insert({ user_id: userId });
    enviados++;
  }

  return NextResponse.json({ enviados, omitidos });
}
