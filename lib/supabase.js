import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials
const supabaseUrl = 'https://bukrffymmsdbpqxmdwbv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1a3JmZnltbXNkYnBxeG1kd2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDkxNDMsImV4cCI6MjA2OTc4NTE0M30.UpZBCFwo-hygvClBflw8B20rLGtcYPsyMaRGonH9omA';

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
  // Bus operations
  async getBuses() {
    console.log('📡 Fetching buses from database...');
    const { data, error } = await supabase
      .from(TABLES.BUSES)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching buses:', error);
      throw error;
    }
    
    console.log('✅ Buses fetched successfully:', data?.length || 0, 'buses');
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

  async updateBusLocation(busId, latitude, longitude) {
    const { data, error } = await supabase
      .from(TABLES.TRACKING)
      .upsert({
        bus_id: busId,
        latitude,
        longitude,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return data;
  },

  // Route operations
  async getRoutes() {
    console.log('📡 Fetching routes from database...');
    const { data, error } = await supabase
      .from(TABLES.ROUTES)
      .select('*')
      .order('route_number', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching routes:', error);
      throw error;
    }
    
    console.log('✅ Routes fetched successfully:', data?.length || 0, 'routes');
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
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching stops:', error);
      throw error;
    }
    
    console.log('✅ Stops fetched successfully:', data?.length || 0, 'stops');
    return data;
  },

  async getStopsByRoute(routeId) {
    const { data, error } = await supabase
      .from(TABLES.STOPS)
      .select('*')
      .eq('route_id', routeId)
      .order('sequence', { ascending: true });
    
    if (error) throw error;
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

  // Real-time subscriptions
  subscribeToBusLocations(callback) {
    return supabase
      .channel('bus_locations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.TRACKING },
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
  }
}; 