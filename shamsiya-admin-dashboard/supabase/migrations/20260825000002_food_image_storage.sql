insert into storage.buckets (id, name, public)
values ('food-images', 'food-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Admins can view food images" on storage.objects;
create policy "Admins can view food images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'food-images' and public.is_admin());

drop policy if exists "Admins can upload food images" on storage.objects;
create policy "Admins can upload food images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'food-images' and public.is_admin());

drop policy if exists "Admins can update food images" on storage.objects;
create policy "Admins can update food images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'food-images' and public.is_admin())
  with check (bucket_id = 'food-images' and public.is_admin());

drop policy if exists "Admins can delete food images" on storage.objects;
create policy "Admins can delete food images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'food-images' and public.is_admin());
