import React, { useState } from 'react';
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
import { useSupabase } from '../contexts/SupabaseContext';

const { width } = Dimensions.get('window');

const services = [
  {
    title: 'Set an Alarm',
    icon: 'alarm',
    color: '#2B973A',
  },
  {
    title: 'Check Bus Schedules',
    icon: 'schedule',
    color: '#2B973A',
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  
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
    navigation.getParent()?.openDrawer();
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

  // Get nearby buses (first 2 buses from the database)
  const nearbyBuses = buses.slice(0, 2).map(bus => ({
    id: bus.id,
    name: bus.name || `Metro Link Bus # ${bus.bus_number || bus.id}`,
    distance: bus.distance || '500 meters',
    estimatedArrival: bus.estimated_arrival || 'Estimated arrival 5 mins',
    busId: bus.id,
    currentLocation: bus.current_location,
    lastUpdated: bus.last_updated
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2B973A" />
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
        <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
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
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#fff" />
            <Text style={styles.locationText}>Dasmarinas</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>Johnler De Asis</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <Ionicons name="person-circle" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Welcome */}
        <Text style={styles.welcome}>Welcome to Metro NaviGo</Text>

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
              <Ionicons name="notifications" size={20} color="#2B973A" />
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
        <Text style={styles.sectionLabel}>Nearby Buses</Text>
        {nearbyBuses.length > 0 ? (
          <View style={styles.busesRow}>
            {nearbyBuses.map((bus) => (
              <Pressable
                key={bus.id}
                style={({ pressed }) => [
                  styles.busCard,
                  pressed && styles.cardPressed,
                ]}
                android_ripple={{ color: '#e0e0e0' }}
                onPress={() => handleBusPress(bus)}
              >
                <View style={styles.busMapContainer}>
                  <View style={styles.mapPlaceholder}>
                    <Ionicons name="map" size={24} color="#ccc" />
                  </View>
                  <Ionicons name="location" size={20} color="#F44336" style={styles.busPin} />
                </View>
                <View style={styles.busInfo}>
                  <Text style={styles.busName}>{bus.name}</Text>
                  <Text style={styles.busDistance}>{bus.distance}</Text>
                  <Text style={styles.busArrival}>{bus.estimatedArrival}</Text>
                  {bus.lastUpdated && (
                    <Text style={styles.lastUpdated}>
                      Last updated: {new Date(bus.lastUpdated).toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.noBusesContainer}>
            <Ionicons name="bus" size={48} color="#ccc" />
            <Text style={styles.noBusesText}>No buses available at the moment</Text>
          </View>
        )}

        {/* Review and Feedback */}
        <Text style={styles.sectionLabel}>Review and Feedback</Text>
        <Text style={styles.feedbackDescription}>
          Tell us about your Metro NaviGo experience and share any ideas you have to help enhance your travel experience.
        </Text>
        <View style={styles.feedbackContainer}>
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
          <TouchableOpacity 
            style={[styles.submitButton, submittingFeedback && styles.submitButtonDisabled]} 
            onPress={handleSubmitFeedback}
            disabled={submittingFeedback}
          >
            {submittingFeedback ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
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
    backgroundColor: '#2B973A',
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
  menuButton: {
    padding: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
    fontFamily: 'System',
    fontWeight: '500',
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  greeting: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '400',
    marginBottom: 2,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  profileButton: {
    padding: 4,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    color: '#000',
    fontFamily: 'System',
  },
  searchSection: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
    fontFamily: 'System',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    paddingHorizontal: 12,
    color: '#000',
    fontFamily: 'System',
  },
  notificationButton: {
    padding: 12,
    marginRight: 8,
  },
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    padding: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  arrowContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  busesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  busCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  busMapContainer: {
    position: 'relative',
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  busPin: {
    position: 'absolute',
    left: 8,
    top: 8,
  },
  busInfo: {
    flex: 1,
  },
  busName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
    fontFamily: 'System',
  },
  busDistance: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'System',
  },
  busArrival: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'System',
  },
  lastUpdated: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'System',
    marginTop: 2,
  },
  feedbackDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
    fontFamily: 'System',
  },
  feedbackContainer: {
    marginBottom: 20,
  },
  feedbackInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 15,
    fontSize: 14,
    color: '#000',
    fontFamily: 'System',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#2B973A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    alignSelf: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
}); 