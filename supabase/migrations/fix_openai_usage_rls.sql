-- Clean up all potential existing policies to ensure a fresh, conflict-free state
DROP POLICY IF EXISTS "admins_view_usage" ON openai_usage;
DROP POLICY IF EXISTS "service_insert_usage" ON openai_usage;
DROP POLICY IF EXISTS "service_full_access" ON openai_usage;
DROP POLICY IF EXISTS "users_view_own_usage" ON openai_usage;

-- Ensure RLS is enabled
ALTER TABLE openai_usage ENABLE ROW LEVEL SECURITY;

-- 1. Admins should be able to view all usage data
CREATE POLICY "admins_view_usage"
  ON openai_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'Admin'
    )
  );

-- 2. Service role has full access (used by Edge Functions)
CREATE POLICY "service_full_access"
  ON openai_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Users can view their own usage data
CREATE POLICY "users_view_own_usage"
  ON openai_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Explicitly grant permissions to the roles
GRANT ALL ON openai_usage TO authenticated;
GRANT ALL ON openai_usage TO service_role;
