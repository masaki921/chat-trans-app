-- conversation_members の SELECT ポリシーが自己参照で無限再帰を起こすため修正

-- 1. ヘルパー関数: 現在のユーザーが所属する conversation_id 一覧を返す
--    SECURITY DEFINER で RLS をバイパスし、再帰を回避
create or replace function public.get_my_conversation_ids()
returns setof uuid as $$
  select conversation_id
  from public.conversation_members
  where user_id = auth.uid()
$$ language sql security definer stable;

-- 2. 既存の再帰ポリシーを削除
drop policy if exists "Members can view conversation members" on public.conversation_members;

-- 3. ヘルパー関数を使った新しいポリシーを作成
create policy "Members can view conversation members"
  on public.conversation_members for select
  to authenticated
  using (conversation_id in (select public.get_my_conversation_ids()));
