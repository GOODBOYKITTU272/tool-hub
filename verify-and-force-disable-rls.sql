-- VERIFICATION: Check if RLS is actually disabled
-- Run this to verify the current state

-- 1. Check RLS status on daily_logs
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '❌ RLS IS ENABLED (this is the problem!)'
        ELSE '✅ RLS IS DISABLED'
    END as status
FROM pg_tables
WHERE tablename = 'daily_logs';

-- 2. Show all policies on daily_logs (if any exist)
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'daily_logs';

-- 3. If RLS is enabled, forcefully disable it now
ALTER TABLE public.daily_logs DISABLE ROW LEVEL SECURITY;

-- 4. Drop ALL policies to be absolutely sure
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'daily_logs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON daily_logs', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- 5. Grant explicit permissions to service_role
GRANT ALL ON TABLE public.daily_logs TO service_role;
GRANT ALL ON TABLE public.tools TO service_role;
GRANT ALL ON TABLE public.users TO service_role;

-- 6. Verify the fix
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '❌ STILL ENABLED - PROBLEM!'
        ELSE '✅ DISABLED - GOOD!'
    END as rls_status
FROM pg_tables
WHERE tablename IN ('daily_logs', 'tools', 'users');
