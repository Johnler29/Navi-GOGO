-- Check the current structure of admin_users table
-- Run this first to see what's wrong

-- Check if the table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'admin_users'
) as table_exists;

-- Check the current columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
ORDER BY ordinal_position;

-- Check if there are any existing records
SELECT COUNT(*) as record_count FROM admin_users;
