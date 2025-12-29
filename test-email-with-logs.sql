-- Quick test: Trigger email for Dec 17 log with improved logging
-- After running this, check Edge Function logs in Supabase Dashboard

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
    RAISE NOTICE '❌ No log found for 2025-12-17';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Found log - ID: %, User: %', log_record.id, log_record.user_id;
  
  -- Trigger the email with updated Edge Function
  SELECT INTO request_id net.http_post(
    url := 'https://eeqiifpbpurvidvhpanu.supabase.co/functions/v1/send-daily-prep-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcWlpZnBicHVydmlkdmhwYW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDk1MzEsImV4cCI6MjA4MTEyNTUzMX0.sVPVUg5oS1BqGbViD0gBpN_pGAxAkqdvGqifbnRXtN8'
    ),
    body := jsonb_build_object(
      'user_id', log_record.user_id::text,
      'log_id', log_record.id::text
    )
  );
  
  RAISE NOTICE '📧 Email request sent! Request ID: %', request_id;
  RAISE NOTICE '⏳ Wait 5-10 seconds then check:';
  RAISE NOTICE '   1. Edge Function logs: https://supabase.com/dashboard/project/eeqiifpbpurvidvhpanu/functions/send-daily-prep-email/logs';
   RAISE NOTICE '   2. HTTP responses below';
END $$;

-- Wait a moment, then check the HTTP response
SELECT 
    id,
    created,
    status_code,
    CASE 
        WHEN status_code = 200 THEN '✅ SUCCESS'
        WHEN status_code = 401 THEN '❌ AUTH ERROR'
        WHEN status_code = 500 THEN '❌ SERVER ERROR'
        ELSE '⚠️ UNKNOWN'
    END as status,
    error_msg,
    content::text as response
FROM net._http_response
ORDER BY created DESC
LIMIT 3;
