-- SOP Guardian Agent violations and audit trail

CREATE TABLE IF NOT EXISTS sop_violations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text NOT NULL,
  agent_id text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  rule_code text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  context jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'overridden')),
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  override_reason text,
  created_at timestamptz DEFAULT now()
);

-- Agent run log — each time guardians scan, log the run
CREATE TABLE IF NOT EXISTS sop_guardian_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  triggered_by uuid REFERENCES auth.users(id),
  agents_run text[] NOT NULL,
  violations_found integer DEFAULT 0,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE sop_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_guardian_runs ENABLE ROW LEVEL SECURITY;

-- Backend ops and master can see all violations
CREATE POLICY "Ops and master read violations"
  ON sop_violations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('backend_ops', 'master')
  ));

CREATE POLICY "Ops and master update violations"
  ON sop_violations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('backend_ops', 'master')
  ));

-- Server can insert violations (service role bypasses RLS)
CREATE POLICY "Service insert violations"
  ON sop_violations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Ops and master read guardian runs"
  ON sop_guardian_runs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('backend_ops', 'master')
  ));

CREATE POLICY "Service insert guardian runs"
  ON sop_guardian_runs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_sop_violations_project ON sop_violations(project_id, status);
CREATE INDEX idx_sop_violations_agent ON sop_violations(agent_id, severity);
CREATE INDEX idx_sop_violations_open ON sop_violations(status) WHERE status = 'open';
CREATE INDEX idx_sop_guardian_runs_recent ON sop_guardian_runs(created_at DESC);
