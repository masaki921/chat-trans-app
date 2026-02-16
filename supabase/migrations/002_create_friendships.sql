-- friendships テーブル: フレンド関係
create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

-- RLS有効化
alter table public.friendships enable row level security;

-- RLSポリシー
create policy "Users can view own friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can send friend requests"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id);

create policy "Addressee can update friendship status"
  on public.friendships for update
  to authenticated
  using (auth.uid() = addressee_id);

create policy "Users can delete own friendships"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
