# Supabase Integration Setup Guide

This guide will help you set up Supabase as the backend for your MetroBus Tracker app.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. Expo CLI installed

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `metrobus-tracker`
   - Database Password: (create a strong password)
   - Region: Choose closest to your location
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

## Step 3: Update Supabase Configuration

1. Open `lib/supabase.js` in your project
2. Replace the placeholder values with your actual credentials:

```javascript
const supabaseUrl = 'YOUR_ACTUAL_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_ACTUAL_SUPABASE_ANON_KEY';
```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire content from `supabase-schema.sql`
3. Paste it into the SQL editor
4. Click "Run" to execute the schema

This will create:
- All necessary tables (buses, routes, stops, schedules, drivers, users, bus_tracking, feedback)
- Indexes for better performance
- Row Level Security policies
- Sample data

## Step 5: Install Dependencies

Run the following command in your project directory:

```bash
npm install
```

This will install the Supabase JavaScript client.

## Step 6: Test the Integration

1. Start your Expo development server:
   ```bash
   npx expo start
   ```

2. Open the app on your device/emulator
3. The app should now load bus data from Supabase
4. Try submitting feedback - it should be saved to the database

## Step 7: Real-time Features

The app includes real-time subscriptions for:
- Bus location updates
- Schedule changes

These will automatically update the UI when data changes in Supabase.

## Database Tables Overview

### Buses
- Stores bus information (number, name, capacity, status)
- Links to routes and drivers

### Routes
- Contains route information (number, name, start/end locations, fare)
- Defines the path buses follow

### Stops
- Individual bus stops along routes
- Includes GPS coordinates and sequence order

### Schedules
- Bus departure and arrival times
- Links routes and buses

### Drivers
- Driver information (name, license, contact details)
- Status tracking

### Users
- Passenger information
- User preferences

### Bus Tracking
- Real-time location data
- Speed, heading, and status information

### Feedback
- User feedback and ratings
- Categorized feedback for analysis

## Security Features

- Row Level Security (RLS) enabled on all tables
- Public read access for bus data
- Authenticated users can submit feedback
- Secure API key management

## Environment Variables (Optional)

For better security, you can use environment variables:

1. Create a `.env` file in your project root:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Update `lib/supabase.js`:
   ```javascript
   const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
   const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
   ```

## Troubleshooting

### Common Issues

1. **"Network Error"**: Check your Supabase URL and API key
2. **"Permission Denied"**: Verify RLS policies are set up correctly
3. **"Table doesn't exist"**: Run the schema SQL in Supabase SQL Editor

### Debugging

1. Check the browser console for error messages
2. Use Supabase Dashboard → Logs to see API requests
3. Verify data exists in Supabase Dashboard → Table Editor

## Next Steps

1. **Add Authentication**: Implement user login/signup
2. **Real-time Updates**: Add more real-time subscriptions
3. **Push Notifications**: Integrate with Expo notifications
4. **Analytics**: Add usage tracking and analytics
5. **Admin Panel**: Create a web dashboard for bus management

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev/docs)

## Sample Data

The schema includes sample data for testing:
- 3 routes (Dasmarinas to Manila, Makati, Quezon City)
- 3 buses with drivers
- Sample stops and tracking data

You can modify or add more data through the Supabase Dashboard → Table Editor. 