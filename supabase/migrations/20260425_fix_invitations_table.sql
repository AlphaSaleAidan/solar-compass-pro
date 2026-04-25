-- ═══════════════════════════════════════════════════════════════
-- Fix: Ensure invitations & registration_requests tables exist
-- with all required columns and proper RLS policies
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. INVITATIONS TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'sales_rep',
  token text NOT NULL DEFAULT gen_random_uuid()::text,
  invited_by uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

-- If the table already exists but is missing the 'token' column, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invitations'
      AND column_name = 'token'
  ) THEN
    ALTER TABLE public.invitations ADD COLUMN token text NOT NULL DEFAULT gen_random_uuid()::text;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Master and ops can view invitations" ON public.invitations;
DROP POLICY IF EXISTS "Master and ops can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Master and ops can update invitations" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can validate invite token" ON public.invitations;

CREATE POLICY "Master and ops can view invitations"
ON public.invitations FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role)
  OR has_role(auth.uid(), 'backend_ops'::app_role)
);

CREATE POLICY "Master and ops can create invitations"
ON public.invitations FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role)
  OR has_role(auth.uid(), 'backend_ops'::app_role)
);

CREATE POLICY "Master and ops can update invitations"
ON public.invitations FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role)
  OR has_role(auth.uid(), 'backend_ops'::app_role)
);

-- Allow unauthenticated users (during registration) to read invitations by token
DROP POLICY IF EXISTS "Anyone can read invitations by token" ON public.invitations;
CREATE POLICY "Anyone can read invitations by token"
ON public.invitations FOR SELECT TO anon
USING (true);

-- Allow anonymous update (for marking accepted_at during registration)
DROP POLICY IF EXISTS "Anon can mark invitation accepted" ON public.invitations;
CREATE POLICY "Anon can mark invitation accepted"
ON public.invitations FOR UPDATE TO anon
USING (true)
WITH CHECK (true);


-- ─── 2. REGISTRATION_REQUESTS TABLE ────────────────────────────
CREATE TABLE IF NOT EXISTS public.registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  entity_name text,
  requested_role app_role NOT NULL DEFAULT 'sales_rep',
  notes text,
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Master and ops can view requests" ON public.registration_requests;
DROP POLICY IF EXISTS "Master and ops can update requests" ON public.registration_requests;
DROP POLICY IF EXISTS "Anyone can submit registration request" ON public.registration_requests;

CREATE POLICY "Master and ops can view requests"
ON public.registration_requests FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role)
  OR has_role(auth.uid(), 'backend_ops'::app_role)
);

CREATE POLICY "Master and ops can update requests"
ON public.registration_requests FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role)
  OR has_role(auth.uid(), 'backend_ops'::app_role)
);

-- Anyone (including unauthenticated) can submit a registration request
CREATE POLICY "Anyone can submit registration request"
ON public.registration_requests FOR INSERT TO anon, authenticated
WITH CHECK (true);


-- ─── 3. REFRESH SCHEMA CACHE ───────────────────────────────────
-- PostgREST schema cache is refreshed automatically via NOTIFY,
-- but we explicitly signal it here to be safe.
NOTIFY pgrst, 'reload schema';
