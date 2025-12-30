-- Create email trigger for daily logs
-- This trigger calls the Edge Function to send standup prep emails

BEGIN;

-- Create the trigger function
CREATE OR REPLACE FUNCTION trigger_daily_email()
RETURNS TRIGGER AS $$
DECLARE
  service_role_key TEXT;
BEGIN
  -- Get service role key from vault (you'll need to set this)
  -- For now, we'll use pg_net extension to call the edge function
  
  PERFORM net.http_post(
    url := 'https://eeqiifpbpurvidvhpanu.supabase.co/functions/v1/send-daily-prep-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SUPABASE_ANON_KEY'
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'log_id', NEW.id,
      'date', NEW.date,
      'tasks_completed', NEW.tasks_completed,
      'blockers', NEW.blockers
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS send_daily_email_trigger ON daily_logs;

CREATE TRIGGER send_daily_email_trigger
AFTER INSERT ON daily_logs
FOR EACH ROW
EXECUTE FUNCTION trigger_daily_email();

COMMIT;

-- Verify trigger was created
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'daily_logs'
  AND trigger_name = 'send_daily_email_trigger';
