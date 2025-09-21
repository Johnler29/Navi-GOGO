import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RouteScreen({ navigation }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  // Mock route data
  const mockRoutes = [
    {
      id: '1',
      routeNumber: 'Route 101',
      origin: 'Airport',
      destination: 'Downtown',
      stops: [
        { name: 'Airport Terminal', time: '00:00' },
        { name: 'Central Station', time: '00:15' },
        { name: 'City Hall', time: '00:25' },
        { name: 'Downtown Mall', time: '00:35' },
        { name: 'Downtown Terminal', time: '00:45' },
      ],
      frequency: 'Every 15 minutes',
      duration: '45 minutes',
      fare: '$2.50',
      status: 'active',
    },
    {
      id: '2',
      routeNumber: 'Route 102',
      origin: 'Mall',
      destination: 'University',
      stops: [
        { name: 'Shopping Mall', time: '00:00' },
        { name: 'Library', time: '00:10' },
        { name: 'Hospital', time: '00:20' },
        { name: 'University Campus', time: '00:30' },
      ],
      frequency: 'Every 20 minutes',
      duration: '30 minutes',
      fare: '$2.00',
      status: 'active',
    },
    {
      id: '3',
      routeNumber: 'Route 103',
      origin: 'Station',
      destination: 'Hospital',
      stops: [
        { name: 'Central Station', time: '00:00' },
        { name: 'City Park', time: '00:12' },
        { name: 'Medical Center', time: '00:25' },
        { name: 'General Hospital', time: '00:35' },
      ],
      frequency: 'Every 25 minutes',
      duration: '35 minutes',
      fare: '$2.25',
      status: 'active',
    },
  ];

  const popularDestinations = [
    'Airport', 'Downtown', 'University', 'Hospital', 'Mall', 'Station', 'Beach', 'Park'
  ];

  useEffect(() => {
    if (origin && destination) {
      searchRoutes();
    } else {
      setSearchResults([]);
    }
  }, [origin, destination]);

  const searchRoutes = () => {
    const results = mockRoutes.filter(route => 
      route.origin.toLowerCase().includes(origin.toLowerCase()) ||
      route.destination.toLowerCase().includes(destination.toLowerCase()) ||
      route.stops.some(stop => 
        stop.name.toLowerCase().includes(origin.toLowerCase()) ||
        stop.name.toLowerCase().includes(destination.toLowerCase())
      )
    );
    setSearchResults(results);
  };

  const handleRoutePress = (route) => {
    setSelectedRoute(route);
  };

  const handleTrackRoute = (route) => {
    Alert.alert(
      'Track Route',
      `Would you like to track ${route.routeNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Track', 
          onPress: () => navigation.navigate('Map', { selectedRoute: route })
        }
      ]
    );
  };

  const handleQuickSelect = (location) => {
    if (!origin) {
      setOrigin(location);
    } else if (!destination) {
      setDestination(location);
    } else {
      setOrigin(location);
      setDestination('');
    }
  };

  const clearSearch = () => {
    setOrigin('');
    setDestination('');
    setSearchResults([]);
    setSelectedRoute(null);
  };

  const renderRouteCard = (route) => (
    <TouchableOpacity
      key={route.id}
      style={styles.routeCard}
      onPress={() => handleRoutePress(route)}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeNumber}>{route.routeNumber}</Text>
          <Text style={styles.routeDirection}>{route.origin} → {route.destination}</Text>
        </View>
        <View style={styles.routeStatus}>
          <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>

      <View style={styles.routeDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.detailText}>{route.duration}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="repeat" size={16} color="#666" />
            <Text style={styles.detailText}>{route.frequency}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="card" size={16} color="#666" />
            <Text style={styles.detailText}>{route.fare}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="bus" size={16} color="#666" />
            <Text style={styles.detailText}>{route.stops.length} stops</Text>
          </View>
        </View>
      </View>

      <View style={styles.routeStops}>
        <Text style={styles.stopsTitle}>Stops:</Text>
        {route.stops.slice(0, 3).map((stop, index) => (
          <Text key={index} style={styles.stopText}>
            • {stop.name} ({stop.time})
          </Text>
        ))}
        {route.stops.length > 3 && (
          <Text style={styles.moreStops}>+{route.stops.length - 3} more stops</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.trackButton}
        onPress={() => handleTrackRoute(route)}
      >
        <Ionicons name="location" size={16} color="#fff" />
        <Text style={styles.trackButtonText}>Track Route</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find Routes</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Search Routes</Text>
          <View style={styles.searchInputs}>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="From"
                value={origin}
                onChangeText={setOrigin}
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="To"
                value={destination}
                onChangeText={setDestination}
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Popular Destinations */}
        <View style={styles.popularSection}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <View style={styles.popularGrid}>
            {popularDestinations.map((dest, index) => (
              <TouchableOpacity
                key={index}
                style={styles.popularButton}
                onPress={() => handleQuickSelect(dest)}
              >
                <Text style={styles.popularButtonText}>{dest}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>
              Found {searchResults.length} route{searchResults.length > 1 ? 's' : ''}
            </Text>
            {searchResults.map(renderRouteCard)}
          </View>
        )}

        {/* All Routes */}
        {searchResults.length === 0 && origin && destination && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>No routes found</Text>
            <Text style={styles.noResultsText}>
              Try different locations or check spelling
            </Text>
          </View>
        )}

        {/* Default Routes */}
        {!origin && !destination && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Available Routes</Text>
            {mockRoutes.map(renderRouteCard)}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home" size={24} color="#666" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('BusList')}>
          <Ionicons name="list" size={24} color="#666" />
          <Text style={styles.navText}>Routes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Map')}>
          <Ionicons name="map" size={24} color="#666" />
          <Text style={styles.navText}>Map</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={24} color="#666" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
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
    backgroundColor: '#f59e0b',
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clearButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchSection: {
    marginTop: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    fontFamily: 'System',
  },
  searchInputs: {
    gap: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
    fontFamily: 'System',
  },
  popularSection: {
    marginBottom: 25,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  popularButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  popularButtonText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'System',
  },
  resultsSection: {
    marginBottom: 25,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'System',
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
    fontFamily: 'System',
  },
  routeDirection: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'System',
  },
  routeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
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
  routeStops: {
    marginBottom: 15,
  },
  stopsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    fontFamily: 'System',
  },
  stopText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'System',
  },
  moreStops: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  trackButton: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'System',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'System',
  },
}); 