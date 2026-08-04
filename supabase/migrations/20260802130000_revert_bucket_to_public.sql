-- Revert progress-photos bucket to public so getPublicUrl() works correctly.
-- Folder-scoped INSERT and DELETE policies remain active to enforce ownership.
-- The SELECT policy on storage.objects is not needed for public buckets (public URLs bypass RLS),
-- but leaving it in place does no harm.

UPDATE storage.buckets SET public = true WHERE id = 'progress-photos';
