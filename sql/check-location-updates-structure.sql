-- Check the structure of the location_updates table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'location_updates' 
AND table_schema = 'public'
ORDER BY ordinal_position;