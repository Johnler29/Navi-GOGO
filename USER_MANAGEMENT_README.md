# User Management System - MetroBus Tracker

## 🚀 Overview

The User Management system provides comprehensive functionality for managing passengers, drivers, and support tickets in the MetroBus Tracker admin panel. This system includes driver account creation, user management, feedback handling, and support ticket management.

## ✨ Features

### 👥 User Management
- **View all passengers** with search and filtering capabilities
- **Create new user accounts** with contact information
- **Edit user details** and manage account status
- **Delete user accounts** with confirmation
- **Real-time statistics** showing total users, active users, and more

### 🚌 Driver Management
- **Create driver accounts** with authentication credentials
- **View all drivers** with detailed information including license numbers
- **Activate/Deactivate drivers** with status management
- **Delete driver accounts** with proper cleanup
- **Driver assignment tracking** for bus assignments

### 💬 Feedback Management
- **View passenger feedback** with ratings and categories
- **Filter feedback** by status (pending, resolved)
- **Star rating display** for easy visualization
- **Feedback categorization** (compliment, complaint, suggestion)

### 🎫 Support Tickets (Future Enhancement)
- **Ticket management system** for passenger support
- **Priority levels** (low, medium, high, urgent)
- **Status tracking** (open, in_progress, resolved, closed)
- **Category classification** (technical, billing, general, complaint, suggestion)

## 🗄️ Database Schema

### New Tables Added

#### `admin_users`
- Stores admin user accounts for authentication
- Fields: id, email, password_hash, first_name, last_name, role, department, phone, is_active, created_at, updated_at, last_login

#### `user_roles`
- Manages passenger role assignments
- Fields: id, user_id, role, granted_by, granted_at, expires_at, is_active

#### `support_tickets`
- Handles passenger support requests
- Fields: id, user_id, subject, description, category, priority, status, assigned_to, created_at, updated_at, resolved_at

#### `ticket_responses`
- Stores responses to support tickets
- Fields: id, ticket_id, responder_id, response, is_internal, created_at

#### `user_preferences`
- Stores user notification and preference settings
- Fields: id, user_id, notifications, language, theme, accessibility, created_at, updated_at

#### `driver_assignments`
- Tracks driver-bus-route assignments
- Fields: id, driver_id, bus_id, route_id, assigned_by, assigned_at, unassigned_at, is_active, notes

### Enhanced Tables

#### `drivers` (Enhanced)
- Added authentication fields: password_hash, first_name, last_name, email, is_active, created_by, last_login
- Maintains existing fields: id, name, license_number, phone, status, created_at, updated_at

## 🔧 Setup Instructions

### 1. Database Setup
Run the following SQL scripts in your Supabase SQL Editor:

```sql
-- First, run the main setup script
-- File: sql/setup-user-management.sql

-- Then, add sample data for testing
-- File: sql/add-sample-user-data.sql
```

### 2. Admin Panel Access
1. Navigate to the User Management section in the admin panel
2. Use the "Add Driver" button to create driver accounts
3. Use the "Add User" button to create passenger accounts
4. Switch between tabs to manage different user types

## 🎯 Usage Guide

### Creating Driver Accounts

1. **Click "Add Driver"** in the User Management header
2. **Fill in the form**:
   - First Name (required)
   - Last Name (required)
   - Email (required, must be unique)
   - License Number (required)
   - Phone (optional)
   - Password (required)
   - Confirm Password (required)
3. **Click "Create Driver"** to save the account

### Managing Users

1. **Search users** using the search bar
2. **Filter by status** using the dropdown
3. **View user details** in the table
4. **Edit users** using the edit button (future feature)
5. **Delete users** using the delete button with confirmation

### Managing Drivers

1. **Switch to "Drivers" tab**
2. **View all drivers** with their status and details
3. **Activate/Deactivate** drivers using the play/pause button
4. **Delete drivers** using the delete button with confirmation
5. **Search drivers** by name, email, or license number

### Viewing Feedback

1. **Switch to "Feedback" tab**
2. **View passenger feedback** with ratings
3. **See feedback status** (pending, resolved)
4. **Filter by category** and status

## 🔐 Security Features

### Password Hashing
- All passwords are hashed using SHA-256 (production should use bcrypt)
- Passwords are never stored in plain text

### Row Level Security (RLS)
- All tables have RLS enabled
- Proper policies for data access control
- Admin users can view all data
- Users can only view their own data

### Authentication
- Driver accounts require email and password
- Admin accounts have role-based access
- Session management for admin users

## 📊 Statistics Dashboard

The system provides real-time statistics:

- **Total Users**: Count of all registered passengers
- **Active Users**: Users active in the last 30 days
- **Pending Feedback**: Unresolved feedback items
- **Support Tickets**: Open and in-progress tickets

## 🚀 Future Enhancements

### Planned Features
1. **User Profile Management**: Edit user details and preferences
2. **Bulk Operations**: Select multiple users for batch operations
3. **Export Functionality**: Export user data to CSV/Excel
4. **Advanced Filtering**: Filter by date ranges, categories, etc.
5. **Email Notifications**: Send notifications to users
6. **User Analytics**: Detailed user behavior analytics
7. **Role Management**: Assign different roles to users
8. **Audit Logging**: Track all user management actions

### Support Ticket System
1. **Ticket Creation**: Allow users to create support tickets
2. **Assignment System**: Assign tickets to admin users
3. **Response Management**: Handle ticket responses
4. **Escalation**: Automatic escalation for high-priority tickets
5. **Knowledge Base**: Common questions and answers

## 🐛 Troubleshooting

### Common Issues

1. **Driver Creation Fails**
   - Check if email already exists
   - Verify all required fields are filled
   - Check database connection

2. **Statistics Not Loading**
   - Verify database functions are created
   - Check RLS policies
   - Refresh the page

3. **Search Not Working**
   - Check if search term is valid
   - Verify data exists in database
   - Clear search and try again

### Debug Steps

1. **Check Browser Console** for JavaScript errors
2. **Check Supabase Logs** for database errors
3. **Verify Database Schema** matches expected structure
4. **Test Database Functions** directly in SQL Editor

## 📝 API Reference

### Context Methods

```javascript
// Create driver account
const { createDriverAccount } = useSupabase();
await createDriverAccount({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: 'password123',
  licenseNumber: 'DL123456',
  phone: '+1-555-0123'
});

// Get user statistics
const { getUserStatistics } = useSupabase();
const stats = await getUserStatistics();

// Update driver status
const { updateDriverStatus } = useSupabase();
await updateDriverStatus(driverId, 'active');

// Delete driver
const { deleteDriverAccount } = useSupabase();
await deleteDriverAccount(driverId);
```

## 🤝 Contributing

When adding new features to the User Management system:

1. **Update the database schema** if needed
2. **Add proper RLS policies** for new tables
3. **Update the context methods** in SupabaseContext.js
4. **Add UI components** in UserManagement.js
5. **Update this documentation**

## 📄 License

This User Management system is part of the MetroBus Tracker project and follows the same licensing terms.
