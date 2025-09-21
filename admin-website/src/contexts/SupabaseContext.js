import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SupabaseContext = createContext();

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://bukrffymmsdbpqxmdwbv.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1a3JmZnltbXNkYnBxeG1kd2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDkxNDMsImV4cCI6MjA2OTc4NTE0M30.UpZBCFwo-hygvClBflw8B20rLGtcYPsyMaRGonH9omA';

const supabase = createClient(supabaseUrl, supabaseKey);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider = ({ children }) => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [stops, setStops] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time subscriptions
  useEffect(() => {
    const setupRealtimeSubscriptions = () => {
      // Buses subscription
      const busesSubscription = supabase
        .channel('buses_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'buses' },
          (payload) => {
            console.log('Buses change received:', payload);
            if (payload.eventType === 'INSERT') {
              setBuses(prev => [...prev, payload.new]);
            } else if (payload.eventType === 'UPDATE') {
              setBuses(prev => prev.map(bus => 
                bus.id === payload.new.id ? payload.new : bus
              ));
            } else if (payload.eventType === 'DELETE') {
              setBuses(prev => prev.filter(bus => bus.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Routes subscription
      const routesSubscription = supabase
        .channel('routes_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'routes' },
          (payload) => {
            console.log('Routes change received:', payload);
            if (payload.eventType === 'INSERT') {
              setRoutes(prev => [...prev, payload.new]);
            } else if (payload.eventType === 'UPDATE') {
              setRoutes(prev => prev.map(route => 
                route.id === payload.new.id ? payload.new : route
              ));
            } else if (payload.eventType === 'DELETE') {
              setRoutes(prev => prev.filter(route => route.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Drivers subscription
      const driversSubscription = supabase
        .channel('drivers_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'drivers' },
          (payload) => {
            console.log('Drivers change received:', payload);
            if (payload.eventType === 'INSERT') {
              setDrivers(prev => [...prev, payload.new]);
            } else if (payload.eventType === 'UPDATE') {
              setDrivers(prev => prev.map(driver => 
                driver.id === payload.new.id ? payload.new : driver
              ));
            } else if (payload.eventType === 'DELETE') {
              setDrivers(prev => prev.filter(driver => driver.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(busesSubscription);
        supabase.removeChannel(routesSubscription);
        supabase.removeChannel(driversSubscription);
      };
    };

    const unsubscribe = setupRealtimeSubscriptions();
    return unsubscribe;
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all data in parallel
        const [busesResult, routesResult, driversResult, schedulesResult, stopsResult, usersResult, feedbackResult] = await Promise.all([
          supabase.from('buses').select('*').order('created_at', { ascending: false }),
          supabase.from('routes').select('*').order('created_at', { ascending: false }),
          supabase.from('drivers').select('*').order('created_at', { ascending: false }),
          supabase.from('schedules').select('*').order('created_at', { ascending: false }),
          supabase.from('stops').select('*').order('created_at', { ascending: false }),
          supabase.from('users').select('*').order('created_at', { ascending: false }),
          supabase.from('feedback').select('*').order('created_at', { ascending: false })
        ]);

        if (busesResult.error) throw busesResult.error;
        if (routesResult.error) throw routesResult.error;
        if (driversResult.error) throw driversResult.error;
        if (schedulesResult.error) throw schedulesResult.error;
        if (stopsResult.error) throw stopsResult.error;
        if (usersResult.error) throw usersResult.error;
        if (feedbackResult.error) throw feedbackResult.error;

        setBuses(busesResult.data || []);
        setRoutes(routesResult.data || []);
        setDrivers(driversResult.data || []);
        setSchedules(schedulesResult.data || []);
        setStops(stopsResult.data || []);
        setUsers(usersResult.data || []);
        setFeedback(feedbackResult.data || []);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // CRUD operations
  const createBus = async (busData) => {
    const { data, error } = await supabase
      .from('buses')
      .insert([busData])
      .select();
    
    if (error) throw error;
    
    // If a driver is assigned, create the assignment record
    if (data[0] && data[0].driver_id) {
      const { error: assignmentError } = await supabase
        .from('driver_bus_assignments')
        .insert([{
          driver_id: data[0].driver_id,
          bus_id: data[0].id,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        }]);
      
      if (assignmentError) {
        console.error('Error creating driver assignment:', assignmentError);
        // Don't throw error here as the bus was created successfully
      }
    }
    
    return data[0];
  };

  const updateBus = async (id, updates) => {
    const { data, error } = await supabase
      .from('buses')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    // Handle driver assignment changes
    if (updates.driver_id !== undefined) {
      if (updates.driver_id) {
        // Assign driver to bus
        const { error: assignmentError } = await supabase
          .from('driver_bus_assignments')
          .upsert([{
            driver_id: updates.driver_id,
            bus_id: id,
            assigned_by: (await supabase.auth.getUser()).data.user?.id
          }], {
            onConflict: 'driver_id,bus_id'
          });
        
        if (assignmentError) {
          console.error('Error creating/updating driver assignment:', assignmentError);
        }
      } else {
        // Remove driver assignment
        const { error: deleteError } = await supabase
          .from('driver_bus_assignments')
          .delete()
          .eq('bus_id', id);
        
        if (deleteError) {
          console.error('Error removing driver assignment:', deleteError);
        }
      }
    }
    
    return data[0];
  };

  const deleteBus = async (id) => {
    // First delete any driver assignments for this bus
    const { error: assignmentError } = await supabase
      .from('driver_bus_assignments')
      .delete()
      .eq('bus_id', id);
    
    if (assignmentError) {
      console.error('Error deleting driver assignments:', assignmentError);
    }
    
    // Then delete the bus
    const { error } = await supabase
      .from('buses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  };

  const createRoute = async (routeData) => {
    const { data, error } = await supabase
      .from('routes')
      .insert([routeData])
      .select();
    
    if (error) throw error;
    return data[0];
  };

  const updateRoute = async (id, updates) => {
    const { data, error } = await supabase
      .from('routes')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  };

  const deleteRoute = async (id) => {
    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  };

  const createDriver = async (driverData) => {
    const { data, error } = await supabase
      .from('drivers')
      .insert([driverData])
      .select();
    
    if (error) throw error;
    return data[0];
  };

  // Create driver account with authentication
  const createDriverAccount = async (driverData) => {
    try {
      // First try the RPC function
      const { data, error } = await supabase.rpc('create_driver_account', {
        p_first_name: driverData.firstName,
        p_last_name: driverData.lastName,
        p_email: driverData.email,
        p_password: driverData.password,
        p_license_number: driverData.licenseNumber,
        p_phone: driverData.phone,
        p_created_by: null // Will be set by the admin user
      });

      if (error) throw error;
      return data;
    } catch (rpcError) {
      // If RPC function fails, try direct insertion
      console.log('RPC function failed, trying direct insertion:', rpcError.message);
      
      const fullName = `${driverData.firstName} ${driverData.lastName}`;
      const hashedPassword = await hashPassword(driverData.password);
      
      const { data, error } = await supabase
        .from('drivers')
        .insert([{
          name: fullName,
          first_name: driverData.firstName,
          last_name: driverData.lastName,
          email: driverData.email,
          password_hash: hashedPassword,
          license_number: driverData.licenseNumber,
          phone: driverData.phone,
          is_active: true
        }])
        .select();

      if (error) throw error;
      
      return {
        success: true,
        driver_id: data[0].id,
        message: 'Driver account created successfully'
      };
    }
  };

  // Helper function to hash password (simple implementation)
  const hashPassword = async (password) => {
    // Simple hash function using Web Crypto API (works in browsers)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Get user statistics
  const getUserStatistics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_statistics');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading user statistics:', error);
      // Fallback to manual calculation
      return {
        total_users: users.length,
        active_users: users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
        pending_feedback: feedback.filter(f => f.status === 'pending').length,
        support_tickets: 0
      };
    }
  };

  // Get drivers with authentication info
  const getDriversWithAuth = async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  };

  // Update driver status
  const updateDriverStatus = async (driverId, status) => {
    const { data, error } = await supabase
      .from('drivers')
      .update({ is_active: status === 'active' })
      .eq('id', driverId)
      .select();
    
    if (error) throw error;
    return data[0];
  };

  // Delete driver
  const deleteDriverAccount = async (driverId) => {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', driverId);
    
    if (error) throw error;
  };

  const updateDriver = async (id, updates) => {
    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  };

  const deleteDriver = async (id) => {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  };

  const updateBusLocation = async (busId, locationData) => {
    const { data, error } = await supabase
      .from('buses')
      .update({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        speed: locationData.speed,
        heading: locationData.heading,
        tracking_status: locationData.tracking_status,
        last_location_update: new Date().toISOString()
      })
      .eq('id', busId)
      .select();
    
    if (error) throw error;
    return data[0];
  };

  const getAnalytics = async () => {
    try {
      // Get various analytics data
      const [
        totalBuses,
        activeBuses,
        totalRoutes,
        totalDrivers,
        totalUsers,
        recentFeedback
      ] = await Promise.all([
        supabase.from('buses').select('id', { count: 'exact' }),
        supabase.from('buses').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('routes').select('id', { count: 'exact' }),
        supabase.from('drivers').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      return {
        totalBuses: totalBuses.count || 0,
        activeBuses: activeBuses.count || 0,
        totalRoutes: totalRoutes.count || 0,
        totalDrivers: totalDrivers.count || 0,
        totalUsers: totalUsers.count || 0,
        recentFeedback: recentFeedback.data || []
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  };

  // Ping Notifications
  const getPingNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('ping_notifications')
        .select(`
          *,
          users:user_id(first_name, last_name, email, phone),
          buses:bus_id(bus_number, name, route_id)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching ping notifications:', error);
      return [];
    }
  };

  const acknowledgePing = async (pingId) => {
    try {
      const { data, error } = await supabase
        .rpc('acknowledge_ping_notification', { ping_id: pingId });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error acknowledging ping:', error);
      return false;
    }
  };

  const completePing = async (pingId) => {
    try {
      const { data, error } = await supabase
        .rpc('complete_ping_notification', { ping_id: pingId });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error completing ping:', error);
      return false;
    }
  };

  // Sync driver-bus assignments for existing buses
  const syncDriverBusAssignments = async () => {
    try {
      // Get buses that have driver_id but no assignment record
      const { data: busesWithDrivers, error: busesError } = await supabase
        .from('buses')
        .select('id, driver_id')
        .not('driver_id', 'is', null);
      
      if (busesError) throw busesError;
      
      // Get existing assignments
      const { data: existingAssignments, error: assignmentsError } = await supabase
        .from('driver_bus_assignments')
        .select('driver_id, bus_id');
      
      if (assignmentsError) throw assignmentsError;
      
      // Create assignments for buses that don't have them
      const assignmentsToCreate = busesWithDrivers.filter(bus => 
        !existingAssignments.some(assignment => 
          assignment.driver_id === bus.driver_id && assignment.bus_id === bus.id
        )
      );
      
      if (assignmentsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('driver_bus_assignments')
          .insert(assignmentsToCreate.map(bus => ({
            driver_id: bus.driver_id,
            bus_id: bus.id,
            assigned_by: null // We don't know who originally assigned it
          })));
        
        if (insertError) throw insertError;
        console.log(`Created ${assignmentsToCreate.length} missing driver-bus assignments`);
      }
      
      return assignmentsToCreate.length;
    } catch (error) {
      console.error('Error syncing driver-bus assignments:', error);
      throw error;
    }
  };

  const value = {
    supabase,
    buses,
    routes,
    drivers,
    schedules,
    stops,
    users,
    feedback,
    loading,
    error,
    createBus,
    updateBus,
    deleteBus,
    createRoute,
    updateRoute,
    deleteRoute,
    createDriver,
    updateDriver,
    deleteDriver,
    updateBusLocation,
    getAnalytics,
    getPingNotifications,
    acknowledgePing,
    completePing,
    syncDriverBusAssignments,
    createDriverAccount,
    getUserStatistics,
    getDriversWithAuth,
    updateDriverStatus,
    deleteDriverAccount
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};
