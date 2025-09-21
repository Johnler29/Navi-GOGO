-- ULTIMATE FINAL reset with fresh data - handles ALL possible foreign key constraints
-- This will clear everything and add fresh data in the correct order

-- Step 1: Clear all data in correct order (respecting ALL foreign key constraints)
-- Start with the most dependent tables first

-- Clear audit and logging tables
DELETE FROM comprehensive_audit_logs;
DELETE FROM location_update_log;

-- Clear feedback and user-related tables
DELETE FROM feedback;  -- This was the missing piece!

-- Clear location and tracking tables (these reference driver_sessions)
DELETE FROM location_updates;

-- Clear rate limiting and patterns
DELETE FROM rate_limits;
DELETE FROM location_patterns;

-- Clear driver sessions (now safe to delete)
DELETE FROM driver_sessions;

-- Clear assignment and schedule tables
DELETE FROM driver_bus_assignments;
DELETE FROM schedules;

-- Finally clear the main tables
DELETE FROM buses;
DELETE FROM drivers;
DELETE FROM routes;

-- Step 2: Insert fresh routes
INSERT INTO routes (id, name, description, start_location, end_location, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Route 1 - Downtown Express', 'Express service from downtown to airport', 'Downtown Terminal', 'Airport Terminal', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Route 2 - University Line', 'Service connecting university to city center', 'University Campus', 'City Center', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Route 3 - Suburban Loop', 'Circular route covering suburban areas', 'Suburban Station', 'Suburban Station', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Route 4 - Business District', 'Business district connector', 'Business Park', 'Financial District', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Route 5 - Residential Shuttle', 'Residential area shuttle service', 'Residential Area A', 'Residential Area B', NOW());

-- Step 3: Insert fresh drivers
INSERT INTO drivers (id, name, email, phone, license_number, is_admin, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'John Smith', 'john.smith@metrobus.com', '+1-555-0101', 'DL001234', false, NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', 'sarah.johnson@metrobus.com', '+1-555-0102', 'DL001235', false, NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'Mike Wilson', 'mike.wilson@metrobus.com', '+1-555-0103', 'DL001236', false, NOW()),
('660e8400-e29b-41d4-a716-446655440004', 'Emily Davis', 'emily.davis@metrobus.com', '+1-555-0104', 'DL001237', false, NOW()),
('660e8400-e29b-41d4-a716-446655440005', 'David Brown', 'david.brown@metrobus.com', '+1-555-0105', 'DL001238', false, NOW()),
('660e8400-e29b-41d4-a716-446655440006', 'Lisa Garcia', 'lisa.garcia@metrobus.com', '+1-555-0106', 'DL001239', false, NOW()),
('660e8400-e29b-41d4-a716-446655440007', 'Robert Miller', 'robert.miller@metrobus.com', '+1-555-0107', 'DL001240', false, NOW()),
('660e8400-e29b-41d4-a716-446655440008', 'Jennifer Taylor', 'jennifer.taylor@metrobus.com', '+1-555-0108', 'DL001241', false, NOW()),
('660e8400-e29b-41d4-a716-446655440009', 'Admin User', 'admin@metrobus.com', '+1-555-0000', 'DL000000', true, NOW());

-- Step 4: Insert fresh buses
INSERT INTO buses (id, bus_number, name, capacity, route_id, latitude, longitude, is_active, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', '001', 'Metro Express 1', 50, '550e8400-e29b-41d4-a716-446655440001', 40.7128, -74.0060, true, NOW()),
('770e8400-e29b-41d4-a716-446655440002', '002', 'Metro Express 2', 50, '550e8400-e29b-41d4-a716-446655440001', 40.7589, -73.9851, true, NOW()),
('770e8400-e29b-41d4-a716-446655440003', '003', 'University Shuttle 1', 40, '550e8400-e29b-41d4-a716-446655440002', 40.7505, -73.9934, true, NOW()),
('770e8400-e29b-41d4-a716-446655440004', '004', 'University Shuttle 2', 40, '550e8400-e29b-41d4-a716-446655440002', 40.7614, -73.9776, true, NOW()),
('770e8400-e29b-41d4-a716-446655440005', '005', 'Suburban Loop 1', 35, '550e8400-e29b-41d4-a716-446655440003', 40.6892, -74.0445, true, NOW()),
('770e8400-e29b-41d4-a716-446655440006', '006', 'Suburban Loop 2', 35, '550e8400-e29b-41d4-a716-446655440003', 40.6782, -73.9442, true, NOW()),
('770e8400-e29b-41d4-a716-446655440007', '007', 'Business Connector 1', 45, '550e8400-e29b-41d4-a716-446655440004', 40.7505, -73.9934, true, NOW()),
('770e8400-e29b-41d4-a716-446655440008', '008', 'Business Connector 2', 45, '550e8400-e29b-41d4-a716-446655440004', 40.7614, -73.9776, true, NOW()),
('770e8400-e29b-41d4-a716-446655440009', '009', 'Residential Shuttle 1', 30, '550e8400-e29b-41d4-a716-446655440005', 40.6892, -74.0445, true, NOW()),
('770e8400-e29b-41d4-a716-446655440010', '010', 'Residential Shuttle 2', 30, '550e8400-e29b-41d4-a716-446655440005', 40.6782, -73.9442, true, NOW());

-- Step 5: Create some initial assignments (optional)
INSERT INTO driver_bus_assignments (driver_id, bus_id, assigned_by, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', NULL, NOW()),
('660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', NULL, NOW()),
('660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', NULL, NOW()),
('660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440004', NULL, NOW()),
('660e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440005', NULL, NOW());

-- Step 6: Verify the data
SELECT 'Routes created:' as info, COUNT(*) as count FROM routes
UNION ALL
SELECT 'Drivers created:', COUNT(*) FROM drivers
UNION ALL
SELECT 'Buses created:', COUNT(*) FROM buses
UNION ALL
SELECT 'Assignments created:', COUNT(*) FROM driver_bus_assignments;

-- Step 7: Show sample data
SELECT 'Sample Routes:' as info, name, description FROM routes LIMIT 3;
SELECT 'Sample Drivers:' as info, name, email, license_number FROM drivers WHERE is_admin = false LIMIT 3;
SELECT 'Sample Buses:' as info, bus_number, name, capacity FROM buses LIMIT 3;
