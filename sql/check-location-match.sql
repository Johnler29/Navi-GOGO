-- Check if current location matches B002 bus location for testing
-- This will help verify if location tracking is working correctly

-- Get B002 bus current location
SELECT 
    b.bus_number,
    b.name as bus_name,
    b.latitude as current_latitude,
    b.longitude as current_longitude,
    b.updated_at as last_location_update,
    b.status
FROM buses b 
WHERE b.bus_number = 'B002';

-- Get recent location updates for B002
SELECT 
    lu.driver_id,
    lu.bus_id,
    lu.latitude,
    lu.longitude,
    lu.accuracy,
    lu.timestamp,
    lu.created_at
FROM location_updates lu
JOIN buses b ON lu.bus_id = b.id
WHERE b.bus_number = 'B002'
ORDER BY lu.created_at DESC
LIMIT 5;

-- Get driver assigned to B002
SELECT 
    d.name as driver_name,
    d.email,
    d.phone,
    dba.assigned_at,
    dba.is_active as assignment_active
FROM driver_bus_assignments dba
JOIN drivers d ON dba.driver_id = d.id
JOIN buses b ON dba.bus_id = b.id
WHERE b.bus_number = 'B002'
AND dba.is_active = true;

-- Check if there are any active driver sessions for B002
SELECT 
    ds.id as session_id,
    ds.driver_id,
    ds.bus_id,
    ds.status,
    ds.started_at,
    ds.last_activity,
    d.name as driver_name,
    b.bus_number
FROM driver_sessions ds
JOIN drivers d ON ds.driver_id = d.id
JOIN buses b ON ds.bus_id = b.id
WHERE b.bus_number = 'B002'
AND ds.status = 'active'
ORDER BY ds.started_at DESC;
