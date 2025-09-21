# Phase 3 Testing Guide

## 🧪 How to Check if Phase 3 is Working

### **Step 1: Run the Verification Script**

Copy and paste this into your **Supabase SQL Editor**:

```sql
-- Quick Phase 3 Health Check
SELECT get_system_health() as system_health;
```

**Expected Result:**
```json
{
  "system_status": "healthy" | "partial" | "inactive",
  "metrics": {
    "active_buses": 2,
    "active_drivers": 1,
    "recent_location_updates": 15
  },
  "timestamp": "2025-09-13T10:30:00Z"
}
```

### **Step 2: Comprehensive Testing**

Run the complete test script:
```sql
-- File: sql/test-phase3-deployment.sql
-- Copy the entire file content into Supabase SQL Editor
```

**Look for these indicators:**
- ✅ = Working correctly
- ❌ = Missing or broken
- ⚠️ = Needs attention

---

## 🔍 **Manual Testing Steps**

### **Test 1: Enhanced Location API**

1. **Check if function exists:**
```sql
SELECT COUNT(*) as function_exists 
FROM pg_proc 
WHERE proname = 'update_bus_location_enhanced';
-- Should return: 1
```

2. **Test with active session:**
```sql
-- First get an active session ID
SELECT id, driver_id, bus_id 
FROM driver_sessions 
WHERE status = 'active' 
LIMIT 1;

-- Then test the enhanced function (replace YOUR-SESSION-ID)
SELECT update_bus_location_enhanced(
  session_uuid => 'YOUR-SESSION-ID'::uuid,
  lat => 14.140965,
  lng => 120.9689883,
  accuracy_param => 5,
  speed_param => 25
) as test_result;
```

**Expected Result:**
```json
{
  "success": true,
  "location_id": "uuid-here",
  "session_info": {...},
  "location_data": {...}
}
```

### **Test 2: Real-Time Triggers**

1. **Check triggers exist:**
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_bus_location_update', 'trigger_driver_session_change');
-- Should return: 2 rows
```

2. **Test trigger by updating bus location:**
```sql
-- Update a bus location to trigger notification
UPDATE buses 
SET latitude = latitude + 0.001 
WHERE id = (SELECT id FROM buses LIMIT 1);

-- Check if event was created
SELECT event_type, created_at 
FROM realtime_events 
ORDER BY created_at DESC 
LIMIT 1;
```

### **Test 3: Real-Time Publication**

```sql
-- Check what tables are in real-time publication
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename IN ('buses', 'driver_sessions', 'location_updates');
-- Should return: 3 rows
```

---

## 📱 **App-Side Testing**

### **Test 1: Driver Location Tracking**

1. **Login as driver** in your app
2. **Start a trip** (this creates a driver session)
3. **Start tracking** on the map screen
4. **Check database:**
```sql
-- Should see new location updates
SELECT COUNT(*) as recent_updates 
FROM location_updates 
WHERE created_at > now() - interval '5 minutes';

-- Should see bus location updated
SELECT name, latitude, longitude, last_location_update 
FROM buses 
WHERE last_location_update > now() - interval '5 minutes';
```

### **Test 2: Real-Time Notifications**

1. **Open passenger side** of the app
2. **Start driver tracking** (from driver side)
3. **Move around** with driver app
4. **Check if passenger map updates** in real-time

---

## 🚨 **Troubleshooting**

### **Issue: System Health Shows "inactive"**
```sql
-- Check what's missing
SELECT 
  (SELECT COUNT(*) FROM driver_sessions WHERE status = 'active') as active_sessions,
  (SELECT COUNT(*) FROM buses WHERE tracking_status = 'moving') as moving_buses,
  (SELECT COUNT(*) FROM location_updates WHERE created_at > now() - interval '10 minutes') as recent_updates;
```

**Solution:** Start a trip from driver side to create active session.

### **Issue: No Recent Location Updates**
```sql
-- Check if driver sessions exist
SELECT id, status, started_at FROM driver_sessions ORDER BY started_at DESC LIMIT 3;

-- Check if location tracking is working
SELECT bus_id, created_at FROM location_updates ORDER BY created_at DESC LIMIT 5;
```

**Solution:** Ensure driver has started tracking on map screen.

### **Issue: Real-Time Not Working**
```sql
-- Check if triggers are firing
SELECT COUNT(*) FROM realtime_events WHERE created_at > now() - interval '1 hour';

-- Check publication
SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

**Solution:** Re-run the Phase 3 deployment script.

---

## ✅ **Success Indicators**

Your Phase 3 is working correctly if you see:

1. **System Health:** `"system_status": "healthy"`
2. **Active Sessions:** Driver sessions with `status = 'active'`
3. **Location Updates:** Recent entries in `location_updates` table
4. **Real-Time Events:** New events in `realtime_events` table
5. **Bus Updates:** `buses.last_location_update` is recent
6. **Triggers Active:** Location changes create events automatically

---

## 🎯 **Quick Verification Commands**

```sql
-- 1. Check deployment completeness
SELECT get_system_health();

-- 2. Check active sessions
SELECT COUNT(*) FROM driver_sessions WHERE status = 'active';

-- 3. Check recent activity
SELECT COUNT(*) FROM location_updates WHERE created_at > now() - interval '10 minutes';

-- 4. Check real-time events
SELECT COUNT(*) FROM realtime_events WHERE created_at > now() - interval '1 hour';

-- 5. Check functions
SELECT COUNT(*) FROM pg_proc WHERE proname = 'update_bus_location_enhanced';
```

**All should return positive numbers for a healthy system!** 🚀
