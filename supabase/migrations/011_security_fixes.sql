-- ============================================
-- 011: Security Fixes
-- ============================================

-- =====================
-- Fix 1: conversation_members INSERT ポリシー修正
-- 現状: WITH CHECK (true) → 誰でも任意の会話にメンバー追加可能
-- 修正: 会話作成者（created_by）のみメンバー追加可能
-- =====================

DROP POLICY IF EXISTS "Conversation creator can add members" ON public.conversation_members;

CREATE POLICY "Conversation creator can add members"
  ON public.conversation_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
        AND created_by = auth.uid()
    )
  );

-- =====================
-- Fix 2: chat-images Storage Policy 制限
-- 現状: 認証ユーザーなら誰でもアップロード可能
-- 修正: 会話メンバーのみアップロード可能（パス: chat-images/{conversation_id}/{filename}）
-- =====================

DROP POLICY IF EXISTS "chat_images_insert_authenticated" ON storage.objects;

CREATE POLICY "chat_images_insert_authenticated"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = (storage.foldername(name))[1]::uuid
      AND user_id = auth.uid()
  )
);
