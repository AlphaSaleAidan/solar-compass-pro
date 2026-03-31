
-- 1. Extend profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier text DEFAULT 'asp';

-- 2. Extend tickets
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS project_code text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS created_by_role text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- 3. Extend ticket_messages
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS sender_role text;

-- 4. Extend milestone_states
ALTER TABLE public.milestone_states ADD COLUMN IF NOT EXISTS fund_released_at timestamptz;
ALTER TABLE public.milestone_states ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE public.milestone_states ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- 5. sell_projects
CREATE TABLE public.sell_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code text UNIQUE,
  created_by uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  address text,
  high_bill numeric,
  low_bill numeric,
  all_electric boolean DEFAULT false,
  credit_status text DEFAULT 'pending',
  closer text,
  closer_notes text,
  setter text,
  approval_status text DEFAULT 'pending',
  rejection_reason text,
  aurora_synced boolean DEFAULT false,
  aurora_data jsonb,
  converted_to_sale boolean DEFAULT false,
  welcome_call_complete boolean DEFAULT false,
  welcome_call_answers jsonb,
  site_survey_photos jsonb,
  site_survey_complete boolean DEFAULT false,
  submitted_for_approval boolean DEFAULT false,
  documents_sent boolean DEFAULT false,
  organization_id text DEFAULT 'alphasale',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.sell_projects ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.generate_sell_project_code()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(project_code FROM 4) AS integer)), 0) + 1 INTO next_num FROM public.sell_projects WHERE project_code LIKE 'SP-%';
  NEW.project_code := 'SP-' || LPAD(next_num::text, 3, '0');
  RETURN NEW;
END; $$;

CREATE TRIGGER set_sell_project_code BEFORE INSERT ON public.sell_projects FOR EACH ROW WHEN (NEW.project_code IS NULL) EXECUTE FUNCTION public.generate_sell_project_code();
CREATE TRIGGER update_sell_projects_updated_at BEFORE UPDATE ON public.sell_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Sales reps can create sell projects" ON public.sell_projects FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'master'::app_role));
CREATE POLICY "View sell projects by role" ON public.sell_projects FOR SELECT TO authenticated USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role) OR created_by = auth.uid());
CREATE POLICY "Update sell projects by role" ON public.sell_projects FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role) OR created_by = auth.uid());

-- 6. financier_updates
CREATE TABLE public.financier_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  role text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.financier_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View financier updates" ON public.financier_updates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = financier_updates.project_id AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role) OR has_role(auth.uid(), 'financier'::app_role) OR projects.sales_rep_id = auth.uid())));
CREATE POLICY "Insert financier updates" ON public.financier_updates FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'financier'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role));

-- 7. fund_releases
CREATE TABLE public.fund_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone text NOT NULL,
  amount numeric NOT NULL,
  percent numeric NOT NULL,
  approved_by uuid,
  released_at timestamptz DEFAULT now()
);
ALTER TABLE public.fund_releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View fund releases" ON public.fund_releases FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = fund_releases.project_id AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role) OR has_role(auth.uid(), 'financier'::app_role) OR projects.sales_rep_id = auth.uid() OR projects.installer_org_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()))));
CREATE POLICY "Financiers can create fund releases" ON public.fund_releases FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'financier'::app_role));

-- 8. rewards
CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_type text NOT NULL,
  reward_name text NOT NULL,
  reward_value numeric,
  earned_at timestamptz DEFAULT now(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL
);
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own rewards" ON public.rewards FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'master'::app_role));
CREATE POLICY "System insert rewards" ON public.rewards FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role));

-- 9. Extend projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS sell_project_id uuid;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_code text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS panel_type text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS inverter_type text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_cost numeric;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS financier_funded numeric DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS installer_company text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS installer_contact text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS closer text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS setter text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS closer_pay numeric DEFAULT 75;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS setter_pay numeric DEFAULT 100;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS closer_clawback boolean DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS organization_id text DEFAULT 'alphasale';

CREATE OR REPLACE FUNCTION public.generate_project_code()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(project_code FROM 5) AS integer)), 2023) + 1 INTO next_num FROM public.projects WHERE project_code LIKE 'ASP-%';
  NEW.project_code := 'ASP-' || next_num::text;
  RETURN NEW;
END; $$;

CREATE TRIGGER set_project_code BEFORE INSERT ON public.projects FOR EACH ROW WHEN (NEW.project_code IS NULL) EXECUTE FUNCTION public.generate_project_code();

-- 10. Realtime (excluding milestone_states which is already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.sell_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financier_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fund_releases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
