-- ============================================
-- COMPLETE EMAIL SYSTEM VERIFICATION
-- ============================================

-- 1. Check pg_net extension is enabled
SELECT 
    'pg_net Extension' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') 
        THEN '✅ ENABLED (v' || extversion || ')'
        ELSE '❌ NOT ENABLED'
    END as status
FROM pg_extension WHERE extname = 'pg_net'
UNION ALL

-- 2. Check email trigger exists
SELECT 
    'Email Trigger' as check_name,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ EXISTS (1 trigger)'
        WHEN COUNT(*) > 1 THEN '⚠️ WARNING: ' || COUNT(*)::text || ' triggers found'
        ELSE '❌ NOT FOUND'
    END as status
FROM information_schema.triggers
WHERE event_object_table = 'daily_logs' 
  AND trigger_name LIKE '%email%'
UNION ALL

-- 3. Check trigger function exists
SELECT 
    'Trigger Function' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_daily_prep_email')
        THEN '✅ EXISTS'
        ELSE '❌ NOT FOUND'
    END as status
UNION ALL

-- 4. Check recent daily logs
SELECT 
    'Recent Daily Logs' as check_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::text || ' logs in last 24h'
        ELSE '⚠️ No logs in last 24 hours'
    END as status
FROM daily_logs
WHERE created_at > NOW() - INTERVAL '24 hours';

-- ============================================
-- DETAILED TRIGGER INFO
-- ============================================
SELECT 
    '--- TRIGGER DETAILS ---' as info,
    '' as details
UNION ALL
SELECT 
    'Trigger Name' as info,
    trigger_name as details
FROM information_schema.triggers
WHERE event_object_table = 'daily_logs' 
  AND trigger_name LIKE '%email%'
UNION ALL
SELECT 
    'Function Called' as info,
    action_statement as details
FROM information_schema.triggers
WHERE event_object_table = 'daily_logs' 
  AND trigger_name LIKE '%email%';

-- ============================================
-- RECENT LOGS (for testing)
-- ============================================
SELECT 
    '--- MOST RECENT LOG ---' as section,
    '' as details
UNION ALL
SELECT 
    'Log ID' as section,
    id::text as details
FROM daily_logs
ORDER BY created_at DESC
LIMIT 1
UNION ALL
SELECT 
    'User Email' as section,
    (SELECT email FROM users WHERE users.id = daily_logs.user_id) as details
FROM daily_logs
ORDER BY created_at DESC
LIMIT 1
UNION ALL
SELECT 
    'Created At' as section,
    created_at::text as details
FROM daily_logs
ORDER BY created_at DESC
LIMIT 1;
