-- Fix the create_driver_account function to handle the name field
-- Run this in Supabase SQL Editor

-- Update the create_driver_account function to also set the name field
CREATE OR REPLACE FUNCTION create_driver_account(
  p_first_name VARCHAR(100),
  p_last_name VARCHAR(100),
  p_email VARCHAR(100),
  p_password TEXT,
  p_license_number VARCHAR(50),
  p_phone VARCHAR(20),
  p_created_by UUID
)
RETURNS JSON AS $$
DECLARE
  driver_id UUID;
  hashed_password TEXT;
  full_name VARCHAR(200);
BEGIN
  -- Hash the password
  hashed_password := hash_password(p_password);
  
  -- Create full name from first and last name
  full_name := p_first_name || ' ' || p_last_name;
  
  -- Insert driver with both name and first_name/last_name
  INSERT INTO drivers (
    name, first_name, last_name, email, password_hash, 
    license_number, phone, created_by, is_active
  ) VALUES (
    full_name, p_first_name, p_last_name, p_email, hashed_password,
    p_license_number, p_phone, p_created_by, true
  ) RETURNING id INTO driver_id;
  
  RETURN json_build_object(
    'success', true,
    'driver_id', driver_id,
    'message', 'Driver account created successfully'
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email already exists'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT create_driver_account(
  'Test', 
  'Driver', 
  'test.driver@metrobus.com', 
  'test123', 
  'DL999999', 
  '+1-555-9999', 
  null
);

-- Clean up test record
DELETE FROM drivers WHERE email = 'test.driver@metrobus.com';
