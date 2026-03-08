-- 翻訳先言語カラムを追加（UI言語と分離）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS translation_language text NOT NULL DEFAULT 'en';

-- 既存データ: primary_language の値をコピー
UPDATE profiles SET translation_language = primary_language WHERE translation_language = 'en' AND primary_language != 'en';
