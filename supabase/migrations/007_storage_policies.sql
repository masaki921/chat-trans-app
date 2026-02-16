-- ============================================
-- 007: Storage Policies for avatars bucket
-- ============================================
-- NOTE: バケット「avatars」はSupabase Dashboardで手動作成が必要
--   Dashboard → Storage → New Bucket
--   Name: avatars, Public: ON, File size limit: 5MB, Allowed MIME types: image/*

-- 誰でもアバター画像を閲覧可能
CREATE POLICY "avatars_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 自分のフォルダにのみアップロード可能
CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 自分のファイルのみ更新可能
CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 自分のファイルのみ削除可能
CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
