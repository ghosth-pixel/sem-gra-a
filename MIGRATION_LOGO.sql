-- TIGELINHA - logo persistente no Supabase
alter table public.settings add column if not exists logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('branding', 'branding', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=true, file_size_limit=5242880, allowed_mime_types=array['image/png','image/jpeg','image/webp'];

drop policy if exists "branding_public_read" on storage.objects;
drop policy if exists "branding_manager_insert" on storage.objects;
drop policy if exists "branding_manager_update" on storage.objects;
drop policy if exists "branding_manager_delete" on storage.objects;

create policy "branding_public_read" on storage.objects for select using (bucket_id='branding');
create policy "branding_manager_insert" on storage.objects for insert to authenticated with check (bucket_id='branding' and public.is_manager());
create policy "branding_manager_update" on storage.objects for update to authenticated using (bucket_id='branding' and public.is_manager()) with check (bucket_id='branding' and public.is_manager());
create policy "branding_manager_delete" on storage.objects for delete to authenticated using (bucket_id='branding' and public.is_manager());
