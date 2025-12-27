-- Check if notifications are being created in database
SELECT 
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.message,
    n.read,
    n.created_at,
    u.email as user_email,
    u.name as user_name
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE u.role = 'Admin'
ORDER BY n.created_at DESC
LIMIT 10;
