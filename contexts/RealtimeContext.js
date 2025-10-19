import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';

const RealtimeContext = createContext();

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [subscriptions, setSubscriptions] = useState({});
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastError, setLastError] = useState(null);

  const heartbeatInterval = useRef(null);
  const reconnectTimeout = useRef(null);
  const connectionId = useRef(null);
  const maxReconnectAttempts = 5;
  const heartbeatIntervalMs = 30000; // 30 seconds

  // Initialize connection
  useEffect(() => {
    initializeConnection();
    setupAppStateHandling();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeConnection = async () => {
    try {
      console.log('🔄 Initializing real-time connection...');
      setConnectionStatus('connecting');
      
      // Generate unique connection ID
      connectionId.current = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Register connection with backend
      const { data, error } = await supabase.rpc('register_client_connection', {
        p_user_id: null, // Will be set when user authenticates
        p_user_type: 'passenger', // Default, can be changed
        p_session_id: null,
        p_connection_id: connectionId.current,
        p_subscriptions: {},
        p_device_info: {
          platform: 'mobile',
          app_version: '1.0.0',
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('❌ Failed to register connection:', error);
        handleConnectionError(error);
        return;
      }

      console.log('✅ Connection registered:', data);
      setIsConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      setLastError(null);
      
      // Start heartbeat
      startHeartbeat();
      
      // Setup default subscriptions
      await setupDefaultSubscriptions();
      
    } catch (error) {
      console.error('❌ Connection initialization failed:', error);
      handleConnectionError(error);
    }
  };

  const setupDefaultSubscriptions = async () => {
    try {
      // Subscribe to bus location updates with better error handling
      const busLocationSub = supabase
        .channel('bus_locations', {
          config: {
            broadcast: { self: false },
            presence: { key: 'bus-locations' }
          }
        })
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'buses',
            filter: 'tracking_status=eq.moving'
          }, 
          handleBusLocationUpdate
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'buses',
            filter: 'tracking_status=eq.stopped'
          },
          handleBusLocationUpdate
        )
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'location_updates'
          },
          handleLocationUpdate
        )
        .subscribe((status) => {
          console.log('🚌 Bus location subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Bus location subscription is active');
            setSubscriptions(prev => ({
              ...prev,
              busLocations: { status: 'active', channel: busLocationSub }
            }));
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Bus location subscription failed - check if real-time is enabled');
            console.error('💡 Run: sql/enable-realtime-bus-tracking.sql');
          } else if (status === 'TIMED_OUT') {
            console.error('❌ Bus location subscription timed out');
          } else if (status === 'CLOSED') {
            console.error('❌ Bus location subscription closed');
          }
        });

      // Subscribe to driver session changes
      const driverSessionSub = supabase
        .channel('driver_sessions')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'driver_sessions'
          },
          handleDriverSessionChange
        )
        .subscribe((status) => {
          console.log('👨‍💼 Driver session subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setSubscriptions(prev => ({
              ...prev,
              driverSessions: { status: 'active', channel: driverSessionSub }
            }));
          }
        });

      // Subscribe to emergency alerts
      const emergencyAlertsSub = supabase
        .channel('emergency_alerts')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'driver_emergency_reports'
          },
          handleEmergencyAlert
        )
        .subscribe((status) => {
          console.log('🚨 Emergency alerts subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setSubscriptions(prev => ({
              ...prev,
              emergencyAlerts: { status: 'active', channel: emergencyAlertsSub }
            }));
          }
        });

    } catch (error) {
      console.error('❌ Failed to setup subscriptions:', error);
      setLastError(error);
    }
  };

  const handleBusLocationUpdate = (payload) => {
    console.log('📍 Bus location update received:', payload);
    
    // Emit custom event for components to listen to
    const event = new CustomEvent('busLocationUpdate', {
      detail: {
        busId: payload.new.id,
        location: {
          latitude: payload.new.latitude,
          longitude: payload.new.longitude,
          speed: payload.new.speed,
          heading: payload.new.heading
        },
        status: payload.new.tracking_status,
        capacity: payload.new.capacity_percentage,
        lastUpdate: payload.new.last_location_update,
        timestamp: new Date().toISOString()
      }
    });
    
    // Dispatch to global event system
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  };

  const handleLocationUpdate = (payload) => {
    console.log('📍 Location update received:', payload);
    
    const event = new CustomEvent('locationUpdate', {
      detail: {
        locationId: payload.new.id,
        busId: payload.new.bus_id,
        driverId: payload.new.driver_id,
        location: {
          latitude: payload.new.latitude,
          longitude: payload.new.longitude,
          accuracy: payload.new.accuracy,
          speed: payload.new.speed,
          heading: payload.new.heading
        },
        timestamp: payload.new.created_at
      }
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  };

  const handleDriverSessionChange = (payload) => {
    console.log('👨‍💼 Driver session change:', payload);
    
    const event = new CustomEvent('driverSessionChange', {
      detail: {
        sessionId: payload.new.id,
        driverId: payload.new.driver_id,
        busId: payload.new.bus_id,
        status: payload.new.status,
        eventType: payload.eventType,
        timestamp: new Date().toISOString()
      }
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  };

  const handleEmergencyAlert = (payload) => {
    console.log('🚨 Emergency alert received:', payload);
    
    const event = new CustomEvent('emergencyAlert', {
      detail: {
        alertId: payload.new.id,
        driverId: payload.new.driver_id,
        busId: payload.new.bus_id,
        emergencyType: payload.new.emergency_type,
        description: payload.new.description,
        priority: payload.new.priority,
        location: {
          latitude: payload.new.location_lat,
          longitude: payload.new.location_lng
        },
        timestamp: payload.new.created_at
      }
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  };

  const startHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    heartbeatInterval.current = setInterval(async () => {
      try {
        if (!connectionId.current) return;
        
        const success = await supabase.rpc('update_connection_heartbeat', {
          p_connection_id: connectionId.current
        });

        if (!success) {
          console.warn('⚠️ Heartbeat failed, connection may be stale');
          handleConnectionError(new Error('Heartbeat failed'));
        }
      } catch (error) {
        console.error('❌ Heartbeat error:', error);
        handleConnectionError(error);
      }
    }, heartbeatIntervalMs);
  };

  const handleConnectionError = (error) => {
    console.error('🔌 Connection error:', error);
    setLastError(error);
    setIsConnected(false);
    setConnectionStatus('error');
    
    // Stop heartbeat
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    
    // Attempt reconnection
    attemptReconnection();
  };

  const attemptReconnection = () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      setConnectionStatus('failed');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
    console.log(`🔄 Attempting reconnection in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
    
    setConnectionStatus('reconnecting');
    setReconnectAttempts(prev => prev + 1);

    reconnectTimeout.current = setTimeout(() => {
      initializeConnection();
    }, delay);
  };

  const setupAppStateHandling = () => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && connectionStatus !== 'connected') {
        console.log('📱 App became active, checking connection...');
        initializeConnection();
      } else if (nextAppState === 'background') {
        console.log('📱 App went to background, maintaining connection...');
        // Keep connection alive but reduce heartbeat frequency
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return subscription;
  };

  const cleanup = () => {
    console.log('🧹 Cleaning up real-time connections...');
    
    // Clear intervals and timeouts
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    // Unsubscribe from all channels
    Object.values(subscriptions).forEach(sub => {
      if (sub.channel) {
        sub.channel.unsubscribe();
      }
    });
    
    setSubscriptions({});
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const forceReconnect = () => {
    console.log('🔄 Force reconnecting...');
    cleanup();
    setReconnectAttempts(0);
    initializeConnection();
  };

  const subscribeToChannel = async (channelName, config) => {
    try {
      const channel = supabase.channel(channelName);
      
      // Add event listeners based on config
      if (config.events) {
        config.events.forEach(eventConfig => {
          channel.on(eventConfig.type, eventConfig.filter || {}, eventConfig.callback);
        });
      }
      
      const subscription = await channel.subscribe();
      
      setSubscriptions(prev => ({
        ...prev,
        [channelName]: { status: 'active', channel: subscription, config }
      }));
      
      return subscription;
    } catch (error) {
      console.error(`❌ Failed to subscribe to ${channelName}:`, error);
      throw error;
    }
  };

  const unsubscribeFromChannel = (channelName) => {
    const subscription = subscriptions[channelName];
    if (subscription && subscription.channel) {
      subscription.channel.unsubscribe();
      setSubscriptions(prev => {
        const updated = { ...prev };
        delete updated[channelName];
        return updated;
      });
    }
  };

  const getConnectionInfo = () => ({
    isConnected,
    connectionStatus,
    connectionId: connectionId.current,
    subscriptions: Object.keys(subscriptions),
    reconnectAttempts,
    lastError: lastError?.message || null
  });

  const value = {
    isConnected,
    connectionStatus,
    subscriptions,
    reconnectAttempts,
    lastError,
    forceReconnect,
    subscribeToChannel,
    unsubscribeFromChannel,
    getConnectionInfo
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
