-- Fix Bus-Driver Assignment Synchronization
-- This script will check and fix the driver assignments in the buses table

-- First, let's check the current state of both tables
SELECT '=== CURRENT BUSES TABLE ===' as info;
SELECT 
    id,
    bus_number,
    bus_name,
    driver_id,
    is_active,
    current_latitude,
    current_longitude
FROM buses 
ORDER BY bus_number;

SELECT '=== CURRENT DRIVERS TABLE ===' as info;
SELECT 
    id,
    first_name,
    last_name,
    license_number,
    contact_number,
    email,
    is_active
FROM drivers 
ORDER BY license_number;

SELECT '=== CURRENT DRIVER-BUS ASSIGNMENTS ===' as info;
SELECT 
    dba.id,
    dba.driver_id,
    d.first_name || ' ' || d.last_name as driver_name,
    d.license_number,
    dba.bus_id,
    b.bus_name,
    dba.assigned_at
FROM driver_bus_assignments dba
JOIN drivers d ON dba.driver_id = d.id
JOIN buses b ON dba.bus_id = b.id
ORDER BY d.license_number;

-- Now let's fix the buses table by updating driver_id based on driver_bus_assignments
UPDATE buses 
SET driver_id = dba.driver_id
FROM driver_bus_assignments dba
WHERE buses.id = dba.bus_id
AND buses.driver_id IS NULL;

-- Let's also update the buses table with driver information for display
UPDATE buses 
SET driver_id = dba.driver_id
FROM driver_bus_assignments dba
WHERE buses.id = dba.bus_id;

-- Check the updated state
SELECT '=== UPDATED BUSES TABLE ===' as info;
SELECT 
    b.id,
    b.bus_number,
    b.bus_name,
    b.driver_id,
    d.first_name || ' ' || d.last_name as driver_name,
    d.license_number,
    b.is_active
FROM buses b
LEFT JOIN drivers d ON b.driver_id = d.id
ORDER BY b.bus_number;

-- Verify the fix worked
SELECT '=== VERIFICATION ===' as info;
SELECT 
    COUNT(*) as total_buses,
    COUNT(driver_id) as buses_with_drivers,
    COUNT(*) - COUNT(driver_id) as buses_without_drivers
FROM buses;
