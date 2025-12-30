-- Email Domain Restriction: @applywizz.com Only
-- This migration enforces that only @applywizz.com email addresses can access ToolHub

-- Step 1: Delete all users with non-@applywizz.com emails
-- IMPORTANT: This will cascade delete related data (daily_logs, etc.)
DELETE FROM auth.users 
WHERE email NOT LIKE '%@applywizz.com';

-- Also clean up from public.users table
DELETE FROM public.users 
WHERE email NOT LIKE '%@applywizz.com';

-- Step 2: Create function to validate email domain
CREATE OR REPLACE FUNCTION public.validate_applywizz_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if email ends with @applywizz.com
    IF NEW.email NOT LIKE '%@applywizz.com' THEN
        RAISE EXCEPTION 'Access restricted: Only @applywizz.com email addresses are allowed. Please use your ApplyWizz company email.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger on auth.users table
DROP TRIGGER IF EXISTS enforce_applywizz_domain ON auth.users;
CREATE TRIGGER enforce_applywizz_domain
    BEFORE INSERT OR UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_applywizz_email();

-- Step 4: Create trigger on public.users table
DROP TRIGGER IF EXISTS enforce_applywizz_domain_public ON public.users;
CREATE TRIGGER enforce_applywizz_domain_public
    BEFORE INSERT OR UPDATE OF email ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_applywizz_email();

-- Step 5: Verify remaining users
SELECT email, name, role 
FROM public.users 
ORDER BY email;

-- Step 6: Count deleted users (for logging)
SELECT 
    'Deleted ' || COUNT(*) || ' non-@applywizz.com users' as cleanup_status
FROM auth.users 
WHERE email NOT LIKE '%@applywizz.com';

COMMENT ON FUNCTION public.validate_applywizz_email() IS 
'Enforces that only @applywizz.com email addresses can be used for authentication. Part of ApplyWizz internal tool security policy.';
