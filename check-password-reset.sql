-- Check must_change_password values for all users
SELECT 
    email, 
    name, 
    role, 
    must_change_password,
    created_at
FROM public.users
WHERE email LIKE '%@applywizz.com'
ORDER BY role, name;

-- If any users have must_change_password = true, fix them:
-- UPDATE public.users 
-- SET must_change_password = false
-- WHERE email LIKE '%@applywizz.com' AND must_change_password = true;
