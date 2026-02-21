-- Allow members to delete conversations they belong to
CREATE POLICY "Members can delete conversations"
  ON public.conversations FOR DELETE
  TO authenticated
  USING (
    exists (
      select 1 from public.conversation_members
      where conversation_id = id and user_id = auth.uid()
    )
  );

-- Allow members to delete their own membership
CREATE POLICY "Members can delete own membership"
  ON public.conversation_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
