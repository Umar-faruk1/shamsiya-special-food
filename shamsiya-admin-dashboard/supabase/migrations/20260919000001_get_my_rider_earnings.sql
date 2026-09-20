create or replace function public.get_my_rider_earnings()
returns table (
  id uuid,
  rider_id uuid,
  order_id uuid,
  delivery_fee numeric,
  bonus numeric,
  adjustment numeric,
  total numeric,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_rider_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;

  select id into v_rider_id
  from public.riders
  where id = auth.uid();

  if v_rider_id is null then
    raise exception 'Rider record not found for the authenticated user.' using errcode = 'P0001';
  end if;

  return query
  select
    e.id,
    e.rider_id,
    e.order_id,
    e.delivery_fee,
    e.bonus,
    e.adjustment,
    e.total,
    e.status,
    e.created_at
  from public.rider_earnings e
  where e.rider_id = auth.uid()
  order by e.created_at desc;
end;
$$;

grant execute on function public.get_my_rider_earnings() to authenticated;
