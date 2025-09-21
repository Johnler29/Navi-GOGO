-- File: sql/insert-basic-sample-data.sql
-- This script inserts basic sample data using only the original schema columns
-- Use this if you haven't run add-driver-authentication-fields.sql yet

-- Insert sample drivers (using only original schema columns)
INSERT INTO drivers (name, license_number, phone, email)
VALUES 
  ('John Doe', 'DL123456', '+1234567890', 'john.doe@metrobus.com'),
  ('Jane Smith', 'DL123457', '+1234567891', 'jane.smith@metrobus.com'),
  ('Mike Johnson', 'DL123458', '+1234567892', 'mike.johnson@metrobus.com')
ON CONFLICT (license_number) DO NOTHING;

-- Insert sample routes (if they don't exist)
INSERT INTO routes (route_number, name, origin, destination, estimated_duration, fare)
VALUES 
  ('101', 'Downtown to Airport', 'Downtown Station', 'Airport Terminal', 45, 2.50),
  ('102', 'Mall to University', 'Central Mall', 'University Campus', 25, 1.75),
  ('103', 'Suburb to City Center', 'Suburb Plaza', 'City Center', 35, 2.00)
ON CONFLICT (route_number) DO NOTHING;

-- Insert sample buses (if they don't exist)
INSERT INTO buses (bus_number, name, capacity, route_id, tracking_status)
SELECT 
  'BUS-001',
  'Metro Express 1',
  50,
  r.id,
  'moving'
FROM routes r 
WHERE r.route_number = '101'
ON CONFLICT (bus_number) DO NOTHING;

INSERT INTO buses (bus_number, name, capacity, route_id, tracking_status)
SELECT 
  'BUS-002',
  'Metro Express 2',
  45,
  r.id,
  'moving'
FROM routes r 
WHERE r.route_number = '102'
ON CONFLICT (bus_number) DO NOTHING;

INSERT INTO buses (bus_number, name, capacity, route_id, tracking_status)
SELECT 
  'BUS-003',
  'Metro Express 3',
  40,
  r.id,
  'moving'
FROM routes r 
WHERE r.route_number = '103'
ON CONFLICT (bus_number) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Basic sample data inserted successfully!';
  RAISE NOTICE 'This uses only the original schema columns.';
  RAISE NOTICE 'Run add-driver-authentication-fields.sql to add more features.';
END $$;
