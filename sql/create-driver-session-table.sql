-- File: sql/create-driver-session-table.sql
-- This script creates a driver session table for tracking driver assignments and sessions

-- Create driver_sessions table
CREATE TABLE driver_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id) NOT NULL,
  bus_id UUID REFERENCES buses(id) NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired')),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info JSONB, -- Store device information for security
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver_id ON driver_sessions(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_bus_id ON driver_sessions(bus_id);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_session_token ON driver_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_status ON driver_sessions(status);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_active ON driver_sessions(driver_id, status) WHERE status = 'active';

-- Create updated_at trigger
CREATE TRIGGER update_driver_sessions_updated_at 
  BEFORE UPDATE ON driver_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE driver_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driver_sessions
CREATE POLICY "Drivers can view own sessions" ON driver_sessions 
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create own sessions" ON driver_sessions 
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own sessions" ON driver_sessions 
  FOR UPDATE USING (auth.uid() = driver_id);

-- Add comments for documentation
COMMENT ON TABLE driver_sessions IS 'Tracks active driver sessions and bus assignments';
COMMENT ON COLUMN driver_sessions.session_token IS 'Unique session token for security and authentication';
COMMENT ON COLUMN driver_sessions.device_info IS 'JSON object containing device information for security tracking';
COMMENT ON COLUMN driver_sessions.last_activity IS 'Timestamp of last driver activity for session timeout';
