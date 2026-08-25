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

alter table public.categories enable row level security;

grant select, insert, update on table public.categories to authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
  loop
    execute format('drop policy if exists %I on public.categories', policy_record.policyname);
  end loop;
end;
$$;

create policy "Admins can view categories"
  on public.categories for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can create categories" on public.categories;
create policy "Admins can create categories"
  on public.categories for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update categories" on public.categories;
create policy "Admins can update categories"
  on public.categories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());