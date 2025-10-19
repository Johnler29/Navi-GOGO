-- Complete Route Management Setup
-- Run this script in Supabase SQL Editor to set up the entire route management system

-- ========================================
-- STEP 1: Create the main database schema first
-- ========================================

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS stops CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create tables in correct order

-- Routes table (create first since buses references it)
CREATE TABLE routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_number VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  start_location VARCHAR(200),
  end_location VARCHAR(200),
  -- New fields used by the app
  origin TEXT,
  destination TEXT,
  estimated_duration INTEGER, -- in minutes
  fare DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table (create before buses since buses references it)
CREATE TABLE drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  name VARCHAR(100) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  license_number VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(100),
  password_hash VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buses table with integrated tracking
CREATE TABLE buses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_number VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  capacity INTEGER DEFAULT 50,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  route_id UUID REFERENCES routes(id),
  driver_id UUID REFERENCES drivers(id),
  -- Integrated tracking fields
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  speed DECIMAL(5, 2),
  heading INTEGER,
  tracking_status VARCHAR(20) DEFAULT 'moving' CHECK (tracking_status IN ('moving', 'stopped', 'at_stop')),
  last_location_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT buses_bus_number_key UNIQUE (bus_number)
);

-- Stops table
CREATE TABLE stops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  route_id UUID REFERENCES routes(id),
  sequence INTEGER, -- order of stops in a route
  estimated_time_to_next INTEGER, -- minutes to next stop
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (for passengers)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedules table
CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES routes(id),
  bus_id UUID REFERENCES buses(id),
  departure_time TIME NOT NULL,
  arrival_time TIME,
  days_of_week INTEGER[], -- 1=Monday, 2=Tuesday, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  bus_id UUID REFERENCES buses(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  feedback_type VARCHAR(50) DEFAULT 'general',
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- STEP 2: Add route management enhancements
-- ========================================

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

-- ========================================
-- STEP 3: Create helper functions
-- ========================================

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
            'name', s.name,
            'description', s.address,
            'latitude', s.latitude,
            'longitude', s.longitude,
            'stop_order', s.sequence,
            'is_active', true
          ) ORDER BY s.sequence
        )
        FROM stops s 
        WHERE s.route_id = r.id
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
            'name', s.name,
            'description', s.address,
            'latitude', s.latitude,
            'longitude', s.longitude,
            'stop_order', s.sequence,
            'is_active', true
          ) ORDER BY s.sequence
        )
        FROM stops s 
        WHERE s.route_id = r.id
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
  -- First, delete all existing stops for this route
  DELETE FROM stops WHERE route_id = route_id_param;
  
  -- Insert stops from the JSONB array
  FOR stop_item IN SELECT * FROM jsonb_array_elements(stops_param)
  LOOP
    INSERT INTO stops (
      route_id,
      name,
      address,
      latitude,
      longitude,
      sequence
    ) VALUES (
      route_id_param,
      (stop_item->>'name'),
      (stop_item->>'description'),
      (stop_item->>'latitude')::DECIMAL(10,8),
      (stop_item->>'longitude')::DECIMAL(11,8),
      stop_order
    );
    
    stop_order := stop_order + 1;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 4: Insert sample data
-- ========================================

-- Insert sample routes
INSERT INTO routes (route_number, name, description, start_location, end_location, origin, destination, estimated_duration, fare, route_color, stroke_width) VALUES
('R001', 'Dasmarinas - Alabang', 'Main route from Dasmarinas to Alabang', 'Dasmarinas City', 'Alabang', 'Dasmarinas City, Cavite', 'Alabang, Muntinlupa', 45, 25.00, '#3B82F6', 5),
('R002', 'Dasmarinas - Manila', 'Route from Dasmarinas to Manila', 'Dasmarinas City', 'Manila City', 'Dasmarinas City, Cavite', 'Manila City', 90, 50.00, '#10B981', 5),
('R003', 'Dasmarinas - Makati', 'Route from Dasmarinas to Makati', 'Dasmarinas City', 'Makati City', 'Dasmarinas City, Cavite', 'Makati City', 75, 45.00, '#F59E0B', 5)
ON CONFLICT (route_number) DO NOTHING;

-- Insert sample drivers
INSERT INTO drivers (first_name, last_name, license_number, phone, email) VALUES
('Juan', 'Dela Cruz', 'DL123456789', '+639123456789', 'juan.delacruz@metro.com'),
('Maria', 'Santos', 'DL987654321', '+639987654321', 'maria.santos@metro.com'),
('Pedro', 'Reyes', 'DL456789123', '+639456789123', 'pedro.reyes@metro.com')
ON CONFLICT (license_number) DO NOTHING;

-- Insert sample buses
INSERT INTO buses (bus_number, name, capacity, route_id, driver_id, latitude, longitude, speed, heading, tracking_status, last_location_update) VALUES
('B001', 'Metro Link Bus # 20', 50, (SELECT id FROM routes WHERE route_number = 'R001'), (SELECT id FROM drivers WHERE license_number = 'DL123456789'), 14.3294, 120.9366, 35.5, 90, 'moving', NOW()),
('B002', 'Metro Link Bus # 15', 50, (SELECT id FROM routes WHERE route_number = 'R002'), (SELECT id FROM drivers WHERE license_number = 'DL987654321'), 14.4591, 120.9468, 0.0, 0, 'stopped', NOW()),
('B003', 'Metro Link Bus # 10', 50, (SELECT id FROM routes WHERE route_number = 'R003'), (SELECT id FROM drivers WHERE license_number = 'DL456789123'), 14.5995, 120.9842, 28.3, 180, 'moving', NOW())
ON CONFLICT (bus_number) DO NOTHING;

-- Add sample route coordinates
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
WHERE route_number = 'R001';

-- Add sample stops
INSERT INTO stops (name, address, latitude, longitude, route_id, sequence, estimated_time_to_next) VALUES
('Dasmarinas Terminal', 'Dasmarinas City, Cavite', 14.3294, 120.9366, (SELECT id FROM routes WHERE route_number = 'R001'), 1, 15),
('Imus Plaza', 'Imus City Plaza area', 14.3394, 120.9466, (SELECT id FROM routes WHERE route_number = 'R001'), 2, 20),
('Bacoor Bayan', 'Bacoor City Hall area', 14.3514, 120.9586, (SELECT id FROM routes WHERE route_number = 'R001'), 3, 15),
('Las Piñas City Hall', 'Las Piñas City Hall area', 14.3714, 120.9786, (SELECT id FROM routes WHERE route_number = 'R001'), 4, 10),
('Alabang Terminal', 'Alabang bus terminal', 14.3994, 121.0066, (SELECT id FROM routes WHERE route_number = 'R001'), 5, 0);

-- Add sample schedules
INSERT INTO schedules (route_id, bus_id, departure_time, arrival_time, days_of_week, is_active) VALUES
((SELECT id FROM routes WHERE route_number = 'R001'), (SELECT id FROM buses WHERE bus_number = 'B001'), '06:00', '07:30', '{1,2,3,4,5}', true),
((SELECT id FROM routes WHERE route_number = 'R001'), (SELECT id FROM buses WHERE bus_number = 'B001'), '08:00', '09:30', '{1,2,3,4,5}', true),
((SELECT id FROM routes WHERE route_number = 'R002'), (SELECT id FROM buses WHERE bus_number = 'B002'), '07:00', '08:30', '{1,2,3,4,5}', true),
((SELECT id FROM routes WHERE route_number = 'R003'), (SELECT id FROM buses WHERE bus_number = 'B003'), '09:00', '10:15', '{1,2,3,4,5}', true);

-- Add sample users
INSERT INTO users (name, email, phone) VALUES
('John Doe', 'john.doe@example.com', '+639123456789'),
('Jane Smith', 'jane.smith@example.com', '+639987654321'),
('Mike Johnson', 'mike.johnson@example.com', '+639456789123');

-- Add sample feedback
INSERT INTO feedback (user_id, bus_id, rating, comment, feedback_type) VALUES
((SELECT id FROM users WHERE email = 'john.doe@example.com'), (SELECT id FROM buses WHERE bus_number = 'B001'), 5, 'Great service!', 'general'),
((SELECT id FROM users WHERE email = 'jane.smith@example.com'), (SELECT id FROM buses WHERE bus_number = 'B002'), 4, 'Good but could be cleaner', 'general');

-- ========================================
-- STEP 5: Set up permissions and policies
-- ========================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_route_with_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_routes_with_details() TO authenticated;
GRANT EXECUTE ON FUNCTION update_route_coordinates(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_route_stops(UUID, JSONB) TO authenticated;

-- Add RLS policies
CREATE POLICY "Users can view route details" ON routes
  FOR SELECT USING (true);

CREATE POLICY "Users can view stops" ON stops
  FOR SELECT USING (true);

-- Add comments
COMMENT ON FUNCTION get_route_with_details IS 'Get a single route with all its details including coordinates and stops';
COMMENT ON FUNCTION get_all_routes_with_details IS 'Get all routes with their details including coordinates and stops';
COMMENT ON FUNCTION update_route_coordinates IS 'Update route coordinates for visualization';
COMMENT ON FUNCTION upsert_route_stops IS 'Add or update route stops from JSONB data';

-- ========================================
-- STEP 6: Verify the setup
-- ========================================

-- Test the functions
SELECT 'Setup completed successfully!' as status;

-- Show sample data
SELECT 
  r.route_number,
  r.name,
  r.origin,
  r.destination,
  r.route_color,
  r.stroke_width,
  CASE 
    WHEN r.route_coordinates IS NOT NULL THEN jsonb_array_length(r.route_coordinates)
    ELSE 0
  END as coordinate_count
FROM routes r
ORDER BY r.route_number;
