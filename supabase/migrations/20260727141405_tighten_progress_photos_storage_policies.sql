/*
# Tighten progress-photos storage policies

## Overview
The public `progress-photos` bucket had a broad SELECT policy on `storage.objects`
(`users_read_own_photos`) that let any signed-in user LIST all files in the bucket.
Public buckets don't need a SELECT policy for object URL access (public URLs work
without it), and listing exposes more metadata than intended. We drop it and tighten
INSERT/DELETE to the user's own folder.

## Storage policy changes (storage.objects)
- DROP `users_read_own_photos` (SELECT) — not needed for public bucket URL access,
  and it allowed listing all files.
- REPLACE `users_upload_own_photos` (INSERT) — restrict to objects whose folder
  matches the authenticated user's id.
- REPLACE `users_delete_own_photos` (DELETE) — same folder-based ownership restriction.

## Notes
- The app only uses upload, getPublicUrl, and remove — never storage.list() — so
  dropping the SELECT policy does not break any feature.
- Public URLs for uploaded objects still work because the bucket is public.
*/

-- 1. Drop the broad SELECT policy that allowed listing all files
DROP POLICY IF EXISTS "users_read_own_photos" ON storage.objects;

-- 2. Replace INSERT policy with folder-scoped ownership check
DROP POLICY IF EXISTS "users_upload_own_photos" ON storage.objects;
CREATE POLICY "users_upload_own_photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Replace DELETE policy with folder-scoped ownership check
DROP POLICY IF EXISTS "users_delete_own_photos" ON storage.objects;
CREATE POLICY "users_delete_own_photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
