-- サブスクリプション管理テーブル
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'active', 'expired', 'cancelled')),
  plan text CHECK (plan IN ('basic_monthly', 'basic_yearly')),
  revenuecat_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 翻訳使用量テーブル
CREATE TABLE IF NOT EXISTS translation_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month text NOT NULL, -- '2026-03' format
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, month)
);

-- RLS有効化
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_usage ENABLE ROW LEVEL SECURITY;

-- user_subscriptions: 自分のレコードのみ読み取り可能
CREATE POLICY "Users can read own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- translation_usage: 自分のレコードのみ読み取り可能
CREATE POLICY "Users can read own usage" ON translation_usage
  FOR SELECT USING (auth.uid() = user_id);

-- service_roleはRLSバイパスするので、Edge FunctionからのINSERT/UPDATEは制限不要

-- プロフィール作成時にfreeサブスク自動作成トリガー
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, status)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- 既存ユーザーにfreeサブスクを作成
INSERT INTO user_subscriptions (user_id, status)
SELECT id, 'free' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_translation_usage_user_month ON translation_usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
