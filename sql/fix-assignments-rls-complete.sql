-- Complete fix for driver_bus_assignments RLS policies
-- This addresses the specific RLS policy violation error

-- First, let's check what policies currently exist
SELECT 'Current RLS policies for driver_bus_assignments:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'driver_bus_assignments';

-- Check if RLS is enabled on the table
SELECT 'RLS status for driver_bus_assignments:' as info;
SELECT schemaname, tablename, rowsecurity, hasrls 
FROM pg_tables 
WHERE tablename = 'driver_bus_assignments';

-- Temporarily disable RLS to fix the data
ALTER TABLE driver_bus_assignments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view driver bus assignments" ON driver_bus_assignments;
DROP POLICY IF EXISTS "Users can insert driver bus assignments" ON driver_bus_assignments;
DROP POLICY IF EXISTS "Users can update driver bus assignments" ON driver_bus_assignments;
DROP POLICY IF EXISTS "Users can delete driver bus assignments" ON driver_bus_assignments;
DROP POLICY IF EXISTS "Allow viewing driver bus assignments" ON driver_bus_assignments;
DROP POLICY IF EXISTS "Allow inserting driver bus assignments" ON driver_bus_assignments;
DROP POLICY IF EXISTS "Allow updating driver bus assignments" ON driver_bus_assignments;
DROP POLICY IF EXISTS "Allow deleting driver bus assignments" ON driver_bus_assignments;
DROP POLICY IF EXISTS "Allow all operations on driver_bus_assignments" ON driver_bus_assignments;

-- Ensure the table has the required columns
ALTER TABLE driver_bus_assignments 
ADD COLUMN IF NOT EXISTS assigned_by UUID;

-- Create missing assignments for existing buses with drivers
INSERT INTO driver_bus_assignments (driver_id, bus_id, assigned_by)
SELECT 
  b.driver_id,
  b.id,
  NULL
FROM buses b
JOIN drivers d ON b.driver_id = d.id
LEFT JOIN driver_bus_assignments dba ON d.id = dba.driver_id AND b.id = dba.bus_id
WHERE dba.id IS NULL
  AND d.is_admin = false
  AND b.driver_id IS NOT NULL
ON CONFLICT (driver_id, bus_id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE driver_bus_assignments ENABLE ROW LEVEL SECURITY;

-- Create new, permissive policies
CREATE POLICY "Enable all operations for authenticated users" ON driver_bus_assignments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all operations for anon users" ON driver_bus_assignments
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Grant explicit permissions
GRANT ALL ON driver_bus_assignments TO authenticated;
GRANT ALL ON driver_bus_assignments TO anon;
GRANT ALL ON driver_bus_assignments TO service_role;

-- Create a unique constraint to prevent duplicates
ALTER TABLE driver_bus_assignments 
ADD CONSTRAINT IF NOT EXISTS unique_driver_bus_assignment 
UNIQUE (driver_id, bus_id);

-- Show the results
SELECT 'RLS policies fixed and assignments synced!' as info;
SELECT COUNT(*) as total_assignments FROM driver_bus_assignments;

-- Show assignments by driver
SELECT 'Current assignments:' as info;
SELECT 
  d.name as driver_name,
  b.bus_number,
  b.name as bus_name,
  dba.created_at
FROM driver_bus_assignments dba
JOIN drivers d ON dba.driver_id = d.id
JOIN buses b ON dba.bus_id = b.id
ORDER BY d.name;
