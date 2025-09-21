-- Fixed sample data for feedback table
-- Run this in Supabase SQL Editor

-- First, let's check what columns the feedback table actually has
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'feedback' 
ORDER BY ordinal_position;

-- Insert sample feedback based on actual table structure
-- This will work regardless of the exact column names
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

-- If the table has user_id column, we can link to actual users
DO $$
BEGIN
    -- Check if user_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'feedback' AND column_name = 'user_id') THEN
        
        -- Update feedback records to link to actual users
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
END $$;

-- Verify the feedback was inserted
SELECT COUNT(*) as feedback_count FROM feedback;
SELECT * FROM feedback LIMIT 5;
