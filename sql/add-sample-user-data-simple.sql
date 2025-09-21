-- Add sample user and driver data for testing (without functions)
-- Run this in Supabase SQL Editor after running setup-user-management.sql

-- Insert sample users (passengers)
INSERT INTO users (name, email, phone, preferences) VALUES
('John Smith', 'john.smith@email.com', '+1-555-0101', '{"notifications": {"email": true, "sms": false, "push": true}}'),
('Sarah Johnson', 'sarah.johnson@email.com', '+1-555-0102', '{"notifications": {"email": true, "sms": true, "push": true}}'),
('Mike Davis', 'mike.davis@email.com', '+1-555-0103', '{"notifications": {"email": false, "sms": true, "push": false}}'),
('Emily Wilson', 'emily.wilson@email.com', '+1-555-0104', '{"notifications": {"email": true, "sms": false, "push": true}}'),
('David Brown', 'david.brown@email.com', '+1-555-0105', '{"notifications": {"email": true, "sms": true, "push": true}}'),
('Lisa Garcia', 'lisa.garcia@email.com', '+1-555-0106', '{"notifications": {"email": true, "sms": false, "push": false}}'),
('Robert Miller', 'robert.miller@email.com', '+1-555-0107', '{"notifications": {"email": false, "sms": true, "push": true}}'),
('Jennifer Taylor', 'jennifer.taylor@email.com', '+1-555-0108', '{"notifications": {"email": true, "sms": true, "push": true}}'),
('William Anderson', 'william.anderson@email.com', '+1-555-0109', '{"notifications": {"email": true, "sms": false, "push": true}}'),
('Maria Martinez', 'maria.martinez@email.com', '+1-555-0110', '{"notifications": {"email": true, "sms": true, "push": false}}')
ON CONFLICT (email) DO NOTHING;

-- Create hash_password function if it doesn't exist
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple hash function - in production, use bcrypt or similar
  RETURN encode(digest(password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Insert sample drivers directly (without using the function)
INSERT INTO drivers (first_name, last_name, email, password_hash, license_number, phone, is_active, created_at, updated_at) VALUES
('John', 'Driver', 'john.driver@metrobus.com', hash_password('driver123'), 'DL123456', '+1-555-1001', true, NOW(), NOW()),
('Sarah', 'Pilot', 'sarah.pilot@metrobus.com', hash_password('driver123'), 'DL123457', '+1-555-1002', true, NOW(), NOW()),
('Mike', 'Operator', 'mike.operator@metrobus.com', hash_password('driver123'), 'DL123458', '+1-555-1003', false, NOW(), NOW()),
('Emily', 'Captain', 'emily.captain@metrobus.com', hash_password('driver123'), 'DL123459', '+1-555-1004', false, NOW(), NOW()),
('David', 'Conductor', 'david.conductor@metrobus.com', hash_password('driver123'), 'DL123460', '+1-555-1005', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert sample feedback
INSERT INTO feedback (user_name, user_email, message, rating, category, status) VALUES
('John Smith', 'john.smith@email.com', 'Great service! The bus was clean and on time.', 5, 'compliment', 'resolved'),
('Sarah Johnson', 'sarah.johnson@email.com', 'The driver was very helpful and friendly.', 4, 'compliment', 'resolved'),
('Mike Davis', 'mike.davis@email.com', 'Bus was late by 15 minutes today.', 2, 'complaint', 'pending'),
('Emily Wilson', 'emily.wilson@email.com', 'Love the new app features!', 5, 'suggestion', 'resolved'),
('David Brown', 'david.brown@email.com', 'Air conditioning was not working properly.', 3, 'complaint', 'pending'),
('Lisa Garcia', 'lisa.garcia@email.com', 'Driver was very professional and courteous.', 5, 'compliment', 'resolved'),
('Robert Miller', 'robert.miller@email.com', 'Need more frequent buses during rush hour.', 4, 'suggestion', 'pending'),
('Jennifer Taylor', 'jennifer.taylor@email.com', 'The bus tracking feature is very accurate.', 5, 'compliment', 'resolved'),
('William Anderson', 'william.anderson@email.com', 'Had trouble with the payment system.', 2, 'complaint', 'pending'),
('Maria Martinez', 'maria.martinez@email.com', 'Overall great experience with MetroBus!', 5, 'compliment', 'resolved');

-- Insert sample support tickets (only if support_tickets table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
        INSERT INTO support_tickets (user_id, subject, description, category, priority, status) VALUES
        ((SELECT id FROM users WHERE email = 'mike.davis@email.com'), 'Bus Delay Issue', 'My bus was 20 minutes late this morning. This is the third time this week.', 'complaint', 'high', 'open'),
        ((SELECT id FROM users WHERE email = 'david.brown@email.com'), 'AC Not Working', 'The air conditioning on bus B001 was not working properly during my commute.', 'technical', 'medium', 'open'),
        ((SELECT id FROM users WHERE email = 'robert.miller@email.com'), 'Request for More Buses', 'Can we have more frequent buses during peak hours?', 'suggestion', 'low', 'open'),
        ((SELECT id FROM users WHERE email = 'william.anderson@email.com'), 'Payment System Error', 'I was charged twice for the same trip. Need refund.', 'billing', 'high', 'in_progress'),
        ((SELECT id FROM users WHERE email = 'jennifer.taylor@email.com'), 'App Feature Request', 'Would love to see real-time seat availability.', 'suggestion', 'low', 'open');
    END IF;
END $$;

-- Insert user preferences for existing users (only if user_preferences table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        INSERT INTO user_preferences (user_id, notifications, language, theme, accessibility) VALUES
        ((SELECT id FROM users WHERE email = 'john.smith@email.com'), '{"email": true, "sms": false, "push": true}', 'en', 'light', '{}'),
        ((SELECT id FROM users WHERE email = 'sarah.johnson@email.com'), '{"email": true, "sms": true, "push": true}', 'en', 'dark', '{}'),
        ((SELECT id FROM users WHERE email = 'mike.davis@email.com'), '{"email": false, "sms": true, "push": false}', 'en', 'light', '{}'),
        ((SELECT id FROM users WHERE email = 'emily.wilson@email.com'), '{"email": true, "sms": false, "push": true}', 'en', 'light', '{}'),
        ((SELECT id FROM users WHERE email = 'david.brown@email.com'), '{"email": true, "sms": true, "push": true}', 'en', 'dark', '{}')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;

-- Add some driver assignments (if buses exist)
-- This will only work if you have buses in your database
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_assignments') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buses') THEN
        INSERT INTO driver_assignments (driver_id, bus_id, route_id, assigned_by, is_active, notes)
        SELECT 
          d.id as driver_id,
          b.id as bus_id,
          b.route_id,
          (SELECT id FROM admin_users LIMIT 1) as assigned_by,
          true as is_active,
          'Initial assignment' as notes
        FROM drivers d
        CROSS JOIN buses b
        WHERE d.is_active = true
          AND b.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM driver_assignments da 
            WHERE da.driver_id = d.id AND da.bus_id = b.id
          )
        LIMIT 3;
    END IF;
END $$;

-- Verify the data
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Drivers' as table_name, COUNT(*) as count FROM drivers
UNION ALL
SELECT 'Feedback' as table_name, COUNT(*) as count FROM feedback
UNION ALL
SELECT 'Admin Users' as table_name, COUNT(*) as count FROM admin_users;
