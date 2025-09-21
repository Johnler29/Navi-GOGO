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
import { getLocationStatus, getCapacityStatus, formatDistance, formatTime } from '../utils/locationUtils';

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
  // Always use real-time mode - no manual mode needed
  const [arrivalTimes, setArrivalTimes] = useState({});
  
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

    // Start high-accuracy continuous location updates
    let subscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 2000, // ms
          distanceInterval: 2, // meters
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
      
      // Transform database buses to map format
      const transformedBuses = buses.map(bus => {
        const route = routes.find(r => r.id === bus.route_id);
        console.log('🚌 Processing bus:', bus.bus_number, 'Route:', route?.route_number);
        console.log('🚌 Bus coordinates:', bus.latitude, bus.longitude);
        
        // Get coordinates directly from the buses table
        let lat = bus.latitude;
        let lng = bus.longitude;
        
        // Fallback: if no coords, use sample coordinates or user location
        if (!lat || !lng) {
          console.log('🚌 No coordinates for bus, using fallback location');
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
        const isValid = typeof b.latitude === 'number' && typeof b.longitude === 'number';
        console.log('🚌 Bus filter check:', b.bus_number, 'Valid:', isValid, 'Coords:', b.latitude, b.longitude);
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
    console.log('🚌 Bus ID for selection:', bus.bus_id || bus.id);
    setSelectedBusId(bus.bus_id || bus.id);
  };

  const handleBusesLoaded = (loadedBuses) => {
    console.log('🚌 MapScreen - Buses loaded from RealtimeBusMap:', loadedBuses.length);
    setMapBuses(loadedBuses);
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

  const pingBus = async () => {
    if (!selectedBusId) {
      Alert.alert('Error', 'Please select a bus first');
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
          `Your message has been sent to Bus ${selectedBus.route_number}. The driver will be notified.`,
          [{ text: 'OK', onPress: () => setShowPingModal(false) }]
        );
        setPingMessage('');
      } else {
        Alert.alert('Error', result.error || 'Failed to send ping');
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
        <TouchableOpacity style={styles.retryBtn} onPress={getLocation}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#f59e0b" />
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
            <Ionicons name="bug" size={20} color="#f59e0b" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => navigation.getParent()?.openDrawer()}
          >
            <Ionicons name="menu" size={20} color="#f59e0b" />
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
        />
      )}

      {/* Action buttons */}
      <View style={styles.fabGroup}>
        {/* Refresh Location */}
        <TouchableOpacity style={styles.fab} onPress={getLocation}>
          <Ionicons name="refresh" size={20} color="#f59e0b" />
        </TouchableOpacity>
        
        {/* Clear Selection - only show when bus is selected */}
        {selectedBusId && (
          <TouchableOpacity style={styles.fab} onPress={clearSelection}>
            <Ionicons name="close" size={20} color="#f59e0b" />
          </TouchableOpacity>
        )}
      </View>

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
              <Ionicons name="radio-button-on" size={16} color="#FF6B6B" />
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
                style={styles.stopTrackingButton}
                onPress={stopTracking}
              >
                <Ionicons name="stop" size={14} color="#FF6B6B" />
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
                <Ionicons name="bus" size={32} color="#2B973A" />
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
                style={styles.pingSendButton}
                onPress={pingBus}
              >
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.pingSendButtonText}>Send Ping</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffbeb' },
  map: { flex: 1 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#f8f9fa', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerCenter: { 
    flex: 1, 
    alignItems: 'center', 
    marginHorizontal: 10 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '600', 
    color: '#f59e0b',
    marginBottom: 4
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: '#666' 
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
    backgroundColor: '#f8f9fa', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 8, color: '#666' },
  errorText: { marginTop: 8, color: '#F44336', textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: { marginTop: 12, backgroundColor: '#f59e0b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '600' },

  fabGroup: { position: 'absolute', right: 24, top: 120, zIndex: 1000 },
  fab: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 4 
  },
  fabActive: { backgroundColor: '#f59e0b', shadowColor: '#f59e0b', shadowOpacity: 0.3 },

  infoCard: { 
    position: 'absolute', 
    left: 24, 
    right: 24, 
    bottom: 32, 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    elevation: 6,
    zIndex: 999,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  infoText: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#333',
    flex: 1
  },
  refreshButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  statusLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  selectedBusContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff5f5', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginBottom: 12,
    justifyContent: 'space-between'
  },
  selectedBusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  selectedBusText: { 
    marginLeft: 8, 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#FF6B6B',
    flex: 1
  },
  stopTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  stopTrackingText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  statusItem: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  statusText: { 
    fontSize: 14, 
    color: '#333', 
    fontWeight: '500' 
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
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    position: 'absolute',
    top: 100,
    left: '5%',
    right: '5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f59e0b',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f9f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  busDetails: {
    flex: 1,
  },
  busName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 4,
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 12,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },

  // Ping Modal Styles
  pingModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    width: '80%',
    maxHeight: '40%',
    position: 'absolute',
    top: '45%',
    left: '10%',
    right: '10%',
    transform: [{ translateY: -100 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 12,
  },
  pingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pingModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  pingCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingContent: {
    padding: 14,
  },
  pingSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  pingTypeContainer: {
    marginBottom: 12,
  },
  pingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pingTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pingTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingTypeButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
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
    marginBottom: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 45,
    backgroundColor: '#f8f9fa',
    fontFamily: 'System',
  },
  pingSendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  pingSendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  busActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  pingButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
}); 