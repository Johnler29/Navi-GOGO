-- Enhance routes table for admin route management
-- This script adds fields needed for route visualization and management

-- Add new fields to routes table for route visualization
ALTER TABLE routes ADD COLUMN IF NOT EXISTS route_color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE routes ADD COLUMN IF NOT EXISTS stroke_width INTEGER DEFAULT 5;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS route_coordinates JSONB;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing routes with default colors if they don't have them
UPDATE routes 
SET route_color = CASE 
  WHEN route_number = 'R001' THEN '#3B82F6'  -- Blue
  WHEN route_number = 'R002' THEN '#10B981'  -- Green  
  WHEN route_number = 'R003' THEN '#F59E0B'  -- Orange
  ELSE '#6B7280'  -- Gray
END
WHERE route_color IS NULL;

-- Update existing routes with stroke width if they don't have it
UPDATE routes 
SET stroke_width = 5
WHERE stroke_width IS NULL;

-- Update existing routes to set is_active based on status
UPDATE routes 
SET is_active = (status = 'active')
WHERE is_active IS NULL;

-- Create a function to get route with coordinates and stops
CREATE OR REPLACE FUNCTION get_route_with_details(route_id_param UUID)
RETURNS TABLE (
  id UUID,
  route_number VARCHAR(20),
  name VARCHAR(100),
  description TEXT,
  start_location VARCHAR(200),
  end_location VARCHAR(200),
  origin TEXT,
  destination TEXT,
  estimated_duration INTEGER,
  fare DECIMAL(10,2),
  status VARCHAR(20),
  route_color VARCHAR(7),
  stroke_width INTEGER,
  route_coordinates JSONB,
  is_active BOOLEAN,
  stops JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.route_number,
    r.name,
    r.description,
    r.start_location,
    r.end_location,
    r.origin,
    r.destination,
    r.estimated_duration,
    r.fare,
    r.status,
    r.route_color,
    r.stroke_width,
    r.route_coordinates,
    r.is_active,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'name', s.stop_name,
            'description', s.stop_description,
            'latitude', s.latitude,
            'longitude', s.longitude,
            'stop_order', s.stop_order,
            'is_active', s.is_active
          ) ORDER BY s.stop_order
        )
        FROM stops s 
        WHERE s.route_id = r.id AND s.is_active = true
      ),
      '[]'::jsonb
    ) as stops,
    r.created_at,
    r.updated_at
  FROM routes r
  WHERE r.id = route_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get all routes with their details
CREATE OR REPLACE FUNCTION get_all_routes_with_details()
RETURNS TABLE (
  id UUID,
  route_number VARCHAR(20),
  name VARCHAR(100),
  description TEXT,
  start_location VARCHAR(200),
  end_location VARCHAR(200),
  origin TEXT,
  destination TEXT,
  estimated_duration INTEGER,
  fare DECIMAL(10,2),
  status VARCHAR(20),
  route_color VARCHAR(7),
  stroke_width INTEGER,
  route_coordinates JSONB,
  is_active BOOLEAN,
  stops JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.route_number,
    r.name,
    r.description,
    r.start_location,
    r.end_location,
    r.origin,
    r.destination,
    r.estimated_duration,
    r.fare,
    r.status,
    r.route_color,
    r.stroke_width,
    r.route_coordinates,
    r.is_active,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'name', s.stop_name,
            'description', s.stop_description,
            'latitude', s.latitude,
            'longitude', s.longitude,
            'stop_order', s.stop_order,
            'is_active', s.is_active
          ) ORDER BY s.stop_order
        )
        FROM stops s 
        WHERE s.route_id = r.id AND s.is_active = true
      ),
      '[]'::jsonb
    ) as stops,
    r.created_at,
    r.updated_at
  FROM routes r
  ORDER BY r.route_number;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update route coordinates
CREATE OR REPLACE FUNCTION update_route_coordinates(
  route_id_param UUID,
  coordinates_param JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE routes 
  SET 
    route_coordinates = coordinates_param,
    updated_at = NOW()
  WHERE id = route_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to add/update route stops
CREATE OR REPLACE FUNCTION upsert_route_stops(
  route_id_param UUID,
  stops_param JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  stop_item JSONB;
  stop_order INTEGER := 1;
BEGIN
  -- First, deactivate all existing stops for this route
  UPDATE stops 
  SET is_active = false, updated_at = NOW()
  WHERE route_id = route_id_param;
  
  -- Insert/update stops from the JSONB array
  FOR stop_item IN SELECT * FROM jsonb_array_elements(stops_param)
  LOOP
    INSERT INTO stops (
      route_id,
      stop_name,
      stop_description,
      latitude,
      longitude,
      stop_order,
      is_active
    ) VALUES (
      route_id_param,
      (stop_item->>'name'),
      (stop_item->>'description'),
      (stop_item->>'latitude')::DECIMAL(10,8),
      (stop_item->>'longitude')::DECIMAL(11,8),
      stop_order,
      true
    )
    ON CONFLICT (route_id, stop_order) 
    DO UPDATE SET
      stop_name = EXCLUDED.stop_name,
      stop_description = EXCLUDED.stop_description,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      is_active = true,
      updated_at = NOW();
    
    stop_order := stop_order + 1;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add some sample route coordinates for existing routes
UPDATE routes 
SET route_coordinates = '[
  {"latitude": 14.3294, "longitude": 120.9366},
  {"latitude": 14.3314, "longitude": 120.9386},
  {"latitude": 14.3334, "longitude": 120.9406},
  {"latitude": 14.3394, "longitude": 120.9466},
  {"latitude": 14.3514, "longitude": 120.9586},
  {"latitude": 14.3674, "longitude": 120.9746},
  {"latitude": 14.3754, "longitude": 120.9826},
  {"latitude": 14.3834, "longitude": 120.9906},
  {"latitude": 14.3874, "longitude": 120.9946},
  {"latitude": 14.3914, "longitude": 120.9986},
  {"latitude": 14.3954, "longitude": 121.0026},
  {"latitude": 14.3994, "longitude": 121.0066}
]'::jsonb
WHERE route_number = 'R001' AND route_coordinates IS NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_route_with_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_routes_with_details() TO authenticated;
GRANT EXECUTE ON FUNCTION update_route_coordinates(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_route_stops(UUID, JSONB) TO authenticated;

-- Add RLS policies for the new functions
CREATE POLICY "Users can view route details" ON routes
  FOR SELECT USING (true);

CREATE POLICY "Users can view stops" ON stops
  FOR SELECT USING (true);

COMMENT ON FUNCTION get_route_with_details IS 'Get a single route with all its details including coordinates and stops';
COMMENT ON FUNCTION get_all_routes_with_details IS 'Get all routes with their details including coordinates and stops';
COMMENT ON FUNCTION update_route_coordinates IS 'Update route coordinates for visualization';
COMMENT ON FUNCTION upsert_route_stops IS 'Add or update route stops from JSONB data';
