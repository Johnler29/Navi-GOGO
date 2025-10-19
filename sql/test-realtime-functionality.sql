-- 🔄 Real-time Functionality Test
-- Quick test to verify real-time bus tracking is working

-- ============================================================================
-- Test 1: Check Real-time Publication
-- ============================================================================
SELECT 'Checking real-time publication status...' as test;

SELECT 
    schemaname,
    tablename,
    'Table is in real-time publication' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'buses';

-- ============================================================================
-- Test 2: Test Bus Location Update
-- ============================================================================
SELECT 'Testing bus location update...' as test;

-- Update a bus location to trigger real-time event
UPDATE buses 
SET 
    latitude = 14.5995 + (random() - 0.5) * 0.001,
    longitude = 120.9842 + (random() - 0.5) * 0.001,
    speed = 25.0 + (random() - 0.5) * 10,
    tracking_status = 'moving',
    last_location_update = NOW(),
    updated_at = NOW()
WHERE id IN (SELECT id FROM buses WHERE status = 'active' LIMIT 1);

-- Verify the update
SELECT 
    id,
    bus_number,
    latitude,
    longitude,
    speed,
    tracking_status,
    last_location_update,
    'Bus location updated - Real-time event should trigger' as status
FROM buses 
WHERE status = 'active'
ORDER BY last_location_update DESC
LIMIT 1;

-- ============================================================================
-- Test 3: Test RPC Function
-- ============================================================================
SELECT 'Testing RPC function...' as test;

-- Test the update_bus_location_simple function
DO $$
DECLARE
    test_bus_id UUID;
    result JSON;
BEGIN
    -- Get first active bus
    SELECT id INTO test_bus_id FROM buses WHERE status = 'active' LIMIT 1;
    
    IF test_bus_id IS NOT NULL THEN
        -- Test the function
        SELECT update_bus_location_simple(
            test_bus_id,
            14.6000,  -- New latitude
            120.9850, -- New longitude
            5.0,      -- Accuracy
            30.0      -- Speed
        ) INTO result;
        
        RAISE NOTICE 'RPC Result: %', result;
    ELSE
        RAISE NOTICE 'No active buses found for testing';
    END IF;
END $$;

-- ============================================================================
-- Test 4: Check Anonymous Access
-- ============================================================================
SELECT 'Testing anonymous access...' as test;

-- Test anonymous access (needed for passenger maps)
SET ROLE anon;

SELECT 
    COUNT(*) as buses_visible_to_anonymous,
    'Anonymous users can see buses' as status
FROM buses 
WHERE status = 'active';

RESET ROLE;

-- ============================================================================
-- Summary
-- ============================================================================
SELECT 'Real-time functionality test complete!' as summary;

RAISE NOTICE '🔄 Real-time test completed!';
RAISE NOTICE '📱 If all tests passed, your mobile app should show bus movement';
RAISE NOTICE '🚌 Check your app to verify buses are moving in real-time';
