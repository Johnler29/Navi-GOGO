import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseHelpers, testDatabaseConnection } from '../lib/supabase';

const SupabaseContext = createContext();

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
  const [stops, setStops] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [driverBusAssignments, setDriverBusAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('testing');

  // Load initial data
  useEffect(() => {
    // Load data and setup real-time subscriptions in both dev and production
    if (__DEV__) {
      // In development, load minimal data
      loadMinimalData();
    } else {
      testConnectionAndLoadData();
    }
    // Always setup real-time subscriptions regardless of environment
    setupRealtimeSubscriptions();
  }, []);

  // Minimal data loading for development
  const loadMinimalData = async () => {
    try {
      setLoading(true);
      // Load essential data including drivers for development
      const { data: busesData } = await supabase.from('buses').select('*').limit(5);
      const { data: routesData } = await supabase.from('routes').select('*').limit(5);
      const { data: driversData } = await supabase.from('drivers').select('*').limit(10);
      const { data: assignmentsData } = await supabase.from('driver_bus_assignments').select('*');
      
      setBuses(busesData || []);
      setRoutes(routesData || []);
      setDrivers(driversData || []);
      setDriverBusAssignments(assignmentsData || []);
      setConnectionStatus('connected');
      
      console.log('📊 Loaded minimal data:', {
        buses: busesData?.length || 0,
        routes: routesData?.length || 0,
        drivers: driversData?.length || 0,
        assignments: assignmentsData?.length || 0
      });
    } catch (error) {
      console.error('Error loading minimal data:', error);
      setError(error.message);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const testConnectionAndLoadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('testing');

      // First, test the database connection
      console.log('🔍 Testing database connection...');
      const connectionTest = await testDatabaseConnection();
      
      if (!connectionTest.success) {
        console.error('❌ Database connection failed:', connectionTest.error);
        setError(`Database connection failed: ${connectionTest.error}`);
        setConnectionStatus('failed');
        setLoading(false);
        return;
      }

      setConnectionStatus('connected');
      console.log('✅ Database connection successful, loading data...');

      // Load all data in parallel
      const [busesData, routesData, stopsData, schedulesData, driversData, feedbackData, assignmentsData] = await Promise.all([
        supabaseHelpers.getBuses(),
        supabaseHelpers.getRoutes(),
        supabaseHelpers.getStops(),
        supabaseHelpers.getSchedules(),
        supabaseHelpers.getDrivers(),
        supabaseHelpers.getFeedback(),
        supabaseHelpers.getDriverBusAssignments()
      ]);

      console.log('🚌 Buses data loaded:', busesData?.length || 0, 'buses');
      console.log('🚌 Sample bus data:', busesData?.[0]);
      console.log('🚌 Routes data loaded:', routesData?.length || 0, 'routes');
      console.log('🚌 Sample route data:', routesData?.[0]);
      
      setBuses(busesData || []);
      setRoutes(routesData || []);
      setStops(stopsData || []);
      setSchedules(schedulesData || []);
      setDrivers(driversData || []);
      setFeedback(feedbackData || []);
      setDriverBusAssignments(assignmentsData || []);
      
      console.log('✅ All data loaded successfully');
    } catch (err) {
      console.error('❌ Error loading initial data:', err);
      setError(err.message);
      setConnectionStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    console.log('🔄 Setting up real-time subscriptions...');
    
    // Subscribe to bus location updates
    const busLocationSubscription = supabaseHelpers.subscribeToBusLocations((payload) => {
      console.log('🎯 Real-time bus update received:', payload);
      
      if (payload.event === 'UPDATE' || payload.event === 'INSERT') {
        console.log('✅ Processing bus update:', payload.new);
        
        // Update bus location in real-time
        setBuses(prevBuses => {
          const updatedBuses = prevBuses.map(bus => {
            if (bus.id === payload.new.id) {
              console.log('📍 Updating bus position:', {
                id: bus.id,
                old: { lat: bus.latitude, lng: bus.longitude },
                new: { lat: payload.new.latitude, lng: payload.new.longitude }
              });
              
              return {
                ...bus,
                latitude: payload.new.latitude,
                longitude: payload.new.longitude,
                speed: payload.new.speed,
                heading: payload.new.heading,
                tracking_status: payload.new.tracking_status,
                last_location_update: payload.new.last_location_update
              };
            }
            return bus;
          });
          return updatedBuses;
        });
      }
    });

    // Subscribe to schedule updates
    const scheduleSubscription = supabaseHelpers.subscribeToSchedules((payload) => {
      if (payload.event === 'UPDATE' || payload.event === 'INSERT') {
        setSchedules(prevSchedules => {
          const updatedSchedules = prevSchedules.map(schedule => {
            if (schedule.id === payload.new.id) {
              return payload.new;
            }
            return schedule;
          });
          return updatedSchedules;
        });
      }
    });

    // Log subscription status
    if (busLocationSubscription) {
      console.log('✅ Bus location subscription created');
    } else {
      console.error('❌ Failed to create bus location subscription');
    }
    
    if (scheduleSubscription) {
      console.log('✅ Schedule subscription created');
    } else {
      console.error('❌ Failed to create schedule subscription');
    }

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🔄 Cleaning up real-time subscriptions...');
      busLocationSubscription?.unsubscribe();
      scheduleSubscription?.unsubscribe();
    };
  };

  // Poll bus data in development for fallback real-time updates
  useEffect(() => {
    if (!__DEV__) return; // Only run in development
    
    const pollInterval = setInterval(async () => {
      try {
        const busesData = await supabaseHelpers.getBuses();
        setBuses(busesData || []);
      } catch (err) {
        console.warn('⚠️ Error polling buses:', err.message);
      }
    }, 1500); // Poll every 1.5 seconds in development for smooth updates
    
    return () => clearInterval(pollInterval);
  }, []);

  // Bus operations
  const getBusById = async (id) => {
    try {
      return await supabaseHelpers.getBusById(id);
    } catch (err) {
      console.error('Error getting bus by ID:', err);
      throw err;
    }
  };


  // Route operations
  const getRouteById = async (id) => {
    try {
      return await supabaseHelpers.getRouteById(id);
    } catch (err) {
      console.error('Error getting route by ID:', err);
      throw err;
    }
  };

  const getStopsByRoute = async (routeId) => {
    try {
      return await supabaseHelpers.getStopsByRoute(routeId);
    } catch (err) {
      console.error('Error getting stops by route:', err);
      throw err;
    }
  };

  // Schedule operations
  const getSchedulesByRoute = async (routeId) => {
    try {
      return await supabaseHelpers.getSchedulesByRoute(routeId);
    } catch (err) {
      console.error('Error getting schedules by route:', err);
      throw err;
    }
  };

  // Feedback operations
  const submitFeedback = async (feedback) => {
    try {
      return await supabaseHelpers.submitFeedback(feedback);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      throw err;
    }
  };

  // User operations
  const createUser = async (userData) => {
    try {
      return await supabaseHelpers.createUser(userData);
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  };

  const getUserById = async (id) => {
    try {
      return await supabaseHelpers.getUserById(id);
    } catch (err) {
      console.error('Error getting user by ID:', err);
      throw err;
    }
  };

  // Driver operations
  const getDriverById = async (id) => {
    try {
      return await supabaseHelpers.getDriverById(id);
    } catch (err) {
      console.error('Error getting driver by ID:', err);
      throw err;
    }
  };

  const getDriverSchedules = async (driverId) => {
    try {
      return await supabaseHelpers.getDriverSchedules(driverId);
    } catch (err) {
      console.error('Error getting driver schedules:', err);
      throw err;
    }
  };

  const getDriverBuses = async (driverId) => {
    try {
      return await supabaseHelpers.getDriverBuses(driverId);
    } catch (err) {
      console.error('Error getting driver buses:', err);
      throw err;
    }
  };

  const updateDriverStatus = async (driverId, status) => {
    try {
      return await supabaseHelpers.updateDriverStatus(driverId, status);
    } catch (err) {
      console.error('Error updating driver status:', err);
      throw err;
    }
  };

  const startTrip = async (driverId, busId, routeId) => {
    try {
      return await supabaseHelpers.startTrip(driverId, busId, routeId);
    } catch (err) {
      console.error('Error starting trip:', err);
      throw err;
    }
  };

  const endTrip = async (tripId, endData) => {
    try {
      return await supabaseHelpers.endTrip(tripId, endData);
    } catch (err) {
      console.error('Error ending trip:', err);
      throw err;
    }
  };

  const updatePassengerCount = async (busId, passengerCount) => {
    try {
      return await supabaseHelpers.updatePassengerCount(busId, passengerCount);
    } catch (err) {
      console.error('Error updating passenger count:', err);
      throw err;
    }
  };

  const reportEmergency = async (driverId, emergencyData) => {
    try {
      return await supabaseHelpers.reportEmergency(driverId, emergencyData);
    } catch (err) {
      console.error('Error reporting emergency:', err);
      throw err;
    }
  };

  const reportMaintenanceIssue = async (driverId, issueData) => {
    try {
      return await supabaseHelpers.reportMaintenanceIssue(driverId, issueData);
    } catch (err) {
      console.error('Error reporting maintenance issue:', err);
      throw err;
    }
  };

  const getDriverPerformance = async (driverId, period = 'week') => {
    try {
      return await supabaseHelpers.getDriverPerformance(driverId, period);
    } catch (err) {
      console.error('Error getting driver performance:', err);
      throw err;
    }
  };

  const submitPassengerFeedback = async (userId, feedbackData) => {
    try {
      return await supabaseHelpers.submitPassengerFeedback(userId, feedbackData);
    } catch (err) {
      console.error('Error submitting passenger feedback:', err);
      throw err;
    }
  };

  const getPassengerFeedback = async (userId, filters = {}) => {
    try {
      return await supabaseHelpers.getPassengerFeedback(userId, filters);
    } catch (err) {
      console.error('Error getting passenger feedback:', err);
      throw err;
    }
  };

  const updateBusCapacityStatus = async (busId, capacityPercentage) => {
    try {
      return await supabaseHelpers.updateBusCapacityStatus(busId, capacityPercentage);
    } catch (err) {
      console.error('Error updating bus capacity status:', err);
      throw err;
    }
  };

  const getBusCapacityStatus = async (busId) => {
    try {
      return await supabaseHelpers.getBusCapacityStatus(busId);
    } catch (err) {
      console.error('Error getting bus capacity status:', err);
      throw err;
    }
  };

  const authenticateDriver = async (email, password) => {
    try {
      return await supabaseHelpers.authenticateDriver(email, password);
    } catch (err) {
      console.error('Error authenticating driver:', err);
      throw err;
    }
  };

  const updateBusLocation = async (locationData) => {
    try {
      return await supabaseHelpers.updateBusLocation(locationData);
    } catch (err) {
      console.error('Error updating bus location:', err);
      throw err;
    }
  };

  const startDriverSession = async (driverId, busId) => {
    try {
      return await supabaseHelpers.startDriverSession(driverId, busId);
    } catch (err) {
      console.error('Error starting driver session:', err);
      throw err;
    }
  };

  const endDriverSession = async (sessionId) => {
    try {
      return await supabaseHelpers.endDriverSession(sessionId);
    } catch (err) {
      console.error('Error ending driver session:', err);
      throw err;
    }
  };

  const refreshData = async () => {
    try {
      await testConnectionAndLoadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    }
  };

  const refreshDriverData = async () => {
    try {
      console.log('🔄 Refreshing driver data...');
      const { data: driversData } = await supabase.from('drivers').select('*').limit(10);
      const { data: assignmentsData } = await supabase.from('driver_bus_assignments').select('*');
      
      setDrivers(driversData || []);
      setDriverBusAssignments(assignmentsData || []);
      
      console.log('✅ Driver data refreshed:', {
        drivers: driversData?.length || 0,
        assignments: assignmentsData?.length || 0
      });
    } catch (error) {
      console.error('❌ Error refreshing driver data:', error);
      throw error;
    }
  };

  const value = {
    // Supabase client
    supabase,
    
    // State
    buses,
    routes,
    stops,
    schedules,
    drivers,
    feedback,
    driverBusAssignments,
    loading,
    error,
    connectionStatus,
    
    // Operations
    getBusById,
    getRouteById,
    getStopsByRoute,
    getSchedulesByRoute,
    submitFeedback,
    createUser,
    getUserById,
    getDriverById,
    getDriverSchedules,
    getDriverBuses,
    updateDriverStatus,
    startTrip,
    endTrip,
    updatePassengerCount,
    reportEmergency,
    reportMaintenanceIssue,
    getDriverPerformance,
    submitPassengerFeedback,
    getPassengerFeedback,
    updateBusCapacityStatus,
    getBusCapacityStatus,
    authenticateDriver,
    updateBusLocation,
    startDriverSession,
    endDriverSession,
    refreshData,
    refreshDriverData
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}; 