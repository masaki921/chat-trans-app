-- messages テーブル
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null not null,
  type text not null default 'text' check (type in ('text', 'image', 'system')),
  content text not null default '',
  media_url text,
  original_language text not null default 'en',
  translations jsonb,
  read_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- インデックス
create index idx_messages_conversation_id on public.messages(conversation_id, created_at desc);

-- RLS有効化
alter table public.messages enable row level security;

-- RLSポリシー
create policy "Members can view messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

create policy "Members can send messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_members
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

create policy "Allow update message translations"
  on public.messages for update
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- メッセージ挿入時に会話のlast_message_at/previewを更新するトリガー
create or replace function public.handle_new_message()
returns trigger as $$
begin
  -- 会話のlast_message_at/previewを更新
  update public.conversations
  set last_message_at = new.created_at,
      last_message_preview = left(new.content, 100)
  where id = new.conversation_id;

  -- 送信者以外の未読カウントをインクリメント
  update public.conversation_members
  set unread_count = unread_count + 1
  where conversation_id = new.conversation_id
    and user_id != new.sender_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_message_inserted
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- Realtime有効化
alter publication supabase_realtime add table public.messages;
