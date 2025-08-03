import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

export default function DriverMapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isOnRoute, setIsOnRoute] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLocation();
  }, []);

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
      
      // Mock route coordinates - in a real app, this would come from your route API
      const mockRoute = [
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        {
          latitude: currentLocation.coords.latitude + 0.002,
          longitude: currentLocation.coords.longitude + 0.002,
        },
        {
          latitude: currentLocation.coords.latitude + 0.004,
          longitude: currentLocation.coords.longitude + 0.004,
        },
        {
          latitude: currentLocation.coords.longitude + 0.006,
          longitude: currentLocation.coords.longitude + 0.006,
        },
      ];
      setRouteCoordinates(mockRoute);
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
    // Use a default location (New York City)
    setLocation({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 100,
        altitude: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });
    setErrorMsg(null);
  };

  const handleRouteDeviation = () => {
    Alert.alert(
      'Route Deviation',
      'You are currently off your assigned route. Would you like to recalculate?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Recalculate', onPress: () => Alert.alert('Recalculating', 'Route is being recalculated...') }
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
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : {
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Route Navigation</Text>
          <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
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

        {/* Route polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2B973A"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}

        {/* Route markers */}
        {routeCoordinates.map((coord, index) => (
          <Marker
            key={index}
            coordinate={coord}
            title={`Route Point ${index + 1}`}
            description="Route waypoint"
            pinColor={index === 0 ? "green" : index === routeCoordinates.length - 1 ? "red" : "orange"}
          />
        ))}
      </MapView>

      {/* Route Info Panel */}
      <View style={styles.routePanel}>
        <View style={styles.routeHeader}>
          <Text style={styles.routeTitle}>Route 101</Text>
          <View style={[styles.statusBadge, { backgroundColor: isOnRoute ? '#4CAF50' : '#FF6B6B' }]}>
            <Text style={styles.statusBadgeText}>
              {isOnRoute ? 'On Route' : 'Off Route'}
            </Text>
          </View>
        </View>
        
        <View style={styles.routeDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={16} color="#666" />
              <Text style={styles.detailText}>ETA: 15 min</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer" size={16} color="#666" />
              <Text style={styles.detailText}>25 km/h</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="people" size={16} color="#666" />
              <Text style={styles.detailText}>32 passengers</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.detailText}>Next: Central Station</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleRouteDeviation}>
            <Ionicons name="refresh" size={20} color="#2B973A" />
            <Text style={styles.actionButtonText}>Recalculate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="information-circle" size={20} color="#2B973A" />
            <Text style={styles.actionButtonText}>Route Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#2B973A',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  menuButton: {
    padding: 8,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    fontSize: 20,
    color: '#333',
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 10,
    marginBottom: 5,
    fontFamily: 'System',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'System',
  },
  errorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  defaultButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  defaultButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  routePanel: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'System',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'System',
  },
  routeDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontFamily: 'System',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#2B973A',
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'System',
  },
}); 