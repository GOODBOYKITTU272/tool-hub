-- ============================================
-- FIX OWNER ROLES - Run in Supabase SQL Editor
-- ============================================
-- All 7 users should be Owner, not Observer

UPDATE public.users
SET role = 'Owner'
WHERE email IN (
  'nikhil@applywizz.com',
  'vivek@applywizz.com',
  'bhanuteja@applywizz.com',
  'ganesh@applywizz.com',
  'nithin@applywizz.com',
  'harshitha@applywizz.com',
  'dinesh@applywizz.com'
);

-- Check if it worked
SELECT email, name, role
FROM public.users
WHERE email LIKE '%@applywizz.com'
ORDER BY role DESC, name;
