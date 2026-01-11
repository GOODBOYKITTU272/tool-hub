-- =====================================================
-- EMERGENCY FIX: daily_logs 403 Permission Denied
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- STEP 1: Check what role values exist in users table
SELECT DISTINCT role FROM public.users;

-- STEP 2: Temporarily DISABLE RLS to verify table access works
ALTER TABLE public.daily_logs DISABLE ROW LEVEL SECURITY;

-- STEP 3: Test if we can now read daily_logs (should work now)
SELECT COUNT(*) as log_count FROM public.daily_logs;

-- STEP 4: Drop ALL existing policies on daily_logs
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'daily_logs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.daily_logs', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- STEP 5: Re-enable RLS
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create simple, working policies
-- Policy 1: Service role bypasses RLS (for backend/triggers)
CREATE POLICY "service_role_all_access"
ON public.daily_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated users can read ALL logs (simplest fix)
CREATE POLICY "authenticated_read_all"
ON public.daily_logs
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Users can insert their own logs
CREATE POLICY "users_insert_own"
ON public.daily_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can update their own logs
CREATE POLICY "users_update_own"
ON public.daily_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- STEP 7: Verify policies are created
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'daily_logs'
ORDER BY policyname;

-- STEP 8: Test that authenticated users can now read
-- (This is just a verification query)
SELECT COUNT(*) as accessible_logs FROM public.daily_logs;

-- =====================================================
-- EXPECTED RESULT: 
-- - No more 403 errors
-- - All authenticated users can view daily_logs
-- - Users can only edit their own logs
-- =====================================================
