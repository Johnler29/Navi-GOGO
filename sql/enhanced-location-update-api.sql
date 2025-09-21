-- Enhanced Location Update API with Comprehensive Validation
-- Phase 3: Backend Processing

-- Drop existing function to recreate with enhanced validation
DROP FUNCTION IF EXISTS update_bus_location(uuid, numeric, numeric, numeric, numeric, numeric, numeric, boolean) CASCADE;

-- Enhanced Location Update Function with Validation
CREATE OR REPLACE FUNCTION update_bus_location_enhanced(
  session_uuid uuid,
  lat numeric,
  lng numeric,
  accuracy_param numeric DEFAULT NULL,
  speed_param numeric DEFAULT NULL,
  heading_param numeric DEFAULT NULL,
  battery_level_param numeric DEFAULT NULL,
  is_moving_param boolean DEFAULT true,
  device_info jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record record;
  location_id uuid;
  validation_result jsonb;
  previous_location record;
  distance_km numeric;
  max_speed_kmh numeric := 120; -- Maximum reasonable speed for a bus
  max_distance_km numeric := 50; -- Maximum distance between updates (50km)
  result jsonb;
BEGIN
  -- Step 1: Validate Session
  SELECT ds.*, b.name as bus_name, b.bus_number, d.name as driver_name
  INTO session_record
  FROM driver_sessions ds
  JOIN buses b ON b.id = ds.bus_id
  JOIN drivers d ON d.id = ds.driver_id
  WHERE ds.id = session_uuid 
    AND ds.status = 'active'
    AND ds.ended_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_SESSION',
      'message', 'Invalid or inactive driver session',
      'session_id', session_uuid
    );
  END IF;

  -- Step 2: Validate Driver Assignment
  IF session_record.driver_id != session_record.driver_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DRIVER_MISMATCH',
      'message', 'Driver is not assigned to this bus',
      'driver_id', session_record.driver_id,
      'bus_id', session_record.bus_id
    );
  END IF;

  -- Step 3: Validate Location Coordinates
  IF lat IS NULL OR lng IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_COORDINATES',
      'message', 'Latitude and longitude are required',
      'latitude', lat,
      'longitude', lng
    );
  END IF;

  -- Check coordinate bounds (reasonable world coordinates)
  IF lat < -90 OR lat > 90 OR lng < -180 OR lng > 180 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'COORDINATES_OUT_OF_BOUNDS',
      'message', 'Coordinates are outside valid range',
      'latitude', lat,
      'longitude', lng
    );
  END IF;

  -- Step 4: Validate Location Accuracy
  IF accuracy_param IS NOT NULL AND accuracy_param > 100 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'POOR_ACCURACY',
      'message', 'Location accuracy is too poor (>100m)',
      'accuracy', accuracy_param
    );
  END IF;

  -- Step 5: Get Previous Location for Validation
  SELECT latitude, longitude, created_at, speed
  INTO previous_location
  FROM location_updates
  WHERE bus_id = session_record.bus_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Step 6: Validate Movement (if previous location exists)
  IF previous_location IS NOT NULL THEN
    -- Calculate distance using Haversine formula (simplified)
    distance_km := (
      6371 * acos(
        cos(radians(previous_location.latitude)) * 
        cos(radians(lat)) * 
        cos(radians(lng) - radians(previous_location.longitude)) + 
        sin(radians(previous_location.latitude)) * 
        sin(radians(lat))
      )
    );

    -- Check for unreasonable distance jumps
    IF distance_km > max_distance_km THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'UNREASONABLE_DISTANCE',
        'message', 'Location jump is too large (possible GPS error)',
        'distance_km', distance_km,
        'max_allowed_km', max_distance_km,
        'previous_location', jsonb_build_object(
          'lat', previous_location.latitude,
          'lng', previous_location.longitude,
          'timestamp', previous_location.created_at
        )
      );
    END IF;

    -- Validate speed if provided
    IF speed_param IS NOT NULL AND speed_param > max_speed_kmh THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'UNREASONABLE_SPEED',
        'message', 'Reported speed is too high for a bus',
        'speed_kmh', speed_param,
        'max_allowed_kmh', max_speed_kmh
      );
    END IF;
  END IF;

  -- Step 7: Insert Location Update
  INSERT INTO location_updates(
    id,
    driver_session_id,
    bus_id,
    driver_id,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    battery_level,
    is_moving,
    device_info,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    session_record.id,
    session_record.bus_id,
    session_record.driver_id,
    lat,
    lng,
    accuracy_param,
    speed_param,
    heading_param,
    battery_level_param,
    is_moving_param,
    device_info,
    now()
  )
  RETURNING id INTO location_id;

  -- Step 8: Update Bus Table with Latest Position
  UPDATE buses
  SET 
    latitude = lat,
    longitude = lng,
    speed = COALESCE(speed_param, speed),
    heading = COALESCE(heading_param, heading),
    tracking_status = CASE 
      WHEN is_moving_param THEN 'moving' 
      ELSE 'stopped' 
    END,
    last_location_update = now(),
    updated_at = now()
  WHERE id = session_record.bus_id;

  -- Step 9: Update Driver Session Activity
  UPDATE driver_sessions
  SET 
    last_activity = now(),
    updated_at = now()
  WHERE id = session_uuid;

  -- Step 10: Build Success Response
  result := jsonb_build_object(
    'success', true,
    'location_id', location_id,
    'session_info', jsonb_build_object(
      'session_id', session_record.id,
      'driver_name', session_record.driver_name,
      'bus_name', session_record.bus_name,
      'bus_number', session_record.bus_number
    ),
    'location_data', jsonb_build_object(
      'latitude', lat,
      'longitude', lng,
      'accuracy', accuracy_param,
      'speed', speed_param,
      'heading', heading_param,
      'is_moving', is_moving_param,
      'timestamp', now()
    ),
    'validation', jsonb_build_object(
      'distance_from_previous', COALESCE(distance_km, 0),
      'accuracy_acceptable', COALESCE(accuracy_param <= 100, true),
      'speed_reasonable', COALESCE(speed_param <= max_speed_kmh, true)
    )
  );

  -- Step 11: Log successful update (optional)
  INSERT INTO location_update_log (
    location_update_id,
    session_id,
    bus_id,
    driver_id,
    validation_result,
    created_at
  ) VALUES (
    location_id,
    session_uuid,
    session_record.bus_id,
    session_record.driver_id,
    result,
    now()
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details for debugging
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INTERNAL_ERROR',
      'message', SQLERRM,
      'error_code', SQLSTATE,
      'session_id', session_uuid
    );
END;
$$;

-- Create logging table for location updates
CREATE TABLE IF NOT EXISTS location_update_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_update_id uuid REFERENCES location_updates(id),
  session_id uuid REFERENCES driver_sessions(id),
  bus_id uuid REFERENCES buses(id),
  driver_id uuid REFERENCES drivers(id),
  validation_result jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_update_log_session ON location_update_log(session_id);
CREATE INDEX IF NOT EXISTS idx_location_update_log_bus ON location_update_log(bus_id);
CREATE INDEX IF NOT EXISTS idx_location_update_log_created ON location_update_log(created_at);

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_bus_location_enhanced TO authenticated;
GRANT ALL ON location_update_log TO authenticated;

-- Create RLS policies for logging table
ALTER TABLE location_update_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view location logs" ON location_update_log
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow system to insert location logs" ON location_update_log
FOR INSERT TO authenticated
WITH CHECK (true);

-- Test the enhanced function
SELECT update_bus_location_enhanced(
  session_uuid => (SELECT id FROM driver_sessions WHERE status = 'active' LIMIT 1),
  lat => 14.140965,
  lng => 120.9689883,
  accuracy_param => 5,
  speed_param => 25,
  heading_param => 180,
  battery_level_param => 0.85,
  is_moving_param => true,
  device_info => '{"platform": "android", "app_version": "1.0.0"}'::jsonb
);
