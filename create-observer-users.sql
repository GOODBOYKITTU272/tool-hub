-- =====================================================
-- BULK CREATE OBSERVER USERS - SIMPLIFIED VERSION
-- =====================================================
-- This script creates user profiles in public.users
-- You'll need to create the auth accounts separately
-- =====================================================

-- Step 1: Insert user profiles into public.users
-- Note: You'll need to create the auth accounts first via Supabase Dashboard or CLI

INSERT INTO public.users (id, email, name, role, must_change_password, created_at, updated_at)
VALUES
    -- Generate UUIDs for each user
    (gen_random_uuid(), 'bhavya@applywizz.com', 'K. Bhavya', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'pooja@applywizz.com', 'M Pooja', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'sahithi@applywizz.com', 'N.Sahithi', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'deekshitha@applywizz.com', 'T.Deekshitha', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'vyshnavi.oram@applywizz.com', 'vyshnavi', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'sowmya@applywizz.com', 'CH. Sowmya', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'akshay@applywizz.com', 'M Akshay', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'dayakar@applywizz.com', 'G dayakar', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'harika@applywizz.com', 'M.Harika', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'saiprasanna@applywizz.com', 'M.Sai prasanna', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'ramadevi@applywizz.com', 'Ch. Ramadevi(TL)', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'rachana@applywizz.com', 'Rachana Merugu', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'bhavana@applywizz.com', 'Bhavana Ajja', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'aparna@applywizz.com', 'Aparna Mandala', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'krishnavamshi@applywizz.com', 'M.Krishnavamshi', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'kavya@applywizz.com', 'Kavya Midde', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'shivani@applywizz.com', 'Shivani Pentham', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'sreeja@applywizz.com', 'Chennoju Sreeja', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'ramyasri@applywizz.com', 'RamyaSri Kuncham', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'manasa@applywizz.com', 'Manasa Japa', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'ali@applywizz.com', 'Shaik Ali', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'sarika@applywizz.com', 'Sarika Reddy (TL)', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'pravalika@applywizz.com', 'Pravalika', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'vinoda@applywizz.com', 'Vinoda', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'ruchitha@applywizz.com', 'Ruchitha', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'pavankumar@applywizz.com', 'Pavan Kumar', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'meenakshi@applywizz.com', 'Meenakshi', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'maneesha@applywizz.com', 'Maneesha', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'navya@applywizz.com', 'Navya', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'shruthi@applywizz.com', 'Shruthi Kemmasaram', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'shruthisherupally@applywizz.com', 'Shruthi Sherupally', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'supriya@applywizz.com', 'Supriya', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'srujana@applywizz.com', 'Srujana', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'ashwitha@applywizz.com', 'Ashwitha', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'kolashivani@applywizz.com', 'shivani kola', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'sana@applywizz.com', 'Sana', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'prathyusha@applywizz.com', 'Prathyusha', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'saipreethi@applywizz.com', 'Saipreethi', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'akhila@applywizz.com', 'Akhila', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'shravani@applywizz.com', 'Shravani', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'saipavan@applywizz.com', 'Sai pavan', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'rakesh@applywizz.com', 'Rakesh', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'vidhya@applywizz.com', 'Vidhya', 'Observer', false, NOW(), NOW()),
    (gen_random_uuid(), 'dhakella@applywizz.com', 'D.Nimsha(T,L)', 'Observer', false, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Verify the users were created
SELECT COUNT(*) as total_observer_users
FROM public.users
WHERE role = 'Observer';

-- List all Observer users
SELECT name, email, role, created_at
FROM public.users
WHERE role = 'Observer'
ORDER BY name;

-- =====================================================
-- IMPORTANT: MANUAL STEPS REQUIRED
-- =====================================================
-- After running this script, you need to create auth accounts.
-- The easiest way is to use the Supabase CLI:
--
-- 1. Install Supabase CLI if needed: npm install -g supabase
-- 2. Save this file as create-auth-users.sh:
--
-- #!/bin/bash
-- EMAILS=(
--   "bhavya@applywizz.com" "pooja@applywizz.com" "sahithi@applywizz.com"
--   "deekshitha@applywizz.com" "vyshnavi.oram@applywizz.com" "sowmya@applywizz.com"
--   "akshay@applywizz.com" "dayakar@applywizz.com" "harika@applywizz.com"
--   "saiprasanna@applywizz.com" "ramadevi@applywizz.com" "rachana@applywizz.com"
--   "bhavana@applywizz.com" "aparna@applywizz.com" "krishnavamshi@applywizz.com"
--   "kavya@applywizz.com" "shivani@applywizz.com" "sreeja@applywizz.com"
--   "ramyasri@applywizz.com" "manasa@applywizz.com" "ali@applywizz.com"
--   "sarika@applywizz.com" "pravalika@applywizz.com" "vinoda@applywizz.com"
--   "ruchitha@applywizz.com" "pavankumar@applywizz.com" "meenakshi@applywizz.com"
--   "maneesha@applywizz.com" "navya@applywizz.com" "shruthi@applywizz.com"
--   "shruthisherupally@applywizz.com" "supriya@applywizz.com" "srujana@applywizz.com"
--   "ashwitha@applywizz.com" "kolashivani@applywizz.com" "sana@applywizz.com"
--   "prathyusha@applywizz.com" "saipreethi@applywizz.com" "akhila@applywizz.com"
--   "shravani@applywizz.com" "saipavan@applywizz.com" "rakesh@applywizz.com"
--   "vidhya@applywizz.com" "dhakella@applywizz.com"
-- )
-- for email in "${EMAILS[@]}"; do
--   supabase auth users create "$email" --password "Applywizz@2026"
-- done
--
-- 3. Run: chmod +x create-auth-users.sh && ./create-auth-users.sh
-- =====================================================
