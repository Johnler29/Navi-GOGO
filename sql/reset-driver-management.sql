-- Reset Driver Management - Complete cleanup and fresh start
-- This will clear all driver-related data and start fresh

-- Step 1: Show current state
SELECT 'Current state before reset:' as info;
SELECT 'Drivers count:' as info, COUNT(*) as count FROM drivers;
SELECT 'Buses count:' as info, COUNT(*) as count FROM buses;
SELECT 'Assignments count:' as info, COUNT(*) as count FROM driver_bus_assignments;

-- Step 2: Disable RLS temporarily for cleanup
ALTER TABLE driver_bus_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE buses DISABLE ROW LEVEL SECURITY;

-- Step 3: Clear all assignments first (due to foreign key constraints)
DELETE FROM driver_bus_assignments;

-- Step 4: Clear all drivers (except admins)
DELETE FROM drivers WHERE is_admin = false;

-- Step 5: Clear driver assignments from buses
UPDATE buses SET driver_id = NULL;

-- Step 6: Re-enable RLS
ALTER TABLE driver_bus_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;

-- Step 7: Create permissive policies for driver_bus_assignments
DROP POLICY IF EXISTS "Allow all operations" ON driver_bus_assignments;
CREATE POLICY "Allow all operations" ON driver_bus_assignments
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Step 8: Grant permissions
GRANT ALL ON driver_bus_assignments TO authenticated;
GRANT ALL ON driver_bus_assignments TO anon;
GRANT ALL ON driver_bus_assignments TO service_role;

-- Step 9: Create some sample drivers for testing
INSERT INTO drivers (name, email, phone, license_number, is_admin) VALUES
('John Smith', 'john.smith@metrobus.com', '+1234567890', 'DL123456', false),
('Jane Doe', 'jane.doe@metrobus.com', '+1234567891', 'DL123457', false),
('Mike Johnson', 'mike.johnson@metrobus.com', '+1234567892', 'DL123458', false),
('Sarah Wilson', 'sarah.wilson@metrobus.com', '+1234567893', 'DL123459', false),
('Admin User', 'admin@metrobus.com', '+1234567899', 'DL999999', true);

-- Step 10: Show final state
SELECT 'Reset completed successfully!' as info;
SELECT 'Final drivers count:' as info, COUNT(*) as count FROM drivers;
SELECT 'Final buses count:' as info, COUNT(*) as count FROM buses;
SELECT 'Final assignments count:' as info, COUNT(*) as count FROM driver_bus_assignments;

-- Step 11: Show the sample drivers
SELECT 'Sample drivers created:' as info;
SELECT name, email, license_number, is_admin FROM drivers ORDER BY name;
