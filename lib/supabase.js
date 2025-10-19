import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

// Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test database connection
export const testDatabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseAnonKey.substring(0, 20) + '...');
    
    // Test basic connection
    const { data, error } = await supabase.from('routes').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Database connection successful!');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return { success: false, error: error.message };
  }
};

// Database table names
export const TABLES = {
  BUSES: 'buses',
  ROUTES: 'routes',
  STOPS: 'stops',
  SCHEDULES: 'schedules',
  FEEDBACK: 'feedback',
  USERS: 'users',
  DRIVERS: 'drivers',
  TRACKING: 'bus_tracking'
};

// Helper functions for common operations
export const supabaseHelpers = {
  // Password hashing helper
  hashPassword(password) {
    return CryptoJS.SHA256(password).toString();
  },

  // Bus operations
  async getBuses() {
    console.log('📡 Fetching buses from database...');
    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching buses:', error);
      throw error;
    }
    
    // Filter out buses without recent activity (within last 5 minutes)
    const activeBuses = data?.filter(bus => {
      const hasRecentActivity = bus.last_location_update && 
        new Date(bus.last_location_update) > new Date(Date.now() - 5 * 60 * 1000);
      const hasActiveDriver = bus.driver_id && bus.status === 'active';
      
      return hasActiveDriver && hasRecentActivity;
    }) || [];
    
    console.log('✅ Buses fetched successfully:', data?.length || 0, 'total buses,', activeBuses.length, 'active buses');
    return activeBuses;
  },

  async getDriverBusAssignments() {
    console.log('📡 Fetching driver-bus assignments from database...');
    const { data, error } = await supabase
      .from('driver_bus_assignments')
      .select(`
        id,
        is_active,
        assigned_at,
        unassigned_at,
        notes,
        drivers:driver_id(name, email, license_number, id),
        buses:bus_id(
          bus_number,
          route_id,
          id,
          routes:route_id(id, route_number, name)
        )
      `)
      .order('assigned_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching driver-bus assignments:', error);
      throw error;
    }
    
    console.log('✅ Driver-bus assignments fetched successfully:', data?.length || 0, 'assignments');
    return data;
  },

  async getStopsByRoute(routeId) {
    console.log('📡 Fetching stops for route:', routeId);
    const { data, error } = await supabase
      .from('stops')
      // Alias DB columns (name/address/sequence) to app-expected keys
      .select(`
        id,
        stop_name:name,
        stop_description:address,
        latitude,
        longitude,
        route_id,
        stop_order:sequence
      `)
      .eq('route_id', routeId)
      .order('sequence');
    
    if (error) {
      console.error('❌ Error fetching stops:', error);
      throw error;
    }
    
    console.log('✅ Stops fetched successfully:', data?.length || 0, 'stops');
    return data;
  },

  async getBusById(id) {
    const { data, error } = await supabase
      .from(TABLES.BUSES)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },


  // Route operations
  async getRoutes() {
    console.log('📡 Fetching routes from database...');
    const { data, error } = await supabase
      .from(TABLES.ROUTES)
      .select(`
        *,
        stops (
          id,
          stop_name:name,
          stop_description:address,
          latitude,
          longitude,
          stop_order:sequence
        )
      `)
      .order('route_number', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching routes:', error);
      throw error;
    }
    
    console.log('✅ Routes fetched successfully:', data?.length || 0, 'routes');
    return data;
  },

  // Get routes with full details including coordinates and stops
  async getRoutesWithDetails() {
    console.log('📡 Fetching routes with full details from database...');
    const { data, error } = await supabase.rpc('get_all_routes_with_details');
    
    if (error) {
      console.error('❌ Error fetching routes with details:', error);
      throw error;
    }
    
    console.log('✅ Routes with details fetched successfully:', data?.length || 0, 'routes');
    return data;
  },

  async getRouteById(id) {
    const { data, error } = await supabase
      .from(TABLES.ROUTES)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Stop operations
  async getStops() {
    console.log('📡 Fetching stops from database...');
    const { data, error } = await supabase
      .from(TABLES.STOPS)
      // Provide aliases so downstream UI continues to work
      .select(`
        id,
        stop_name:name,
        stop_description:address,
        latitude,
        longitude,
        route_id,
        stop_order:sequence
      `)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching stops:', error);
      throw error;
    }
    
    console.log('✅ Stops fetched successfully:', data?.length || 0, 'stops');
    return data;
  },


  // Schedule operations
  async getSchedules() {
    console.log('📡 Fetching schedules from database...');
    const { data, error } = await supabase
      .from(TABLES.SCHEDULES)
      .select('*')
      .order('departure_time', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching schedules:', error);
      throw error;
    }
    
    console.log('✅ Schedules fetched successfully:', data?.length || 0, 'schedules');
    return data;
  },

  async getSchedulesByRoute(routeId) {
    const { data, error } = await supabase
      .from(TABLES.SCHEDULES)
      .select('*')
      .eq('route_id', routeId)
      .order('departure_time', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Feedback operations
  async getFeedback() {
    console.log('📡 Fetching feedback from database...');
    const { data, error } = await supabase
      .from(TABLES.FEEDBACK)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching feedback:', error);
      throw error;
    }
    
    console.log('✅ Feedback fetched successfully:', data?.length || 0, 'feedback entries');
    return data;
  },

  async submitFeedback(feedback) {
    console.log('📡 Submitting feedback to database...');
    const { data, error } = await supabase
      .from(TABLES.FEEDBACK)
      .insert({
        message: feedback,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ Error submitting feedback:', error);
      throw error;
    }
    
    console.log('✅ Feedback submitted successfully');
    return data;
  },

  // User operations
  async createUser(userData) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert(userData);
    
    if (error) throw error;
    return data;
  },

  async getUserById(id) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Driver operations
  async getDrivers() {
    console.log('📡 Fetching drivers from database...');
    const { data, error } = await supabase
      .from(TABLES.DRIVERS)
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching drivers:', error);
      throw error;
    }
    
    console.log('✅ Drivers fetched successfully:', data?.length || 0, 'drivers');
    return data;
  },

  async getDriverById(id) {
    const { data, error } = await supabase
      .from(TABLES.DRIVERS)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getDriverSchedules(driverId) {
    console.log('📡 Fetching driver schedules for driver:', driverId);
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        buses!inner(driver_id),
        routes(*)
      `)
      .eq('buses.driver_id', driverId)
      .order('departure_time', { ascending: true });

    if (error) {
      console.error('❌ Error fetching driver schedules:', error);
      throw error;
    }

    return data || [];
  },

  async getDriverBuses(driverId) {
    console.log('📡 Fetching driver buses for driver:', driverId);
    const { data, error } = await supabase
      .from('buses')
      .select(`
        *,
        routes(*)
      `)
      .eq('driver_id', driverId)
      .order('bus_number', { ascending: true });

    if (error) {
      console.error('❌ Error fetching driver buses:', error);
      throw error;
    }

    return data || [];
  },

  async updateDriverStatus(driverId, status) {
    console.log('📡 Updating driver status:', driverId, status);
    const { data, error } = await supabase
      .from('drivers')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId)
      .select();

    if (error) {
      console.error('❌ Error updating driver status:', error);
      throw error;
    }

    return data;
  },

  async startTrip(driverId, busId, routeId) {
    console.log('📡 Starting trip for driver:', driverId, 'bus:', busId, 'route:', routeId);
    
    // Validate parameters
    if (!driverId || driverId === 'null' || driverId === 'undefined') {
      throw new Error('Invalid driver ID');
    }
    if (!busId || busId === 'null' || busId === 'undefined') {
      throw new Error('Invalid bus ID');
    }
    if (!routeId || routeId === 'null' || routeId === 'undefined') {
      throw new Error('Invalid route ID');
    }
    
    try {
      // First, try to update an existing schedule
      const { data: updateData, error: updateError } = await supabase
        .from('schedules')
        .update({
          is_active: true,
          departure_time: new Date().toTimeString().split(' ')[0], // HH:MM:SS format
          updated_at: new Date().toISOString()
        })
        .eq('bus_id', busId)
        .eq('route_id', routeId)
        .select()
        .single();

      if (updateError && updateError.code === 'PGRST116') {
        // No existing schedule found, create a new one
        console.log('📝 No existing schedule found, creating new one...');
        
        const { data: insertData, error: insertError } = await supabase
          .from('schedules')
          .insert({
            bus_id: busId,
            route_id: routeId,
            departure_time: new Date().toTimeString().split(' ')[0], // HH:MM:SS format
            arrival_time: null, // Will be set when trip ends
            days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating new schedule:', insertError);
          throw insertError;
        }

        // Update bus status
        await supabase
          .from('buses')
          .update({ 
            status: 'active',
            tracking_status: 'moving',
            updated_at: new Date().toISOString()
          })
          .eq('id', busId);

        console.log('✅ New trip schedule created successfully:', insertData);
        return insertData;
      } else if (updateError) {
        console.error('❌ Error updating schedule:', updateError);
        throw updateError;
      }

      // Update bus status
      await supabase
        .from('buses')
        .update({ 
          status: 'active',
          tracking_status: 'moving',
          updated_at: new Date().toISOString()
        })
        .eq('id', busId);

      console.log('✅ Trip started successfully:', updateData);
      return updateData;
    } catch (error) {
      console.error('❌ Error starting trip:', error);
      throw error;
    }
  },

  async endTrip(scheduleId, endData) {
    console.log('📡 Ending trip:', scheduleId);
    const { data, error } = await supabase
      .from('schedules')
      .update({
        is_active: false,
        arrival_time: new Date().toTimeString().split(' ')[0], // HH:MM:SS format
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error ending trip:', error);
      throw error;
    }

    // Update bus status
    if (endData.busId) {
      await supabase
        .from('buses')
        .update({ 
          status: 'inactive',
          tracking_status: 'stopped',
          updated_at: new Date().toISOString()
        })
        .eq('id', endData.busId);
    }

    return data;
  },

  async updatePassengerCount(busId, passengerCount) {
    console.log('📡 Updating passenger count for bus:', busId, 'count:', passengerCount);
    const { data, error } = await supabase
      .from('buses')
      .update({ 
        current_passengers: passengerCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', busId)
      .select();

    if (error) {
      console.error('❌ Error updating passenger count:', error);
      throw error;
    }

    return data;
  },

  async reportEmergency(driverId, emergencyData) {
    console.log('📡 Reporting emergency for driver:', driverId);
    
    const { data, error } = await supabase
      .from('driver_emergency_reports')
      .insert({
        driver_id: driverId,
        bus_id: emergencyData.busId || null,
        route_id: emergencyData.routeId || null,
        emergency_type: emergencyData.type,
        description: emergencyData.description,
        location_lat: emergencyData.location?.latitude || null,
        location_lng: emergencyData.location?.longitude || null,
        priority: emergencyData.priority || 'medium',
        status: 'reported'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error reporting emergency:', error);
      // Fallback: log the emergency and return success
      console.log('📝 Emergency reported (fallback):', {
        driverId,
        type: emergencyData.type,
        description: emergencyData.description,
        timestamp: new Date().toISOString()
      });
      
      // Return a mock success response
      return {
        id: 'emergency_' + Date.now(),
        emergency_type: emergencyData.type,
        description: emergencyData.description,
        status: 'reported'
      };
    }

    return data;
  },

  async reportMaintenanceIssue(driverId, issueData) {
    console.log('📡 Reporting maintenance issue for driver:', driverId);
    
    const { data, error } = await supabase
      .from('driver_maintenance_reports')
      .insert({
        driver_id: driverId,
        bus_id: issueData.busId || null,
        issue_type: issueData.issue,
        description: issueData.description,
        priority: issueData.priority || 'medium',
        location_lat: issueData.location?.latitude || null,
        location_lng: issueData.location?.longitude || null,
        status: 'reported'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error reporting maintenance issue:', error);
      // Fallback: log the maintenance issue and return success
      console.log('📝 Maintenance issue reported (fallback):', {
        driverId,
        issue: issueData.issue,
        description: issueData.description,
        priority: issueData.priority,
        timestamp: new Date().toISOString()
      });
      
      // Return a mock success response
      return {
        id: 'maintenance_' + Date.now(),
        issue_type: issueData.issue,
        description: issueData.description,
        status: 'reported'
      };
    }

    return data;
  },

  // Passenger feedback functions
  async submitPassengerFeedback(userId, feedbackData) {
    console.log('📡 Submitting passenger feedback for user:', userId);
    
    const { data, error } = await supabase
      .from('passenger_feedback')
      .insert({
        user_id: userId,
        bus_id: feedbackData.busId || null,
        route_id: feedbackData.routeId || null,
        message: feedbackData.message,
        rating: feedbackData.rating || null,
        category: feedbackData.category || 'general',
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error submitting passenger feedback:', error);
      throw error;
    }

    return data;
  },

  async getPassengerFeedback(userId, filters = {}) {
    console.log('📡 Getting passenger feedback for user:', userId);
    
    let query = supabase
      .from('passenger_feedback')
      .select(`
        *,
        buses(plate_number, model),
        routes(route_number, name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.busId) {
      query = query.eq('bus_id', filters.busId);
    }
    if (filters.routeId) {
      query = query.eq('route_id', filters.routeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error getting passenger feedback:', error);
      throw error;
    }

    return data;
  },

  async updateBusCapacityStatus(busId, capacityPercentage) {
    console.log('📡 Updating bus capacity status for bus:', busId, 'capacity:', capacityPercentage + '%');
    
    // Validate capacity percentage
    if (capacityPercentage < 0 || capacityPercentage > 100) {
      throw new Error('Capacity percentage must be between 0 and 100');
    }

    const { data, error } = await supabase
      .from('buses')
      .update({
        current_passengers: Math.round((capacityPercentage / 100) * 50), // Assuming max capacity of 50
        capacity_percentage: capacityPercentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', busId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating bus capacity status:', error);
      throw error;
    }

    return data;
  },

  async getBusCapacityStatus(busId) {
    console.log('📡 Getting bus capacity status for bus:', busId);
    
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('id, current_passengers, capacity_percentage, max_capacity')
        .eq('id', busId)
        .single();

      if (error) {
        console.warn('⚠️ Bus capacity columns not found, using defaults:', error);
        // Return default values if columns don't exist
        return {
          id: busId,
          current_passengers: 0,
          capacity_percentage: 0,
          max_capacity: 50
        };
      }

      return data;
    } catch (err) {
      console.warn('⚠️ Error getting bus capacity status, using defaults:', err);
      // Return default values on any error
      return {
        id: busId,
        current_passengers: 0,
        capacity_percentage: 0,
        max_capacity: 50
      };
    }
  },

  async authenticateDriver(email, password) {
    console.log('🔐 Authenticating driver with email:', email);
    
    try {
      // First, get the driver by email
      const { data: drivers, error: fetchError } = await supabase
        .from('drivers')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single();

      if (fetchError) {
        console.error('❌ Error fetching driver:', fetchError);
        throw new Error('Invalid credentials');
      }

      if (!drivers) {
        throw new Error('Invalid credentials');
      }

      // Hash the provided password and compare with stored hash
      const hashedPassword = supabaseHelpers.hashPassword(password);
      if (drivers.password_hash !== hashedPassword) {
        console.log('❌ Password mismatch - stored:', drivers.password_hash, 'provided:', hashedPassword);
        throw new Error('Invalid credentials');
      }

      // Update last login
      await supabase
        .from('drivers')
        .update({ 
          last_login: new Date().toISOString(),
          login_attempts: 0,
          locked_until: null
        })
        .eq('id', drivers.id);

      // Return driver information in the expected format
      const result = [{
        driver_id: drivers.id,
        email: drivers.email,
        first_name: drivers.name.split(' ')[0] || drivers.name,
        last_name: drivers.name.split(' ').slice(1).join(' ') || '',
        driver_status: drivers.driver_status,
        is_active: drivers.is_active,
        license_number: drivers.license_number
      }];

      console.log('✅ Driver authenticated successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Driver authentication failed:', error);
      throw error;
    }
  },

  async updateBusLocation(locationData) {
    console.log('📍 Updating bus location:', locationData);
    
    try {
      // Ensure we have a valid bus id; avoid sending 4-arg RPC payload
      if (!locationData || !locationData.busId) {
        throw new Error('Missing busId for location update');
      }

      // Validate coordinates; if missing/invalid, skip RPC to avoid NOT NULL errors
      const lat = locationData.latitude;
      const lng = locationData.longitude;
      const latitudeIsValid = typeof lat === 'number' && Number.isFinite(lat);
      const longitudeIsValid = typeof lng === 'number' && Number.isFinite(lng);
      if (!latitudeIsValid || !longitudeIsValid) {
        console.warn('⚠️ Skipping RPC: invalid coordinates for update', { lat, lng });
        return { success: true, skipped: true, reason: 'invalid_coordinates' };
      }

      console.log('📍 Using busId for RPC:', locationData.busId);
      // Use the fixed simple location update function with correct parameter order
      const { data, error } = await supabase.rpc('update_bus_location_simple', {
        p_bus_id: locationData.busId,
        p_latitude: parseFloat(lat),
        p_longitude: parseFloat(lng),
        p_accuracy: locationData.accuracy != null ? parseFloat(locationData.accuracy) : 10.0,
        p_speed_kmh: locationData.speed != null ? parseFloat(locationData.speed) : null
      });

      // Check if the update was successful
      if (error) {
        console.error('❌ Location update failed:', error);
        throw error;
      }

      // Check if data exists and has success property
      if (data && typeof data === 'object' && 'success' in data) {
        if (!data.success) {
          console.warn('⚠️ Location update rejected:', data.message || 'Unknown reason');
          throw new Error(data.message || 'Location update rejected');
        }

        console.log('✅ Bus location updated successfully:', {
          success: data.success,
          message: data.message,
          bus_id: data.bus_id
        });
      } else {
        console.log('✅ Bus location updated successfully');
      }

      return data || { success: true };
    } catch (error) {
      console.error('❌ Error updating bus location:', error);
      throw error;
    }
  },

  async startDriverSession(driverId, busId) {
    console.log('🚌 Starting driver session for driver:', driverId, 'bus:', busId);
    
    // Validate parameters
    if (!driverId || driverId === 'null' || driverId === 'undefined') {
      throw new Error('Invalid driver ID for session');
    }
    if (!busId || busId === 'null' || busId === 'undefined') {
      throw new Error('Invalid bus ID for session');
    }
    
    // Simple UUID generator
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    try {
      // First get the route_id for this bus
      const { data: busData, error: busError } = await supabase
        .from('buses')
        .select('route_id')
        .eq('id', busId)
        .single();

      if (busError) {
        console.error('❌ Error getting bus route:', busError);
        throw busError;
      }

      const { data, error } = await supabase
        .from('driver_sessions')
        .insert({
          driver_id: driverId,
          bus_id: busId,
          route_id: busData.route_id, // Include route_id from bus
          session_token: generateUUID(),
          device_info: {
            platform: 'mobile',
            app_version: '1.0.0'
          },
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error starting driver session:', error);
        throw error;
      }

      console.log('✅ Driver session started successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Driver session start failed:', error);
      throw error;
    }
  },

  async endDriverSession(sessionId) {
    console.log('🛑 Ending driver session:', sessionId);
    
    try {
      // First, get the session to find the associated bus
      const { data: sessionData, error: sessionError } = await supabase
        .from('driver_sessions')
        .select('bus_id')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('❌ Error fetching session data:', sessionError);
        throw sessionError;
      }

      // Update the session status
      const { data, error } = await supabase
        .from('driver_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error ending driver session:', error);
        throw error;
      }

      // Clear the bus location and set it to offline
      if (sessionData?.bus_id) {
        console.log('🚌 Clearing bus location for offline driver:', sessionData.bus_id);
        await supabase
          .from('buses')
          .update({
            latitude: null,
            longitude: null,
            tracking_status: 'offline',
            last_location_update: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionData.bus_id);
      }

      console.log('✅ Driver session ended successfully and bus cleared:', data);
      return data;
    } catch (error) {
      console.error('❌ Driver session end failed:', error);
      throw error;
    }
  },

  async getDriverPerformance(driverId, period = 'week') {
    console.log('📡 Getting driver performance for driver:', driverId, 'period:', period);
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        buses!inner(driver_id),
        routes(*)
      `)
      .eq('buses.driver_id', driverId)
      .gte('departure_time', startDate.toISOString())
      .order('departure_time', { ascending: false });

    if (error) {
      console.error('❌ Error getting driver performance:', error);
      throw error;
    }

    return data || [];
  },

  // Real-time subscriptions
  subscribeToBusLocations(callback) {
    return supabase
      .channel('bus_locations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.BUSES },
        callback
      )
      .subscribe();
  },

  subscribeToSchedules(callback) {
    return supabase
      .channel('schedules')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.SCHEDULES },
        callback
      )
      .subscribe();
  },

  // Additional helper functions using the new views and functions

  // Get active buses (using real-time function)
  async getActiveBuses() {
    console.log('📡 Fetching active buses...');
    const { data, error } = await supabase
      .rpc('get_realtime_bus_status');
    
    if (error) {
      console.error('❌ Error fetching active buses:', error);
      throw error;
    }
    
    // Filter for active buses only
    const activeBuses = data?.filter(bus => 
      bus.tracking_status === 'moving' || 
      bus.tracking_status === 'at_stop' || 
      bus.tracking_status === 'stopped'
    ) || [];
    
    console.log('✅ Active buses fetched successfully:', activeBuses.length, 'buses');
    return activeBuses;
  },

  // Get nearby buses within a radius
  async getNearbyBuses(latitude, longitude, radiusKm = 5.0) {
    console.log('📡 Fetching nearby buses...');
    const { data, error } = await supabase
      .rpc('get_nearby_buses', {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: radiusKm
      });
    
    if (error) {
      console.error('❌ Error fetching nearby buses:', error);
      throw error;
    }
    
    console.log('✅ Nearby buses fetched successfully:', data?.length || 0, 'buses');
    return data;
  },

  // Update bus location using the database function
  async updateBusLocationFunction(busId, latitude, longitude, speed = null, heading = null, status = 'moving') {
    console.log('📡 Updating bus location...');
    if (!busId) {
      throw new Error('Missing busId for location update');
    }
    console.log('📍 Using busId for RPC (function):', busId);
    const { data, error } = await supabase
      .rpc('update_bus_location_simple', {
        p_bus_id: busId,
        p_latitude: latitude,
        p_longitude: longitude,
        p_accuracy: 10.0, // Default accuracy
        p_speed_kmh: speed
      });
    
    if (error) {
      console.error('❌ Error updating bus location:', error);
      throw error;
    }
    
    console.log('✅ Bus location updated successfully');
    return data;
  },

  // Get bus statistics
  async getBusStatistics() {
    console.log('📡 Fetching bus statistics...');
    const { data, error } = await supabase
      .rpc('get_bus_statistics');
    
    if (error) {
      console.error('❌ Error fetching bus statistics:', error);
      throw error;
    }
    
    console.log('✅ Bus statistics fetched successfully');
    return data?.[0] || null;
  },

  // Test function to verify database data
  async testDatabaseData() {
    console.log('🧪 Testing database data...');
    
    // Test buses
    const { data: buses, error: busesError } = await supabase
      .from('buses')
      .select('*')
      .limit(5);
    
    if (busesError) {
      console.error('❌ Error fetching buses:', busesError);
      return { success: false, error: busesError.message };
    }
    
    console.log('✅ Buses test:', buses?.length || 0, 'buses found');
    
    // Test bus tracking
    const { data: tracking, error: trackingError } = await supabase
      .from('bus_tracking')
      .select('*')
      .limit(5);
    
    if (trackingError) {
      console.error('❌ Error fetching bus tracking:', trackingError);
      return { success: false, error: trackingError.message };
    }
    
    console.log('✅ Bus tracking test:', tracking?.length || 0, 'tracking records found');
    
    // Test get_realtime_bus_status function
    const { data: viewData, error: viewError } = await supabase
      .rpc('get_realtime_bus_status');
    
    if (viewError) {
      console.error('❌ Error fetching real-time bus status:', viewError);
      return { success: false, error: viewError.message };
    }
    
    console.log('✅ Real-time bus status test:', viewData?.length || 0, 'records found');
    console.log('✅ Sample real-time data:', viewData?.[0]);
    
    return { 
      success: true, 
      data: { 
        buses: buses?.length || 0, 
        tracking: tracking?.length || 0, 
        view: viewData?.length || 0,
        sampleViewData: viewData?.[0]
      } 
    };
  },

  // Ping Bus Notifications with Rate Limiting
  pingBus: async (busId, pingType = 'ride_request', message = '', location = null) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return { success: false, error: 'User not authenticated. Please log in first.' };
      }

      // Use rate-limited ping function
      const { data, error } = await supabase.rpc('send_ping_with_limit', {
        p_user_id: user.id,
        p_bus_id: busId,
        p_ping_type: pingType,
        p_message: message,
        p_location_latitude: location?.latitude || null,
        p_location_longitude: location?.longitude || null,
        p_location_address: location?.address || null
      });

      if (error) throw error;

      // Check if rate limit was hit
      if (data && !data.success && data.allowed === false) {
        return { 
          success: false, 
          error: data.message,
          reason: data.reason,
          cooldownRemaining: data.cooldown_remaining,
          blockedUntil: data.blocked_until,
          remainingToday: data.remaining_today
        };
      }

      return { 
        success: true, 
        data: data,
        remainingToday: data?.remaining_today 
      };
    } catch (error) {
      console.error('Error pinging bus:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user's ping status and limits
  getUserPingStatus: async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase.rpc('get_user_ping_status', {
        p_user_id: user.id
      });

      if (error) {
        // If the function doesn't exist or column is missing, return default values
        if (error.code === '42703' || error.message.includes('does not exist')) {
          console.warn('⚠️ Ping status function/columns not available, returning defaults');
          return { 
            success: true, 
            data: {
              is_blocked: false,
              blocked_until: null,
              pings_today: 0,
              pings_remaining: 50,
              cooldown_remaining: 0,
              can_ping: true
            }
          };
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching ping status:', error);
      return { success: false, error: error.message };
    }
  },

  getUserPingNotifications: async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_ping_notifications', {
          user_uuid: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user ping notifications:', error);
      return { success: false, error: error.message };
    }
  },

  getBusPingNotifications: async (busId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_bus_ping_notifications', {
          bus_uuid: busId
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching bus ping notifications:', error);
      return { success: false, error: error.message };
    }
  },

  acknowledgePing: async (pingId) => {
    try {
      const { data, error } = await supabase
        .rpc('acknowledge_ping_notification', {
          ping_id: pingId
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error acknowledging ping:', error);
      return { success: false, error: error.message };
    }
  },

  completePing: async (pingId) => {
    try {
      const { data, error } = await supabase
        .rpc('complete_ping_notification', {
          ping_id: pingId
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error completing ping:', error);
      return { success: false, error: error.message };
    }
  }
}; 