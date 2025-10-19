-- Fix bus driver assignment - update buses table with driver_id from assignments
-- This will make the bus appear on the map

-- First, check the current state
SELECT 
  b.bus_number,
  b.driver_id as bus_driver_id,
  dba.driver_id as assignment_driver_id,
  d.name as driver_name,
  CASE 
    WHEN b.driver_id IS NULL THEN 'MISSING DRIVER_ID IN BUSES TABLE'
    WHEN b.driver_id = dba.driver_id THEN 'ASSIGNMENT MATCHES'
    ELSE 'ASSIGNMENT MISMATCH'
  END as assignment_status
FROM buses b
LEFT JOIN driver_bus_assignments dba ON dba.bus_id = b.id
LEFT JOIN drivers d ON d.id = dba.driver_id
WHERE b.bus_number = 'B005';

-- Fix the assignment by updating the buses table
UPDATE buses 
SET driver_id = dba.driver_id
FROM driver_bus_assignments dba
WHERE buses.id = dba.bus_id 
  AND buses.driver_id IS NULL
  AND buses.bus_number = 'B005';

-- Verify the fix
SELECT 
  b.bus_number,
  b.driver_id,
  b.status,
  b.tracking_status,
  b.latitude,
  b.longitude,
  d.name as driver_name,
  CASE 
    WHEN b.driver_id IS NOT NULL AND b.status = 'active' THEN 'SHOULD APPEAR ON MAP'
    WHEN b.driver_id IS NULL THEN 'NO DRIVER ASSIGNED'
    WHEN b.status != 'active' THEN 'BUS INACTIVE'
    ELSE 'UNKNOWN ISSUE'
  END as map_status
FROM buses b
LEFT JOIN drivers d ON d.id = b.driver_id
WHERE b.bus_number = 'B005';
