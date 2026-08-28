create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant select, update on table public.orders to authenticated;
grant select on table public.order_items to authenticated;
grant select on table public.profiles to authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.profiles enable row level security;


do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('orders', 'order_items')
  loop
    execute format('drop policy if exists %I on public.%I', policy_record.policyname, policy_record.tablename);
  end loop;
end;
$$;

create policy "Admins can view orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can view order items"
  on public.order_items for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can view profiles for orders" on public.profiles;
create policy "Admins can view profiles for orders"
  on public.profiles for select
  to authenticated
  using (public.is_admin());
