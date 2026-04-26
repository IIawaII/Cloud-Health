-- Insert default system configs
INSERT INTO system_configs (key, value, updated_at) VALUES
  ('site_name', 'Cloud Health', datetime('now')),
  ('welcome_message', '欢迎使用健康管理平台', datetime('now')),
  ('max_requests_per_day', '50', datetime('now')),
  ('maintenance_mode', 'false', datetime('now')),
  ('enable_registration', 'true', datetime('now'))
ON CONFLICT(key) DO NOTHING;
