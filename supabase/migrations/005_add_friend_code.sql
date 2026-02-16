-- profiles にフレンドコード列を追加
alter table public.profiles add column friend_code text unique;

-- 既存ユーザーにランダムコードを付与
update public.profiles
set friend_code = upper(substr(md5(random()::text), 1, 8))
where friend_code is null;

-- NOT NULL制約を追加
alter table public.profiles alter column friend_code set not null;

-- 新規ユーザー作成時にフレンドコードを自動生成するようトリガーを更新
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, primary_language, friend_code)
  values (
    new.id,
    '',
    'en',
    upper(substr(md5(random()::text), 1, 8))
  );
  return new;
end;
$$ language plpgsql security definer;
