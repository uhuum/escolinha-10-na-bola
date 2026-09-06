-- Applied to production on 2026-09-06.
-- Keeps existing SIGA behavior while removing public Storage access and
-- optimizing JWT role checks. Do not reintroduce public receipt policies.

begin;

update storage.buckets set public = false where id in ('receipts', 'students-receipts');

drop policy if exists "Allow authenticated users to upload receipts" on storage.objects;
drop policy if exists "Allow public to read receipts" on storage.objects;
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Update" on storage.objects;
drop policy if exists "Public Upload" on storage.objects;

-- Current production policies are role-scoped and use app_metadata, which users
-- cannot edit themselves. public.users remains unavailable to browser roles.

commit;
