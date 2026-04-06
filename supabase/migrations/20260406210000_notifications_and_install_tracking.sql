-- ══════════════════════════════════════════════════════════════════════════
-- Notification Cascade System + Installer Tracking Tables
-- Supports the "wave" flow: SR → Ops → Installer → Financier
-- ══════════════════════════════════════════════════════════════════════════

-- ─── Notifications Table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  from_role TEXT NOT NULL,
  from_user_id UUID REFERENCES auth.users(id),
  to_role TEXT NOT NULL,
  to_user_id UUID REFERENCES auth.users(id),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_to_role ON public.notifications(to_role, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_to_user ON public.notifications(to_user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_project ON public.notifications(project_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read notifications targeted to their role or their user ID
CREATE POLICY "Users can read their notifications"
  ON public.notifications FOR SELECT
  USING (
    to_user_id = auth.uid()
    OR to_role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'master'
  );

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can mark notifications read"
  ON public.notifications FOR UPDATE
  USING (
    to_user_id = auth.uid()
    OR to_role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Any authenticated user can insert notifications (the cascade system)
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ─── Install Tracking Table ────────────────────────────────────────────
-- Tracks the full installation lifecycle with data collection at each step

CREATE TABLE IF NOT EXISTS public.install_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  installer_id UUID REFERENCES auth.users(id),
  
  -- Pre-Install Phase
  sow_signed BOOLEAN DEFAULT false,
  sow_signed_at TIMESTAMPTZ,
  sow_document_url TEXT,
  
  permit_application_submitted BOOLEAN DEFAULT false,
  permit_application_date TIMESTAMPTZ,
  permit_jurisdiction TEXT,                -- City/county/AHJ name
  permit_number TEXT,
  permit_approved BOOLEAN DEFAULT false,
  permit_approved_date TIMESTAMPTZ,
  permit_document_url TEXT,
  
  hoa_approval_required BOOLEAN DEFAULT false,
  hoa_approval_status TEXT DEFAULT 'pending' CHECK (hoa_approval_status IN ('not_required', 'pending', 'submitted', 'approved', 'denied')),
  hoa_document_url TEXT,
  
  materials_ordered BOOLEAN DEFAULT false,
  materials_order_date TIMESTAMPTZ,
  materials_estimated_delivery DATE,
  materials_received BOOLEAN DEFAULT false,
  materials_received_date TIMESTAMPTZ,
  panel_manufacturer TEXT,
  panel_model TEXT,
  panel_count INTEGER,
  inverter_manufacturer TEXT,
  inverter_model TEXT,
  battery_included BOOLEAN DEFAULT false,
  battery_model TEXT,
  
  -- Structural / Site Prep
  structural_assessment_done BOOLEAN DEFAULT false,
  structural_assessment_date TIMESTAMPTZ,
  roof_type TEXT,                          -- asphalt_shingle, tile, metal, flat
  roof_age_years INTEGER,
  roof_condition TEXT CHECK (roof_condition IN ('excellent', 'good', 'fair', 'needs_repair')),
  roof_repair_required BOOLEAN DEFAULT false,
  roof_repair_completed BOOLEAN DEFAULT false,
  attic_access_confirmed BOOLEAN DEFAULT false,
  electrical_panel_assessment TEXT,        -- adequate, needs_upgrade, main_panel_upgrade
  electrical_panel_upgrade_required BOOLEAN DEFAULT false,
  electrical_panel_upgraded BOOLEAN DEFAULT false,
  trenching_required BOOLEAN DEFAULT false,
  
  -- Installation Phase
  install_crew_assigned TEXT,              -- Crew lead name
  install_crew_size INTEGER,
  install_scheduled_date DATE,
  install_scheduled_time TEXT,             -- Morning/Afternoon
  install_started_at TIMESTAMPTZ,
  install_completed_at TIMESTAMPTZ,
  install_duration_hours NUMERIC(4,1),
  
  -- Install Checklist Data
  panels_installed_count INTEGER,
  racking_type TEXT,
  conduit_run_completed BOOLEAN DEFAULT false,
  inverter_mounted BOOLEAN DEFAULT false,
  wiring_completed BOOLEAN DEFAULT false,
  grounding_completed BOOLEAN DEFAULT false,
  monitoring_system_installed BOOLEAN DEFAULT false,
  monitoring_system_type TEXT,             -- Enphase, SolarEdge, etc.
  system_size_kw NUMERIC(6,2),
  
  -- Post-Install Photos (URLs to storage bucket)
  photos_roof_overview TEXT,
  photos_panel_closeup TEXT,
  photos_inverter TEXT,
  photos_electrical_panel TEXT,
  photos_conduit_run TEXT,
  photos_disconnect TEXT,
  photos_meter TEXT,
  photos_placards TEXT,
  
  -- Inspection Phase
  city_inspection_scheduled DATE,
  city_inspection_date TIMESTAMPTZ,
  city_inspection_passed BOOLEAN,
  city_inspection_notes TEXT,
  city_inspection_corrections TEXT,        -- If failed, what needs fixing
  city_reinspection_date TIMESTAMPTZ,
  
  utility_inspection_scheduled DATE,
  utility_inspection_date TIMESTAMPTZ,
  utility_inspection_passed BOOLEAN,
  utility_inspection_notes TEXT,
  
  -- Interconnection / PTO
  interconnection_application_submitted BOOLEAN DEFAULT false,
  interconnection_application_date TIMESTAMPTZ,
  interconnection_agreement_signed BOOLEAN DEFAULT false,
  interconnection_agreement_url TEXT,
  net_meter_installed BOOLEAN DEFAULT false,
  net_meter_install_date TIMESTAMPTZ,
  pto_application_submitted BOOLEAN DEFAULT false,
  pto_application_date TIMESTAMPTZ,
  pto_granted BOOLEAN DEFAULT false,
  pto_granted_date TIMESTAMPTZ,
  pto_document_url TEXT,
  
  -- System Activation
  system_activated BOOLEAN DEFAULT false,
  system_activation_date TIMESTAMPTZ,
  first_production_reading_kwh NUMERIC(8,2),
  monitoring_portal_access_provided BOOLEAN DEFAULT false,
  
  -- Customer Satisfaction (M7 Bonus)
  customer_walkthrough_completed BOOLEAN DEFAULT false,
  customer_walkthrough_date TIMESTAMPTZ,
  customer_satisfaction_rating INTEGER CHECK (customer_satisfaction_rating BETWEEN 1 AND 5),
  customer_satisfaction_notes TEXT,
  thirty_day_review_date DATE,
  thirty_day_review_completed BOOLEAN DEFAULT false,
  thirty_day_issues TEXT,
  
  -- Metadata
  current_phase TEXT DEFAULT 'pre_install' CHECK (current_phase IN (
    'pre_install', 'permitting', 'materials', 'site_prep',
    'installation', 'post_install', 'inspection', 'interconnection',
    'pto_pending', 'activated', 'review'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_install_tracking_project ON public.install_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_install_tracking_installer ON public.install_tracking(installer_id);
CREATE INDEX IF NOT EXISTS idx_install_tracking_phase ON public.install_tracking(current_phase, status);

-- RLS
ALTER TABLE public.install_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Installers can view their assigned installs"
  ON public.install_tracking FOR SELECT
  USING (
    installer_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('backend_ops', 'master')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'financier'
  );

CREATE POLICY "Installers can update their assigned installs"
  ON public.install_tracking FOR UPDATE
  USING (
    installer_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('backend_ops', 'master')
  );

CREATE POLICY "Ops and master can insert install tracking"
  ON public.install_tracking FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('backend_ops', 'master', 'installer')
  );


-- ─── Financier Fund Releases Table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fund_releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  financier_id UUID REFERENCES auth.users(id),
  milestone_number INTEGER NOT NULL CHECK (milestone_number BETWEEN 1 AND 7),
  milestone_name TEXT NOT NULL,
  release_percentage NUMERIC(4,1) NOT NULL,
  release_amount NUMERIC(10,2),
  
  -- Verification
  requested_at TIMESTAMPTZ DEFAULT now(),
  requested_by UUID REFERENCES auth.users(id),
  verified_by_ops BOOLEAN DEFAULT false,
  verified_by_ops_at TIMESTAMPTZ,
  verified_by_ops_user UUID REFERENCES auth.users(id),
  
  -- Approval & Payment
  approved_by_financier BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  payment_method TEXT,                    -- wire, ach, check
  payment_reference TEXT,
  payment_sent_at TIMESTAMPTZ,
  payment_confirmed_at TIMESTAMPTZ,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ops_verified', 'approved', 'paid', 'confirmed', 'rejected')),
  rejection_reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fund_releases_project ON public.fund_releases(project_id, milestone_number);
CREATE INDEX IF NOT EXISTS idx_fund_releases_financier ON public.fund_releases(financier_id, status);

-- RLS
ALTER TABLE public.fund_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financiers can view fund releases"
  ON public.fund_releases FOR SELECT
  USING (
    financier_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('backend_ops', 'master', 'installer')
  );

CREATE POLICY "Ops can create fund release requests"
  ON public.fund_releases FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('backend_ops', 'master')
  );

CREATE POLICY "Financiers and ops can update fund releases"
  ON public.fund_releases FOR UPDATE
  USING (
    financier_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('backend_ops', 'master')
  );

-- Enable realtime for fund releases
ALTER PUBLICATION supabase_realtime ADD TABLE public.fund_releases;


-- ─── Role Hierarchy Table ──────────────────────────────────────────────
-- Supports Manager, Divisional, Regional, VP sub-roles

CREATE TABLE IF NOT EXISTS public.role_hierarchy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  base_role TEXT NOT NULL,                -- sales_rep, backend_ops, installer, financier
  sub_role TEXT DEFAULT 'standard' CHECK (sub_role IN ('standard', 'manager', 'divisional', 'regional', 'vp')),
  can_view_ops BOOLEAN DEFAULT false,     -- Regional+ can toggle ops view
  can_push_notifications BOOLEAN DEFAULT false,  -- Regional+ can push to other portals
  can_add_notes BOOLEAN DEFAULT false,    -- Regional+ can add cross-portal notes
  reports_to UUID REFERENCES auth.users(id),
  region TEXT,
  division TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_hierarchy_user ON public.role_hierarchy(user_id);
CREATE INDEX IF NOT EXISTS idx_role_hierarchy_reports ON public.role_hierarchy(reports_to);

ALTER TABLE public.role_hierarchy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hierarchy"
  ON public.role_hierarchy FOR SELECT
  USING (
    user_id = auth.uid()
    OR reports_to = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master', 'backend_ops')
  );

CREATE POLICY "Master can manage role hierarchy"
  ON public.role_hierarchy FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'master'
  );


-- ─── Update trigger for updated_at ─────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_install_tracking_updated_at
  BEFORE UPDATE ON public.install_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fund_releases_updated_at
  BEFORE UPDATE ON public.fund_releases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
