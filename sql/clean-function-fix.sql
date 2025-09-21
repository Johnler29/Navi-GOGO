-- =====================================================
-- Clean Function Fix - Complete and Working
-- =====================================================

-- This script creates a clean, working version of the get_realtime_bus_status function

-- First, ensure we have the required columns
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS speed_kmh DECIMAL(5,2) DEFAULT 0;
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS accuracy DECIMAL(8,2) DEFAULT 0;
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS is_moving BOOLEAN DEFAULT false;
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS battery_level DECIMAL(5,2) DEFAULT 0;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_realtime_bus_status();

-- Create the function with proper syntax
CREATE OR REPLACE FUNCTION get_realtime_bus_status()
RETURNS TABLE (
    bus_id UUID,
    bus_name VARCHAR(100),
    tracking_status VARCHAR(50),
    current_passengers INTEGER,
    capacity_percentage NUMERIC,
    max_capacity INTEGER,
    route_name VARCHAR(100),
    estimated_duration VARCHAR(50),
    fare NUMERIC,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    speed_kmh DECIMAL(5, 2),
    accuracy DECIMAL(8, 2),
    last_location_update TIMESTAMPTZ,
    is_moving BOOLEAN,
    driver_status VARCHAR(50),
    driver_name VARCHAR(100),
    location_status VARCHAR(20),
    capacity_status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as bus_id,
        b.name::VARCHAR(100) as bus_name,
        b.tracking_status::VARCHAR(50) as tracking_status,
        b.current_passengers,
        b.capacity_percentage,
        b.max_capacity,
        r.name::VARCHAR(100) as route_name,
        r.estimated_duration::VARCHAR(50) as estimated_duration,
        r.fare,
        lu.latitude,
        lu.longitude,
        COALESCE(lu.speed_kmh, 0) as speed_kmh,
        COALESCE(lu.accuracy, 0) as accuracy,
        lu.created_at as last_location_update,
        COALESCE(lu.is_moving, false) as is_moving,
        ds.status::VARCHAR(50) as driver_status,
        d.name::VARCHAR(100) as driver_name,
        CASE 
            WHEN lu.created_at > NOW() - INTERVAL '2 minutes' THEN 'live'::VARCHAR(20)
            WHEN lu.created_at > NOW() - INTERVAL '5 minutes' THEN 'recent'::VARCHAR(20)
            WHEN lu.created_at > NOW() - INTERVAL '15 minutes' THEN 'stale'::VARCHAR(20)
            ELSE 'offline'::VARCHAR(20)
        END as location_status,
        CASE 
            WHEN b.capacity_percentage >= 90 THEN 'full'::VARCHAR(20)
            WHEN b.capacity_percentage >= 70 THEN 'crowded'::VARCHAR(20)
            WHEN b.capacity_percentage >= 40 THEN 'moderate'::VARCHAR(20)
            WHEN b.capacity_percentage >= 10 THEN 'light'::VARCHAR(20)
            ELSE 'empty'::VARCHAR(20)
        END as capacity_status
    FROM buses b
    JOIN routes r ON b.route_id = r.id
    LEFT JOIN location_updates lu ON b.id = lu.bus_id 
        AND lu.created_at = (
            SELECT MAX(created_at) 
            FROM location_updates lu2
            WHERE lu2.bus_id = b.id
        )
    LEFT JOIN driver_sessions ds ON b.id = ds.bus_id 
        AND ds.status = 'active'
    LEFT JOIN drivers d ON ds.driver_id = d.id
    WHERE b.tracking_status IN ('moving', 'at_stop', 'stopped')
        AND (lu.created_at IS NULL OR lu.created_at > NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'Testing clean function...' as status;
SELECT * FROM get_realtime_bus_status() LIMIT 3;

-- Success message
SELECT 'Clean function created successfully!' as status;
