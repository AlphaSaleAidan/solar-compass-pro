
ALTER TABLE public.sell_projects ADD COLUMN IF NOT EXISTS qc_initial_approved boolean DEFAULT false;
ALTER TABLE public.sell_projects ADD COLUMN IF NOT EXISTS documents_signed boolean DEFAULT false;
