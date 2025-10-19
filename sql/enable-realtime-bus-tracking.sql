-- Enable Real-Time Bus Tracking
-- This script enables real-time subscriptions for the buses table
-- Run this in your Supabase SQL editor to fix the bus movement issue

-- Enable real-time for the buses table (with error handling)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE buses;
        RAISE NOTICE '✅ buses table added to real-time publication';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'ℹ️ buses table already in real-time publication';
    END;
END $$;

-- Enable real-time for the location_updates table (if it exists)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE location_updates;
        RAISE NOTICE '✅ location_updates table added to real-time publication';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'ℹ️ location_updates table already in real-time publication';
    END;
END $$;

-- Enable real-time for the driver_sessions table
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE driver_sessions;
        RAISE NOTICE '✅ driver_sessions table added to real-time publication';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'ℹ️ driver_sessions table already in real-time publication';
    END;
END $$;

-- Enable real-time for the driver_emergency_reports table
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE driver_emergency_reports;
        RAISE NOTICE '✅ driver_emergency_reports table added to real-time publication';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'ℹ️ driver_emergency_reports table already in real-time publication';
    END;
END $$;

-- Enable real-time for the drivers table (CRITICAL for admin portal)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE drivers;
        RAISE NOTICE '✅ drivers table added to real-time publication';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'ℹ️ drivers table already in real-time publication';
    END;
END $$;

-- Enable real-time for the users table
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE users;
        RAISE NOTICE '✅ users table added to real-time publication';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'ℹ️ users table already in real-time publication';
    END;
END $$;

-- Enable real-time for the routes table
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE routes;
        RAISE NOTICE '✅ routes table added to real-time publication';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'ℹ️ routes table already in real-time publication';
    END;
END $$;

-- Verify real-time is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('buses', 'location_updates', 'driver_sessions', 'driver_emergency_reports', 'drivers', 'users', 'routes');

-- Optional: Create a test function to verify real-time is working
CREATE OR REPLACE FUNCTION test_realtime_bus_update()
RETURNS void AS $$
BEGIN
  -- Update a test bus location to trigger real-time event
  UPDATE buses 
  SET 
    latitude = 14.5995 + (random() - 0.5) * 0.001,
    longitude = 120.9842 + (random() - 0.5) * 0.001,
    updated_at = NOW()
  WHERE id IN (SELECT id FROM buses LIMIT 1);
  
  RAISE NOTICE 'Test bus location updated - check if real-time event was triggered';
END;
$$ LANGUAGE plpgsql;

-- Test function for drivers real-time
CREATE OR REPLACE FUNCTION test_realtime_driver_update()
RETURNS void AS $$
BEGIN
  -- Update a test driver to trigger real-time event
  UPDATE drivers 
  SET 
    updated_at = NOW()
  WHERE id IN (SELECT id FROM drivers LIMIT 1);
  
  RAISE NOTICE 'Test driver updated - check if real-time event was triggered';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION test_realtime_bus_update() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION test_realtime_driver_update() TO anon, authenticated;

-- Instructions:
-- 1. Run this script in your Supabase SQL editor
-- 2. Check the output of the SELECT query to confirm tables are enabled
-- 3. Test real-time by running: 
--    - SELECT test_realtime_bus_update(); (for bus updates)
--    - SELECT test_realtime_driver_update(); (for driver updates)
-- 4. Check your app to see if buses and drivers now update in real-time
-- 5. The admin portal should now show driver changes immediately without delay
