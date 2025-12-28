-- Check if RLS is actually disabled on daily_logs
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '❌ RLS IS ENABLED - This is the problem!'
        ELSE '✅ RLS is disabled'
    END as status
FROM pg_tables 
WHERE tablename = 'daily_logs';

-- If RLS is enabled, we need to disable it OR grant proper policies
-- The migration disable_daily_logs_rls.sql should have disabled it, but let's verify

-- Also check what RLS policies exist (if any)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'daily_logs';
