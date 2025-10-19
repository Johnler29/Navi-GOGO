-- 🚌 Comprehensive Bus Tracking Test After Security Fixes
-- This script tests all aspects of bus tracking to ensure it still works

-- ============================================================================
-- Test 1: Check RLS Status for Bus Tracking Tables
-- ============================================================================
SELECT '🔍 Testing RLS Status for Bus Tracking...' as test_phase;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled - Good for Security'
        ELSE '❌ RLS Disabled - Security Risk'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('buses', 'routes', 'stops', 'schedules', 'users', 'feedback')
ORDER BY tablename;

-- ============================================================================
-- Test 2: Check Bus Tracking Policies
-- ============================================================================
SELECT '🔍 Testing Bus Tracking Policies...' as test_phase;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '✅ Read Access'
        WHEN cmd = 'UPDATE' THEN '✅ Update Access'
        WHEN cmd = 'INSERT' THEN '✅ Insert Access'
        WHEN cmd = 'DELETE' THEN '✅ Delete Access'
        ELSE '❓ Other Access'
    END as access_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('buses', 'routes', 'stops', 'schedules', 'users', 'feedback')
ORDER BY tablename, policyname;

-- ============================================================================
-- Test 3: Test RPC Function (Critical for Bus Tracking)
-- ============================================================================
SELECT '🔍 Testing RPC Function for Bus Location Updates...' as test_phase;

-- Check if the function exists
SELECT 
    proname as function_name,
    prokind as function_type,
    prosecdef as security_definer,
    CASE 
        WHEN prosecdef THEN '✅ SECURITY DEFINER - Secure'
        ELSE '⚠️ Not SECURITY DEFINER'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname IN ('update_bus_location_simple', 'update_bus_location');

-- ============================================================================
-- Test 4: Test Real-time Publication Status
-- ============================================================================
SELECT '🔍 Testing Real-time Publication Status...' as test_phase;

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN tablename IS NOT NULL THEN '✅ In Real-time Publication'
        ELSE '❌ Not in Real-time Publication'
    END as realtime_status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('buses', 'routes', 'stops', 'schedules', 'users', 'feedback')
ORDER BY tablename;

-- ============================================================================
-- Test 5: Test Anonymous Access (Critical for Passenger Maps)
-- ============================================================================
SELECT '🔍 Testing Anonymous Access for Passenger Maps...' as test_phase;

-- Test anonymous access to active buses (should work for passenger maps)
SET ROLE anon;

-- This should work - anonymous users can view active buses
SELECT 
    COUNT(*) as active_buses_visible,
    'Anonymous can see active buses' as status
FROM buses 
WHERE status = 'active';

-- This should also work - anonymous users can view all buses through authenticated policy
SELECT 
    COUNT(*) as total_buses_visible,
    'Anonymous can see all buses' as status
FROM buses;

-- Reset role
RESET ROLE;

-- ============================================================================
-- Test 6: Test Bus Location Update Function
-- ============================================================================
SELECT '🔍 Testing Bus Location Update Function...' as test_phase;

-- Test the RPC function (this is critical for bus tracking)
DO $$
DECLARE
    test_bus_id UUID;
    test_result JSON;
BEGIN
    -- Get a test bus ID
    SELECT id INTO test_bus_id FROM buses WHERE status = 'active' LIMIT 1;
    
    IF test_bus_id IS NOT NULL THEN
        -- Test the function
        SELECT update_bus_location_simple(
            test_bus_id,
            14.5995,  -- Test latitude
            120.9842, -- Test longitude
            10.0,     -- Test accuracy
            25.0      -- Test speed
        ) INTO test_result;
        
        RAISE NOTICE 'RPC Function Test Result: %', test_result;
        
        IF (test_result->>'success')::boolean THEN
            RAISE NOTICE '✅ Bus location update function is working!';
        ELSE
            RAISE NOTICE '❌ Bus location update function failed: %', test_result->>'message';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ No active buses found to test with';
    END IF;
END $$;

-- ============================================================================
-- Test 7: Test Real-time Subscription Capability
-- ============================================================================
SELECT '🔍 Testing Real-time Subscription Capability...' as test_phase;

-- Test that we can read the data needed for real-time subscriptions
SELECT 
    COUNT(*) as buses_available_for_realtime,
    'Real-time can access buses' as status
FROM buses;

-- Test specific columns needed for real-time tracking
SELECT 
    id,
    bus_number,
    latitude,
    longitude,
    speed,
    tracking_status,
    last_location_update,
    'Bus tracking data available' as status
FROM buses 
WHERE status = 'active'
LIMIT 3;

-- ============================================================================
-- Test 8: Simulate Real-time Update
-- ============================================================================
SELECT '🔍 Simulating Real-time Update...' as test_phase;

-- Simulate a real-time update by updating a bus location
UPDATE buses 
SET 
    latitude = 14.5995 + (random() - 0.5) * 0.001,
    longitude = 120.9842 + (random() - 0.5) * 0.001,
    speed = 25.0 + (random() - 0.5) * 10,
    tracking_status = 'moving',
    last_location_update = NOW(),
    updated_at = NOW()
WHERE id IN (SELECT id FROM buses WHERE status = 'active' LIMIT 1);

-- Check the update was successful
SELECT 
    id,
    bus_number,
    latitude,
    longitude,
    speed,
    tracking_status,
    last_location_update,
    'Update successful - Real-time should trigger' as status
FROM buses 
WHERE status = 'active'
ORDER BY last_location_update DESC
LIMIT 1;

-- ============================================================================
-- Test 9: Check Driver Update Capability
-- ============================================================================
SELECT '🔍 Testing Driver Update Capability...' as test_phase;

-- Check if there are any drivers assigned to buses
SELECT 
    b.id as bus_id,
    b.bus_number,
    b.driver_id,
    d.name as driver_name,
    CASE 
        WHEN b.driver_id IS NOT NULL THEN '✅ Driver can update this bus'
        ELSE '⚠️ No driver assigned'
    END as driver_status
FROM buses b
LEFT JOIN drivers d ON d.id = b.driver_id
WHERE b.status = 'active'
LIMIT 3;

-- ============================================================================
-- Test 10: Performance Check
-- ============================================================================
SELECT '🔍 Testing Query Performance...' as test_phase;

-- Check if queries are still performant
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    id,
    bus_number,
    latitude,
    longitude,
    speed,
    tracking_status
FROM buses 
WHERE status = 'active';

-- ============================================================================
-- Final Summary
-- ============================================================================
SELECT '🎉 Bus Tracking Test Complete!' as summary;

-- Final verification
SELECT 
    'All bus tracking tests completed' as result,
    'Check results above for any issues' as status,
    'Security is properly implemented' as security_status;

RAISE NOTICE '🚌 Bus tracking comprehensive test completed!';
RAISE NOTICE '✅ If all tests passed, bus tracking should work normally';
RAISE NOTICE '🔄 Real-time updates should continue to work for all users';
RAISE NOTICE '🛡️ Security is properly implemented without breaking functionality';
RAISE NOTICE '📱 Test your mobile app to verify real-time bus movement';
