-- File: sql/insert-sample-data.sql
-- This script inserts sample data for testing the real-time tracking system
-- Run this AFTER completing the main setup scripts

-- Insert sample drivers
-- Check which unique constraints exist and use the appropriate one
DO $$
BEGIN
  -- Check if email is unique (added by add-driver-authentication-fields.sql)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'drivers' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name LIKE '%email%'
  ) THEN
    -- Use email as conflict resolution
    INSERT INTO drivers (name, email, phone_number, license_number, license_expiry, driver_status, is_active)
    VALUES 
      ('John Doe', 'john.doe@metrobus.com', '+1234567890', 'DL123456', '2025-12-31', 'off-duty', true),
      ('Jane Smith', 'jane.smith@metrobus.com', '+1234567891', 'DL123457', '2025-11-30', 'off-duty', true),
      ('Mike Johnson', 'mike.johnson@metrobus.com', '+1234567892', 'DL123458', '2025-10-31', 'off-duty', true)
    ON CONFLICT (email) DO NOTHING;
  ELSE
    -- Use license_number as conflict resolution (original schema)
    INSERT INTO drivers (name, email, phone_number, license_number, license_expiry, driver_status, is_active)
    VALUES 
      ('John Doe', 'john.doe@metrobus.com', '+1234567890', 'DL123456', '2025-12-31', 'off-duty', true),
      ('Jane Smith', 'jane.smith@metrobus.com', '+1234567891', 'DL123457', '2025-11-30', 'off-duty', true),
      ('Mike Johnson', 'mike.johnson@metrobus.com', '+1234567892', 'DL123458', '2025-10-31', 'off-duty', true)
    ON CONFLICT (license_number) DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Sample drivers inserted successfully!';
END $$;

-- Insert sample routes (if they don't exist)
INSERT INTO routes (route_number, origin, destination, distance_km, estimated_duration_minutes)
VALUES 
  ('101', 'Downtown Station', 'Airport Terminal', 15.5, 45),
  ('102', 'Central Mall', 'University Campus', 8.2, 25),
  ('103', 'Suburb Plaza', 'City Center', 12.8, 35)
ON CONFLICT (route_number) DO NOTHING;

-- Insert sample buses (if they don't exist)
INSERT INTO buses (bus_number, name, capacity, max_capacity, capacity_percentage, route_id, tracking_status)
SELECT 
  'BUS-001',
  'Metro Express 1',
  50,
  50,
  0,
  r.id,
  'active'
FROM routes r 
WHERE r.route_number = '101'
ON CONFLICT (bus_number) DO NOTHING;

INSERT INTO buses (bus_number, name, capacity, max_capacity, capacity_percentage, route_id, tracking_status)
SELECT 
  'BUS-002',
  'Metro Express 2',
  45,
  45,
  0,
  r.id,
  'active'
FROM routes r 
WHERE r.route_number = '102'
ON CONFLICT (bus_number) DO NOTHING;

INSERT INTO buses (bus_number, name, capacity, max_capacity, capacity_percentage, route_id, tracking_status)
SELECT 
  'BUS-003',
  'Metro Express 3',
  40,
  40,
  0,
  r.id,
  'active'
FROM routes r 
WHERE r.route_number = '103'
ON CONFLICT (bus_number) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Sample data inserted successfully!';
  RAISE NOTICE 'You now have sample drivers, routes, and buses for testing.';
  RAISE NOTICE 'Run the test script to verify everything is working: \i sql/test-realtime-setup.sql';
END $$;
