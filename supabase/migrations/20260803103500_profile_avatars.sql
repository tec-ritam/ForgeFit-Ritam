-- 1. Add avatar_url column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
DROP POLICY IF EXISTS "users_upload_own_avatars" ON storage.objects;
CREATE POLICY "users_upload_own_avatars" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "users_update_own_avatars" ON storage.objects;
CREATE POLICY "users_update_own_avatars" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
CREATE POLICY "public_read_avatars" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "users_delete_own_avatars" ON storage.objects;
CREATE POLICY "users_delete_own_avatars" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
