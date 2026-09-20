create or replace function public.update_rider_location(
  p_latitude double precision,
  p_longitude double precision,
  p_heading double precision default null,
  p_speed double precision default null,
  p_is_online boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_rider_id uuid;
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;

  if p_latitude is null or p_longitude is null then
    raise exception 'Latitude and longitude are required.' using errcode = '22023';
  end if;

  if p_latitude < -90 or p_latitude > 90 then
    raise exception 'Latitude must be between -90 and 90.' using errcode = '22023';
  end if;

  if p_longitude < -180 or p_longitude > 180 then
    raise exception 'Longitude must be between -180 and 180.' using errcode = '22023';
  end if;

  select id into v_rider_id
  from public.riders
  where id = auth.uid();

  if v_rider_id is null then
    raise exception 'Rider record not found for the authenticated user.' using errcode = 'P0001';
  end if;

  insert into public.rider_locations (
    rider_id,
    latitude,
    longitude,
    heading,
    speed,
    is_online,
    updated_at
  )
  values (
    v_rider_id,
    p_latitude,
    p_longitude,
    p_heading,
    p_speed,
    p_is_online,
    v_now
  );

  update public.riders
  set
    current_latitude = p_latitude,
    current_longitude = p_longitude,
    is_online = p_is_online,
    updated_at = v_now
  where id = v_rider_id;

  return jsonb_build_object(
    'success', true,
    'rider_id', v_rider_id,
    'latitude', p_latitude,
    'longitude', p_longitude,
    'heading', p_heading,
    'speed', p_speed,
    'is_online', p_is_online,
    'updated_at', v_now
  );
end;
$$;

grant execute on function public.update_rider_location(
  double precision,
  double precision,
  double precision,
  double precision,
  boolean
) to authenticated;
