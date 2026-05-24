-- Minimal seed for nutrition reference targets (safe to rerun)
insert into public.nutrition_reference_targets (nutrient, population, min_value, max_value, unit, note)
values
  ('protein', 'general_adults', 1.2, 2.2, 'g/kg/day', 'Active adults range.'),
  ('fiber', 'general_adults', 25, 38, 'g/day', 'Typical daily range.'),
  ('water', 'general_adults', 2000, 4000, 'ml/day', 'Baseline hydration guidance.')
on conflict do nothing;

-- Progress photo storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'progress-photos',
  'progress-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS for user-scoped folder paths: {auth.uid()}/...
drop policy if exists "Progress photos: read own" on storage.objects;
create policy "Progress photos: read own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Progress photos: upload own" on storage.objects;
create policy "Progress photos: upload own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Progress photos: update own" on storage.objects;
create policy "Progress photos: update own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Progress photos: delete own" on storage.objects;
create policy "Progress photos: delete own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
