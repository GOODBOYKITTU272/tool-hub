-- Manual trigger test: Send email for a specific log
-- Use this to manually trigger email for the Dec 17 log

DO $$
DECLARE
  log_record RECORD;
  request_id bigint;
BEGIN
  -- Get the Dec 17 log
  SELECT * INTO log_record
  FROM daily_logs
  WHERE date = '2025-12-17'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No log found for 2025-12-17';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found log ID: % for user: %', log_record.id, log_record.user_id;
  
  -- Manually trigger the email
  SELECT INTO request_id net.http_post(
    url := 'https://eeqiifpbpurvidvhpanu.supabase.co/functions/v1/send-daily-prep-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcWlpZnBicHVydmlkdmhwYW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDk1MzEsImV4cCI6MjA4MTEyNTUzMX0.sVPVUg5oS1BqGbViD0gBpN_pGAxAkqdvGqifbnRXtN8'
    ),
    body := jsonb_build_object(
      'user_id', log_record.user_id::text,
      'log_id', log_record.id::text,
      'date', log_record.date,
      'tasks_completed', log_record.tasks_completed,
      'blockers', COALESCE(log_record.blockers, '')
    )
  );
  
  RAISE NOTICE 'Email request sent! Request ID: %', request_id;
  RAISE NOTICE 'Check the Edge Function logs in a few seconds';
END $$;

-- Check the HTTP request status
SELECT 
    id,
    created,
    status_code,
    error_msg,
    content::text as response
FROM net._http_response
ORDER BY created DESC
LIMIT 5;
