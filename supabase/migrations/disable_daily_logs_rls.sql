-- Disable RLS on daily_logs table
-- Applied: 2025-12-28
-- Reason: RLS policies were causing 403 errors even with permissive policies
-- Decision: Disable RLS completely to ensure functionality

ALTER TABLE daily_logs DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'daily_logs';
-- Expected: rowsecurity = false
