-- COMPLETE FIX for Daily Log Email Trigger
-- Run this in Supabase SQL Editor to fix permission issues

BEGIN;

-- ========================================
-- STEP 1: Fix pg_net Extension Permissions
-- ========================================
-- The Edge Function uses pg_net to make HTTP calls
-- Grant necessary permissions

GRANT USAGE ON SCHEMA net TO service_role;
GRANT USAGE ON SCHEMA net TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA net TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA net TO service_role;

-- ========================================
-- STEP 2: Fix RLS Policies on daily_logs
-- ========================================
-- The trigger function needs to read from daily_logs table
-- Service role should bypass RLS, but let's be explicit

-- Option A: Disable RLS entirely (recommended for trigger functions)
ALTER TABLE daily_logs DISABLE ROW LEVEL SECURITY;

-- Option B: If RLS must stay enabled, create permissive policy for service_role
-- (Uncomment if you want to keep RLS enabled)
/*
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON daily_logs;
CREATE POLICY "Service role full access"
ON daily_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
*/

-- ========================================
-- STEP 3: Recreate the Trigger Function
-- ========================================
-- Ensure trigger function has proper security definer

DROP FUNCTION IF EXISTS trigger_daily_email() CASCADE;

CREATE OR REPLACE FUNCTION trigger_daily_email()
RETURNS TRIGGER 
SECURITY DEFINER  -- Run with permissions of function creator
SET search_path = public, pg_temp
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Make async HTTP request to Edge Function
  SELECT INTO request_id net.http_post(
    url := 'https://eeqiifpbpurvidvhpanu.supabase.co/functions/v1/send-daily-prep-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcWlpZnBicHVydmlkdmhwYW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDk1MzEsImV4cCI6MjA4MTEyNTUzMX0.sVPVUg5oS1BqGbViD0gBpN_pGAxAkqdvGqifbnRXtN8'
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id::text,
      'log_id', NEW.id::text,
      'date', NEW.date,
      'tasks_completed', NEW.tasks_completed,
      'blockers', COALESCE(NEW.blockers, '')
    )
  );
  
  -- Log the request (optional, for debugging)
  RAISE NOTICE 'Email trigger fired for log_id: %, request_id: %', NEW.id, request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the insert if email fails
    RAISE WARNING 'Email trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION trigger_daily_email() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_daily_email() TO service_role;

-- ========================================
-- STEP 4: Recreate the Trigger
-- ========================================

DROP TRIGGER IF EXISTS send_daily_email_trigger ON daily_logs;

CREATE TRIGGER send_daily_email_trigger
AFTER INSERT ON daily_logs
FOR EACH ROW
EXECUTE FUNCTION trigger_daily_email();

COMMIT;

-- ========================================
-- VERIFICATION
-- ========================================

-- Check trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'daily_logs'
    AND trigger_name = 'send_daily_email_trigger';

-- Check function exists
SELECT 
    proname,
    prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'trigger_daily_email';

-- Check RLS status
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '⚠️ RLS ENABLED'
        ELSE '✅ RLS DISABLED'
    END as status
FROM pg_tables
WHERE tablename = 'daily_logs';

-- Check policies (if RLS is enabled)
SELECT 
    policyname,
    cmd,
    roles::text[]
FROM pg_policies
WHERE tablename = 'daily_logs';
