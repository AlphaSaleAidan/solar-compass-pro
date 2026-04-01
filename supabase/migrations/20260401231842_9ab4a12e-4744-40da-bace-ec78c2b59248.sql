
-- User gamification state (one row per user)
CREATE TABLE public.user_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  puzzle_pieces integer NOT NULL DEFAULT 0,
  puzzle_cycle integer NOT NULL DEFAULT 0,
  puzzle_prize_index integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  streak_last_deal_date date,
  tickets integer NOT NULL DEFAULT 0,
  alpha_cash numeric NOT NULL DEFAULT 0,
  cash_bonuses numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gamification"
  ON public.user_gamification FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Users can update own gamification"
  ON public.user_gamification FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role));

CREATE POLICY "Users can insert own gamification"
  ON public.user_gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'master'::app_role));

CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User inventory (items won from shop spin)
CREATE TABLE public.user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_name text NOT NULL,
  item_value numeric NOT NULL DEFAULT 0,
  won_at timestamptz NOT NULL DEFAULT now(),
  sold boolean NOT NULL DEFAULT false,
  sold_at timestamptz
);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory"
  ON public.user_inventory FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Users can insert own inventory"
  ON public.user_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Users can update own inventory"
  ON public.user_inventory FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'master'::app_role));
