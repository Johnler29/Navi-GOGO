-- Check the actual structure of the buses table
-- This will show us what columns are available

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'buses' 
AND table_schema = 'public'
ORDER BY ordinal_position;
