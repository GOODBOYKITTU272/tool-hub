-- Fix must_change_password for ALL Applywizz users
-- All users created with scripts should have must_change_password = false
-- since they all use password Applywizz@2026

UPDATE public.users 
SET must_change_password = false
WHERE email LIKE '%@applywizz.com'
AND must_change_password = true;

-- Verify the fix - should show all users with must_change_password = false
SELECT 
    email, 
    name, 
    role, 
    must_change_password,
    created_at
FROM public.users
WHERE email LIKE '%@applywizz.com'
ORDER BY role, name;
