
-- =============================================
-- 1. Add missing columns to projects
-- =============================================
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'draft';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS qc_status text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS qc_dirty_notes text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS qc_reviewed_by uuid;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS qc_reviewed_at timestamptz;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS welcome_call_recording_url text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS welcome_call_flags jsonb DEFAULT '[]';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS welcome_call_completed_at timestamptz;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS annual_consumption numeric;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS offset_percent numeric;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS system_price numeric;

-- =============================================
-- 2. Add missing column to fund_releases
-- =============================================
ALTER TABLE public.fund_releases ADD COLUMN IF NOT EXISTS source text DEFAULT 'financier';

-- =============================================
-- 3. Add milestone text label to milestone_states
-- =============================================
ALTER TABLE public.milestone_states ADD COLUMN IF NOT EXISTS milestone text;

-- Add unique constraint on project_id + milestone (only if milestone is populated)
CREATE UNIQUE INDEX IF NOT EXISTS idx_milestone_states_project_milestone 
  ON public.milestone_states (project_id, milestone) 
  WHERE milestone IS NOT NULL;

-- =============================================
-- 4. Create site_surveys table
-- =============================================
CREATE TABLE IF NOT EXISTS public.site_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section text NOT NULL,
  file_url text NOT NULL,
  file_name text,
  file_type text,
  uploaded_by uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales reps can upload site surveys"
  ON public.site_surveys FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = site_surveys.project_id
      AND (
        has_role(auth.uid(), 'master'::app_role)
        OR has_role(auth.uid(), 'sales_rep'::app_role)
        OR projects.sales_rep_id = auth.uid()
      )
    )
  );

CREATE POLICY "View site surveys based on project access"
  ON public.site_surveys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = site_surveys.project_id
      AND (
        has_role(auth.uid(), 'master'::app_role)
        OR has_role(auth.uid(), 'backend_ops'::app_role)
        OR projects.sales_rep_id = auth.uid()
        OR projects.installer_org_id IN (
          SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()
        )
        OR projects.financier_org_id IN (
          SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()
        )
      )
    )
  );

-- =============================================
-- 5. Create aurora_imports table
-- =============================================
CREATE TABLE IF NOT EXISTS public.aurora_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aurora_project_id text UNIQUE NOT NULL,
  asp_project_id uuid REFERENCES public.projects(id),
  asp_project_code text,
  raw_data jsonb,
  imported_at timestamptz DEFAULT now()
);

ALTER TABLE public.aurora_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master and ops can view aurora imports"
  ON public.aurora_imports FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'master'::app_role)
    OR has_role(auth.uid(), 'backend_ops'::app_role)
  );

CREATE POLICY "Master and ops can manage aurora imports"
  ON public.aurora_imports FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'master'::app_role)
    OR has_role(auth.uid(), 'backend_ops'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'master'::app_role)
    OR has_role(auth.uid(), 'backend_ops'::app_role)
  );

-- =============================================
-- 6. Enable realtime on key tables
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_surveys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.aurora_imports;

-- Add realtime for tables not yet in realtime publication (safe to re-add, will no-op if already there)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.milestone_states;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.financier_updates;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fund_releases;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
