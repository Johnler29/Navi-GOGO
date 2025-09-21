-- Fix missing buses_with_tracking view and ensure all functions exist
-- This script addresses the "relation does not exist" error

-- 1. Create buses_with_tracking view
DROP VIEW IF EXISTS buses_with_tracking;

CREATE VIEW buses_with_tracking AS
SELECT 
    b.id,
    b.name,
    b.tracking_status,
    b.current_passengers,
    b.capacity_percentage,
    b.max_capacity,
    b.route_id,
    r.name as route_name,
    r.estimated_duration,
    r.fare,
    lu.latitude,
    lu.longitude,
    COALESCE(lu.speed_kmh, 0) as speed_kmh,
    COALESCE(lu.accuracy, 0) as accuracy,
    COALESCE(lu.is_moving, false) as is_moving,
    lu.created_at as tracking_updated_at,
    ds.status as driver_status,
    d.name as driver_name,
    CASE 
        WHEN lu.created_at > NOW() - INTERVAL '2 minutes' THEN 'live'
        WHEN lu.created_at > NOW() - INTERVAL '5 minutes' THEN 'recent'
        WHEN lu.created_at > NOW() - INTERVAL '15 minutes' THEN 'stale'
        ELSE 'offline'
    END as location_status,
    CASE 
        WHEN b.capacity_percentage >= 90 THEN 'full'
        WHEN b.capacity_percentage >= 70 THEN 'crowded'
        WHEN b.capacity_percentage >= 40 THEN 'moderate'
        WHEN b.capacity_percentage >= 10 THEN 'light'
        ELSE 'empty'
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

-- Grant permissions
GRANT SELECT ON buses_with_tracking TO authenticated;
GRANT SELECT ON buses_with_tracking TO anon;

-- 2. Ensure get_realtime_bus_status function exists
-- Add missing columns to location_updates if they don't exist
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS speed_kmh DECIMAL(5,2) DEFAULT 0;
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS accuracy DECIMAL(8,2) DEFAULT 0;
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS is_moving BOOLEAN DEFAULT false;
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS battery_level DECIMAL(5,2) DEFAULT 0;

-- Drop and recreate get_realtime_bus_status function
DROP FUNCTION IF EXISTS get_realtime_bus_status();

CREATE OR REPLACE FUNCTION get_realtime_bus_status()
RETURNS TABLE (
    bus_id UUID,
    bus_name VARCHAR(100),
    tracking_status VARCHAR(50),
    current_passengers INTEGER,
    capacity_percentage DECIMAL(5,2),
    max_capacity INTEGER,
    route_name VARCHAR(100),
    estimated_duration INTEGER,
    fare DECIMAL(10,2),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    speed_kmh DECIMAL(5,2),
    accuracy DECIMAL(8,2),
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
        r.estimated_duration,
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_realtime_bus_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_realtime_bus_status() TO anon;

-- 3. Ensure validate_bus_location function exists
DROP FUNCTION IF EXISTS validate_bus_location(UUID, DECIMAL, DECIMAL, DECIMAL);

CREATE OR REPLACE FUNCTION validate_bus_location(
    p_bus_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_accuracy DECIMAL DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    last_location RECORD;
    distance_km DECIMAL;
    time_diff INTERVAL;
BEGIN
    -- Get the last known location for this bus
    SELECT latitude, longitude, created_at
    INTO last_location
    FROM location_updates
    WHERE bus_id = p_bus_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Initialize result
    result := jsonb_build_object(
        'isValid', true,
        'reason', 'valid',
        'distance_km', 0,
        'time_diff_seconds', 0
    );
    
    -- Check if coordinates are within valid ranges
    IF p_latitude < -90 OR p_latitude > 90 THEN
        result := jsonb_build_object(
            'isValid', false,
            'reason', 'invalid_latitude',
            'distance_km', 0,
            'time_diff_seconds', 0
        );
        RETURN result;
    END IF;
    
    IF p_longitude < -180 OR p_longitude > 180 THEN
        result := jsonb_build_object(
            'isValid', false,
            'reason', 'invalid_longitude',
            'distance_km', 0,
            'time_diff_seconds', 0
        );
        RETURN result;
    END IF;
    
    -- If we have a previous location, check for unrealistic jumps
    IF last_location.latitude IS NOT NULL AND last_location.longitude IS NOT NULL THEN
        -- Calculate distance using Haversine formula (simplified)
        distance_km := 6371 * acos(
            cos(radians(p_latitude)) * cos(radians(last_location.latitude)) * 
            cos(radians(last_location.longitude) - radians(p_longitude)) + 
            sin(radians(p_latitude)) * sin(radians(last_location.latitude))
        );
        
        -- Calculate time difference
        time_diff := NOW() - last_location.created_at;
        
        -- Check for unrealistic movement (more than 100 km in less than 1 minute)
        IF distance_km > 100 AND EXTRACT(EPOCH FROM time_diff) < 60 THEN
            result := jsonb_build_object(
                'isValid', false,
                'reason', 'unrealistic_movement',
                'distance_km', distance_km,
                'time_diff_seconds', EXTRACT(EPOCH FROM time_diff)
            );
            RETURN result;
        END IF;
        
        -- Update result with calculated values
        result := jsonb_build_object(
            'isValid', true,
            'reason', 'valid',
            'distance_km', distance_km,
            'time_diff_seconds', EXTRACT(EPOCH FROM time_diff)
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_bus_location(UUID, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_bus_location(UUID, DECIMAL, DECIMAL, DECIMAL) TO anon;

-- 4. Ensure calculate_arrival_times function exists
DROP FUNCTION IF EXISTS calculate_arrival_times(UUID, DECIMAL, DECIMAL);

CREATE OR REPLACE FUNCTION calculate_arrival_times(
    p_bus_id UUID,
    p_passenger_lat DECIMAL,
    p_passenger_lng DECIMAL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    bus_location RECORD;
    route_info RECORD;
    distance_km DECIMAL;
    estimated_time_minutes INTEGER;
BEGIN
    -- Get bus location and route info
    SELECT 
        lu.latitude,
        lu.longitude,
        lu.speed_kmh,
        lu.created_at as last_update,
        r.estimated_duration,
        r.name as route_name
    INTO bus_location
    FROM buses b
    JOIN routes r ON b.route_id = r.id
    LEFT JOIN location_updates lu ON b.id = lu.bus_id
        AND lu.created_at = (
            SELECT MAX(created_at)
            FROM location_updates lu2
            WHERE lu2.bus_id = b.id
        )
    WHERE b.id = p_bus_id;
    
    -- Check if bus location exists
    IF bus_location.latitude IS NULL OR bus_location.longitude IS NULL THEN
        result := jsonb_build_object(
            'error', 'no_location_data',
            'message', 'Bus location not available'
        );
        RETURN result;
    END IF;
    
    -- Calculate distance using Haversine formula (simplified)
    distance_km := 6371 * acos(
        cos(radians(p_passenger_lat)) * cos(radians(bus_location.latitude)) * 
        cos(radians(bus_location.longitude) - radians(p_passenger_lng)) + 
        sin(radians(p_passenger_lat)) * sin(radians(bus_location.latitude))
    );
    
    -- Estimate arrival time based on distance and speed
    IF bus_location.speed_kmh > 0 THEN
        estimated_time_minutes := (distance_km / bus_location.speed_kmh) * 60;
    ELSE
        -- Use route estimated duration as fallback
        estimated_time_minutes := COALESCE(bus_location.estimated_duration, 30);
    END IF;
    
    -- Build result
    result := jsonb_build_object(
        'bus_id', p_bus_id,
        'route_name', bus_location.route_name,
        'distance_km', ROUND(distance_km::DECIMAL, 2),
        'estimated_arrival_minutes', estimated_time_minutes,
        'bus_speed_kmh', COALESCE(bus_location.speed_kmh, 0),
        'last_location_update', bus_location.last_update,
        'calculated_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_arrival_times(UUID, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_arrival_times(UUID, DECIMAL, DECIMAL) TO anon;

-- Add comments
COMMENT ON VIEW buses_with_tracking IS 'Combines bus information with latest tracking data for easy querying';
COMMENT ON FUNCTION get_realtime_bus_status() IS 'Returns real-time bus status with location and capacity information';
COMMENT ON FUNCTION validate_bus_location(UUID, DECIMAL, DECIMAL, DECIMAL) IS 'Validates bus location data for accuracy and reasonableness';
COMMENT ON FUNCTION calculate_arrival_times(UUID, DECIMAL, DECIMAL) IS 'Calculates estimated arrival times for passengers';
