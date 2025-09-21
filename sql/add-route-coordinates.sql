-- Add route coordinates and stops to the database
-- This script creates a stops table and adds sample route coordinates

-- Create stops table if it doesn't exist
CREATE TABLE IF NOT EXISTS stops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  stop_name VARCHAR(200) NOT NULL,
  stop_description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  stop_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stops_route_id ON stops(route_id);
CREATE INDEX IF NOT EXISTS idx_stops_stop_order ON stops(route_id, stop_order);

-- Add sample stops for existing routes
-- First, let's get some route IDs to work with
-- (This assumes you have routes in your database)

-- Sample stops for Metro Link Express (R001)
INSERT INTO stops (route_id, stop_name, stop_description, latitude, longitude, stop_order) 
SELECT 
  r.id,
  'Downtown Terminal',
  'Main downtown bus terminal',
  14.5995, 120.9842, 1
FROM routes r WHERE r.route_number = 'R001';

INSERT INTO stops (route_id, stop_name, stop_description, latitude, longitude, stop_order) 
SELECT 
  r.id,
  'Central Plaza',
  'Shopping and business district',
  14.6015, 120.9862, 2
FROM routes r WHERE r.route_number = 'R001';

INSERT INTO stops (route_id, stop_name, stop_description, latitude, longitude, stop_order) 
SELECT 
  r.id,
  'Business District',
  'Financial and corporate area',
  14.6035, 120.9882, 3
FROM routes r WHERE r.route_number = 'R001';

-- Sample stops for University Line (R003)
INSERT INTO stops (route_id, stop_name, stop_description, latitude, longitude, stop_order) 
SELECT 
  r.id,
  'Residential District',
  'Main residential area',
  14.5955, 120.9802, 1
FROM routes r WHERE r.route_number = 'R003';

INSERT INTO stops (route_id, stop_name, stop_description, latitude, longitude, stop_order) 
SELECT 
  r.id,
  'Shopping Center',
  'Major shopping mall',
  14.5975, 120.9822, 2
FROM routes r WHERE r.route_number = 'R003';

INSERT INTO stops (route_id, stop_name, stop_description, latitude, longitude, stop_order) 
SELECT 
  r.id,
  'University Campus',
  'Main university entrance',
  14.5995, 120.9842, 3
FROM routes r WHERE r.route_number = 'R003';

-- Sample stops for Airport Shuttle (R004)
INSERT INTO stops (route_id, stop_name, stop_description, latitude, longitude, stop_order) 
SELECT 
  r.id,
  'City Center',
  'Central business district',
  14.5995, 120.9842, 1
FROM routes r WHERE r.route_number = 'R004';

INSERT INTO stops (route_id, stop_name, stop_description, latitude, longitude, stop_order) 
SELECT 
  r.id,
  'Highway Junction',
  'Major highway intersection',
  14.6015, 120.9902, 2
FROM routes r WHERE r.route_number = 'R004';

INSERT INTO stops (route_id, stop_name, stop_description, latitude, longitude, stop_order) 
SELECT 
  r.id,
  'Airport Terminal',
  'International airport main terminal',
  14.5086, 121.0198, 3
FROM routes r WHERE r.route_number = 'R004';

-- Sample stops for Hospital Route (R005)
INSERT INTO stops (route_id, stop_name, stop_description, latitude, longitude, stop_order) 
SELECT 
  r.id,
  'Main Hospital',
  'Central hospital complex',
  14.5995, 120.9842, 1
FROM routes r WHERE r.route_number = 'R005';

INSERT INTO stops (route_id, stop_name, stop_description, latitude, longitude, stop_order) 
SELECT 
  r.id,
  'Medical Center',
  'Specialized medical facilities',
  14.6015, 120.9862, 2
FROM routes r WHERE r.route_number = 'R005';

-- Verify the data was inserted
SELECT 
  r.route_number,
  r.name as route_name,
  s.stop_name,
  s.stop_description,
  s.latitude,
  s.longitude,
  s.stop_order
FROM routes r
LEFT JOIN stops s ON r.id = s.route_id
WHERE r.route_number IN ('R001', 'R003', 'R004', 'R005')
ORDER BY r.route_number, s.stop_order;
