
-- Projects delete policy
CREATE POLICY "Authorized users can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role)
  OR has_role(auth.uid(), 'backend_ops'::app_role)
  OR (sales_rep_id = auth.uid())
  OR (installer_org_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()))
  OR (financier_org_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()))
);

-- Sell projects delete policy
CREATE POLICY "Authorized users can delete sell projects"
ON public.sell_projects
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role)
  OR has_role(auth.uid(), 'backend_ops'::app_role)
  OR (created_by = auth.uid())
);

-- Delete policies for related tables
CREATE POLICY "Delete milestone states with project"
ON public.milestone_states
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = milestone_states.project_id
    AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role) OR projects.sales_rep_id = auth.uid())
  )
);

CREATE POLICY "Delete project milestones with project"
ON public.project_milestones
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_milestones.project_id
    AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role) OR projects.sales_rep_id = auth.uid())
  )
);

CREATE POLICY "Delete project messages with project"
ON public.project_messages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_messages.project_id
    AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role) OR projects.sales_rep_id = auth.uid())
  )
);

CREATE POLICY "Delete project documents with project"
ON public.project_documents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_documents.project_id
    AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role) OR projects.sales_rep_id = auth.uid())
  )
);

CREATE POLICY "Delete checklist items with project"
ON public.project_checklist_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_checklist_items.project_id
    AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role) OR projects.sales_rep_id = auth.uid())
  )
);

CREATE POLICY "Delete activity log with project"
ON public.project_activity_log
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_activity_log.project_id
    AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role) OR p.sales_rep_id = auth.uid())
  )
);

CREATE POLICY "Delete financier updates with project"
ON public.financier_updates
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = financier_updates.project_id
    AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role))
  )
);

CREATE POLICY "Delete site surveys with project"
ON public.site_surveys
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = site_surveys.project_id
    AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role) OR projects.sales_rep_id = auth.uid())
  )
);

CREATE POLICY "Delete fund releases with project"
ON public.fund_releases
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = fund_releases.project_id
    AND (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'backend_ops'::app_role))
  )
);
