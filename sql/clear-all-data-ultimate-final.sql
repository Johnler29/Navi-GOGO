-- ULTIMATE FINAL clear of all data - handles ALL possible foreign key constraints
-- This will clear everything in the absolutely correct order

-- Step 1: Clear all data in correct order (respecting ALL foreign key constraints)
-- Start with the most dependent tables first

-- Clear audit and logging tables
DELETE FROM comprehensive_audit_logs;
DELETE FROM location_update_log;

-- Clear feedback and user-related tables
DELETE FROM feedback;  -- This was the missing piece!

-- Clear location and tracking tables (these reference driver_sessions)
DELETE FROM location_updates;

-- Clear rate limiting and patterns
DELETE FROM rate_limits;
DELETE FROM location_patterns;

-- Clear driver sessions (now safe to delete)
DELETE FROM driver_sessions;

-- Clear assignment and schedule tables
DELETE FROM driver_bus_assignments;
DELETE FROM schedules;

-- Finally clear the main tables
DELETE FROM buses;
DELETE FROM drivers;
DELETE FROM routes;

-- Step 2: Verify data is cleared
SELECT 'Routes remaining:' as info, COUNT(*) as count FROM routes
UNION ALL
SELECT 'Drivers remaining:', COUNT(*) FROM drivers
UNION ALL
SELECT 'Buses remaining:', COUNT(*) FROM buses
UNION ALL
SELECT 'Assignments remaining:', COUNT(*) FROM driver_bus_assignments
UNION ALL
SELECT 'Schedules remaining:', COUNT(*) FROM schedules
UNION ALL
SELECT 'Location updates remaining:', COUNT(*) FROM location_updates
UNION ALL
SELECT 'Location update logs remaining:', COUNT(*) FROM location_update_log
UNION ALL
SELECT 'Driver sessions remaining:', COUNT(*) FROM driver_sessions
UNION ALL
SELECT 'Feedback remaining:', COUNT(*) FROM feedback
UNION ALL
SELECT 'Audit logs remaining:', COUNT(*) FROM comprehensive_audit_logs;

-- Step 3: Show success message
SELECT 'SUCCESS: All data cleared completely!' as status;
