import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// MapView now handled by RealtimeBusMap component
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { useSupabase } from '../contexts/SupabaseContext';
import { supabaseHelpers } from '../lib/supabase';
import RealtimeBusMap from '../components/RealtimeBusMap';
import RealtimeTest from '../components/RealtimeTest';
import AlarmModal from '../components/AlarmModal';
import SetAlarmModal from '../components/SetAlarmModal';
import RouteInfoPanel from '../components/RouteInfoPanel';
import { getLocationStatus, getCapacityStatus, formatDistance, formatTime } from '../utils/locationUtils';
import { getAllRoutes, getRouteById } from '../data/routes';

export default function MapScreen({ navigation, route }) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [mapBuses, setMapBuses] = useState([]);
  const [showTest, setShowTest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBusId, setSelectedBusId] = useState(route?.params?.selectedBusId || null);
  const [trackingBus, setTrackingBus] = useState(null);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showPingModal, setShowPingModal] = useState(false);
  const [pingMessage, setPingMessage] = useState('');
  const [pingType, setPingType] = useState('ride_request');
  const [pingCooldown, setPingCooldown] = useState(0);
  const [pingsRemaining, setPingsRemaining] = useState(50);
  const [isPingBlocked, setIsPingBlocked] = useState(false);
  // Always use real-time mode - no manual mode needed
  const [arrivalTimes, setArrivalTimes] = useState({});
  // Route selection state
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [selectedBusForAlarm, setSelectedBusForAlarm] = useState(null);
  const [showSetAlarmModal, setShowSetAlarmModal] = useState(false);
  // Route planner state
  const [showRouteInfoPanel, setShowRouteInfoPanel] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  // Debug selected bus ID
  useEffect(() => {
    console.log('🎯 Selected bus ID from route:', route?.params?.selectedBusId);
    console.log('🎯 Current selectedBusId state:', selectedBusId);
  }, [route?.params?.selectedBusId, selectedBusId]);

  // Update selectedBusId when route params change
  useEffect(() => {
    if (route?.params?.selectedBusId !== selectedBusId) {
      console.log('🎯 Updating selectedBusId from route params:', route?.params?.selectedBusId);
      setSelectedBusId(route?.params?.selectedBusId || null);
    }
  }, [route?.params?.selectedBusId]);

  // Get data from Supabase context
  const { 
    buses, 
    routes, 
    loading: dataLoading, 
    error: dataError, 
    refreshData 
  } = useSupabase();

  useEffect(() => {
    getLocation();
    loadRoutes();

    // Start high-accuracy continuous location updates
    let subscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1000, // Update every 1 second (was 2000)
          distanceInterval: 1, // Update on 1 meter change (was 2)
          mayShowUserSettingsDialog: true,
        },
        (pos) => {
          setLocation(pos);
          const region = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          // Location is now handled by RealtimeBusMap component
        }
      );
    })();

    return () => {
      // Cleanup watcher
      try { subscription && subscription.remove && subscription.remove(); } catch (_) {}
    };
  }, []);

  // Load available routes
  const loadRoutes = async () => {
    try {
      const routes = await getAllRoutes(supabaseHelpers);
      setAvailableRoutes(routes);
      console.log('✅ Loaded routes for MapScreen:', routes.length);
    } catch (err) {
      console.error('Error loading routes:', err);
    }
  };

  useEffect(() => {
    if (buses.length > 0 && routes.length > 0) {
      loadBuses();
    }
  }, [buses, routes]);

  // Focus on selected bus when mapBuses are loaded
  // This is now handled by RealtimeBusMap component
  useEffect(() => {
    if (selectedBusId && mapBuses.length > 0) {
      console.log('🎯 Selected bus ID:', selectedBusId);
      console.log('🎯 Available map buses:', mapBuses.map(bus => ({ id: bus.id, route_number: bus.route_number })));
    }
  }, [selectedBusId, mapBuses]);

  const loadBuses = async () => {
    try {
      console.log('🚌 Loading buses:', buses.length, 'buses from database');
      console.log('🚌 Bus data:', buses);
      
      // Transform database buses to map format - only show buses with active drivers/trips
      const transformedBuses = buses.map(bus => {
        const route = routes.find(r => r.id === bus.route_id);
        console.log('🚌 Processing bus:', bus.bus_number, 'Route:', route?.route_number);
        console.log('🚌 Bus coordinates:', bus.latitude, bus.longitude);
        console.log('🚌 Bus driver status:', bus.driver_id, 'status:', bus.status, 'tracking:', bus.tracking_status);
        
        // Show buses that have active drivers (relaxed criteria for testing)
        const hasActiveDriver = bus.driver_id && bus.status === 'active';
        const hasRecentLocation = bus.last_location_update && 
          new Date(bus.last_location_update) > new Date(Date.now() - 10 * 60 * 1000); // Within last 10 minutes (relaxed)
        const hasValidCoordinates = bus.latitude && bus.longitude && 
          !isNaN(bus.latitude) && !isNaN(bus.longitude);
        
        // Debug logging for each bus
        console.log('🚌 Bus filter check:', {
          bus_number: bus.bus_number,
          driver_id: bus.driver_id,
          status: bus.status,
          hasActiveDriver,
          hasRecentLocation,
          hasValidCoordinates,
          lastUpdate: bus.last_location_update,
          coords: { lat: bus.latitude, lng: bus.longitude }
        });
        
        // Only require active driver and valid coordinates (relaxed from recent location requirement)
        if (!hasActiveDriver || !hasValidCoordinates) {
          console.log('🚌 Skipping bus - no active driver or invalid coords:', bus.bus_number, 'driver:', bus.driver_id, 'status:', bus.status, 'coords:', bus.latitude, bus.longitude);
          return null;
        }
        
        // Get coordinates directly from the buses table
        let lat = bus.latitude;
        let lng = bus.longitude;
        
        // Fallback: if no coords, use sample coordinates or user location
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          console.log('🚌 No valid coordinates for bus, using fallback location');
          if (location?.coords) {
            const baseLat = location.coords.latitude;
            const baseLng = location.coords.longitude;
            const jitter = (Math.random() - 0.5) * 0.002; // ~200m max
            lat = baseLat + jitter;
            lng = baseLng + jitter;
          } else {
            // Use sample coordinates from the database if no user location
            const sampleCoords = [
              { lat: 14.3294, lng: 120.9366 }, // Dasmarinas Terminal
              { lat: 14.4591, lng: 120.9468 }, // Bacoor
              { lat: 14.5995, lng: 120.9842 }  // Manila City Hall
            ];
            const randomCoord = sampleCoords[Math.floor(Math.random() * sampleCoords.length)];
            lat = randomCoord.lat;
            lng = randomCoord.lng;
            console.log('🚌 Using sample coordinates:', lat, lng);
          }
        }
        
        const transformedBus = {
          id: bus.id, // Use id from the buses table
          route_number: route ? route.route_number : 'Unknown',
          direction: route ? `${route.origin} to ${route.destination}` : 'Unknown',
          latitude: lat,
          longitude: lng,
          status: bus.tracking_status || bus.status || 'active',
          capacity_percentage: bus.capacity_percentage || 0,
          current_passengers: bus.current_passengers || 0,
          max_capacity: bus.max_capacity || 50,
          last_location_update: bus.updated_at || new Date().toISOString(),
        };
        
        console.log('🚌 Transformed bus:', transformedBus);
        return transformedBus;
      }).filter(b => {
        if (!b) return false; // Filter out null buses (inactive drivers)
        const isValid = typeof b.latitude === 'number' && typeof b.longitude === 'number';
        console.log('🚌 Bus filter check:', b.route_number, 'Valid:', isValid, 'Coords:', b.latitude, b.longitude);
        return isValid;
      });
      
      console.log('🚌 Final map buses:', transformedBuses.length, 'buses');
      setMapBuses(transformedBuses);
    } catch (error) {
      console.error('Error loading buses:', error);
      setMapBuses([]);
    }
  };

  // Calculate arrival times for buses
  const calculateArrivalTimes = async () => {
    if (!location?.coords || mapBuses.length === 0) return;
    
    try {
      const { supabase } = useSupabase();
      const arrivalPromises = mapBuses.map(async (bus) => {
        const { data, error } = await supabase.rpc('calculate_arrival_times', {
          p_bus_id: bus.id,
          p_passenger_lat: location.coords.latitude,
          p_passenger_lng: location.coords.longitude
        });
        
        if (error) throw error;
        return { busId: bus.id, arrivalData: data };
      });
      
      const results = await Promise.all(arrivalPromises);
      const arrivalMap = {};
      
      results.forEach(({ busId, arrivalData }) => {
        if (arrivalData && !arrivalData.error) {
          arrivalMap[busId] = arrivalData;
        }
      });
      
      setArrivalTimes(arrivalMap);
    } catch (err) {
      console.error('Error calculating arrival times:', err);
    }
  };

  const getLocation = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        setErrorMsg('Location services are disabled. Please enable GPS.');
        setIsLoading(false);
        return;
      }
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied.');
        setIsLoading(false);
        return;
      }

      // Get an initial highly accurate fix fast
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        maximumAge: 5000,
      });

      setLocation(currentLocation);
      setIsLoading(false);
    } catch (error) {
      setErrorMsg(`Failed to get your location: ${error.message}`);
      setIsLoading(false);
    }
  };

  const initialRegion = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : {
    // Fallback region (will recenter as soon as we get a fix)
    latitude: 14.5995,
    longitude: 120.9842,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Google Maps API key now handled by RealtimeBusMap component

  // Location handling now managed by RealtimeBusMap component


  const testDatabase = async () => {
    try {
      const result = await supabaseHelpers.testDatabaseData();
      Alert.alert(
        'Database Test Results',
        `Buses: ${result.data?.buses || 0}\nTracking: ${result.data?.tracking || 0}\nView: ${result.data?.view || 0}\n\nCheck console for details.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Database Test Failed', error.message);
    }
  };

  const clearSelection = () => {
    setSelectedBusId(null);
    console.log('🎯 Cleared bus selection');
  };

  const handleBusPress = (bus) => {
    console.log('🚌 Bus pressed:', bus);
    setTrackingBus(bus);
    setShowTrackModal(true);
  };

  const handleBusSelect = (bus) => {
    console.log('🚌 Bus selected for map focus:', bus);
    console.log('🚌 Bus ID for selection:', bus.id);
    setSelectedBusId(bus.id);
  };

  const handleBusesLoaded = (loadedBuses) => {
    console.log('🚌 MapScreen - Buses loaded from RealtimeBusMap:', loadedBuses.length);
    setMapBuses(loadedBuses);
  };

  const handleRouteSelect = async (routeId) => {
    console.log('🗺️ Route selected:', routeId);
    setSelectedRouteId(routeId);
    setShowRouteSelector(false);
    
    // Load the selected route details
    try {
      const route = await getRouteById(routeId, supabaseHelpers);
      if (route) {
        console.log('✅ Selected route details:', route.name);
      }
    } catch (err) {
      console.error('Error loading selected route:', err);
    }
  };

  const startTracking = () => {
    if (trackingBus) {
      setSelectedBusId(trackingBus.id);
      setShowTrackModal(false);
      
      // Focus on the tracked bus - now handled by RealtimeBusMap component
    }
  };

  const stopTracking = () => {
    setTrackingBus(null);
    setSelectedBusId(null);
    setShowTrackModal(false);
  };

  // Load ping status on mount
  useEffect(() => {
    loadPingStatus();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (pingCooldown > 0) {
      const timer = setTimeout(() => {
        setPingCooldown(pingCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pingCooldown]);

  const loadPingStatus = async () => {
    try {
      const result = await supabaseHelpers.getUserPingStatus();
      if (result.success && result.data) {
        setPingsRemaining(result.data.pings_remaining || 50);
        setPingCooldown(result.data.cooldown_remaining || 0);
        setIsPingBlocked(result.data.is_blocked || false);
      }
    } catch (error) {
      console.error('Error loading ping status:', error);
    }
  };

  const pingBus = async () => {
    if (!selectedBusId) {
      Alert.alert('Error', 'Please select a bus first');
      return;
    }

    // Check if blocked
    if (isPingBlocked) {
      Alert.alert(
        'Temporarily Blocked',
        'You are temporarily blocked from sending pings due to spam detection. Please try again later.'
      );
      return;
    }

    // Check cooldown
    if (pingCooldown > 0) {
      Alert.alert(
        'Cooldown Active',
        `Please wait ${pingCooldown} seconds before sending another ping.`
      );
      return;
    }

    try {
      const selectedBus = mapBuses.find(bus => bus.id === selectedBusId);
      if (!selectedBus) {
        Alert.alert('Error', 'Selected bus not found');
        return;
      }

      const result = await supabaseHelpers.pingBus(
        selectedBusId,
        pingType,
        pingMessage,
        {
          latitude: location?.latitude,
          longitude: location?.longitude,
          address: 'Current Location'
        }
      );

      if (result.success) {
        Alert.alert(
          'Ping Sent!', 
          `Your message has been sent to Bus ${selectedBus.route_number}. The driver will be notified.\n\nPings remaining today: ${result.remainingToday || pingsRemaining - 1}`,
          [{ text: 'OK', onPress: () => {
            setShowPingModal(false);
            setPingCooldown(30); // 30 second cooldown
            setPingsRemaining(result.remainingToday || pingsRemaining - 1);
          }}]
        );
        setPingMessage('');
      } else {
        // Handle different error types
        if (result.reason === 'cooldown') {
          setPingCooldown(result.cooldownRemaining || 30);
          Alert.alert(
            'Cooldown Active',
            `Please wait ${result.cooldownRemaining} seconds before sending another ping.`
          );
        } else if (result.reason === 'daily_limit') {
          setIsPingBlocked(true);
          Alert.alert(
            'Daily Limit Reached',
            'You have reached the daily ping limit (50 pings per day). Try again tomorrow.'
          );
        } else if (result.reason === 'spam_detected') {
          setIsPingBlocked(true);
          Alert.alert(
            'Spam Detected',
            'Too many pings sent in a short time. You are temporarily blocked for 1 hour.'
          );
        } else if (result.reason === 'blocked') {
          setIsPingBlocked(true);
          Alert.alert(
            'Temporarily Blocked',
            result.error || 'You are temporarily blocked from sending pings.'
          );
        } else {
          Alert.alert('Error', result.error || 'Failed to send ping');
        }
      }
    } catch (error) {
      console.error('Error pinging bus:', error);
      Alert.alert('Error', 'Failed to send ping. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Getting your location…</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="warning" size={40} color="#F44336" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        {errorMsg.includes('quota') || errorMsg.includes('exceeded') ? (
          <Text style={styles.errorSubtext}>
            Google Maps API quota has been exceeded. Please try again later or contact support.
          </Text>
        ) : null}
        <TouchableOpacity style={styles.retryBtn} onPress={getLocation}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.fallbackBtn} 
          onPress={() => navigation.navigate('BusList')}
        >
          <Text style={styles.fallbackBtnText}>View Bus List Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Live Bus Map</Text>
          <Text style={styles.headerSubtitle}>Real-time tracking</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => setShowTest(!showTest)}
          >
            <Ionicons name="bug" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => navigation.getParent()?.openDrawer()}
          >
            <Ionicons name="menu" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {showTest ? (
        <RealtimeTest />
      ) : (
        <RealtimeBusMap
          initialRegion={initialRegion}
          onBusSelect={handleBusSelect}
          selectedBusId={selectedBusId}
          showArrivalTimes={true}
          showCapacityStatus={true}
          userLocation={location?.coords}
          onBusesLoaded={handleBusesLoaded}
          showRoutes={true}
          selectedRouteId={selectedRouteId}
          onRouteSelect={handleRouteSelect}
          showInfoBubbles={true}
          selectedRoute={selectedRoute}
        />
      )}

      {/* Action buttons */}
      <View style={styles.fabGroup}>
        {/* Route Selector */}
        <TouchableOpacity 
          style={[styles.fab, selectedRouteId && styles.fabActive]} 
          onPress={() => setShowRouteSelector(true)}
        >
          <Ionicons name="map" size={20} color={selectedRouteId ? "#fff" : "#f59e0b"} />
        </TouchableOpacity>

        {/* Refresh Location */}
        <TouchableOpacity style={styles.fab} onPress={getLocation}>
          <Ionicons name="refresh" size={20} color="#f59e0b" />
        </TouchableOpacity>
        
        {/* Set Alarm */}
        <TouchableOpacity style={styles.fab} onPress={() => setShowSetAlarmModal(true)}>
          <Ionicons name="alarm" size={20} color="#3B82F6" />
        </TouchableOpacity>
        
        {/* Clear Selection - only show when bus is selected */}
        {selectedBusId && (
          <TouchableOpacity style={styles.fab} onPress={clearSelection}>
            <Ionicons name="close" size={20} color="#f59e0b" />
          </TouchableOpacity>
        )}

        {/* Route Planner */}
        <TouchableOpacity 
          style={[styles.fab, showRouteInfoPanel && styles.fabActive]} 
          onPress={() => setShowRouteInfoPanel(!showRouteInfoPanel)}
        >
          <Ionicons name="map-outline" size={20} color={showRouteInfoPanel ? "#fff" : "#f59e0b"} />
        </TouchableOpacity>
      </View>

      {/* Route Info Panel */}
      <RouteInfoPanel
        routes={availableRoutes}
        selectedRoute={selectedRoute}
        onRouteSelect={(route) => {
          setSelectedRoute(route);
          setSelectedRouteId(route.id);
          setShowRouteInfoPanel(false);
        }}
        onClose={() => setShowRouteInfoPanel(false)}
        isVisible={showRouteInfoPanel}
      />

      {/* Info card */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoText}>
            {mapBuses.length} buses • Last update: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statusLegend}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.statusText}>Live</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.statusText}>Crowded</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.statusText}>Full</Text>
          </View>
        </View>
        
        {selectedBusId && (
          <View style={styles.selectedBusContainer}>
            <View style={styles.selectedBusInfo}>
              <Ionicons name="radio-button-on" size={18} color="#f59e0b" />
              <Text style={styles.selectedBusText}>
                Bus {mapBuses.find(bus => bus.id === selectedBusId)?.route_number || 'Unknown'} Selected
              </Text>
            </View>
            <View style={styles.busActionButtons}>
              <TouchableOpacity 
                style={styles.pingButton}
                onPress={() => setShowPingModal(true)}
              >
                <Ionicons name="notifications" size={14} color="#fff" />
                <Text style={styles.pingButtonText}>Ping</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.alarmButton}
                onPress={() => {
                  const selectedBus = mapBuses.find(bus => bus.id === selectedBusId);
                  setSelectedBusForAlarm(selectedBus);
                  setShowAlarmModal(true);
                }}
              >
                <Ionicons name="warning" size={14} color="#fff" />
                <Text style={styles.alarmButtonText}>Alarm</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.stopTrackingButton}
                onPress={stopTracking}
              >
                <Ionicons name="stop" size={14} color="#f59e0b" />
                <Text style={styles.stopTrackingText}>Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Track Bus Modal */}
      {showTrackModal && trackingBus && (
        <View style={styles.modalOverlay}>
          <View style={styles.trackModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Track Bus</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowTrackModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.busInfo}>
              <View style={styles.busIconContainer}>
                <Ionicons name="bus" size={36} color="#f59e0b" />
              </View>
              <View style={styles.busDetails}>
                <Text style={styles.busName}>{trackingBus.route_number}</Text>
                <Text style={styles.busDirection}>{trackingBus.direction}</Text>
                <View style={styles.busStatusRow}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: trackingBus.status === 'active' ? '#4CAF50' : '#FF9800' }
                  ]} />
                  <Text style={styles.busStatus}>{trackingBus.status}</Text>
                </View>
              </View>
            </View>

            <View style={styles.trackActions}>
              <TouchableOpacity 
                style={styles.trackButton}
                onPress={startTracking}
              >
                <Ionicons name="locate" size={20} color="#fff" />
                <Text style={styles.trackButtonText}>Start Tracking</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowTrackModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Route Selector Modal */}
      {showRouteSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.routeModal}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeTitle}>Select Route</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowRouteSelector(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.routeList}>
              {availableRoutes.map((route) => (
                <TouchableOpacity
                  key={route.id}
                  style={[
                    styles.routeItem,
                    selectedRouteId === route.id && styles.routeItemSelected
                  ]}
                  onPress={() => handleRouteSelect(route.id)}
                >
                  <View style={styles.routeInfo}>
                    <Text style={[
                      styles.routeName,
                      selectedRouteId === route.id && styles.routeNameSelected
                    ]}>
                      {route.name}
                    </Text>
                    <Text style={styles.routeDescription}>
                      {route.origin} → {route.destination}
                    </Text>
                    <View style={styles.routeDetails}>
                      <Text style={styles.routeDetail}>
                        <Ionicons name="time" size={14} color="#666" /> {route.estimatedDuration} min
                      </Text>
                      <Text style={styles.routeDetail}>
                        <Ionicons name="cash" size={14} color="#666" /> ₱{route.fare}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.routeColor,
                    { backgroundColor: route.color }
                  ]} />
                </TouchableOpacity>
              ))}
            </View>
            
            {selectedRouteId && (
              <TouchableOpacity
                style={styles.clearRouteButton}
                onPress={() => {
                  setSelectedRouteId(null);
                  setShowRouteSelector(false);
                }}
              >
                <Text style={styles.clearRouteText}>Clear Route Selection</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Ping Bus Modal */}
      {showPingModal && selectedBusId && (
        <View style={styles.modalOverlay}>
          <View style={styles.pingModal}>
            <View style={styles.pingModalHeader}>
              <Text style={styles.pingModalTitle}>Ping Bus</Text>
              <TouchableOpacity 
                style={styles.pingCloseButton}
                onPress={() => setShowPingModal(false)}
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pingContent}>
              <Text style={styles.pingSubtitle}>
                Send a message to Bus {mapBuses.find(bus => bus.id === selectedBusId)?.route_number || 'Unknown'}
              </Text>

              {/* Rate Limit Info */}
              <View style={styles.pingStatusBar}>
                <View style={styles.pingStatusItem}>
                  <Ionicons name="hourglass" size={16} color={pingCooldown > 0 ? '#EF4444' : '#10B981'} />
                  <Text style={[styles.pingStatusText, { color: pingCooldown > 0 ? '#EF4444' : '#10B981' }]}>
                    {pingCooldown > 0 ? `Cooldown: ${pingCooldown}s` : 'Ready'}
                  </Text>
                </View>
                <View style={styles.pingStatusItem}>
                  <Ionicons name="today" size={16} color="#6B7280" />
                  <Text style={styles.pingStatusText}>
                    {pingsRemaining}/50 left today
                  </Text>
                </View>
              </View>

              {isPingBlocked && (
                <View style={styles.blockedBanner}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <Text style={styles.blockedText}>
                    You are temporarily blocked from sending pings
                  </Text>
                </View>
              )}
              
              <View style={styles.pingTypeContainer}>
                <Text style={styles.pingLabel}>Message Type:</Text>
                <View style={styles.pingTypeButtons}>
                  <TouchableOpacity 
                    style={[styles.pingTypeButton, pingType === 'ride_request' && styles.pingTypeButtonActive]}
                    onPress={() => setPingType('ride_request')}
                  >
                    <Text style={[styles.pingTypeButtonText, pingType === 'ride_request' && styles.pingTypeButtonTextActive]}>
                      Ride Request
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.pingTypeButton, pingType === 'eta_request' && styles.pingTypeButtonActive]}
                    onPress={() => setPingType('eta_request')}
                  >
                    <Text style={[styles.pingTypeButtonText, pingType === 'eta_request' && styles.pingTypeButtonTextActive]}>
                      ETA Request
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.messageContainer}>
                <Text style={styles.pingLabel}>Message (Optional):</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="e.g., I need to catch this bus at the next stop"
                  value={pingMessage}
                  onChangeText={setPingMessage}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.pingSendButton,
                  (pingCooldown > 0 || isPingBlocked) && styles.pingSendButtonDisabled
                ]}
                onPress={pingBus}
                disabled={pingCooldown > 0 || isPingBlocked}
              >
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.pingSendButtonText}>
                  {pingCooldown > 0 ? `Wait ${pingCooldown}s` : isPingBlocked ? 'Blocked' : 'Send Ping'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Alarm Modal */}
      <AlarmModal
        visible={showAlarmModal}
        onClose={() => {
          setShowAlarmModal(false);
          setSelectedBusForAlarm(null);
        }}
        userType="passenger"
        busId={selectedBusForAlarm?.id}
      />

      {/* Set Alarm Modal */}
      <SetAlarmModal
        visible={showSetAlarmModal}
        onClose={() => setShowSetAlarmModal(false)}
        userType="passenger"
        selectedBus={selectedBusForAlarm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  map: { flex: 1 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 32,
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerCenter: { 
    flex: 1, 
    alignItems: 'center', 
    marginHorizontal: 10 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.8
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerIconButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 8, color: '#666' },
  errorText: { marginTop: 8, color: '#F44336', textAlign: 'center', paddingHorizontal: 24, fontWeight: '600' },
  errorSubtext: { marginTop: 8, color: '#6B7280', textAlign: 'center', paddingHorizontal: 24, fontSize: 14 },
  retryBtn: { marginTop: 12, backgroundColor: '#f59e0b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  fallbackBtn: { marginTop: 8, backgroundColor: '#6B7280', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  fallbackBtnText: { color: '#fff', fontWeight: '600' },

  fabGroup: { position: 'absolute', right: 24, top: 140, zIndex: 1000 },
  fab: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16, 
    shadowColor: '#f59e0b', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 20, 
    elevation: 10,
    borderWidth: 2,
    borderColor: '#f0f0f0'
  },
  fabActive: { backgroundColor: '#f59e0b', shadowColor: '#f59e0b', shadowOpacity: 0.4, borderColor: '#f59e0b' },

  infoCard: { 
    position: 'absolute', 
    left: 24, 
    right: 24, 
    bottom: 32, 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: 28, 
    padding: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 12 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 30, 
    elevation: 16,
    zIndex: 999,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.1)',
  },
  infoHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  infoText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#1a1a1a',
    flex: 1,
    letterSpacing: -0.2
  },
  refreshButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    marginLeft: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  statusLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginTop: 8
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  selectedBusContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff5e6', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 20, 
    marginTop: 12,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#ffe4b3',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  selectedBusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  selectedBusText: { 
    marginLeft: 8, 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#f59e0b',
    flex: 1,
    letterSpacing: -0.2
  },
  stopTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  stopTrackingText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.2
  },
  statusItem: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  statusText: { 
    fontSize: 13, 
    color: '#1a1a1a', 
    fontWeight: '700',
    letterSpacing: -0.1
  },
  busMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'white',
  },
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2B973A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'white',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  trackModal: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 28,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    position: 'absolute',
    top: 100,
    left: '5%',
    right: '5%',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: -0.5
  },
  closeButton: {
    padding: 4,
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  busIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: '#fff5e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#ffe4b3',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  busDetails: {
    flex: 1,
  },
  busName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 6,
    letterSpacing: -0.3
  },
  busDirection: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  busStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busStatus: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  trackActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8f9fa'
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },

  // Route Modal Styles
  routeModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    width: '90%',
    maxHeight: '70%',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  routeList: {
    maxHeight: 400,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  routeItemSelected: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  routeNameSelected: {
    color: '#3B82F6',
  },
  routeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  routeDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  routeDetail: {
    fontSize: 12,
    color: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 12,
  },
  clearRouteButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  clearRouteText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },

  // Ping Modal Styles - ENHANCED DESIGN
  pingModal: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 0,
    width: '88%',
    position: 'absolute',
    top: '50%',
    left: '6%',
    right: '6%',
    transform: [{ translateY: -250 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 20,
    borderWidth: 0,
    overflow: 'hidden'
  },
  pingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.1)',
    backgroundColor: '#fffbeb',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32
  },
  pingModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: -0.5
  },
  pingCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.1)',
  },
  pingContent: {
    padding: 24,
    paddingBottom: 28,
  },
  pingSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  pingTypeContainer: {
    marginBottom: 14,
  },
  pingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  pingTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  pingTypeButton: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pingTypeButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8
  },
  pingTypeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  pingTypeButtonTextActive: {
    color: '#fff',
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    padding: 15,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 65,
    backgroundColor: '#f9fafb',
    fontFamily: 'System',
    fontWeight: '500',
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  pingSendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 22,
    gap: 10,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 0,
  },
  pingSendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  busActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pingButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2
  },
  alarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  alarmButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2
  },
  pingSendButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.7,
    shadowOpacity: 0.2,
  },
  pingStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  pingStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pingStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    letterSpacing: -0.1,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 18,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  blockedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
}); 