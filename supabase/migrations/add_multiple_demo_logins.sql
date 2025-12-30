-- Add demo_logins column to tools table
ALTER TABLE tools ADD COLUMN IF NOT EXISTS demo_logins jsonb DEFAULT '[]'::jsonb;

-- Comment to explain the purpose (KT)
COMMENT ON COLUMN tools.demo_logins IS 'Stores multiple demo login roles for the tool. Structure: [{role_name, username, password, description}]';
