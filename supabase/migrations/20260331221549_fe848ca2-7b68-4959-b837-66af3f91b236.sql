
-- Create appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  address text NOT NULL,
  phone text,
  email text,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  high_bill numeric,
  low_bill numeric,
  all_electric boolean DEFAULT false,
  stars integer DEFAULT 0,
  setter text,
  closer text,
  status text DEFAULT 'scheduled',
  outcome text,
  closer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps can view own appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (rep_id = auth.uid() OR has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'backend_ops'));

CREATE POLICY "Reps can create appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (rep_id = auth.uid() OR has_role(auth.uid(), 'master'));

CREATE POLICY "Reps can update own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (rep_id = auth.uid() OR has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'backend_ops'));

-- Create project_messages table
CREATE TABLE public.project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id),
  sender_name text NOT NULL,
  sender_role text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages based on project access" ON public.project_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_messages.project_id
    AND (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'backend_ops')
      OR projects.sales_rep_id = auth.uid()
      OR projects.installer_org_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid())
      OR projects.financier_org_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()))
  ));

CREATE POLICY "Authenticated users can send messages" ON public.project_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Create milestone_states table
CREATE TABLE public.milestone_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  milestone_index integer NOT NULL,
  checklist_done jsonb DEFAULT '{}'::jsonb,
  uploads jsonb DEFAULT '{}'::jsonb,
  text_entries jsonb DEFAULT '{}'::jsonb,
  date_entries jsonb DEFAULT '{}'::jsonb,
  fund_status text DEFAULT 'none',
  ops_notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, milestone_index)
);

ALTER TABLE public.milestone_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View milestone states based on project access" ON public.milestone_states
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = milestone_states.project_id
    AND (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'backend_ops')
      OR projects.sales_rep_id = auth.uid()
      OR projects.installer_org_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid())
      OR projects.financier_org_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()))
  ));

CREATE POLICY "Authorized users can manage milestone states" ON public.milestone_states
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = milestone_states.project_id
    AND (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'backend_ops'))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = milestone_states.project_id
    AND (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'backend_ops'))
  ));

CREATE POLICY "Installers can update their milestone items" ON public.milestone_states
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = milestone_states.project_id
    AND projects.installer_org_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid())
  ));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.milestone_states;

-- Triggers
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestone_states_updated_at BEFORE UPDATE ON public.milestone_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Profile columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS platform_access text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;
