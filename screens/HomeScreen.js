import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSupabase } from '../contexts/SupabaseContext';
import { useDrawer } from '../contexts/DrawerContext';

const { width } = Dimensions.get('window');

const services = [
  {
    title: 'Set an Alarm',
    icon: 'alarm',
    color: '#f59e0b',
  },
  {
    title: 'Check Bus Schedules',
    icon: 'schedule',
    color: '#f59e0b',
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Format distance for display
function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} meters`;
  }
  return `${distance.toFixed(1)} km`;
}

// Calculate estimated arrival time based on distance and bus speed
function calculateETA(distance, speed = 25) {
  const timeInHours = distance / speed;
  const timeInMinutes = Math.round(timeInHours * 60);
  
  if (timeInMinutes < 1) {
    return 'Less than 1 min';
  } else if (timeInMinutes < 60) {
    return `${timeInMinutes} mins`;
  } else {
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

export default function HomeScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [nearbyBuses, setNearbyBuses] = useState([]);
  
  // Get data from Supabase context
  const { 
    buses, 
    routes, 
    loading, 
    error, 
    connectionStatus,
    submitFeedback,
    refreshData 
  } = useSupabase();

  // Get drawer context
  const { openDrawer } = useDrawer();

  const handleServicePress = (service) => {
    if (service.title === 'Set an Alarm') {
      Alert.alert('Coming Soon', 'Alarm feature will be available in a future update!');
    } else {
      navigation.navigate('Routes');
    }
  };

  const handleBusPress = (bus) => {
    navigation.navigate('Map', { selectedBusId: bus.id });
  };

  const handleSearch = () => {
    if (search.trim() === '') return;
    navigation.getParent()?.navigate('RouteSearch', { query: search });
  };

  const handleProfilePress = () => {
    Alert.alert('Profile', 'Profile screen coming soon!');
  };

  const handleMenuPress = () => {
    openDrawer();
  };

  // Request location permission and get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation(location);
      setLocationError(null);
      console.log('📍 Location obtained:', location.coords);
    } catch (error) {
      console.error('❌ Error getting location:', error);
      setLocationError('Failed to get location');
    }
  };

  // Calculate nearby buses based on user location
  const calculateNearbyBuses = () => {
    if (!location || !buses.length) {
      setNearbyBuses([]);
      return;
    }

    const userLat = location.coords.latitude;
    const userLon = location.coords.longitude;

    const busesWithDistance = buses
      .filter(bus => bus.latitude && bus.longitude) // Only buses with valid coordinates
      .map(bus => {
        const distance = calculateDistance(
          userLat, 
          userLon, 
          bus.latitude, 
          bus.longitude
        );
        
        const route = routes.find(r => r.id === bus.route_id);
        
        return {
          id: bus.id,
          name: bus.name || `Metro Link Bus # ${bus.bus_number}`,
          distance: formatDistance(distance),
          distanceKm: distance,
          estimatedArrival: `Estimated arrival ${calculateETA(distance, bus.speed || 25)}`,
          busId: bus.id,
          currentLocation: { latitude: bus.latitude, longitude: bus.longitude },
          lastUpdated: bus.last_location_update || bus.updated_at,
          route: route ? `Route ${route.route_number}` : 'Unknown',
          status: bus.tracking_status || bus.status || 'active',
          avgFare: bus.avg_fare || 15
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm) // Sort by distance
      .slice(0, 3); // Get top 3 closest buses

    setNearbyBuses(busesWithDistance);
    console.log('🚌 Nearby buses calculated:', busesWithDistance.length);
  };

  const handleSubmitFeedback = async () => {
    if (feedback.trim() === '') {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    try {
      setSubmittingFeedback(true);
      await submitFeedback(feedback);
      Alert.alert('Success', 'Thank you for your feedback!');
      setFeedback('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      console.error('Feedback submission error:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Get location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Calculate nearby buses when location or buses change
  useEffect(() => {
    calculateNearbyBuses();
  }, [location, buses, routes]);

  // Set up location updates every 30 seconds
  useEffect(() => {
    if (!location) return;

    const interval = setInterval(() => {
      getCurrentLocation();
    }, 30000); // Update location every 30 seconds

    return () => clearInterval(interval);
  }, [location]);


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>
          {connectionStatus === 'testing' ? 'Testing database connection...' : 'Loading bus data...'}
        </Text>
        {connectionStatus === 'testing' && (
          <Text style={styles.loadingSubtext}>Checking Supabase connection</Text>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={48} color="#F44336" />
        <Text style={styles.errorText}>
          {connectionStatus === 'failed' ? 'Database Connection Failed' : 'Failed to load bus data'}
        </Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={async () => {
          try {
            await refreshData();
          } catch (error) {
            console.error('Error refreshing data:', error);
          }
        }}>
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
            <Ionicons name="menu" size={22} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.locationContainer}>
            <Ionicons 
              name={location ? "location" : "location-outline"} 
              size={14} 
              color="#fff" 
            />
            <Text style={styles.locationText}>
              {location ? "Location Active" : "Getting Location..."}
            </Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>Johnler De Asis</Text>
          </View>
          
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <Ionicons name="person-circle" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <Text style={styles.welcome}>Welcome to Metro Link</Text>

        {/* Search */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionLabel}>Search</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#aaa" style={{ marginLeft: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your bus routes"
              placeholderTextColor="#aaa"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications" size={20} color="#f59e0b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Explore Services */}
        <Text style={styles.sectionLabel}>Explore Services</Text>
        <View style={styles.servicesRow}>
          {services.map((service, idx) => (
            <Pressable
              key={idx}
              style={({ pressed }) => [
                styles.serviceCard,
                pressed && styles.cardPressed,
              ]}
              android_ripple={{ color: '#e0e0e0' }}
              onPress={() => handleServicePress(service)}
            >
              <MaterialIcons name={service.icon} size={32} color={service.color} />
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={16} color={service.color} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Nearby Buses */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            Nearby Buses {location && `(${nearbyBuses.length})`}
          </Text>
          {location && (
            <TouchableOpacity style={styles.refreshButton} onPress={getCurrentLocation}>
              <Ionicons name="refresh" size={16} color="#f59e0b" />
            </TouchableOpacity>
          )}
        </View>
        
        {!location ? (
          <View style={styles.locationPromptContainer}>
            <Ionicons name="location-outline" size={48} color="#f59e0b" />
            <Text style={styles.locationPromptText}>Enable location to see nearby buses</Text>
            <TouchableOpacity style={styles.enableLocationButton} onPress={getCurrentLocation}>
              <Text style={styles.enableLocationButtonText}>Enable Location</Text>
            </TouchableOpacity>
          </View>
        ) : nearbyBuses.length > 0 ? (
          <View style={styles.busesContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.busesScrollContainer}
              decelerationRate="fast"
              snapToInterval={296} // 280 + 16 margin
              snapToAlignment="start"
            >
              {nearbyBuses.map((bus, index) => (
                <Pressable
                  key={bus.id}
                  style={({ pressed }) => [
                    styles.busCard,
                    pressed && styles.cardPressed,
                  ]}
                  android_ripple={{ color: '#e0e0e0' }}
                  onPress={() => handleBusPress(bus)}
                >
                {/* Bus Header with Route Badge */}
                <View style={styles.busHeader}>
                  <View style={styles.busNumberContainer}>
                    <Ionicons name="bus" size={16} color="#f59e0b" />
                    <Text style={styles.busNumber}>{bus.name.split('# ')[1]}</Text>
                  </View>
                  <View style={styles.routeBadge}>
                    <Text style={styles.routeBadgeText}>{bus.route}</Text>
                  </View>
                </View>

                {/* Enhanced Map Container */}
                <View style={styles.busMapContainer}>
                  <View style={styles.mapGradient}>
                    <Ionicons name="map" size={32} color="#fff" />
                    <View style={styles.busLocationPin}>
                      <Ionicons name="location" size={16} color="#fff" />
                    </View>
                    <View style={styles.distanceOverlay}>
                      <Text style={styles.distanceText}>{bus.distance}</Text>
                    </View>
                  </View>
                </View>

                {/* Bus Information */}
                <View style={styles.busInfo}>
                  <View style={styles.etaContainer}>
                    <Ionicons name="time" size={14} color="#666" />
                    <Text style={styles.etaText}>{bus.estimatedArrival}</Text>
                  </View>
                  
                  <View style={styles.busStatusContainer}>
                    <View style={[
                      styles.busStatusIndicator, 
                      { backgroundColor: bus.status === 'active' ? '#4CAF50' : '#FF9800' }
                    ]}>
                      <Ionicons 
                        name={bus.status === 'active' ? 'play' : 'pause'} 
                        size={8} 
                        color="#fff" 
                      />
                    </View>
                    <Text style={styles.busStatus}>{bus.status}</Text>
                    <View style={styles.speedContainer}>
                      <Ionicons name="card" size={12} color="#999" />
                      <Text style={styles.speedText}>₱{bus.avgFare} avg</Text>
                    </View>
                  </View>

                  {bus.lastUpdated && (
                    <View style={styles.lastUpdatedContainer}>
                      <Ionicons name="refresh" size={10} color="#999" />
                      <Text style={styles.lastUpdated}>
                        {new Date(bus.lastUpdated).toLocaleTimeString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Arrow */}
                <View style={styles.actionArrow}>
                  <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
                </View>
              </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.noBusesContainer}>
            <Ionicons name="bus" size={48} color="#ccc" />
            <Text style={styles.noBusesText}>No buses found nearby</Text>
            <Text style={styles.noBusesSubtext}>Try refreshing or check back later</Text>
          </View>
        )}

        {/* Review and Feedback */}
        <View style={styles.feedbackSection}>
          <Text style={styles.sectionLabel}>Review and Feedback</Text>
          <Text style={styles.feedbackDescription}>
            Tell us about your Metro Link experience and share any ideas you have to help enhance your travel experience.
          </Text>
          <View style={styles.feedbackContainer}>
            <View style={styles.feedbackInputContainer}>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Submit your feedback here..."
                placeholderTextColor="#aaa"
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                editable={!submittingFeedback}
              />
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>{feedback.length}/500</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.submitButton, submittingFeedback && styles.submitButtonDisabled]} 
              onPress={handleSubmitFeedback}
              disabled={submittingFeedback}
            >
              {submittingFeedback ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noBusesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noBusesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  noBusesSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  locationPromptContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 25,
  },
  locationPromptText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  enableLocationButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enableLocationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContainer: {
    backgroundColor: '#f59e0b',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flex: 1,
    marginHorizontal: 16,
    justifyContent: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 6,
    fontFamily: 'System',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  userInfo: {
    alignItems: 'flex-end',
    flex: 1,
  },
  greeting: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontFamily: 'System',
    fontWeight: '400',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  welcome: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 32,
    marginBottom: 32,
    color: '#1a1a1a',
    fontFamily: 'System',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  searchSection: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'System',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f9f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    paddingHorizontal: 20,
    color: '#1a1a1a',
    fontFamily: 'System',
    fontWeight: '400',
  },
  notificationButton: {
    width: 48,
    height: 48,
    marginRight: 12,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    gap: 20,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    padding: 28,
    marginRight: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  arrowContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  busesContainer: {
    marginBottom: 40,
  },
  busesScrollContainer: {
    paddingRight: 24,
    paddingLeft: 0,
  },
  busCard: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginRight: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  busNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f59e0b',
    marginLeft: 8,
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  routeBadge: {
    backgroundColor: '#f0f9f0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  routeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f59e0b',
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  busMapContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  mapGradient: {
    flex: 1,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  busLocationPin: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  distanceOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  busInfo: {
    flex: 1,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  etaText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
    fontWeight: '500',
    fontFamily: 'System',
  },
  busStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  busStatusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  busStatus: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'System',
    textTransform: 'capitalize',
    flex: 1,
  },
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedText: {
    fontSize: 10,
    color: '#999',
    marginLeft: 4,
    fontFamily: 'System',
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'System',
    marginLeft: 4,
  },
  actionArrow: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f9f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackSection: {
    marginBottom: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  feedbackDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: 'System',
    fontWeight: '500',
  },
  feedbackContainer: {
    marginBottom: 20,
  },
  feedbackInputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  feedbackInput: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    padding: 20,
    fontSize: 15,
    color: '#1a1a1a',
    fontFamily: 'System',
    minHeight: 140,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    fontWeight: '500',
  },
  characterCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'System',
  },
  submitButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginLeft: 8,
  },
}); 