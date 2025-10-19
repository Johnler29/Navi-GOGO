-- Check bus status and coordinates for the assigned bus
-- Run this to see why the bus might not be appearing

-- Check the specific bus B005 that Paul Martinez is assigned to
SELECT 
  b.id,
  b.bus_number,
  b.driver_id,
  b.status,
  b.tracking_status,
  b.latitude,
  b.longitude,
  b.last_location_update,
  b.updated_at,
  d.name as driver_name,
  CASE 
    WHEN b.latitude IS NULL OR b.longitude IS NULL THEN 'NO COORDINATES'
    WHEN b.latitude = 0 OR b.longitude = 0 THEN 'ZERO COORDINATES'
    ELSE 'HAS COORDINATES'
  END as coordinate_status,
  CASE 
    WHEN b.status = 'active' AND b.driver_id IS NOT NULL THEN 'ACTIVE WITH DRIVER'
    WHEN b.status = 'active' AND b.driver_id IS NULL THEN 'ACTIVE NO DRIVER'
    WHEN b.status != 'active' THEN 'INACTIVE'
    ELSE 'UNKNOWN STATUS'
  END as bus_status
FROM buses b
LEFT JOIN drivers d ON d.id = b.driver_id
WHERE b.bus_number = 'B005' OR b.id = 'da928ab9-17b6-4e29-8206-6d611314960b';

-- Check all buses with drivers to see their status
SELECT 
  b.bus_number,
  b.status,
  b.tracking_status,
  b.latitude,
  b.longitude,
  b.last_location_update,
  d.name as driver_name,
  CASE 
    WHEN b.latitude IS NULL OR b.longitude IS NULL THEN 'NO COORDINATES'
    WHEN b.latitude = 0 OR b.longitude = 0 THEN 'ZERO COORDINATES'
    ELSE 'HAS COORDINATES'
  END as coordinate_status
FROM buses b
LEFT JOIN drivers d ON d.id = b.driver_id
WHERE b.driver_id IS NOT NULL
ORDER BY b.bus_number;

-- Check if there are any recent location updates
SELECT 
  b.bus_number,
  b.last_location_update,
  b.updated_at,
  EXTRACT(EPOCH FROM (NOW() - b.last_location_update))/60 as minutes_since_update,
  d.name as driver_name
FROM buses b
LEFT JOIN drivers d ON d.id = b.driver_id
WHERE b.driver_id IS NOT NULL
ORDER BY b.last_location_update DESC;
