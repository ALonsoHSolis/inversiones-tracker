-- inversiones tracker: schema para supabase (postgres)
-- decisiones de diseno fijadas para esta version:
--   1. el monto inicial de una cuenta nueva cuenta como aporte de capital
--      (para poder ver capital total invertido vs. ganancia total, no solo semanal)
--   2. cuentas en usd/uf se consolidan en clp usando la tasa de cambio del dia
--      de cada snapshot/movimiento (historica, no la de hoy)
--   3. sin carga de historial pasado en esta version, se parte desde hoy

-- cuentas: cada cuenta o inversion que el usuario trackea
create table cuentas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  plataforma text not null,
  tipo text not null check (tipo in ('fondo_mutuo', 'acciones', 'deposito_plazo', 'cripto', 'otro')),
  moneda text not null default 'CLP' check (moneda in ('CLP', 'USD', 'UF')),
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

-- snapshots: valor de una cuenta en una fecha especifica, en su moneda nativa.
-- tasa_cambio: valor de 1 usd o 1 uf en clp ese dia. obligatoria si moneda != 'CLP' (ver trigger).
create table snapshots (
  id uuid primary key default gen_random_uuid(),
  cuenta_id uuid not null references cuentas(id) on delete cascade,
  fecha date not null,
  valor numeric(14,2) not null check (valor >= 0),
  tasa_cambio numeric(12,4),
  created_at timestamptz not null default now(),
  unique (cuenta_id, fecha)
);

-- movimientos: aportes y retiros, en moneda nativa. separados del valor para
-- poder calcular rendimiento real. misma regla de tasa_cambio que snapshots.
-- snapshot_id: nullable, solo se usa cuando el movimiento se registro junto a
-- un snapshot desde la pantalla de carga (ver guardar_snapshot_con_movimiento).
-- el aporte inicial de crear_cuenta_con_aporte_inicial deja esto en null.
create table movimientos (
  id uuid primary key default gen_random_uuid(),
  cuenta_id uuid not null references cuentas(id) on delete cascade,
  snapshot_id uuid references snapshots(id) on delete cascade,
  fecha date not null,
  tipo text not null check (tipo in ('aporte', 'retiro')),
  monto numeric(14,2) not null check (monto > 0),
  tasa_cambio numeric(12,4),
  nota text,
  created_at timestamptz not null default now()
);

create index idx_snapshots_cuenta_fecha on snapshots (cuenta_id, fecha desc);
create index idx_movimientos_cuenta_fecha on movimientos (cuenta_id, fecha desc);

-- a lo sumo un movimiento por snapshot: permite que guardar_snapshot_con_movimiento
-- haga upsert (on conflict (snapshot_id)) en vez de duplicar el aporte cada vez
-- que el usuario re-guarda el mismo snapshot del dia con el toggle marcado.
create unique index movimientos_snapshot_id_unique on movimientos (snapshot_id) where snapshot_id is not null;

-- integridad: tasa_cambio obligatoria para cuentas no-clp, prohibida para cuentas clp.
-- se valida con trigger porque el check depende de otra tabla (cuentas.moneda).
create or replace function validar_tasa_cambio()
returns trigger
language plpgsql
as $$
declare
  v_moneda text;
begin
  select moneda into v_moneda from cuentas where id = new.cuenta_id;

  if v_moneda != 'CLP' and new.tasa_cambio is null then
    raise exception 'tasa_cambio es obligatoria para cuentas en % (cuenta_id=%)', v_moneda, new.cuenta_id;
  end if;

  if v_moneda = 'CLP' and new.tasa_cambio is not null then
    raise exception 'tasa_cambio debe ser nula para cuentas en CLP (cuenta_id=%)', new.cuenta_id;
  end if;

  return new;
end;
$$;

create trigger trg_snapshots_tasa_cambio
  before insert or update on snapshots
  for each row execute function validar_tasa_cambio();

create trigger trg_movimientos_tasa_cambio
  before insert or update on movimientos
  for each row execute function validar_tasa_cambio();

-- row level security: cada usuario solo ve sus propias cuentas
alter table cuentas enable row level security;
alter table snapshots enable row level security;
alter table movimientos enable row level security;

create policy "cuentas propias" on cuentas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "snapshots de cuentas propias" on snapshots
  for all using (exists (
    select 1 from cuentas where cuentas.id = snapshots.cuenta_id and cuentas.user_id = auth.uid()
  ));

create policy "movimientos de cuentas propias" on movimientos
  for all using (exists (
    select 1 from cuentas where cuentas.id = movimientos.cuenta_id and cuentas.user_id = auth.uid()
  ));

-- funcion: crea una cuenta junto con su primer snapshot y su aporte inicial,
-- todo en una sola transaccion. el frontend SIEMPRE debe crear cuentas asi,
-- nunca insertando directo en la tabla cuentas, para que el monto inicial
-- quede contabilizado como capital aportado desde el dia uno.
create or replace function crear_cuenta_con_aporte_inicial(
  p_nombre text,
  p_plataforma text,
  p_tipo text,
  p_moneda text,
  p_monto_inicial numeric,
  p_tasa_cambio numeric default null,
  p_fecha date default current_date
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_cuenta_id uuid;
begin
  if p_monto_inicial < 0 then
    raise exception 'el monto inicial no puede ser negativo';
  end if;

  insert into cuentas (user_id, nombre, plataforma, tipo, moneda)
  values (auth.uid(), p_nombre, p_plataforma, p_tipo, p_moneda)
  returning id into v_cuenta_id;

  insert into snapshots (cuenta_id, fecha, valor, tasa_cambio)
  values (v_cuenta_id, p_fecha, p_monto_inicial, p_tasa_cambio);

  if p_monto_inicial > 0 then
    insert into movimientos (cuenta_id, fecha, tipo, monto, tasa_cambio, nota)
    values (v_cuenta_id, p_fecha, 'aporte', p_monto_inicial, p_tasa_cambio, 'aporte inicial al crear la cuenta');
  end if;

  return v_cuenta_id;
end;
$$;

-- funcion: guarda (upsert) el snapshot de hoy de una cuenta y, opcionalmente,
-- un movimiento (aporte/retiro) atado a ese mismo snapshot, todo en una sola
-- transaccion. el frontend SIEMPRE debe usar esto desde la pantalla de carga
-- masiva, nunca insertar snapshot y movimiento por separado, para no dejar un
-- snapshot sin su aporte si el segundo insert fallara.
-- si el usuario re-guarda el snapshot del mismo dia con el toggle de aporte
-- marcado, esto actualiza el movimiento existente (atado por snapshot_id) en
-- vez de duplicarlo. si re-guarda sin el toggle marcado, borra el movimiento
-- que hubiera quedado de una edicion anterior (evita aportes fantasma).
create or replace function guardar_snapshot_con_movimiento(
  p_cuenta_id uuid,
  p_fecha date,
  p_valor numeric,
  p_tasa_cambio numeric default null,
  p_movimiento_tipo text default null,
  p_movimiento_monto numeric default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_snapshot_id uuid;
begin
  insert into snapshots (cuenta_id, fecha, valor, tasa_cambio)
  values (p_cuenta_id, p_fecha, p_valor, p_tasa_cambio)
  on conflict (cuenta_id, fecha) do update
    set valor = excluded.valor, tasa_cambio = excluded.tasa_cambio
  returning id into v_snapshot_id;

  if p_movimiento_tipo is not null then
    if p_movimiento_monto is null or p_movimiento_monto <= 0 then
      raise exception 'el monto del movimiento debe ser mayor a cero';
    end if;

    insert into movimientos (cuenta_id, fecha, tipo, monto, tasa_cambio, snapshot_id, nota)
    values (p_cuenta_id, p_fecha, p_movimiento_tipo, p_movimiento_monto, p_tasa_cambio, v_snapshot_id, 'registrado junto al snapshot')
    on conflict (snapshot_id) where snapshot_id is not null
      do update set tipo = excluded.tipo, monto = excluded.monto, tasa_cambio = excluded.tasa_cambio;
  else
    delete from movimientos where snapshot_id = v_snapshot_id;
  end if;

  return v_snapshot_id;
end;
$$;

-- vista: rendimiento entre cada snapshot y el anterior, en moneda nativa de la
-- cuenta (para que el % de una cuenta en usd refleje su desempeno real en
-- dolares, sin ruido de tipo de cambio). incluye valor_clp para poder sumar
-- cuentas de distinta moneda en el total del portafolio.
create view rendimiento_semanal as
with snapshots_clp as (
  select
    s.id,
    s.cuenta_id,
    c.nombre,
    c.moneda,
    s.fecha,
    s.valor,
    s.tasa_cambio,
    case when c.moneda = 'CLP' then s.valor else s.valor * s.tasa_cambio end as valor_clp
  from snapshots s
  join cuentas c on c.id = s.cuenta_id
),
ordenados as (
  select
    *,
    lag(valor) over (partition by cuenta_id order by fecha) as valor_anterior,
    lag(valor_clp) over (partition by cuenta_id order by fecha) as valor_clp_anterior,
    lag(fecha) over (partition by cuenta_id order by fecha) as fecha_anterior
  from snapshots_clp
),
movimientos_periodo as (
  select
    o.cuenta_id,
    o.fecha,
    coalesce(sum(case when m.tipo = 'aporte' then m.monto else -m.monto end), 0) as aportes_netos
  from ordenados o
  left join movimientos m
    on m.cuenta_id = o.cuenta_id
    and m.fecha > o.fecha_anterior
    and m.fecha <= o.fecha
  group by o.cuenta_id, o.fecha
)
select
  o.cuenta_id,
  o.nombre,
  o.moneda,
  o.fecha,
  o.valor,
  o.valor_anterior,
  o.valor_clp,
  o.valor_clp_anterior,
  coalesce(mp.aportes_netos, 0) as aportes_netos,
  (o.valor - o.valor_anterior - coalesce(mp.aportes_netos, 0)) as ganancia_real,
  case
    when (o.valor_anterior + coalesce(mp.aportes_netos, 0)) > 0
      then round((((o.valor - o.valor_anterior - coalesce(mp.aportes_netos, 0)) / (o.valor_anterior + coalesce(mp.aportes_netos, 0))) * 100)::numeric, 2)
    else null
  end as rendimiento_pct
from ordenados o
left join movimientos_periodo mp on mp.cuenta_id = o.cuenta_id and mp.fecha = o.fecha
where o.valor_anterior is not null;

-- vista: solo el rendimiento mas reciente por cuenta (la que usa el dashboard)
create view rendimiento_actual as
select distinct on (cuenta_id)
  cuenta_id,
  nombre,
  moneda,
  fecha,
  valor,
  valor_anterior,
  valor_clp,
  valor_clp_anterior,
  aportes_netos,
  ganancia_real,
  rendimiento_pct
from rendimiento_semanal
order by cuenta_id, fecha desc;

-- vista: capital total aportado vs. valor actual, todo en clp, desde que se
-- creo cada cuenta (no semanal, acumulado). el capital aportado se convierte
-- usando la tasa de cambio de CADA aporte (historica), el valor actual usa
-- la tasa del snapshot mas reciente. asi la ganancia_total_clp refleja tanto
-- el rendimiento real como el efecto del tipo de cambio, que es lo que un
-- inversionista en pesos efectivamente experimenta.
create view capital_por_cuenta as
with ultimo_snapshot as (
  select distinct on (cuenta_id)
    cuenta_id, valor as valor_actual, tasa_cambio as tasa_cambio_actual
  from snapshots
  order by cuenta_id, fecha desc
),
aportes as (
  select
    cuenta_id,
    sum(case when tipo = 'aporte' then monto else -monto end) as capital_aportado,
    sum(case when tipo = 'aporte' then monto * coalesce(tasa_cambio, 1) else -monto * coalesce(tasa_cambio, 1) end) as capital_aportado_clp
  from movimientos
  group by cuenta_id
)
select
  c.id as cuenta_id,
  c.nombre,
  c.moneda,
  coalesce(a.capital_aportado, 0) as capital_aportado,
  us.valor_actual,
  case when c.moneda = 'CLP' then coalesce(a.capital_aportado, 0) else coalesce(a.capital_aportado_clp, 0) end as capital_aportado_clp,
  case when c.moneda = 'CLP' then us.valor_actual else us.valor_actual * us.tasa_cambio_actual end as valor_actual_clp
from cuentas c
left join ultimo_snapshot us on us.cuenta_id = c.id
left join aportes a on a.cuenta_id = c.id
where c.activa = true;
