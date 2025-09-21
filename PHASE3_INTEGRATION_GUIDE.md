# Phase 3: Backend Processing - Integration Guide

## 🚀 Overview

Phase 3 enhances your MetroBus Tracker with robust backend processing, comprehensive validation, real-time triggers, and advanced error handling.

## 📋 What's New

### ✅ Enhanced Location Update API
- **Comprehensive validation** - Coordinates, accuracy, speed, distance checks
- **Driver assignment validation** - Ensures driver is authorized for the bus
- **Error handling with fallbacks** - Multiple validation layers
- **Performance logging** - Track API usage and performance metrics

### ✅ Real-Time Database Triggers
- **Automatic notifications** - Bus location changes trigger instant updates
- **Event-driven architecture** - Emergency alerts, session changes
- **Connection health monitoring** - Track client connections and heartbeats
- **Scalable subscriptions** - Passenger, driver, and admin-specific channels

### ✅ Advanced Error Handling
- **Connection recovery** - Automatic reconnection with exponential backoff
- **Offline support** - Queue updates when connection is lost
- **Health monitoring** - System status and performance metrics
- **Data cleanup** - Automated maintenance of old records

## 🔧 Setup Instructions

### Step 1: Deploy Backend Components

Run the complete setup script in your Supabase SQL Editor:

```sql
-- Deploy all Phase 3 enhancements
\i sql/phase3-complete-setup.sql
```

Or run individual components:

```sql
-- Enhanced Location API
\i sql/enhanced-location-update-api.sql

-- Real-time Triggers
\i sql/realtime-triggers-system.sql
```

### Step 2: Update App Dependencies

Add the RealtimeContext to your app:

```javascript
// In App.js
import { RealtimeProvider } from './contexts/RealtimeContext';

export default function App() {
  return (
    <RealtimeProvider>
      <SupabaseProvider>
        {/* Your existing app components */}
      </SupabaseProvider>
    </RealtimeProvider>
  );
}
```

### Step 3: Use Real-Time Features

```javascript
// In any component
import { useRealtime } from '../contexts/RealtimeContext';

function BusMapScreen() {
  const { isConnected, connectionStatus, forceReconnect } = useRealtime();
  
  useEffect(() => {
    // Listen for bus location updates
    const handleBusUpdate = (event) => {
      console.log('Bus location updated:', event.detail);
      // Update your map markers here
    };
    
    window.addEventListener('busLocationUpdate', handleBusUpdate);
    return () => window.removeEventListener('busLocationUpdate', handleBusUpdate);
  }, []);
  
  return (
    <View>
      <Text>Connection: {connectionStatus}</Text>
      {!isConnected && (
        <TouchableOpacity onPress={forceReconnect}>
          <Text>Reconnect</Text>
        </TouchableOpacity>
      )}
      {/* Your map component */}
    </View>
  );
}
```

## 📊 Monitoring & Analytics

### System Health Check

```sql
-- Get real-time system status
SELECT get_system_health();
```

**Response:**
```json
{
  "system_status": "healthy",
  "metrics": {
    "active_buses": 3,
    "active_drivers": 2,
    "active_connections": 15,
    "recent_location_updates": 45,
    "avg_updates_per_minute": 4.5
  },
  "timestamp": "2025-09-13T10:30:00Z"
}
```

### Bus Performance Metrics

```sql
-- Get performance data for a specific bus
SELECT get_bus_performance_metrics('bus-uuid-here');
```

**Response:**
```json
{
  "bus_id": "ca9a94dc-dbef-46fe-b1c2-4e6ad54314fe",
  "metrics": {
    "total_location_updates": 1250,
    "average_accuracy_meters": 8.5,
    "max_speed_kmh": 65.0,
    "total_distance_km": 145.2,
    "active_hours": 6.5
  }
}
```

## 🔍 Validation Features

### Location Update Validation

The enhanced API automatically validates:

- **Coordinates** - Within valid world bounds (-90 to 90 lat, -180 to 180 lng)
- **Accuracy** - Rejects updates with accuracy > 100 meters
- **Speed** - Flags speeds > 120 km/h as unreasonable for buses
- **Distance** - Prevents location jumps > 50km between updates
- **Driver Assignment** - Ensures driver is authorized for the bus
- **Session Status** - Validates active driver session

### Error Response Examples

**Invalid Coordinates:**
```json
{
  "success": false,
  "error": "COORDINATES_OUT_OF_BOUNDS",
  "message": "Coordinates are outside valid range",
  "latitude": 91.0,
  "longitude": 120.0
}
```

**Poor Accuracy:**
```json
{
  "success": false,
  "error": "POOR_ACCURACY",
  "message": "Location accuracy is too poor (>100m)",
  "accuracy": 150
}
```

## 🔄 Real-Time Events

### Available Event Types

| Event Type | Description | Triggered When |
|------------|-------------|----------------|
| `bus_location_update` | Bus position changed | Bus coordinates update |
| `bus_status_change` | Bus status changed | Tracking status changes |
| `driver_session_start` | Driver started trip | New driver session |
| `driver_session_end` | Driver ended trip | Session ended |
| `emergency_alert` | Emergency reported | Emergency report created |

### Subscribing to Events

```javascript
// Listen for specific bus updates
const { subscribeToChannel } = useRealtime();

subscribeToChannel('bus_updates', {
  events: [{
    type: 'postgres_changes',
    filter: { event: 'UPDATE', schema: 'public', table: 'buses' },
    callback: (payload) => {
      console.log('Bus updated:', payload);
    }
  }]
});
```

## 🛠️ Maintenance & Cleanup

### Automated Data Cleanup

```sql
-- Clean up data older than 30 days
SELECT cleanup_old_data(30);
```

### Connection Health

```sql
-- Clean up stale connections
SELECT cleanup_stale_connections();
```

### Manual Monitoring

```sql
-- Check recent events
SELECT event_type, COUNT(*) 
FROM realtime_events 
WHERE created_at > now() - interval '1 hour'
GROUP BY event_type;

-- Check connection status
SELECT user_type, status, COUNT(*)
FROM client_connections
GROUP BY user_type, status;
```

## 🚨 Troubleshooting

### Common Issues

**1. Location Updates Failing**
```sql
-- Check validation errors in logs
SELECT * FROM location_update_log 
WHERE validation_result->>'success' = 'false'
ORDER BY created_at DESC LIMIT 10;
```

**2. Real-Time Not Working**
```javascript
// Check connection status
const { getConnectionInfo } = useRealtime();
console.log(getConnectionInfo());
```

**3. Performance Issues**
```sql
-- Check system load
SELECT get_system_health();

-- Check recent API performance
SELECT endpoint, AVG(execution_time_ms) as avg_time_ms
FROM api_usage_log 
WHERE created_at > now() - interval '1 hour'
GROUP BY endpoint;
```

## 🎯 Testing

### Test Enhanced Location Update

```sql
SELECT update_bus_location_enhanced(
  session_uuid => 'your-session-id',
  lat => 14.140965,
  lng => 120.9689883,
  accuracy_param => 5,
  speed_param => 25,
  heading_param => 180,
  battery_level_param => 0.8,
  is_moving_param => true,
  device_info => '{"platform": "test"}'::jsonb
);
```

### Test Real-Time Notifications

```sql
-- Trigger a bus update to test notifications
UPDATE buses 
SET latitude = latitude + 0.001 
WHERE id = 'your-bus-id';
```

## 📈 Performance Optimization

### Database Indexes

All necessary indexes are created automatically:
- `location_updates(created_at, bus_id)`
- `realtime_events(event_type, created_at)`
- `client_connections(last_ping, status)`

### Connection Optimization

- **Heartbeat Interval**: 30 seconds
- **Reconnection**: Exponential backoff (max 30s)
- **Connection Cleanup**: Every 15 minutes
- **Data Retention**: 30 days (configurable)

## 🎉 Phase 3 Complete!

Your MetroBus Tracker now has:

- ✅ **Robust location validation** with comprehensive error checking
- ✅ **Real-time notifications** for all bus location changes
- ✅ **Connection health monitoring** with automatic recovery
- ✅ **Performance analytics** and system health metrics
- ✅ **Automated maintenance** and data cleanup
- ✅ **Scalable architecture** ready for production deployment

**Next Phase**: Advanced features like route optimization, predictive analytics, and passenger notifications!
