-- Add role index for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
