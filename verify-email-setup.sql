-- Verify email setup is correct

-- 1. Check Admin exists (ramakrishna)
SELECT id, email, name, role, must_change_password
FROM public.users
WHERE role = 'Admin';

-- 2. Check recent tool submissions
SELECT 
    t.id, 
    t.name, 
    t.approval_status,
    t.created_at,
    u.name as owner_name,
    u.email as owner_email
FROM tools t
JOIN users u ON t.created_by = u.id
ORDER BY t.created_at DESC
LIMIT 5;

-- 3. Check if notifications are being created
SELECT * FROM notifications
ORDER BY created_at DESC
LIMIT 10;
