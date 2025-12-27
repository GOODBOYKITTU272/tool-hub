-- Check notification table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current notification read status
SELECT id, title, read, is_read, created_at
FROM notifications
WHERE user_id = (SELECT id FROM users WHERE role = 'Admin' LIMIT 1)
ORDER BY created_at DESC
LIMIT 5;
