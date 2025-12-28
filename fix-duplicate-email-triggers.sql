-- Fix duplicate email triggers on daily_logs table
-- Issue: Two triggers exist which may conflict with each other
-- Solution: Keep only the latest trigger (daily_log_email_trigger with trigger_daily_prep_email)

BEGIN;

-- Drop the older trigger and its function
DROP TRIGGER IF EXISTS send_daily_email_trigger ON daily_logs;
DROP FUNCTION IF EXISTS trigger_daily_email();

-- Ensure the correct trigger exists (from create_daily_email_trigger.sql)
-- This should already exist, but we'll recreate it to be safe

-- Enable pg_net extension if not already enabled (required for async HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Recreate the correct trigger function
CREATE OR REPLACE FUNCTION trigger_daily_prep_email()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  payload JSON;
  response extensions.http_response;
BEGIN
  -- Construct the Edge Function URL
  function_url := 'https://eeqiifpbpurvidvhpanu.supabase.co/functions/v1/send-daily-prep-email';
  
  -- Build the payload
  payload := json_build_object(
    'log_id', NEW.id,
    'user_id', NEW.user_id
  );
  
  -- Call the Edge Function asynchronously using pg_net
  PERFORM net.http_post(
    url := function_url,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    )::jsonb,
    body := payload::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS daily_log_email_trigger ON daily_logs;

CREATE TRIGGER daily_log_email_trigger
  AFTER INSERT ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_daily_prep_email();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION trigger_daily_prep_email() TO postgres, anon, authenticated, service_role;

COMMIT;

-- Verify only one email trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'daily_logs'
  AND trigger_name LIKE '%email%';
