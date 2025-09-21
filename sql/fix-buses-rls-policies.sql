-- Fix RLS policies for buses table to allow admin users to create/update/delete buses
-- This script ensures admin users have full access to the buses table

-- First, let's check if we have admin_users table and get the admin user IDs
-- Update the policies to allow admin users to perform all operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view buses" ON buses;
DROP POLICY IF EXISTS "Users can insert buses" ON buses;
DROP POLICY IF EXISTS "Users can update buses" ON buses;
DROP POLICY IF EXISTS "Users can delete buses" ON buses;

-- Create new policies that allow admin users full access
CREATE POLICY "Admin users can view all buses" ON buses
  FOR SELECT USING (
    -- Allow all authenticated users to view buses
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Admin users can insert buses" ON buses
  FOR INSERT WITH CHECK (
    -- Allow admin users to insert buses
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'operator')
    )
  );

CREATE POLICY "Admin users can update buses" ON buses
  FOR UPDATE USING (
    -- Allow admin users to update buses
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'operator')
    )
  );

CREATE POLICY "Admin users can delete buses" ON buses
  FOR DELETE USING (
    -- Allow admin users to delete buses
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'operator')
    )
  );

-- Also ensure the admin_users table has the correct structure
-- If admin_users table doesn't exist, create it
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('super_admin', 'operator')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users table
CREATE POLICY "Admin users can view all admin users" ON admin_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin users can update their own profile" ON admin_users
  FOR UPDATE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON buses TO authenticated;
GRANT ALL ON admin_users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Insert a test admin user if it doesn't exist
-- Replace with your actual admin user ID from auth.users
INSERT INTO admin_users (id, email, first_name, last_name, role, status)
VALUES (
  '7b137bd6-d971-4f45-b136-422c78d8a42a', -- Replace with your actual admin user ID
  'admin@metrobus.com',
  'Admin',
  'User',
  'super_admin',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();
