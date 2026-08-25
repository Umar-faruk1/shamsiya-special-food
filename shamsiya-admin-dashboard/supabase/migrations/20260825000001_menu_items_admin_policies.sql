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
grant select, insert, update on table public.menu_items to authenticated;
grant select on table public.categories to authenticated;

alter table public.menu_items enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'menu_items'
  loop
    execute format('drop policy if exists %I on public.menu_items', policy_record.policyname);
  end loop;
end;
$$;

create policy "Admins can view menu items"
  on public.menu_items for select
  to authenticated
  using (public.is_admin());

create policy "Admins can create menu items"
  on public.menu_items for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update menu items"
  on public.menu_items for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
