-- =====================================================
-- ToolHub Database Schema
-- =====================================================
-- This schema file creates the necessary tables and policies
-- for the ToolHub application
-- =====================================================

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
-- This table stores user profile information
-- It should be linked to Supabase Auth users via the id field

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Owner', 'Observer')),
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- RLS Policy: Admins can read all users
CREATE POLICY "Admins can read all users"
    ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- RLS Policy: Admins can insert users
CREATE POLICY "Admins can insert users"
    ON public.users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- RLS Policy: Admins can update users
CREATE POLICY "Admins can update users"
    ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- RLS Policy: Users can update their own password flag
CREATE POLICY "Users can update own password flag"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- AUTOMATIC PROFILE CREATION
-- =====================================================
-- Trigger to create a profile for new users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role, must_change_password)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
        'Observer', -- Default role for new signups
        FALSE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. TOOLS TABLE
-- =====================================================
-- This table stores internal tools information

CREATE TABLE IF NOT EXISTS public.tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    type TEXT,
    tags TEXT[],
    url TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    owner_team TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read approved tools
CREATE POLICY "Users can read approved tools"
    ON public.tools
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND approval_status = 'approved'
    );

-- RLS Policy: Owners can read their own tools regardless of status
CREATE POLICY "Owners can read own tools"
    ON public.tools
    FOR SELECT
    USING (
        auth.uid() = created_by OR auth.uid() = owner_id
    );

-- RLS Policy: Admins can read all tools
CREATE POLICY "Admins can read all tools"
    ON public.tools
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- RLS Policy: Admins and Owners can insert tools
CREATE POLICY "Admins and Owners can insert tools"
    ON public.tools
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('Admin', 'Owner')
        )
    );

-- RLS Policy: Admins can update any tool
CREATE POLICY "Admins can update any tool"
    ON public.tools
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- RLS Policy: Owners can update their own tools
CREATE POLICY "Owners can update own tools"
    ON public.tools
    FOR UPDATE
    USING (
        auth.uid() = created_by OR auth.uid() = owner_id
    );

-- RLS Policy: Admins can delete any tool
CREATE POLICY "Admins can delete any tool"
    ON public.tools
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- RLS Policy: Owners can delete their own tools
CREATE POLICY "Owners can delete own tools"
    ON public.tools
    FOR DELETE
    USING (
        auth.uid() = created_by OR auth.uid() = owner_id
    );

-- Create trigger to update updated_at timestamp
CREATE TRIGGER tools_updated_at
    BEFORE UPDATE ON public.tools
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 3. REQUESTS TABLE
-- =====================================================
-- This table stores tool feature and access requests

CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Requested' CHECK (status IN ('Requested', 'In Progress', 'Completed', 'Rejected')),
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see all requests
CREATE POLICY "Log-in users can see all requests"
    ON public.requests
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- RLS Policy: Users can create requests
CREATE POLICY "Users can create requests"
    ON public.requests
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policy: Admins can update any request
CREATE POLICY "Admins can update requests"
    ON public.requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- RLS Policy: Owners can update requests for their own tools
CREATE POLICY "Owners can update requests for own tools"
    ON public.requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.tools
            WHERE id = tool_id AND (owner_id = auth.uid() OR created_by = auth.uid())
        )
    );

-- Create trigger for requests updated_at
CREATE TRIGGER requests_updated_at
    BEFORE UPDATE ON public.requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 4. AUDIT_LOGS TABLE
-- =====================================================
-- This table stores system activity logs

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    before_state JSONB,
    after_state JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can read all logs
CREATE POLICY "Admins can read all audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- RLS Policy: System can insert logs (via functions/triggers or app)
CREATE POLICY "Admins/App can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 5. NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own notifications
CREATE POLICY "Users can read own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- 6. INSERT SAMPLE ADMIN USER
-- =====================================================
-- IMPORTANT: This creates a sample admin user
-- You need to create this user in Supabase Auth first!
-- Then uncomment and run this insert with the correct UUID

-- INSERT INTO public.users (id, email, name, role, must_change_password)
-- VALUES (
--     'YOUR_AUTH_USER_UUID_HERE',
--     'ramakrishna@applywizz',
--     'Ramakrishna',
--     'Admin',
--     FALSE
-- );

-- =====================================================
-- SETUP INSTRUCTIONS:
-- =====================================================
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire schema
-- 4. Run the SQL commands
-- 5. Create a user in Authentication > Users
-- 6. Note the user's UUID
-- 7. Uncomment and update the INSERT statement above with the UUID
-- 8. Run the INSERT statement to create the admin user profile
-- =====================================================
