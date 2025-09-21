-- Fix the simple location update function to handle driver_session_id constraint
-- Option 2: Create or find an existing driver session

-- First, let's check if there are any existing driver sessions
SELECT COUNT(*) as existing_sessions FROM driver_sessions;

-- Create the updated function that handles driver sessions properly
DROP FUNCTION IF EXISTS update_bus_location_simple(uuid, numeric, numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION update_bus_location_simple(
  p_bus_id uuid,
  p_latitude numeric,
  p_longitude numeric,
  p_accuracy numeric DEFAULT NULL,
  p_speed_kmh numeric DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  v_driver_id uuid;
  v_session_id uuid;
BEGIN
  -- Get the driver_id from the bus
  SELECT driver_id INTO v_driver_id FROM buses WHERE id = p_bus_id;
  
  -- If no driver assigned, return error
  IF v_driver_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No driver assigned to this bus',
      'bus_id', p_bus_id
    );
  END IF;
  
  -- Find an existing active driver session or create a new one
  SELECT id INTO v_session_id 
  FROM driver_sessions 
  WHERE driver_id = v_driver_id 
    AND status = 'active' 
    AND ended_at IS NULL
  ORDER BY started_at DESC 
  LIMIT 1;
  
  -- If no active session found, create a new one
  IF v_session_id IS NULL THEN
    INSERT INTO driver_sessions (id, driver_id, bus_id, status, started_at)
    VALUES (gen_random_uuid(), v_driver_id, p_bus_id, 'active', NOW())
    RETURNING id INTO v_session_id;
  END IF;
  
  -- Update the bus location
  UPDATE buses 
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    last_location_update = NOW()
  WHERE id = p_bus_id;
  
  -- Insert into location_updates table with valid driver_session_id
  INSERT INTO location_updates (
    id,
    driver_id,
    driver_session_id,
    bus_id,
    latitude,
    longitude,
    accuracy,
    altitude,
    speed,
    heading,
    battery_level,
    is_moving,
    location_source,
    created_at,
    device_info,
    speed_kmh
  ) VALUES (
    gen_random_uuid(),
    v_driver_id,
    v_session_id,
    p_bus_id,
    p_latitude,
    p_longitude,
    p_accuracy,
    NULL, -- altitude
    NULL, -- speed
    NULL, -- heading
    NULL, -- battery_level
    true, -- is_moving
    'gps', -- location_source
    NOW(),
    '{}', -- device_info
    p_speed_kmh
  );
  
  -- Return success response
  result := json_build_object(
    'success', true,
    'message', 'Location updated successfully',
    'bus_id', p_bus_id,
    'driver_id', v_driver_id,
    'session_id', v_session_id,
    'latitude', p_latitude,
    'longitude', p_longitude,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_bus_location_simple(uuid, numeric, numeric, numeric, numeric) TO authenticated;

-- Test the function
SELECT update_bus_location_simple(
  (SELECT id FROM buses WHERE driver_id IS NOT NULL LIMIT 1),
  14.5995,
  120.9842,
  10.0,
  25.0
);
