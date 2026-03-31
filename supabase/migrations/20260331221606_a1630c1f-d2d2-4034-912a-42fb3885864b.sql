
INSERT INTO storage.buckets (id, name, public) VALUES ('site-surveys', 'site-surveys', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('milestone-docs', 'milestone-docs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('welcome-calls', 'welcome-calls', false) ON CONFLICT DO NOTHING;

-- Storage policies for site-surveys
CREATE POLICY "Authenticated users can upload site surveys" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-surveys');
CREATE POLICY "Users can view site survey files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'site-surveys');

-- Storage policies for milestone-docs
CREATE POLICY "Authenticated users can upload milestone docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'milestone-docs');
CREATE POLICY "Users can view milestone doc files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'milestone-docs');

-- Storage policies for welcome-calls
CREATE POLICY "Authenticated users can upload welcome calls" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'welcome-calls');
CREATE POLICY "Users can view welcome call files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'welcome-calls');
