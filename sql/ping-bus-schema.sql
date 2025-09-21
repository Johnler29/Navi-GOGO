-- Ping Bus Notifications System
-- Run this SQL in your Supabase SQL editor

-- Create ping_notifications table
CREATE TABLE IF NOT EXISTS ping_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  ping_type VARCHAR(50) DEFAULT 'ride_request' CHECK (ping_type IN ('ride_request', 'location_request', 'eta_request', 'general_message')),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed', 'cancelled')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ping_notifications_user_id ON ping_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ping_notifications_bus_id ON ping_notifications(bus_id);
CREATE INDEX IF NOT EXISTS idx_ping_notifications_status ON ping_notifications(status);
CREATE INDEX IF NOT EXISTS idx_ping_notifications_created_at ON ping_notifications(created_at);

-- Enable RLS
ALTER TABLE ping_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own ping notifications" ON ping_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create ping notifications" ON ping_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ping notifications" ON ping_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Drivers can view ping notifications for their buses" ON ping_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buses b 
      WHERE b.id = ping_notifications.bus_id 
      AND b.driver_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can update ping notifications for their buses" ON ping_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM buses b 
      WHERE b.id = ping_notifications.bus_id 
      AND b.driver_id = auth.uid()
    )
  );

-- Create function to get ping notifications for a bus
CREATE OR REPLACE FUNCTION get_bus_ping_notifications(bus_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  bus_id UUID,
  ping_type VARCHAR,
  message TEXT,
  status VARCHAR,
  priority VARCHAR,
  location_latitude DECIMAL,
  location_longitude DECIMAL,
  location_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT,
  user_phone VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pn.id,
    pn.user_id,
    pn.bus_id,
    pn.ping_type,
    pn.message,
    pn.status,
    pn.priority,
    pn.location_latitude,
    pn.location_longitude,
    pn.location_address,
    pn.created_at,
    pn.updated_at,
    pn.acknowledged_at,
    pn.completed_at,
    CONCAT(u.first_name, ' ', u.last_name) as user_name,
    u.phone
  FROM ping_notifications pn
  JOIN users u ON u.id = pn.user_id
  WHERE pn.bus_id = bus_uuid
  ORDER BY pn.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's ping notifications
CREATE OR REPLACE FUNCTION get_user_ping_notifications(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  bus_id UUID,
  ping_type VARCHAR,
  message TEXT,
  status VARCHAR,
  priority VARCHAR,
  location_latitude DECIMAL,
  location_longitude DECIMAL,
  location_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  bus_number VARCHAR,
  bus_name VARCHAR,
  driver_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pn.id,
    pn.user_id,
    pn.bus_id,
    pn.ping_type,
    pn.message,
    pn.status,
    pn.priority,
    pn.location_latitude,
    pn.location_longitude,
    pn.location_address,
    pn.created_at,
    pn.updated_at,
    pn.acknowledged_at,
    pn.completed_at,
    b.bus_number,
    b.name as bus_name,
    CONCAT(d.first_name, ' ', d.last_name) as driver_name
  FROM ping_notifications pn
  JOIN buses b ON b.id = pn.bus_id
  LEFT JOIN drivers d ON d.id = b.driver_id
  WHERE pn.user_id = user_uuid
  ORDER BY pn.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to acknowledge a ping notification
CREATE OR REPLACE FUNCTION acknowledge_ping_notification(ping_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE ping_notifications 
  SET 
    status = 'acknowledged',
    acknowledged_at = NOW(),
    updated_at = NOW()
  WHERE id = ping_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to complete a ping notification
CREATE OR REPLACE FUNCTION complete_ping_notification(ping_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE ping_notifications 
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = ping_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ping_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_bus_ping_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ping_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION acknowledge_ping_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_ping_notification(UUID) TO authenticated;

-- Insert sample ping notifications
INSERT INTO ping_notifications (user_id, bus_id, ping_type, message, status, priority, location_latitude, location_address)
SELECT 
  u.id,
  b.id,
  'ride_request',
  'I need to catch this bus at the next stop',
  'pending',
  'normal',
  14.5995,
  'Ayala Avenue, Makati'
FROM users u, buses b
WHERE u.email = 'user1@example.com' AND b.bus_number = 'R001'
LIMIT 1;

INSERT INTO ping_notifications (user_id, bus_id, ping_type, message, status, priority, location_latitude, location_address)
SELECT 
  u.id,
  b.id,
  'eta_request',
  'What time will you arrive at Ayala Station?',
  'pending',
  'normal',
  14.5995,
  'Ayala Station'
FROM users u, buses b
WHERE u.email = 'user2@example.com' AND b.bus_number = 'R002'
LIMIT 1;
