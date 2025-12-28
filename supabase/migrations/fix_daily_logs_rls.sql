-- Fix RLS policies for daily_logs table
-- This allows users to insert, update, and view their own logs

BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON daily_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON daily_logs;

-- Enable RLS
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own logs
CREATE POLICY "Users can view own logs"
ON daily_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert own logs"
ON daily_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own logs
CREATE POLICY "Users can update own logs"
ON daily_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own logs
CREATE POLICY "Users can delete own logs"
ON daily_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Admins and Owners can view all logs
CREATE POLICY "Admins can view all logs"
ON daily_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

COMMIT;

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'daily_logs'
ORDER BY policyname;
