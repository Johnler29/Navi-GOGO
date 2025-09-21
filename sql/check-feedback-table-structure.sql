-- Check the current structure of the feedback table
-- Run this in Supabase SQL Editor

-- Check if the feedback table exists and what columns it has
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'feedback' 
ORDER BY ordinal_position;

-- Check if there are any existing records
SELECT COUNT(*) as record_count FROM feedback;

-- Show a sample record if any exist
SELECT * FROM feedback LIMIT 1;
