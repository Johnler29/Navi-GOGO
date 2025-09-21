-- Separate feedback tables for better organization
-- This script creates dedicated tables for different types of feedback

-- 1. Create passenger_feedback table for regular passenger feedback
CREATE TABLE IF NOT EXISTS passenger_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    category VARCHAR(50) DEFAULT 'general',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create driver_emergency_reports table for emergency reports
CREATE TABLE IF NOT EXISTS driver_emergency_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    emergency_type VARCHAR(50) NOT NULL CHECK (emergency_type IN ('medical', 'mechanical', 'safety', 'security', 'other')),
    description TEXT NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'reported' CHECK (status IN ('reported', 'acknowledged', 'in_progress', 'resolved', 'closed')),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create driver_maintenance_reports table for maintenance issues
CREATE TABLE IF NOT EXISTS driver_maintenance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('engine', 'brakes', 'tires', 'electrical', 'body', 'interior', 'other')),
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'reported' CHECK (status IN ('reported', 'acknowledged', 'in_progress', 'resolved', 'closed')),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_passenger_feedback_user_id ON passenger_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_passenger_feedback_bus_id ON passenger_feedback(bus_id);
CREATE INDEX IF NOT EXISTS idx_passenger_feedback_route_id ON passenger_feedback(route_id);
CREATE INDEX IF NOT EXISTS idx_passenger_feedback_status ON passenger_feedback(status);
CREATE INDEX IF NOT EXISTS idx_passenger_feedback_created_at ON passenger_feedback(created_at);

CREATE INDEX IF NOT EXISTS idx_driver_emergency_driver_id ON driver_emergency_reports(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_emergency_bus_id ON driver_emergency_reports(bus_id);
CREATE INDEX IF NOT EXISTS idx_driver_emergency_status ON driver_emergency_reports(status);
CREATE INDEX IF NOT EXISTS idx_driver_emergency_priority ON driver_emergency_reports(priority);
CREATE INDEX IF NOT EXISTS idx_driver_emergency_reported_at ON driver_emergency_reports(reported_at);

CREATE INDEX IF NOT EXISTS idx_driver_maintenance_driver_id ON driver_maintenance_reports(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_maintenance_bus_id ON driver_maintenance_reports(bus_id);
CREATE INDEX IF NOT EXISTS idx_driver_maintenance_status ON driver_maintenance_reports(status);
CREATE INDEX IF NOT EXISTS idx_driver_maintenance_priority ON driver_maintenance_reports(priority);
CREATE INDEX IF NOT EXISTS idx_driver_maintenance_reported_at ON driver_maintenance_reports(reported_at);

-- 5. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Add updated_at triggers
CREATE TRIGGER update_passenger_feedback_updated_at 
    BEFORE UPDATE ON passenger_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_emergency_updated_at 
    BEFORE UPDATE ON driver_emergency_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_maintenance_updated_at 
    BEFORE UPDATE ON driver_maintenance_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Add comments for documentation
COMMENT ON TABLE passenger_feedback IS 'Passenger feedback and ratings for buses and routes';
COMMENT ON TABLE driver_emergency_reports IS 'Emergency reports submitted by drivers';
COMMENT ON TABLE driver_maintenance_reports IS 'Maintenance issues reported by drivers';

-- 8. Create views for easy querying
CREATE OR REPLACE VIEW all_feedback AS
SELECT 
    'passenger' as feedback_type,
    id,
    user_id as reporter_id,
    bus_id,
    route_id,
    message,
    rating,
    category,
    status,
    created_at
FROM passenger_feedback
UNION ALL
SELECT 
    'emergency' as feedback_type,
    id,
    driver_id as reporter_id,
    bus_id,
    route_id,
    description as message,
    NULL as rating,
    emergency_type as category,
    status,
    reported_at as created_at
FROM driver_emergency_reports
UNION ALL
SELECT 
    'maintenance' as feedback_type,
    id,
    driver_id as reporter_id,
    bus_id,
    NULL as route_id,
    description as message,
    NULL as rating,
    issue_type as category,
    status,
    reported_at as created_at
FROM driver_maintenance_reports;

-- 9. Grant appropriate permissions (adjust as needed for your RLS policies)
-- ALTER TABLE passenger_feedback ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE driver_emergency_reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE driver_maintenance_reports ENABLE ROW LEVEL SECURITY;
