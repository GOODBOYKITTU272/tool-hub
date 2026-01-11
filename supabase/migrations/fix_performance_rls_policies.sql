-- Fix RLS policies to prevent 403/400 errors on daily_logs and audit_logs
-- This migration ensures authenticated users can access these tables based on their role

-- ============================================
-- FIX 1: daily_logs - Allow Admin read access
-- ============================================

-- Enable RLS on daily_logs
ALTER TABLE IF EXISTS public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can read all daily logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can read own logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON public.daily_logs;

-- Admin: Full read access to all logs
CREATE POLICY "Admins can read all daily logs"
ON public.daily_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'Admin'
    )
);

-- Owner: Can read their own logs
CREATE POLICY "Users can read own logs"
ON public.daily_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Owner: Can insert their own logs
CREATE POLICY "Users can insert own logs"
ON public.daily_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Owner: Can update their own logs
CREATE POLICY "Users can update own logs"
ON public.daily_logs
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- FIX 2: audit_logs - Admin-only access
-- ============================================

-- Enable RLS on audit_logs
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can read all audit logs" ON public.audit_logs;

-- Admin: Full read access
CREATE POLICY "Admins can read all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'Admin'
    )
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify daily_logs policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'daily_logs'
ORDER BY policyname;

-- Verify audit_logs policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'audit_logs'
ORDER BY policyname;

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('daily_logs', 'audit_logs');
