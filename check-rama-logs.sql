-- Query to check recent daily logs and Rama Krishna's entries
SELECT 
    dl.id,
    dl.date,
    dl.created_at,
    u.name as user_name,
    u.email as user_email,
    t.name as tool_name,
    dl.work_type,
    dl.tasks_completed
FROM daily_logs dl
JOIN users u ON dl.user_id = u.id
LEFT JOIN tools t ON dl.tool_id = t.id
WHERE u.name ILIKE '%rama%' OR u.name ILIKE '%krishna%'
ORDER BY dl.created_at DESC
LIMIT 5;

-- Query to check what triggers exist on daily_logs table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'daily_logs';
