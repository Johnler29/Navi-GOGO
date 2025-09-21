-- Ultra simple check - just get B002 bus basic info
-- This should work without any column errors

SELECT 
    bus_number,
    name,
    latitude,
    longitude,
    created_at,
    updated_at
FROM buses 
WHERE bus_number = 'B002';

-- Check if there are any location updates at all
SELECT COUNT(*) as total_location_updates
FROM location_updates;

-- Get the most recent location update (any bus)
SELECT 
    latitude,
    longitude,
    accuracy,
    created_at
FROM location_updates 
ORDER BY created_at DESC 
LIMIT 1;
