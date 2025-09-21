-- Fix the simple location update function to handle driver_session_id constraint
-- Option 1: Make driver_session_id nullable and remove the foreign key constraint

-- First, let's make driver_session_id nullable
ALTER TABLE location_updates ALTER COLUMN driver_session_id DROP NOT NULL;

-- Drop the foreign key constraint
ALTER TABLE location_updates DROP CONSTRAINT IF EXISTS location_updates_driver_session_id_fkey;

-- Now create the updated function
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
BEGIN
  -- Update the bus location
  UPDATE buses 
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    last_location_update = NOW()
  WHERE id = p_bus_id;
  
  -- Insert into location_updates table without driver_session_id
  INSERT INTO location_updates (
    id,
    driver_id,
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
    (SELECT driver_id FROM buses WHERE id = p_bus_id),
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
  (SELECT id FROM buses LIMIT 1),
  14.5995,
  120.9842,
  10.0,
  25.0
);
