# 🚌 MetroBus Tracker - Comprehensive System Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Mobile App Features](#mobile-app-features)
7. [Admin Dashboard](#admin-dashboard)
8. [Driver App Features](#driver-app-features)
9. [Ping/Notification System](#pingnotification-system)
10. [API Endpoints & Functions](#api-endpoints--functions)
11. [Setup & Deployment](#setup--deployment)
12. [Security & Authentication](#security--authentication)
13. [Real-time Features](#real-time-features)
14. [Troubleshooting](#troubleshooting)

---

## System Overview

**MetroBus Tracker** is a comprehensive real-time bus tracking and fleet management system designed for modern public transportation. It consists of three main components:

- **📱 Passenger Mobile App** - React Native application for passengers to track buses in real-time
- **🖥️ Admin Dashboard** - Web-based administration panel for fleet management
- **👨‍✈️ Driver App** - Integrated driver interface for route management and real-time tracking
- **🗄️ Supabase Backend** - PostgreSQL database with real-time capabilities

### Key Capabilities
✅ Real-time bus location tracking  
✅ Route planning and search  
✅ Driver management and assignment  
✅ Rate-limited ping/notification system  
✅ Emergency reporting  
✅ Analytics and performance metrics  
✅ Feedback and rating system  

---

## Architecture

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                        Passenger Mobile App                      │
│  (React Native + Expo) - HomeScreen, MapScreen, RouteScreen    │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────┼────────────────────────────────────────────────┐
│                │          Admin Dashboard                        │
│                │  (React 18 + Tailwind) - Fleet, Routes, Users  │
│                │                                                 │
└────────────────┼────────────────────────────────────────────────┘
                 │
┌────────────────┼────────────────────────────────────────────────┐
│                ▼                                                  │
│          SUPABASE BACKEND (PostgreSQL)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Authentication (Auth)                                 │  │
│  │ • Real-time Subscriptions (Realtime)                   │  │
│  │ • Database Tables (15+ core tables)                    │  │
│  │ • Row Level Security (RLS Policies)                   │  │
│  │ • Database Functions (50+ functions)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow
```
1. Passenger Opens App → Requests Location Permission
2. App Fetches Buses from Supabase → Real-time subscription started
3. Driver Updates Location → Stored in bus_tracking table
4. WebSocket Events → App receives live updates
5. Passenger Sends Ping → Rate limited → Stored in ping_notifications
6. Driver Receives Alert → Vibration + Notification
7. Admin Monitors Dashboard → Real-time data sync
```

---

## Technology Stack

### Frontend - Mobile App
```
Framework:           React Native 18 + Expo
Navigation:          React Navigation
Maps:                React Native Maps (Google Maps)
Location:            Expo Location API
State Management:    React Context API
Styling:             React Native StyleSheet
Backend Client:      @supabase/supabase-js
```

### Frontend - Admin Dashboard
```
Framework:           React 18
UI Framework:        Tailwind CSS
Maps:                React Leaflet
Charts:              Recharts
Icons:               Lucide React
Form Handling:       React Hook Form
Backend Client:      @supabase/supabase-js
```

### Backend & Database
```
Database:            PostgreSQL (Supabase hosted)
Authentication:      Supabase Auth
Real-time:           Supabase Realtime (WebSocket)
API:                 Supabase REST API
Security:            Row Level Security (RLS)
Functions:           PostgreSQL Stored Procedures
```

### External Services
```
Maps:                Google Maps API
Storage:             Supabase Storage (future)
Authentication:      Supabase Auth providers
```

---

## Project Structure

### Complete Directory Layout
```
MetroBus-Tracker-main/
│
├── 📱 MOBILE APP
│   ├── App.js                          # Main app entry point
│   ├── app.json                        # Expo configuration
│   ├── babel.config.js                 # Babel configuration
│   ├── metro.config.js                 # Metro bundler config
│   │
│   ├── screens/                        # Screen components
│   │   ├── HomeScreen.js               # Passenger dashboard
│   │   ├── MapScreen.js                # Live bus tracking map
│   │   ├── BusListScreen.js            # Browse available buses
│   │   ├── RouteScreen.js              # Route search & planning
│   │   ├── SettingsScreen.js           # User preferences
│   │   ├── DriverLoginScreen.js        # Driver authentication
│   │   ├── DriverHomeScreen.js         # Driver main dashboard
│   │   ├── DriverMapScreen.js          # Driver route tracking
│   │   ├── DriverProfileScreen.js      # Driver profile management
│   │   ├── DriverScheduleScreen.js     # Schedule management
│   │   ├── DriverNotificationsScreen.js# Ping notifications
│   │   └── ...                         # Other screens
│   │
│   ├── components/                     # Reusable components
│   │   ├── RealtimeBusMap.js           # Live map component
│   │   ├── RoutePolyline.js            # Route visualization
│   │   ├── CustomDrawer.js             # Navigation drawer
│   │   ├── AlarmModal.js               # Emergency reporting
│   │   ├── SetAlarmModal.js            # Alarm/ping modal
│   │   └── ...                         # Other components
│   │
│   ├── contexts/                       # React Context providers
│   │   ├── AuthContext.js              # Auth state management
│   │   ├── SupabaseContext.js          # Database operations
│   │   ├── RealtimeContext.js          # Real-time subscriptions
│   │   └── DrawerContext.js            # Navigation state
│   │
│   ├── lib/                            # Utilities & config
│   │   ├── supabase.js                 # Supabase client & helpers
│   │   └── storage.js                  # Local storage utilities
│   │
│   ├── data/                           # Static data
│   │   └── routes.js                   # Route definitions
│   │
│   ├── assets/                         # App assets
│   │   ├── icon.png
│   │   ├── splash-icon.png
│   │   └── ...
│   │
│   ├── scripts/                        # Utility scripts
│   │   ├── add-sample-routes.js
│   │   ├── add-test-drivers.js
│   │   └── ...
│   │
│   └── package.json                    # Dependencies
│
├── 🖥️ ADMIN DASHBOARD
│   ├── admin-website/
│   │   ├── src/
│   │   │   ├── App.js                  # Admin app root
│   │   │   ├── index.js                # Entry point
│   │   │   ├── index.css               # Global styles
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── Header.js           # Top navigation
│   │   │   │   ├── Sidebar.js          # Left sidebar
│   │   │   │   ├── Layout.js           # Page layout wrapper
│   │   │   │   ├── BusModal.js         # Bus form modal
│   │   │   │   ├── LoadingSpinner.js   # Loading indicator
│   │   │   │   ├── MetricCard.js       # Stat card component
│   │   │   │   ├── PerformanceChart.js # Chart component
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.js        # Main dashboard
│   │   │   │   ├── FleetManagement.js  # Bus management
│   │   │   │   ├── RouteManagement.js  # Route management
│   │   │   │   ├── DriverManagement.js # Driver management
│   │   │   │   ├── UserManagement.js   # Passenger management
│   │   │   │   ├── ScheduleManagement.js# Schedule management
│   │   │   │   ├── PingNotifications.js # Notification center
│   │   │   │   ├── Reports.js          # Analytics & reports
│   │   │   │   ├── Settings.js         # System settings
│   │   │   │   └── Login.js            # Admin login
│   │   │   │
│   │   │   ├── contexts/
│   │   │   │   ├── AuthContext.js      # Admin auth
│   │   │   │   └── SupabaseContext.js  # Database operations
│   │   │   │
│   │   │   └── utils/
│   │   │       └── notifications.js    # Notification helpers
│   │   │
│   │   ├── public/
│   │   │   └── index.html
│   │   │
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   └── ADMIN-SETUP-GUIDE.md
│   │
│   └── start-admin.js
│
├── 🗄️ DATABASE & SQL
│   ├── sql/
│   │   ├── supabase-schema.sql         # Core database schema
│   │   ├── ping-bus-schema.sql         # Ping notification tables
│   │   ├── ping-spam-prevention.sql    # Rate limiting functions
│   │   ├── admin-auth-setup.sql        # Admin authentication
│   │   ├── setup-user-management.sql   # User management tables
│   │   ├── complete-user-management-setup.sql
│   │   ├── complete-route-management-setup.sql
│   │   ├── enhance-routes-for-admin-management.sql
│   │   └── ...
│   │
│   └── scripts/
│       ├── add-sample-routes.js
│       ├── add-test-drivers.js
│       └── update-existing-driver.js
│
├── 📚 DOCUMENTATION
│   ├── README.md                       # Project overview
│   ├── DATABASE_SCHEMA.md              # Database documentation
│   ├── SUPABASE_SETUP.md               # Supabase setup guide
│   ├── GOOGLE_MAPS_SETUP.md            # Maps configuration
│   ├── ANDROID_SETUP.md                # Android build guide
│   ├── USER_MANAGEMENT_README.md       # User management features
│   ├── REALTIME_TRACKING_GUIDE.md      # Real-time features
│   ├── PHASE3_INTEGRATION_GUIDE.md     # Integration guide
│   ├── FULL_APP_DESIGN_UPDATES.md      # Design documentation
│   └── COMPREHENSIVE_SYSTEM_GUIDE.md   # This file
│
├── 🤖 ANDROID
│   ├── app/
│   │   ├── build/                      # Build output
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── AndroidManifest.xml
│   │   │   │   ├── java/               # Android native code
│   │   │   │   └── res/                # Android resources
│   │   │   └── debug/
│   │   ├── build.gradle
│   │   ├── debug.keystore              # Debug signing key
│   │   └── release.keystore            # Release signing key
│   │
│   ├── gradle/
│   ├── build.gradle
│   ├── gradle.properties
│   ├── gradlew / gradlew.bat
│   ├── settings.gradle
│   └── local.properties
│
├── Configuration Files
│   ├── package.json                    # Root dependencies
│   ├── package-lock.json
│   ├── eas.json                        # Expo Application Services config
│   ├── react-native.config.js
│   ├── babel.config.js
│   └── metro.config.js
│
└── Root Documentation
    ├── README.md
    └── .gitignore
```

---

## Database Schema

### Core Tables

#### 1. **buses** - Fleet Management
```sql
Columns:
  - id (UUID) - Primary key
  - bus_number (VARCHAR) - Unique bus identifier (e.g., "B001")
  - name (VARCHAR) - Display name
  - capacity (INTEGER) - Total seating capacity
  - pwd_seats (INTEGER) - PWD-accessible seats
  - status (VARCHAR) - active, maintenance, inactive
  - route_id (UUID) - Current assigned route
  - driver_id (UUID) - Current assigned driver
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

Indexes: bus_number, route_id, driver_id, status
```

#### 2. **routes** - Route Definitions
```sql
Columns:
  - id (UUID) - Primary key
  - route_number (VARCHAR) - Route code (e.g., "R001")
  - name (VARCHAR) - Route name
  - origin (VARCHAR) - Starting point
  - destination (VARCHAR) - Ending point
  - estimated_duration (INTEGER) - Minutes
  - fare (DECIMAL) - Route fare
  - is_active (BOOLEAN)
  - created_at (TIMESTAMP)

Indexes: route_number, is_active
```

#### 3. **drivers** - Driver Information
```sql
Columns:
  - id (UUID) - Primary key
  - first_name (VARCHAR)
  - last_name (VARCHAR)
  - license_number (VARCHAR) - Driver license ID
  - license_expiry (DATE)
  - phone (VARCHAR)
  - email (VARCHAR)
  - status (VARCHAR) - active, inactive, on_leave
  - years_experience (INTEGER)
  - created_at (TIMESTAMP)

Indexes: license_number, email, status
```

#### 4. **stops** - Bus Stops
```sql
Columns:
  - id (UUID) - Primary key
  - route_id (UUID) - Associated route
  - stop_name (VARCHAR) - Stop identifier
  - latitude (DECIMAL)
  - longitude (DECIMAL)
  - sequence (INTEGER) - Order in route
  - is_active (BOOLEAN)
  - created_at (TIMESTAMP)

Indexes: route_id, is_active
```

#### 5. **schedules** - Timetables
```sql
Columns:
  - id (UUID) - Primary key
  - route_id (UUID)
  - bus_id (UUID)
  - driver_id (UUID)
  - departure_time (TIME)
  - arrival_time (TIME)
  - date (DATE) - Schedule date
  - is_active (BOOLEAN)
  - created_at (TIMESTAMP)

Indexes: route_id, bus_id, date, is_active
```

#### 6. **users** - Passengers
```sql
Columns:
  - id (UUID) - Primary key
  - email (VARCHAR) - Unique email
  - first_name (VARCHAR)
  - last_name (VARCHAR)
  - phone (VARCHAR)
  - is_active (BOOLEAN)
  - ping_count_today (INTEGER) - Daily ping counter
  - is_ping_blocked (BOOLEAN) - Spam prevention flag
  - last_ping_reset (TIMESTAMP) - Daily reset time
  - ping_block_until (TIMESTAMP) - Block expiration
  - created_at (TIMESTAMP)

Indexes: email, is_active, is_ping_blocked
```

#### 7. **bus_tracking** - Real-time Location
```sql
Columns:
  - id (UUID) - Primary key
  - bus_id (UUID) - Foreign key to buses
  - latitude (DECIMAL)
  - longitude (DECIMAL)
  - speed (DECIMAL) - km/h
  - heading (DECIMAL) - Direction 0-360°
  - accuracy (DECIMAL) - GPS accuracy
  - tracking_status (VARCHAR) - active, idle, offline
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

Indexes: bus_id, created_at, tracking_status
```

#### 8. **ping_notifications** - Passenger Alerts
```sql
Columns:
  - id (UUID) - Primary key
  - user_id (UUID) - Sender
  - bus_id (UUID) - Target bus
  - ping_type (VARCHAR) - ride_request, eta_request, etc.
  - message (TEXT)
  - status (VARCHAR) - pending, acknowledged, completed, cancelled
  - priority (VARCHAR) - low, normal, high, urgent
  - location_latitude (DECIMAL)
  - location_longitude (DECIMAL)
  - location_address (TEXT)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
  - acknowledged_at (TIMESTAMP)
  - completed_at (TIMESTAMP)

Indexes: user_id, bus_id, status, created_at
```

#### 9. **feedback** - User Ratings & Comments
```sql
Columns:
  - id (UUID) - Primary key
  - user_id (UUID)
  - bus_id (UUID)
  - route_id (UUID)
  - rating (INTEGER) - 1-5 stars
  - category (VARCHAR) - compliment, complaint, suggestion
  - comment (TEXT)
  - is_anonymous (BOOLEAN)
  - created_at (TIMESTAMP)

Indexes: user_id, bus_id, rating, category
```

### Database Views

#### 1. **buses_with_tracking**
Joins buses with their latest tracking data
```sql
SELECT: bus_id, bus_number, name, capacity, status, route_id, driver_id,
        latitude, longitude, speed, heading, tracking_status, tracking_updated_at
```

#### 2. **active_buses_with_routes**
Shows only active buses with complete information
```sql
SELECT: bus_id, bus_number, bus_name, route_number, origin, destination,
        driver_name, latitude, longitude, speed, tracking_status
WHERE: status = 'active'
```

#### 3. **route_schedules_detailed**
Complete schedule information with related data
```sql
SELECT: schedule_id, departure_time, arrival_time, route_number,
        bus_name, driver_name, origin, destination
WHERE: is_active = true
```

---

## Mobile App Features

### 📱 Passenger Features

#### Home Screen
- **User Dashboard** - Quick access to common tasks
- **Bus Count** - Active buses on route
- **Recent Activity** - Last searched routes
- **Quick Actions** - Search, map view, settings
- **Location Permission** - GPS access request

#### Map Screen (Live Tracking)
- **Real-time Map** - Google Maps integration
- **Bus Markers** - Dynamic bus locations
- **Bus Selection** - Tap to view bus details
- **Route Display** - Route polyline visualization
- **Passenger Location** - Show user on map
- **Ping Functionality** - Send alerts to drivers
- **Rate Limiting** - 50 pings/day, 30-sec cooldown

#### Bus List Screen
- **Browse Buses** - All available buses
- **Route Info** - Bus route information
- **Capacity Display** - Passenger count and PWD seats
- **Status Indicator** - Active, delayed, etc.
- **Distance Calculation** - Distance from user
- **Filter & Sort** - By route, distance, status

#### Route Planning Screen
- **Route Search** - By origin and destination
- **Detailed Info** - Fare, duration, stops
- **Schedule View** - Upcoming departure times
- **Stop Details** - All stops on route
- **Driver Info** - Current driver assignment
- **Feedback History** - Route ratings

#### Settings Screen
- **User Profile** - Edit personal information
- **Preferences** - Notification settings
- **Account Management** - Password, email
- **About** - App version, help, feedback
- **Logout** - Session management

### 👨‍✈️ Driver Features (Integrated)

#### Driver Login
- **Authentication** - Driver credentials
- **Session Management** - Start/end shift
- **Bus Assignment** - View assigned bus
- **Route Display** - Current route info

#### Driver Dashboard
- **On-Duty Toggle** - Start/stop tracking
- **Current Bus** - Active bus details
- **Route Info** - Next stops, schedule
- **Ping Notifications** - Real-time passenger alerts
- **Unread Count** - Notification counter
- **Emergency Features** - Emergency reporting

#### Real-time Location Tracking
- **GPS Updates** - Every 10-30 seconds
- **Speed Monitoring** - Current speed display
- **Battery Optimization** - Adaptive update intervals
- **Background Tracking** - Continuous operation
- **Location Accuracy** - Accuracy indicator

#### Ping Notification Handling
- **Alert Reception** - Real-time notifications
- **Vibration Feedback** - Haptic feedback
- **Modal Display** - Passenger details
- **Acknowledgment** - Mark as seen
- **Completion** - Mark as resolved

---

## Admin Dashboard

### 🖥️ Admin Features

#### Dashboard
- **System Overview** - KPI cards
- **Active Buses** - Real-time count
- **Routes Status** - Active routes
- **Driver Status** - On-duty drivers
- **Performance Charts** - Analytics visualization
- **System Health** - Database status

#### Fleet Management
- **Bus Inventory** - Add, edit, delete buses
- **Bus Details** - Number, capacity, status
- **Driver Assignment** - Assign drivers to buses
- **Maintenance Scheduling** - Track maintenance
- **Capacity Management** - PWD seat configuration
- **Status Management** - Active/inactive status

#### Route Management
- **Route Creation** - Add new routes
- **Stop Management** - Add/remove stops
- **Route Editing** - Modify existing routes
- **Fare Configuration** - Set route fares
- **Duration Estimation** - Expected travel time
- **Route Activation** - Enable/disable routes

#### Driver Management
- **Driver Profiles** - Add, edit, delete drivers
- **License Tracking** - License number, expiry
- **Performance Metrics** - Driver ratings
- **Assignment History** - Bus assignments
- **Availability** - Active, on-leave, inactive
- **Contact Information** - Phone, email

#### User Management
- **Passenger Accounts** - Add, edit, delete users
- **User Statistics** - Total users, active users
- **Account Status** - Active, inactive
- **Feedback Review** - User ratings and comments
- **Support Tickets** - Issue tracking (future)

#### Schedule Management
- **Create Schedules** - Add new schedules
- **Edit Schedules** - Modify timing
- **Bulk Operations** - Multiple schedule updates
- **Date Selection** - Calendar-based scheduling
- **Conflict Detection** - Prevent double-booking
- **Schedule Display** - Timetable view

#### Ping Notifications Center
- **View Notifications** - All pings received
- **Filter Pings** - By status, type, date
- **Acknowledge Pings** - Mark as seen
- **Complete Pings** - Resolve notifications
- **Passenger Info** - Details about sender
- **Bus Information** - Target bus details
- **Real-time Updates** - Live notification sync

#### Analytics & Reports
- **System Statistics** - Overall metrics
- **Performance Reports** - Route performance
- **Financial Reports** - Revenue data
- **Charts & Graphs** - Visual analytics
- **Export Data** - CSV/PDF reports
- **Trend Analysis** - Historical data

---

## Ping/Notification System

### 🔔 System Overview
The ping system allows passengers to send real-time alerts to drivers with built-in spam prevention and rate limiting.

### Rate Limiting Rules

#### 1. Daily Limit
- **Maximum**: 50 pings per user per day
- **Reset Time**: Midnight UTC
- **Action**: 24-hour block if exceeded

#### 2. Cooldown Period
- **Duration**: 30 seconds between pings
- **Type**: Per-user cooldown
- **Message**: Shows remaining cooldown time

#### 3. Spam Detection
- **Threshold**: 3+ pings in 1 minute
- **Action**: 1-hour temporary block
- **Detection**: Automatic

### Ping Types
```
- ride_request: Passenger requesting pickup
- eta_request: Asking for estimated arrival
- location_request: Requesting bus location
- general_message: General communication
```

### Ping Status Flow
```
pending → acknowledged → completed
              ↓
         (driver received)
         
cancelled (at any time)
```

### Database Functions

#### check_ping_rate_limit(user_uuid)
Validates if user can send ping
```sql
Returns: {
  allowed: boolean,
  reason: string (if blocked),
  message: string,
  cooldown_remaining: integer,
  blocked_until: timestamp
}
```

#### send_ping_with_limit(...)
Sends ping with automatic rate limiting
```sql
Parameters:
  - p_user_id: UUID
  - p_bus_id: UUID
  - p_ping_type: VARCHAR
  - p_message: TEXT (optional)
  - p_location_*: coordinates (optional)

Returns: {
  success: boolean,
  ping_id: UUID,
  remaining_today: integer,
  message: string
}
```

#### get_user_ping_status(user_uuid)
Retrieves user's current ping status
```sql
Returns: {
  is_blocked: boolean,
  blocked_until: timestamp,
  pings_today: integer,
  pings_remaining: integer,
  cooldown_remaining: integer,
  can_ping: boolean
}
```

---

## API Endpoints & Functions

### Supabase REST API

#### Authentication
```
POST   /auth/v1/signup              - Register new user
POST   /auth/v1/token               - Login user
POST   /auth/v1/token/refresh       - Refresh auth token
POST   /auth/v1/logout              - Logout user
```

### Database Tables (CRUD Operations)

#### Buses
```
GET    /rest/v1/buses              - List all buses
GET    /rest/v1/buses?id=eq.{uuid} - Get single bus
POST   /rest/v1/buses              - Create bus
PATCH  /rest/v1/buses?id=eq.{uuid} - Update bus
DELETE /rest/v1/buses?id=eq.{uuid} - Delete bus
```

#### Routes
```
GET    /rest/v1/routes              - List all routes
GET    /rest/v1/routes?id=eq.{uuid} - Get single route
POST   /rest/v1/routes              - Create route
PATCH  /rest/v1/routes?id=eq.{uuid} - Update route
DELETE /rest/v1/routes?id=eq.{uuid} - Delete route
```

#### Drivers
```
GET    /rest/v1/drivers              - List all drivers
GET    /rest/v1/drivers?id=eq.{uuid} - Get single driver
POST   /rest/v1/drivers              - Create driver
PATCH  /rest/v1/drivers?id=eq.{uuid} - Update driver
DELETE /rest/v1/drivers?id=eq.{uuid} - Delete driver
```

#### Schedules
```
GET    /rest/v1/schedules                  - List all schedules
GET    /rest/v1/schedules?date=eq.{date}   - Get by date
POST   /rest/v1/schedules                  - Create schedule
PATCH  /rest/v1/schedules?id=eq.{uuid}    - Update schedule
DELETE /rest/v1/schedules?id=eq.{uuid}    - Delete schedule
```

#### Users
```
GET    /rest/v1/users                  - List all users
GET    /rest/v1/users?id=eq.{uuid}     - Get single user
POST   /rest/v1/users                  - Create user
PATCH  /rest/v1/users?id=eq.{uuid}    - Update user
DELETE /rest/v1/users?id=eq.{uuid}    - Delete user
```

#### Bus Tracking
```
GET    /rest/v1/bus_tracking                    - Latest locations
GET    /rest/v1/bus_tracking?bus_id=eq.{uuid}   - Track specific bus
POST   /rest/v1/bus_tracking                    - Update location
```

#### Ping Notifications
```
GET    /rest/v1/ping_notifications                      - List pings
GET    /rest/v1/ping_notifications?bus_id=eq.{uuid}     - Bus pings
POST   /rest/v1/ping_notifications                      - Create ping
PATCH  /rest/v1/ping_notifications?id=eq.{uuid}        - Update ping
```

### RPC Functions (Supabase Functions)

#### Location & Proximity
```
RPC: get_nearby_buses(latitude, longitude, radius_km)
Returns: List of buses within radius

RPC: update_bus_location(bus_id, lat, lng, speed, heading, status)
Returns: Updated location record
```

#### Statistics
```
RPC: get_bus_statistics()
Returns: {
  total_buses: integer,
  active_buses: integer,
  buses_with_location: integer,
  total_routes: integer,
  active_routes: integer
}
```

#### Ping Functions
```
RPC: send_ping_with_limit(user_id, bus_id, ping_type, message, ...)
Returns: Ping result with rate limit info

RPC: check_ping_rate_limit(user_uuid)
Returns: Rate limit status

RPC: get_user_ping_status(user_uuid)
Returns: User's ping statistics

RPC: acknowledge_ping_notification(ping_id)
Returns: boolean

RPC: complete_ping_notification(ping_id)
Returns: boolean

RPC: admin_unblock_user(target_user_id)
Returns: boolean
```

#### Retrieval Functions
```
RPC: get_bus_ping_notifications(bus_uuid)
Returns: All pings for a bus with user details

RPC: get_user_ping_notifications(user_uuid)
Returns: All pings sent by user with bus details
```

### Real-time Subscriptions

#### Bus Location Updates
```javascript
supabase
  .channel('bus-location')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'bus_tracking'
    },
    (payload) => handleLocationUpdate(payload)
  )
  .subscribe()
```

#### Ping Notifications
```javascript
supabase
  .channel('ping-notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'ping_notifications',
      filter: `bus_id=eq.${busId}`
    },
    (payload) => handleNewPing(payload)
  )
  .subscribe()
```

#### Schedule Changes
```javascript
supabase
  .channel('schedule-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'schedules'
    },
    (payload) => handleScheduleChange(payload)
  )
  .subscribe()
```

---

## Setup & Deployment

### Prerequisites
```
- Node.js v16+
- npm or yarn
- Expo CLI: npm install -g expo-cli
- Git
- Supabase account
- Google Maps API key
```

### 1. Initial Setup

#### Clone Repository
```bash
git clone https://github.com/yourusername/MetroBus-Tracker.git
cd MetroBus-Tracker-main
```

#### Install Root Dependencies
```bash
npm install
```

### 2. Database Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in and create new project
3. Copy project URL and API keys
4. Save credentials securely

#### Run Database Scripts
In Supabase SQL Editor, run in order:
```
1. supabase-schema.sql          - Core tables & data
2. ping-bus-schema.sql          - Ping tables
3. ping-spam-prevention.sql     - Rate limiting functions
4. admin-auth-setup.sql         - Admin authentication
5. complete-user-management-setup.sql
6. complete-route-management-setup.sql
```

### 3. Mobile App Setup

#### Configure Environment
Create `.env` in root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
```

#### Install Mobile Dependencies
```bash
npm install
```

#### Run Development Server
```bash
npx expo start

# Run on Android
press 'a'

# Run on iOS
press 'i'

# Run on web
press 'w'
```

### 4. Admin Dashboard Setup

#### Install Admin Dependencies
```bash
cd admin-website
npm install
```

#### Configure Supabase
Update `src/contexts/SupabaseContext.js`:
```javascript
const supabaseUrl = 'your_supabase_url';
const supabaseKey = 'your_anon_key';
```

#### Run Admin Dashboard
```bash
npm start
```

Access at `http://localhost:3000`

### 5. Production Deployment

#### Mobile App (Expo)
```bash
eas build --platform all
eas submit --platform all
```

#### Admin Dashboard
```bash
npm run build
# Deploy to Vercel, Netlify, or AWS
```

#### Database
- Keep on Supabase (managed hosting)
- Or self-host with Docker

---

## Security & Authentication

### Authentication System

#### User Roles
```
1. PASSENGER - Mobile app users
2. DRIVER - Driver app access
3. ADMIN - Dashboard access
4. SUPERADMIN - Full system access
```

### Row Level Security (RLS) Policies

#### Buses Table
```sql
- Public SELECT on active buses
- Drivers can SELECT their assigned buses
- Admins can SELECT/INSERT/UPDATE/DELETE
```

#### Routes Table
```sql
- Public SELECT on all routes
- Admins can manage routes
```

#### Drivers Table
```sql
- Drivers can SELECT their own data
- Admins can manage drivers
```

#### Schedules Table
```sql
- Drivers can SELECT their schedules
- Admins can manage schedules
```

#### Users Table
```sql
- Users can SELECT their own data
- Admins can manage users
```

#### Bus Tracking Table
```sql
- Public SELECT for real-time tracking
- Drivers can INSERT/UPDATE their location
```

#### Ping Notifications Table
```sql
- Users can INSERT and view their pings
- Drivers can view pings for their buses
- Admins can view all pings
```

### Password Security
```
- SHA256 hashing for stored passwords
- Salt-based encryption
- No plaintext storage
- Session tokens with expiration
```

### API Key Management
```
- Anon key: Read-only public data
- Service role: Full database access (server-only)
- RLS: Per-row security policies
```

---

## Real-time Features

### Location Updates

#### Mobile App → Server
```
1. Every 30 seconds (configurable)
2. GPS coordinates with accuracy
3. Speed and heading
4. Timestamp
5. Battery optimization
```

#### Server → All Clients
```
1. WebSocket connection
2. Broadcast to subscribers
3. Database triggers
4. Automatic timestamp update
```

### Ping Notifications

#### Real-time Delivery
```
1. Passenger sends ping
2. Rate limit check
3. Database INSERT
4. WebSocket broadcast
5. Driver receives alert
6. Vibration + notification
```

### Schedule Updates

#### Real-time Sync
```
1. Admin updates schedule
2. Database change
3. WebSocket event
4. Driver and passenger notifications
5. UI auto-refresh
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. "Ping not working" / Rate limit errors
**Symptoms**: 
- Ping function returns error
- Missing columns in users table

**Solution**:
```sql
-- Run this in Supabase SQL Editor
ALTER TABLE users ADD COLUMN IF NOT EXISTS ping_count_today INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ping_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_ping_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ping_block_until TIMESTAMP WITH TIME ZONE;

-- Then run ping-spam-prevention.sql
```

#### 2. "Real-time not updating"
**Symptoms**:
- Bus locations not updating
- Pings not appearing in real-time

**Solution**:
- Check Supabase Realtime is enabled
- Verify subscription channel name
- Check browser console for errors
- Restart development server

#### 3. "Location permission denied"
**Symptoms**:
- Map shows user location as null
- Tracking not working

**Solution**:
```javascript
// Request permission explicitly
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  // Handle permission denied
}
```

#### 4. "Google Maps API errors"
**Symptoms**:
- Map not displaying
- "InvalidKeyMapError"

**Solution**:
- Verify API key in environment variables
- Check Google Cloud Console for API activation
- Ensure billing is enabled
- Check API key restrictions

#### 5. "Database connection errors"
**Symptoms**:
- "Connection refused"
- "Network error"

**Solution**:
- Verify Supabase URL and key
- Check internet connection
- Verify Supabase project is active
- Check firewall settings

#### 6. "Admin login not working"
**Symptoms**:
- Invalid credentials
- Cannot access dashboard

**Solution**:
- Verify admin user exists in auth
- Check admin credentials in database
- Run admin-auth-setup.sql
- Clear browser cache/cookies

### Debug Mode

#### Enable Console Logging
```javascript
// In lib/supabase.js
export const supabaseHelpers = {
  enableDebug() {
    window.localStorage.setItem('debug_supabase', 'true');
  }
};
```

#### Check Database Logs
```
Supabase Dashboard → Logs → Recent
```

#### Monitor Real-time Activity
```
Supabase Dashboard → Realtime → Inspect
```

---

## Performance Optimization

### Mobile App
- **Code Splitting**: Lazy load screens
- **Caching**: Cache bus/route data locally
- **Image Optimization**: Compress assets
- **Location Tracking**: Adaptive intervals based on speed
- **Real-time**: Debounce subscription updates

### Admin Dashboard
- **Pagination**: Limit rows displayed
- **Virtual Scrolling**: Render only visible items
- **Memoization**: React.memo for components
- **Lazy Loading**: Async imports
- **Caching**: Query result caching

### Database
- **Indexes**: On frequently queried columns
- **Partitioning**: For large tables (future)
- **Connection Pooling**: Optimize connections
- **Query Optimization**: Use views for complex queries

---

## Best Practices

### Code Organization
✅ Keep components small and focused  
✅ Use context for state management  
✅ Separate business logic from UI  
✅ Use utility functions for common tasks  
✅ Document complex functions  

### Security
✅ Never store API keys in client code  
✅ Use environment variables  
✅ Validate user input on both ends  
✅ Use RLS policies for data protection  
✅ Implement proper error handling  

### Performance
✅ Optimize database queries  
✅ Use pagination for large datasets  
✅ Implement caching strategies  
✅ Monitor app performance  
✅ Profile and optimize bottlenecks  

### Testing
✅ Test on multiple devices  
✅ Test with poor network conditions  
✅ Test on different map areas  
✅ Verify rate limiting functionality  
✅ Test edge cases  

---

## Support & Resources

### Documentation Files
- **README.md** - Project overview
- **DATABASE_SCHEMA.md** - Database details
- **SUPABASE_SETUP.md** - Setup guide
- **GOOGLE_MAPS_SETUP.md** - Maps configuration
- **ANDROID_SETUP.md** - Android build
- **REALTIME_TRACKING_GUIDE.md** - Real-time features

### External Resources
- [Supabase Docs](https://supabase.com/docs)
- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [Google Maps API](https://developers.google.com/maps)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

### Getting Help
1. Check documentation files
2. Search GitHub issues
3. Review error logs
4. Test with minimal example
5. Reach out to development team

---

## Project Statistics

| Metric | Value |
|--------|-------|
| Total Files | 200+ |
| SQL Files | 8 database scripts |
| Database Tables | 10+ core tables |
| Database Functions | 50+ functions |
| Mobile Screens | 16+ screens |
| Admin Pages | 10+ pages |
| Components | 20+ reusable components |
| Real-time Subscriptions | 5+ channels |
| RLS Policies | 20+ policies |
| API Endpoints | 100+ REST endpoints |

---

## Version History

**Version 3.0** - Current (Phase 3)
- ✅ Complete ping system with rate limiting
- ✅ Real-time bus tracking
- ✅ Admin dashboard with full CRUD
- ✅ Driver app integration
- ✅ Feedback system
- ✅ Analytics & reporting

**Planned Features**
- [ ] Push notifications
- [ ] Offline mode
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Payment integration
- [ ] Advanced analytics

---

## License

MIT License - See LICENSE file for details

---

## Contact & Support

For questions or support:
- 📧 Email: support@metrobus.com
- 🐛 GitHub Issues: [Report bugs](https://github.com)
- 📱 Mobile Support: In-app help section
- 🖥️ Admin Support: Dashboard help menu

---

**MetroBus Tracker** - Comprehensive Real-time Bus Tracking Solution  
*Making public transportation smarter, faster, and more accessible* 🚌✨

Last Updated: October 2025  
Version: 3.0
