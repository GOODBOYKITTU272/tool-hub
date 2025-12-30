-- Fix RLS policies for audit_logs table
-- Allow Admins to read all audit logs

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can read all audit logs" ON public.audit_logs;

-- Create policy for Admin read access
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

-- Verify the policy was created
SELECT policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename = 'audit_logs';
