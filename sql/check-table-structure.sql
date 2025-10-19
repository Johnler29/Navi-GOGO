-- 🔍 Check Table Structure Before Running Security Fixes
-- Run this first to see your actual table structure

-- ============================================================================
-- Check Users Table Structure
-- ============================================================================
SELECT 'Users table structure:' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- Check Feedback Table Structure
-- ============================================================================
SELECT 'Feedback table structure:' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'feedback' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- Check Buses Table Structure
-- ============================================================================
SELECT 'Buses table structure:' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'buses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- Check Routes Table Structure
-- ============================================================================
SELECT 'Routes table structure:' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'routes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- Check Current RLS Status
-- ============================================================================
SELECT 'Current RLS status:' as status_type;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- Check Existing Policies
-- ============================================================================
SELECT 'Existing policies:' as policy_info;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- Check Existing Views
-- ============================================================================
SELECT 'Existing views:' as view_info;
SELECT 
    schemaname,
    viewname,
    CASE 
        WHEN definition ILIKE '%security definer%' THEN '⚠️ SECURITY DEFINER'
        ELSE '✅ Normal View'
    END as security_type
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

RAISE NOTICE '🔍 Table structure check complete!';
RAISE NOTICE '📋 Review the results above to understand your database structure';
RAISE NOTICE '🛠️ Use this info to adjust the security fix script if needed';
