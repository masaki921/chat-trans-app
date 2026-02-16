-- profiles テーブル: ユーザー情報
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default '',
  avatar_url text,
  status_message text,
  primary_language text not null default 'en',
  push_token text,
  is_online boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS有効化
alter table public.profiles enable row level security;

-- RLSポリシー
create policy "Anyone can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- 新規ユーザー作成時にprofileを自動作成するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, primary_language)
  values (new.id, '', 'en');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Realtime有効化
alter publication supabase_realtime add table public.profiles;
