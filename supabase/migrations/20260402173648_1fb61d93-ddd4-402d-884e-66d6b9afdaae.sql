
-- Create leaderboard table for individual user rankings
CREATE TABLE public.leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  user_name text NOT NULL DEFAULT '',
  deals_count integer NOT NULL DEFAULT 0,
  installs_count integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view the full leaderboard
CREATE POLICY "All authenticated users can view leaderboard"
ON public.leaderboard FOR SELECT
TO authenticated
USING (true);

-- Master and backend_ops can manage all entries
CREATE POLICY "Master and ops can manage leaderboard"
ON public.leaderboard FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role));

-- Sales reps can upsert their own entry
CREATE POLICY "Users can upsert own leaderboard entry"
ON public.leaderboard FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard entry"
ON public.leaderboard FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER update_leaderboard_updated_at
BEFORE UPDATE ON public.leaderboard
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
