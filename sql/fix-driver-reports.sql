-- Fix driver reports by allowing null user_id in feedback table
-- This allows drivers to report emergencies and maintenance issues

-- First, let's check the current constraint
-- ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;

-- Make user_id nullable for driver reports
ALTER TABLE feedback ALTER COLUMN user_id DROP NOT NULL;

-- Add a new column to track driver reports specifically
ALTER TABLE feedback ADD COLUMN driver_id UUID REFERENCES drivers(id);

-- Add a new column to track report type more specifically
ALTER TABLE feedback ADD COLUMN report_type VARCHAR(50) DEFAULT 'general';

-- Update existing records to have proper report types
UPDATE feedback SET report_type = 'general' WHERE report_type IS NULL;

-- Create an index for better performance on driver reports
CREATE INDEX IF NOT EXISTS idx_feedback_driver_id ON feedback(driver_id);
CREATE INDEX IF NOT EXISTS idx_feedback_report_type ON feedback(report_type);

-- Add a comment to explain the schema
COMMENT ON COLUMN feedback.user_id IS 'User ID for passenger feedback, NULL for driver reports';
COMMENT ON COLUMN feedback.driver_id IS 'Driver ID for driver reports (emergency, maintenance)';
COMMENT ON COLUMN feedback.report_type IS 'Type of report: general, emergency, maintenance, feedback';
