
-- Registration requests table
CREATE TABLE public.registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  entity_name text,
  phone text NOT NULL,
  email text NOT NULL,
  requested_role app_role NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a registration request (unauthenticated)
CREATE POLICY "Anyone can submit registration" ON public.registration_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

-- Master users can view all registrations
CREATE POLICY "Master users can view registrations" ON public.registration_requests
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role));

-- Master users can update registrations
CREATE POLICY "Master users can update registrations" ON public.registration_requests
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role));

-- Add bank details columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_routing_number text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS bank_account_type text DEFAULT 'checking';
