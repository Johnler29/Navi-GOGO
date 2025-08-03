import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseHelpers, testDatabaseConnection } from '../lib/supabase';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('testing');

  // Load initial data
  useEffect(() => {
    testConnectionAndLoadData();
    setupRealtimeSubscriptions();
  }, []);

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
      const [busesData, routesData, stopsData, schedulesData, driversData, feedbackData] = await Promise.all([
        supabaseHelpers.getBuses(),
        supabaseHelpers.getRoutes(),
        supabaseHelpers.getStops(),
        supabaseHelpers.getSchedules(),
        supabaseHelpers.getDrivers(),
        supabaseHelpers.getFeedback()
      ]);

      setBuses(busesData || []);
      setRoutes(routesData || []);
      setStops(stopsData || []);
      setSchedules(schedulesData || []);
      setDrivers(driversData || []);
      setFeedback(feedbackData || []);
      
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
    // Subscribe to bus location updates
    const busLocationSubscription = supabaseHelpers.subscribeToBusLocations((payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        // Update bus location in real-time
        setBuses(prevBuses => {
          const updatedBuses = prevBuses.map(bus => {
            if (bus.id === payload.new.bus_id) {
              return {
                ...bus,
                current_location: {
                  latitude: payload.new.latitude,
                  longitude: payload.new.longitude
                },
                last_updated: payload.new.updated_at
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
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
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

    // Cleanup subscriptions on unmount
    return () => {
      busLocationSubscription?.unsubscribe();
      scheduleSubscription?.unsubscribe();
    };
  };

  // Bus operations
  const getBusById = async (id) => {
    try {
      return await supabaseHelpers.getBusById(id);
    } catch (err) {
      console.error('Error getting bus by ID:', err);
      throw err;
    }
  };

  const updateBusLocation = async (busId, latitude, longitude) => {
    try {
      await supabaseHelpers.updateBusLocation(busId, latitude, longitude);
    } catch (err) {
      console.error('Error updating bus location:', err);
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

  const refreshData = () => {
    testConnectionAndLoadData();
  };

  const value = {
    // State
    buses,
    routes,
    stops,
    schedules,
    drivers,
    feedback,
    loading,
    error,
    connectionStatus,
    
    // Operations
    getBusById,
    updateBusLocation,
    getRouteById,
    getStopsByRoute,
    getSchedulesByRoute,
    submitFeedback,
    createUser,
    getUserById,
    getDriverById,
    refreshData
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}; 