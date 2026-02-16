-- ============================================
-- 008: Storage Policies for chat-images bucket
-- ============================================
-- NOTE: バケット「chat-images」はSupabase Dashboardで手動作成が必要
--   Dashboard → Storage → New Bucket
--   Name: chat-images, Public: ON, File size limit: 10MB, Allowed MIME types: image/*

-- 誰でもチャット画像を閲覧可能
CREATE POLICY "chat_images_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

-- 認証ユーザーはアップロード可能（パス: chat-images/{conversation_id}/{filename}）
CREATE POLICY "chat_images_insert_authenticated"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images'
  AND auth.uid() IS NOT NULL
);

-- 自分がアップロードした画像の削除（ownerベース）
CREATE POLICY "chat_images_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-images'
  AND auth.uid() = owner
);

-- handle_new_message トリガーを更新: image型は「画像」をプレビューに設定
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- 会話の最終メッセージ情報を更新
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = CASE
      WHEN NEW.type = 'image' THEN '📷 画像'
      WHEN NEW.type = 'system' THEN NEW.content
      ELSE LEFT(NEW.content, 100)
    END
  WHERE id = NEW.conversation_id;

  -- 送信者以外の未読カウントをインクリメント
  UPDATE conversation_members
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
