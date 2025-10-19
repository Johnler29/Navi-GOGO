-- 🔍 Check Remaining Security Errors
-- This script helps identify what the remaining 5 errors are

-- ============================================================================
-- Check RLS Status for All Tables
-- ============================================================================
SELECT 'RLS Status Check:' as check_type;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled - ERROR'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- Check Policy Count for Each Table
-- ============================================================================
SELECT 'Policy Count Check:' as check_type;
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has Policies'
        ELSE '❌ No Policies - ERROR'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ============================================================================
-- Check for Tables with Policies but No RLS
-- ============================================================================
SELECT 'Tables with Policies but No RLS:' as check_type;
SELECT 
    t.schemaname,
    t.tablename,
    'Policy Exists RLS Disabled - ERROR' as issue_type,
    'This table has policies but RLS is not enabled' as description
FROM pg_tables t
WHERE t.schemaname = 'public'
    AND NOT t.rowsecurity
    AND EXISTS (
        SELECT 1 FROM pg_policies p 
        WHERE p.schemaname = t.schemaname 
        AND p.tablename = t.tablename
    );

-- ============================================================================
-- Check for Tables with No RLS in Public Schema
-- ============================================================================
SELECT 'Tables with No RLS in Public Schema:' as check_type;
SELECT 
    schemaname,
    tablename,
    'RLS Disabled in Public - ERROR' as issue_type,
    'This table in public schema does not have RLS enabled' as description
FROM pg_tables 
WHERE schemaname = 'public'
    AND NOT rowsecurity
ORDER BY tablename;

-- ============================================================================
-- Check for SECURITY DEFINER Views
-- ============================================================================
SELECT 'SECURITY DEFINER Views:' as check_type;
SELECT 
    schemaname,
    viewname,
    'Security Definer View - WARNING' as issue_type,
    'This view uses SECURITY DEFINER property' as description
FROM pg_views 
WHERE schemaname = 'public'
    AND definition ILIKE '%security definer%'
ORDER BY viewname;

-- ============================================================================
-- Check for Functions with Mutable Search Path
-- ============================================================================
SELECT 'Functions with Mutable Search Path:' as check_type;
SELECT 
    n.nspname as schemaname,
    p.proname as function_name,
    'Function Search Path Mutable - WARNING' as issue_type,
    'This function does not have search_path set' as description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'  -- Functions only
    AND (p.proconfig IS NULL OR NOT ('search_path' = ANY(p.proconfig)))
ORDER BY p.proname;

-- ============================================================================
-- Summary
-- ============================================================================
SELECT 'Summary:' as check_type;
SELECT 
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Tables with RLS',
    COUNT(*)::text
FROM pg_tables WHERE schemaname = 'public' AND rowsecurity
UNION ALL
SELECT 
    'Tables without RLS',
    COUNT(*)::text
FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity
UNION ALL
SELECT 
    'Total Policies',
    COUNT(*)::text
FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 
    'SECURITY DEFINER Views',
    COUNT(*)::text
FROM pg_views WHERE schemaname = 'public' AND definition ILIKE '%security definer%'
UNION ALL
SELECT 
    'Functions with Mutable Search Path',
    COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND (p.proconfig IS NULL OR NOT ('search_path' = ANY(p.proconfig)));

RAISE NOTICE '🔍 Security check complete!';
RAISE NOTICE '📋 Review the results above to identify remaining errors';
RAISE NOTICE '🛠️ Focus on tables with "❌" status - these are likely your 5 errors';
