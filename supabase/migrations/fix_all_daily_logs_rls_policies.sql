-- COMPREHENSIVE FIX: Recreate ALL RLS policies for daily_logs table
-- This fixes all 403 permission errors for SELECT, INSERT, UPDATE, DELETE

BEGIN;

-- ============================================
-- STEP 1: Drop ALL existing policies
-- ============================================
DROP POLICY IF EXISTS "Users can view own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON daily_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON daily_logs;
DROP POLICY IF EXISTS "Authenticated users can insert own logs" ON daily_logs;

-- ============================================
-- STEP 2: Ensure RLS is enabled
-- ============================================
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create new policies with explicit role specification
-- ============================================

-- Policy 1: Users can SELECT (view) their own logs
CREATE POLICY "Users can view own logs"
ON daily_logs 
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Admins and owners can SELECT (view) all logs
CREATE POLICY "Admins and owners can view all logs"
ON daily_logs 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'owner')
  )
);

-- Policy 3: Users can INSERT (create) their own logs
CREATE POLICY "Users can insert own logs"
ON daily_logs 
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can UPDATE (edit) their own logs
CREATE POLICY "Users can update own logs"
ON daily_logs 
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 5: Users can DELETE their own logs
CREATE POLICY "Users can delete own logs"
ON daily_logs 
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

COMMIT;

-- ============================================
-- VERIFICATION: Check all policies are created
-- ============================================
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'daily_logs'
ORDER BY cmd, policyname;
