-- DEEP DIVE: Check actual table permissions for service_role
-- This will tell us exactly what's missing

-- 1. Check what permissions service_role has on daily_logs
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('daily_logs', 'tools', 'users')
    AND grantee = 'service_role'
ORDER BY table_name, privilege_type;

-- 2. Grant ALL permissions explicitly to service_role
GRANT ALL PRIVILEGES ON TABLE public.daily_logs TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.tools TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.users TO service_role;

-- Also grant to postgres role (sometimes needed)
GRANT ALL PRIVILEGES ON TABLE public.daily_logs TO postgres;
GRANT ALL PRIVILEGES ON TABLE public.tools TO postgres;
GRANT ALL PRIVILEGES ON TABLE public.users TO postgres;

-- 3. Grant usage on schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- 4. Grant on sequences (for auto-increment IDs)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5. Verify grants were applied
SELECT 
    grantee,
    table_name,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE table_name IN ('daily_logs', 'tools', 'users')
    AND grantee IN ('service_role', 'postgres')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

-- 6. Check table ownership
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename IN ('daily_logs', 'tools', 'users');
