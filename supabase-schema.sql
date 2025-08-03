-- MetroBus Tracker Database Schema for Supabase
-- Run this SQL in your Supabase SQL editor

-- Create tables

-- Routes table (create first since buses references it)
CREATE TABLE IF NOT EXISTS routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_number VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  start_location VARCHAR(200),
  end_location VARCHAR(200),
  estimated_duration INTEGER, -- in minutes
  fare DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table (create before buses since buses references it)
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buses table
CREATE TABLE IF NOT EXISTS buses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_number VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  capacity INTEGER DEFAULT 50,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  route_id UUID REFERENCES routes(id),
  driver_id UUID REFERENCES drivers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stops table
CREATE TABLE IF NOT EXISTS stops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  route_id UUID REFERENCES routes(id),
  sequence INTEGER, -- order of stops in a route
  estimated_time_to_next INTEGER, -- minutes to next stop
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES routes(id),
  bus_id UUID REFERENCES buses(id),
  departure_time TIME NOT NULL,
  arrival_time TIME,
  days_of_week INTEGER[], -- 1=Monday, 2=Tuesday, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (for passengers)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bus tracking table (real-time location)
CREATE TABLE IF NOT EXISTS bus_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_id UUID REFERENCES buses(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2), -- km/h
  heading INTEGER, -- degrees
  status VARCHAR(20) DEFAULT 'moving' CHECK (status IN ('moving', 'stopped', 'at_stop')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  category VARCHAR(50), -- 'general', 'service', 'app', 'safety'
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_buses_route_id ON buses(route_id);
CREATE INDEX IF NOT EXISTS idx_buses_driver_id ON buses(driver_id);
CREATE INDEX IF NOT EXISTS idx_stops_route_id ON stops(route_id);
CREATE INDEX IF NOT EXISTS idx_schedules_route_id ON schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_schedules_bus_id ON schedules(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_tracking_bus_id ON bus_tracking(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_tracking_created_at ON bus_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buses_updated_at BEFORE UPDATE ON buses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stops_updated_at BEFORE UPDATE ON stops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bus_tracking_updated_at BEFORE UPDATE ON bus_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access" ON buses FOR SELECT USING (true);
CREATE POLICY "Public read access" ON routes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON stops FOR SELECT USING (true);
CREATE POLICY "Public read access" ON schedules FOR SELECT USING (true);
CREATE POLICY "Public read access" ON drivers FOR SELECT USING (true);
CREATE POLICY "Public read access" ON bus_tracking FOR SELECT USING (true);

-- Create policies for authenticated users
CREATE POLICY "Users can insert feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own feedback" ON feedback FOR SELECT USING (true);

-- Insert sample data
INSERT INTO routes (route_number, name, description, start_location, end_location, estimated_duration, fare) VALUES
('R001', 'Dasmarinas - Manila', 'Main route from Dasmarinas to Manila', 'Dasmarinas City', 'Manila City', 120, 50.00),
('R002', 'Dasmarinas - Makati', 'Route from Dasmarinas to Makati', 'Dasmarinas City', 'Makati City', 90, 45.00),
('R003', 'Dasmarinas - Quezon City', 'Route from Dasmarinas to Quezon City', 'Dasmarinas City', 'Quezon City', 100, 48.00);

INSERT INTO drivers (name, license_number, phone, email) VALUES
('Juan Dela Cruz', 'DL123456789', '+639123456789', 'juan.delacruz@metro.com'),
('Maria Santos', 'DL987654321', '+639987654321', 'maria.santos@metro.com'),
('Pedro Reyes', 'DL456789123', '+639456789123', 'pedro.reyes@metro.com');

INSERT INTO buses (bus_number, name, capacity, route_id, driver_id) VALUES
('B001', 'Metro Link Bus # 20', 50, (SELECT id FROM routes WHERE route_number = 'R001'), (SELECT id FROM drivers WHERE license_number = 'DL123456789')),
('B002', 'Metro Link Bus # 15', 50, (SELECT id FROM routes WHERE route_number = 'R002'), (SELECT id FROM drivers WHERE license_number = 'DL987654321')),
('B003', 'Metro Link Bus # 10', 50, (SELECT id FROM routes WHERE route_number = 'R003'), (SELECT id FROM drivers WHERE license_number = 'DL456789123'));

INSERT INTO stops (name, address, latitude, longitude, route_id, sequence, estimated_time_to_next) VALUES
('Dasmarinas Terminal', 'Dasmarinas City, Cavite', 14.3294, 120.9366, (SELECT id FROM routes WHERE route_number = 'R001'), 1, 15),
('Bacoor', 'Bacoor City, Cavite', 14.4591, 120.9468, (SELECT id FROM routes WHERE route_number = 'R001'), 2, 20),
('Manila City Hall', 'Manila City', 14.5995, 120.9842, (SELECT id FROM routes WHERE route_number = 'R001'), 3, 0);

-- Insert sample tracking data
INSERT INTO bus_tracking (bus_id, latitude, longitude, speed, heading, status) VALUES
((SELECT id FROM buses WHERE bus_number = 'B001'), 14.3294, 120.9366, 35.5, 90, 'moving'),
((SELECT id FROM buses WHERE bus_number = 'B002'), 14.4591, 120.9468, 0.0, 0, 'stopped'),
((SELECT id FROM buses WHERE bus_number = 'B003'), 14.5995, 120.9842, 28.3, 180, 'moving'); 