  -- Add sample user and driver data for testing
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

  -- Insert sample drivers using the create_driver_account function
  SELECT create_driver_account('John', 'Driver', 'john.driver@metrobus.com', 'driver123', 'DL123456', '+1-555-1001', null);
  SELECT create_driver_account('Sarah', 'Pilot', 'sarah.pilot@metrobus.com', 'driver123', 'DL123457', '+1-555-1002', null);
  SELECT create_driver_account('Mike', 'Operator', 'mike.operator@metrobus.com', 'driver123', 'DL123458', '+1-555-1003', null);
  SELECT create_driver_account('Emily', 'Captain', 'emily.captain@metrobus.com', 'driver123', 'DL123459', '+1-555-1004', null);
  SELECT create_driver_account('David', 'Conductor', 'david.conductor@metrobus.com', 'driver123', 'DL123460', '+1-555-1005', null);

  -- Insert sample feedback (check table structure first)
  DO $$
  BEGIN
      -- Check if feedback table has user_name and user_email columns
      IF EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'feedback' AND column_name = 'user_name') THEN
          
          -- Insert with user_name and user_email columns
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
          
      ELSE
          -- Insert without user_name and user_email columns
          INSERT INTO feedback (message, rating, category, status) VALUES
          ('Great service! The bus was clean and on time.', 5, 'compliment', 'resolved'),
          ('The driver was very helpful and friendly.', 4, 'compliment', 'resolved'),
          ('Bus was late by 15 minutes today.', 2, 'complaint', 'pending'),
          ('Love the new app features!', 5, 'suggestion', 'resolved'),
          ('Air conditioning was not working properly.', 3, 'complaint', 'pending'),
          ('Driver was very professional and courteous.', 5, 'compliment', 'resolved'),
          ('Need more frequent buses during rush hour.', 4, 'suggestion', 'pending'),
          ('The bus tracking feature is very accurate.', 5, 'compliment', 'resolved'),
          ('Had trouble with the payment system.', 2, 'complaint', 'pending'),
          ('Overall great experience with MetroBus!', 5, 'compliment', 'resolved');
          
          -- If user_id column exists, link to actual users
          IF EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'feedback' AND column_name = 'user_id') THEN
              
              UPDATE feedback 
              SET user_id = (SELECT id FROM users WHERE email = 'john.smith@email.com' LIMIT 1)
              WHERE message = 'Great service! The bus was clean and on time.';
              
              UPDATE feedback 
              SET user_id = (SELECT id FROM users WHERE email = 'sarah.johnson@email.com' LIMIT 1)
              WHERE message = 'The driver was very helpful and friendly.';
              
              UPDATE feedback 
              SET user_id = (SELECT id FROM users WHERE email = 'mike.davis@email.com' LIMIT 1)
              WHERE message = 'Bus was late by 15 minutes today.';
              
              UPDATE feedback 
              SET user_id = (SELECT id FROM users WHERE email = 'emily.wilson@email.com' LIMIT 1)
              WHERE message = 'Love the new app features!';
              
              UPDATE feedback 
              SET user_id = (SELECT id FROM users WHERE email = 'david.brown@email.com' LIMIT 1)
              WHERE message = 'Air conditioning was not working properly.';
              
              UPDATE feedback 
              SET user_id = (SELECT id FROM users WHERE email = 'lisa.garcia@email.com' LIMIT 1)
              WHERE message = 'Driver was very professional and courteous.';
              
              UPDATE feedback 
              SET user_id = (SELECT id FROM users WHERE email = 'robert.miller@email.com' LIMIT 1)
              WHERE message = 'Need more frequent buses during rush hour.';
              
              UPDATE feedback 
              SET user_id = (SELECT id FROM users WHERE email = 'jennifer.taylor@email.com' LIMIT 1)
              WHERE message = 'The bus tracking feature is very accurate.';
              
              UPDATE feedback 
              SET user_id = (SELECT id FROM users WHERE email = 'william.anderson@email.com' LIMIT 1)
              WHERE message = 'Had trouble with the payment system.';
              
              UPDATE feedback 
              SET user_id = (SELECT id FROM users WHERE email = 'maria.martinez@email.com' LIMIT 1)
              WHERE message = 'Overall great experience with MetroBus!';
              
          END IF;
      END IF;
  END $$;

  -- Insert sample support tickets
  INSERT INTO support_tickets (user_id, subject, description, category, priority, status) VALUES
  ((SELECT id FROM users WHERE email = 'mike.davis@email.com'), 'Bus Delay Issue', 'My bus was 20 minutes late this morning. This is the third time this week.', 'complaint', 'high', 'open'),
  ((SELECT id FROM users WHERE email = 'david.brown@email.com'), 'AC Not Working', 'The air conditioning on bus B001 was not working properly during my commute.', 'technical', 'medium', 'open'),
  ((SELECT id FROM users WHERE email = 'robert.miller@email.com'), 'Request for More Buses', 'Can we have more frequent buses during peak hours?', 'suggestion', 'low', 'open'),
  ((SELECT id FROM users WHERE email = 'william.anderson@email.com'), 'Payment System Error', 'I was charged twice for the same trip. Need refund.', 'billing', 'high', 'in_progress'),
  ((SELECT id FROM users WHERE email = 'jennifer.taylor@email.com'), 'App Feature Request', 'Would love to see real-time seat availability.', 'suggestion', 'low', 'open');

  -- Insert user preferences for existing users
  INSERT INTO user_preferences (user_id, notifications, language, theme, accessibility) VALUES
  ((SELECT id FROM users WHERE email = 'john.smith@email.com'), '{"email": true, "sms": false, "push": true}', 'en', 'light', '{}'),
  ((SELECT id FROM users WHERE email = 'sarah.johnson@email.com'), '{"email": true, "sms": true, "push": true}', 'en', 'dark', '{}'),
  ((SELECT id FROM users WHERE email = 'mike.davis@email.com'), '{"email": false, "sms": true, "push": false}', 'en', 'light', '{}'),
  ((SELECT id FROM users WHERE email = 'emily.wilson@email.com'), '{"email": true, "sms": false, "push": true}', 'en', 'light', '{}'),
  ((SELECT id FROM users WHERE email = 'david.brown@email.com'), '{"email": true, "sms": true, "push": true}', 'en', 'dark', '{}')
  ON CONFLICT (user_id) DO NOTHING;

  -- Update some drivers to be inactive for testing
  UPDATE drivers SET is_active = false WHERE email = 'mike.operator@metrobus.com';
  UPDATE drivers SET is_active = false WHERE email = 'emily.captain@metrobus.com';

  -- Add some driver assignments (if buses exist)
  -- This will only work if you have buses in your database
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

  -- Verify the data
  SELECT 'Users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'Drivers' as table_name, COUNT(*) as count FROM drivers
  UNION ALL
  SELECT 'Feedback' as table_name, COUNT(*) as count FROM feedback
  UNION ALL
  SELECT 'Support Tickets' as table_name, COUNT(*) as count FROM support_tickets
  UNION ALL
  SELECT 'User Preferences' as table_name, COUNT(*) as count FROM user_preferences
  UNION ALL
  SELECT 'Driver Assignments' as table_name, COUNT(*) as count FROM driver_assignments;
