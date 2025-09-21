-- Simple check for B002 bus location
-- This will work regardless of which columns exist

-- Get basic B002 bus info
SELECT 
    bus_number,
    name,
    latitude,
    longitude,
    created_at,
    updated_at
FROM buses 
WHERE bus_number = 'B002';

-- Get any recent location updates for B002
SELECT 
    lu.latitude,
    lu.longitude,
    lu.accuracy,
    lu.created_at
FROM location_updates lu
JOIN buses b ON lu.bus_id = b.id
WHERE b.bus_number = 'B002'
ORDER BY lu.created_at DESC
LIMIT 3;
