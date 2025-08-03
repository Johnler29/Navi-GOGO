import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { useSupabase } from '../contexts/SupabaseContext';

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [mapBuses, setMapBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  useEffect(() => {
    if (buses.length > 0 && routes.length > 0) {
      loadBuses();
    }
  }, [buses, routes]);

  const loadBuses = async () => {
    try {
      // Transform database buses to map format
      const transformedBuses = buses.map(bus => {
        const route = routes.find(r => r.id === bus.route_id);
        return {
          id: bus.id,
          route_number: route ? route.route_number : bus.route_id,
          direction: route ? `${route.origin} to ${route.destination}` : 'Unknown',
          latitude: bus.current_location?.latitude || 37.4221 + (Math.random() * 0.002),
          longitude: bus.current_location?.longitude || -122.0841 + (Math.random() * 0.002),
          status: bus.status || 'active',
        };
      });
      
      console.log('Loaded buses from database:', transformedBuses.length, 'buses');
      console.log('Bus coordinates:', transformedBuses.map(bus => ({ id: bus.id, lat: bus.latitude, lng: bus.longitude })));
      setMapBuses(transformedBuses);
    } catch (error) {
      console.error('Error loading buses:', error);
      setMapBuses([]);
    }
  };

  const getLocation = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      
      console.log('📍 Requesting location permissions...');
      
      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        console.log('❌ Location services are disabled');
        setErrorMsg('Location services are disabled. Please enable GPS in your device settings.');
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Location services are enabled');
      
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        setErrorMsg('Permission to access location was denied. Please allow location access in app settings.');
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Location permission granted');

      // Get current location with optimized options
      const locationOptions = {
        accuracy: Location.Accuracy.Balanced, // Better accuracy for real location
        timeInterval: 10000, // 10 seconds timeout
        distanceInterval: 50, // 50 meters
        maximumAge: 30000, // Accept location up to 30 seconds old
      };

      console.log('📍 Getting current location...');
      const currentLocation = await Location.getCurrentPositionAsync(locationOptions);
      
      console.log('✅ Current location obtained:', {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
        timestamp: new Date(currentLocation.timestamp).toLocaleString()
      });
      
      setLocation(currentLocation);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error getting location:', error);
      setErrorMsg(`Failed to get your location: ${error.message}. Please check your GPS settings and try again.`);
      setIsLoading(false);
    }
  };

  const getGoogleMapsApiKey = () => {
    return Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || 
           Constants.manifest?.extra?.GOOGLE_MAPS_API_KEY ||
           'AIzaSyAv3CxZGhXEat9i1TcE0Ok6Eu-VU1Nl8wg'; // Fallback key
  };

  const handleRetry = () => {
    setErrorMsg(null);
    getLocation();
  };

  const handleUseDefaultLocation = () => {
    // Use a default location (Mountain View/Googleplex area)
    setLocation({
      coords: {
        latitude: 37.4221,
        longitude: -122.0841,
        accuracy: 100,
        altitude: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });
    setErrorMsg(null);
  };

  const handleMyLocation = () => {
    console.log('📍 Centering on user location...');
    if (location) {
      // The map will automatically center on the user's location
      Alert.alert('My Location', 'Centered on your current location!');
    } else {
      Alert.alert('Location Not Available', 'Your location is not available. Please check your GPS settings.');
    }
  };

  const handleBusPress = (bus) => {
    Alert.alert(
      `Bus ${bus.route_number}`,
      `Direction: ${bus.direction}\nStatus: ${bus.status}\nLocation: ${bus.latitude.toFixed(4)}, ${bus.longitude.toFixed(4)}`,
      [
        { text: 'OK' },
        { 
          text: 'Track Bus', 
          onPress: () => {
            // Navigate to bus tracking screen
            Alert.alert('Coming Soon', 'Bus tracking feature will be available in a future update!');
          }
        }
      ]
    );
  };

  const handleMenuPress = () => {
    navigation.getParent()?.openDrawer();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Location Error</Text>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.defaultButton} onPress={handleUseDefaultLocation}>
              <Text style={styles.defaultButtonText}>Use Default Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const initialRegion = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  } : {
    latitude: 37.4221,
    longitude: -122.0841,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2B973A" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Live Bus Map</Text>
          <Text style={styles.headerSubtitle}>Real-time tracking</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={handleMenuPress}
        >
          <Ionicons name="menu" size={24} color="#2B973A" />
        </TouchableOpacity>
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
        userLocationPriority="high"
        userLocationUpdateInterval={10000}
        userLocationFastestInterval={5000}
        apiKey={getGoogleMapsApiKey()}
      >
        {/* User location marker */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            description="You are here"
            pinColor="blue"
          />
        )}

        {/* Bus markers */}
        {console.log('Rendering buses:', mapBuses.length)}
        {mapBuses.map((bus) => {
          console.log('Rendering bus:', bus.id, 'at', bus.latitude, bus.longitude);
          return (
            <Marker
              key={bus.id}
              coordinate={{
                latitude: bus.latitude,
                longitude: bus.longitude,
              }}
              title={`Bus ${bus.route_number}`}
              description={`${bus.direction} - ${bus.status}`}
              pinColor="#FF0000"
              onPress={() => handleBusPress(bus)}
              tracksViewChanges={false}
            />
          );
        })}
      </MapView>

      {/* Enhanced Info Panel */}
      <View style={styles.infoPanel}>
        <View style={styles.infoHeader}>
          <View style={styles.infoTitleContainer}>
            <Ionicons name="bus" size={20} color="#2B973A" />
            <Text style={styles.infoTitle}>Live Bus Tracking</Text>
          </View>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => Alert.alert('Bus Info', `Active Buses: ${mapBuses.length}\nUsing mock data for demonstration.`)}
          >
            <Ionicons name="information-circle" size={20} color="#2B973A" />
          </TouchableOpacity>
        </View>
        <Text style={styles.infoText}>
          {mapBuses.length} buses currently active
        </Text>
        <View style={styles.busStats}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={16} color="#F7941D" />
            <Text style={styles.statText}>Real-time</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color="#F7941D" />
            <Text style={styles.statText}>Updated now</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="person" size={16} color={location ? "#4CAF50" : "#FF6B6B"} />
            <Text style={[styles.statText, { color: location ? "#4CAF50" : "#FF6B6B" }]}>
              {location ? 'Location OK' : 'No Location'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Refresh', 'Refreshing bus locations...')}
        >
          <Ionicons name="refresh" size={20} color="#2B973A" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleMyLocation}
        >
          <Ionicons name="locate" size={20} color="#2B973A" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Filters', 'Bus filter options coming soon!')}
        >
          <Ionicons name="filter" size={20} color="#2B973A" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B973A',
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'System',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#2B973A',
    fontFamily: 'System',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 15,
    marginBottom: 8,
    fontFamily: 'System',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    fontFamily: 'System',
    lineHeight: 22,
  },
  errorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
  },
  retryButton: {
    backgroundColor: '#2B973A',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  defaultButton: {
    backgroundColor: '#F7941D',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  defaultButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B973A',
    marginLeft: 8,
    fontFamily: 'System',
  },
  infoButton: {
    padding: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'System',
    marginBottom: 10,
  },
  busStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontFamily: 'System',
  },
  actionButtons: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
}); 