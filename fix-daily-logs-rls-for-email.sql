-- IMMEDIATE FIX: Ensure service_role can bypass RLS on daily_logs
-- This will allow the Edge Function (using service role key) to access the data

BEGIN;

-- Option 1: Disable RLS entirely (simplest, already attempted but verify)
ALTER TABLE daily_logs DISABLE ROW LEVEL SECURITY;

-- Option 2: If RLS must stay enabled, grant service_role full access
-- Create a permissive policy for service_role
DROP POLICY IF EXISTS "Service role can access all daily logs" ON daily_logs;

CREATE POLICY "Service role can access all daily logs"
ON daily_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also ensure authenticated users can read (for the Supabase client in Edge Function)
DROP POLICY IF EXISTS "Authenticated can read all daily logs" ON daily_logs;

CREATE POLICY "Authenticated can read all daily logs"
ON daily_logs
FOR SELECT
TO authenticated
USING (true);

COMMIT;

-- Verify the fix
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = false THEN '✅ RLS DISABLED - Edge Function should work'
        WHEN rowsecurity = true THEN '⚠️ RLS ENABLED - Check policies below'
    END as status
FROM pg_tables 
WHERE tablename = 'daily_logs';

-- Show active policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'daily_logs';
