-- Debug script for daily log email trigger

-- 1. Check if the trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'daily_logs'
    AND trigger_name = 'send_daily_email_trigger';

-- 2. Check if the trigger function exists
SELECT 
    proname as function_name,
    prosecdef as security_definer
FROM pg_proc
WHERE proname = 'trigger_daily_email';

-- 3. Check pg_net extension (required for http_post)
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 4. Grant necessary permissions to service role for pg_net
GRANT USAGE ON SCHEMA net TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA net TO service_role;

-- 5. Check recent daily logs that should have triggered emails
SELECT 
    id,
    user_id,
    date,
    tasks_completed,
    created_at
FROM daily_logs
WHERE date >= '2025-12-17'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check if pg_net has any logs/requests
SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;
