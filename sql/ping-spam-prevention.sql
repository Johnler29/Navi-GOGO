-- Ping Spam Prevention System
-- Run this SQL in your Supabase SQL editor

-- Add rate limiting columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS ping_count_today INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ping_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_ping_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ping_block_until TIMESTAMP WITH TIME ZONE;

-- Add spam tracking to ping_notifications
ALTER TABLE ping_notifications ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT FALSE;

-- Create rate limiting function
CREATE OR REPLACE FUNCTION check_ping_rate_limit(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  recent_pings INTEGER;
  last_ping_time TIMESTAMP;
  time_since_last_ping INTERVAL;
BEGIN
  -- Get user's ping history
  SELECT ping_count_today, last_ping_reset, is_ping_blocked, ping_block_until
  INTO user_record
  FROM users
  WHERE id = user_uuid;

  -- Check if user is blocked
  IF user_record.is_ping_blocked AND user_record.ping_block_until > NOW() THEN
    RETURN json_build_object(
      'allowed', FALSE,
      'reason', 'blocked',
      'message', 'You are temporarily blocked from sending pings due to spam.',
      'blocked_until', user_record.ping_block_until
    );
  END IF;

  -- Reset daily counter if it's a new day
  IF user_record.last_ping_reset < (NOW() - INTERVAL '1 day') THEN
    UPDATE users 
    SET ping_count_today = 0, 
        last_ping_reset = NOW(),
        is_ping_blocked = FALSE,
        ping_block_until = NULL
    WHERE id = user_uuid;
    user_record.ping_count_today := 0;
  END IF;

  -- Check daily limit (50 pings per day)
  IF user_record.ping_count_today >= 50 THEN
    -- Block user for 24 hours
    UPDATE users 
    SET is_ping_blocked = TRUE,
        ping_block_until = NOW() + INTERVAL '24 hours'
    WHERE id = user_uuid;
    
    RETURN json_build_object(
      'allowed', FALSE,
      'reason', 'daily_limit',
      'message', 'Daily ping limit reached (50 pings per day). Try again tomorrow.',
      'blocked_until', NOW() + INTERVAL '24 hours'
    );
  END IF;

  -- Check for recent pings (cooldown: 30 seconds)
  SELECT created_at INTO last_ping_time
  FROM ping_notifications
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_ping_time IS NOT NULL THEN
    time_since_last_ping := NOW() - last_ping_time;
    
    IF time_since_last_ping < INTERVAL '30 seconds' THEN
      RETURN json_build_object(
        'allowed', FALSE,
        'reason', 'cooldown',
        'message', 'Please wait before sending another ping.',
        'cooldown_remaining', 30 - EXTRACT(EPOCH FROM time_since_last_ping)::INTEGER
      );
    END IF;
  END IF;

  -- Check for rapid pings (more than 3 in last minute = spam)
  SELECT COUNT(*) INTO recent_pings
  FROM ping_notifications
  WHERE user_id = user_uuid
    AND created_at > NOW() - INTERVAL '1 minute';

  IF recent_pings >= 3 THEN
    -- Mark as spammer and block for 1 hour
    UPDATE users 
    SET is_ping_blocked = TRUE,
        ping_block_until = NOW() + INTERVAL '1 hour'
    WHERE id = user_uuid;
    
    RETURN json_build_object(
      'allowed', FALSE,
      'reason', 'spam_detected',
      'message', 'Spam detected. You are blocked for 1 hour.',
      'blocked_until', NOW() + INTERVAL '1 hour'
    );
  END IF;

  -- All checks passed - increment counter
  UPDATE users 
  SET ping_count_today = ping_count_today + 1
  WHERE id = user_uuid;

  RETURN json_build_object(
    'allowed', TRUE,
    'remaining_today', 50 - (user_record.ping_count_today + 1),
    'message', 'Ping allowed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send ping with rate limiting
CREATE OR REPLACE FUNCTION send_ping_with_limit(
  p_user_id UUID,
  p_bus_id UUID,
  p_ping_type VARCHAR,
  p_message TEXT DEFAULT '',
  p_location_latitude DECIMAL DEFAULT NULL,
  p_location_longitude DECIMAL DEFAULT NULL,
  p_location_address TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  rate_limit_result JSON;
  new_ping_id UUID;
BEGIN
  -- Check rate limit
  rate_limit_result := check_ping_rate_limit(p_user_id);
  
  IF (rate_limit_result->>'allowed')::BOOLEAN = FALSE THEN
    RETURN rate_limit_result;
  END IF;

  -- Create ping notification
  INSERT INTO ping_notifications (
    user_id,
    bus_id,
    ping_type,
    message,
    location_latitude,
    location_longitude,
    location_address,
    status
  ) VALUES (
    p_user_id,
    p_bus_id,
    p_ping_type,
    p_message,
    p_location_latitude,
    p_location_longitude,
    p_location_address,
    'pending'
  ) RETURNING id INTO new_ping_id;

  RETURN json_build_object(
    'success', TRUE,
    'ping_id', new_ping_id,
    'remaining_today', (rate_limit_result->>'remaining_today')::INTEGER,
    'message', 'Ping sent successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin function to unblock user
CREATE OR REPLACE FUNCTION admin_unblock_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users 
  SET is_ping_blocked = FALSE,
      ping_block_until = NULL,
      ping_count_today = 0
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's ping status
CREATE OR REPLACE FUNCTION get_user_ping_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  last_ping_time TIMESTAMP;
  cooldown_remaining INTEGER;
BEGIN
  SELECT ping_count_today, is_ping_blocked, ping_block_until, last_ping_reset
  INTO user_record
  FROM users
  WHERE id = p_user_id;

  -- Get last ping time
  SELECT created_at INTO last_ping_time
  FROM ping_notifications
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calculate cooldown remaining
  IF last_ping_time IS NOT NULL THEN
    cooldown_remaining := GREATEST(0, 30 - EXTRACT(EPOCH FROM (NOW() - last_ping_time))::INTEGER);
  ELSE
    cooldown_remaining := 0;
  END IF;

  RETURN json_build_object(
    'is_blocked', user_record.is_ping_blocked,
    'blocked_until', user_record.ping_block_until,
    'pings_today', user_record.ping_count_today,
    'pings_remaining', 50 - user_record.ping_count_today,
    'cooldown_remaining', cooldown_remaining,
    'can_ping', NOT user_record.is_ping_blocked AND cooldown_remaining = 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ping_notifications_user_created 
ON ping_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_ping_blocked 
ON users(is_ping_blocked, ping_block_until);

-- Add RLS policies for new functions (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can check their own rate limit'
  ) THEN
    CREATE POLICY "Users can check their own rate limit" ON users
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

COMMENT ON FUNCTION check_ping_rate_limit IS 'Checks if user can send a ping based on rate limits';
COMMENT ON FUNCTION send_ping_with_limit IS 'Sends a ping with built-in rate limiting';
COMMENT ON FUNCTION admin_unblock_user IS 'Admin function to unblock a user from sending pings';
COMMENT ON FUNCTION get_user_ping_status IS 'Returns user''s current ping status and limits';

