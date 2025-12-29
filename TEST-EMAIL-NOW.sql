-- FINAL TEST: Email should work now with formatted content!
-- No AI needed - uses simple formatted version

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
  RAISE NOTICE '📧 Triggering email (using formatted content, no AI needed)';
  
  -- Trigger email
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
  
  RAISE NOTICE '✅ Request sent! ID: %', request_id;
END $$;

-- Check result - should show 200 SUCCESS!
SELECT 
    id,
    created,
    status_code,
    CASE 
        WHEN status_code = 200 THEN '🎉 SUCCESS! Email sent!'
        WHEN status_code = 401 THEN '❌ AUTH ERROR'
        WHEN status_code = 500 THEN '❌ SERVER ERROR'
        ELSE '⚠️ UNKNOWN: ' || status_code::text
    END as status,
    error_msg,
    CASE 
        WHEN status_code = 200 THEN '✅ Check your email inbox! Should arrive in 1-2 minutes.'
        ELSE content::text
    END as details
FROM net._http_response
ORDER BY created DESC
LIMIT 1;
