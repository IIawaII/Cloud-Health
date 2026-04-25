-- @generated-by security-rules
-- Verification codes table for atomic one-time consumption

CREATE TABLE IF NOT EXISTS verification_codes (
  purpose TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (purpose, email)
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at
  ON verification_codes(expires_at);
