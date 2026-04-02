
CREATE TABLE public.project_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  actor_id uuid,
  actor_name text NOT NULL,
  actor_role text NOT NULL,
  action_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  portal text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fk_activity_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

ALTER TABLE public.project_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View activity based on project access"
ON public.project_activity_log FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.projects p WHERE p.id = project_activity_log.project_id
  AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role)
    OR p.sales_rep_id = auth.uid() OR p.setter_id = auth.uid()
    OR p.installer_org_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
    OR p.financier_org_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid()))
));

CREATE POLICY "Authenticated users can log activity"
ON public.project_activity_log FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects p WHERE p.id = project_activity_log.project_id
  AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role)
    OR p.sales_rep_id = auth.uid() OR p.setter_id = auth.uid()
    OR p.installer_org_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
    OR p.financier_org_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid()))
));

CREATE INDEX idx_activity_log_project ON public.project_activity_log(project_id);
CREATE INDEX idx_activity_log_created ON public.project_activity_log(created_at DESC);
