-- Create scheduled job for weekly summary emails
-- This job runs every Friday at 2 PM IST (8:30 AM UTC) to send weekly summary emails

-- First, ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http; -- for http extension
CREATE EXTENSION IF NOT EXISTS pg_net; -- for net.http_post

-- Create function to trigger weekly email sending
CREATE OR REPLACE FUNCTION trigger_weekly_summary_email()
RETURNS void AS $$
DECLARE
    function_url TEXT;
    request_id bigint;
BEGIN
    -- Construct the Edge Function URL
    function_url := 'https://eeqiifpbpurvidvhpanu.supabase.co/functions/v1/send-weekly-summary-email';
    
    -- Make async HTTP request to the Edge Function using pg_net
    SELECT INTO request_id net.http_post(
        url := function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer YOUR_SUPABASE_ANON_KEY'
        ),
        body := '{}'::jsonb
    );
    
    RAISE NOTICE 'Weekly summary email job triggered with request ID: %', request_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error triggering weekly summary email: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the job to run every Friday at 8:30 AM UTC (2:00 PM IST)
-- This assumes the server time is UTC; adjust if needed
SELECT cron.schedule(
    'weekly-summary-emails',      -- job name
    '30 8 * * 5',                -- cron schedule: 8:30 AM on Fridays
    $$SELECT trigger_weekly_summary_email();$$  -- SQL to execute
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION trigger_weekly_summary_email() TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION cron.schedule TO service_role;

-- Verify the job was scheduled
SELECT jobid, schedule, command, active 
FROM cron.job 
WHERE command LIKE '%trigger_weekly_summary_email%';