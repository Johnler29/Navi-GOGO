-- Fix admin_users table with proper UUID generation
-- Run this in Supabase SQL Editor

-- First, let's check what's currently in the table
SELECT * FROM admin_users;

-- Drop the table completely to start fresh
DROP TABLE IF EXISTS admin_users CASCADE;

-- Recreate the admin_users table with proper UUID handling
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'manager')),
  department VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create the hash_password function
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple hash function - in production, use bcrypt or similar
  RETURN encode(digest(password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Insert default admin user with explicit UUID generation
INSERT INTO admin_users (id, email, password_hash, first_name, last_name, role, department)
VALUES (
  gen_random_uuid(),
  'admin@metrobus.com',
  hash_password('admin123'),
  'System',
  'Administrator',
  'super_admin',
  'IT'
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Admin users can view all data" ON admin_users FOR ALL USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verify the table was created correctly
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
ORDER BY ordinal_position;

-- Check the inserted record
SELECT id, email, first_name, last_name, role, is_active, created_at 
FROM admin_users;
