-- Reports table for user/message reporting
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  reported_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Allow requester to also update friendship status (needed for blocking)
CREATE POLICY "Requester can update friendship status"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id);
