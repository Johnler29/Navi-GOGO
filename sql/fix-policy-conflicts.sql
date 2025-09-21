-- Fix RLS policy conflicts
-- Run this in Supabase SQL Editor

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin users can view all data" ON admin_users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;

-- Recreate the policies
CREATE POLICY "Admin users can view all data" ON admin_users FOR ALL USING (true);
CREATE POLICY "Users can view their own data" ON users FOR ALL USING (true);
CREATE POLICY "Users can view their own roles" ON user_roles FOR ALL USING (true);
CREATE POLICY "Users can view their own tickets" ON support_tickets FOR ALL USING (true);
CREATE POLICY "Users can view their own preferences" ON user_preferences FOR ALL USING (true);

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('admin_users', 'users', 'user_roles', 'support_tickets', 'user_preferences')
ORDER BY tablename, policyname;
