-- Database trigger to automatically send daily prep email after log submission

-- First, enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create function to trigger email sending
CREATE OR REPLACE FUNCTION trigger_daily_prep_email()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  payload JSON;
  response extensions.http_response;
BEGIN
  -- Construct the Edge Function URL
  -- Replace 'your-project-ref' with your actual Supabase project reference
  function_url := 'https://eeqiifpbpurvidvhpanu.supabase.co/functions/v1/send-daily-prep-email';
  
  -- Build the payload
  payload := json_build_object(
    'log_id', NEW.id,
    'user_id', NEW.user_id
  );
  
  -- Call the Edge Function asynchronously
  -- Note: This uses pg_net for async HTTP requests
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

-- Create trigger on daily_logs table
DROP TRIGGER IF EXISTS daily_log_email_trigger ON daily_logs;

CREATE TRIGGER daily_log_email_trigger
  AFTER INSERT ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_daily_prep_email();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION trigger_daily_prep_email() TO postgres, anon, authenticated, service_role;

COMMENT ON TRIGGER daily_log_email_trigger ON daily_logs IS 
'Automatically sends daily standup prep email via Edge Function when a new log is created';
