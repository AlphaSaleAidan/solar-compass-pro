-- Council AI agent interaction logs
CREATE TABLE IF NOT EXISTS council_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_id text NOT NULL,
  message text NOT NULL,
  response text,
  tokens_used integer DEFAULT 0,
  model text DEFAULT 'claude-haiku-4-5-20251001',
  latency_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Daily usage counter per user
CREATE TABLE IF NOT EXISTS council_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  call_count integer DEFAULT 0,
  UNIQUE(user_id, date)
);

-- RLS
ALTER TABLE council_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own council logs"
  ON council_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own council logs"
  ON council_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own usage"
  ON council_usage FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users upsert own usage"
  ON council_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own usage"
  ON council_usage FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_council_logs_user ON council_logs(user_id, created_at);
CREATE INDEX idx_council_usage_lookup ON council_usage(user_id, date);
