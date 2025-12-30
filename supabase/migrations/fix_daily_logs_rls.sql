-- Fix RLS policies for daily_logs table
-- Allow users to read their own logs and admins to read all logs

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate
DROP POLICY IF EXISTS "Users can view own daily logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can insert own daily logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can update own daily logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Admins can view all daily logs" ON public.daily_logs;

-- Users can view their own logs
CREATE POLICY "Users can view own daily logs"
ON public.daily_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own logs
CREATE POLICY "Users can insert own daily logs"
ON public.daily_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own logs
CREATE POLICY "Users can update own daily logs"
ON public.daily_logs
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can view all logs
CREATE POLICY "Admins can view all daily logs"
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

-- Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'daily_logs';
