-- 0007_storage.sql
-- Bucket da mediateca. Leitura publica (sao as imagens do site), escrita so
-- para quem esta em admins.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'midia',
  'midia',
  true,
  10485760, -- 10 MB
  array['image/webp', 'image/avif', 'image/jpeg', 'image/png', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects e uma tabela compartilhada, que ja vem com policies do
-- proprio Supabase. O drop antes do create deixa esta migration poder rodar
-- duas vezes sem estourar - o que acontece com facilidade quando se aplica
-- SQL colando no editor do painel.
drop policy if exists "leitura publica da midia" on storage.objects;
drop policy if exists "admin envia midia" on storage.objects;
drop policy if exists "admin atualiza midia" on storage.objects;
drop policy if exists "admin apaga midia" on storage.objects;

create policy "leitura publica da midia"
  on storage.objects for select
  using (bucket_id = 'midia');

create policy "admin envia midia"
  on storage.objects for insert
  with check (bucket_id = 'midia' and public.is_admin());

create policy "admin atualiza midia"
  on storage.objects for update
  using (bucket_id = 'midia' and public.is_admin())
  with check (bucket_id = 'midia' and public.is_admin());

create policy "admin apaga midia"
  on storage.objects for delete
  using (bucket_id = 'midia' and public.is_admin());
