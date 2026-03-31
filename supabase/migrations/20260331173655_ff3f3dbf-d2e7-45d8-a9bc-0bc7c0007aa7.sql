
-- Create enums
CREATE TYPE public.app_role AS ENUM ('sales_rep', 'backend_ops', 'installer', 'financier', 'master');
CREATE TYPE public.org_type AS ENUM ('asp_core', 'installer_company', 'financier_company');
CREATE TYPE public.project_status AS ENUM ('new', 'credit_check', 'aurora_synced', 'converted', 'documents_sent', 'welcome_call_done', 'site_survey_done', 'submitted_for_approval', 'approved_clean', 'marked_dirty', 'in_pipeline', 'completed');
CREATE TYPE public.credit_status AS ENUM ('pending', 'passed', 'failed');
CREATE TYPE public.milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'approved', 'fund_released');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'escalated');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Organizations
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type org_type NOT NULL DEFAULT 'asp_core',
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User roles (separate table per security requirements)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role), '{}')
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Projects
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'TX',
  zip TEXT,
  -- Solar system specs
  system_size NUMERIC,
  battery TEXT,
  panel_count INTEGER,
  annual_production NUMERIC,
  roof_type TEXT,
  roof_condition TEXT,
  -- Financial
  financier TEXT,
  monthly_payment NUMERIC,
  price_per_watt NUMERIC,
  contract_value NUMERIC,
  escalation_rate NUMERIC DEFAULT 2.99,
  adders JSONB DEFAULT '[]',
  -- Workflow
  status project_status NOT NULL DEFAULT 'new',
  credit_status credit_status NOT NULL DEFAULT 'pending',
  current_milestone INTEGER DEFAULT 0,
  -- Aurora integration
  aurora_project_id TEXT,
  aurora_synced_at TIMESTAMPTZ,
  aurora_data JSONB,
  -- Assignments
  sales_rep_id UUID REFERENCES auth.users(id),
  installer_org_id UUID REFERENCES public.organizations(id),
  financier_org_id UUID REFERENCES public.organizations(id),
  -- Rep info
  rep_name TEXT,
  -- Approval workflow
  submitted_for_approval BOOLEAN DEFAULT false,
  approval_status TEXT,
  dirty_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  -- Welcome call
  welcome_call_completed BOOLEAN DEFAULT false,
  welcome_call_data JSONB,
  -- Site survey
  site_survey_completed BOOLEAN DEFAULT false,
  site_survey_data JSONB,
  -- Documents
  documents_sent BOOLEAN DEFAULT false,
  --
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Project milestones (M1-M7)
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  milestone_number INTEGER NOT NULL CHECK (milestone_number BETWEEN 1 AND 7),
  milestone_name TEXT NOT NULL,
  status milestone_status NOT NULL DEFAULT 'pending',
  fund_amount NUMERIC,
  fund_released BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, milestone_number)
);
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON public.project_milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Project checklist items (within milestones)
CREATE TABLE public.project_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  milestone_number INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT DEFAULT 'checkbox',
  completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_checklist_items ENABLE ROW LEVEL SECURITY;

-- Project documents
CREATE TABLE public.project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- Tickets
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  description TEXT,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ticket messages
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Invitations (master user only)
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role app_role NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Storage bucket for project files
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

-- ============ RLS POLICIES ============

-- Organizations: authenticated users can view all orgs
CREATE POLICY "Authenticated users can view organizations" ON public.organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Master users can manage organizations" ON public.organizations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'master')) WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Profiles: users see own, master sees all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'master'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'master'));

-- User roles: users see own, master manages all
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'master'));
CREATE POLICY "Master users can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'master')) WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Projects: master sees all, sales rep sees own, installer/financier sees assigned
CREATE POLICY "View projects based on role" ON public.projects FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'backend_ops')
  OR sales_rep_id = auth.uid()
  OR installer_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  OR financier_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Sales reps and master can create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'sales_rep')
);
CREATE POLICY "Authorized users can update projects" ON public.projects FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'backend_ops')
  OR sales_rep_id = auth.uid()
);

-- Project milestones: follow project access
CREATE POLICY "View milestones based on project access" ON public.project_milestones FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'backend_ops')
    OR sales_rep_id = auth.uid()
    OR installer_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    OR financier_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  ))
);
CREATE POLICY "Authorized users can manage milestones" ON public.project_milestones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'backend_ops')
  ))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'backend_ops')
  ))
);

-- Project checklist items: follow project access
CREATE POLICY "View checklist based on project access" ON public.project_checklist_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'backend_ops')
    OR sales_rep_id = auth.uid()
    OR installer_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    OR financier_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  ))
);
CREATE POLICY "Authorized users can manage checklist" ON public.project_checklist_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'backend_ops') OR sales_rep_id = auth.uid()
  ))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'backend_ops') OR sales_rep_id = auth.uid()
  ))
);

-- Project documents: follow project access
CREATE POLICY "View documents based on project access" ON public.project_documents FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'backend_ops')
    OR sales_rep_id = auth.uid()
    OR installer_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    OR financier_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  ))
);
CREATE POLICY "Authorized users can upload documents" ON public.project_documents FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'backend_ops') OR sales_rep_id = auth.uid()
  ))
);

-- Tickets: follow project access
CREATE POLICY "View tickets based on role" ON public.tickets FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'backend_ops')
  OR created_by = auth.uid()
  OR assigned_to = auth.uid()
);
CREATE POLICY "Authenticated users can create tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authorized users can update tickets" ON public.tickets FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'backend_ops') OR assigned_to = auth.uid()
);

-- Ticket messages: follow ticket access
CREATE POLICY "View messages for accessible tickets" ON public.ticket_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tickets WHERE id = ticket_id AND (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'backend_ops')
    OR created_by = auth.uid() OR assigned_to = auth.uid()
  ))
);
CREATE POLICY "Users can send messages to accessible tickets" ON public.ticket_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.tickets WHERE id = ticket_id AND (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'backend_ops')
    OR created_by = auth.uid() OR assigned_to = auth.uid()
  ))
);

-- Invitations: master users only
CREATE POLICY "Master users can manage invitations" ON public.invitations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'master')) WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Storage policies for project files
CREATE POLICY "Authenticated users can view project files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'project-files');
CREATE POLICY "Authenticated users can upload project files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-files');

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
