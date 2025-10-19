-- Verify driver assignments table and data
-- Run this in Supabase SQL Editor to check the current state

-- Check if driver_bus_assignments table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_bus_assignments') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as table_status;

-- Check table structure if it exists
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'driver_bus_assignments' 
ORDER BY ordinal_position;

-- Count records in driver_bus_assignments
SELECT COUNT(*) as total_assignments FROM driver_bus_assignments;

-- Show all current assignments
SELECT 
  dba.id,
  dba.driver_id,
  dba.bus_id,
  d.name as driver_name,
  b.bus_number,
  dba.created_at
FROM driver_bus_assignments dba
LEFT JOIN drivers d ON d.id = dba.driver_id
LEFT JOIN buses b ON b.id = dba.bus_id
ORDER BY dba.created_at DESC;

-- Check buses table for active drivers
SELECT 
  b.id,
  b.bus_number,
  b.driver_id,
  b.status,
  b.tracking_status,
  b.latitude,
  b.longitude,
  b.last_location_update,
  d.name as driver_name
FROM buses b
LEFT JOIN drivers d ON d.id = b.driver_id
WHERE b.driver_id IS NOT NULL
ORDER BY b.bus_number;

-- Check if any buses have active drivers but no assignments
SELECT 
  b.id,
  b.bus_number,
  b.driver_id,
  d.name as driver_name,
  CASE 
    WHEN dba.id IS NULL THEN 'NO ASSIGNMENT'
    ELSE 'HAS ASSIGNMENT'
  END as assignment_status
FROM buses b
LEFT JOIN drivers d ON d.id = b.driver_id
LEFT JOIN driver_bus_assignments dba ON dba.driver_id = b.driver_id AND dba.bus_id = b.id
WHERE b.driver_id IS NOT NULL
ORDER BY b.bus_number;
