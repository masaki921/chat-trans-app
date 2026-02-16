-- conversations テーブル
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  type text not null default 'direct' check (type in ('direct', 'group')),
  name text,
  avatar_url text,
  created_by uuid references public.profiles(id) on delete set null,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now()
);

-- conversation_members テーブル
create table public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  unread_count integer not null default 0,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- RLS有効化
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;

-- conversations RLSポリシー
create policy "Members can view conversations"
  on public.conversations for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = id and user_id = auth.uid()
    )
  );

create policy "Authenticated users can create conversations"
  on public.conversations for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Members can update conversations"
  on public.conversations for update
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = id and user_id = auth.uid()
    )
  );

-- conversation_members RLSポリシー
create policy "Members can view conversation members"
  on public.conversation_members for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
    )
  );

create policy "Conversation creator can add members"
  on public.conversation_members for insert
  to authenticated
  with check (true);

create policy "Members can update own membership"
  on public.conversation_members for update
  to authenticated
  using (user_id = auth.uid());

-- Realtime有効化
alter publication supabase_realtime add table public.conversation_members;
