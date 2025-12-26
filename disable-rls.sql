-- =====================================================
-- DISABLE ALL RLS POLICIES - NO SECURITY RESTRICTIONS
-- =====================================================
-- WARNING: This removes all Row Level Security!
-- Any authenticated user can do anything to all tables.
-- Only use this for development/testing purposes.
-- =====================================================

-- Disable RLS on tools table
ALTER TABLE public.tools DISABLE ROW LEVEL SECURITY;

-- Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on notifications table
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Disable RLS on requests table (if it exists)
ALTER TABLE public.requests DISABLE ROW LEVEL SECURITY;

-- Disable RLS on audit_logs table (if it exists)
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this, you should be able to add tools
-- regardless of your user role.
-- =====================================================

-- Check RLS status (optional)
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public'
-- AND tablename IN ('tools', 'users', 'notifications', 'requests', 'audit_logs');
