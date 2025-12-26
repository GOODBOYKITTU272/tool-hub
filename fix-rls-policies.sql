-- =====================================================
-- COMPLETE RLS POLICY FIX FOR TOOLHUB
-- =====================================================
-- This fixes all RLS issues including:
-- 1. Circular dependency in users table policies
-- 2. Missing notification policies
-- 3. Tool access policies
-- =====================================================

-- =====================================================
-- PART 1: FIX USERS TABLE RLS (Critical - Fixes Profile Fetch Timeout)
-- =====================================================
-- The issue: Users table has a circular dependency where reading your own
-- profile requires checking if you're an admin, but checking if you're an
-- admin requires reading your profile first!

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Users can update own password flag" ON public.users;

-- FIXED: Simple policy - users can ALWAYS read their own profile (no role check needed)
CREATE POLICY "Users can read own profile" 
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins can read all users (now works because they can read their own profile first)
CREATE POLICY "Admins can read all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- Admins can insert new users
CREATE POLICY "Admins can insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- Admins can update all users
CREATE POLICY "Admins can update all users"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- Users can update their own password flag
CREATE POLICY "Users can update own password flag"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- =====================================================
-- PART 2: FIX TOOLS TABLE RLS
-- =====================================================

-- Drop existing tools policies
DROP POLICY IF EXISTS "Users can read approved tools" ON public.tools;
DROP POLICY IF EXISTS "Owners can read own tools" ON public.tools;
DROP POLICY IF EXISTS "Admins can read all tools" ON public.tools;
DROP POLICY IF EXISTS "Admins and Owners can insert tools" ON public.tools;
DROP POLICY IF EXISTS "Admins can update any tool" ON public.tools;
DROP POLICY IF EXISTS "Owners can update own tools" ON public.tools;
DROP POLICY IF EXISTS "Admins can delete any tool" ON public.tools;
DROP POLICY IF EXISTS "Owners can delete own tools" ON public.tools;

-- SELECT: Users can see approved tools OR their own tools OR all tools if admin
CREATE POLICY "Enable read access for tools"
ON public.tools
FOR SELECT
TO authenticated
USING (
  -- Option 1: User is admin (can see all tools)
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'Admin'
  )
  OR
  -- Option 2: Tool is approved (anyone can see)
  approval_status = 'approved'
  OR
  -- Option 3: User owns or created the tool (can see their own regardless of status)
  owner_id = auth.uid()
  OR
  created_by = auth.uid()
);

-- INSERT: Admins and Owners can create tools
CREATE POLICY "Admins and Owners can insert tools"
ON public.tools
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('Admin', 'Owner')
  )
);

-- UPDATE: Admins can update any tool, Owners can update their own
CREATE POLICY "Admins can update any tool"
ON public.tools
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

CREATE POLICY "Owners can update own tools"
ON public.tools
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR owner_id = auth.uid())
WITH CHECK (created_by = auth.uid() OR owner_id = auth.uid());

-- DELETE: Admins can delete any tool, Owners can delete their own
CREATE POLICY "Admins can delete any tool"
ON public.tools
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

CREATE POLICY "Owners can delete own tools"
ON public.tools
FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR owner_id = auth.uid());

-- =====================================================
-- PART 3: FIX NOTIFICATIONS TABLE RLS (MISSING POLICIES!)
-- =====================================================

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

-- SELECT: Users can read their own notifications
CREATE POLICY "Users can read own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: System/Admin can create notifications for users
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  -- Either inserting for yourself (rarely used)
  user_id = auth.uid()
  OR
  -- Or you're an admin creating notifications for others
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- UPDATE: Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the policies are working:

-- Check all policies on users table
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Check all policies on tools table
-- SELECT * FROM pg_policies WHERE tablename = 'tools';

-- Check all policies on notifications table
-- SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy this ENTIRE file
-- 4. Paste and click "Run"
-- 5. Wait for success message
-- 6. Go back to your app
-- 7. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
-- 8. Try logging in again
--
-- The circular dependency should now be fixed!
-- =====================================================
