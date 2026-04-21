-- ═══════════════════════════════════════════════════════════════
-- ASP Storage Buckets — Complete Data Category Setup
-- ═══════════════════════════════════════════════════════════════
-- Existing: site-surveys, milestone-docs, welcome-calls, avatars
-- New: contracts, installer-uploads, financier-docs, message-attachments, aurora-exports

-- New buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('installer-uploads', 'installer-uploads', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('financier-docs', 'financier-docs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('aurora-exports', 'aurora-exports', false) ON CONFLICT DO NOTHING;

-- Storage policies for contracts
CREATE POLICY "Auth upload contracts" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contracts');
CREATE POLICY "Auth read contracts" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'contracts');

-- Storage policies for installer-uploads
CREATE POLICY "Auth upload installer-uploads" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'installer-uploads');
CREATE POLICY "Auth read installer-uploads" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'installer-uploads');

-- Storage policies for financier-docs
CREATE POLICY "Auth upload financier-docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'financier-docs');
CREATE POLICY "Auth read financier-docs" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'financier-docs');

-- Storage policies for message-attachments
CREATE POLICY "Auth upload message-attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'message-attachments');
CREATE POLICY "Auth read message-attachments" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'message-attachments');

-- Storage policies for aurora-exports
CREATE POLICY "Auth upload aurora-exports" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'aurora-exports');
CREATE POLICY "Auth read aurora-exports" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'aurora-exports');

-- ═══════════════════════════════════════════════════════════════
-- Add aurora_imports table for tracking ingest history
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.aurora_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aurora_project_id text NOT NULL UNIQUE,
  asp_project_id uuid REFERENCES public.projects(id),
  asp_project_code text,
  raw_data jsonb,
  imported_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.aurora_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backend ops can view aurora imports" ON public.aurora_imports
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'backend_ops'));

-- ═══════════════════════════════════════════════════════════════
-- Add fund_releases table (if not exists)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.fund_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  milestone_index integer NOT NULL,
  amount numeric DEFAULT 0,
  percent numeric DEFAULT 0,
  status text DEFAULT 'requested',  -- requested | approved | released | denied
  requested_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  payment_reference text,
  approved_by uuid REFERENCES auth.users(id),
  notes text
);

ALTER TABLE public.fund_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View fund releases by role" ON public.fund_releases
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = fund_releases.project_id
    AND (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'backend_ops') OR has_role(auth.uid(), 'financier')
      OR projects.sales_rep_id = auth.uid())
  ));

CREATE POLICY "Manage fund releases" ON public.fund_releases
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'backend_ops') OR has_role(auth.uid(), 'financier'));
