-- Create a simple location update function that works with the current app
-- This function will update bus location without requiring complex parameters

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS update_bus_location_simple(uuid, numeric, numeric, numeric, numeric);

-- Create a simple location update function
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
  
  -- Insert into location_updates table
  INSERT INTO location_updates (
    bus_id,
    latitude,
    longitude,
    accuracy,
    speed_kmh,
    created_at
  ) VALUES (
    p_bus_id,
    p_latitude,
    p_longitude,
    p_accuracy,
    p_speed_kmh,
    NOW()
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
