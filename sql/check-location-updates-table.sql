-- Check the actual structure of the location_updates table
-- Run this first to see what columns exist

-- Get table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'location_updates' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any records
SELECT COUNT(*) as total_records FROM location_updates;

-- Get sample data (if any exists)
SELECT * FROM location_updates LIMIT 5;

-- Check recent updates using the correct column name
SELECT 
    id,
    driver_id,
    bus_id,
    latitude,
    longitude,
    accuracy,
    created_at
FROM location_updates 
ORDER BY created_at DESC 
LIMIT 5;
