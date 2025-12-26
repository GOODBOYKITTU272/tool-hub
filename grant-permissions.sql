-- =====================================================
-- GRANT FULL PUBLIC ACCESS - FIX 403 ERRORS
-- =====================================================
-- This grants full permissions to authenticated users
-- on all tables to bypass the 403 API errors
-- =====================================================

-- Grant ALL privileges on tools table to authenticated users
GRANT ALL ON public.tools TO authenticated;
GRANT ALL ON public.tools TO anon;

-- Grant ALL privileges on users table
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- Grant ALL privileges on notifications table
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO anon;

-- Grant ALL privileges on requests table
GRANT ALL ON public.requests TO authenticated;
GRANT ALL ON public.requests TO anon;

-- Grant ALL privileges on audit_logs table
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO anon;

-- Grant USAGE on sequences (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this, the 403 errors should be gone
-- =====================================================
