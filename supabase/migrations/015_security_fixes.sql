-- CRITICAL #1: messages DELETE RLSポリシー（送信者のみ削除可能）
CREATE POLICY "Senders can delete own messages" ON public.messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

-- HIGH #4: messages UPDATEポリシーを制限（translationsカラムのみ更新可能にする）
-- 既存のUPDATEポリシーを削除して再作成
DROP POLICY IF EXISTS "Members can update messages" ON public.messages;

-- translations更新はservice_role（Edge Function）経由で行うため、
-- 一般ユーザーのUPDATEは送信者が自分のメッセージのみ（送信取り消し前の編集用）に制限
CREATE POLICY "Senders can update own messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- HIGH #5: 使用量カウンターのアトミックインクリメント関数
CREATE OR REPLACE FUNCTION increment_translation_usage(p_user_id uuid, p_month text)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO translation_usage (user_id, month, count)
  VALUES (p_user_id, p_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET count = translation_usage.count + 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
