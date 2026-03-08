-- 修正: SECURITY DEFINER関数内でスキーマプレフィックスがないためGoTrueから呼び出し時に
-- "relation does not exist" エラーが発生していた問題を修正

-- create_default_subscription: public.user_subscriptions を明示
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, status)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- increment_translation_usage: public.translation_usage を明示
CREATE OR REPLACE FUNCTION increment_translation_usage(p_user_id uuid, p_month text)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO public.translation_usage (user_id, month, count)
  VALUES (p_user_id, p_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET count = public.translation_usage.count + 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
