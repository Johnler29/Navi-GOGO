-- Setup User Management and Driver Account Creation
-- Run this in Supabase SQL Editor

-- First, ensure we have the necessary columns in drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create admin_users table for admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
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

-- Create user_roles table for passenger roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('passenger', 'premium_passenger', 'vip_passenger')),
  granted_by UUID REFERENCES admin_users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('technical', 'billing', 'general', 'complaint', 'suggestion')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create ticket_responses table
CREATE TABLE IF NOT EXISTS ticket_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  responder_id UUID REFERENCES admin_users(id),
  response TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  notifications JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
  language VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(20) DEFAULT 'light',
  accessibility JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create driver_assignments table for tracking driver assignments
CREATE TABLE IF NOT EXISTS driver_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES admin_users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unassigned_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_active ON drivers(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver ON driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_bus ON driver_assignments(bus_id);

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple hash function - in production, use bcrypt or similar
  RETURN encode(digest(password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create function to create driver account
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
BEGIN
  -- Hash the password
  hashed_password := hash_password(p_password);
  
  -- Insert driver
  INSERT INTO drivers (
    first_name, last_name, email, password_hash, 
    license_number, phone, created_by, is_active
  ) VALUES (
    p_first_name, p_last_name, p_email, hashed_password,
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

-- Create function to authenticate driver
CREATE OR REPLACE FUNCTION authenticate_driver(
  p_email VARCHAR(100),
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  driver_record RECORD;
  hashed_password TEXT;
BEGIN
  hashed_password := hash_password(p_password);
  
  SELECT id, email, first_name, last_name, is_active, license_number, password_hash
  FROM drivers 
  WHERE email = p_email AND is_active = true
  INTO driver_record;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Driver not found or inactive'
    );
  END IF;
  
  IF driver_record.password_hash != hashed_password THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid password'
    );
  END IF;
  
  -- Update last login
  UPDATE drivers 
  SET last_login = NOW() 
  WHERE id = driver_record.id;
  
  RETURN json_build_object(
    'success', true,
    'driver', json_build_object(
      'id', driver_record.id,
      'email', driver_record.email,
      'first_name', driver_record.first_name,
      'last_name', driver_record.last_name,
      'license_number', driver_record.license_number
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS JSON AS $$
DECLARE
  total_users INTEGER;
  active_users INTEGER;
  pending_feedback INTEGER;
  support_tickets INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM users;
  SELECT COUNT(*) INTO active_users FROM users WHERE created_at > NOW() - INTERVAL '30 days';
  SELECT COUNT(*) INTO pending_feedback FROM feedback WHERE status = 'pending';
  SELECT COUNT(*) INTO support_tickets FROM support_tickets WHERE status IN ('open', 'in_progress');
  
  RETURN json_build_object(
    'total_users', total_users,
    'active_users', active_users,
    'pending_feedback', pending_feedback,
    'support_tickets', support_tickets
  );
END;
$$ LANGUAGE plpgsql;

-- Insert default admin user
INSERT INTO admin_users (email, password_hash, first_name, last_name, role, department)
VALUES (
  'admin@metrobus.com',
  hash_password('admin123'),
  'System',
  'Administrator',
  'super_admin',
  'IT'
) ON CONFLICT (email) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin users can view all data" ON admin_users FOR ALL USING (true);
CREATE POLICY "Users can view their own data" ON users FOR ALL USING (true);
CREATE POLICY "Users can view their own roles" ON user_roles FOR ALL USING (true);
CREATE POLICY "Users can view their own tickets" ON support_tickets FOR ALL USING (true);
CREATE POLICY "Users can view their own preferences" ON user_preferences FOR ALL USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
