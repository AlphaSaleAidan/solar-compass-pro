
-- Add setter assignment columns to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS setter_id uuid,
  ADD COLUMN IF NOT EXISTS setter_split_percent numeric DEFAULT 0;

-- Update the SELECT RLS policy to include setter_id access
DROP POLICY IF EXISTS "View projects based on role" ON public.projects;

CREATE POLICY "View projects based on role"
ON public.projects
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role)
  OR has_role(auth.uid(), 'backend_ops'::app_role)
  OR (sales_rep_id = auth.uid())
  OR (setter_id = auth.uid())
  OR (installer_org_id IN (
    SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()
  ))
  OR (financier_org_id IN (
    SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()
  ))
);
