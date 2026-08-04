-- Update progress-photos bucket to be private
UPDATE storage.buckets SET public = false WHERE id = 'progress-photos';

-- Drop old storage policies
DROP POLICY IF EXISTS "progress-photos select" ON storage.objects;
DROP POLICY IF EXISTS "progress-photos insert" ON storage.objects;
DROP POLICY IF EXISTS "progress-photos delete" ON storage.objects;

-- Create new storage policies with ownership checks
CREATE POLICY "progress-photos select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "progress-photos insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "progress-photos delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Missing DELETE policy for profiles
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated
USING (auth.uid() = id);

-- Missing UPDATE and DELETE policies for achievements
DROP POLICY IF EXISTS "update_own_achievement" ON achievements;
CREATE POLICY "update_own_achievement" ON achievements FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_achievement" ON achievements;
CREATE POLICY "delete_own_achievement" ON achievements FOR DELETE TO authenticated
USING (auth.uid() = user_id);
