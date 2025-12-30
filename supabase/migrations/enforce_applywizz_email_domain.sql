-- Email Domain Restriction: @applywizz.com Only
-- This migration enforces that only @applywizz.com email addresses can access ToolHub

-- Step 1: Get or create a default admin user to reassign orphaned data
DO $$
DECLARE
    default_admin_id UUID;
BEGIN
    -- Find the first ApplyWizz admin user
    SELECT id INTO default_admin_id
    FROM public.users
    WHERE email LIKE '%@applywizz.com' AND role = 'Admin'
    LIMIT 1;
    
    -- If no admin found, use the first ApplyWizz user
    IF default_admin_id IS NULL THEN
        SELECT id INTO default_admin_id
        FROM public.users
        WHERE email LIKE '%@applywizz.com'
        LIMIT 1;
    END IF;
    
    IF default_admin_id IS NOT NULL THEN
        -- Reassign tools.owner_id
        UPDATE public.tools
        SET owner_id = default_admin_id
        WHERE owner_id IN (
            SELECT id FROM public.users WHERE email NOT LIKE '%@applywizz.com'
        );
        
        -- Reassign tools.created_by
        UPDATE public.tools
        SET created_by = default_admin_id
        WHERE created_by IN (
            SELECT id FROM public.users WHERE email NOT LIKE '%@applywizz.com'
        );
        
        -- Reassign tools.approved_by
        UPDATE public.tools
        SET approved_by = default_admin_id
        WHERE approved_by IN (
            SELECT id FROM public.users WHERE email NOT LIKE '%@applywizz.com'
        );
        
        -- Delete daily_logs from non-ApplyWizz users
        DELETE FROM public.daily_logs
        WHERE user_id IN (
            SELECT id FROM public.users WHERE email NOT LIKE '%@applywizz.com'
        );
        
        -- Delete openai_usage records from non-ApplyWizz users
        DELETE FROM public.openai_usage
        WHERE user_id IN (
            SELECT id FROM public.users WHERE email NOT LIKE '%@applywizz.com'
        );
        
        -- Reassign business clarity records
        UPDATE public.tool_business_clarity
        SET created_by = default_admin_id, updated_by = default_admin_id
        WHERE created_by IN (
            SELECT id FROM public.users WHERE email NOT LIKE '%@applywizz.com'
        ) OR updated_by IN (
            SELECT id FROM public.users WHERE email NOT LIKE '%@applywizz.com'
        );
        
        RAISE NOTICE 'Reassigned all references to ApplyWizz admin: %', default_admin_id;
    ELSE
        RAISE EXCEPTION 'No ApplyWizz user found! Cannot proceed with cleanup. Please create an @applywizz.com user first.';
    END IF;
END $$;

-- Step 2: Delete all users with non-@applywizz.com emails from public.users
DELETE FROM public.users 
WHERE email NOT LIKE '%@applywizz.com';

-- Step 3: Delete from auth.users (cascade will handle related records)
DELETE FROM auth.users 
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
