# MetroBus Tracker - Complete Database Schema

This is a comprehensive database schema for the MetroBus Tracker application, designed to work with Supabase PostgreSQL.

## 🗄️ Database Overview

The schema includes all necessary tables, views, functions, and sample data for a complete bus tracking system.

## 📋 Tables

### Core Tables
- **`routes`** - Bus routes with origin, destination, fare, and duration
- **`drivers`** - Driver information and contact details
- **`buses`** - Bus fleet with capacity, status, and assignments
- **`stops`** - Bus stops with coordinates and route sequences
- **`schedules`** - Timetables for buses on specific routes
- **`users`** - Passenger information and preferences
- **`bus_tracking`** - Real-time location data for buses
- **`feedback`** - User feedback and ratings

## 🔍 Views

### `buses_with_tracking`
Main view that joins buses with their tracking data:
```sql
SELECT bus_id, bus_number, name, capacity, status, route_id, driver_id,
       latitude, longitude, speed, heading, tracking_status, tracking_updated_at
FROM buses b LEFT JOIN bus_tracking t ON t.bus_id = b.id
```

### `active_buses_with_routes`
Shows only active buses with complete route and driver information:
```sql
SELECT bus_id, bus_number, bus_name, route_number, origin, destination,
       driver_name, latitude, longitude, speed, tracking_status
FROM buses b
LEFT JOIN routes r ON r.id = b.route_id
LEFT JOIN drivers d ON d.id = b.driver_id
LEFT JOIN bus_tracking t ON t.bus_id = b.id
WHERE b.status = 'active'
```

### `route_schedules_detailed`
Complete schedule information with bus and driver details:
```sql
SELECT schedule_id, departure_time, arrival_time, route_number,
       bus_name, driver_name, origin, destination
FROM schedules s
LEFT JOIN routes r ON r.id = s.route_id
LEFT JOIN buses b ON b.id = s.bus_id
LEFT JOIN drivers d ON d.id = b.driver_id
WHERE s.is_active = true
```

## ⚙️ Functions

### `get_nearby_buses(user_lat, user_lng, radius_km)`
Finds buses within a specified radius of user location:
```sql
SELECT * FROM get_nearby_buses(14.5995, 120.9842, 5.0)
```

### `update_bus_location(bus_id, latitude, longitude, speed, heading, status)`
Updates bus location with real-time data:
```sql
SELECT update_bus_location('bus-uuid', 14.5995, 120.9842, 35.5, 90, 'moving')
```

### `get_bus_statistics()`
Returns system statistics:
```sql
SELECT * FROM get_bus_statistics()
-- Returns: total_buses, active_buses, buses_with_location, total_routes, active_routes
```

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- **Public read access** for buses, routes, stops, schedules, drivers, and tracking
- **Feedback policies** allow public insertion and reading
- **Proper permissions** granted for views and functions

## 📊 Sample Data

The schema includes comprehensive sample data:
- **3 Routes**: Dasmarinas to Manila, Makati, Quezon City
- **3 Drivers**: With contact information
- **3 Buses**: Assigned to routes with drivers
- **3 Stops**: Along the main route
- **6 Schedules**: Morning and afternoon departures
- **3 Tracking Records**: Real-time location data

## 🚀 Usage

### 1. Run the Schema
Execute the entire `supabase-schema.sql` file in your Supabase SQL editor.

### 2. Verify Setup
Check that all tables, views, and functions are created:
```sql
-- Check tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check views
SELECT table_name FROM information_schema.views WHERE table_schema = 'public';

-- Check functions
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
```

### 3. Test the Views
```sql
-- Get all buses with tracking
SELECT * FROM buses_with_tracking;

-- Get active buses
SELECT * FROM active_buses_with_routes;

-- Get nearby buses
SELECT * FROM get_nearby_buses(14.5995, 120.9842, 10.0);
```

## 🔄 Real-time Features

The schema supports real-time updates through:
- **PostgreSQL triggers** for automatic `updated_at` timestamps
- **Supabase real-time subscriptions** for live bus tracking
- **Optimized indexes** for fast location queries

## 📱 App Integration

The schema is designed to work seamlessly with the React Native app:
- **Consistent field names** across all views
- **Proper data types** for coordinates and timestamps
- **Efficient queries** for mobile performance
- **Real-time updates** for live tracking

## 🛠️ Maintenance

### Adding New Buses
```sql
INSERT INTO buses (bus_number, name, capacity, route_id, driver_id)
VALUES ('B004', 'Metro Link Bus # 25', 50, 'route-uuid', 'driver-uuid');
```

### Adding New Routes
```sql
INSERT INTO routes (route_number, name, origin, destination, estimated_duration, fare)
VALUES ('R004', 'Dasmarinas - Pasay', 'Dasmarinas City', 'Pasay City', 110, 52.00);
```

### Updating Bus Location
```sql
SELECT update_bus_location('bus-uuid', 14.5995, 120.9842, 30.0, 180, 'moving');
```

## 📈 Performance

The schema includes optimized indexes for:
- Bus route lookups
- Location-based queries
- Real-time updates
- Schedule searches

## 🔧 Troubleshooting

### Common Issues
1. **Missing tracking data**: Check if `bus_tracking` records exist
2. **Permission errors**: Verify RLS policies are enabled
3. **Real-time not working**: Check Supabase real-time settings
4. **Slow queries**: Ensure indexes are created

### Debug Queries
```sql
-- Check bus tracking data
SELECT b.bus_number, t.latitude, t.longitude, t.updated_at
FROM buses b LEFT JOIN bus_tracking t ON t.bus_id = b.id;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE schemaname = 'public';
```

This schema provides a complete foundation for a professional bus tracking system with real-time capabilities, proper security, and optimized performance.
