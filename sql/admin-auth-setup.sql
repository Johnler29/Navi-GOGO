    -- MetroBus Tracker Admin Authentication Setup
    -- Run this SQL in your Supabase SQL editor after running the main schema

-- Note: auth.users table is managed by Supabase Auth
-- We don't need to modify it directly

    -- Create admin_users table for admin-specific data
    CREATE TABLE IF NOT EXISTS admin_users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'operator')),
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable RLS for admin_users
    ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies for admin_users
    CREATE POLICY "Admin users can view all admin users" ON admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

    CREATE POLICY "Admin users can update their own profile" ON admin_users
    FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Super admins can manage all admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
        SELECT 1 FROM admin_users 
        WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We'll create the trigger manually after users are created
-- The trigger will be created when we have proper permissions

    -- Insert demo admin users
    -- Note: These will be created in auth.users via Supabase Auth, but we'll insert the admin_users data
    -- You'll need to create these users through the Supabase Auth UI or API first

    -- Demo Admin User 1
    INSERT INTO admin_users (id, email, first_name, last_name, role, department, phone)
    VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@metrobus.com',
    'Admin',
    'User',
    'super_admin',
    'Operations',
    '+1-555-0101'
    ) ON CONFLICT (id) DO NOTHING;

    -- Demo Admin User 2
    INSERT INTO admin_users (id, email, first_name, last_name, role, department, phone)
    VALUES (
    '00000000-0000-0000-0000-000000000002',
    'operator@metrobus.com',
    'Fleet',
    'Operator',
    'operator',
    'Fleet Management',
    '+1-555-0102'
    ) ON CONFLICT (id) DO NOTHING;

    -- Create function to get current admin user
    CREATE OR REPLACE FUNCTION get_current_admin_user()
    RETURNS TABLE (
    id UUID,
    email VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    role VARCHAR,
    department VARCHAR,
    phone VARCHAR,
    is_active BOOLEAN,
    last_login TIMESTAMP WITH TIME ZONE
    ) AS $$
    BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.first_name,
        au.last_name,
        au.role,
        au.department,
        au.phone,
        au.is_active,
        au.last_login
    FROM admin_users au
    WHERE au.id = auth.uid();
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Grant permissions
    GRANT USAGE ON SCHEMA public TO authenticated;
    GRANT ALL ON admin_users TO authenticated;
    GRANT EXECUTE ON FUNCTION get_current_admin_user() TO authenticated;

    -- Update last_login function
    CREATE OR REPLACE FUNCTION update_last_login()
    RETURNS TRIGGER AS $$
    BEGIN
    UPDATE admin_users 
    SET last_login = NOW() 
    WHERE id = NEW.id;
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We'll create the trigger manually after users are created
-- The trigger will be created when we have proper permissions

    -- Create view for admin dashboard data
    CREATE OR REPLACE VIEW admin_dashboard_stats AS
    SELECT 
    (SELECT COUNT(*) FROM buses) as total_buses,
    (SELECT COUNT(*) FROM buses WHERE status = 'active') as active_buses,
    (SELECT COUNT(*) FROM buses WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as buses_with_location,
    (SELECT COUNT(*) FROM drivers WHERE status = 'active') as active_drivers,
    (SELECT COUNT(*) FROM routes WHERE status = 'active') as active_routes,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM feedback WHERE created_at >= NOW() - INTERVAL '24 hours') as recent_feedback;

    -- Grant access to the view
    GRANT SELECT ON admin_dashboard_stats TO authenticated;

    -- Create function to get bus analytics
    CREATE OR REPLACE FUNCTION get_bus_analytics()
    RETURNS TABLE (
    total_buses BIGINT,
    active_buses BIGINT,
    buses_with_location BIGINT,
    on_time_performance NUMERIC,
    avg_speed NUMERIC
    ) AS $$
    BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_buses,
        COUNT(*) FILTER (WHERE status = 'active') as active_buses,
        COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as buses_with_location,
        ROUND(
        (COUNT(*) FILTER (WHERE tracking_status = 'moving')::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100), 2
        ) as on_time_performance,
        ROUND(AVG(speed), 2) as avg_speed
    FROM buses;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Grant access to the function
    GRANT EXECUTE ON FUNCTION get_bus_analytics() TO authenticated;
